# DevOps Setup Guide

Complete guide to deploy nbhd.city to AWS using OpenTofu.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [GitHub Actions CI/CD](#github-actions-cicd)
5. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **OpenTofu** >= 1.5.0
  ```bash
  # macOS
  brew install opentofu

  # Linux
  curl --proto '=https' --tlsv1.2 -fsSL https://get.opentofu.org/linux/install.sh | bash
  ```

- **AWS CLI** v2
  ```bash
  aws --version  # Should be 2.x
  ```

- **Node.js** 18+
  ```bash
  node --version  # Should be v18+
  ```

- **Python** 3.11+
  ```bash
  python3 --version
  ```

### AWS Account

1. Create an AWS account (if you don't have one)
2. Create an IAM user with programmatic access
3. Attach policy: `AdministratorAccess` (for simplicity; restrict in production)
4. Get Access Key ID and Secret Access Key

### BlueSky OAuth

1. Register your application at [atproto.com/docs/oauth](https://atproto.com/docs/oauth)
2. Get `client_id` and `client_secret`
3. Set redirect URI to (fill in after deployment): `https://<your-cloudfront-domain>/auth/success`

## Quick Start

### 1. Configure AWS

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1
# Default output format: json
```

### 2. Prepare Variables

```bash
cd devops
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
project_name                   = "nbhd-city"
environment                    = "dev"
aws_region                     = "us-east-1"

# Add your BlueSky credentials
bluesky_oauth_client_id        = "your-bluesky-client-id"
bluesky_oauth_client_secret    = "your-bluesky-client-secret"

# Generate a secure random key
jwt_secret_key                 = "generate-with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
```

### 3. Build Frontend

```bash
cd ../frontend
npm install
npm run build
cd ../devops
```

### 4. Build Lambda Layer

```bash
mkdir -p lambda_layer/python/lib/python3.11/site-packages
pip install -r ../api/requirements.txt \
  -t lambda_layer/python/lib/python3.11/site-packages/
```

### 5. Deploy

```bash
# Initialize
tofu init

# Validate configuration
tofu validate

# Plan deployment
tofu plan -out=tfplan

# Review the plan, then apply
tofu apply tfplan
```

### 6. Get Deployment Info

```bash
tofu output deployment_summary
```

You'll see:
- Frontend URL (CloudFront domain)
- API Gateway URL
- Other resource identifiers

### 7. Update BlueSky OAuth

Update your BlueSky OAuth app settings:
- Redirect URI: `https://<your-cloudfront-domain>/auth/success`

## Detailed Setup

### Verify Prerequisites

```bash
# Check all required tools
tofu version
aws --version
node --version
python3 --version
npm --version
```

### AWS Credentials

#### Option 1: AWS CLI Configuration

```bash
aws configure
```

#### Option 2: Environment Variables

```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

#### Option 3: AWS Profile

```bash
export AWS_PROFILE=your-profile-name
```

#### Verify Credentials

```bash
aws sts get-caller-identity
```

Should output your AWS account information.

### Project Structure

```
nbhd.city/
├── api/                    # Backend (FastAPI)
├── frontend/               # Frontend (React)
├── devops/                 # Infrastructure as Code
│   ├── provider.tf        # AWS provider config
│   ├── variables.tf       # Variable definitions
│   ├── frontend.tf        # S3 + CloudFront
│   ├── backend.tf         # Lambda + API Gateway
│   ├── outputs.tf         # Output values
│   ├── terraform.tfvars.example
│   └── scripts/
│       └── invalidate-cloudfront.sh
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions CI/CD
└── DEVOPS_SETUP.md        # This file
```

### Building the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Output is in dist/ folder
ls dist/
```

### Building Lambda Layer

Python dependencies must be packaged as a Lambda layer:

```bash
cd devops

# Create layer structure
mkdir -p lambda_layer/python/lib/python3.11/site-packages

# Install dependencies
pip install -r ../api/requirements.txt \
  -t lambda_layer/python/lib/python3.11/site-packages/ \
  --upgrade

# Verify
ls lambda_layer/python/lib/python3.11/site-packages/
```

### Initializing OpenTofu

```bash
cd devops

# Initialize (downloads providers, sets up backend)
tofu init

# This creates:
# - .terraform/ directory
# - .terraform.lock.hcl (dependency lock file)
```

### Creating terraform.tfvars

```bash
cp terraform.tfvars.example terraform.tfvars
```

**Important variables:**

```hcl
# Your project name (must be unique for S3 bucket)
project_name = "nbhd-city"

# Environment (dev/staging/prod)
environment = "dev"

# AWS region
aws_region = "us-east-1"

# BlueSky OAuth credentials
bluesky_oauth_client_id = "your-client-id"
bluesky_oauth_client_secret = "your-client-secret"

# JWT secret (generate with: python -c 'import secrets; print(secrets.token_urlsafe(32))')
jwt_secret_key = "your-secure-random-key"

# Lambda configuration
lambda_memory_size = 512  # MB
lambda_timeout = 30      # seconds
```

### Planning the Deployment

```bash
tofu plan -out=tfplan
```

This shows what OpenTofu will create:
- S3 bucket (frontend)
- CloudFront distribution
- Lambda function (API)
- API Gateway
- IAM roles
- CloudWatch logs

**Review the plan carefully** before applying.

### Applying the Deployment

```bash
# Review the plan first
tofu show tfplan

# Apply
tofu apply tfplan
```

This will create all AWS resources.

### Getting Deployment Info

```bash
# Show all outputs
tofu output

# Show specific output
tofu output cloudfront_domain_name
tofu output api_gateway_endpoint

# Show as JSON
tofu output -json > deployment.json
```

## GitHub Actions CI/CD

### Setup

1. **Add AWS Credentials to GitHub**

   Go to your GitHub repository:
   - Settings → Secrets and variables → Actions
   - Create secret: `AWS_ROLE_TO_ASSUME`
   - Value: Your AWS role ARN or access key ID

2. **Alternative: Using GitHub OIDC**

   More secure method without storing long-lived credentials:
   ```bash
   # Create an OIDC provider in AWS
   # See: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect
   ```

3. **Workflow File**

   The workflow is at `.github/workflows/deploy.yml`

   It runs on:
   - Push to main branch
   - Manual trigger (workflow_dispatch)

### Workflow Steps

1. Checkout code
2. Build backend (Python)
3. Build frontend (Node.js)
4. Upload frontend artifacts
5. Initialize OpenTofu
6. Plan infrastructure
7. Apply infrastructure
8. Output deployment info

### Manual Trigger

To manually trigger the workflow:

```bash
gh workflow run deploy.yml
```

Or via GitHub UI:
- Actions tab
- Select "Build and Deploy"
- Click "Run workflow"

### View Workflow Logs

```bash
gh workflow view deploy.yml

# Watch running workflow
gh run watch
```

## Deployment Workflow

### Day 1: Initial Deployment

1. Setup AWS credentials
2. Create OpenTofu variables
3. Build frontend: `npm run build`
4. Create Lambda layer
5. Deploy: `tofu apply`
6. Get CloudFront domain
7. Update BlueSky OAuth redirect URI

### Subsequent Deployments

**Update frontend only:**
```bash
cd frontend
npm run build
cd ../devops
tofu apply
# Invalidate CloudFront
./scripts/invalidate-cloudfront.sh
```

**Update backend only:**
```bash
# Edit API code
cd devops
tofu apply
```

**Update both:**
```bash
npm run build  # (from frontend dir)
tofu apply     # (from devops dir)
```

## Monitoring

### View Logs

**API Gateway:**
```bash
aws logs tail /aws/apigateway/nbhd-city-api --follow
```

**Lambda:**
```bash
aws logs tail /aws/lambda/nbhd-city-api --follow
```

### CloudWatch Metrics

```bash
aws cloudwatch list-metrics --namespace AWS/Lambda
```

## Cleanup

### Destroy Resources

⚠️ **This will delete everything**

```bash
cd devops
tofu destroy
```

Confirm when prompted.

### What Gets Deleted

- S3 bucket and all contents
- CloudFront distribution
- Lambda function
- API Gateway
- IAM roles and policies
- CloudWatch log groups

## Troubleshooting

### "Access Denied" Errors

**Issue:** Credentials not configured or insufficient permissions

**Solution:**
```bash
# Verify credentials
aws sts get-caller-identity

# Check IAM permissions (need admin or similar)
aws iam get-user
```

### "S3 bucket already exists"

**Issue:** S3 bucket names are globally unique

**Solution:** Change `project_name` in `terraform.tfvars`

### Lambda Timeout

**Issue:** API requests timing out

**Solution:** Increase `lambda_timeout` in `terraform.tfvars`:
```hcl
lambda_timeout = 60
```

### Frontend Not Updating

**Issue:** CloudFront serving old version

**Solution:** Invalidate cache
```bash
./scripts/invalidate-cloudfront.sh
```

### "Module not found" in Lambda

**Issue:** Python dependencies not packaged in layer

**Solution:** Recreate Lambda layer:
```bash
rm -rf lambda_layer/
mkdir -p lambda_layer/python/lib/python3.11/site-packages
pip install -r ../api/requirements.txt -t lambda_layer/python/lib/python3.11/site-packages/
tofu apply
```

## Cost Estimation

Monthly costs (approximate):

| Service | Cost | Notes |
|---------|------|-------|
| S3 | $0.50-$1 | Storage only, no transfer |
| CloudFront | $0.50-$5 | Depends on traffic |
| Lambda | Free (tier) | 1M requests/month free |
| API Gateway | $3.50 per 1M calls | ~10,000 calls = $0.04 |
| **Total** | **~$5-10** | For low-traffic deployment |

## Best Practices

1. **Never commit `terraform.tfvars`**
   - Contains secrets
   - Use `.gitignore` (already configured)

2. **Use remote state for production**
   - Uncomment S3 backend in `provider.tf`
   - Enables team collaboration
   - Prevents state conflicts

3. **Enable logging**
   - Set `enable_logging = true`
   - Monitor CloudWatch logs

4. **Test in dev first**
   - Use `environment = "dev"`
   - Test thoroughly before prod

5. **Use a custom domain**
   - Set up Route 53
   - Use ACM for SSL/TLS
   - Better than CloudFront domain

## Next Steps

- [ ] Set up custom domain with Route 53
- [ ] Enable AWS WAF for CloudFront
- [ ] Set up CloudWatch alarms
- [ ] Configure auto-scaling (if using EC2)
- [ ] Add database (RDS/DynamoDB)
- [ ] Set up CI/CD branch protection rules
- [ ] Enable CloudTrail for auditing

## Resources

- [OpenTofu Docs](https://opentofu.org/docs/)
- [AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [CloudFront Best Practices](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/best-practices-content-delivery.html)

## Support

For issues:
1. Check `devops/README.md` for detailed documentation
2. Review AWS CloudWatch logs
3. Check OpenTofu error messages
4. Open a GitHub issue

## Security Notes

- ⚠️ Never commit `terraform.tfvars`
- ⚠️ Don't share AWS credentials
- ⚠️ Rotate OAuth secrets regularly
- ⚠️ Use strong JWT secret (32+ characters)
- ✓ Enable S3 versioning (already done)
- ✓ Block public S3 access (already done)
- ✓ Use HTTPS (already configured)

Good luck! 🚀
