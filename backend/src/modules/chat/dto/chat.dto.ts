import { Transform, Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsIn,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    MinLength,
    ValidateNested,
} from 'class-validator';

function trimText(value: unknown): unknown {
    return typeof value === 'string' ? value.trim() : value;
}

export class ChatTurnDTO {
    @IsIn(['user', 'assistant'])
    role: 'user' | 'assistant';

    @Transform(({ value }) => trimText(value))
    @IsString()
    @MinLength(1)
    @MaxLength(4000)
    content: string;
}

export class AskQuestionBodyDTO {
    @Transform(({ value }) => trimText(value))
    @IsString({ message: 'La pregunta es obligatoria' })
    @MinLength(1, { message: 'La pregunta es obligatoria' })
    @MaxLength(2000, { message: 'La pregunta puede tener hasta 2000 caracteres' })
    question: string;

    @IsOptional()
    @IsUUID('all', { message: 'El documento elegido no es válido' })
    document_id_public?: string;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(8)
    @ValidateNested({ each: true })
    @Type(() => ChatTurnDTO)
    history?: ChatTurnDTO[];
}
