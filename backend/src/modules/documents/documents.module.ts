import { Document } from '@datasources/rag_chatbot/entities/document.entity';
import { DocumentChunk } from '@datasources/rag_chatbot/entities/document_chunk.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenaiModule } from '../openai/openai.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
    imports: [TypeOrmModule.forFeature([Document, DocumentChunk], 'RAG_CHATBOT'), OpenaiModule],
    controllers: [DocumentsController],
    providers: [DocumentsService],
})
export class DocumentsModule {}
