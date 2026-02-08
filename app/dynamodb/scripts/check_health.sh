#!/bin/bash
# Check if DynamoDB Local services are healthy

echo "Checking service health..."
echo ""

# Check DynamoDB Local
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "✓ DynamoDB Local (http://localhost:8000) - OK"
else
    echo "✗ DynamoDB Local (http://localhost:8000) - NOT RESPONDING"
fi

# Check DynamoDB Admin
if curl -s http://localhost:8001 > /dev/null 2>&1; then
    echo "✓ DynamoDB Admin (http://localhost:8001) - OK"
else
    echo "✗ DynamoDB Admin (http://localhost:8001) - NOT RESPONDING"
fi
