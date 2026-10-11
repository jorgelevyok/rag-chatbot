import { Document } from '@datasources/rag_chatbot/entities/document.entity';
import { RESPONSES } from '@config/constants';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { ServiceError } from '@utils/service.error';
import { DataSource, Repository } from 'typeorm';
import { AskQuestionBodyDTO } from './dto/chat.dto';
import { OpenaiService } from '../openai/openai.service';
import { toVectorLiteral } from '../openai/vector';

const TOP_K = 5;

type ChunkRow = {
    chunk_content: string;
    chunk_page: number | null;
    document_id_public: string;
    document_name: string;
};

export type ChatSource = {
    document_id_public: string;
    document_name: string;
    page: number | null;
    excerpt: string;
};

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Document, 'RAG_CHATBOT')
        private readonly documentsRepository: Repository<Document>,
        @InjectDataSource('RAG_CHATBOT')
        private readonly dataSource: DataSource,
        private readonly openaiService: OpenaiService,
    ) {}

    async ask(body: AskQuestionBodyDTO): Promise<{ answer: string; sources: ChatSource[] }> {
        const question = body.question.trim();
        if (!question) {
            throw new ServiceError(RESPONSES.BAD_REQUEST);
        }

        if (body.document_id_public) {
            const document = await this.documentsRepository.findOne({
                where: { document_id_public: body.document_id_public },
            });
            if (!document) {
                throw new ServiceError(RESPONSES.DOCUMENT_NOT_FOUND);
            }
        } else {
            const total = await this.documentsRepository.count();
            if (total === 0) {
                throw new ServiceError(RESPONSES.NO_DOCUMENTS);
            }
        }

        const [questionEmbedding] = await this.openaiService.embed([question]);
        const rows = await this.findChunks(vectorLiteral(questionEmbedding), body.document_id_public);
        const sources = rows.map((row) => ({
            document_id_public: row.document_id_public,
            document_name: row.document_name,
            page: row.chunk_page,
            excerpt: excerpt(row.chunk_content),
        }));

        if (rows.length === 0) {
            return {
                answer: 'No encontré texto indexado para esa búsqueda. Subí un PDF con texto seleccionable.',
                sources: [],
            };
        }

        const context = rows
            .map((row, index) => {
                const page = row.chunk_page ? `Página: ${row.chunk_page}` : 'Página: desconocida';
                return `[${index + 1}] Documento: ${row.document_name} | ${page}\n${row.chunk_content}`;
            })
            .join('\n\n');

        const history = (body.history ?? []).slice(-8).map((turn) => ({
            role: turn.role,
            content: turn.content.trim(),
        }));
        const answer = await this.openaiService.answer(question, context, history);

        return { answer, sources };
    }

    private async findChunks(vector: string, documentIdPublic?: string): Promise<ChunkRow[]> {
        const raw: unknown = await this.dataSource.query(
            `SELECT
                c."chunk_content" AS chunk_content,
                c."chunk_page" AS chunk_page,
                d."document_id_public" AS document_id_public,
                d."document_name" AS document_name
             FROM "document_chunks" c
             INNER JOIN "documents" d ON d."document_id" = c."chunk_document_id"
             WHERE d."document_deleted_at" IS NULL
               AND ($2::uuid IS NULL OR d."document_id_public" = $2::uuid)
             ORDER BY c."chunk_embedding" <=> $1::vector
             LIMIT $3`,
            [vector, documentIdPublic ?? null, TOP_K],
        );

        if (!Array.isArray(raw)) {
            throw new ServiceError(RESPONSES.INTERNAL_SERVER_ERROR);
        }

        return raw.flatMap((value) => {
            const row = parseChunkRow(value);
            return row ? [row] : [];
        });
    }
}

function vectorLiteral(values: number[] | undefined): string {
    try {
        return toVectorLiteral(values ?? []);
    } catch {
        throw new ServiceError(RESPONSES.OPENAI_ERROR);
    }
}

function parseChunkRow(value: unknown): ChunkRow | null {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const row = value as Record<string, unknown>;
    if (
        typeof row.chunk_content !== 'string' ||
        typeof row.document_id_public !== 'string' ||
        typeof row.document_name !== 'string'
    ) {
        return null;
    }

    let page: number | null = null;
    if (typeof row.chunk_page === 'number') {
        page = row.chunk_page;
    } else if (typeof row.chunk_page === 'string' && row.chunk_page.trim() !== '') {
        const parsed = Number(row.chunk_page);
        page = Number.isFinite(parsed) ? parsed : null;
    } else if (row.chunk_page !== null && row.chunk_page !== undefined) {
        return null;
    }

    return {
        chunk_content: row.chunk_content,
        chunk_page: page,
        document_id_public: row.document_id_public,
        document_name: row.document_name,
    };
}

function excerpt(content: string): string {
    const clean = content.replace(/\s+/g, ' ').trim();
    if (clean.length <= 220) {
        return clean;
    }

    return `${clean.slice(0, 217)}...`;
}
