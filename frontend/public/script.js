// متغيرات عامة
let currentDecision = '';
let currentCategory = '';
let currentUser = null;

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 قررلي جاهز!');
    
    // التحقق من تسجيل الدخول
    checkAuthStatus();
    
    // إضافة تأثيرات صوتية (اختياري)
    setupAudioEffects();
    
    // إعداد الأحداث
    setupEventListeners();
    
    // تحريك الصاروخ عند التمرير
    setupRocketAnimation();
});

// التحقق من حالة تسجيل الدخول
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        try {
            currentUser = JSON.parse(user);
            showUserInfo();
        } catch (error) {
            console.error('خطأ في تحليل بيانات المستخدم:', error);
            logout();
        }
    } else {
        showAuthButtons();
    }
}

// عرض معلومات المستخدم
function showUserInfo() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    
    if (authButtons && userInfo) {
        authButtons.style.display = 'none';
        userInfo.style.display = 'block';
        
        if (currentUser.profilePicture) {
            userAvatar.src = currentUser.profilePicture;
        }
        
        userName.textContent = currentUser.username || currentUser.firstName || 'المستخدم';
    }
}

// عرض أزرار تسجيل الدخول
function showAuthButtons() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    
    if (authButtons && userInfo) {
        authButtons.style.display = 'flex';
        userInfo.style.display = 'none';
    }
}

// الانتقال لصفحة تسجيل الدخول
function goToLogin() {
    window.location.href = '/login';
}

// الانتقال لصفحة التسجيل
function goToRegister() {
    window.location.href = '/login?mode=register';
}

// تبديل قائمة المستخدم
function toggleUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.style.display = userMenu.style.display === 'none' ? 'block' : 'none';
    }
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    showAuthButtons();
    
    // إخفاء قائمة المستخدم
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.style.display = 'none';
    }
    
    showMessage('تم تسجيل الخروج بنجاح', 'success');
}

// إعداد الأحداث
function setupEventListeners() {
    // الزر الرئيسي - الآن يشتغل مع السؤال الخاص
    const decisionBtn = document.getElementById('decisionBtn');
    decisionBtn.addEventListener('click', askCustomQuestion);
    
    // إدخال السؤال المخصص
    const questionInput = document.getElementById('customQuestion');
    questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            askCustomQuestion();
        }
    });
}

// الحصول على قرار عشوائي
async function getRandomDecision() {
    try {
        // تأثير الزر
        const btn = document.getElementById('decisionBtn');
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 150);
        
        // إخفاء النتيجة السابقة
        hideResult();
        
        // عرض حالة التحميل
        showLoading();
        
        const response = await fetch('/api/random');
        const data = await response.json();
        
        if (data.decision) {
            currentDecision = data.decision;
            currentCategory = data.category;
            showResult(data.decision, data.category);
            
            // تحديث الإنجازات
            if (currentUser) {
                updateAchievements();
            }
        }
        
    } catch (error) {
        console.error('خطأ في الحصول على القرار:', error);
        showError('حدث خطأ في الحصول على القرار. حاول مرة أخرى!');
    }
}

// الحصول على قرار من فئة محددة
async function getCategoryDecision(category) {
    try {
        // تأثير الزر
        const btn = document.querySelector(`[data-category="${category}"]`);
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 150);
        
        // إخفاء النتيجة السابقة
        hideResult();
        
        // عرض حالة التحميل
        showLoading();
        
        const response = await fetch(`/api/decision/${category}`);
        const data = await response.json();
        
        if (data.decision) {
            currentDecision = data.decision;
            currentCategory = data.category;
            showResult(data.decision, data.category);
            
            // تحديث الإنجازات
            if (currentUser) {
                updateAchievements();
            }
        }
        
    } catch (error) {
        console.error('خطأ في الحصول على القرار:', error);
        showError('حدث خطأ في الحصول على القرار. حاول مرة أخرى!');
    }
}

// سؤال مخصص
async function askCustomQuestion() {
    const questionInput = document.getElementById('customQuestion');
    const question = questionInput.value.trim();
    
    if (!question) {
        showError('يرجى كتابة سؤال!');
        return;
    }
    
    try {
        // تأثير الزر الرئيسي
        const decisionBtn = document.getElementById('decisionBtn');
        
        if (decisionBtn) {
            decisionBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                decisionBtn.style.transform = 'scale(1)';
            }, 150);
        }
        
        // إخفاء النتيجة السابقة
        hideResult();
        
        // عرض حالة التحميل
        showLoading();
        
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: question })
        });
        
        const data = await response.json();
        
        if (data.reply) {
            currentDecision = data.reply;
            currentCategory = 'custom';
            showResult(data.reply, 'سؤال مخصص');
            
            // تحديث الإنجازات
            if (currentUser) {
                updateAchievements();
            }
        } else if (data.fallback) {
            currentDecision = data.fallback;
            currentCategory = 'fallback';
            showResult(data.fallback, 'اقتراح');
        } else {
            showError('حدث خطأ في الحصول على الرد. حاول مرة أخرى!');
        }
        
        // مسح السؤال
        questionInput.value = '';
        
    } catch (error) {
        console.error('خطأ في السؤال المخصص:', error);
        showError('حدث خطأ في الحصول على الرد. حاول مرة أخرى!');
    }
}

// عرض النتيجة
function showResult(decision, category) {
    const resultCard = document.getElementById('resultCard');
    const decisionText = document.getElementById('decisionText');
    const categoryText = document.getElementById('categoryText');
    const shareButtons = document.getElementById('shareButtons');
    
    // تحديث النص
    decisionText.textContent = decision;
    categoryText.textContent = getCategoryDisplayName(category);
    
    // إظهار البطاقة
    resultCard.classList.remove('hidden');
    
    // إظهار أزرار المشاركة بعد تأخير
    setTimeout(() => {
        shareButtons.classList.remove('hidden');
    }, 500);
    
    // تأثيرات إضافية
    addSparkleEffect(resultCard);
    
    // تحريك الصاروخ
    triggerRocketLaunch();
}

// إخفاء النتيجة
function hideResult() {
    const resultCard = document.getElementById('resultCard');
    const shareButtons = document.getElementById('shareButtons');
    
    resultCard.classList.add('hidden');
    shareButtons.classList.add('hidden');
}

// عرض التحميل
function showLoading() {
    const resultCard = document.getElementById('resultCard');
    const decisionText = document.getElementById('decisionText');
    const categoryText = document.getElementById('categoryText');
    
    decisionText.textContent = 'جاري التفكير... 🤔';
    categoryText.textContent = '';
    
    resultCard.classList.remove('hidden');
    
    // تأثير التحميل
    const cardIcon = resultCard.querySelector('.card-icon');
    cardIcon.textContent = '🔄';
    cardIcon.style.animation = 'spin 1s linear infinite';
}

// عرض الخطأ
function showError(message) {
    const resultCard = document.getElementById('resultCard');
    const decisionText = document.getElementById('decisionText');
    const categoryText = document.getElementById('categoryText');
    const cardIcon = resultCard.querySelector('.card-icon');
    
    decisionText.textContent = message;
    categoryText.textContent = '';
    cardIcon.textContent = '⚠️';
    cardIcon.style.animation = 'none';
    
    resultCard.classList.remove('hidden');
    
    // إخفاء بعد 3 ثواني
    setTimeout(() => {
        hideResult();
    }, 3000);
}

// الحصول على اسم الفئة بالعربية
function getCategoryDisplayName(category) {
    const categoryNames = {
        'love': 'حب وعلاقات',
        'food': 'أكل',
        'work': 'شغل',
        'crazy': 'مجنون',
        'life': 'حياة',
        'custom': 'سؤال مخصص',
        'fallback': 'اقتراح'
    };
    
    return categoryNames[category] || category;
}

// إضافة تأثير الوميض
function addSparkleEffect(element) {
    // إضافة نجمة متحركة
    const sparkle = document.createElement('div');
    sparkle.innerHTML = '✨';
    sparkle.style.position = 'absolute';
    sparkle.style.fontSize = '2rem';
    sparkle.style.animation = 'sparkle 1s ease-out forwards';
    sparkle.style.pointerEvents = 'none';
    
    element.style.position = 'relative';
    element.appendChild(sparkle);
    
    // إزالة النجمة بعد انتهاء الحركة
    setTimeout(() => {
        if (sparkle.parentNode) {
            sparkle.parentNode.removeChild(sparkle);
        }
    }, 1000);
}

// تحريك الصاروخ
function triggerRocketLaunch() {
    const rocket = document.querySelector('.rocket');
    if (rocket) {
        rocket.style.animation = 'none';
        setTimeout(() => {
            rocket.style.animation = 'rocketLaunch 8s ease-in infinite';
        }, 10);
    }
}

// إعداد حركة الصاروخ
function setupRocketAnimation() {
    window.addEventListener('scroll', () => {
        const rocket = document.querySelector('.rocket');
        if (rocket) {
            const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            rocket.style.transform = `translateY(${scrollPercent * 100}px)`;
        }
    });
}

// إعداد التأثيرات الصوتية
function setupAudioEffects() {
    // يمكن إضافة تأثيرات صوتية هنا
    console.log('🎵 التأثيرات الصوتية جاهزة');
}

// مشاركة على واتساب
function shareOnWhatsApp() {
    const text = `قررلي قاللي: ${currentDecision}`;
    const url = encodeURIComponent(window.location.href);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    window.open(whatsappUrl, '_blank');
    
    // تسجيل المشاركة في الباك أند
    recordShare();
}

// مشاركة على إنستغرام
function shareOnInstagram() {
    const text = `قررلي قاللي: ${currentDecision}`;
    // إنستغرام لا يدعم مشاركة مباشرة، لذا نعرض النص للنسخ
    copyToClipboard(text);
    showMessage('تم نسخ النص! الصقه في ستوري إنستغرام');
    
    // تسجيل المشاركة في الباك أند
    recordShare();
}

// مشاركة على تويتر
function shareOnTwitter() {
    const text = `قررلي قاللي: ${currentDecision}`;
    const url = window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
    
    // تسجيل المشاركة في الباك أند
    recordShare();
}

// مشاركة كصورة
async function shareAsImage() {
    // جرب الطريقة البسيطة أولاً
    try {
        createSimpleImage();
    } catch (error) {
        console.error('فشلت الطريقة البسيطة، جرب html2canvas:', error);
        
        // إذا فشلت الطريقة البسيطة، جرب html2canvas
        try {
            showMessage('جاري إنشاء الصورة...', 'info');
            console.log('بدء إنشاء الصورة...');
            
            // إنشاء عنصر مؤقت للصورة
            const imageContainer = document.createElement('div');
            imageContainer.id = 'image-container';
            imageContainer.style.cssText = `
                position: fixed;
                top: -9999px;
                left: -9999px;
                width: 600px;
                height: 400px;
                background: linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #000033 100%);
                border-radius: 20px;
                padding: 40px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                color: white;
                font-family: 'Cairo', sans-serif;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                z-index: 9999;
            `;
            
            imageContainer.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 20px;">🎲</div>
                <h2 style="font-size: 2rem; margin-bottom: 20px; color: #4ecdc4;">قررلي</h2>
                <div style="font-size: 1.5rem; margin-bottom: 20px; line-height: 1.4; max-width: 500px; word-wrap: break-word;">${currentDecision}</div>
                <div style="font-size: 1rem; color: #888; margin-top: 20px;">qararli.com</div>
            `;
            
            document.body.appendChild(imageContainer);
            console.log('تم إضافة العنصر المؤقت');
            
            // انتظار قصير للتأكد من تحميل العنصر
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // تحويل إلى صورة
            console.log('بدء تحويل إلى canvas...');
            const canvas = await html2canvas(imageContainer, {
                backgroundColor: '#0a0a0a',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: true,
                width: 600,
                height: 400
            });
            
            console.log('تم إنشاء canvas:', canvas);
            
            // إزالة العنصر المؤقت
            document.body.removeChild(imageContainer);
            console.log('تم إزالة العنصر المؤقت');
            
            // تحويل إلى blob
            canvas.toBlob(async (blob) => {
                console.log('تم إنشاء blob:', blob);
                
                if (blob) {
                    if (navigator.share && navigator.canShare && navigator.canShare({ files: [blob] })) {
                        // استخدام Web Share API إذا متاح
                        try {
                            await navigator.share({
                                files: [new File([blob], 'qararli-decision.png', { type: 'image/png' })],
                                title: 'قرار من قررلي',
                                text: currentDecision
                            });
                            showMessage('تم مشاركة الصورة!', 'success');
                        } catch (error) {
                            console.log('فشل Web Share، استخدام التحميل:', error);
                            downloadImage(blob);
                        }
                    } else {
                        // تحميل الصورة
                        console.log('استخدام التحميل المباشر');
                        downloadImage(blob);
                    }
                } else {
                    showMessage('فشل في إنشاء الصورة', 'error');
                }
            }, 'image/png', 0.9);
            
            // تسجيل المشاركة في الباك أند
            recordShare();
            
        } catch (error) {
            console.error('خطأ في إنشاء الصورة:', error);
            showMessage('حدث خطأ في إنشاء الصورة: ' + error.message, 'error');
        }
    }
}

// تحميل الصورة
function downloadImage(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qararli-decision.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('تم تحميل الصورة!', 'success');
}

// طريقة بديلة لإنشاء الصورة (أبسط)
function createSimpleImage() {
    try {
        showMessage('جاري إنشاء الصورة...', 'info');
        
        // إنشاء canvas مباشرة
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // أبعاد الصورة
        canvas.width = 600;
        canvas.height = 400;
        
        // خلفية متدرجة
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(0.5, '#1a0033');
        gradient.addColorStop(1, '#000033');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 600, 400);
        
        // إضافة النص
        ctx.fillStyle = '#4ecdc4';
        ctx.font = 'bold 48px Cairo, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎲', 300, 80);
        
        ctx.fillStyle = '#4ecdc4';
        ctx.font = 'bold 32px Cairo, Arial, sans-serif';
        ctx.fillText('قررلي', 300, 130);
        
        // إضافة شعار X (تويتر) في الزاوية - تم إزالته
        // ctx.fillStyle = '#1DA1F2';
        // ctx.font = 'bold 24px Arial, sans-serif';
        // ctx.textAlign = 'right';
        // ctx.fillText('𝕏', 550, 50);
        console.log('تم إزالة شعار X من الصورة');
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Cairo, Arial, sans-serif';
        
        // تقسيم النص إذا كان طويلاً
        const words = currentDecision.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (let word of words) {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > 500 && currentLine !== '') {
                lines.push(currentLine);
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
        
        // رسم النص
        let y = 200;
        for (let line of lines) {
            ctx.fillText(line.trim(), 300, y);
            y += 35;
        }
        
        ctx.fillStyle = '#888888';
        ctx.font = '16px Cairo, Arial, sans-serif';
        ctx.fillText('qararli.com', 300, 350);
        
        // تحويل إلى blob
        canvas.toBlob((blob) => {
            if (blob) {
                downloadImage(blob);
                recordShare();
            } else {
                showMessage('فشل في إنشاء الصورة', 'error');
            }
        }, 'image/png', 0.9);
        
    } catch (error) {
        console.error('خطأ في إنشاء الصورة البسيطة:', error);
        showMessage('حدث خطأ في إنشاء الصورة', 'error');
    }
}

// نسخ إلى الحافظة
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // طريقة بديلة للمتصفحات القديمة
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

// عرض رسالة
function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    
    let backgroundColor = 'linear-gradient(45deg, #4ecdc4, #44a08d)';
    if (type === 'error') {
        backgroundColor = 'linear-gradient(45deg, #ff6b6b, #ff8e8e)';
    } else if (type === 'info') {
        backgroundColor = 'linear-gradient(45deg, #4ecdc4, #44a08d)';
    }
    
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        z-index: 1000;
        animation: messageSlide 0.3s ease-out;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// إضافة CSS للحركات الإضافية
const additionalCSS = `
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@keyframes sparkle {
    0% {
        opacity: 0;
        transform: scale(0) rotate(0deg);
    }
    50% {
        opacity: 1;
        transform: scale(1) rotate(180deg);
    }
    100% {
        opacity: 0;
        transform: scale(0) rotate(360deg);
    }
}

@keyframes messageSlide {
    from {
        opacity: 0;
        transform: translateX(100px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes achievementSlide {
    from {
        opacity: 0;
        transform: translateX(300px) scale(0.8);
    }
    to {
        opacity: 1;
        transform: translateX(0) scale(1);
    }
}
`;

// إضافة CSS للصفحة
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);

// تحسين الأداء
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// تحسين حركة التمرير
const debouncedScroll = debounce(() => {
    // يمكن إضافة تحسينات إضافية هنا
}, 16);

window.addEventListener('scroll', debouncedScroll);

// تسجيل المشاركة في الباك أند
async function recordShare() {
    if (!currentUser) return;
    
    try {
        const token = localStorage.getItem('token');
        await fetch(`/api/profile/${currentUser.username}/share`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        // تحديث الإنجازات بعد المشاركة
        updateAchievements();
    } catch (error) {
        console.error('خطأ في تسجيل المشاركة:', error);
    }
}

// تحديث الإنجازات
async function updateAchievements() {
    if (!currentUser) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/profile/${currentUser.username}/achievements`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            // إظهار إشعار للإنجازات الجديدة
            checkForNewAchievements(data.achievements);
        }
    } catch (error) {
        console.error('خطأ في تحديث الإنجازات:', error);
    }
}

// فحص الإنجازات الجديدة وإظهار إشعارات
function checkForNewAchievements(achievements) {
    const savedAchievements = JSON.parse(localStorage.getItem('userAchievements') || '{}');
    
    achievements.forEach(achievement => {
        if (achievement.unlocked && !savedAchievements[achievement.id]) {
            // إنجاز جديد!
            showAchievementNotification(achievement);
            savedAchievements[achievement.id] = true;
        }
    });
    
    // حفظ الإنجازات المحدثة
    localStorage.setItem('userAchievements', JSON.stringify(savedAchievements));
}

// إظهار إشعار الإنجاز
function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(45deg, #ff00ff, #00ffff);
            color: white;
            padding: 20px;
            border-radius: 15px;
            z-index: 10000;
            animation: achievementSlide 0.5s ease-out;
            box-shadow: 0 0 30px rgba(255, 0, 255, 0.5);
            max-width: 300px;
        ">
            <div style="font-size: 2em; text-align: center; margin-bottom: 10px;">
                🏆 ${achievement.icon}
            </div>
            <div style="font-weight: bold; margin-bottom: 5px; text-align: center;">
                إنجاز جديد!
            </div>
            <div style="text-align: center; font-size: 1.1em;">
                ${achievement.title}
            </div>
            <div style="text-align: center; font-size: 0.9em; opacity: 0.8; margin-top: 5px;">
                ${achievement.description}
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // إزالة الإشعار بعد 5 ثواني
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
} 