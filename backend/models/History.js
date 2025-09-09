const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // نوع النشاط
  type: {
    type: String,
    enum: ['decision', 'question'],
    required: true
  },
  
  // محتوى النشاط
  content: {
    question: String,        // السؤال (للقرارات المخصصة)
    answer: String,          // الرد أو القرار
    category: String,        // فئة القرار (للقررات الجاهزة)
    isCustom: { type: Boolean, default: false }
  },
  
  // معلومات إضافية
  metadata: {
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    responseTime: Number,    // وقت الاستجابة بالميلي ثانية
    tokensUsed: Number,      // عدد الـ tokens المستخدمة (للأسئلة المخصصة)
    model: String           // النموذج المستخدم
  },
  
  // حالة النشاط
  status: {
    type: String,
    enum: ['success', 'error', 'pending'],
    default: 'success'
  },
  
  // معلومات التوقيت
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes للبحث السريع
historySchema.index({ user: 1, createdAt: -1 });
historySchema.index({ user: 1, type: 1 });
historySchema.index({ 'content.category': 1 });
historySchema.index({ createdAt: -1 });

// Methods
historySchema.statics.getUserHistory = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username profilePicture');
};

historySchema.statics.getUserStats = function(userId) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalDecisions: {
          $sum: { $cond: [{ $eq: ['$type', 'decision'] }, 1, 0] }
        },
        totalQuestions: {
          $sum: { $cond: [{ $eq: ['$type', 'question'] }, 1, 0] }
        },
        todayDecisions: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$type', 'decision'] },
                  { $gte: ['$createdAt', startOfToday] }
                ]
              },
              1,
              0
            ]
          }
        },
        todayQuestions: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$type', 'question'] },
                  { $gte: ['$createdAt', startOfToday] }
                ]
              },
              1,
              0
            ]
          }
        },
        averageResponseTime: { $avg: '$metadata.responseTime' },
        totalTokensUsed: { $sum: '$metadata.tokensUsed' }
      }
    }
  ]);
};

historySchema.statics.getPopularCategories = function(userId) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$content.category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
};

historySchema.statics.getRecentActivity = function(userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('type content.category content.question content.answer createdAt');
};

// Virtual for formatted date
historySchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Ensure virtuals are serialized
historySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('History', historySchema); 