import { extractText } from 'unpdf';

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;

export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_CHUNKS = 500;

export type PdfPage = {
    page: number;
    text: string;
};

export type PdfChunk = {
    index: number;
    page: number;
    content: string;
};

export async function extractPdfPages(buffer: Buffer): Promise<{ totalPages: number; pages: PdfPage[] }> {
    const { totalPages, text } = await extractText(new Uint8Array(buffer), { mergePages: false });
    const pages = text
        .map((value, index) => ({
            page: index + 1,
            text: value.replace(/\s+/g, ' ').trim(),
        }))
        .filter((page) => page.text.length > 0);

    return { totalPages, pages };
}

export function buildChunks(pages: PdfPage[]): PdfChunk[] {
    const chunks: PdfChunk[] = [];

    for (const page of pages) {
        if (page.text.length <= CHUNK_SIZE) {
            chunks.push({ index: chunks.length, page: page.page, content: page.text });
            continue;
        }

        let start = 0;
        while (start < page.text.length) {
            let end = Math.min(start + CHUNK_SIZE, page.text.length);

            if (end < page.text.length) {
                const slice = page.text.slice(start, end);
                const breakAt = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('; '), slice.lastIndexOf(' '));
                if (breakAt > CHUNK_SIZE * 0.5) {
                    end = start + breakAt + 1;
                }
            }

            const content = page.text.slice(start, end).trim();
            if (content) {
                chunks.push({ index: chunks.length, page: page.page, content });
            }

            if (end >= page.text.length) {
                break;
            }

            const nextStart = end - CHUNK_OVERLAP;
            start = nextStart > start ? nextStart : end;
        }
    }

    return chunks;
}
