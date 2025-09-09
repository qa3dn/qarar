# 🚀 دليل رفع المشروع

## 🌐 **رفع Frontend على Netlify:**

### الطريقة الأولى: السحب والإفلات (الأسهل)
1. **اذهب إلى [netlify.com](https://netlify.com)**
2. **سجل دخول أو أنشئ حساب**
3. **اسحب مجلد `frontend/public`** إلى منطقة "Deploy manually"
4. **انتظر حتى يكتمل الرفع** ✅

### الطريقة الثانية: GitHub
1. **ارفع المشروع على GitHub**
2. **في Netlify، اختر "New site from Git"**
3. **اختر GitHub وحدد المشروع**
4. **في Build settings:**
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/public`
5. **اضغط "Deploy site"** ✅

## 🚀 **رفع Backend على Railway:**

### خطوات سريعة:
1. **ارفع المشروع على GitHub**
2. **اذهب إلى [railway.app](https://railway.app)**
3. **اختر "Deploy from GitHub repo"**
4. **اختر المشروع**
5. **في إعدادات Root Directory:**
   - **Root Directory**: `backend`
6. **في إعدادات Environment Variables:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qarar
   JWT_SECRET=your-super-secret-jwt-key-here
   OPENROUTER_API_KEY=your-openrouter-api-key
   PORT=3000
   NODE_ENV=production
   ```
7. **اضغط Deploy** ✅

### ⚠️ **مهم جداً:**
- **تأكد من تحديد Root Directory كـ `backend`**
- **مش `backend/` أو `/backend`**
- **فقط `backend`**

## 🗄️ **إعداد MongoDB Atlas:**

### خطوات سريعة:
1. **اذهب إلى [mongodb.com/atlas](https://mongodb.com/atlas)**
2. **أنشئ حساب مجاني**
3. **أنشئ cluster جديد**
4. **احصل على Connection String**
5. **أضف IP address للـ whitelist** (أو 0.0.0.0/0 للجميع)

## ⚙️ **بعد الرفع:**

### 1. تحديث رابط Backend:
في ملف `frontend/public/config.js`:
```javascript
API_BASE_URL: 'https://your-backend-url.railway.app'
```

### 2. اختبار الموقع:
- **Frontend**: `https://your-site.netlify.app`
- **Backend**: `https://your-backend.railway.app/api/ask`

## ✅ **النتيجة النهائية:**
- **Frontend**: يعمل على Netlify
- **Backend**: يعمل على Railway  
- **Database**: MongoDB Atlas
- **SSL**: مجاني على كلا الموقعين

---
**نصيحة**: ابدأ برفع Frontend أولاً، ثم Backend! 🚀
