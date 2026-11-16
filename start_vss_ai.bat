@echo off
title Vyapar Sarthi Sangi (VSS AI)
echo ============================================================
echo   Starting Vyapar Sarthi Sangi (VSS AI) Platform
echo   Your Business. One System. One Intelligent Sarthi.
echo ============================================================
echo.

echo [1/2] Starting Node.js Authentication Backend (Port 3000)...
start /b cmd /c "cd /d "%~dp0backend" && node server.js"

timeout /t 1 /nobreak >nul

echo [2/2] Opening browser at http://localhost:8000/app/ ...
start http://localhost:8000/app/

echo.
echo Starting VSS AI Intelligence Backend Core (Port 8000)...
echo Connected seamlessly with Node.js login system & Data Engine.
echo.

cd /d "%~dp0pybackend"
"D:\env files\New folder\anaconda\envs\py310\python.exe" main.py

pause
