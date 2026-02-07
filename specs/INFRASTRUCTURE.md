# Infrastructure & Deployment

**Focus:** AWS setup, Terraform, cost estimation, monitoring
**Last Updated:** 2026-01-10

---

## AWS Services Used

| Service | Purpose | Billing Model |
|---------|---------|---------------|
| **Lambda** | API compute | Per invocation + memory |
| **API Gateway** | HTTP endpoints | Per API call |
| **DynamoDB** | Database | On-demand (pay-per-request) |
| **S3** | File storage | Per GB + requests |
| **CloudFront** | CDN | Per GB transferred |
| **Route53** | DNS | Per hosted zone + queries |
| **Secrets Manager** | Secure config | Per secret |
| **CloudWatch** | Monitoring/logs | Per GB logs + alarms |

---

## Infrastructure as Code (Terraform)

**Location:** `/devops/aws/`

```
devops/aws/
├── provider.tf           # AWS provider + region config
├── db.tf                 # DynamoDB table + GSIs
├── compute.tf            # Lambda function
├── api_gateway.tf        # REST API + routes
├── storage.tf            # S3 buckets
├── cdn.tf                # CloudFront distributions
├── dns.tf                # Route53 zones + records
├── iam.tf                # Roles, policies, permissions
├── secrets.tf            # AWS Secrets Manager
├── monitoring.tf         # CloudWatch alarms + dashboard
├── variables.tf          # Input variables
├── outputs.tf            # Output values
└── terraform.tfvars      # Environment-specific config
```

---

## Deployment Workflow

### One-Command Deployment

```bash
# 1. Clone and configure
git clone https://github.com/yourusername/nbhd.city.git
cd nbhd.city
cp devops/aws/terraform.tfvars.example devops/aws/terraform.tfvars

# 2. Edit terraform.tfvars
# Add AWS credentials, region, JWT secret, OAuth keys

# 3. Deploy
./scripts/deploy.sh

# Script does:
# - Builds React frontend
# - Packages Python backend
# - Runs terraform apply
# - Uploads frontend to S3
# - Invalidates CloudFront
```

### Manual Deployment

```bash
# Build frontend
cd nbhd && npm run build && cd ..

# Build backend package
cd api && pip install -r requirements.txt && cd ..

# Deploy with Terraform
cd devops/aws
terraform plan
terraform apply
```

---

## Environment Setup

### Required Environment Variables

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1

# App Configuration
JWT_SECRET_KEY=random-secret-key-change-this
ENVIRONMENT=production

# BlueSky OAuth
BLUESKY_CLIENT_ID=your-client-id
BLUESKY_CLIENT_SECRET=your-client-secret
BLUESKY_OAUTH_REDIRECT_URI=https://api.yourdomain.com/auth/callback

# Optional
SENTRY_DSN=https://...  # Error tracking
CUSTOM_DOMAIN=myneighborhood.com
```

### Local Development

Create `.env.local`:

```bash
ENVIRONMENT=development
DEBUG=true
JWT_SECRET_KEY=dev-secret

BLUESKY_CLIENT_ID=dev-client-id
BLUESKY_CLIENT_SECRET=dev-secret
BLUESKY_OAUTH_REDIRECT_URI=http://localhost:8000/auth/callback

DYNAMODB_ENDPOINT_URL=http://localhost:8000
DYNAMODB_TABLE_NAME=nbhd-dev
```

---

## Cost Breakdown

### Small Neighborhood (100 users, light usage)

| Service | Usage | Cost |
|---------|-------|------|
| DynamoDB | 1M read/writes/month | $1.25 |
| Lambda | 100K invocations, avg 2s | $2.00 |
| API Gateway | 100K requests | $0.35 |
| CloudFront | 10GB data transfer | $1.00 |
| S3 | 5GB storage + requests | $0.50 |
| Route53 | 1 hosted zone | $0.50 |
| CloudWatch | Logs + metrics | $1.00 |
| **Total** | | **~$6.60/month** |

### Medium Neighborhood (1,000 users)

- DynamoDB: $12.50
- Lambda: $20.00
- API Gateway: $3.50
- CloudFront: $10.00
- S3: $5.00
- Others: $2.00
- **Total: ~$53/month**

### Large Neighborhood (10,000 users)

- **Total: ~$150-200/month** (depending on activity)

---

## Monitoring & Observability

### CloudWatch Metrics

**Lambda:**
- Invocations
- Duration (p50, p95, p99)
- Errors
- Cold starts
- Throttles

**API Gateway:**
- Requests
- Latency
- 4xx/5xx errors
- Cache hit rate

**DynamoDB:**
- Read/write capacity utilization
- Throttled requests
- Scan operations
- Returned item count

### Custom Metrics

Track application-level metrics:

```python
# In Lambda handler
import boto3

cloudwatch = boto3.client('cloudwatch')

# Log custom metric
cloudwatch.put_metric_data(
    Namespace='nbhd-city',
    MetricData=[
        {
            'MetricName': 'SitesBuild',
            'Value': 1,
            'Unit': 'Count',
            'Timestamp': datetime.now()
        }
    ]
)
```

### CloudWatch Alarms

Alert when:
- Lambda error rate > 5% for 5 min
- API Gateway 5xx errors > 10/min
- DynamoDB throttling detected
- Lambda timeout rate > 1%

Notifications: SNS → Email

### Logs

- **Log Group:** `/aws/lambda/nbhd-city-api`
- **Retention:** 30 days
- **Format:** JSON (structured logging)
- **Search:** Via CloudWatch Insights

```
fields @timestamp, @message, @duration
| filter @message like /ERROR/
| stats count() by @message
```

---

## Scaling

### Automatic Scaling

- **DynamoDB:** On-demand pricing scales automatically
- **Lambda:** Concurrency auto-scales (limit: 1000)
- **API Gateway:** No scaling limit
- **CloudFront:** Edge locations worldwide

### If You Hit Limits

1. **DynamoDB throttling:** Switch to provisioned capacity + auto-scaling
2. **Lambda concurrency:** Request limit increase (AWS Quotas)
3. **API Gateway:** No practical limit for SaaS tier

---

## Backup & Recovery

### Automated Backups

1. **DynamoDB PITR** - 35-day recovery window
2. **Daily exports** - Lambda exports all data to S3 at 2 AM UTC
3. **Site configs** - Stored as JSON (version-controllable)

### Recovery Process

```bash
# Restore from backup
./scripts/restore-from-backup.sh backup-2026-01-10.json
# Restores DynamoDB from JSON dump
```

---

## Multi-Cloud Strategy (Phase 6)

When adding GCP/Azure, create separate folders:

```
devops/
├── aws/          # Phase 1 (current)
├── gcp/          # Phase 6
└── azure/        # Phase 6
```

Each has same structure (provider.tf, compute.tf, etc.) with cloud-specific services.

---

## See Also

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [DATABASE.md](./DATABASE.md) - Data storage
