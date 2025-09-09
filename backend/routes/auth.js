const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const History = require('../models/History');
const { authenticateToken, validateRegistration } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// إنشاء JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: '30d' });
};

// تسجيل حساب جديد
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    // التحقق من عدم وجود المستخدم
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          error: 'البريد الإلكتروني مستخدم',
          message: 'هذا البريد الإلكتروني مسجل مسبقاً'
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({
          error: 'اسم المستخدم مستخدم',
          message: 'هذا اسم المستخدم مسجل مسبقاً'
        });
      }
    }
    
    // إنشاء المستخدم
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      isVerified: true // مؤقتاً، يمكن إضافة التحقق لاحقاً
    });
    
    await user.save();
    
    // إنشاء Token
    const token = generateToken(user._id);
    
    res.status(201).json({
      message: 'تم إنشاء الحساب بنجاح',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        stats: user.stats
      }
    });
    
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      error: 'خطأ في إنشاء الحساب',
      message: 'حدث خطأ أثناء إنشاء الحساب'
    });
  }
});

// تسجيل الدخول
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'بيانات ناقصة',
        message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
      });
    }
    
    // البحث عن المستخدم
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        error: 'بيانات غير صحيحة',
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }
    
    // التحقق من كلمة المرور
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'بيانات غير صحيحة',
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        error: 'الحساب معطل',
        message: 'تم تعطيل حسابك'
      });
    }
    
    // تحديث آخر نشاط
    user.stats.lastActive = new Date();
    await user.save();
    
    // إنشاء Token
    const token = generateToken(user._id);
    
    res.json({
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        stats: user.stats
      }
    });
    
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      error: 'خطأ في تسجيل الدخول',
      message: 'حدث خطأ أثناء تسجيل الدخول'
    });
  }
});

// تسجيل الدخول بـ Google
router.post('/google', async (req, res) => {
  try {
    const { googleId, email, name, picture } = req.body;
    
    if (!googleId || !email) {
      return res.status(400).json({
        error: 'بيانات ناقصة',
        message: 'يرجى إدخال بيانات Google'
      });
    }
    
    // البحث عن المستخدم
    let user = await User.findOne({ googleId });
    
    if (!user) {
      // البحث بالبريد الإلكتروني
      user = await User.findOne({ email });
      
      if (user) {
        // ربط حساب Google بالحساب الموجود
        user.googleId = googleId;
        user.googleEmail = email;
        user.googleName = name;
        user.googlePicture = picture;
        user.isVerified = true;
      } else {
        // إنشاء حساب جديد
        const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
        
        user = new User({
          username,
          email,
          googleId,
          googleEmail: email,
          googleName: name,
          googlePicture: picture,
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' '),
          profilePicture: picture,
          isVerified: true,
          isActive: true,
          stats: {
            joinDate: new Date(),
            lastActive: new Date(),
            totalDecisions: 0,
            totalQuestions: 0,
            todayDecisions: 0,
            todayQuestions: 0
          },
          settings: {
            publicProfile: true,
            language: 'ar',
            theme: 'dark'
          }
        });
        
        await user.save();
      }
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        error: 'الحساب معطل',
        message: 'تم تعطيل حسابك'
      });
    }
    
    // تحديث آخر نشاط
    user.stats.lastActive = new Date();
    await user.save();
    
    // إنشاء Token
    const token = generateToken(user._id);
    
    res.json({
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        stats: user.stats
      }
    });
    
  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(500).json({
      error: 'خطأ في تسجيل الدخول بـ Google',
      message: 'حدث خطأ أثناء تسجيل الدخول'
    });
  }
});

// الحصول على معلومات المستخدم
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        bio: user.bio,
        stats: user.stats,
        settings: user.settings,
        isVerified: user.isVerified
      }
    });
    
  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({
      error: 'خطأ في الحصول على معلومات المستخدم',
      message: 'حدث خطأ أثناء الحصول على المعلومات'
    });
  }
});

// تحديث كلمة المرور
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'بيانات ناقصة',
        message: 'يرجى إدخال كلمة المرور الحالية والجديدة'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'كلمة المرور ضعيفة',
        message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    // التحقق من كلمة المرور الحالية
    if (!await user.comparePassword(currentPassword)) {
      return res.status(401).json({
        error: 'كلمة المرور الحالية غير صحيحة',
        message: 'يرجى إدخال كلمة المرور الحالية الصحيحة'
      });
    }
    
    // تحديث كلمة المرور
    user.password = newPassword;
    await user.save();
    
    res.json({
      message: 'تم تحديث كلمة المرور بنجاح'
    });
    
  } catch (error) {
    console.error('Password Update Error:', error);
    res.status(500).json({
      error: 'خطأ في تحديث كلمة المرور',
      message: 'حدث خطأ أثناء تحديث كلمة المرور'
    });
  }
});

// إعادة تعيين كلمة المرور
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: 'البريد الإلكتروني مطلوب',
        message: 'يرجى إدخال البريد الإلكتروني'
      });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        error: 'المستخدم غير موجود',
        message: 'لا يوجد حساب بهذا البريد الإلكتروني'
      });
    }
    
    // إنشاء token لإعادة تعيين كلمة المرور
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // ساعة واحدة
    
    // هنا يمكن إرسال بريد إلكتروني مع الرابط
    // للتبسيط، سنرجع الرسالة مباشرة
    
    res.json({
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
    });
    
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({
      error: 'خطأ في إعادة تعيين كلمة المرور',
      message: 'حدث خطأ أثناء إرسال رابط إعادة التعيين'
    });
  }
});

// تسجيل الخروج
router.post('/logout', async (req, res) => {
  try {
    // في JWT، لا نحتاج لحذف شيء من الخادم
    // يمكن إضافة blacklist للـ tokens إذا لزم الأمر
    
    res.json({
      message: 'تم تسجيل الخروج بنجاح'
    });
    
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({
      error: 'خطأ في تسجيل الخروج',
      message: 'حدث خطأ أثناء تسجيل الخروج'
    });
  }
});

module.exports = router; 