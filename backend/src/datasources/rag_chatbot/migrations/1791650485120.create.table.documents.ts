import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTableDocuments1791650485120 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'documents',
                columns: [
                    {
                        name: 'document_id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'document_id_public',
                        type: 'uuid',
                        isUnique: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'document_name',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'document_page_count',
                        type: 'int',
                    },
                    {
                        name: 'document_chunk_count',
                        type: 'int',
                    },
                    {
                        name: 'document_created_at',
                        type: 'timestamptz',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'document_updated_at',
                        type: 'timestamptz',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'document_deleted_at',
                        type: 'timestamptz',
                        isNullable: true,
                    },
                ],
                checks: [
                    {
                        name: 'CHK_documents_page_count_non_negative',
                        expression: '"document_page_count" >= 0',
                    },
                    {
                        name: 'CHK_documents_chunk_count_non_negative',
                        expression: '"document_chunk_count" >= 0',
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('documents');
    }
}
