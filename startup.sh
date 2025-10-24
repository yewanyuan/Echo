#!/bin/bash

# E-Book Reader - Automatic Startup Script
# This script automatically sets up and starts the e-book reader application

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     E-Book Reader with AI Features - Startup Script   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}Checking if port $port is in use...${NC}"
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}Killing process on port $port...${NC}"
        lsof -ti:$port | xargs -r kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Step 1: Check Python installation
echo -e "${BLUE}[1/6] Checking Python installation...${NC}"
if command_exists python3; then
    PYTHON_CMD=python3
elif command_exists python; then
    PYTHON_CMD=python
else
    echo -e "${RED}✗ Python is not installed!${NC}"
    echo -e "${YELLOW}Please install Python 3.7 or higher from https://www.python.org/${NC}"
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}✓ Found Python $PYTHON_VERSION${NC}"

# Step 2: Create virtual environment if it doesn't exist
echo -e "${BLUE}[2/6] Setting up virtual environment...${NC}"
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    $PYTHON_CMD -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate virtual environment
source venv/bin/activate

# Step 3: Install/Update dependencies
echo -e "${BLUE}[3/6] Installing Python dependencies...${NC}"
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 4: Configure environment variables
echo -e "${BLUE}[4/6] Configuring environment...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}No .env file found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠  IMPORTANT: Please configure your API key!${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}1. Get your DeepSeek API key from: ${BLUE}https://platform.deepseek.com/${NC}"
    echo -e "${YELLOW}2. Edit the .env file and replace 'your_api_key_here' with your actual key${NC}"
    echo ""
    read -p "Press Enter to open .env file in default editor, or Ctrl+C to exit and edit manually..."
    ${EDITOR:-nano} .env
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if API key is configured
if [ -z "$DEEPSEEK_API_KEY" ] || [ "$DEEPSEEK_API_KEY" = "your_api_key_here" ]; then
    echo -e "${RED}✗ DeepSeek API key not configured!${NC}"
    echo -e "${YELLOW}Please edit .env file and add your API key.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment configured${NC}"

# Step 5: Clean up ports and start backend
echo -e "${BLUE}[5/6] Starting backend server...${NC}"
kill_port 8000

cd backend
$PYTHON_CMD unified_backend.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend to start...${NC}"
sleep 3

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Backend server started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ Backend failed to start. Check backend.log for details.${NC}"
    exit 1
fi

# Step 6: Start frontend server
echo -e "${BLUE}[6/6] Starting frontend server...${NC}"
kill_port 8080

# Check if Python http.server or Node.js is available
cd frontend
$PYTHON_CMD -m http.server 8080 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 2

if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Frontend server started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}✗ Frontend failed to start. Check frontend.log for details.${NC}"
    kill $BACKEND_PID
    exit 1
fi

# Save PIDs for cleanup
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# Success message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          🎉 E-Book Reader Started Successfully! 🎉     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📚 Application URLs:${NC}"
echo -e "   Frontend:  ${GREEN}http://localhost:8080${NC}"
echo -e "   Backend:   ${GREEN}http://localhost:8000${NC}"
echo -e "   API Docs:  ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${BLUE}📝 Log Files:${NC}"
echo -e "   Backend:   ${YELLOW}backend.log${NC}"
echo -e "   Frontend:  ${YELLOW}frontend.log${NC}"
echo ""
echo -e "${YELLOW}To stop the servers, run: ${BLUE}./stop.sh${NC}"
echo -e "${YELLOW}Or press Ctrl+C and run: ${BLUE}kill $BACKEND_PID $FRONTEND_PID${NC}"
echo ""

# Open browser automatically (optional)
if command_exists xdg-open; then
    sleep 2
    xdg-open http://localhost:8080 2>/dev/null &
elif command_exists open; then
    sleep 2
    open http://localhost:8080 2>/dev/null &
fi

# Keep script running and monitor processes
echo -e "${BLUE}Monitoring servers... (Press Ctrl+C to stop)${NC}"
echo ""

# Trap Ctrl+C to cleanup
trap cleanup INT TERM

cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    rm -f .backend.pid .frontend.pid
    echo -e "${GREEN}✓ Servers stopped${NC}"
    exit 0
}

# Monitor loop
while true; do
    if ! ps -p $BACKEND_PID > /dev/null; then
        echo -e "${RED}✗ Backend server crashed! Check backend.log${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi
    if ! ps -p $FRONTEND_PID > /dev/null; then
        echo -e "${RED}✗ Frontend server crashed! Check frontend.log${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 5
done
