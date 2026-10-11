# RAG Chatbot frontend

Interfaz para subir PDFs, elegir sobre cuáles preguntar y ver la respuesta con los fragmentos que la sustentan. Está hecha con React y Vite. No indexa ni llama a OpenAI: eso lo hace el backend en `../backend`.

## Qué hace

La pantalla tiene dos paneles.

**Biblioteca.** Soltá un PDF o elegilo (texto seleccionable, hasta 20 MB) y pulsá **Indexar PDF**. El archivo se manda a `POST /documents`. Cuando termina, aparece en la lista con páginas, cantidad de fragmentos y fecha. Podés borrar un documento (`DELETE /documents/:id`) o filtrar el chat a uno solo. El chip **Todos** busca en toda la biblioteca.

**Preguntas.** Escribí una pregunta y se envía a `POST /chat` junto con el documento elegido (si hay uno) y los últimos turnos de la conversación. La respuesta muestra el texto y, debajo, las fuentes: nombre del PDF, página y un extracto. Cambiar de documento vacía el hilo.

Si el backend no responde, o la API devuelve `success: false`, el error aparece en un banner arriba.

## Cómo habla con el backend

Las llamadas están en `src/api.ts`. La base por defecto es `http://localhost:3000/rag_chatbot`. Las respuestas vienen envueltas en `{ success, status, error, data }` y el cliente usa solo `data`.

Si el backend corre en otro host o puerto, creá un `.env` en esta carpeta:

```
VITE_API_URL=http://localhost:3000/rag_chatbot
```

## Cómo correrlo

El backend y Postgres tienen que estar arriba. Ver el README de `../backend` o el de la raíz del repo.

```bash
npm install
npm run dev
```

La UI queda en `http://localhost:5173`.

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo de Vite. |
| `npm run build` | Chequea TypeScript y genera `dist`. |
| `npm run preview` | Sirve el build de `dist`. |
