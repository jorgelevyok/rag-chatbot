import { FormEvent, useEffect, useRef, useState } from 'react';
import {
    askQuestion,
    ChatReply,
    ChatTurn,
    deleteDocument,
    DocumentItem,
    listDocuments,
    uploadDocument,
} from './api';

type TranscriptItem =
    | { id: string; role: 'user'; content: string }
    | { id: string; role: 'assistant'; content: string; sources: ChatReply['sources'] };

const MAX_PDF_BYTES = 20 * 1024 * 1024;

export function App() {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [question, setQuestion] = useState('');
    const [asking, setAsking] = useState(false);
    const [messages, setMessages] = useState<TranscriptItem[]>([]);
    const [error, setError] = useState('');
    const [openSources, setOpenSources] = useState<ChatReply['sources'] | null>(null);
    const threadRef = useRef<HTMLDivElement>(null);
    const closeSourcesRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        void loadDocuments();
    }, []);

    useEffect(() => {
        threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, asking]);

    useEffect(() => {
        if (!openSources) {
            return;
        }
        closeSourcesRef.current?.focus();
        function onKey(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setOpenSources(null);
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [openSources]);

    async function loadDocuments() {
        setLoadingDocs(true);
        try {
            const next = await listDocuments();
            setDocuments(next);
            setError('');
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'No se pudieron cargar los documentos.');
        } finally {
            setLoadingDocs(false);
        }
    }

    function takeFile(next: File | undefined) {
        if (!next) {
            return;
        }
        const isPdf = next.type === 'application/pdf' || next.name.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
            setError('Elegí un archivo PDF.');
            return;
        }
        if (next.size > MAX_PDF_BYTES) {
            setError('El PDF puede pesar hasta 20 MB.');
            return;
        }
        setError('');
        setFile(next);
    }

    async function onUpload(event: FormEvent) {
        event.preventDefault();
        if (!file || uploading) {
            return;
        }

        setUploading(true);
        setError('');
        try {
            const created = await uploadDocument(file);
            setDocuments((current) => [created, ...current.filter((item) => item.document_id_public !== created.document_id_public)]);
            setSelectedId(created.document_id_public);
            setMessages([]);
            setFile(null);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'No se pudo indexar el PDF.');
        } finally {
            setUploading(false);
        }
    }

    async function onDelete(documentId: string) {
        const target = documents.find((item) => item.document_id_public === documentId);
        if (!target || !window.confirm(`¿Eliminar ${target.document_name}?`)) {
            return;
        }

        setError('');
        try {
            await deleteDocument(documentId);
            setDocuments((current) => current.filter((item) => item.document_id_public !== documentId));
            if (selectedId === documentId) {
                setSelectedId(null);
                setMessages([]);
            }
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'No se pudo eliminar el documento.');
        }
    }

    function selectDocument(documentId: string | null) {
        setSelectedId(documentId);
        setMessages([]);
    }

    async function onAsk(event: FormEvent) {
        event.preventDefault();
        const text = question.trim();
        if (!text || asking || documents.length === 0) {
            return;
        }

        const history: ChatTurn[] = messages.slice(-6).map((item) => ({ role: item.role, content: item.content }));
        setAsking(true);
        setError('');
        try {
            const reply = await askQuestion(text, selectedId, history);
            setMessages((current) => [
                ...current,
                { id: crypto.randomUUID(), role: 'user', content: text },
                { id: crypto.randomUUID(), role: 'assistant', content: reply.answer, sources: reply.sources },
            ]);
            setQuestion('');
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'No se pudo responder la pregunta.');
        } finally {
            setAsking(false);
        }
    }

    const scopeLabel = selectedId
        ? documents.find((item) => item.document_id_public === selectedId)?.document_name ?? 'un documento'
        : 'todos los PDF';

    return (
        <div className="page">
            <header className="topbar">
                <div>
                    <p className="eyebrow">Biblioteca local</p>
                    <h1>RAG Chatbot</h1>
                </div>
                <p className="lede">Subí un PDF, se indexa con embeddings de OpenAI y después podés preguntarle.</p>
            </header>

            {error ? (
                <p className="banner" role="alert">
                    {error}
                </p>
            ) : null}

            <main className="layout">
                <section className="panel library" aria-label="Documentos">
                    <form className="upload" onSubmit={onUpload}>
                        <label
                            className={dragging ? 'dropzone is-dragging' : 'dropzone'}
                            onDragOver={(event) => {
                                event.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={(event) => {
                                event.preventDefault();
                                setDragging(false);
                                takeFile(event.dataTransfer.files[0]);
                            }}
                        >
                            <input
                                type="file"
                                accept="application/pdf,.pdf"
                                onChange={(event) => takeFile(event.target.files?.[0])}
                            />
                            <span className="drop-title">{file ? file.name : 'Soltá un PDF o elegilo'}</span>
                            <span className="drop-meta">
                                {file ? formatBytes(file.size) : 'Texto seleccionable, hasta 20 MB'}
                            </span>
                        </label>
                        <button type="submit" disabled={!file || uploading}>
                            {uploading ? 'Generando embeddings…' : 'Indexar PDF'}
                        </button>
                    </form>

                    <div className="doc-head">
                        <h2>Documentos</h2>
                        <button type="button" className={selectedId === null ? 'chip is-on' : 'chip'} onClick={() => selectDocument(null)}>
                            Todos
                        </button>
                    </div>

                    {loadingDocs ? <p className="muted">Cargando documentos…</p> : null}
                    {!loadingDocs && documents.length === 0 ? (
                        <p className="muted">Todavía no hay PDFs. El primero que subas queda listo para preguntar.</p>
                    ) : null}

                    <ul className="docs">
                        {documents.map((document) => (
                            <li key={document.document_id_public}>
                                <button
                                    type="button"
                                    className={selectedId === document.document_id_public ? 'doc is-on' : 'doc'}
                                    onClick={() => selectDocument(document.document_id_public)}
                                >
                                    <strong>{document.document_name}</strong>
                                    <span>
                                        {document.document_page_count} pág. · {document.document_chunk_count} fragmentos
                                    </span>
                                    <span>{formatDate(document.document_created_at)}</span>
                                </button>
                                <button
                                    type="button"
                                    className="ghost"
                                    onClick={() => void onDelete(document.document_id_public)}
                                    aria-label={`Eliminar ${document.document_name}`}
                                >
                                    Eliminar
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="panel chat" aria-label="Preguntas">
                    <div className="chat-head">
                        <h2>Preguntas</h2>
                        <p>Buscando en {scopeLabel}</p>
                    </div>

                    <div className="thread" ref={threadRef}>
                        {messages.length === 0 ? (
                            <div className="empty-thread">
                                <p>Hacé una pregunta sobre el contenido del PDF.</p>
                                <p>La respuesta usa los fragmentos más parecidos a tu pregunta.</p>
                            </div>
                        ) : null}
                        {messages.map((message) =>
                            message.role === 'user' ? (
                                <article key={message.id} className="bubble user">
                                    <p>{message.content}</p>
                                </article>
                            ) : (
                                <article key={message.id} className="bubble assistant">
                                    <p>{message.content}</p>
                                    {message.sources.length > 0 ? (
                                        <button
                                            type="button"
                                            className="sources-trigger"
                                            title="Ver fragmentos"
                                            aria-label={`Ver ${message.sources.length} fragmentos`}
                                            onClick={() => setOpenSources(message.sources)}
                                        >
                                            <FragmentsIcon />
                                        </button>
                                    ) : null}
                                </article>
                            ),
                        )}
                    </div>

                    <form className="composer" onSubmit={onAsk}>
                        <label className="sr-only" htmlFor="question">
                            Pregunta
                        </label>
                        <textarea
                            id="question"
                            rows={3}
                            value={question}
                            placeholder={documents.length === 0 ? 'Primero indexá un PDF' : 'Preguntá algo del documento'}
                            disabled={documents.length === 0 || asking}
                            onChange={(event) => setQuestion(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    event.currentTarget.form?.requestSubmit();
                                }
                            }}
                        />
                        <button type="submit" disabled={documents.length === 0 || asking || question.trim().length === 0}>
                            {asking ? 'Pensando…' : 'Preguntar'}
                        </button>
                    </form>
                </section>
            </main>

            {asking ? (
                <div className="loading-overlay" role="status" aria-live="polite">
                    <div className="loading-card">
                        <span className="spinner" aria-hidden="true" />
                        <p>Buscando en los fragmentos…</p>
                    </div>
                </div>
            ) : null}

            {openSources ? (
                <div className="modal-backdrop" onClick={() => setOpenSources(null)}>
                    <div
                        className="modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="sources-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="modal-head">
                            <h2 id="sources-title">Fragmentos</h2>
                            <button
                                ref={closeSourcesRef}
                                type="button"
                                className="modal-close"
                                aria-label="Cerrar fragmentos"
                                onClick={() => setOpenSources(null)}
                            >
                                ×
                            </button>
                        </div>
                        <ul className="sources">
                            {openSources.map((source, index) => (
                                <li key={`${source.document_id_public}-${source.page ?? 'x'}-${index}`}>
                                    <strong>
                                        {source.document_name}
                                        {source.page ? ` · pág. ${source.page}` : ''}
                                    </strong>
                                    <span>{source.excerpt}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function FragmentsIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M7 3.75h7.1L19 8.55V20.25H7V3.75Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
            />
            <path d="M14 4.1V8.7h4.55" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M10 12.4h6M10 16h4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
    );
}

function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
    return new Date(value).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
}
