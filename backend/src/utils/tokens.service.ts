import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class TokensService {
    constructor(private readonly jwtService: JwtService) {}

    encode(payload: Record<string, any>, expiresIn?: string | number): string {
        const options: JwtSignOptions = {};

        if (expiresIn) {
            options.expiresIn = Number(expiresIn);
        }

        return this.jwtService.sign(payload, options);
    }

    async decode<T extends object = any>(token: string): Promise<T> {
        return this.jwtService.verifyAsync<T>(token);
    }
}
