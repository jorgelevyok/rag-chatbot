import { RESPONSES } from '@config/constants';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceError } from '@utils/service.error';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger('HttpException');

    constructor(private readonly config: ConfigService) {}

    catch(exception: HttpException | ServiceError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const { params, query, body } = ctx.getRequest<Request>();

        let messages: any = RESPONSES.INTERNAL_SERVER_ERROR.message;
        let status = 500;

        if (exception instanceof ServiceError) {
            status = exception.getStatus();
            messages = exception.getResponse();
        } else if (exception instanceof Error && 'code' in exception && exception.code === 'LIMIT_FILE_SIZE') {
            status = RESPONSES.PDF_TOO_LARGE.statusCode;
            messages = RESPONSES.PDF_TOO_LARGE;
        } else if (exception instanceof HttpException) {
            const errorResponse = exception.getResponse() as any;
            status = exception.getStatus();
            const nestedMessage = errorResponse?.message;
            if (
                typeof errorResponse === 'object' &&
                errorResponse !== null &&
                typeof nestedMessage === 'object' &&
                nestedMessage !== null &&
                'es' in nestedMessage &&
                'en' in nestedMessage
            ) {
                messages = errorResponse;
            } else {
                messages = errorResponse['message'] ?? messages;
            }
        }

        if (status === 500) {
            this.logger.error(exception.stack);
        }

        const isProduction = this.config.get<boolean>('isProduction');
        const includeRequestData = !isProduction || this.config.get<boolean>('debug');
        const responseData: Record<string, any> = {
            success: false,
            message: messages,
            data: includeRequestData ? { params, query, body } : undefined,
        };

        if (status === 500 && !this.config.get<boolean>('isProduction')) {
            responseData['stack'] = exception.stack;
        }

        response.status(status).json(responseData);
    }
}
