import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableDocumentChunks1791650485121 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "document_chunks" (
                "chunk_id" SERIAL PRIMARY KEY,
                "chunk_document_id" integer NOT NULL,
                "chunk_index" integer NOT NULL,
                "chunk_page" integer,
                "chunk_content" text NOT NULL,
                "chunk_embedding" vector(1536) NOT NULL,
                "chunk_created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "FK_document_chunks_document_id"
                    FOREIGN KEY ("chunk_document_id") REFERENCES "documents" ("document_id")
                    ON DELETE CASCADE,
                CONSTRAINT "UQ_document_chunks_document_index" UNIQUE ("chunk_document_id", "chunk_index"),
                CONSTRAINT "CHK_document_chunks_index_non_negative" CHECK ("chunk_index" >= 0),
                CONSTRAINT "CHK_document_chunks_page_positive" CHECK ("chunk_page" IS NULL OR "chunk_page" >= 1)
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_document_chunks_embedding"
            ON "document_chunks"
            USING hnsw ("chunk_embedding" vector_cosine_ops);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_document_chunks_embedding";');
        await queryRunner.query('DROP TABLE IF EXISTS "document_chunks";');
    }
}
