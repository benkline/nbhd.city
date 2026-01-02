#!/bin/bash
# Stop DynamoDB Local development environment

cd "$(dirname "$0")/.."

echo "Stopping DynamoDB Local services..."
docker-compose down

echo "✓ Services stopped"
echo ""
echo "Note: Data is preserved in ./dynamodb_data/"
echo "To completely reset, run: ./scripts/reset.sh"
