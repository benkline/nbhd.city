# Terraform Infrastructure Summary

The complete Terraform infrastructure for nbhd.city has been created in the `devops/` directory.

## What Was Created

### Core Infrastructure Files

1. **[devops/main.tf](devops/main.tf)** - Provider configuration and AWS setup
2. **[devops/variables.tf](devops/variables.tf)** - All configurable variables
3. **[devops/outputs.tf](devops/outputs.tf)** - Output values after deployment
4. **[devops/dynamodb.tf](devops/dynamodb.tf)** - DynamoDB table with 3 GSIs
5. **[devops/lambda.tf](devops/lambda.tf)** - Lambda function configuration
6. **[devops/api_gateway.tf](devops/api_gateway.tf)** - API Gateway REST API
7. **[devops/iam.tf](devops/iam.tf)** - IAM roles and policies

### Configuration & Documentation

8. **[devops/terraform.tfvars.example](devops/terraform.tfvars.example)** - Example configuration
9. **[devops/README.md](devops/README.md)** - Comprehensive deployment guide
10. **[devops/DEPLOYMENT_CHECKLIST.md](devops/DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist
11. **[devops/.gitignore](devops/.gitignore)** - Git ignore for Terraform files

### Application Files

12. **[api/lambda_handler.py](api/lambda_handler.py)** - Lambda handler using Mangum
13. **[api/requirements.txt](api/requirements.txt)** - Updated with `mangum` dependency

## AWS Resources Created

When you run `terraform apply`, it creates:

### Data Storage
- **DynamoDB Table** - `nbhd-city-{environment}`
  - On-demand billing (pay per request)
  - Point-in-Time Recovery enabled
  - Server-side encryption enabled
  - 3 Global Secondary Indexes (GSI1, GSI2, GSI3)

### Compute
- **Lambda Function** - `nbhd-city-api-{environment}`
  - Python 3.11 runtime
  - 512MB memory (configurable)
  - 30 second timeout (configurable)
  - FastAPI application via Mangum adapter

### Networking
- **API Gateway REST API** - `nbhd-city-api-{environment}`
  - Regional endpoint
  - Proxy integration with Lambda
  - CORS enabled
  - Throttling: 10,000 req/sec, 5,000 burst

### Security
- **IAM Execution Role** for Lambda
  - CloudWatch Logs write permissions
  - DynamoDB read/write permissions
- **IAM Role** for API Gateway
  - CloudWatch Logs write permissions

### Monitoring
- **CloudWatch Log Groups**
  - `/aws/lambda/nbhd-city-api-{environment}`
  - `/aws/apigateway/nbhd-city-{environment}`
  - 14-day retention (configurable)

## Quick Start

```bash
# 1. Configure
cd devops
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 2. Initialize
terraform init

# 3. Deploy
terraform plan
terraform apply

# 4. Get API URL
terraform output api_gateway_url
```

## Cost Estimate

For **100,000 API requests/month**:

| Service | Cost |
|---------|------|
| DynamoDB (on-demand) | $1-5 |
| Lambda (512MB, 30s avg) | $1-3 |
| API Gateway | $0.35 |
| CloudWatch Logs | $1-2 |
| Data Transfer | $1-5 |
| **Total** | **~$5-15/month** |

Costs scale linearly with usage. On-demand billing is ideal for MVP/unpredictable traffic.

## Key Features

✅ **Fully Serverless** - No servers to manage
✅ **Auto-Scaling** - Handles traffic spikes automatically
✅ **Pay-Per-Use** - Only pay for what you use
✅ **High Availability** - Multi-AZ by default
✅ **Secure** - IAM-based access control, encryption at rest
✅ **Observable** - CloudWatch logs and metrics
✅ **Version Controlled** - Infrastructure as code
✅ **Reproducible** - Deploy to multiple environments

## Configuration Options

All configurable via `terraform.tfvars`:

- **Environment**: dev, staging, production
- **AWS Region**: Any AWS region
- **DynamoDB Billing**: On-demand or provisioned
- **Lambda Memory**: 128MB to 10GB
- **Lambda Timeout**: 1 to 900 seconds
- **API Throttling**: Custom rate limits
- **Logging Level**: OFF, ERROR, INFO
- **X-Ray Tracing**: Enable/disable
- **Custom Domain**: Optional

## Next Steps

1. **Deploy Infrastructure**
   - Follow [devops/README.md](devops/README.md)
   - Use [devops/DEPLOYMENT_CHECKLIST.md](devops/DEPLOYMENT_CHECKLIST.md)

2. **Migrate Data** (if coming from PostgreSQL)
   - Follow [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
   - Use scripts in `scripts/` directory

3. **Test Deployment**
   - Test health endpoint
   - Test all API endpoints
   - Verify CloudWatch logs

4. **Production Hardening**
   - Set up CloudWatch alarms
   - Enable X-Ray tracing
   - Configure custom domain
   - Set up AWS Budget alerts
   - Review security settings

## Terraform Commands Reference

```bash
# Initialize
terraform init

# Validate configuration
terraform validate

# Format code
terraform fmt

# Plan deployment (preview changes)
terraform plan

# Apply changes
terraform apply

# Show current state
terraform show

# List outputs
terraform output

# Destroy infrastructure
terraform destroy

# Target specific resource
terraform apply -target=aws_lambda_function.api

# Use different variable file
terraform apply -var-file=staging.tfvars
```

## Architecture Diagram

```
┌─────────────┐
│   Internet  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  API Gateway    │  ← Regional Endpoint
│  REST API       │  ← Throttling: 10k req/sec
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Lambda         │  ← Python 3.11
│  FastAPI App    │  ← 512MB, 30s timeout
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DynamoDB       │  ← Single Table Design
│  nbhd-city      │  ← On-demand billing
│  + 3 GSIs       │  ← Point-in-Time Recovery
└─────────────────┘
```

## Support & Documentation

- **Deployment Guide**: [devops/README.md](devops/README.md)
- **Migration Guide**: [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- **Database Plan**: [database_migration_plan.md](database_migration_plan.md)
- **Deployment Checklist**: [devops/DEPLOYMENT_CHECKLIST.md](devops/DEPLOYMENT_CHECKLIST.md)

## Terraform Providers

- **AWS Provider**: ~> 5.0 (hashicorp/aws)
- **Archive Provider**: ~> 2.4 (hashicorp/archive)

## Additional Features (Optional)

The infrastructure supports:

- **Custom Domains**: Uncomment in `api_gateway.tf`
- **Lambda Layers**: Set `use_lambda_layer = true`
- **X-Ray Tracing**: Set `enable_xray_tracing = true`
- **DynamoDB Streams**: Set `enable_streams = true`
- **VPC Integration**: Uncomment VPC config in `lambda.tf`
- **Remote State**: Uncomment S3 backend in `main.tf`

---

**Ready to deploy?** Follow [devops/DEPLOYMENT_CHECKLIST.md](devops/DEPLOYMENT_CHECKLIST.md) for step-by-step instructions!
