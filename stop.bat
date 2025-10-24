@echo off
REM E-Book Reader - Stop Script for Windows

echo Stopping E-Book Reader servers...

REM Kill process on port 8000 (backend)
echo Killing process on port 8000 (backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill process on port 8080 (frontend)
echo Killing process on port 8080 (frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [OK] All servers stopped
pause
