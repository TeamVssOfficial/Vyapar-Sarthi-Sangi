@echo off
setlocal enabledelayedexpansion
title Vyapar Verse (VSS AI) - Business Operating System

echo ============================================================
echo   Vyapar Verse (VSS AI) - AI Business Operating System
echo   Your Business. One System. One Intelligent Sarthi.
echo ============================================================
echo.

echo [1/3] Checking and cleaning up lingering processes on ports 8000 and 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [2/3] Starting Node.js Authentication Backend (Port 3000)...
start /b cmd /c "cd /d "%~dp0backend" && node server.js"

echo [3/3] Launching VSS AI Intelligence Backend Core (Port 8000)...
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:8000/app/"

cd /d "%~dp0pybackend"

set "PYTHON_EXE=D:\env files\New folder\anaconda\envs\py310\python.exe"
if not exist "%PYTHON_EXE%" (
    set "PYTHON_EXE=python"
)

echo Using Python Engine: %PYTHON_EXE%
echo Starting server on http://127.0.0.1:8000 ...
echo Browser will automatically launch once initialization is complete.
echo.

"%PYTHON_EXE%" main.py

echo.
echo ============================================================
echo   VSS AI Backend stopped.
echo ============================================================
pause
