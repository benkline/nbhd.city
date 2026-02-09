#!/bin/bash
# Development startup script for nbhd.city
# Starts all services: DynamoDB, API, and Frontend

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   nbhd.city Development Environment        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker is running"
echo ""

# Start DynamoDB and API services
echo -e "${BLUE}Starting DynamoDB Local and API...${NC}"
cd "$PROJECT_ROOT/app/dynamodb"
docker-compose up -d

echo ""
echo -e "${GREEN}Waiting for services to be ready...${NC}"
sleep 10

# Check if DynamoDB is ready
ATTEMPTS=0
MAX_ATTEMPTS=30
while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:8000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} DynamoDB Local is ready on port 8000"
        break
    fi
    ATTEMPTS=$((ATTEMPTS + 1))
    sleep 1
done

if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
    echo -e "${YELLOW}⚠ DynamoDB Local took too long to start${NC}"
fi

# Check if API is ready
ATTEMPTS=0
while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:8001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Backend API is ready on port 8001"
        break
    fi
    ATTEMPTS=$((ATTEMPTS + 1))
    sleep 1
done

if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
    echo -e "${YELLOW}⚠ Backend API took too long to start${NC}"
fi

echo ""
echo -e "${GREEN}✓${NC} Backend services started successfully"
echo ""
echo -e "${BLUE}Starting Frontend...${NC}"
cd "$PROJECT_ROOT/app/UI"

# Check if node_modules exists, if not run npm install
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing npm dependencies...${NC}"
    npm install
fi

# Start the frontend dev server
npm run dev &
FRONTEND_PID=$!

echo -e "${GREEN}✓${NC} Frontend starting on port 5173"
echo ""

echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}All services are running!${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo -e "Frontend:  ${BLUE}http://localhost:5173${NC}"
echo -e "API:       ${BLUE}http://localhost:8001${NC}"
echo -e "DynamoDB:  ${BLUE}http://localhost:8000${NC}"
echo -e "Admin UI:  ${BLUE}http://localhost:8002${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for frontend process
wait $FRONTEND_PID
