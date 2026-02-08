#!/bin/bash

# Terraform Import Script for nbhd.city
# This script imports existing AWS resources into the Terraform state
# Usage: ./scripts/terraform-import.sh

set -e

cd "$(dirname "${BASH_SOURCE[0]}")/../devops"

echo "================================"
echo "Terraform Import Script"
echo "================================"
echo "Importing existing AWS resources into Terraform state..."
echo ""

# Function to import a resource
import_resource() {
    local tf_resource=$1
    local aws_id=$2
    echo "Importing: $tf_resource -> $aws_id"
    tofu import -auto-approve "$tf_resource" "$aws_id" || echo "⚠️  Import failed or resource already imported: $tf_resource"
}

echo "=== Importing IAM Roles ==="
import_resource "aws_iam_role.lambda_execution" "nbhd-city-lambda-execution-role"
import_resource "aws_iam_role.lambda_exec" "nbhd-city-lambda-exec-production"
import_resource "aws_iam_role.api_gateway_cloudwatch" "nbhd-city-api-gateway-cloudwatch-production"
import_resource "aws_iam_role.lambda_edge_subdomain_router" "nbhd-city-lambda-edge-subdomain-router-production"
import_resource "aws_iam_role.lambda_template_analyzer_exec" "nbhd-city-template-analyzer-production"
import_resource "aws_iam_role.lambda_site_builder_exec" "nbhd-city-site-builder-production"

echo ""
echo "=== Importing IAM Policies ==="
import_resource "aws_iam_policy.lambda_logging" "nbhd-city-lambda-logging-production"
import_resource "aws_iam_policy.lambda_template_analyzer_logging" "nbhd-city-template-analyzer-logging-production"
import_resource "aws_iam_policy.lambda_site_builder_logging" "nbhd-city-site-builder-logging-production"

echo ""
echo "=== Importing CloudWatch Log Groups ==="
import_resource "aws_cloudwatch_log_group.api_gateway" "/aws/apigateway/nbhd-city-api"
import_resource "aws_cloudwatch_log_group.lambda" "/aws/lambda/nbhd-city-api"
import_resource "aws_cloudwatch_log_group.lambda_template_analyzer" "/aws/lambda/nbhd-city-template-analyzer-production"
import_resource "aws_cloudwatch_log_group.lambda_site_builder" "/aws/lambda/nbhd-city-site-builder-production"

echo ""
echo "=== Importing DynamoDB Tables ==="
import_resource "aws_dynamodb_table.nbhd_city" "nbhd-city-production"
import_resource "aws_dynamodb_table.terraform_locks" "terraform-locks"

echo ""
echo "=== Importing S3 Buckets ==="
import_resource "aws_s3_bucket.frontend" "nbhd-city-frontend-590183759956"
import_resource "aws_s3_bucket.sites" "nbhd-city-sites-590183759956"
import_resource "aws_s3_bucket.terraform_state" "nbhd-city-terraform-state-590183759956"

echo ""
echo "=== Importing CloudFront Cache Policies ==="
# CloudFront cache policies use their full ARN or can be imported by name
# First, get the policy IDs from AWS
echo "Fetching CloudFront cache policy IDs..."
FRONTEND_API_POLICY=$(aws cloudfront list-cache-policies --query "CachePolicyList.Items[?Name=='nbhd-city-frontend-api-cache-policy'].Id" --output text)
FRONTEND_STATIC_POLICY=$(aws cloudfront list-cache-policies --query "CachePolicyList.Items[?Name=='nbhd-city-frontend-static-cache-policy'].Id" --output text)
SITES_POLICY=$(aws cloudfront list-cache-policies --query "CachePolicyList.Items[?Name=='nbhd-city-sites-cache-policy'].Id" --output text)

if [ ! -z "$FRONTEND_API_POLICY" ]; then
    import_resource "aws_cloudfront_cache_policy.frontend_api" "$FRONTEND_API_POLICY"
fi

if [ ! -z "$FRONTEND_STATIC_POLICY" ]; then
    import_resource "aws_cloudfront_cache_policy.frontend_static" "$FRONTEND_STATIC_POLICY"
fi

if [ ! -z "$SITES_POLICY" ]; then
    import_resource "aws_cloudfront_cache_policy.sites" "$SITES_POLICY"
fi

echo ""
echo "=== Importing CloudFront Origin Request Policies ==="
SITES_ORP=$(aws cloudfront list-origin-request-policies --query "OriginRequestPolicyList.Items[?Name=='nbhd-city-sites-origin-request-policy'].Id" --output text)

if [ ! -z "$SITES_ORP" ]; then
    import_resource "aws_cloudfront_origin_request_policy.sites" "$SITES_ORP"
fi

echo ""
echo "=== Importing CloudFront Origin Access Controls ==="
FRONTEND_OAC=$(aws cloudfront list-origin-access-controls --query "OriginAccessControlList.Items[?Name=='nbhd-city-frontend-oac'].Id" --output text)
SITES_OAC=$(aws cloudfront list-origin-access-controls --query "OriginAccessControlList.Items[?Name=='nbhd-city-sites-oac'].Id" --output text)

if [ ! -z "$FRONTEND_OAC" ]; then
    import_resource "aws_cloudfront_origin_access_control.frontend" "$FRONTEND_OAC"
fi

if [ ! -z "$SITES_OAC" ]; then
    import_resource "aws_cloudfront_origin_access_control.sites" "$SITES_OAC"
fi

echo ""
echo "================================"
echo "Import Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Review the terraform state: tofu state list"
echo "2. Run terraform plan to verify: tofu plan -var-file=terraform.tfvars"
echo "3. If the plan looks good, apply it: tofu apply"
