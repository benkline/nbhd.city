#!/bin/bash
# Start DynamoDB Local development environment

cd "$(dirname "$0")/.."

echo "=========================================="
echo "Starting DynamoDB Local Development"
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

# Start services
docker-compose up -d

echo ""
echo "Waiting for services to be ready..."
sleep 5

# Check health
./scripts/check_health.sh

echo ""
echo "=========================================="
echo "DynamoDB Local is ready!"
echo "=========================================="
echo ""
echo "Services:"
echo "  - DynamoDB Local: http://localhost:8000"
echo "  - DynamoDB Admin: http://localhost:8001"
echo ""
echo "Next steps:"
echo "  1. Update api/.env.local with:"
echo "     DYNAMODB_ENDPOINT_URL=http://localhost:8000"
echo "     DYNAMODB_TABLE_NAME=nbhd-city-development"
echo "     AWS_ACCESS_KEY_ID=dummy"
echo "     AWS_SECRET_ACCESS_KEY=dummy"
echo ""
echo "  2. (Optional) Seed test data:"
echo "     python init/seed_data.py"
echo ""
echo "  3. Start your API:"
echo "     cd ../api && uvicorn main:app --reload"
echo ""
echo "=========================================="
