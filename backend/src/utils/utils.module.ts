import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { HashService } from './hash.service';
import { TokensService } from './tokens.service';

@Module({
    imports: [
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const secret = configService.get<string>('jwt.secret');

                if (!secret) {
                    throw new Error('JWT_SECRET is not configured!');
                }

                return {
                    secret,
                    signOptions: { expiresIn: '7d' },
                };
            },
        }),
    ],
    providers: [TokensService, HashService],
    exports: [TokensService, HashService],
})
export class UtilsModule {}
