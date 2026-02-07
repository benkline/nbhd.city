# Build Pipeline Specification

**Status:** Phase 2d - Design
**Last Updated:** 2026-01-21

---

## Overview

The Build Pipeline transforms user content (stored as AT Protocol records in DynamoDB) into static websites using 11ty. The pipeline clones templates from GitHub, queries content from the PDS, runs the build process in AWS Lambda, and deploys to S3/CloudFront.

**Key Principle:** Content and presentation are decoupled. The PDS (DynamoDB) is the source of truth for content, while templates define how that content is rendered.

---

## Architecture

```
User clicks "Deploy"
       ↓
POST /api/sites/{id}/build
       ↓
Create Build Job (DynamoDB)
       ↓
Invoke Lambda (async)
       ↓
┌────────────────────────────────────────┐
│    Lambda Build Function               │
│    Container: Node 20 + Python 3.11    │
├────────────────────────────────────────┤
│                                        │
│  1. Clone Template (GitHub → /tmp)    │
│     git clone --depth 1 {url}          │
│                                        │
│  2. Query Content (DynamoDB)           │
│     Get all app.nbhd.blog.post records │
│                                        │
│  3. Transform to 11ty Format           │
│     AT Protocol → JSON data files      │
│                                        │
│  4. Inject Site Config                 │
│     Write _data/site.json              │
│     Write _data/posts.json             │
│                                        │
│  5. Install Dependencies               │
│     npm install (timeout: 2min)        │
│                                        │
│  6. Run 11ty Build                     │
│     npm run build (timeout: 3min)      │
│     → _site/ output                    │
│                                        │
│  7. Upload to S3                       │
│     _site/* → s3://sites/{did}/{id}/   │
│                                        │
│  8. Invalidate CloudFront              │
│     Pattern: /{subdomain}/*            │
│                                        │
│  9. Update Build Status                │
│     BUILD#{job_id} → "completed"       │
│                                        │
└────────────────────────────────────────┘
       ↓
User sees live site
https://{subdomain}.nbhd.city
```

---

## Build Job Schema (DynamoDB)

```python
{
    # Primary Key
    "PK": "BUILD#{job_id}",
    "SK": "METADATA",

    # Job Info
    "job_id": "job-uuid-456",
    "site_id": "site-uuid-123",
    "user_did": "did:plc:abc123",
    "template_id": "template-uuid-789",

    # Status
    "status": "pending" | "running" | "completed" | "failed",
    "started_at": "2026-01-21T00:00:00Z",
    "completed_at": "2026-01-21T00:05:00Z",
    "duration_seconds": 45,

    # Results
    "output_url": "https://alice.nbhd.city",
    "s3_path": "s3://nbhd-sites/sites/did:plc:abc123/site-uuid-123/",
    "cloudwatch_log_stream": "2026/01/21/[$LATEST]abc123...",

    # Error Handling
    "error": null,  # Error message if failed
    "error_stage": null,  # Which stage failed: "clone", "build", "upload", etc.

    # Metadata
    "trigger": "manual" | "content_update" | "config_update",
    "content_count": 15,  # Number of posts/pages built
    "created_at": "2026-01-21T00:00:00Z"
}
```

**GSI4: Site Build History**
- PK: `site_id`
- SK: `started_at`
- Use: List all builds for a site

---

## Lambda Function Implementation

### File: `/lambda/site_builder/handler.py`

```python
import os
import subprocess
import boto3
import json
import uuid
from datetime import datetime
from typing import Dict, List

class SiteBuilder:
    """
    AWS Lambda function for building 11ty static sites.

    Timeout: 5 minutes
    Memory: 1024 MB
    Runtime: Python 3.11 (with Node 20 layer)
    """

    def __init__(self):
        self.s3 = boto3.client('s3')
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(os.environ['DYNAMODB_TABLE'])
        self.cloudfront = boto3.client('cloudfront')
        self.s3_bucket = os.environ['S3_BUCKET']
        self.cloudfront_distribution_id = os.environ['CLOUDFRONT_DISTRIBUTION_ID']

    async def handler(self, event, context):
        """
        Main handler for site builds.

        Event: {
            "site_id": "site-uuid-123",
            "user_did": "did:plc:abc123",
            "job_id": "job-uuid-456"
        }
        """
        site_id = event['site_id']
        user_did = event['user_did']
        job_id = event['job_id']

        build_dir = f"/tmp/build-{uuid.uuid4()}"

        try:
            # Update status to running
            await self.update_build_status(job_id, "running")

            # Stage 1: Get site config
            site = await self.get_site(user_did, site_id)
            template = await self.get_template(site['template_id'])

            # Stage 2: Clone template
            await self.update_build_status(job_id, "running", stage="clone")
            await self.clone_template(template['github_url'], build_dir)

            # Stage 3: Fetch content from PDS
            await self.update_build_status(job_id, "running", stage="fetch_content")
            content = await self.fetch_site_content(user_did, site_id)

            # Stage 4: Inject data files
            await self.update_build_status(job_id, "running", stage="inject_data")
            await self.inject_content_data(build_dir, content, site['config'])

            # Stage 5: Install dependencies
            await self.update_build_status(job_id, "running", stage="install")
            await self.npm_install(build_dir)

            # Stage 6: Run 11ty build
            await self.update_build_status(job_id, "running", stage="build")
            await self.run_eleventy_build(build_dir)

            # Stage 7: Upload to S3
            await self.update_build_status(job_id, "running", stage="upload")
            s3_path = f"sites/{user_did}/{site_id}"
            output_dir = f"{build_dir}/_site"
            await self.upload_to_s3(output_dir, s3_path)

            # Stage 8: Invalidate CloudFront
            await self.update_build_status(job_id, "running", stage="invalidate")
            await self.invalidate_cloudfront(site['subdomain'])

            # Stage 9: Complete
            site_url = f"https://{site['subdomain']}.nbhd.city"
            await self.update_build_status(
                job_id,
                "completed",
                output_url=site_url,
                s3_path=f"s3://{self.s3_bucket}/{s3_path}",
                content_count=len(content['posts']) + len(content.get('pages', []))
            )

            # Cleanup
            subprocess.run(['rm', '-rf', build_dir], check=False)

            return {
                "status": "success",
                "url": site_url,
                "job_id": job_id
            }

        except Exception as e:
            error_msg = str(e)
            await self.update_build_status(
                job_id,
                "failed",
                error=error_msg
            )

            # Cleanup on error
            subprocess.run(['rm', '-rf', build_dir], check=False)

            raise

    async def clone_template(self, github_url: str, dest: str):
        """Clone template repository (shallow clone)."""
        subprocess.run([
            'git', 'clone',
            '--depth', '1',  # Shallow clone (only latest commit)
            github_url,
            dest
        ], check=True, timeout=60)

    async def fetch_site_content(self, user_did: str, site_id: str) -> Dict:
        """
        Query all content records from DynamoDB.

        Returns: {
            "posts": [...],
            "pages": [...]
        }
        """
        from boto3.dynamodb.conditions import Key, Attr

        # Query all blog posts
        posts_response = await self.table.query(
            KeyConditionExpression=
                Key("PK").eq(f"USER#{user_did}") &
                Key("SK").begins_with("RECORD#app.nbhd.blog.post#"),
            FilterExpression=Attr("value.site_id").eq(site_id)
        )

        posts = [self.transform_record_to_11ty(r) for r in posts_response.get("Items", [])]

        # Query all pages
        pages_response = await self.table.query(
            KeyConditionExpression=
                Key("PK").eq(f"USER#{user_did}") &
                Key("SK").begins_with("RECORD#app.nbhd.blog.page#"),
            FilterExpression=Attr("value.site_id").eq(site_id)
        )

        pages = [self.transform_record_to_11ty(r) for r in pages_response.get("Items", [])]

        return {
            "posts": posts,
            "pages": pages
        }

    def transform_record_to_11ty(self, record: Dict) -> Dict:
        """
        Transform AT Protocol record to 11ty data format.

        AT Protocol:
        {
            "uri": "at://...",
            "value": {
                "title": "My Post",
                "content": "# Hello...",
                "frontmatter": {...}
            }
        }

        11ty:
        {
            "title": "My Post",
            "content": "# Hello...",
            "date": "2026-01-21",
            "tags": [...],
            "permalink": "/posts/my-post/",
            ...all frontmatter fields
        }
        """
        value = record['value']

        return {
            "title": value['title'],
            "content": value['content'],
            "permalink": f"/{value['slug']}/",
            "uri": record['uri'],  # Link back to AT Protocol record
            **value.get('frontmatter', {})  # Spread all frontmatter
        }

    async def inject_content_data(self, build_dir: str, content: Dict, site_config: Dict):
        """
        Write content as 11ty data files.

        Creates:
        - _data/site.json (site configuration)
        - _data/posts.json (all blog posts)
        - _data/pages.json (all pages)
        """
        data_dir = f"{build_dir}/_data"
        os.makedirs(data_dir, exist_ok=True)

        # Site config
        with open(f"{data_dir}/site.json", 'w') as f:
            json.dump(site_config, f, indent=2)

        # Posts (sorted by date descending)
        posts = sorted(
            content['posts'],
            key=lambda p: p.get('date', ''),
            reverse=True
        )
        with open(f"{data_dir}/posts.json", 'w') as f:
            json.dump(posts, f, indent=2)

        # Pages
        with open(f"{data_dir}/pages.json", 'w') as f:
            json.dump(content.get('pages', []), f, indent=2)

    async def npm_install(self, build_dir: str):
        """Install npm dependencies with timeout."""
        subprocess.run(
            ['npm', 'install'],
            cwd=build_dir,
            check=True,
            timeout=120,  # 2 minutes
            capture_output=True
        )

    async def run_eleventy_build(self, build_dir: str):
        """Run 11ty build process."""
        subprocess.run(
            ['npm', 'run', 'build'],
            cwd=build_dir,
            check=True,
            timeout=180,  # 3 minutes
            capture_output=True
        )

    async def upload_to_s3(self, local_dir: str, s3_prefix: str):
        """Upload all files from local directory to S3."""
        for root, dirs, files in os.walk(local_dir):
            for file in files:
                local_path = os.path.join(root, file)
                relative_path = os.path.relpath(local_path, local_dir)
                s3_key = f"{s3_prefix}/{relative_path}"

                content_type = self.get_content_type(file)

                self.s3.upload_file(
                    local_path,
                    self.s3_bucket,
                    s3_key,
                    ExtraArgs={
                        'ContentType': content_type,
                        'CacheControl': 'max-age=3600'  # 1 hour cache
                    }
                )

    def get_content_type(self, filename: str) -> str:
        """Determine content type from file extension."""
        import mimetypes
        content_type, _ = mimetypes.guess_type(filename)
        return content_type or 'application/octet-stream'

    async def invalidate_cloudfront(self, subdomain: str):
        """Invalidate CloudFront cache for subdomain."""
        self.cloudfront.create_invalidation(
            DistributionId=self.cloudfront_distribution_id,
            InvalidationBatch={
                'Paths': {
                    'Quantity': 1,
                    'Items': [f'/{subdomain}/*']
                },
                'CallerReference': str(uuid.uuid4())
            }
        )

    async def update_build_status(self, job_id: str, status: str, **kwargs):
        """Update build job status in DynamoDB."""
        update_expr = "SET #status = :status, updated_at = :updated_at"
        expr_values = {
            ":status": status,
            ":updated_at": datetime.utcnow().isoformat() + "Z"
        }
        expr_names = {"#status": "status"}

        if status == "completed":
            update_expr += ", completed_at = :completed_at, output_url = :output_url"
            expr_values[":completed_at"] = datetime.utcnow().isoformat() + "Z"
            expr_values[":output_url"] = kwargs.get("output_url")

            if "s3_path" in kwargs:
                update_expr += ", s3_path = :s3_path"
                expr_values[":s3_path"] = kwargs["s3_path"]

            if "content_count" in kwargs:
                update_expr += ", content_count = :content_count"
                expr_values[":content_count"] = kwargs["content_count"]

        if status == "failed":
            update_expr += ", error = :error, error_stage = :error_stage"
            expr_values[":error"] = kwargs.get("error")
            expr_values[":error_stage"] = kwargs.get("stage", "unknown")

        await self.table.update_item(
            Key={"PK": f"BUILD#{job_id}", "SK": "METADATA"},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values,
            ExpressionAttributeNames=expr_names
        )
```

---

## API Endpoints

### POST /api/sites/{site_id}/build

**Purpose:** Trigger site build

**Request:** No body required

**Response (202 Accepted):**
```json
{
  "job_id": "job-uuid-456",
  "status": "pending",
  "message": "Build started",
  "poll_url": "/api/sites/site-uuid-123/builds/job-uuid-456"
}
```

**Process:**
1. Validate user owns site
2. Get site and template info
3. Create build job record (status: "pending")
4. Invoke Lambda async
5. Return job_id immediately

---

### GET /api/sites/{site_id}/builds/{job_id}

**Purpose:** Poll build status

**Response (Running):**
```json
{
  "job_id": "job-uuid-456",
  "status": "running",
  "stage": "build",
  "started_at": "2026-01-21T00:00:00Z",
  "duration_seconds": 30
}
```

**Response (Completed):**
```json
{
  "job_id": "job-uuid-456",
  "status": "completed",
  "output_url": "https://alice.nbhd.city",
  "started_at": "2026-01-21T00:00:00Z",
  "completed_at": "2026-01-21T00:00:45Z",
  "duration_seconds": 45,
  "content_count": 15
}
```

**Response (Failed):**
```json
{
  "job_id": "job-uuid-456",
  "status": "failed",
  "error": "npm install failed: ...",
  "error_stage": "install",
  "started_at": "2026-01-21T00:00:00Z",
  "completed_at": "2026-01-21T00:01:30Z"
}
```

---

### GET /api/sites/{site_id}/builds

**Purpose:** List build history

**Response:**
```json
{
  "data": [
    {
      "job_id": "job-uuid-456",
      "status": "completed",
      "output_url": "https://alice.nbhd.city",
      "started_at": "2026-01-21T00:00:00Z",
      "duration_seconds": 45
    },
    {
      "job_id": "job-uuid-123",
      "status": "failed",
      "error": "Build timeout",
      "started_at": "2026-01-20T12:00:00Z"
    }
  ],
  "meta": {
    "total": 8,
    "skip": 0,
    "limit": 10
  }
}
```

---

## Subdomain Routing (CloudFront + S3)

### Architecture

```
User requests: https://alice.nbhd.city
       ↓
CloudFront Distribution
       ↓
Origin Request Lambda@Edge
  - Extract subdomain: "alice"
  - Map to S3 path: /sites/{did}/site-id/
       ↓
S3 Bucket: nbhd-sites
  /sites/did:plc:abc123/site-uuid-123/index.html
       ↓
Response to user
```

### S3 Bucket Structure

```
s3://nbhd-sites/
  sites/
    did:plc:abc123/
      site-uuid-123/
        index.html
        posts/
          my-first-post/
            index.html
        assets/
          css/
          js/
      site-uuid-456/
        ...
    did:plc:def456/
      ...
```

### CloudFront Origin Request Lambda

```javascript
exports.handler = async (event) => {
    const request = event.Records[0].cf.request;
    const host = request.headers.host[0].value;

    // Extract subdomain
    const subdomain = host.split('.')[0];

    // Skip apex domain
    if (subdomain === 'nbhd' || subdomain === 'www') {
        return request;
    }

    // Look up site_id from subdomain (cached in Lambda)
    const { user_did, site_id } = await lookupSiteBySubdomain(subdomain);

    if (!user_did || !site_id) {
        return {
            status: '404',
            statusDescription: 'Site Not Found'
        };
    }

    // Rewrite origin path
    request.origin.s3.path = `/sites/${user_did}/${site_id}`;

    return request;
};
```

---

## Error Handling

### Common Build Errors

1. **Template Clone Failed**
   - Cause: GitHub repo not found, timeout, too large
   - Response: "Failed to clone template: {error}"
   - Retry: Manual

2. **npm install Failed**
   - Cause: Invalid package.json, network issues, timeout
   - Response: "Dependency installation failed: {error}"
   - Retry: Automatic (up to 2 retries)

3. **11ty Build Failed**
   - Cause: Template errors, invalid content, missing files
   - Response: "Build failed: {11ty error message}"
   - Retry: Manual (likely requires content/template fix)

4. **S3 Upload Failed**
   - Cause: Permissions, network, disk space
   - Response: "Upload failed: {error}"
   - Retry: Automatic

5. **Timeout**
   - Cause: Build takes >5 minutes
   - Response: "Build timeout - site may be too large"
   - Mitigation: Increase Lambda timeout, optimize template

---

## Performance Optimization

### 1. Lambda Layers
Package common dependencies in Lambda layers:
- Node.js 20
- Common npm packages (minimist, gray-matter, etc.)
- Git binary

**Benefit:** Faster cold starts, smaller deployment package

### 2. Template Caching
Store cloned templates in S3 (cache key: commit SHA):
```
s3://nbhd-templates-cache/
  github.com/user/repo/abc123def.tar.gz
```

**Benefit:** Skip clone step if template hasn't changed

### 3. Incremental Builds
Hash site config + content to detect changes:
```python
content_hash = hash(config + all_content_cids)
if content_hash == last_build_hash:
    return previous_build_url  # Skip rebuild
```

**Benefit:** Avoid unnecessary rebuilds

### 4. Parallel Uploads
Upload S3 files in parallel (10 concurrent):
```python
with ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(upload_file, f) for f in files]
```

**Benefit:** Faster deployments

---

## Security

1. **Isolation:** Each build runs in isolated Lambda container
2. **No network during build:** Block outbound requests after template clone
3. **Resource limits:** 5 min timeout, 1 GB memory, 512 MB /tmp
4. **Validation:** Scan package.json for suspicious dependencies
5. **User ownership:** Verify user owns site before building

---

## Monitoring & Logging

**CloudWatch Metrics:**
- Build duration (p50, p95, p99)
- Success rate
- Error types (clone, install, build, upload)
- Concurrent builds

**CloudWatch Logs:**
- Build start/end timestamps
- Each build stage
- npm install output
- 11ty build output (errors only)
- S3 upload progress

**Alarms:**
- Build failure rate >10%
- Average build duration >3 minutes
- Lambda errors

---

## Testing Strategy

**Unit Tests:**
```python
def test_transform_record_to_11ty():
    record = {
        "uri": "at://did:plc:abc123/app.nbhd.blog.post/abc",
        "value": {
            "title": "My Post",
            "content": "# Hello",
            "slug": "my-post",
            "frontmatter": {"date": "2026-01-21", "tags": ["tech"]}
        }
    }

    result = SiteBuilder().transform_record_to_11ty(record)

    assert result["title"] == "My Post"
    assert result["date"] == "2026-01-21"
    assert result["tags"] == ["tech"]
    assert result["permalink"] == "/my-post/"
```

**Integration Tests:**
```python
async def test_full_build_process():
    # Create test site with content
    site_id = await create_test_site()
    await create_test_posts(site_id, count=5)

    # Trigger build
    job_id = await trigger_build(site_id)

    # Wait for completion
    job = await wait_for_build(job_id, timeout=300)

    assert job["status"] == "completed"
    assert job["output_url"].startswith("https://")

    # Verify site accessible
    response = requests.get(job["output_url"])
    assert response.status_code == 200
    assert "My Post" in response.text
```

---

## Future Enhancements

1. **Build Logs UI:** Real-time streaming via WebSocket
2. **Build Queue:** Priority queue for concurrent builds
3. **Build Cache:** Reuse artifacts from previous builds
4. **Preview Deployments:** Build to temporary URL before publishing
5. **Rollback:** Revert to previous build if new one fails
6. **Build Hooks:** Run custom scripts pre/post build
7. **Asset Optimization:** Minify JS/CSS, optimize images during build
