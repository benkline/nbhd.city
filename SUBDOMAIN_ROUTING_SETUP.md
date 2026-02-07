# SSG-017: Subdomain Routing Setup - Implementation Guide

## Overview

Wildcard subdomain routing has been successfully implemented for nbhd.city static sites. This enables users to deploy sites to custom subdomains (e.g., `alice.nbhd.city`) with dynamic routing via Lambda@Edge.

## Architecture

```
User Request: https://alice.nbhd.city/
       ↓
Route53 Wildcard DNS (*.nbhd.city) → CloudFront Distribution
       ↓
Lambda@Edge (Origin Request)
  - Extract subdomain: "alice"
  - Query DynamoDB GSI8: subdomain="alice" → {user_did, site_id}
  - Rewrite S3 path: /sites/{user_did}/{site_id}/
       ↓
S3 Bucket: nbhd-city-sites
  Path: /sites/did:plc:abc123/site-uuid-456/index.html
       ↓
CloudFront serves content with caching
```

## Files Created

### 1. Terraform Configuration Files

#### `/devops/variables.tf` (MODIFIED)
- Added `sites_domain` variable: Configurable domain name (default: "nbhd.city")
- Added `create_hosted_zone` variable: Whether to create Route53 zone
- Added `tags` variable: Common tags for all resources

#### `/devops/provider.tf` (MODIFIED)
- Added `aws.us_east_1` provider alias (required for Lambda@Edge and ACM)

#### `/devops/dns.tf` (NEW)
- Route53 hosted zone creation (conditional)
- Wildcard A record: `*.{sites_domain}` → CloudFront
- Apex A record: `{sites_domain}` → Frontend CloudFront (optional)
- Data source for existing hosted zones

#### `/devops/certificates.tf` (NEW)
- ACM wildcard certificate: `*.{sites_domain}` in us-east-1
- DNS validation records
- Certificate validation resource

#### `/devops/dynamodb.tf` (MODIFIED)
- Added `subdomain` attribute
- Added GSI8: subdomain (hash) + SK (range) for efficient lookups

#### `/devops/sites_storage.tf` (NEW)
- S3 bucket: `{project_name}-sites-{account_id}`
- CloudFront Origin Access Control (OAC)
- Versioning enabled
- CORS configuration
- Bucket policy for CloudFront OAC access
- Lifecycle rules (delete old versions after 30 days)
- Public access blocked

#### `/devops/lambda_edge.tf` (NEW)
- Lambda@Edge function (Node.js 20.x)
- IAM role with service principals: lambda.amazonaws.com, edgelambda.amazonaws.com
- IAM policies:
  - CloudWatch Logs (write to all regions)
  - DynamoDB (Query on GSI8, GetItem on main table)
- Automatic npm install and function packaging
- CloudWatch Log Group for Lambda@Edge logs

#### `/devops/sites_cdn.tf` (NEW)
- CloudFront cache policy (1h default TTL, aggressive caching)
- Origin request policy (forwards Host header for subdomain extraction)
- CloudFront distribution:
  - Origin: S3 sites bucket with OAC
  - Aliases: `*.{sites_domain}`
  - ACM wildcard certificate
  - Lambda@Edge association (origin-request event)
  - Custom error handling (404, 403 → /404.html)
  - Price class: PriceClass_100 (US/EU/Japan)

#### `/devops/lambda_edge_subdomain_router/index.js` (NEW)
Subdomain routing logic:
- Extracts subdomain from Host header
- Queries DynamoDB GSI8 for subdomain mapping
- Checks site status (must be "published")
- Rewrites S3 origin path to `/sites/{user_did}/{site_id}/`
- Returns 404 for unmapped subdomains
- In-memory caching with 60s TTL

#### `/devops/lambda_edge_subdomain_router/package.json` (NEW)
Dependencies:
- `@aws-sdk/client-dynamodb`
- `@aws-sdk/util-dynamodb`

#### `/devops/outputs.tf` (MODIFIED)
Added outputs:
- `sites_bucket_name`: S3 bucket name
- `sites_bucket_arn`: S3 bucket ARN
- `sites_cloudfront_domain_name`: CloudFront domain (for CNAME)
- `sites_cloudfront_distribution_id`: CloudFront distribution ID
- `route53_zone_id`: Route53 hosted zone ID
- `route53_name_servers`: Name servers (for domain delegation)
- `sites_domain`: Configured domain
- Updated `deployment_summary`: Includes sites configuration

## Deployment Steps

### Phase 1: Pre-deployment Setup

1. **Configure variables** (if using custom domain):
   ```bash
   cat > /Users/benkline/Projects/nbhd.city/devops/terraform.tfvars <<EOF
   sites_domain = "your-domain.com"
   create_hosted_zone = true
   EOF
   ```

2. **Ensure AWS credentials are configured**:
   ```bash
   aws sts get-caller-identity
   ```

### Phase 2: Terraform Validation & Planning

```bash
cd /Users/benkline/Projects/nbhd.city/devops

# Initialize Terraform (if not already done)
terraform init

# Format configuration files
terraform fmt -recursive

# Validate configuration
terraform validate

# Generate plan
terraform plan -out=tfplan
```

### Phase 3: Incremental Deployment

Deploy in order to minimize dependencies:

```bash
# 1. Deploy S3 bucket and OAC first
terraform apply -target=aws_s3_bucket.sites \
                 -target=aws_s3_bucket_public_access_block.sites \
                 -target=aws_s3_bucket_versioning.sites \
                 -target=aws_s3_bucket_cors_configuration.sites \
                 -target=aws_s3_bucket_policy.sites \
                 -target=aws_s3_bucket_lifecycle_configuration.sites \
                 -target=aws_cloudfront_origin_access_control.sites

# 2. Deploy DynamoDB GSI8
terraform apply -target=aws_dynamodb_table.nbhd_city

# 3. Deploy Route53 and ACM certificate
terraform apply -target=aws_route53_zone.sites \
                 -target=aws_route53_record.sites_cert_validation \
                 -target=aws_acm_certificate.sites_wildcard \
                 -target=aws_acm_certificate_validation.sites_wildcard

# 4. Deploy Lambda@Edge function
terraform apply -target=null_resource.lambda_edge_npm_install \
                 -target=data.archive_file.lambda_edge_subdomain_router \
                 -target=aws_iam_role.lambda_edge_subdomain_router \
                 -target=aws_iam_role_policy.lambda_edge_logs \
                 -target=aws_iam_role_policy.lambda_edge_dynamodb \
                 -target=aws_lambda_function.subdomain_router \
                 -target=aws_cloudwatch_log_group.lambda_edge_subdomain_router

# 5. Deploy CloudFront distribution
terraform apply -target=aws_cloudfront_cache_policy.sites \
                 -target=aws_cloudfront_origin_request_policy.sites \
                 -target=aws_cloudfront_distribution.sites

# 6. Deploy Route53 DNS records
terraform apply -target=aws_route53_record.wildcard_sites \
                 -target=aws_route53_record.apex_sites

# 7. Output configuration (for reference)
terraform apply -target=aws_route53_zone.sites \
                 -target=data.aws_route53_zone.sites
```

Or deploy everything at once:
```bash
terraform apply tfplan
```

### Phase 4: Post-deployment Configuration

1. **Get outputs**:
   ```bash
   terraform output -json > outputs.json
   ```

2. **If using new hosted zone, configure domain registrar**:
   ```bash
   terraform output route53_name_servers
   # Configure these 4 name servers at your domain registrar
   ```

3. **Test DNS resolution** (wait up to 48 hours for propagation):
   ```bash
   nslookup test.nbhd.city
   dig *.nbhd.city +short
   ```

## Testing Strategy

### Phase 1: Local Lambda Testing

```bash
cd /Users/benkline/Projects/nbhd.city/devops/lambda_edge_subdomain_router

# Install dependencies
npm install

# Test subdomain extraction
node -e "
const handler = require('./index').handler;
const event = {
  Records: [{
    cf: {
      request: {
        headers: {
          host: [{ value: 'test.nbhd.city' }]
        },
        uri: '/',
        origin: { s3: { path: '' } }
      }
    }
  }]
};
handler(event).then(result => console.log(JSON.stringify(result, null, 2)));
"
```

### Phase 2: CloudFront Distribution Testing

After CloudFront distribution is deployed:

```bash
# Wait for CloudFront to warm up (10-15 minutes)
# Then test via CloudFront domain:
curl -I https://{cloudfront-domain}
```

### Phase 3: DynamoDB Mapping Setup

Create a test site mapping in DynamoDB:

```bash
aws dynamodb put-item \
  --table-name nbhd-city-production \
  --item '{
    "PK": {"S": "USER#did:plc:example123"},
    "SK": {"S": "SITE#demo-001"},
    "subdomain": {"S": "demo"},
    "site_id": {"S": "demo-001"},
    "user_did": {"S": "did:plc:example123"},
    "status": {"S": "published"}
  }'
```

### Phase 4: Upload Test Content to S3

```bash
# Create test HTML
echo "<h1>Hello from demo.nbhd.city</h1>" > /tmp/index.html

# Upload to correct S3 path
aws s3 cp /tmp/index.html \
  s3://nbhd-city-sites-{account_id}/sites/did:plc:example123/demo-001/index.html

# Verify upload
aws s3 ls s3://nbhd-city-sites-{account_id}/sites/did:plc:example123/demo-001/
```

### Phase 5: End-to-End Testing

Test via subdomain (after DNS propagation):

```bash
# Test direct subdomain access
curl -H "Host: demo.nbhd.city" https://{cloudfront-domain}
# Should return: <h1>Hello from demo.nbhd.city</h1>

# Test with actual subdomain (after DNS propagation)
curl https://demo.nbhd.city

# Test non-existent subdomain
curl https://nonexistent.nbhd.city
# Should return: 404 Not Found

# Test with trailing slash
curl https://demo.nbhd.city/
curl https://demo.nbhd.city/index.html

# Check CloudWatch logs for Lambda@Edge
aws logs tail /aws/lambda/us-east-1.nbhd-city-subdomain-router --follow
```

## Key Configuration Details

### DynamoDB GSI8 Structure

Required fields for subdomain routing:

```json
{
  "PK": "USER#{user_did}",           // Partition key (existing)
  "SK": "SITE#{site_id}",            // Sort key (existing)
  "subdomain": "alice",              // Required for GSI8 lookup
  "site_id": "site-uuid-456",        // Required for path rewriting
  "user_did": "did:plc:abc123",      // Required for path rewriting
  "status": "published"               // Required: must be "published"
}
```

### S3 Path Structure

Sites are stored with this structure:

```
s3://nbhd-city-sites-{account_id}/
└── sites/
    └── {user_did}/
        └── {site_id}/
            ├── index.html
            ├── style.css
            └── ...
```

### Lambda@Edge Requirements

- **Runtime**: Node.js 20.x
- **Memory**: 128 MB (minimum for Lambda@Edge)
- **Timeout**: 5 seconds (origin-request timeout)
- **Size**: Must be < 1 MB (zipped)
- **Region**: Must be in us-east-1
- **Publishing**: Must be published (versioned)
- **VPC**: Cannot run in VPC

### CloudFront Behavior

- **Default TTL**: 1 hour (3600 seconds)
- **Max TTL**: 1 day (86400 seconds)
- **Min TTL**: 0 seconds
- **Compression**: Enabled (gzip, brotli)
- **HTTPS only**: Redirects HTTP to HTTPS
- **Price class**: PriceClass_100 (change to PriceClass_All for global)

### ACM Certificate

- **Type**: Wildcard (`*.nbhd.city`)
- **SANs**: Includes apex domain (`nbhd.city`)
- **Validation**: DNS-based (automatic)
- **Region**: us-east-1 only (required for CloudFront)
- **Auto-renewal**: Enabled

## Troubleshooting

### Lambda@Edge Logs Not Appearing

Lambda@Edge logs appear in CloudWatch Logs in **all regions** where CloudFront serves requests:

```bash
# Search logs in all regions
for region in us-east-1 us-west-2 eu-west-1 ap-northeast-1; do
  echo "=== Region: $region ==="
  aws logs tail /aws/lambda/us-east-1.nbhd-city-subdomain-router \
    --region $region --since 5m || echo "No logs in $region"
done
```

### CloudFront Returns 504 Gateway Timeout

Check:
1. Lambda@Edge function size < 1 MB: `ls -lh .terraform/lambda_edge_subdomain_router.zip`
2. Lambda@Edge memory >= 128 MB
3. DynamoDB table exists and is accessible
4. Lambda@Edge IAM policy includes DynamoDB access

### Subdomain Returns 404

1. Verify DynamoDB item exists with correct subdomain:
   ```bash
   aws dynamodb query \
     --table-name nbhd-city-production \
     --index-name GSI8 \
     --key-condition-expression "subdomain = :subdomain" \
     --expression-attribute-values '{":subdomain": {"S": "demo"}}'
   ```

2. Verify S3 object exists at expected path:
   ```bash
   aws s3 ls s3://nbhd-city-sites-{account_id}/sites/{user_did}/{site_id}/
   ```

3. Check Lambda@Edge logs for errors:
   ```bash
   aws logs tail /aws/lambda/us-east-1.nbhd-city-subdomain-router --follow
   ```

### Certificate Validation Failed

If ACM certificate validation times out:

1. Check DNS records were created:
   ```bash
   aws route53 list-resource-record-sets \
     --hosted-zone-id {zone_id} \
     --query 'ResourceRecordSets[?Type==`CNAME`]'
   ```

2. Manually validate if needed:
   ```bash
   terraform apply -target=aws_acm_certificate_validation.sites_wildcard -refresh-only
   ```

### DNS Not Resolving

1. Verify name servers are configured at registrar:
   ```bash
   terraform output route53_name_servers
   ```

2. Check propagation:
   ```bash
   nslookup ns nbhd.city
   ```

3. Wait up to 48 hours for full propagation

## Rollback Plan

If deployment fails:

### Quick Rollback

```bash
# Remove Lambda@Edge association (allows CloudFront to work without it)
terraform apply -target=aws_cloudfront_distribution.sites -var 'lambda_enabled=false'

# Or destroy just Lambda@Edge
terraform destroy -target=aws_lambda_function.subdomain_router \
                  -target=aws_iam_role.lambda_edge_subdomain_router

# Then rollback Lambda code
cd lambda_edge_subdomain_router
git checkout index.js package.json
npm install
```

### Full Rollback

```bash
# Destroy in reverse order of dependencies
terraform destroy \
  -target=aws_cloudfront_distribution.sites \
  -target=aws_route53_record.wildcard_sites \
  -target=aws_lambda_function.subdomain_router \
  -target=aws_acm_certificate.sites_wildcard \
  -target=aws_route53_zone.sites \
  -target=aws_s3_bucket.sites
```

## Cost Considerations

### Estimated Monthly Costs (100K requests/month)

| Service | Cost | Notes |
|---------|------|-------|
| Lambda@Edge | ~$0.60 | 100K requests @ $0.60/1M |
| CloudFront | ~$0.85 | Data transfer (1GB) |
| S3 | ~$0.05 | Storage (100MB) + requests |
| Route53 | $0.50 | Hosted zone |
| DynamoDB | Variable | Query on GSI8 (on-demand) |
| ACM | Free | Public certificate |
| **Total** | **~$2.00** | |

### Cost Optimization

- Use **PriceClass_100** (cheaper than All): saves ~60% on data transfer
- Enable S3 versioning lifecycle (30-day expiration): saves storage costs
- Use in-memory caching in Lambda@Edge: reduces DynamoDB queries
- CloudFront caching (1h TTL): reduces origin requests

## Scaling Considerations

### DynamoDB Scaling

- **On-demand billing** (current): No provisioned capacity needed
- **For 1M+ queries/month**: Consider provisioned capacity (cheaper)
- **GSI8 capacity**: Automatically scales with on-demand mode

### Lambda@Edge Scaling

- **Concurrent executions**: Automatically scaled by CloudFront
- **Regional replication**: Lambda@Edge auto-replicates to all regions
- **Warm-up**: No cold starts (requests are bursty)

### CloudFront Scaling

- **Automatic**: CloudFront scales globally
- **Regional edge caches**: Automatically serve from nearest edge
- **Cache hit ratio**: Monitor via CloudFront metrics

## Monitoring & Observability

### CloudFront Metrics

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --dimensions Name=DistributionId,Value={distribution_id} \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### Lambda@Edge Metrics

```bash
# Monitor errors
aws logs insights query \
  --log-group-name "/aws/lambda/us-east-1.nbhd-city-subdomain-router" \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/'
```

## Next Steps

1. **Verify deployment**:
   - [ ] Terraform validation passes
   - [ ] All resources created successfully
   - [ ] DNS resolves to CloudFront

2. **Test end-to-end**:
   - [ ] Upload test site to S3
   - [ ] Create DynamoDB mapping
   - [ ] Access via subdomain
   - [ ] Verify S3 path in Lambda logs

3. **Configure monitoring**:
   - [ ] CloudWatch alarms for Lambda errors
   - [ ] CloudFront error rate monitoring
   - [ ] Route53 health checks (optional)

4. **Document and handoff**:
   - [ ] Update deployment runbook
   - [ ] Document subdomain deployment process
   - [ ] Train team on troubleshooting

5. **Production optimization**:
   - [ ] Enable query logging in CloudFront
   - [ ] Set up CloudWatch alarms
   - [ ] Configure DynamoDB auto-scaling
   - [ ] Monitor Lambda@Edge cold starts

## Configuration Portability

To use this setup for different domains:

```bash
# Fork/clone the code, then:
cat > terraform.tfvars <<EOF
sites_domain       = "yourdomain.com"
create_hosted_zone = true
project_name       = "your-project"
environment        = "production"
EOF

terraform init
terraform plan
terraform apply
```

All resources automatically adjust names/configurations based on `sites_domain` variable.

## Support & References

- [AWS Lambda@Edge Guide](https://docs.aws.amazon.com/lambda/latest/dg/lambda-edge.html)
- [CloudFront Origin Request Events](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-edge-how-it-works-tutorial.html)
- [Terraform AWS Provider Reference](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [DynamoDB GSI Documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html)
