@echo off
echo 🎲 قررلي - مشروع قرارات ذكي
echo.
echo اختر ما تريد تشغيله:
echo 1. Frontend فقط (الموقع)
echo 2. Backend فقط (الخادم)
echo 3. كلاهما (Frontend + Backend)
echo.
set /p choice="اختر رقم (1-3): "

if "%choice%"=="1" (
    echo 🌐 تشغيل Frontend...
    cd frontend
    start.bat
) else if "%choice%"=="2" (
    echo 🚀 تشغيل Backend...
    cd backend
    start.bat
) else if "%choice%"=="3" (
    echo 🚀 تشغيل Backend...
    start /B cmd /c "cd backend && start.bat"
    timeout /t 3 /nobreak >nul
    echo 🌐 تشغيل Frontend...
    cd frontend
    start.bat
) else (
    echo ❌ اختيار غير صحيح!
    pause
)