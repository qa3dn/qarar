# 🚀 رفع Backend مباشرة على Railway (بدون GitHub)

## 📋 **الطريقة الأولى: Railway CLI**

### 1. **تحميل Railway CLI:**
```bash
# Windows (PowerShell)
iwr https://railway.app/install.ps1 -useb | iex
```

### 2. **تسجيل الدخول:**
```bash
railway login
```

### 3. **رفع المشروع:**
```bash
# اذهب لمجلد backend
cd backend

# ارفع المشروع
railway up
```

### 4. **إعداد Environment Variables:**
```bash
# في Railway Dashboard أو CLI
railway variables set MONGODB_URI="mongodb+srv://..."
railway variables set JWT_SECRET="your-secret"
railway variables set OPENROUTER_API_KEY="your-key"
railway variables set PORT="3000"
railway variables set NODE_ENV="production"
```

### 5. **احصل على الرابط:**
```bash
railway domain
```

---

## 📋 **الطريقة الثانية: Railway Web (بدون CLI)**

### 1. **اذهب إلى [railway.app](https://railway.app)**
### 2. **اختر "Deploy from folder"**
### 3. **اسحب مجلد `backend`** مباشرة
### 4. **أضف Environment Variables في Dashboard**

---

## 📋 **الطريقة الثالثة: Railway + GitHub (أسهل)**

### 1. **ارفع المشروع على GitHub** (مرة واحدة فقط)
### 2. **في Railway:**
   - **اختر "Deploy from GitHub"**
   - **اختر المشروع**
   - **حدد Root Directory: `backend`**
   - **أضف Environment Variables**

---

## ✅ **أي طريقة تختار؟**

- **CLI**: أسرع وأسهل للتحكم
- **Web**: بدون تحميل برامج
- **GitHub**: أفضل للتعاون والتحديثات

**أنصح بـ CLI!** 🚀
