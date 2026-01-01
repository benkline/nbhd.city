# nbhd.city Terraform Deployment Guide

This directory contains Terraform configuration files to deploy the nbhd.city application to AWS.

## Architecture

The deployment creates the following AWS resources:

- **DynamoDB Table**: Single-table design with 3 Global Secondary Indexes
- **Lambda Function**: Python 3.11 serverless function running FastAPI
- **API Gateway**: REST API with proxy integration to Lambda
- **IAM Roles & Policies**: Execution roles for Lambda and API Gateway
- **CloudWatch Log Groups**: Centralized logging for Lambda and API Gateway

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
   ```bash
   aws configure
   ```

2. **Terraform** installed (version >= 1.0)
   ```bash
   terraform version
   ```

3. **Python 3.11+** for building the Lambda package

4. **AWS Account** with permissions to create:
   - DynamoDB tables
   - Lambda functions
   - API Gateway APIs
   - IAM roles and policies
   - CloudWatch log groups

## Quick Start

### 1. Configure Variables

Copy the example tfvars file and update with your values:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:
- `jwt_secret_key` - At least 32 characters (generate with `openssl rand -base64 32`)
- `bluesky_oauth_client_id` - Your BlueSky OAuth client ID
- `bluesky_oauth_client_secret` - Your BlueSky OAuth client secret
- `frontend_url` - Your frontend application URL
- `bluesky_oauth_redirect_uri` - Your API callback URL

### 2. Initialize Terraform

```bash
terraform init
```

This downloads required providers (AWS, Archive).

### 3. Plan Deployment

```bash
terraform plan
```

Review the resources that will be created.

### 4. Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted. This will:
- Create DynamoDB table (~1 minute)
- Create IAM roles and policies (~1 minute)
- Package and deploy Lambda function (~2 minutes)
- Create API Gateway (~1 minute)

### 5. Get API URL

After successful deployment:

```bash
terraform output api_gateway_url
```

Your API will be available at the output URL.

## File Structure

```
devops/
├── main.tf              # Provider and backend configuration
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── dynamodb.tf          # DynamoDB table and indexes
├── lambda.tf            # Lambda function and CloudWatch logs
├── api_gateway.tf       # API Gateway configuration
├── iam.tf               # IAM roles and policies
├── terraform.tfvars     # Your configuration values (gitignored)
└── README.md            # This file
```

## Configuration Options

### Environment

Deploy to different environments:

```bash
terraform apply -var="environment=dev"
terraform apply -var="environment=staging"
terraform apply -var="environment=production"
```

### DynamoDB Billing Mode

**On-Demand** (default, recommended for unpredictable traffic):
```hcl
dynamodb_billing_mode = "PAY_PER_REQUEST"
```

**Provisioned** (cheaper for predictable traffic):
```hcl
dynamodb_billing_mode = "PROVISIONED"
```

### Lambda Configuration

Adjust Lambda settings in `terraform.tfvars`:

```hcl
lambda_memory_size = 1024  # More memory = faster execution
lambda_timeout     = 30    # Maximum 900 seconds
```

### API Gateway Throttling

Control rate limits:

```hcl
api_gateway_throttle_rate_limit  = 10000  # Requests per second
api_gateway_throttle_burst_limit = 5000   # Burst capacity
```

## Custom Domain (Optional)

To use a custom domain:

1. Create ACM certificate in us-east-1:
   ```bash
   aws acm request-certificate \
     --domain-name api.nbhd.city \
     --validation-method DNS \
     --region us-east-1
   ```

2. Add to `terraform.tfvars`:
   ```hcl
   custom_domain_name  = "api.nbhd.city"
   acm_certificate_arn = "arn:aws:acm:us-east-1:..."
   ```

3. Uncomment custom domain resources in `api_gateway.tf`

4. Apply changes:
   ```bash
   terraform apply
   ```

5. Create DNS record pointing to API Gateway domain

## Monitoring & Logs

### CloudWatch Logs

View Lambda logs:
```bash
aws logs tail /aws/lambda/nbhd-city-api-production --follow
```

View API Gateway logs:
```bash
aws logs tail /aws/apigateway/nbhd-city-production --follow
```

### CloudWatch Metrics

Lambda metrics are available in CloudWatch:
- Invocations
- Duration
- Errors
- Throttles

API Gateway metrics:
- Request count
- Latency (p50, p90, p99)
- 4xx and 5xx errors

### Set Up Alarms

Create CloudWatch alarms for monitoring (example):

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name nbhd-city-high-errors \
  --alarm-description "Alert on high error rate" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=nbhd-city-api-production
```

## Updating the Application

### Update Code

1. Make code changes in `../api/`
2. Run `terraform apply`
3. Terraform will detect the change and update Lambda

### Update Configuration

1. Edit `terraform.tfvars`
2. Run `terraform apply`

### Update Infrastructure

1. Edit `.tf` files
2. Run `terraform plan` to preview changes
3. Run `terraform apply` to apply

## Testing

### Test API Health

```bash
curl https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/production/health
```

Expected response:
```json
{"status": "healthy"}
```

### Test Neighborhoods Endpoint

```bash
curl https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/production/api/nbhds
```

### Test with Authentication

Get a token first, then:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/production/api/users/me/nbhds
```

## Troubleshooting

### Lambda Function Errors

**Check CloudWatch Logs:**
```bash
aws logs tail /aws/lambda/nbhd-city-api-production --follow
```

**Common issues:**
- Missing environment variables
- DynamoDB permissions
- Package dependencies not installed

### API Gateway 502 Errors

Usually caused by:
- Lambda timeout (increase in `terraform.tfvars`)
- Lambda out of memory (increase memory_size)
- Lambda crashes on startup (check logs)

### DynamoDB Access Denied

Verify IAM policy:
```bash
aws iam get-role-policy \
  --role-name nbhd-city-lambda-exec-production \
  --policy-name nbhd-city-lambda-dynamodb-production
```

### High Costs

**Check DynamoDB usage:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=nbhd-city-production \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

**Optimize:**
- Use on-demand billing for unpredictable traffic
- Use provisioned capacity for consistent traffic
- Enable auto-scaling for provisioned capacity

## Destroying Infrastructure

To remove all resources:

```bash
terraform destroy
```

**Warning:** This will delete:
- DynamoDB table and all data
- Lambda function
- API Gateway
- All logs

## Security Best Practices

1. **Secrets Management**: Store sensitive values in AWS Secrets Manager or Parameter Store instead of `terraform.tfvars`

2. **State File**: Use S3 backend with encryption for state file (uncomment in `main.tf`)

3. **IAM**: Review and restrict IAM policies to minimum required permissions

4. **Logging**: Enable CloudTrail for audit logging

5. **Network**: Consider deploying Lambda in VPC for enhanced security

6. **API Gateway**: Enable API keys or OAuth for production

## Cost Estimation

### Typical Monthly Costs (for 100K requests/month):

- **DynamoDB**: $1-5 (on-demand)
- **Lambda**: $1-3 (512MB, 30s avg duration)
- **API Gateway**: $0.35
- **CloudWatch Logs**: $1-2
- **Data Transfer**: $1-5

**Total: ~$5-15/month**

Costs scale with usage. On-demand billing is cost-effective for MVP/low traffic.

## Support

For issues:
- Check [Terraform AWS Provider docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- Review [AWS Lambda docs](https://docs.aws.amazon.com/lambda/)
- See main project README

## Additional Resources

- [DynamoDB Migration Plan](../database_migration_plan.md)
- [Migration Guide](../MIGRATION_GUIDE.md)
- [API Documentation](../api/)
