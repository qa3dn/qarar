# 🚀 قررلي - Backend API

## 📋 الوصف
Backend API لموقع قررلي - نظام قرارات ذكي باللغة العربية

## 🛠️ التقنيات المستخدمة
- **Node.js** - بيئة التشغيل
- **Express.js** - إطار العمل
- **MongoDB** - قاعدة البيانات
- **Mongoose** - ODM
- **JWT** - المصادقة
- **OpenRouter API** - الذكاء الاصطناعي

## 📁 هيكل المشروع
```
backend/
├── server.js          # الخادم الرئيسي
├── config.js          # إعدادات قاعدة البيانات
├── middleware/        # الوسطاء
│   └── auth.js        # مصادقة المستخدمين
├── models/           # نماذج البيانات
│   ├── User.js       # نموذج المستخدم
│   └── History.js    # نموذج التاريخ
└── routes/           # المسارات
    ├── auth.js       # مسارات المصادقة
    └── profile.js    # مسارات الملف الشخصي
```

## 🚀 التثبيت والتشغيل

### 1. تثبيت التبعيات
```bash
npm install
```

### 2. إعداد متغيرات البيئة
```bash
# انسخ ملف .env.example إلى .env
cp .env.example .env

# عدّل القيم في ملف .env
```

### 3. تشغيل الخادم
```bash
# وضع التطوير
npm run dev

# وضع الإنتاج
npm start
```

## 🔧 متغيرات البيئة المطلوبة
- `MONGODB_URI` - رابط قاعدة البيانات
- `JWT_SECRET` - مفتاح JWT
- `OPENROUTER_API_KEY` - مفتاح OpenRouter API

## 📡 API Endpoints

### المصادقة
- `POST /api/register` - تسجيل حساب جديد
- `POST /api/login` - تسجيل الدخول
- `POST /api/logout` - تسجيل الخروج

### القرارات
- `POST /api/ask` - سؤال عادي (فكاهي)
- `POST /api/serious-ask` - سؤال جدي (تحليلي)

### الملف الشخصي
- `GET /api/profile` - جلب بيانات الملف الشخصي
- `PUT /api/profile` - تحديث الملف الشخصي

## 📝 ملاحظات
- الخادم يعمل على المنفذ 3000
- جميع الاستجابات باللغة العربية
- يدعم رفع الصور للملف الشخصي
