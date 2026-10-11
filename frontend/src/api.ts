export type DocumentItem = {
    document_id_public: string;
    document_name: string;
    document_page_count: number;
    document_chunk_count: number;
    document_created_at: string;
};

export type ChatSource = {
    document_id_public: string;
    document_name: string;
    page: number | null;
    excerpt: string;
};

export type ChatTurn = {
    role: 'user' | 'assistant';
    content: string;
};

export type ChatReply = {
    answer: string;
    sources: ChatSource[];
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/rag_chatbot';

export async function listDocuments(): Promise<DocumentItem[]> {
    return request<DocumentItem[]>('/documents');
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
    const body = new FormData();
    body.append('file', file);
    return request<DocumentItem>('/documents', { method: 'POST', body });
}

export async function deleteDocument(documentId: string): Promise<void> {
    await request(`/documents/${documentId}`, { method: 'DELETE' });
}

export async function askQuestion(question: string, documentId: string | null, history: ChatTurn[]): Promise<ChatReply> {
    return request<ChatReply>('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            question,
            ...(documentId ? { document_id_public: documentId } : {}),
            history,
        }),
    });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`${API_URL}${path}`, init);
    } catch {
        throw new Error('No se pudo conectar con el backend. Revisá que esté corriendo en el puerto 3000.');
    }

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok || isFailed(payload)) {
        throw new Error(readError(payload));
    }

    if (!payload || typeof payload !== 'object' || !('data' in payload)) {
        throw new Error('La respuesta del backend no tiene el formato esperado.');
    }

    return payload.data as T;
}

function isFailed(payload: unknown): boolean {
    return Boolean(payload && typeof payload === 'object' && 'success' in payload && payload.success === false);
}

function readError(payload: unknown): string {
    if (!payload || typeof payload !== 'object' || !('message' in payload)) {
        return 'No se pudo completar la solicitud.';
    }

    const message = payload.message;
    if (typeof message === 'string') {
        return message;
    }

    if (Array.isArray(message)) {
        return message.map(String).join('. ');
    }

    if (message && typeof message === 'object' && 'message' in message) {
        const nested = message.message;
        if (typeof nested === 'string') {
            return nested;
        }
        if (nested && typeof nested === 'object' && 'es' in nested && typeof nested.es === 'string') {
            return nested.es;
        }
    }

    return 'No se pudo completar la solicitud.';
}
