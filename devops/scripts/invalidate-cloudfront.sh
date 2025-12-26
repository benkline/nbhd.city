#!/bin/bash

# Script to invalidate CloudFront cache after deploying new frontend code

set -e

# Get the distribution ID from terraform output
DISTRIBUTION_ID=$(cd .. && tofu output -raw cloudfront_distribution_id 2>/dev/null || echo "")

if [ -z "$DISTRIBUTION_ID" ]; then
  echo "Error: Could not find CloudFront distribution ID"
  echo "Make sure you're in the devops directory and have deployed infrastructure"
  exit 1
fi

echo "Invalidating CloudFront distribution: $DISTRIBUTION_ID"

# Create invalidation
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo "Created invalidation: $INVALIDATION_ID"
echo "Waiting for invalidation to complete..."

# Wait for invalidation to complete
aws cloudfront wait invalidation-completed \
  --distribution-id "$DISTRIBUTION_ID" \
  --id "$INVALIDATION_ID"

echo "✓ CloudFront cache invalidated successfully"
echo "Frontend at: https://$(cd .. && tofu output -raw cloudfront_domain_name)"
