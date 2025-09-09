const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // معلومات أساسية
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() { return !this.googleId; }, // مطلوب فقط إذا لم يسجل بـ Google
    minlength: 6
  },
  
  // معلومات Google OAuth
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  googleEmail: String,
  googleName: String,
  googlePicture: String,
  
  // معلومات إضافية
  firstName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  profilePicture: {
    type: String,
    default: '/images/default-avatar.png'
  },
  bio: {
    type: String,
    maxlength: 500,
    default: 'مستخدم في قررلي 🎲'
  },
  
  // إحصائيات
  stats: {
    totalDecisions: { type: Number, default: 0 },
    todayDecisions: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    todayQuestions: { type: Number, default: 0 },
    joinDate: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now }
  },
  
  // إعدادات
  settings: {
    emailNotifications: { type: Boolean, default: true },
    publicProfile: { type: Boolean, default: true },
    language: { type: String, default: 'ar' },
    theme: { type: String, default: 'space' }
  },
  
  // الإنجازات
  achievements: {
    firstDecision: { type: Boolean, default: false },
    decisionMaster: { type: Boolean, default: false },  // 50 قرار
    questionExpert: { type: Boolean, default: false },  // 25 سؤال
    dailyUser: { type: Boolean, default: false },       // 7 أيام متتالية
    socialSharer: { type: Boolean, default: false },    // 10 مشاركات
    moodTracker: { type: Boolean, default: false }      // 5 أيام تسجيل مزاج
  },
  
  // تتبع المزاج
  moodHistory: [{
    mood: { 
      type: String, 
      enum: ['happy', 'excited', 'calm', 'confused', 'stressed'] 
    },
    date: { type: Date, default: Date.now },
    message: String
  }],
  
  // الفئات المفضلة
  categoryStats: {
    love: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    work: { type: Number, default: 0 },
    crazy: { type: Number, default: 0 },
    life: { type: Number, default: 0 }
  },
  
  // إحصائيات إضافية
  additionalStats: {
    longestStreak: { type: Number, default: 0 },    // أطول فترة استخدام متتالية
    currentStreak: { type: Number, default: 0 },    // الفترة الحالية
    lastStreakDate: { type: Date, default: Date.now },
    totalShares: { type: Number, default: 0 },      // عدد المشاركات
    moodDaysCount: { type: Number, default: 0 }     // عدد أيام تسجيل المزاج
  },
  
  // حالة الحساب
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Middleware لتشفير كلمة المرور
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware لتحديث الإحصائيات اليومية
userSchema.pre('save', function(next) {
  const now = new Date();
  const lastActive = this.stats.lastActive;
  
  // إعادة تعيين الإحصائيات اليومية إذا كان اليوم مختلف
  if (lastActive && (
      lastActive.getDate() !== now.getDate() || 
      lastActive.getMonth() !== now.getMonth() || 
      lastActive.getFullYear() !== now.getFullYear())) {
    
    // فقط إعادة تعيين إذا كان يوم جديد، وليس في نفس اليوم
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActiveStart = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
    
    if (todayStart.getTime() !== lastActiveStart.getTime()) {
      this.stats.todayDecisions = 0;
      this.stats.todayQuestions = 0;
    }
  }
  
  this.stats.lastActive = now;
  next();
});

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incrementDecisions = async function(category = null) {
  this.stats.totalDecisions += 1;
  this.stats.todayDecisions += 1;
  
  // تحديث إحصائيات الفئة
  if (category && this.categoryStats[category] !== undefined) {
    this.categoryStats[category] += 1;
  }
  
  // تحديث الـ streak
  await this.updateStreak();
  
  // التحقق من الإنجازات الجديدة
  const newAchievements = this.checkAchievements();
  
  const result = await this.save();
  
  // إرجاع الإنجازات الجديدة للإشعار
  return { user: result, newAchievements };
};

userSchema.methods.incrementQuestions = async function() {
  this.stats.totalQuestions += 1;
  this.stats.todayQuestions += 1;
  
  // تحديث الـ streak
  await this.updateStreak();
  
  // التحقق من الإنجازات الجديدة
  const newAchievements = this.checkAchievements();
  
  const result = await this.save();
  
  // إرجاع الإنجازات الجديدة للإشعار
  return { user: result, newAchievements };
};

// تحديث إحصائيات الفئات
userSchema.methods.incrementCategory = function(category) {
  if (this.categoryStats[category] !== undefined) {
    this.categoryStats[category] += 1;
  }
  return this.save();
};

// إضافة مزاج يومي
userSchema.methods.addMoodEntry = function(mood, message = '') {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // التحقق من وجود مزاج اليوم
  const existingMood = this.moodHistory.find(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });
  
  if (existingMood) {
    // تحديث المزاج الموجود
    existingMood.mood = mood;
    existingMood.message = message;
  } else {
    // إضافة مزاج جديد
    this.moodHistory.push({ mood, message, date: new Date() });
    this.additionalStats.moodDaysCount += 1;
  }
  
  // الاحتفاظ بآخر 30 يوم فقط
  if (this.moodHistory.length > 30) {
    this.moodHistory = this.moodHistory.slice(-30);
  }
  
  this.checkAchievements();
  return this.save();
};

// الحصول على مزاج اليوم
userSchema.methods.getTodayMood = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.moodHistory.find(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });
};

// تحديث إحصائيات الـ Streak
userSchema.methods.updateStreak = function() {
  const now = new Date();
  const lastDate = new Date(this.additionalStats.lastStreakDate);
  
  // حساب الفرق بالأيام
  const diffTime = Math.abs(now - lastDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    // يوم متتالي
    this.additionalStats.currentStreak += 1;
    if (this.additionalStats.currentStreak > this.additionalStats.longestStreak) {
      this.additionalStats.longestStreak = this.additionalStats.currentStreak;
    }
  } else if (diffDays > 1) {
    // انقطاع في الاستخدام
    this.additionalStats.currentStreak = 1;
  }
  // إذا كان نفس اليوم، لا نفعل شيء
  
  this.additionalStats.lastStreakDate = now;
};

// زيادة عدد المشاركات
userSchema.methods.incrementShares = function() {
  this.additionalStats.totalShares += 1;
  this.checkAchievements();
  return this.save();
};

// التحقق من الإنجازات
userSchema.methods.checkAchievements = function() {
  const newAchievements = [];
  
  // إنجاز أول قرار
  if (!this.achievements.firstDecision && this.stats.totalDecisions >= 1) {
    this.achievements.firstDecision = true;
    newAchievements.push('firstDecision');
  }
  
  // إنجاز خبير القرارات
  if (!this.achievements.decisionMaster && this.stats.totalDecisions >= 50) {
    this.achievements.decisionMaster = true;
    newAchievements.push('decisionMaster');
  }
  
  // إنجاز خبير الأسئلة
  if (!this.achievements.questionExpert && this.stats.totalQuestions >= 25) {
    this.achievements.questionExpert = true;
    newAchievements.push('questionExpert');
  }
  
  // إنجاز المستخدم اليومي
  if (!this.achievements.dailyUser && this.additionalStats.currentStreak >= 7) {
    this.achievements.dailyUser = true;
    newAchievements.push('dailyUser');
  }
  
  // إنجاز المشارك الاجتماعي
  if (!this.achievements.socialSharer && this.additionalStats.totalShares >= 10) {
    this.achievements.socialSharer = true;
    newAchievements.push('socialSharer');
  }
  
  // إنجاز متتبع المزاج
  if (!this.achievements.moodTracker && this.additionalStats.moodDaysCount >= 5) {
    this.achievements.moodTracker = true;
    newAchievements.push('moodTracker');
  }
  
  return newAchievements;
};

userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    firstName: this.firstName,
    lastName: this.lastName,
    profilePicture: this.profilePicture,
    bio: this.bio,
    stats: {
      totalDecisions: this.stats.totalDecisions,
      totalQuestions: this.stats.totalQuestions,
      joinDate: this.stats.joinDate
    },
    settings: {
      publicProfile: this.settings.publicProfile
    }
  };
};

// Indexes (تم تعريف unique: true في Schema)
userSchema.index({ 'stats.lastActive': -1 });

module.exports = mongoose.model('User', userSchema); 