const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const config = require("./config");

const app = express();
const PORT = config.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend/public")));

// استيراد النماذج والمكتبات
const User = require('./models/User');
const History = require('./models/History');
const { optionalAuth } = require('./middleware/auth');

// ربط قاعدة البيانات
mongoose.connect(config.MONGODB_URI)
  .then(() => {
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
  })
  .catch((error) => {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
  });

// استيراد Routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

// استخدام Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// قائمة القرارات العشوائية
const decisions = {
  love: [
    "اعترف لمها اليوم! 💕",
    "اتصل بصديقك القديم",
    "اعمل مفاجأة لشخص تحبه",
    "اكتب رسالة حب لنفسك",
    "اعزم شخص على قهوة"
  ],
  food: [
    "اطلب بيتزا الساعة 2 الصبح! 🍕",
    "جرب مطعم جديد اليوم",
    "اطبخ وصفة جديدة",
    "كل آيس كريم وانسى الدايت",
    "اعزم صديقك على عشاء"
  ],
  work: [
    "اطلب إجازة غداً",
    "تعلم مهارة جديدة",
    "غير مكتبك في الشغل",
    "قدم استقالتك! (مزح 😅)",
    "اطلب زيادة راتب"
  ],
  crazy: [
    "اقطع شعرك بنفسك",
    "سافر لمكان عشوائي",
    "ارقص في الشارع",
    "غني بصوت عالي",
    "ارسم على حائط البيت"
  ],
  life: [
    "ابدأ مشروع جديد",
    "تعلم لغة جديدة",
    "سجل في صالة رياضة",
    "اقرأ كتاب جديد",
    "تطوع في مكان ما"
  ]
};

// API Routes
app.get("/api/decisions", (req, res) => {
  res.json(decisions);
});

app.get("/api/random", optionalAuth, async (req, res) => {
  const categories = Object.keys(decisions);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const categoryDecisions = decisions[randomCategory];
  const randomDecision = categoryDecisions[Math.floor(Math.random() * categoryDecisions.length)];
  
  // تسجيل التاريخ إذا كان المستخدم مسجل دخول
  if (req.user) {
    try {
      const history = new History({
        user: req.user._id,
        type: 'decision',
        content: {
          answer: randomDecision,
          category: randomCategory,
          isCustom: false
        },
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
      
      await history.save();
      
      // تحديث إحصائيات المستخدم
      const result = await req.user.incrementDecisions(randomCategory);
      
      // إرسال إشعار عن الإنجازات الجديدة
      if (result.newAchievements.length > 0) {
        console.log(`🏆 إنجازات جديدة للمستخدم ${req.user.username}:`, result.newAchievements);
      }
    } catch (historyError) {
      console.error('History Save Error:', historyError);
      // لا نوقف العملية إذا فشل حفظ التاريخ
    }
  }
  
  res.json({
    decision: randomDecision,
    category: randomCategory,
    message: "🎲 قرارك العشوائي جاهز!"
  });
});

app.get("/api/decision/:category", optionalAuth, async (req, res) => {
  const category = req.params.category;
  if (decisions[category]) {
    const randomDecision = decisions[category][Math.floor(Math.random() * decisions[category].length)];
    
    // تسجيل التاريخ إذا كان المستخدم مسجل دخول
    if (req.user) {
      try {
        const history = new History({
          user: req.user._id,
          type: 'decision',
          content: {
            answer: randomDecision,
            category: category,
            isCustom: false
          },
          metadata: {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        });
        
        await history.save();
        
        // تحديث إحصائيات المستخدم
        const result = await req.user.incrementDecisions(category);
        
        // إرسال إشعار عن الإنجازات الجديدة
        if (result.newAchievements.length > 0) {
          console.log(`🏆 إنجازات جديدة للمستخدم ${req.user.username}:`, result.newAchievements);
        }
      } catch (historyError) {
        console.error('History Save Error:', historyError);
        // لا نوقف العملية إذا فشل حفظ التاريخ
      }
    }
    
    res.json({
      decision: randomDecision,
      category: category,
      message: `🎲 قرار عشوائي في فئة ${category}!`
    });
  } else {
    res.status(404).json({
      error: "فئة غير موجودة",
      message: "هذه الفئة غير موجودة في قائمة القرارات"
    });
  }
});

// OpenRouter AI API Integration مع تسجيل التاريخ
app.post("/api/ask", optionalAuth, async (req, res) => {
  const userMessage = req.body.message;
  const startTime = Date.now();
  
  if (!userMessage || userMessage.trim().length === 0) {
    return res.status(400).json({
      error: "رسالة فارغة",
      message: "يرجى إدخال سؤال أو طلب"
    });
  }
  
  try {
    const response = await axios.post(
      `${config.OPENROUTER_CONFIG.baseURL}/chat/completions`,
      {
        model: 'openai/gpt-4o',
        messages: [
          {
            role: "system",
            content: `أنت شخصية فكاهية تحب تقرر بسرعة وبمرح! 😄 

أجب بقرار مباشر وقصير مع فكاهة وايموجي.
مثال: "شو أكل؟" → "كل شاورما! 🌯 الحياة قصيرة!"

أجوبة قصيرة (30 كلمة بس!) وفكاهية! 

مهمتك بسيطة:
1. اقرأ السؤال
2. فكر بسرعة واتخذ قراراً واضحاً ومحدداً 
3. اكتب الجواب بطريقة فكاهية ومرحة

قواعد مهمة:
- الجواب لازم يكون مختصر (30-50 كلمة بس!)
- لازم يكون فيه قرار واضح ومحدد
- استخدم الفكاهة والايموجي
- ما تخاف تكون جريء شوي 😉
- اكتب بطريقة طبيعية (مش لازم تقول "افعل" بكل مرة)

أمثلة:
- "شو أكل اليوم؟" → "كل شاورما وانسى الدايت! 🌯 الحياة قصيرة والشاورما لذيذة!"
- "هل أسافر؟" → "روح فوراً! ✈️ المغامرات ما بتستنى حدا!"
- "شو أشرب؟" → "قهوة تركية قوية تخليك تطير! ☕ منيح للصحو!"
- "مش عارف أغير شغلي" → "غير شغلك فوراً! 💼 الحياة قصيرة وانت تستحق الأفضل!"

أجب باللغة العربية بطريقة مرحة وقرر فوراً!`
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: 80,
        temperature: 0.7
      },
      {
        headers: {
          "Authorization": `Bearer ${config.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://qarar-decision-maker.vercel.app",
          "X-Title": "Qarar Decision Maker"
        },
        timeout: 30000 // 30 ثانية timeout
      }
    );
    
    const botReply = response.data.choices[0].message.content;
    const responseTime = Date.now() - startTime;
    
    // تسجيل التاريخ إذا كان المستخدم مسجل دخول
    if (req.user) {
      try {
        const history = new History({
          user: req.user._id,
          type: 'question',
          content: {
            question: userMessage,
            answer: botReply,
            isCustom: true
          },
          metadata: {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            responseTime,
            tokensUsed: response.data.usage?.total_tokens || 0,
            model: 'openai/gpt-4o'
          }
        });
        
        await history.save();
        
        // تحديث إحصائيات المستخدم
        const result = await req.user.incrementQuestions();
        
        // إرسال إشعار عن الإنجازات الجديدة (يمكن تطويره لاحقاً)
        if (result.newAchievements.length > 0) {
          console.log(`🏆 إنجازات جديدة للمستخدم ${req.user.username}:`, result.newAchievements);
        }
      } catch (historyError) {
        console.error('History Save Error:', historyError);
        // لا نوقف العملية إذا فشل حفظ التاريخ
      }
    }
    
    res.json({ reply: botReply });
    
  } catch (error) {
    console.error("OpenRouter API Error:", error.response?.data || error.message);
    
    let errorMessage = "عذراً، حدث خطأ في معالجة طلبك";
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = "انتهت مهلة الاتصال، حاول مرة أخرى";
    } else if (error.response?.status === 401) {
      errorMessage = "خطأ في مفتاح API";
    } else if (error.response?.status === 429) {
      errorMessage = "تم تجاوز الحد المسموح، حاول لاحقاً";
    } else if (error.response?.status === 500) {
      errorMessage = "خطأ في الخادم، حاول لاحقاً";
    }
    
    res.status(500).json({
      error: "خطأ في API",
      message: errorMessage
    });
  }
});

// API للقرارات الجدية (منفصل)
app.post('/api/serious-ask', async (req, res) => {
  const { message: userMessage } = req.body;
  const startTime = Date.now();
  
  if (!userMessage || userMessage.trim().length === 0) {
    return res.status(400).json({
      error: "رسالة فارغة",
      message: "يرجى إدخال سؤال جدي"
    });
  }
  
  try {
    const response = await axios.post(
      `${config.OPENROUTER_CONFIG.baseURL}/chat/completions`,
      {
        model: 'openai/gpt-4o',
        messages: [
          {
            role: "system",
            content: `أنت مستشار متخصص في اتخاذ القرارات الجدية والحاسمة! 

مهمتك تقديم قرارات مفصلة ومحترفة للأسئلة الجدية مع التركيز على:

1. **التحليل**: تحليل مفصل للموقف بناءً على المعلومات المتاحة
2. **المخاطر والفوائد**: تقييم شامل للمخاطر والفوائد المحتملة  
3. **الخطوات التالية**: خطوات عملية واضحة للتنفيذ

قواعد مهمة:
- استخدم لغة جادة ومهنية تماماً
- لا تستخدم الفكاهة أو الايموجي أو النكات
- قدم تحليلاً عميقاً ومدروساً
- كن مباشراً وواضحاً في التوصيات
- اكتب باللغة العربية
- اجعل الرد طويلاً ومفصلاً (150-200 كلمة على الأقل)

تنسيق الرد:
ابدأ بالقرار الرئيسي، ثم قدم التفاصيل الثلاثة بوضوح:

**القرار**: [القرار الرئيسي بوضوح]

**التحليل**: [تحليل مفصل للموقف - 3-4 جمل على الأقل]

**المخاطر والفوائد**: [تقييم المخاطر والفوائد - 3-4 جمل على الأقل]

**الخطوات التالية**: [خطوات عملية للتنفيذ - 3-4 جمل على الأقل]

مثال على التنسيق المطلوب:

**القرار**: يجب عليك تغيير وظيفتك الحالية بعد التحضير المناسب.

**التحليل**: الوضع الحالي يشير إلى عدم الرضا المهني وعدم وجود فرص للتطور في مكان العمل الحالي. هذا يؤثر سلبياً على الدافعية والإنتاجية على المدى الطويل. التغيير المهني في هذه المرحلة سيوفر فرصاً أفضل للنمو والتطور المهني.

**المخاطر والفوائد**: المخاطر تشمل عدم الاستقرار المالي المؤقت، والحاجة لتعلم مهارات جديدة، وعدم ضمان نجاح الوظيفة الجديدة. الفوائد تشمل زيادة الرضا الوظيفي، فرص أفضل للتطور المهني، راتب أعلى، وبيئة عمل أكثر تحفيزاً.

**الخطوات التالية**: 1) قم بتقييم مهاراتك الحالية وتحديد المجالات التي تحتاج تطوير. 2) ابدأ في تعلم مهارات جديدة مطلوبة في السوق. 3) وفر مبلغ طوارئ يكفي لستة أشهر من المصروفات. 4) ابدأ البحث عن فرص عمل جديدة. 5) خطط للانتقال التدريجي دون ترك العمل الحالي.

أجب باللغة العربية وقدم قراراً جاداً ومفصلاً!`
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: 400,
        temperature: 0.3
      },
      {
        headers: {
          "Authorization": `Bearer ${config.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://qarar-decision-maker.vercel.app",
          "X-Title": "Qarar Decision Maker"
        },
        timeout: 30000 // 30 ثانية timeout
      }
    );
    
    const botReply = response.data.choices[0].message.content;
    const responseTime = Date.now() - startTime;
    
    // تسجيل التاريخ إذا كان المستخدم مسجل دخول
    if (req.user) {
      try {
        const history = new History({
          user: req.user._id,
          type: 'serious_question',
          content: {
            question: userMessage,
            answer: botReply,
            isCustom: true
          },
          metadata: {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            responseTime,
            tokensUsed: response.data.usage?.total_tokens || 0,
            model: 'openai/gpt-4o'
          }
        });
        
        await history.save();
        
        // تحديث إحصائيات المستخدم
        const result = await req.user.incrementQuestions();
        
        // إرسال إشعار عن الإنجازات الجديدة (يمكن تطويره لاحقاً)
        if (result.newAchievements.length > 0) {
          console.log(`🏆 إنجازات جديدة للمستخدم ${req.user.username}:`, result.newAchievements);
        }
      } catch (historyError) {
        console.error('History Save Error:', historyError);
        // لا نوقف العملية إذا فشل حفظ التاريخ
      }
    }
    
    res.json({ reply: botReply });
    
  } catch (error) {
    console.error("OpenRouter API Error:", error.response?.data || error.message);
    
    let errorMessage = "عذراً، حدث خطأ في معالجة طلبك";
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = "انتهت مهلة الاتصال، حاول مرة أخرى";
    } else if (error.response?.status === 401) {
      errorMessage = "خطأ في مفتاح API";
    } else if (error.response?.status === 429) {
      errorMessage = "تم تجاوز الحد المسموح، حاول لاحقاً";
    } else if (error.response?.status === 500) {
      errorMessage = "خطأ في الخادم، حاول لاحقاً";
    }
    
    res.status(500).json({
      error: "خطأ في API",
      message: errorMessage
    });
  }
});

// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public", "index.html"));
});

// Serve premium page
app.get("/premium", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public", "premium.html"));
});

// Serve login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public", "login.html"));
});

// Serve profile page
app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public", "profile.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🎲 قررلي جاهز لمساعدتك في القرارات!`);
}); 