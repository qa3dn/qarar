# 🚀 رفع Backend على Render.com

## 📋 **الخطوات:**

### 1. **اذهب إلى [render.com](https://render.com)**
- سجل دخول أو أنشئ حساب
- اختر "New Web Service"

### 2. **اربط مع GitHub:**
- اختر "Build and deploy from a Git repository"
- اختر المشروع `qarar`
- اضغط "Connect"

### 3. **إعدادات الخدمة:**
- **Name**: `qarar-backend`
- **Root Directory**: (اتركه فارغ)
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 4. **متغيرات البيئة:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qarar
JWT_SECRET=your-super-secret-jwt-key-here
OPENROUTER_API_KEY=your-openrouter-api-key
PORT=3000
NODE_ENV=production
```

### 5. **اضغط "Create Web Service"**

## ✅ **النتيجة:**
- **Backend**: `https://qarar-backend.onrender.com`
- **API**: `https://qarar-backend.onrender.com/api/ask`

## 🔧 **تحديث Frontend:**
في ملف `frontend/public/config.js`:
```javascript
API_BASE_URL: 'https://qarar-backend.onrender.com'
```

---
**Render.com أسهل من Railway!** 🚀✨
