# Terraform State Import Guide

## Overview

This document explains how to import existing AWS resources into the Terraform state. This is a **one-time operation** that allows Terraform to manage resources that were created outside of Terraform.

## Why Import?

The GitHub Actions deployment failures show that AWS resources already exist (created previously), but Terraform's state doesn't know about them. This causes "resource already exists" errors when trying to apply the Terraform plan.

## Resources to Import

Based on the latest GitHub Actions run, the following resources need to be imported:

### IAM Roles (6)
- `nbhd-city-lambda-execution-role`
- `nbhd-city-lambda-exec-production`
- `nbhd-city-api-gateway-cloudwatch-production`
- `nbhd-city-lambda-edge-subdomain-router-production`
- `nbhd-city-template-analyzer-production`
- `nbhd-city-site-builder-production`

### IAM Policies (3)
- `nbhd-city-lambda-logging-production`
- `nbhd-city-template-analyzer-logging-production`
- `nbhd-city-site-builder-logging-production`

### CloudWatch Log Groups (4)
- `/aws/apigateway/nbhd-city-api`
- `/aws/lambda/nbhd-city-api`
- `/aws/lambda/nbhd-city-template-analyzer-production`
- `/aws/lambda/nbhd-city-site-builder-production`

### DynamoDB Tables (2)
- `nbhd-city-production`
- `terraform-locks`

### S3 Buckets (3)
- `nbhd-city-frontend-590183759956`
- `nbhd-city-sites-590183759956`
- `nbhd-city-terraform-state-590183759956`

### CloudFront Cache Policies (3)
- `nbhd-city-frontend-api-cache-policy`
- `nbhd-city-frontend-static-cache-policy`
- `nbhd-city-sites-cache-policy`

### CloudFront Origin Request Policies (1)
- `nbhd-city-sites-origin-request-policy`

### CloudFront Origin Access Controls (2)
- `nbhd-city-frontend-oac`
- `nbhd-city-sites-oac`

## How to Run the Import Script

### Prerequisites
- AWS credentials configured locally
- OpenTofu installed (or Terraform)
- Access to the nbhd.city project

### Running the Script

```bash
cd /path/to/nbhd.city
./scripts/terraform-import.sh
```

The script will:
1. Navigate to the `devops/` directory
2. Import all resources in the correct order
3. Skip any resources that are already imported
4. Display the progress of each import

### After Import

Once the import completes, verify the state:

```bash
cd devops
tofu state list
```

This should show all the imported resources.

### Next Steps

After successful import:

1. **Review the plan** to ensure no resources will be destroyed:
   ```bash
   tofu plan -var-file=terraform.tfvars
   ```

2. **Apply the plan** if everything looks good:
   ```bash
   tofu apply -var-file=terraform.tfvars
   ```

3. **Commit the terraform state** (if using remote state, this happens automatically):
   ```bash
   git add .
   git commit -m "Add imported terraform resources to state"
   ```

## Troubleshooting

### Import Script Not Executable
If you get "permission denied", make it executable:
```bash
chmod +x scripts/terraform-import.sh
```

### CloudFront Policy IDs Not Found
If the script can't find CloudFront policies by name, you can manually import them:
```bash
# List all cache policies
aws cloudfront list-cache-policies

# Import by ID
cd devops
tofu import aws_cloudfront_cache_policy.frontend_api <POLICY_ID>
```

### "Resource already imported" Error
This is expected and harmless - it means the resource is already in the state. The script handles this gracefully and continues.

### Missing AWS Credentials
If the script fails with credential errors:
```bash
# Configure AWS CLI
aws configure

# Or use environment variables
export AWS_ACCESS_KEY_ID=<your-key>
export AWS_SECRET_ACCESS_KEY=<your-secret>
```

## Manual Import Commands

If you need to import individual resources, use these commands:

```bash
cd devops

# IAM
tofu import aws_iam_role.lambda_execution nbhd-city-lambda-execution-role
tofu import aws_iam_policy.lambda_logging nbhd-city-lambda-logging-production

# DynamoDB
tofu import aws_dynamodb_table.nbhd_city nbhd-city-production

# S3
tofu import aws_s3_bucket.frontend nbhd-city-frontend-590183759956

# CloudWatch
tofu import aws_cloudwatch_log_group.api_gateway /aws/apigateway/nbhd-city-api
```

## What NOT to Do

⚠️ **Do NOT**:
- Run imports in the CI/CD pipeline - this is a one-time local operation
- Delete resources from AWS and re-import them
- Modify terraform state files directly
- Run `tofu destroy` without careful review of what will be deleted

## References

- [Terraform Import Documentation](https://www.terraform.io/docs/import/)
- [OpenTofu Documentation](https://opentofu.org/)
