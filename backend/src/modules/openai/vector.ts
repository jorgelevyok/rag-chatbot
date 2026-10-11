export const EMBEDDING_DIMENSIONS = 1536;

export function toVectorLiteral(values: number[]): string {
    if (values.length !== EMBEDDING_DIMENSIONS || values.some((value) => !Number.isFinite(value))) {
        throw new Error('Invalid embedding');
    }

    return `[${values.join(',')}]`;
}
