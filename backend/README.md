# RAG Chatbot backend

Base de NestJS copiada del esquema de `guild-master/backend`. Todavía no hay entities, módulos de dominio ni tablas. Solo está el esqueleto para arrancar, conectar Postgres y correr migrations.

## Qué hace ahora

Al ejecutar `npm run start:dev` pasa esto:

1. Nest levanta la API en el puerto del `.env` (por defecto `3000`).
2. El prefijo global es `rag_chatbot`, así que Swagger queda en `http://localhost:3000/rag_chatbot/documentation`.
3. El datasource `RAG_CHATBOT` se conecta a Postgres, crea la base `rag_chatbot` si no existe y ejecuta las migrations pendientes.
4. Cada request pasa por el middleware de logs, el guard de JWT y el interceptor que envuelve la respuesta en `{ success, status, error, data }`.
5. Los errores salen por el filtro global con el mismo formato.

El flujo de RAG está en dos módulos públicos (`@Public()`, no piden JWT):

| Método | Ruta | Qué hace |
| --- | --- | --- |
| `POST` | `/rag_chatbot/documents` | Recibe un PDF en el campo `file`, extrae el texto, lo parte en fragmentos, pide embeddings a OpenAI y los guarda en `document_chunks`. |
| `GET` | `/rag_chatbot/documents` | Lista los PDF indexados. |
| `DELETE` | `/rag_chatbot/documents/:document_id_public` | Borra el documento (soft delete). Las búsquedas dejan de usarlo. |
| `POST` | `/rag_chatbot/chat` | Embedding de la pregunta, busca los 5 fragmentos más cercanos con pgvector y responde con el modelo de chat. |

`POST /chat` acepta `{ question, document_id_public?, history? }`. Si no mandás `document_id_public`, busca en todos los PDF. `history` es opcional y sirve para seguir la conversación.

El modelo de embeddings por defecto es `text-embedding-3-small` (1536 dimensiones, la columna `vector(1536)`). El de respuestas es `gpt-4o-mini`. Los PDF tienen que tener texto seleccionable: un escaneo sin OCR no se puede indexar. El límite es 20 MB y 500 fragmentos.

## Qué incluye

- Configuración por `.env` (`@nestjs/config`).
- Datasource TypeORM en `src/datasources/rag_chatbot`. `synchronize` está en `false`: el esquema solo cambia por migrations.
- Filtro de excepciones, interceptor de respuesta, middleware de logging.
- Utilidades de JWT, bcrypt y UUIDs, más el guard de autenticación.
- CORS, versionado por URI y validación de DTOs con `class-validator`.

## Migrations

Se ejecutan solas al iniciar la app, en orden de timestamp:

| Archivo | Qué hace |
| --- | --- |
| `1791650485118.create.extension.uuid.ossp.ts` | Habilita `uuid-ossp` para generar UUIDs en Postgres. |
| `1791650485119.create.extension.vector.ts` | Habilita `pgvector` (`CREATE EXTENSION vector`) para guardar embeddings. |
| `1791650485120.create.table.documents.ts` | Crea `documents` con el PDF indexado. |
| `1791650485121.create.table.document_chunks.ts` | Crea `document_chunks` con el texto, la página y el embedding `vector(1536)`. |

`CREATE EXTENSION vector` no instala el paquete en el sistema. Postgres tiene que tener pgvector disponible en el servidor. En Docker, una imagen como `pgvector/pgvector:pg16` ya lo trae. Si la extensión no está instalada en el servidor, la migration falla al arrancar.

## Variables de entorno

Copiá `.env.example` a `.env` si todavía no existe:

```
NODE_ENV=development
PORT=3000
SERVICE_NAME=rag_chatbot
DEBUG=true

RAG_CHATBOT_DATABASE_HOST=localhost
RAG_CHATBOT_DATABASE_PORT=5432
RAG_CHATBOT_DATABASE_USERNAME=postgres
RAG_CHATBOT_DATABASE_PASSWORD=postgres
RAG_CHATBOT_DATABASE_NAME=rag_chatbot

JWT_SECRET=change-me-in-development

OPENAI_API_KEY=
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o-mini
```

`OPENAI_API_KEY` es obligatoria para indexar y para preguntar.

## Front

En `rag-chatbot/frontend` hay una app de Vite para subir el PDF y hacer preguntas. Por defecto llama a `http://localhost:3000/rag_chatbot`. Si el backend corre en otro lado, definí `VITE_API_URL`.

```bash
cd ../frontend
npm install
npm run dev
```

La UI queda en `http://localhost:5173`.

## Cómo correrlo

```bash
npm install
npm run start:dev
```

Postgres tiene que estar arriba y el usuario del `.env` necesita permiso para crear bases y extensiones. Después levantá el front como está arriba.
