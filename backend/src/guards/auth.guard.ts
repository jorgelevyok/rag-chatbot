import { RESPONSES } from '@config/constants';
import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ServiceError } from '@utils/service.error';
import { TokensService } from '@utils/tokens.service';
import { Request } from 'express';
import { ClsService } from 'nestjs-cls';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly tokensService: TokensService,
        private readonly reflector: Reflector,
        private readonly cls: ClsService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const request: Request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (isPublic) {
            if (token) {
                try {
                    const payload = await this.tokensService.decode<any>(token);
                    this.cls.set('authUser', payload);
                } catch {
                    // Public endpoint: ignore invalid/missing auth.
                }
            }
            return true;
        }

        if (!token) {
            throw new ServiceError(RESPONSES.UNAUTHORIZED);
        }

        try {
            const payload = await this.tokensService.decode<any>(token);
            this.cls.set('authUser', payload);
        } catch {
            throw new ServiceError(RESPONSES.UNAUTHORIZED);
        }

        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
