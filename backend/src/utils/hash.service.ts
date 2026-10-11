import { Injectable } from '@nestjs/common';
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class HashService {
    private readonly SALT_ROUNDS = 10;

    bcrypt(value: string): string {
        const salt = genSaltSync(this.SALT_ROUNDS);
        return hashSync(value, salt);
    }

    verify(value: string, hash: string): boolean {
        return compareSync(value, hash);
    }

    generateUUID(): string {
        return uuidv4();
    }
}
