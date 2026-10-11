import { HttpException } from '@nestjs/common';

interface ServiceErrorResponse {
    statusCode: number;
    message: string | string[] | { es: string; en: string };
}

export class ServiceError extends HttpException {
    constructor(response: ServiceErrorResponse) {
        super(response, response.statusCode);
    }
}
