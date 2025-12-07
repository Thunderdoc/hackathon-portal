@echo off
echo ===========================================
echo       STARTING HACKATHON PLATFORM
echo ===========================================
echo.

:: 1. Start Support Server (Backend)
echo [1/2] Launching Mission Control Server...
start "Hackathon Backend" cmd /k "cd server && node index.js"

:: Wait for backend to initialize
timeout /t 3 /nobreak >nul

:: 2. Start Frontend Interface (Production)
echo [2/2] Launching User Interface...
start "Hackathon Client" cmd /k "cd client && npm run preview -- --port 5173"

echo.
echo ===========================================
echo          SYSTEM ONLINE 🚀
echo ===========================================
echo Access the App at: http://localhost:5173
echo.
pause
