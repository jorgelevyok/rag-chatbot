import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

const flattenValidationErrors = (errors: ValidationError[]): ValidationError[] => {
    const result: ValidationError[] = [];
    for (const error of errors) {
        if (error.constraints) {
            result.push(error);
        }
        if (error.children?.length) {
            result.push(...flattenValidationErrors(error.children));
        }
    }
    return result;
};

export const validationExceptionFactory = (errors: ValidationError[]) => {
    const flatErrors = flattenValidationErrors(errors);
    const messages = flatErrors.flatMap((error) => (error.constraints ? Object.values(error.constraints) : []));

    return new BadRequestException(messages);
};
