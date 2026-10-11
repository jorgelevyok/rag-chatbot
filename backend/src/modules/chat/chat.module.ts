import { Document } from '@datasources/rag_chatbot/entities/document.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenaiModule } from '../openai/openai.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
    imports: [TypeOrmModule.forFeature([Document], 'RAG_CHATBOT'), OpenaiModule],
    controllers: [ChatController],
    providers: [ChatService],
})
export class ChatModule {}
