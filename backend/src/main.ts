import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { validationExceptionFactory } from '@utils/validation.exception.factory';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http.exception.filter';
import { ResponseFormatInterceptor } from './interceptors/response.formatter.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: process.env.DEBUG === 'true' ? ['verbose'] : ['log'],
    });
    const configService = app.get(ConfigService);
    const port = configService.get('port');

    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));

    app.setGlobalPrefix(configService.get<string>('serviceName'));
    app.useGlobalFilters(new HttpExceptionFilter(configService));
    app.useGlobalInterceptors(new ResponseFormatInterceptor(app.get(Reflector)));
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            exceptionFactory: validationExceptionFactory,
        }),
    );
    app.enableVersioning({
        type: VersioningType.URI,
    });
    app.enableCors();

    const swaggerConfig = new DocumentBuilder()
        .setTitle('RAG Chatbot API')
        .setDescription('Documentación de la API de RAG Chatbot')
        .setVersion('1.0.0')
        .addBearerAuth({
            type: 'http',
            description: 'Bearer token generado al iniciar sesión',
        });

    if (configService.get('environment') === 'development') {
        swaggerConfig.addServer(`http://localhost:${port}/`, 'Servidor local');
    }

    const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig.build());
    SwaggerModule.setup(`${configService.get<string>('serviceName')}/documentation`, app, documentFactory);

    await app.listen(port);
}
bootstrap();
