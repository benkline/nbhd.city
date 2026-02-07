# Subdomain Routing Deployment Checklist

## Pre-Deployment

- [ ] Review SUBDOMAIN_ROUTING_SETUP.md
- [ ] Ensure AWS credentials are configured: `aws sts get-caller-identity`
- [ ] Verify correct AWS account and region
- [ ] Backup existing Terraform state: `cp terraform.tfstate terraform.tfstate.backup`
- [ ] Review all new .tf files for accuracy
- [ ] Decide on domain name (use variable `sites_domain`)
- [ ] Decide whether to create hosted zone (`create_hosted_zone = true/false`)

## Terraform Initialization & Validation

```bash
cd /Users/benkline/Projects/nbhd.city/devops

# 1. Initialize Terraform
terraform init

# 2. Format all files
terraform fmt -recursive

# 3. Validate configuration
terraform validate
# Expected: Success! No errors.

# 4. Generate plan
terraform plan -out=tfplan
# Review output for:
# - 1 new S3 bucket (sites)
# - 1 new Lambda function (subdomain-router)
# - 1 new CloudFront distribution
# - 1 new Route53 zone (if create_hosted_zone=true)
# - 1 new ACM certificate
# - 2 new GSI for DynamoDB
```

## Deployment (Choose One)

### Option A: Full Automated Deployment (Recommended for Testing)
```bash
terraform apply tfplan
# Takes ~15-20 minutes
# CloudFront takes longest (10-15 minutes)
```

### Option B: Incremental Deployment (Safer for Production)

Follow Phase 3 steps in SUBDOMAIN_ROUTING_SETUP.md:
```bash
# 1. Deploy storage layer
terraform apply -target=aws_s3_bucket.sites \
                 -target=aws_s3_bucket_public_access_block.sites \
                 -target=aws_s3_bucket_versioning.sites \
                 -target=aws_s3_bucket_cors_configuration.sites \
                 -target=aws_s3_bucket_policy.sites \
                 -target=aws_s3_bucket_lifecycle_configuration.sites \
                 -target=aws_cloudfront_origin_access_control.sites

# 2. Deploy database layer
terraform apply -target=aws_dynamodb_table.nbhd_city

# 3. Deploy DNS and certificates
terraform apply -target=aws_route53_zone.sites \
                 -target=aws_route53_record.sites_cert_validation \
                 -target=aws_acm_certificate.sites_wildcard \
                 -target=aws_acm_certificate_validation.sites_wildcard

# 4. Deploy Lambda@Edge
terraform apply -target=null_resource.lambda_edge_npm_install \
                 -target=data.archive_file.lambda_edge_subdomain_router \
                 -target=aws_iam_role.lambda_edge_subdomain_router \
                 -target=aws_iam_role_policy.lambda_edge_logs \
                 -target=aws_iam_role_policy.lambda_edge_dynamodb \
                 -target=aws_lambda_function.subdomain_router \
                 -target=aws_cloudwatch_log_group.lambda_edge_subdomain_router

# 5. Deploy CloudFront
terraform apply -target=aws_cloudfront_cache_policy.sites \
                 -target=aws_cloudfront_origin_request_policy.sites \
                 -target=aws_cloudfront_distribution.sites

# 6. Deploy DNS records
terraform apply -target=aws_route53_record.wildcard_sites \
                 -target=aws_route53_record.apex_sites
```

## Post-Deployment Verification

### 1. Check Terraform Outputs
```bash
terraform output -json | jq '.' | tee deployment_outputs.json

# Should show:
# - sites_bucket_name: "nbhd-city-sites-{account_id}"
# - sites_cloudfront_domain_name: "d123456.cloudfront.net"
# - sites_cloudfront_distribution_id: "E123456"
# - route53_zone_id: "Z123456" (if created)
# - route53_name_servers: [4 name servers] (if created)
# - sites_domain: "nbhd.city"
```

### 2. Verify AWS Resources Created
```bash
# S3 bucket
aws s3 ls | grep nbhd-city-sites

# CloudFront distribution
aws cloudfront list-distributions | grep nbhd-city-sites

# Lambda function
aws lambda list-functions --region us-east-1 | grep subdomain-router

# DynamoDB table
aws dynamodb list-tables | grep nbhd-city

# Route53 zone (if created)
aws route53 list-hosted-zones | grep sites_domain
```

### 3. Check Lambda@Edge Deployment
```bash
# Verify function is published (has version)
aws lambda get-function \
  --function-name nbhd-city-subdomain-router-production \
  --region us-east-1 \
  | jq '.Configuration.Version'
# Should be: "1" or higher

# Check function size
aws lambda get-function \
  --function-name nbhd-city-subdomain-router-production \
  --region us-east-1 \
  | jq '.Configuration.CodeSize'
# Should be: < 1048576 (1 MB)
```

### 4. Verify CloudFront Integration
```bash
# Check Lambda@Edge association
aws cloudfront get-distribution \
  --id {distribution_id} \
  | jq '.Distribution.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations'
# Should show origin-request event association
```

## DNS Configuration (If create_hosted_zone=true)

### 1. Get Name Servers
```bash
terraform output route53_name_servers

# Output will be 4 name servers, like:
# ns-1234.awsdns-56.com
# ns-5678.awsdns-78.org
# etc.
```

### 2. Configure at Domain Registrar
1. Log into your domain registrar (GoDaddy, Namecheap, etc.)
2. Find "DNS Settings" or "Name Servers"
3. Replace current name servers with the 4 from above
4. Save changes (may take 24-48 hours to propagate)

### 3. Verify DNS Resolution
```bash
# Test 1: Check name servers are configured
nslookup ns {sites_domain}
# Should show the 4 Route53 name servers

# Test 2: Check wildcard record
dig *.{sites_domain} +short
# Should return CloudFront IP addresses

# Test 3: Check specific subdomain
dig test.{sites_domain} +short
# Should return CloudFront IP addresses

# Test 4: Verify CloudFront origin
nslookup {cloudfront_domain}
# Should resolve to CloudFront's edge locations
```

## Testing Phase 1: Local Lambda Testing

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

# Expected output: Request with updated origin.s3.path
```

## Testing Phase 2: Create Test DynamoDB Entry

```bash
# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create test site mapping
aws dynamodb put-item \
  --table-name nbhd-city-production \
  --item '{
    "PK": {"S": "USER#did:plc:test123"},
    "SK": {"S": "SITE#test-001"},
    "subdomain": {"S": "demo"},
    "site_id": {"S": "test-001"},
    "user_did": {"S": "did:plc:test123"},
    "status": {"S": "published"}
  }'

# Verify it was created
aws dynamodb get-item \
  --table-name nbhd-city-production \
  --key '{
    "PK": {"S": "USER#did:plc:test123"},
    "SK": {"S": "SITE#test-001"}
  }'
```

## Testing Phase 3: Upload Test Content to S3

```bash
BUCKET_NAME=$(terraform output -raw sites_bucket_name)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create test HTML
cat > /tmp/test-index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>Test Site</title>
  <style>
    body { font-family: sans-serif; padding: 40px; }
    h1 { color: #333; }
    .info { background: #f0f0f0; padding: 10px; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>Hello from demo.nbhd.city</h1>
  <div class="info">
    <p>This is a test site to verify subdomain routing.</p>
    <p>Subdomain: demo</p>
    <p>User DID: did:plc:test123</p>
    <p>Site ID: test-001</p>
  </div>
</body>
</html>
EOF

# Upload to S3 at correct path
aws s3 cp /tmp/test-index.html \
  s3://$BUCKET_NAME/sites/did:plc:test123/test-001/index.html

# Verify upload
aws s3 ls s3://$BUCKET_NAME/sites/did:plc:test123/test-001/

# Should show: index.html
```

## Testing Phase 4: End-to-End Verification

### Wait for CloudFront Distribution
```bash
# Check distribution status (should be "Deployed")
aws cloudfront get-distribution \
  --id {distribution_id} \
  --query 'Distribution.Status'

# Takes 10-15 minutes for first deployment
```

### Test via CloudFront Domain (Before DNS Propagation)
```bash
DISTRIBUTION_DOMAIN=$(terraform output -raw sites_cloudfront_domain_name)

# Test 1: Basic connectivity
curl -H "Host: demo.nbhd.city" https://$DISTRIBUTION_DOMAIN
# Should return HTML with "Hello from demo.nbhd.city"

# Test 2: Check response headers
curl -I -H "Host: demo.nbhd.city" https://$DISTRIBUTION_DOMAIN
# Should see: HTTP/2 200, CloudFront headers

# Test 3: Non-existent subdomain
curl -H "Host: nonexistent.nbhd.city" https://$DISTRIBUTION_DOMAIN
# Should return 404 page
```

### Test via Actual Subdomain (After DNS Propagation)
```bash
# Wait for DNS propagation (up to 48 hours, usually < 1 hour)

# Test 1: Direct subdomain
curl https://demo.nbhd.city

# Test 2: With trailing slash
curl https://demo.nbhd.city/

# Test 3: Specific file
curl https://demo.nbhd.city/index.html

# Test 4: Non-existent subdomain (should get 404)
curl https://nonexistent.nbhd.city
```

## Testing Phase 5: Monitor Lambda@Edge Logs

```bash
# Lambda@Edge logs appear in multiple regions
# Check us-east-1 first (primary)

aws logs tail /aws/lambda/us-east-1.nbhd-city-subdomain-router-production \
  --follow --since 5m

# Expected log output:
# Processing request for host: demo.nbhd.city
# Cache miss for subdomain: demo
# Routing subdomain 'demo' to S3 path: /sites/did:plc:test123/test-001
# (success case)

# Or for failures:
# No subdomain found in host: nbhd.city
# Subdomain {subdomain} not found in DynamoDB
```

## Testing Phase 6: CloudFront Metrics

```bash
# Check CloudFront request metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --dimensions Name=DistributionId,Value={distribution_id} \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# Check for errors
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name 4xxErrorRate \
  --dimensions Name=DistributionId,Value={distribution_id} \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

## Acceptance Criteria Verification

- [ ] Wildcard DNS resolves correctly (`dig *.nbhd.city` returns CloudFront IPs)
- [ ] CloudFront serves correct S3 path per subdomain (check Lambda logs)
- [ ] Multiple subdomains work independently (test 2+ different subdomains)
- [ ] HTTPS works for all subdomains (SSL certificate valid)
- [ ] 404 handling for non-existent subdomains (returns custom 404)
- [ ] CloudFront caching works (second request is faster)
- [ ] Lambda@Edge logs appear in CloudWatch
- [ ] S3 objects not publicly accessible (OAC working)

## Rollback Plan (If Issues Occur)

### Quick Fix: Disable Lambda@Edge
```bash
# Remove Lambda@Edge from CloudFront (keeps everything else)
# Edit sites_cdn.tf: comment out lambda_function_association block
terraform apply -target=aws_cloudfront_distribution.sites
```

### Partial Rollback: Just Lambda
```bash
terraform destroy -target=aws_lambda_function.subdomain_router \
                  -target=aws_cloudwatch_log_group.lambda_edge_subdomain_router
# Revert Lambda code, redeploy
```

### Full Rollback: Destroy Everything
```bash
# Destroy in reverse dependency order
terraform destroy \
  -target=aws_route53_record.wildcard_sites \
  -target=aws_cloudfront_distribution.sites \
  -target=aws_lambda_function.subdomain_router \
  -target=aws_acm_certificate.sites_wildcard \
  -target=aws_route53_zone.sites \
  -target=aws_s3_bucket.sites

# Restore DynamoDB from backup (if using versioning)
aws dynamodb restore-table-to-point-in-time \
  --source-table-arn arn:aws:dynamodb:region:account:table/nbhd-city-production \
  --target-table-name nbhd-city-production-restored \
  --restore-date-time 2024-01-31T12:00:00Z
```

## Production Handoff

- [ ] Deployment tested and verified
- [ ] All acceptance criteria passed
- [ ] Team trained on troubleshooting
- [ ] Monitoring and alarms configured
- [ ] Runbook documented
- [ ] Disaster recovery plan in place
- [ ] Cost tracking enabled
- [ ] Performance baselines established

## Quick Reference

| Component | Status | Details |
|-----------|--------|---------|
| Terraform | ✓ Ready | 12 files created/modified |
| Lambda@Edge | ✓ Ready | Node.js 20.x, 128MB, <1MB size |
| S3 Bucket | ✓ Ready | OAC access, versioning enabled |
| CloudFront | ✓ Ready | Wildcard aliases, Lambda integration |
| ACM Cert | ✓ Ready | Wildcard + apex, us-east-1 |
| Route53 | ✓ Ready | Conditional zone creation |
| DynamoDB | ✓ Modified | GSI8 for subdomain lookup |

---

**Deployment Status**: Ready for Terraform Apply

**Estimated Deployment Time**:
- Full automated: 15-20 minutes
- Incremental: 20-30 minutes
- DNS propagation: 0-48 hours

**Next Action**: `terraform init && terraform plan`
