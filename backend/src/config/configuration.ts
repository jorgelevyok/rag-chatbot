export default () => ({
    serviceName: process.env.SERVICE_NAME || 'rag_chatbot',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '3000',
    debug: process.env.DEBUG === 'true',
    isProduction: process.env.NODE_ENV === 'production',
    databases: {
        rag_chatbot: {
            type: 'postgres',
            host: process.env.RAG_CHATBOT_DATABASE_HOST || 'localhost',
            port: parseInt(process.env.RAG_CHATBOT_DATABASE_PORT ?? '5432', 10),
            username: process.env.RAG_CHATBOT_DATABASE_USERNAME || 'postgres',
            password: process.env.RAG_CHATBOT_DATABASE_PASSWORD,
            name: process.env.RAG_CHATBOT_DATABASE_NAME || 'rag_chatbot',
        },
    },
    jwt: {
        secret: process.env.JWT_SECRET,
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
    },
});
