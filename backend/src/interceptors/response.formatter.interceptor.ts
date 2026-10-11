import { SKIP_RESPONSE_FORMAT_KEY } from '@common/decorators/skip.response.format.decorator';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
    constructor(private readonly reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const skip =
            this.reflector.get<boolean>(SKIP_RESPONSE_FORMAT_KEY, context.getHandler()) ??
            this.reflector.get<boolean>(SKIP_RESPONSE_FORMAT_KEY, context.getClass());

        if (skip) {
            return next.handle();
        }

        return next.handle().pipe(
            map((data: any) => ({
                success: true,
                status: true,
                error: false,
                data,
            })),
        );
    }
}
