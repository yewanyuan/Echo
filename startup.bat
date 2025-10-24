@echo off
REM E-Book Reader - Automatic Startup Script for Windows
REM This script automatically sets up and starts the e-book reader application

setlocal enabledelayedexpansion

echo ============================================================
echo      E-Book Reader with AI Features - Startup Script
echo ============================================================
echo.

REM Get script directory
cd /d "%~dp0"

REM Step 1: Check Python installation
echo [1/6] Checking Python installation...
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed!
    echo Please install Python 3.7 or higher from https://www.python.org/
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [OK] Found Python %PYTHON_VERSION%

REM Step 2: Create virtual environment if it doesn't exist
echo [2/6] Setting up virtual environment...
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo [OK] Virtual environment created
) else (
    echo [OK] Virtual environment already exists
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Step 3: Install/Update dependencies
echo [3/6] Installing Python dependencies...
python -m pip install --upgrade pip -q
pip install -r requirements.txt -q
echo [OK] Dependencies installed

REM Step 4: Configure environment variables
echo [4/6] Configuring environment...
if not exist ".env" (
    echo [WARNING] No .env file found. Creating from template...
    copy .env.example .env
    echo.
    echo ================================================
    echo   IMPORTANT: Please configure your API key!
    echo ================================================
    echo 1. Get your DeepSeek API key from: https://platform.deepseek.com/
    echo 2. Edit the .env file and replace 'your_api_key_here' with your actual key
    echo.
    pause
    notepad .env
)

REM Load environment variables from .env
for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
    set "line=%%a"
    if "!line:~0,1!" neq "#" (
        set "%%a=%%b"
    )
)

REM Check if API key is configured
if "%DEEPSEEK_API_KEY%"=="your_api_key_here" (
    echo [ERROR] DeepSeek API key not configured!
    echo Please edit .env file and add your API key.
    pause
    exit /b 1
)

if "%DEEPSEEK_API_KEY%"=="" (
    echo [ERROR] DeepSeek API key not configured!
    echo Please edit .env file and add your API key.
    pause
    exit /b 1
)

echo [OK] Environment configured

REM Step 5: Kill processes on ports if they exist
echo [5/6] Starting backend server...

REM Kill process on port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo Killing process on port 8000...
    taskkill /F /PID %%a >nul 2>&1
)

REM Start backend
cd backend
start "E-Book Reader Backend" /min cmd /c "python unified_backend.py > ..\backend.log 2>&1"
cd ..

REM Wait for backend to start
echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo [OK] Backend server started

REM Step 6: Start frontend server
echo [6/6] Starting frontend server...

REM Kill process on port 8080
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    echo Killing process on port 8080...
    taskkill /F /PID %%a >nul 2>&1
)

REM Start frontend
cd frontend
start "E-Book Reader Frontend" /min cmd /c "python -m http.server 8080 > ..\frontend.log 2>&1"
cd ..

timeout /t 2 /nobreak >nul

echo [OK] Frontend server started

REM Success message
echo.
echo ============================================================
echo          E-Book Reader Started Successfully!
echo ============================================================
echo.
echo Application URLs:
echo   Frontend:  http://localhost:8080
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.
echo Log Files:
echo   Backend:   backend.log
echo   Frontend:  frontend.log
echo.
echo To stop the servers, run: stop.bat
echo Or close the backend and frontend windows
echo.

REM Open browser automatically
timeout /t 2 /nobreak >nul
start http://localhost:8080

echo Press any key to exit (servers will keep running)...
pause >nul

exit /b 0
