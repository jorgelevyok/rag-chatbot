import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { DocumentChunk } from './document_chunk.entity';

@Entity('documents')
export class Document {
    @PrimaryGeneratedColumn()
    document_id: number;

    @Column({ type: 'uuid', unique: true, default: () => 'uuid_generate_v4()' })
    document_id_public: string;

    @Column({ type: 'varchar', length: 255 })
    document_name: string;

    @Column({ type: 'int' })
    document_page_count: number;

    @Column({ type: 'int' })
    document_chunk_count: number;

    @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    document_created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    document_updated_at: Date;

    @DeleteDateColumn({ type: 'timestamptz', nullable: true })
    document_deleted_at: Date | null;

    @OneToMany(() => DocumentChunk, (chunk) => chunk.document)
    chunks: DocumentChunk[];
}
