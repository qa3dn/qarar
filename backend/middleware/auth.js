const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

// Middleware للتحقق من JWT Token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Token مطلوب',
        message: 'يرجى تسجيل الدخول أولاً'
      });
    }
    
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Token غير صالح',
        message: 'المستخدم غير موجود'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'الحساب معطل',
        message: 'تم تعطيل حسابك'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token غير صالح',
        message: 'يرجى تسجيل الدخول مرة أخرى'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token منتهي الصلاحية',
        message: 'يرجى تسجيل الدخول مرة أخرى'
      });
    }
    
    console.error('Auth Error:', error);
    res.status(500).json({ 
      error: 'خطأ في المصادقة',
      message: 'حدث خطأ أثناء التحقق من الهوية'
    });
  }
};

// Middleware اختياري للمصادقة (لا يمنع الوصول)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // تجاهل الأخطاء في المصادقة الاختيارية
    next();
  }
};

// التحقق من ملكية الملف الشخصي
const checkProfileOwnership = async (req, res, next) => {
  try {
    const { username } = req.params;
    
    if (!req.user) {
      return res.status(401).json({
        error: 'غير مصرح',
        message: 'يرجى تسجيل الدخول أولاً'
      });
    }
    
    if (req.user.username !== username) {
      return res.status(403).json({
        error: 'غير مصرح',
        message: 'لا يمكنك تعديل ملف شخصي آخر'
      });
    }
    
    next();
  } catch (error) {
    console.error('Profile Ownership Error:', error);
    res.status(500).json({
      error: 'خطأ في التحقق من الصلاحيات',
      message: 'حدث خطأ أثناء التحقق من الصلاحيات'
    });
  }
};

// التحقق من صحة بيانات التسجيل
const validateRegistration = (req, res, next) => {
  const { username, email, password, firstName, lastName } = req.body;
  
  // التحقق من وجود جميع البيانات المطلوبة
  if (!username || !email || !password || !firstName || !lastName) {
    return res.status(400).json({
      error: 'بيانات ناقصة',
      message: 'يرجى ملء جميع الحقول المطلوبة'
    });
  }
  
  // التحقق من طول اسم المستخدم
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({
      error: 'اسم المستخدم غير صحيح',
      message: 'يجب أن يكون اسم المستخدم بين 3 و 20 حرف'
    });
  }
  
  // التحقق من صحة البريد الإلكتروني
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'البريد الإلكتروني غير صحيح',
      message: 'يرجى إدخال بريد إلكتروني صحيح'
    });
  }
  
  // التحقق من طول كلمة المرور
  if (password.length < 6) {
    return res.status(400).json({
      error: 'كلمة المرور ضعيفة',
      message: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل'
    });
  }
  
  // التحقق من طول الاسم
  if (firstName.length < 2 || lastName.length < 2) {
    return res.status(400).json({
      error: 'الاسم غير صحيح',
      message: 'يجب أن يكون الاسم الأول والأخير حرفين على الأقل'
    });
  }
  
  next();
};

// التحقق من صحة تحديث الملف الشخصي
const validateProfileUpdate = (req, res, next) => {
  const { firstName, lastName, bio } = req.body;
  
  if (firstName && (firstName.length < 2 || firstName.length > 50)) {
    return res.status(400).json({
      error: 'الاسم الأول غير صحيح',
      message: 'يجب أن يكون الاسم الأول بين 2 و 50 حرف'
    });
  }
  
  if (lastName && (lastName.length < 2 || lastName.length > 50)) {
    return res.status(400).json({
      error: 'الاسم الأخير غير صحيح',
      message: 'يجب أن يكون الاسم الأخير بين 2 و 50 حرف'
    });
  }
  
  if (bio && bio.length > 500) {
    return res.status(400).json({
      error: 'النبذة طويلة جداً',
      message: 'يجب أن تكون النبذة أقل من 500 حرف'
    });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  checkProfileOwnership,
  validateRegistration,
  validateProfileUpdate
}; 