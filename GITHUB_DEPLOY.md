# 🚀 رفع المشروع على GitHub

## 📋 **الخطوات:**

### 1. **إنشاء Repository على GitHub:**
1. اذهب إلى [github.com](https://github.com)
2. اضغط "New repository"
3. اسم المشروع: `qarar` (أو أي اسم تريده)
4. اختر "Public" أو "Private"
5. **لا تضع علامة** على "Add a README file"
6. اضغط "Create repository"

### 2. **رفع المشروع:**
```bash
# في مجلد المشروع
git init
git add .
git commit -m "Initial commit: Qarar Decision Making Website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/qarar.git
git push -u origin main
```

### 3. **بعد الرفع على GitHub:**

#### **رفع Frontend على Netlify:**
1. اذهب إلى [netlify.com](https://netlify.com)
2. اختر "New site from Git"
3. اختر GitHub وحدد المشروع
4. في Build settings:
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/public`
5. اضغط "Deploy site"

#### **رفع Backend على Railway:**
1. اذهب إلى [railway.app](https://railway.app)
2. اختر "Deploy from GitHub repo"
3. اختر المشروع
4. في إعدادات:
   - **Root Directory**: `backend`
5. أضف Environment Variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secret
   OPENROUTER_API_KEY=your-key
   PORT=3000
   NODE_ENV=production
   ```

## ✅ **النتيجة:**
- **GitHub**: `https://github.com/YOUR_USERNAME/qarar`
- **Frontend**: `https://your-site.netlify.app`
- **Backend**: `https://your-backend.railway.app`

---
**ملاحظة**: استبدل `YOUR_USERNAME` باسم المستخدم الحقيقي!
