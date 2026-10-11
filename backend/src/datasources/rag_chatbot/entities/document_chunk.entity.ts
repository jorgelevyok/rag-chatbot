import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Document } from './document.entity';

@Entity('document_chunks')
export class DocumentChunk {
    @PrimaryGeneratedColumn()
    chunk_id: number;

    @Column({ type: 'int' })
    chunk_document_id: number;

    @ManyToOne(() => Document, (document) => document.chunks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chunk_document_id', referencedColumnName: 'document_id' })
    document: Document;

    @Column({ type: 'int' })
    chunk_index: number;

    @Column({ type: 'int', nullable: true })
    chunk_page: number | null;

    @Column({ type: 'text' })
    chunk_content: string;

    @Column({ type: 'vector', length: 1536, select: false })
    chunk_embedding: string;

    @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    chunk_created_at: Date;
}
