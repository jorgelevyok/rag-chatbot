export const RESPONSES = {
    INTERNAL_SERVER_ERROR: {
        statusCode: 500,
        message: {
            es: 'Error del servidor',
            en: 'Internal server error',
        },
    },
    UNAUTHORIZED: {
        statusCode: 401,
        message: {
            es: 'No autorizado',
            en: 'Unauthorized',
        },
    },
    NOT_FOUND: {
        statusCode: 404,
        message: {
            es: 'No se encontró ningún resultado',
            en: 'No results were found',
        },
    },
    BAD_REQUEST: {
        statusCode: 400,
        message: {
            es: 'La solicitud es incorrecta o no válida',
            en: 'The request is incorrect or invalid',
        },
    },
    INVALID_PDF: {
        statusCode: 400,
        message: {
            es: 'Subí un archivo PDF válido',
            en: 'Upload a valid PDF file',
        },
    },
    PDF_TOO_LARGE: {
        statusCode: 400,
        message: {
            es: 'El PDF puede pesar hasta 20 MB',
            en: 'The PDF can be up to 20 MB',
        },
    },
    PDF_TOO_MANY_CHUNKS: {
        statusCode: 400,
        message: {
            es: 'El PDF es demasiado largo para indexarlo de una vez',
            en: 'The PDF is too long to index in one go',
        },
    },
    DOCUMENT_EMPTY: {
        statusCode: 400,
        message: {
            es: 'No se pudo extraer texto del PDF. Tiene que tener texto seleccionable, no ser solo una imagen escaneada.',
            en: 'Could not extract text from the PDF. It needs selectable text, not a scanned image.',
        },
    },
    DOCUMENT_NOT_FOUND: {
        statusCode: 404,
        message: {
            es: 'No se encontró el documento',
            en: 'Document not found',
        },
    },
    NO_DOCUMENTS: {
        statusCode: 404,
        message: {
            es: 'Todavía no hay documentos. Subí un PDF primero.',
            en: 'There are no documents yet. Upload a PDF first.',
        },
    },
    OPENAI_NOT_CONFIGURED: {
        statusCode: 503,
        message: {
            es: 'Falta OPENAI_API_KEY en el backend',
            en: 'OPENAI_API_KEY is not configured',
        },
    },
    OPENAI_ERROR: {
        statusCode: 502,
        message: {
            es: 'OpenAI no pudo completar la solicitud',
            en: 'OpenAI could not complete the request',
        },
    },
} as const;
