@echo off
title Vyapar Sarthi Sangi (VSS AI)
echo ============================================================
echo   Starting Vyapar Sarthi Sangi (VSS AI) Platform
echo   Your Business. One System. One Intelligent Sarthi.
echo ============================================================
echo.

echo [1/2] Starting Node.js Authentication Backend (Port 3000)...
start /b cmd /c "cd /d "%~dp0backend" && node server.js"

echo [2/2] Starting Python Intelligence Server (Port 8000)...
start "" /b "D:\env files\New folder\anaconda\envs\py310\python.exe" "%~dp0start.py"

echo Waiting for services to initialize...
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:8000/app/ ...
start http://localhost:8000/app/

echo.
echo ============================================================
echo   Vyapar Sarthi Sangi is live at http://localhost:8000/app/
echo ============================================================
echo.
pause
