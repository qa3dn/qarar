// إعدادات API
const CONFIG = {
    // غيّر هذا الرابط إلى رابط Backend الحقيقي بعد الرفع
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://your-backend-url.railway.app', // غيّر هذا
    
    // إعدادات أخرى
    VERSION: '1.0.0',
    DEBUG: window.location.hostname === 'localhost'
};

// دالة مساعدة لاستدعاء API
async function apiCall(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, finalOptions);
        return await response.json();
    } catch (error) {
        console.error('API Call Error:', error);
        throw error;
    }
}

// تصدير للاستخدام
window.CONFIG = CONFIG;
window.apiCall = apiCall;
