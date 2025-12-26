# nbhd.city DevOps

Infrastructure as Code (IaC) for deploying nbhd.city to AWS using OpenTofu (Terraform).

## Overview

This directory contains OpenTofu configurations to deploy:

- **Frontend**: React app deployed to S3 with CloudFront CDN
- **Backend**: FastAPI application running on AWS Lambda with API Gateway

## Architecture

```
┌─────────────────────────────────────────────┐
│          CloudFront (CDN)                   │
│  ┌───────────────────────────────────────┐  │
│  │  /api/* → API Gateway                 │  │
│  │  /* → S3 (React App)                  │  │
│  └───────────────────────────────────────┘  │
└──────────────┬────────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
    ┌───▼────┐   ┌───▼──────┐
    │   S3   │   │   API    │
    │ (Dist) │   │ Gateway  │
    └────────┘   └────┬─────┘
                      │
                  ┌───▼──────┐
                  │  Lambda  │
                  │  (API)   │
                  └──────────┘
```

## Prerequisites

- OpenTofu >= 1.5.0 (or Terraform 1.5+)
- AWS CLI configured with credentials
- Node.js 18+ and npm (for frontend build)
- Python 3.11+ (for API)

### Install OpenTofu

**macOS:**
```bash
brew install opentofu
```

**Linux:**
```bash
curl --proto '=https' --tlsv1.2 -fsSL https://get.opentofu.org/linux/install.sh | bash
```

**Windows:**
```powershell
choco install opentofu
```

## Setup

### 1. Configure AWS Credentials

```bash
aws configure
# or
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
```

### 2. Prepare Variables

```bash
cd devops
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:
- BlueSky OAuth credentials
- JWT secret key
- AWS region
- Project name

### 3. Build Frontend

```bash
cd ../frontend
npm install
npm run build
cd ../devops
```

### 4. Create Lambda Layer

The Lambda function needs Python dependencies packaged as a layer:

```bash
mkdir -p lambda_layer/python/lib/python3.11/site-packages
pip install -r ../api/requirements.txt -t lambda_layer/python/lib/python3.11/site-packages/
```

## Deployment

### Initialize OpenTofu

```bash
tofu init
```

This will:
- Download AWS provider plugins
- Initialize local state file
- Prepare the working directory

### Validate Configuration

```bash
tofu validate
```

### Plan Deployment

```bash
tofu plan -out=tfplan
```

Review the plan to see what resources will be created.

### Apply Deployment

```bash
tofu apply tfplan
```

This will:
- Create S3 bucket for frontend
- Create CloudFront distribution
- Deploy Lambda function
- Create API Gateway
- Set up IAM roles and policies

### Outputs

After deployment, run:

```bash
tofu output
```

You'll get:
- Frontend URL (CloudFront domain)
- API Gateway endpoint
- Lambda function name
- S3 bucket name

### Invalidate CloudFront Cache

After deploying new frontend code:

```bash
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
```

Or use the helper script:

```bash
./scripts/invalidate-cloudfront.sh
```

## File Structure

```
devops/
├── provider.tf          # AWS provider and backend configuration
├── variables.tf         # Variable definitions
├── data.tf             # Data source definitions
├── frontend.tf         # S3 and CloudFront resources
├── backend.tf          # Lambda and API Gateway resources
├── outputs.tf          # Output definitions
├── terraform.tfvars.example  # Example variables (copy to terraform.tfvars)
├── .gitignore          # Git ignore for sensitive files
├── README.md           # This file
└── scripts/            # Helper scripts
    └── invalidate-cloudfront.sh
```

## Managing State

By default, OpenTofu stores state locally in `terraform.tfstate`. For production, use remote state:

### Enable Remote State (S3 Backend)

Uncomment the backend configuration in `provider.tf`:

```hcl
backend "s3" {
  bucket         = "nbhd-city-terraform-state"
  key            = "prod/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "terraform-locks"
}
```

Create the S3 bucket and DynamoDB table first:

```bash
aws s3api create-bucket --bucket nbhd-city-terraform-state --region us-east-1
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

## Environment Variables

These are set in Lambda via the `environment` block in `backend.tf`:

- `BLUESKY_OAUTH_CLIENT_ID` - From BlueSky
- `BLUESKY_OAUTH_CLIENT_SECRET` - From BlueSky
- `BLUESKY_OAUTH_REDIRECT_URI` - Automatically set to CloudFront URL
- `SECRET_KEY` - JWT secret from `terraform.tfvars`
- `FRONTEND_URL` - Automatically set to CloudFront URL
- `ENVIRONMENT` - From `terraform.tfvars` (dev/prod)

## Updating Deployment

### Update Frontend

```bash
cd ../frontend
npm run build
cd ../devops
tofu apply
```

### Update Backend (API)

```bash
# Edit API code
cd ../api
# ...make changes...
cd ../devops
tofu apply
```

### Update Configuration

Edit `terraform.tfvars` and run:

```bash
tofu plan -out=tfplan
tofu apply tfplan
```

## Monitoring

### View CloudWatch Logs

**API Gateway logs:**
```bash
aws logs tail /aws/apigateway/nbhd-city-api --follow
```

**Lambda logs:**
```bash
aws logs tail /aws/lambda/nbhd-city-api --follow
```

### View Lambda Metrics

```bash
aws cloudwatch list-metrics --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=nbhd-city-api
```

## Cleanup

### Destroy All Resources

```bash
tofu destroy
```

⚠️ This will delete:
- S3 bucket (and all frontend files)
- CloudFront distribution
- Lambda function
- API Gateway
- IAM roles

## Cost Considerations

Estimated monthly costs (rough estimates):

- **S3 storage**: ~$1 (small deployments)
- **CloudFront**: ~$0.50 - $5 (depends on traffic)
- **Lambda**: Free tier includes 1M requests/month
- **API Gateway**: $3.50 per 1M API calls

Total: Generally under $10/month for low traffic.

## Troubleshooting

### "S3 bucket already exists"

S3 bucket names must be globally unique. Modify `project_name` in `terraform.tfvars`.

### Lambda timeout

Increase `lambda_timeout` in `terraform.tfvars`:

```hcl
lambda_timeout = 60  # seconds
```

### API Gateway CORS errors

Check the CORS configuration in `backend.tf` matches your frontend domain.

### Frontend not updating

CloudFront caches content. Invalidate the cache:

```bash
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
```

### "Insufficient Lambda permissions"

Ensure the IAM user/role has these permissions:
- `lambda:CreateFunction`
- `lambda:UpdateFunction`
- `iam:CreateRole`
- `iam:PutRolePolicy`
- `s3:*`
- `cloudfront:*`
- `apigateway:*`

## Security Best Practices

1. **Never commit `terraform.tfvars`** - Use `.gitignore` to exclude it
2. **Use AWS Secrets Manager** for sensitive values:
   ```hcl
   data "aws_secretsmanager_secret_version" "oauth" {
     secret_id = "bluesky-oauth"
   }
   ```
3. **Enable S3 versioning** - Already configured ✓
4. **Enable encryption** - Add to S3 bucket configuration
5. **Enable logging** - Set `enable_logging = true`
6. **Restrict CloudFront access** - Only via CloudFront (not direct S3) ✓
7. **Use CloudFront with HTTPS** - Already configured ✓

## GitHub Actions Integration

The `.github/workflows/deploy.yml` file automatically:

1. Builds the frontend
2. Tests the API
3. Deploys using OpenTofu

See `.github/workflows/deploy.yml` for configuration.

## Useful Commands

```bash
# Check infrastructure
tofu show

# Format files
tofu fmt

# Validate syntax
tofu validate

# Create a plan without applying
tofu plan -out=plan.tfplan

# Apply a specific plan
tofu apply plan.tfplan

# Destroy specific resource
tofu destroy -target=aws_s3_bucket.frontend

# Output in JSON
tofu output -json > deployment.json
```

## Next Steps

- [ ] Set up remote state in S3
- [ ] Configure custom domain with Route 53
- [ ] Set up SSL/TLS certificate with ACM
- [ ] Enable CloudWatch alarms
- [ ] Set up automated backups
- [ ] Configure auto-scaling policies
- [ ] Add database (RDS/DynamoDB)

## Resources

- [OpenTofu Documentation](https://opentofu.org/docs/)
- [AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [CloudFront Best Practices](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/best-practices-content-delivery.html)

## Support

For issues or questions about the DevOps setup, refer to:
- OpenTofu documentation
- AWS documentation
- GitHub Issues

## License

(Add your license here)
