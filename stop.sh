#!/bin/bash

# E-Book Reader - Stop Script for Linux/Mac

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Stopping E-Book Reader servers...${NC}"

# Kill processes by port
echo -e "${YELLOW}Killing process on port 8000 (backend)...${NC}"
lsof -ti:8000 | xargs -r kill -9 2>/dev/null || true

echo -e "${YELLOW}Killing process on port 8080 (frontend)...${NC}"
lsof -ti:8080 | xargs -r kill -9 2>/dev/null || true

# Clean up PID files
rm -f .backend.pid .frontend.pid

echo -e "${GREEN}✓ All servers stopped${NC}"
