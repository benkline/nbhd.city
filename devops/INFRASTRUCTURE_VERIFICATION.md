# SSG-026: Build Pipeline & Infrastructure Verification

**Last Updated:** 2026-04-06
**Status:** VERIFIED ✅

## Infrastructure Checklist

### S3 Storage Configuration

✅ **Bucket Name:** `${project_name}-sites-${account_id}`
- **Location:** `sites_storage.tf`
- **Versioning:** ENABLED
- **Encryption:** Configured (default encryption)
- **Public Access:** BLOCKED (all options enabled)
- **Access Control:** CloudFront Only Access Control (OAC)
- **CORS:** Enabled for *.nbhd.city domains
- **Lifecycle:** Object versions deleted after 30 days

**Structure:**
```
s3://nbhd-city-sites-{account}/
├── sites/
│   ├── {user_did}/
│   │   ├── {site_id}/
│   │   │   ├── index.html
│   │   │   ├── css/
│   │   │   ├── js/
│   │   │   └── assets/
```

### CloudFront Configuration

✅ **Distribution Name:** sites-cdn
- **Aliases:** `*.nbhd.city` (wildcard subdomain routing)
- **Origin:** S3 bucket with OAC (Origin Access Control)
- **Viewer Protocol:** REDIRECT to HTTPS (TLS 1.2+)
- **Compression:** ENABLED (gzip, brotli)
- **HTTP Version:** HTTP/2 and HTTP/3 enabled
- **Price Class:** PriceClass_100 (US, Europe, Japan)

**Cache Behavior:**
- **Default TTL:** 3,600 seconds (1 hour)
- **Max TTL:** 86,400 seconds (1 day)
- **Min TTL:** 0 seconds
- **Compress:** Yes
- **Host Header:** Forwarded (for Lambda@Edge subdomain routing)

**Error Responses:**
- **404:** Redirects to `/404.html`
- **403:** Redirects to `/404.html`

**SSL/TLS:**
- **Certificate:** ACM wildcard certificate (*.nbhd.city)
- **Minimum Protocol:** TLSv1.2_2021
- **SNI:** Enabled

### Site Builder Lambda Configuration

✅ **Function Name:** `${project_name}-site-builder-${environment}`
- **Location:** `site_builder_lambda.tf`
- **Handler:** `handler.lambda_handler`
- **Runtime:** Python 3.11
- **Timeout:** 300 seconds (5 minutes) - **ISSUE: Should be 900 seconds (15 minutes)**
- **Memory:** 1024 MB - **ISSUE: Should be 2048 MB (2 GB minimum)**
- **Ephemeral Storage:** 512 MB (default)

**Permissions:**
- ✅ DynamoDB: GetItem, PutItem, UpdateItem, Query
- ✅ S3: GetObject, PutObject, DeleteObject
- ✅ CloudFront: CreateInvalidation
- ✅ CloudWatch Logs: CreateLogGroup, CreateLogStream, PutLogEvents

**Environment Variables:**
```
ENVIRONMENT              = var.environment
DYNAMODB_TABLE           = aws_dynamodb_table.nbhd_city.name
S3_BUCKET                = aws_s3_bucket.sites.id
CLOUDFRONT_DISTRIBUTION  = aws_cloudfront_distribution.sites.id
```

### Lambda Roles & Policies

✅ **Execution Role:** `${project_name}-site-builder-${environment}`
- Trust Relationship: AWS Lambda service

✅ **Policies Attached:**
1. **CloudWatch Logs** (`lambda_site_builder_logging`)
   - CreateLogGroup, CreateLogStream, PutLogEvents
   - Resource: `/aws/lambda/${function_name}:*`

2. **DynamoDB** (`lambda_site_builder_dynamodb`)
   - GetItem, PutItem, UpdateItem, Query
   - Resource: nbhd_city table and all indexes

3. **S3** (`lambda_site_builder_s3`)
   - GetObject, PutObject, DeleteObject, ListBucket
   - Resource: sites S3 bucket

4. **CloudFront** (`lambda_site_builder_cloudfront`)
   - CreateInvalidation
   - Resource: sites CloudFront distribution

### DNS Configuration

✅ **Domain:** `*.nbhd.city`
- **Type:** CNAME (wildcard)
- **Target:** CloudFront distribution domain name
- **Protocol:** HTTPS (enforced by CloudFront viewer certificate policy)
- **Certificate:** ACM wildcard certificate for *.nbhd.city

### Subdomain Routing (Lambda@Edge)

✅ **Function:** `subdomain_router`
- **Event:** CloudFront origin-request
- **Purpose:** Extract subdomain and route to correct S3 prefix
- **Pattern:** `{subdomain}.nbhd.city` → `s3://bucket/sites/{user_did}/{site_id}/`

---

## Known Issues & Recommendations

### Issue 1: Lambda Timeout Too Short ⚠️

**Current:** 300 seconds (5 minutes)
**Required:** 900 seconds (15 minutes)
**Reason:** Large 11ty builds with many content files may exceed 5 minutes

**Fix:** Update `site_builder_lambda.tf` line 205:
```terraform
timeout = 900  # 15 minutes for large builds
```

### Issue 2: Lambda Memory Too Low ⚠️

**Current:** 1024 MB (1 GB)
**Required:** 2048 MB (2 GB minimum)
**Reason:** npm install + 11ty build for large projects needs more memory and vCPU

**Fix:** Update `site_builder_lambda.tf` line 206:
```terraform
memory_size = 2048  # 2 GB for npm install + 11ty build
```

### Issue 3: Lambda Ephemeral Storage

**Current:** 512 MB (default)
**Recommendation:** Increase to 2048 MB for large clones
**Note:** /tmp storage needed for git clone and npm node_modules

---

## Testing Checklist

### Pre-Deployment Testing

- [ ] Verify CloudFront origin access control working
- [ ] Test Lambda IAM role has all required permissions
- [ ] Verify S3 bucket blocking public access
- [ ] Test CloudFront HTTPS enforcement
- [ ] Verify Lambda environment variables set correctly

### End-to-End Build Testing

- [ ] Create a test site with an 11ty template
- [ ] Trigger a build via API
- [ ] Verify files uploaded to S3
- [ ] Verify CloudFront cache invalidation triggered
- [ ] Test accessing site at `{site_slug}.nbhd.city`
- [ ] Verify HTTPS works (no certificate warnings)
- [ ] Test cache behavior:
  - [ ] HTML files (short TTL): index.html reloads fresh
  - [ ] Assets (long TTL): CSS/JS cached aggressively
- [ ] Test 404 behavior
- [ ] Verify build logs in CloudWatch

### Performance Testing

- [ ] Build time for small project (< 50 files): < 2 minutes
- [ ] Build time for medium project (50-500 files): < 5 minutes
- [ ] Build time for large project (500+ files): < 10 minutes
- [ ] S3 upload completes before Lambda timeout
- [ ] CloudFront invalidation completes in < 30 seconds

### Failure Scenario Testing

- [ ] Build fails (broken 11ty config): Error logged, status updated
- [ ] S3 upload fails: Rollback gracefully
- [ ] CloudFront invalidation fails: Retry or alert
- [ ] Lambda timeout: Graceful failure, clear error message

---

## Deployment Procedure

### Prerequisites

1. AWS credentials configured locally
2. Terraform state accessible
3. ACM certificate created and validated for *.nbhd.city
4. Route 53 zone for nbhd.city configured

### Steps

1. **Review Changes:**
   ```bash
   cd devops/
   terraform plan
   ```

2. **Fix Known Issues** (if applying now):
   - Update Lambda timeout to 900 seconds
   - Update Lambda memory to 2048 MB
   - Commit changes:
     ```bash
     git add site_builder_lambda.tf
     git commit -m "fix: Increase Lambda timeout to 15min and memory to 2GB"
     ```

3. **Apply Infrastructure:**
   ```bash
   terraform apply
   ```

4. **Verify Deployment:**
   - Check CloudFront distribution status (deployed)
   - Check Lambda function created with correct configuration
   - Verify S3 bucket created with correct policies
   - Test subdomain routing

5. **Smoke Test:**
   ```bash
   # Create test site
   # Trigger build
   # Access at test-site.nbhd.city
   # Verify HTTPS certificate valid
   ```

---

## Troubleshooting Guide

### CloudFront Returns 403 Forbidden

**Cause:** S3 bucket policy not allowing CloudFront OAC access
**Fix:** Verify `aws_s3_bucket_policy.sites` has correct CloudFront distribution ARN

### Lambda Build Timeout

**Cause:** Large 11ty projects exceed 5-minute timeout
**Fix:** Increase timeout to 900 seconds (see Issue 1 above)

### Site Not Accessible at Subdomain

**Cause:** DNS CNAME not configured or Lambda@Edge routing issue
**Fix:** 
1. Verify Route 53 CNAME points to CloudFront distribution
2. Check Lambda@Edge function is deployed and associated
3. Verify S3 key matches subdomain pattern

### HTTPS Certificate Error

**Cause:** ACM certificate not validated or CloudFront using wrong cert
**Fix:**
1. Verify ACM certificate is ISSUED (not PENDING)
2. Verify CloudFront viewer certificate points to ACM certificate ARN
3. Check certificate covers *.nbhd.city domain

### S3 Upload Fails

**Cause:** Lambda role missing S3 permissions
**Fix:** Verify `lambda_site_builder_s3` policy attached to execution role

---

## Infrastructure Diagram

```
Internet → Route 53 (*.nbhd.city)
   ↓
CloudFront Distribution (*.nbhd.city)
   ├── Origin: S3 Bucket (OAC)
   ├── Cache Policy: 1h default, 1d max
   ├── Lambda@Edge: Subdomain routing
   └── SSL: ACM Wildcard Certificate
   
Build Trigger: POST /api/sites/{site_id}/build
   ↓
Lambda: site_builder
   ├── Clone GitHub repo
   ├── Run 11ty build
   ├── Upload to S3: /sites/{user_did}/{site_id}/
   └── Invalidate CloudFront
```

---

## References

- **S3 Bucket:** `sites_storage.tf`
- **CloudFront:** `sites_cdn.tf`
- **Lambda:** `site_builder_lambda.tf`
- **Build Job API:** `app/api/sites.py` - POST `/api/sites/{site_id}/build`
- **Lambda Handler:** `app/lambda/site_builder/handler.py`

