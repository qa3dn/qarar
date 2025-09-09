// إعدادات المشروع
module.exports = {
    // مفتاح OpenRouter API
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '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',

    // منفذ الخادم
    PORT: process.env.PORT || 3000,

    // قاعدة البيانات - MongoDB المحلي
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qarar',

    // JWT Secret
    JWT_SECRET: process.env.JWT_SECRET || 'qarar-super-secret-key-2024',

    // Google OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',

    // إعدادات OpenRouter AI
    OPENROUTER_CONFIG: {
        model: 'openai/gpt-3.5-turbo',
        max_tokens: 150,
        temperature: 0.9,
        baseURL: 'https://openrouter.ai/api/v1'
    },

    // إعدادات الجلسة
    SESSION_SECRET: process.env.SESSION_SECRET || 'qarar-session-secret-2024',

    // إعدادات البريد الإلكتروني
    EMAIL_CONFIG: {
        service: 'gmail',
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
    }
}; 