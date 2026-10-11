import { RESPONSES } from '@config/constants';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceError } from '@utils/service.error';
import OpenAI, { APIError } from 'openai';
import { EMBEDDING_DIMENSIONS } from './vector';

export type ChatTurn = {
    role: 'user' | 'assistant';
    content: string;
};

@Injectable()
export class OpenaiService {
    private client: OpenAI | null = null;

    constructor(private readonly configService: ConfigService) {}

    async embed(inputs: string[]): Promise<number[][]> {
        const client = this.getClient();
        const model = this.configService.get<string>('openai.embeddingModel') || 'text-embedding-3-small';
        const vectors: number[][] = [];

        try {
            for (let offset = 0; offset < inputs.length; offset += 64) {
                const batch = inputs.slice(offset, offset + 64);
                const response = await client.embeddings.create({
                    model,
                    input: batch,
                    ...(model.startsWith('text-embedding-3') ? { dimensions: EMBEDDING_DIMENSIONS } : {}),
                });
                const ordered = [...response.data].sort((left, right) => left.index - right.index);
                vectors.push(...ordered.map((item) => item.embedding));
            }
        } catch (error) {
            this.throwOpenaiError(error);
        }

        if (vectors.length !== inputs.length || vectors.some((vector) => vector.length !== EMBEDDING_DIMENSIONS)) {
            throw new ServiceError(RESPONSES.OPENAI_ERROR);
        }

        return vectors;
    }

    async answer(question: string, context: string, history: ChatTurn[]): Promise<string> {
        const client = this.getClient();
        const model = this.configService.get<string>('openai.chatModel') || 'gpt-4o-mini';

        try {
            const completion = await client.chat.completions.create({
                model,
                temperature: 0.2,
                max_completion_tokens: 700,
                messages: [
                    {
                        role: 'system',
                        content: [
                            'Respondé preguntas usando solamente el contexto de los PDF.',
                            'Si el contexto no alcanza, decí que el documento no contiene esa información.',
                            'No inventes datos ni cites páginas que no aparezcan en el contexto.',
                            'Respondé en el mismo idioma de la pregunta, de forma clara y breve.',
                            'Cuando uses un dato, mencioná el documento y la página.',
                            '',
                            'Contexto:',
                            context,
                        ].join('\n'),
                    },
                    ...history.map((turn) => ({ role: turn.role, content: turn.content })),
                    { role: 'user', content: question },
                ],
            });

            const answer = completion.choices[0]?.message?.content?.trim();
            if (!answer) {
                throw new ServiceError(RESPONSES.OPENAI_ERROR);
            }

            return answer;
        } catch (error) {
            if (error instanceof ServiceError) {
                throw error;
            }
            this.throwOpenaiError(error);
        }
    }

    private getClient(): OpenAI {
        const apiKey = this.configService.get<string>('openai.apiKey');
        if (!apiKey) {
            throw new ServiceError(RESPONSES.OPENAI_NOT_CONFIGURED);
        }

        if (!this.client) {
            this.client = new OpenAI({ apiKey });
        }

        return this.client;
    }

    private throwOpenaiError(error: unknown): never {
        if (error instanceof APIError) {
            throw new ServiceError({
                statusCode: 502,
                message: {
                    es: `OpenAI rechazó la solicitud: ${error.message}`,
                    en: `OpenAI rejected the request: ${error.message}`,
                },
            });
        }

        throw new ServiceError(RESPONSES.OPENAI_ERROR);
    }
}
