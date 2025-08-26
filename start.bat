@echo off
echo ===========================================
echo 🚀 Запуск BannerAdsAI
echo ===========================================
echo.

echo ✅ OpenAI API ключ настроен
echo ✅ Зависимости установлены
echo.

echo 📡 Запуск бэкенд сервера...
cd backend
start /B "Backend Server" cmd /c "npm start"

timeout /t 3 /nobreak >nul

echo 💻 Запуск фронтенд сервера...
cd ..
start /B "Frontend Server" cmd /c "npm run dev"

echo.
echo 🎉 Серверы запущены!
echo.
echo 📋 Доступные адреса:
echo   🖥️  Фронтенд: http://localhost:5173
echo   🔌 Backend API: http://localhost:3002
echo.
echo 📊 Для просмотра логов:
echo   Backend: cd backend && npm start
echo   Frontend: npm run dev
echo.
echo 💡 Для остановки нажмите Ctrl+C в каждом окне
echo.
pause