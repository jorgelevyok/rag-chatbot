import { Document } from '@datasources/rag_chatbot/entities/document.entity';
import { RESPONSES } from '@config/constants';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { ServiceError } from '@utils/service.error';
import { DataSource, Repository } from 'typeorm';
import { OpenaiService } from '../openai/openai.service';
import { toVectorLiteral } from '../openai/vector';
import { buildChunks, extractPdfPages, MAX_CHUNKS, MAX_PDF_BYTES } from './pdf.text';

export type PublicDocument = {
    document_id_public: string;
    document_name: string;
    document_page_count: number;
    document_chunk_count: number;
    document_created_at: Date;
};

@Injectable()
export class DocumentsService {
    private readonly logger = new Logger(DocumentsService.name);

    constructor(
        @InjectRepository(Document, 'RAG_CHATBOT')
        private readonly documentsRepository: Repository<Document>,
        @InjectDataSource('RAG_CHATBOT')
        private readonly dataSource: DataSource,
        private readonly openaiService: OpenaiService,
    ) {}

    async upload(file: Express.Multer.File | undefined): Promise<PublicDocument> {
        this.assertPdf(file);

        let extracted: Awaited<ReturnType<typeof extractPdfPages>>;
        try {
            extracted = await extractPdfPages(file.buffer);
        } catch (error) {
            if (error instanceof ServiceError) {
                throw error;
            }
            this.logger.error('Could not read PDF', error instanceof Error ? error.stack : error);
            throw new ServiceError(RESPONSES.INVALID_PDF);
        }

        if (extracted.pages.length === 0) {
            throw new ServiceError(RESPONSES.DOCUMENT_EMPTY);
        }

        const chunks = buildChunks(extracted.pages);
        if (chunks.length === 0) {
            throw new ServiceError(RESPONSES.DOCUMENT_EMPTY);
        }
        if (chunks.length > MAX_CHUNKS) {
            throw new ServiceError(RESPONSES.PDF_TOO_MANY_CHUNKS);
        }

        const embeddings = await this.openaiService.embed(chunks.map((chunk) => chunk.content));
        const saved = await this.dataSource.transaction(async (manager) => {
            const document = manager.create(Document, {
                document_name: this.documentName(file.originalname),
                document_page_count: extracted.totalPages,
                document_chunk_count: chunks.length,
            });
            const stored = await manager.save(document);

            for (let index = 0; index < chunks.length; index += 1) {
                const chunk = chunks[index];
                const embedding = embeddings[index];
                await manager.query(
                    `INSERT INTO "document_chunks"
                        ("chunk_document_id", "chunk_index", "chunk_page", "chunk_content", "chunk_embedding")
                     VALUES ($1, $2, $3, $4, $5::vector)`,
                    [stored.document_id, chunk.index, chunk.page, chunk.content, vectorLiteral(embedding)],
                );
            }

            return stored;
        });

        this.logger.log(`Indexed ${saved.document_name} (${saved.document_chunk_count} chunks)`);
        return this.toPublic(saved);
    }

    async list(): Promise<PublicDocument[]> {
        const documents = await this.documentsRepository.find({
            order: { document_created_at: 'DESC' },
        });

        return documents.map((document) => this.toPublic(document));
    }

    async remove(documentIdPublic: string): Promise<{ document_id_public: string }> {
        const document = await this.documentsRepository.findOne({
            where: { document_id_public: documentIdPublic },
        });

        if (!document) {
            throw new ServiceError(RESPONSES.DOCUMENT_NOT_FOUND);
        }

        await this.documentsRepository.softDelete({ document_id: document.document_id });
        return { document_id_public: document.document_id_public };
    }

    private assertPdf(file: Express.Multer.File | undefined): asserts file is Express.Multer.File {
        if (!file?.buffer?.length) {
            throw new ServiceError(RESPONSES.INVALID_PDF);
        }

        if (file.size > MAX_PDF_BYTES) {
            throw new ServiceError(RESPONSES.PDF_TOO_LARGE);
        }

        const header = file.buffer.subarray(0, 1024).toString('latin1');
        const looksLikePdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
        if (!looksLikePdf || !header.includes('%PDF-')) {
            throw new ServiceError(RESPONSES.INVALID_PDF);
        }
    }

    private documentName(originalName: string): string {
        const decoded = Buffer.from(originalName, 'latin1').toString('utf8');
        const candidate = decoded.includes('\uFFFD') ? originalName : decoded;
        const base = stripControls(candidate.split(/[/\\]/).pop() ?? '');
        const name = (base || 'documento.pdf').slice(0, 255);
        return name.toLowerCase().endsWith('.pdf') ? name : `${name.slice(0, 251)}.pdf`;
    }

    private toPublic(document: Document): PublicDocument {
        return {
            document_id_public: document.document_id_public,
            document_name: document.document_name,
            document_page_count: document.document_page_count,
            document_chunk_count: document.document_chunk_count,
            document_created_at: document.document_created_at,
        };
    }
}

function stripControls(value: string): string {
    let result = '';
    for (const char of value) {
        if (char.charCodeAt(0) >= 32) {
            result += char;
        }
    }
    return result.trim();
}

function vectorLiteral(values: number[] | undefined): string {
    try {
        return toVectorLiteral(values ?? []);
    } catch {
        throw new ServiceError(RESPONSES.OPENAI_ERROR);
    }
}
