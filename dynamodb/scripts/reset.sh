#!/bin/bash
# Reset DynamoDB Local (delete all data and tables)

cd "$(dirname "$0")/.."

echo "=========================================="
echo "WARNING: This will delete all local data!"
echo "=========================================="
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Reset cancelled"
    exit 0
fi

echo ""
echo "Stopping services..."
docker-compose down

echo "Deleting data..."
rm -rf dynamodb_data/*

echo "Starting services..."
docker-compose up -d

echo ""
echo "Waiting for services to be ready..."
sleep 10

echo ""
echo "✓ Reset complete!"
echo ""
echo "Tables have been recreated. You may want to seed test data:"
echo "  python init/seed_data.py"
