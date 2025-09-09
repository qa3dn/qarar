@echo off
echo 🌐 بدء تشغيل موقع قررلي...
cd /d "%~dp0"
npx http-server public -p 3000 -o
pause