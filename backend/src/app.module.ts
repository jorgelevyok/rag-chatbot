import { RagChatbotDataSource } from '@datasources/rag_chatbot/rag_chatbot.datasource';
import { AuthGuard } from '@guards/auth.guard';
import { ChatModule } from '@modules/chat/chat.module';
import { DocumentsModule } from '@modules/documents/documents.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { UtilsModule } from '@utils/utils.module';
import { ClsModule } from 'nestjs-cls';
import configuration from './config/configuration';
import { LoggingMiddleware } from './middlewares/logging';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
            envFilePath: ['.env'],
        }),
        ClsModule.forRoot({
            global: true,
            middleware: {
                mount: true,
            },
        }),
        RagChatbotDataSource,
        UtilsModule,
        DocumentsModule,
        ChatModule,
    ],
    providers: [ConfigService, { provide: APP_GUARD, useClass: AuthGuard }],
    exports: [ConfigService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggingMiddleware).forRoutes('{*path}');
    }
}
