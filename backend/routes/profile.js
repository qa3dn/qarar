const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const History = require('../models/History');
const { authenticateToken, checkProfileOwnership, validateProfileUpdate } = require('../middleware/auth');

const router = express.Router();

// إعداد Multer لرفع الصور
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('فقط ملفات الصور مسموحة (JPEG, JPG, PNG, GIF)'));
    }
  }
});

// الحصول على الملف الشخصي
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username }).select('-password -googleId -resetPasswordToken');
    
    if (!user) {
      return res.status(404).json({
        error: 'المستخدم غير موجود',
        message: 'لا يوجد مستخدم بهذا الاسم'
      });
    }
    
    if (!user.isActive) {
      return res.status(404).json({
        error: 'المستخدم غير موجود',
        message: 'لا يوجد مستخدم بهذا الاسم'
      });
    }
    
    // التحقق من إعدادات الخصوصية
    if (!user.settings.publicProfile && (!req.user || req.user._id.toString() !== user._id.toString())) {
      return res.status(403).json({
        error: 'الملف الشخصي خاص',
        message: 'هذا الملف الشخصي خاص'
      });
    }
    
    // الحصول على الإحصائيات من History و User معاً
    const historyStats = await History.getUserStats(user._id);
    const recentActivity = await History.getRecentActivity(user._id, 5);
    const popularCategories = await History.getPopularCategories(user._id);
    
    // دمج الإحصائيات من المصدرين
    const combinedStats = {
      // إحصائيات من User model (الأساسية)
      totalDecisions: user.stats.totalDecisions || 0,
      totalQuestions: user.stats.totalQuestions || 0,
      todayDecisions: user.stats.todayDecisions || 0,
      todayQuestions: user.stats.todayQuestions || 0,
      
      // إحصائيات إضافية من History
      averageResponseTime: historyStats[0]?.averageResponseTime || 0,
      totalTokensUsed: historyStats[0]?.totalTokensUsed || 0,
      
      // إحصائيات الـ streaks والإنجازات
      currentStreak: user.additionalStats?.currentStreak || 0,
      longestStreak: user.additionalStats?.longestStreak || 0,
      totalShares: user.additionalStats?.totalShares || 0,
      moodDaysCount: user.additionalStats?.moodDaysCount || 0
    };
    
    res.json({
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      stats: combinedStats,
      joinDate: user.stats.joinDate,
      lastActive: user.stats.lastActive,
      settings: {
        publicProfile: user.settings.publicProfile
      },
      achievements: user.achievements,
      categoryStats: user.categoryStats,
      recentActivity,
      popularCategories
    });
    
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      error: 'خطأ في جلب الملف الشخصي',
      message: 'حدث خطأ أثناء جلب بيانات الملف الشخصي'
    });
  }
});

// تحديث الملف الشخصي
router.put('/:username', authenticateToken, checkProfileOwnership, validateProfileUpdate, async (req, res) => {
  try {
    console.log('PUT /profile/:username - بدء التحديث');
    console.log('User ID:', req.user._id);
    console.log('Request Body:', req.body);
    
    const { firstName, lastName, bio, settings } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // تحديث المعلومات الأساسية
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    
    // تحديث الإعدادات
    if (settings) {
      if (settings.emailNotifications !== undefined) {
        user.settings.emailNotifications = settings.emailNotifications;
      }
      if (settings.publicProfile !== undefined) {
        user.settings.publicProfile = settings.publicProfile;
      }
      if (settings.language !== undefined) {
        user.settings.language = settings.language;
      }
      if (settings.theme !== undefined) {
        user.settings.theme = settings.theme;
      }
    }
    
    await user.save();
    
    res.json({
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        bio: user.bio,
        settings: user.settings
      }
    });
    
  } catch (error) {
    console.error('Update Profile Error:', error);
    console.error('Error Stack:', error.stack);
    res.status(500).json({
      error: 'خطأ في تحديث الملف الشخصي',
      message: 'حدث خطأ أثناء تحديث الملف الشخصي',
      details: error.message
    });
  }
});

// رفع صورة الملف الشخصي
router.post('/:username/avatar', authenticateToken, checkProfileOwnership, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'لم يتم رفع ملف',
        message: 'يرجى اختيار صورة'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    // حذف الصورة القديمة إذا كانت موجودة
    if (user.profilePicture && user.profilePicture !== '/images/default-avatar.png') {
      const oldImagePath = path.join(__dirname, '..', 'public', user.profilePicture);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    // تحديث مسار الصورة الجديدة
    user.profilePicture = '/uploads/profiles/' + req.file.filename;
    await user.save();
    
    res.json({
      message: 'تم رفع الصورة بنجاح',
      profilePicture: user.profilePicture
    });
    
  } catch (error) {
    console.error('Upload Avatar Error:', error);
    
    // حذف الملف المرفوع في حالة الخطأ
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'public', 'uploads', 'profiles', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({
      error: 'خطأ في رفع الصورة',
      message: 'حدث خطأ أثناء رفع الصورة'
    });
  }
});

// الحصول على تاريخ النشاط
router.get('/:username/history', authenticateToken, checkProfileOwnership, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const userId = req.user._id;
    
    let query = { user: userId };
    if (type && ['decision', 'question'].includes(type)) {
      query.type = type;
    }
    
    const history = await History.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await History.countDocuments(query);
    
    res.json({
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({
      error: 'خطأ في الحصول على التاريخ',
      message: 'حدث خطأ أثناء الحصول على التاريخ'
    });
  }
});

// الحصول على إحصائيات مفصلة
router.get('/:username/stats', authenticateToken, checkProfileOwnership, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const stats = await History.getUserStats(userId);
    const popularCategories = await History.getPopularCategories(userId);
    const recentActivity = await History.getRecentActivity(userId, 10);
    
    // إحصائيات أسبوعية
    const weeklyStats = await History.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' },
            type: '$type'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.week': -1 } },
      { $limit: 8 }
    ]);
    
    res.json({
      stats: stats[0] || {
        totalDecisions: 0,
        totalQuestions: 0,
        todayDecisions: 0,
        todayQuestions: 0,
        averageResponseTime: 0,
        totalTokensUsed: 0
      },
      popularCategories,
      recentActivity,
      weeklyStats
    });
    
  } catch (error) {
    console.error('Get Stats Error:', error);
    res.status(500).json({
      error: 'خطأ في الحصول على الإحصائيات',
      message: 'حدث خطأ أثناء الحصول على الإحصائيات'
    });
  }
});

// حذف حساب المستخدم
router.delete('/:username', authenticateToken, checkProfileOwnership, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // حذف الصورة الشخصية
    if (user.profilePicture && user.profilePicture !== '/images/default-avatar.png') {
      const imagePath = path.join(__dirname, '..', 'public', user.profilePicture);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // حذف التاريخ
    await History.deleteMany({ user: user._id });
    
    // حذف المستخدم
    await User.findByIdAndDelete(user._id);
    
    res.json({
      message: 'تم حذف الحساب بنجاح'
    });
    
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({
      error: 'خطأ في حذف الحساب',
      message: 'حدث خطأ أثناء حذف الحساب'
    });
  }
});

// إضافة أو تحديث مزاج اليوم
router.post('/:username/mood', authenticateToken, checkProfileOwnership, async (req, res) => {
  try {
    const { mood, message } = req.body;
    
    if (!['happy', 'excited', 'calm', 'confused', 'stressed'].includes(mood)) {
      return res.status(400).json({
        error: 'مزاج غير صالح',
        message: 'يرجى اختيار مزاج صحيح'
      });
    }
    
    const user = await User.findById(req.user._id);
    await user.addMoodEntry(mood, message);
    
    res.json({
      message: 'تم حفظ المزاج بنجاح',
      mood: user.getTodayMood()
    });
    
  } catch (error) {
    console.error('Add Mood Error:', error);
    res.status(500).json({
      error: 'خطأ في حفظ المزاج',
      message: 'حدث خطأ أثناء حفظ المزاج'
    });
  }
});

// الحصول على مزاج اليوم
router.get('/:username/mood/today', authenticateToken, checkProfileOwnership, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const todayMood = user.getTodayMood();
    
    res.json({
      mood: todayMood || null
    });
    
  } catch (error) {
    console.error('Get Today Mood Error:', error);
    res.status(500).json({
      error: 'خطأ في جلب المزاج',
      message: 'حدث خطأ أثناء جلب مزاج اليوم'
    });
  }
});

// الحصول على الإنجازات
router.get('/:username/achievements', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('achievements stats additionalStats');
    
    if (!user) {
      return res.status(404).json({
        error: 'المستخدم غير موجود',
        message: 'لا يوجد مستخدم بهذا الاسم'
      });
    }
    
    const achievementsList = [
      {
        id: 'firstDecision',
        title: 'أول قرار',
        description: 'اتخذت أول قرار!',
        icon: '🎯',
        unlocked: user.achievements?.firstDecision || false
      },
      {
        id: 'decisionMaster',
        title: 'خبير القرارات',
        description: 'اتخذت 50 قرار',
        icon: '🏆',
        unlocked: user.achievements?.decisionMaster || false,
        progress: Math.min(user.stats?.totalDecisions || 0, 50),
        total: 50
      },
      {
        id: 'questionExpert',
        title: 'خبير الأسئلة',
        description: 'سألت 25 سؤال',
        icon: '🧠',
        unlocked: user.achievements?.questionExpert || false,
        progress: Math.min(user.stats?.totalQuestions || 0, 25),
        total: 25
      },
      {
        id: 'dailyUser',
        title: 'مستخدم يومي',
        description: 'استخدمت التطبيق 7 أيام متتالية',
        icon: '🔥',
        unlocked: user.achievements?.dailyUser || false,
        progress: Math.min(user.additionalStats?.currentStreak || 0, 7),
        total: 7
      },
      {
        id: 'socialSharer',
        title: 'المشارك الاجتماعي',
        description: 'شاركت 10 قرارات',
        icon: '📱',
        unlocked: user.achievements?.socialSharer || false,
        progress: Math.min(user.additionalStats?.totalShares || 0, 10),
        total: 10
      },
      {
        id: 'moodTracker',
        title: 'متتبع المزاج',
        description: 'سجلت مزاجك 5 أيام',
        icon: '😊',
        unlocked: user.achievements?.moodTracker || false,
        progress: Math.min(user.additionalStats?.moodDaysCount || 0, 5),
        total: 5
      }
    ];
    
    res.json({
      achievements: achievementsList,
      totalUnlocked: Object.values(user.achievements).filter(Boolean).length
    });
    
  } catch (error) {
    console.error('Get Achievements Error:', error);
    res.status(500).json({
      error: 'خطأ في جلب الإنجازات',
      message: 'حدث خطأ أثناء جلب الإنجازات'
    });
  }
});

// زيادة عدد المشاركات
router.post('/:username/share', authenticateToken, checkProfileOwnership, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    await user.incrementShares();
    
    res.json({
      message: 'تم تسجيل المشاركة بنجاح',
      totalShares: user.additionalStats.totalShares
    });
    
  } catch (error) {
    console.error('Increment Share Error:', error);
    res.status(500).json({
      error: 'خطأ في تسجيل المشاركة',
      message: 'حدث خطأ أثناء تسجيل المشاركة'
    });
  }
});

// الحصول على إحصائيات الرسوم البيانية
router.get('/:username/charts', authenticateToken, checkProfileOwnership, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // بيانات النشاط الأسبوعي (مؤقتة - يمكن تحسينها لاحقاً)
    const weeklyData = {
      decisions: [
        user.stats.todayDecisions || 0,
        Math.floor(Math.random() * 20),
        Math.floor(Math.random() * 15),
        Math.floor(Math.random() * 18),
        Math.floor(Math.random() * 22),
        Math.floor(Math.random() * 16),
        Math.floor(Math.random() * 14)
      ],
      questions: [
        user.stats.todayQuestions || 0,
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 8),
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 9),
        Math.floor(Math.random() * 7),
        Math.floor(Math.random() * 6)
      ]
    };
    
    // بيانات توزيع الفئات
    const categoryData = {
      labels: ['حب وعلاقات', 'أكل', 'شغل', 'مجنون', 'حياة'],
      data: [
        user.categoryStats?.love || 0,
        user.categoryStats?.food || 0,
        user.categoryStats?.work || 0,
        user.categoryStats?.crazy || 0,
        user.categoryStats?.life || 0
      ]
    };
    
    res.json({
      weeklyData,
      categoryData,
      totalDecisions: user.stats.totalDecisions,
      currentStreak: user.additionalStats.currentStreak,
      longestStreak: user.additionalStats.longestStreak
    });
    
  } catch (error) {
    console.error('Get Charts Error:', error);
    res.status(500).json({
      error: 'خطأ في جلب بيانات الرسوم البيانية',
      message: 'حدث خطأ أثناء جلب البيانات'
    });
  }
});

module.exports = router; 