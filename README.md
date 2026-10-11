# RAG Chatbot

Chat que responde preguntas sobre PDFs que subís. El texto se parte en fragmentos, se convierte en embeddings con OpenAI y se guarda en Postgres con pgvector. Al preguntar, se buscan los fragmentos más parecidos y el modelo de chat responde citando esas fuentes.

Hay dos apps:

| Carpeta | Qué es | Puerto |
| --- | --- | --- |
| `backend` | API NestJS. Indexa PDFs, busca por similitud y genera la respuesta. | `3000` |
| `frontend` | UI React + Vite. Sube documentos y muestra el chat. | `5173` |

El detalle de cada una está en [backend/README.md](backend/README.md) y [frontend/README.md](frontend/README.md).

## Cómo encajan

```
PDF  →  frontend  →  POST /documents  →  texto, fragmentos, embeddings  →  Postgres (pgvector)
pregunta  →  frontend  →  POST /chat  →  búsqueda de los 5 fragmentos más cercanos  →  respuesta + fuentes
```

El frontend no habla con OpenAI. Todas las llamadas van al prefijo `http://localhost:3000/rag_chatbot`.

## Backend

NestJS con TypeORM. Al arrancar se conecta a Postgres, crea la base `rag_chatbot` si no existe y corre las migrations (extensiones `uuid-ossp` y `vector`, tablas `documents` y `document_chunks`).

Las rutas de RAG son públicas (no piden JWT):

| Método | Ruta | Qué hace |
| --- | --- | --- |
| `POST` | `/rag_chatbot/documents` | Recibe un PDF (`file`), extrae el texto, lo fragmenta, pide embeddings y los guarda. |
| `GET` | `/rag_chatbot/documents` | Lista los PDF indexados. |
| `DELETE` | `/rag_chatbot/documents/:document_id_public` | Soft delete. Las búsquedas dejan de usarlo. |
| `POST` | `/rag_chatbot/chat` | Embedding de la pregunta, busca los 5 fragmentos más cercanos y responde. |

`POST /chat` acepta `{ question, document_id_public?, history? }`. Sin `document_id_public` busca en todos los PDF. `history` sigue la conversación.

Embeddings: `text-embedding-3-small` (1536 dimensiones). Respuestas: `gpt-4o-mini`. Los PDF tienen que tener texto seleccionable (un escaneo sin OCR no se indexa). Límite: 20 MB y 500 fragmentos.

Swagger: `http://localhost:3000/rag_chatbot/documentation`.

Postgres necesita la extensión pgvector en el servidor (por ejemplo la imagen `pgvector/pgvector:pg16`). `CREATE EXTENSION vector` no instala el paquete.

## Frontend

React y Vite. Dos paneles: la biblioteca (subir, listar, borrar y elegir el alcance) y el chat (pregunta, respuesta y fuentes con página y extracto). Podés preguntar a un PDF o a todos.

Si el backend no está en `http://localhost:3000/rag_chatbot`, definí `VITE_API_URL` en `frontend/.env`.

## Cómo correrlo

1. Postgres arriba, con un usuario que pueda crear bases y extensiones.
2. En `backend`, copiá `.env.example` a `.env` y completá `OPENAI_API_KEY`.
3. Levantá la API y, en otra terminal, el front:

```bash
cd backend
npm install
npm run start:dev
```

```bash
cd frontend
npm install
npm run dev
```

La UI queda en `http://localhost:5173`.
