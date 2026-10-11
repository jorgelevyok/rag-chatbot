import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
    private readonly logger = new Logger(LoggingMiddleware.name);

    use(req: Request, res: Response, next: NextFunction) {
        const { method, body, query } = req;
        const requestPath = req.originalUrl || req.url || '';
        const startTime = Date.now();

        this.logger.debug(`<--- Incoming Request ---> ${method} ${requestPath}`);
        this.logger.debug(`<--- Query Params ---> ${JSON.stringify(query, null, 4)}`);

        if (!['GET', 'DELETE'].includes(method)) {
            this.logger.debug(`<--- Request Body ---> ${JSON.stringify(body, null, 4)}`);
        }

        res.on('finish', () => {
            const endTime = Date.now() - startTime;
            if (res.statusCode >= 400) {
                this.logger.error(`${method} ${requestPath} ${res.statusCode} - ${endTime}ms`);
            } else {
                this.logger.log(`${method} ${requestPath} ${res.statusCode} - ${endTime}ms`);
            }
        });

        next();
    }
}
