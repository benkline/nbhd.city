# Deployment Guide

Self-hosting nbhd.city on AWS with Terraform infrastructure.

## Overview

nbhd.city is designed for **self-hosting** - each community forks the repo and deploys to their own AWS account.

**Key Benefits:**
- No vendor lock-in
- Full control over data
- Community governance
- Serverless (no server management)
- Low cost ($5-15/month for 100+ users)

## Prerequisites

- **AWS Account** - For Lambda, DynamoDB, S3, CloudFront
- **Terraform** - For infrastructure as code
- **AWS CLI** - For managing credentials
- **Git** - For cloning the repo
- **BlueSky OAuth App** - For authentication

## Quick Start Deployment

### 1. Fork & Clone Repository

```bash
# Fork on GitHub, then clone
git clone https://github.com/yourname/nbhd.city.git
cd nbhd.city
```

### 2. Set Up AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Enter:
# AWS Access Key ID: your_key
# AWS Secret Access Key: your_secret
# Default region: us-east-1
# Default output format: json
```

### 3. Create Terraform Variables

```bash
cd devops

# Copy example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your settings
cat > terraform.tfvars <<EOF
project_name = "myneighborhood"
aws_region = "us-east-1"
environment = "production"

# BlueSky OAuth credentials
bluesky_client_id = "your_client_id"
bluesky_client_secret = "your_client_secret"

# Custom domain (optional)
custom_domain = "myneighborhood.com"
EOF
```

### 4. Create BlueSky OAuth App

1. Create BlueSky account at bsky.social
2. Go to Settings → Developer → Create OAuth Client
3. Enter redirect URI: `https://app.{project_name}.nbhd.city/auth/callback`
4. Copy client ID and secret to `terraform.tfvars`

### 5. Initialize & Deploy with Terraform

```bash
cd devops

# Initialize Terraform
terraform init

# Review changes
terraform plan

# Deploy to AWS
terraform apply

# Confirm with 'yes' when prompted
```

Terraform will create:
- S3 buckets (frontend, sites, backups)
- DynamoDB table
- Lambda functions
- CloudFront distribution
- Route 53 DNS records (if using custom domain)
- IAM roles and policies

### 6. Deploy Frontend & Backend Code

```bash
# Build frontend
cd app/UI
npm install
npm run build

# Upload to S3
aws s3 sync dist/ s3://myneighborhood-frontend/

# Deploy backend (packaged as Lambda)
cd ../api
pip install -r requirements.txt
# (backend is deployed via Terraform)
```

### 7. Verify Deployment

Visit: `https://app.myneighborhood.nbhd.city`

Should see login page with "Sign In with BlueSky" button.

## Infrastructure Overview

### AWS Services Used

| Service | Purpose | Cost |
|---------|---------|------|
| Lambda | Compute for API and builds | ~$1-3/month |
| DynamoDB | Database (on-demand) | ~$1-5/month |
| S3 | Static hosting and storage | ~$1-2/month |
| CloudFront | CDN and subdomains | ~$1-3/month |
| Route 53 | DNS (optional) | ~$0.50/month |
| **Total** | | ~$5-15/month |

### Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│         Route 53 (Custom Domain)                 │
├─────────────────────────────────────────────────┤
│  app.example.com  ←→  CloudFront Distribution   │
├─────────────────────────────────────────────────┤
│ ┌─────────────────┐        ┌─────────────────┐  │
│ │   Frontend SPA  │        │  Site Builder   │  │
│ │  (S3 + CF)      │        │  (Lambda + S3)  │  │
│ └────────┬────────┘        └────────┬────────┘  │
│          │                          │             │
│          └──────────┬───────────────┘             │
│                     ▼                             │
│          ┌──────────────────────┐               │
│          │    Lambda (API)      │               │
│          │   FastAPI runtime    │               │
│          └──────────┬───────────┘               │
│                     │                           │
│          ┌──────────▼───────────┐               │
│          │     DynamoDB         │               │
│          │   (NoSQL, On-Demand) │               │
│          └──────────────────────┘               │
└─────────────────────────────────────────────────┘
```

## Terraform Configuration

### Main Terraform Files

```
devops/
├── main.tf              # Main infrastructure
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── lambda.tf            # Lambda configuration
├── dynamodb.tf          # Database setup
├── s3.tf                # Storage buckets
├── cloudfront.tf        # CDN setup
├── iam.tf               # Permissions
└── terraform.tfvars     # Your configuration
```

### Key Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `project_name` | Prefix for all resources | `myneighborhood` |
| `aws_region` | AWS region for deployment | `us-east-1` |
| `environment` | Dev/prod environment | `production` |
| `bluesky_client_id` | BlueSky OAuth ID | `your_id_here` |
| `bluesky_client_secret` | BlueSky OAuth secret | `your_secret_here` |
| `custom_domain` | Optional custom domain | `myneighborhood.com` |

### Common Terraform Commands

```bash
# Initialize (first time)
terraform init

# Plan changes (review before applying)
terraform plan
terraform plan -out=tfplan

# Apply changes (deploy to AWS)
terraform apply
terraform apply tfplan

# Check current state
terraform state list
terraform state show aws_s3_bucket.frontend

# Destroy everything (careful!)
terraform destroy
```

## Environment Variables

### Backend (.env)

Create `app/api/.env` with:

```
# AWS Configuration
AWS_REGION=us-east-1
DYNAMODB_ENDPOINT_URL=  # Empty for production (uses real DynamoDB)

# Authentication
JWT_SECRET=your-very-secure-secret-key-here
BLUESKY_OAUTH_CLIENT_ID=your_client_id
BLUESKY_OAUTH_CLIENT_SECRET=your_client_secret
BLUESKY_OAUTH_REDIRECT_URI=https://app.yourneighborhood.nbhd.city/auth/callback

# API Configuration
API_PORT=8001
API_HOST=0.0.0.0
DEBUG=false  # Set to false in production
```

### Frontend (.env)

Create `app/UI/.env` with:

```
VITE_API_URL=https://api.yourneighborhood.nbhd.city
VITE_APP_NAME=My Neighborhood
```

## Monitoring & Logs

### CloudWatch Logs

View Lambda and API logs:

```bash
# View recent API logs
aws logs tail /aws/lambda/myneighborhood-api --follow

# View specific time range
aws logs get-log-events \
  --log-group-name /aws/lambda/myneighborhood-api \
  --log-stream-name $(aws logs describe-log-streams \
    --log-group-name /aws/lambda/myneighborhood-api \
    --order-by LastEventTime --descending \
    --max-items 1 --query 'logStreams[0].logStreamName' \
    --output text)
```

### CloudWatch Metrics

Monitor usage:
- Lambda invocations and duration
- DynamoDB read/write capacity
- Error rates

View in AWS Console: CloudWatch → Dashboards

## Updates & Maintenance

### Rolling Updates

To deploy new code without downtime:

```bash
# 1. Build new frontend
cd app/UI
npm run build

# 2. Upload to S3
aws s3 sync dist/ s3://myneighborhood-frontend/

# 3. Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"

# 4. Backend updates
cd ../api
# (handled by Terraform)
terraform apply
```

### Backing Up Data

Enable DynamoDB point-in-time recovery:

```bash
aws dynamodb update-continuous-backups \
  --table-name myneighborhood-main \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### Monitoring Costs

Check AWS billing:
1. AWS Console → Billing and Cost Management
2. Set up cost alerts
3. Review usage by service

Typical costs:
- Lambda: $1-3/month
- DynamoDB: $1-5/month
- S3/CloudFront: $2-5/month
- Total: $5-15/month for small neighborhoods

## Scaling

### For Growth (More Users)

1. **DynamoDB** - On-demand pricing scales automatically
2. **Lambda** - Automatic scaling (no config needed)
3. **CloudFront** - Automatic scaling
4. **S3** - Automatic scaling

No code changes needed—AWS handles scaling.

### Cost Optimization

- Use S3 lifecycle policies to archive old data
- Enable CloudFront compression
- Set DynamoDB TTL for temporary data
- Review CloudWatch metrics regularly

## Troubleshooting

### Lambda Cold Starts

Problem: API slow on first request
Solution: Lambda cold starts are normal. Use provisioned concurrency for frequently accessed functions.

### DynamoDB Throttling

Problem: "ProvisionedThroughputExceededException"
Solution: DynamoDB on-demand mode auto-scales. No throttling expected.

### CloudFront Caching

Problem: Updates not showing
Solution: Invalidate CloudFront cache:
```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

### BlueSky OAuth Redirect

Problem: Redirect URI mismatch
Solution: Ensure OAuth app redirect URI matches exactly:
```
https://app.yourneighborhood.nbhd.city/auth/callback
```

## Security

### Best Practices

1. **Use AWS Secrets Manager** for sensitive config
2. **Enable MFA** on AWS account
3. **Use IAM roles** for service permissions
4. **Enable CloudTrail** for audit logging
5. **Rotate JWT_SECRET** regularly
6. **Use HTTPS** everywhere (CloudFront enforces)

### Secrets Management

Store sensitive data in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name myneighborhood/app-secrets \
  --secret-string '{"jwt_secret":"...", ...}'
```

Retrieve in code:
```python
import json
import boto3

client = boto3.client('secretsmanager')
response = client.get_secret_value(SecretId='myneighborhood/app-secrets')
secrets = json.loads(response['SecretString'])
```

## Advanced Configuration

### Custom Domain

Set `custom_domain` in `terraform.tfvars`:

```hcl
custom_domain = "myneighborhood.com"
```

Terraform will:
1. Create Route 53 hosted zone
2. Create SSL certificate (ACM)
3. Point domain to CloudFront
4. (You need to update domain registrar nameservers)

### Regional Deployment

Deploy to multiple AWS regions for disaster recovery:

```bash
# Create separate Terraform workspace per region
terraform workspace new us-west-2
terraform apply -var="aws_region=us-west-2"
```

## Related Documentation

- **[Architecture](./architecture.md)** - System design
- **[Getting Started](./getting-started.md)** - Local development
- **[specs/INFRASTRUCTURE.md](../specs/INFRASTRUCTURE.md)** - Detailed infrastructure specs
- **[Terraform Documentation](https://www.terraform.io/)** - IaC reference

---

**Deployment Cost:** $5-15/month for communities up to 100+ users
**Setup Time:** ~30 minutes with AWS account
**Maintenance:** Minimal (serverless handles scaling)
