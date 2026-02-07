"""
AWS Lambda handler for building 11ty static sites.

SSG-016: 11ty Lambda Build Function

Implements the site building pipeline:
1. Clone template from GitHub
2. Query content records from DynamoDB
3. Transform AT Protocol records to 11ty format
4. Inject data files
5. Install dependencies
6. Run 11ty build
7. Upload to S3
8. Invalidate CloudFront cache
9. Update build status
"""

import os
import subprocess
import boto3
import json
import uuid
import mimetypes
from datetime import datetime, timezone
from typing import Dict, List, Optional
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


class SiteBuilder:
    """
    AWS Lambda function for building 11ty static sites.

    Timeout: 5 minutes (300 seconds)
    Memory: 1024 MB
    Runtime: Python 3.11 (with Node 20 layer)
    """

    def __init__(self):
        """Initialize AWS clients and configuration."""
        self.s3 = boto3.client('s3')
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(os.environ.get('DYNAMODB_TABLE', 'nbhd-city'))
        self.cloudfront = boto3.client('cloudfront')
        self.s3_bucket = os.environ.get('S3_BUCKET', 'nbhd-city-sites')
        self.cloudfront_distribution_id = os.environ.get('CLOUDFRONT_DISTRIBUTION_ID', '')

    async def handler(self, event, context):
        """
        Main Lambda handler for site builds.

        REQUIREMENT: [ ] Clone template repo from GitHub to /tmp
        REQUIREMENT: [ ] Query content records from DynamoDB (app.nbhd.blog.post)
        REQUIREMENT: [ ] Transform AT Protocol records to 11ty data format
        REQUIREMENT: [ ] Write _data/posts.json, _data/site.json
        REQUIREMENT: [ ] Run npm install (with timeout)
        REQUIREMENT: [ ] Run npm run build (11ty build)
        REQUIREMENT: [ ] Upload _site/ output to S3
        REQUIREMENT: [ ] Invalidate CloudFront cache
        REQUIREMENT: [ ] Update build job status in DynamoDB
        REQUIREMENT: [ ] Log errors to CloudWatch

        Event: {
            "site_id": "site-uuid-123",
            "user_did": "did:plc:abc123",
            "job_id": "job-uuid-456"
        }

        ACCEPTANCE CRITERIA:
        - [ ] Successfully builds sites with blog content
        - [ ] Output correctly uploaded to S3
        - [ ] CloudFront serves latest version
        - [ ] Build errors logged and returned
        - [ ] Completes within 5 minute timeout
        - [ ] Handles build failures gracefully
        """
        site_id = event.get('site_id')
        user_did = event.get('user_did')
        job_id = event.get('job_id')

        build_dir = f"/tmp/build-{uuid.uuid4()}"
        logger.info(f"Starting build for site {site_id}, job {job_id}")

        try:
            # Update status to running
            await self.update_build_status(job_id, "running")

            # Stage 1: Get site config
            logger.info("Stage 1: Fetching site configuration")
            site = await self.get_site(user_did, site_id)
            template = await self.get_template(site.get('template_id'))

            # Stage 2: Clone template
            # [x] Clone template repo from GitHub to /tmp
            logger.info(f"Stage 2: Cloning template from {template.get('github_url')}")
            await self.update_build_status(job_id, "running")
            self.clone_template(template.get('github_url'), build_dir)

            # Stage 3: Fetch content from PDS
            # [x] Query content records from DynamoDB (app.nbhd.blog.post)
            logger.info("Stage 3: Fetching content from DynamoDB")
            await self.update_build_status(job_id, "running")
            content = await self.fetch_site_content(user_did, site_id)
            logger.info(f"Fetched {len(content['posts'])} posts and {len(content.get('pages', []))} pages")

            # Stage 4: Inject data files
            # [x] Write _data/posts.json, _data/site.json
            logger.info("Stage 4: Injecting content data files")
            await self.update_build_status(job_id, "running")
            await self.inject_content_data(build_dir, content, site.get('config', {}))

            # Stage 5: Install dependencies
            # [x] Run npm install (with timeout)
            logger.info("Stage 5: Installing npm dependencies")
            await self.update_build_status(job_id, "running")
            self.npm_install(build_dir)

            # Stage 6: Run 11ty build
            # [x] Run npm run build (11ty build)
            logger.info("Stage 6: Running 11ty build")
            await self.update_build_status(job_id, "running")
            self.run_eleventy_build(build_dir)

            # Stage 7: Upload to S3
            # [x] Upload _site/ output to S3
            logger.info("Stage 7: Uploading to S3")
            await self.update_build_status(job_id, "running")
            s3_path = f"sites/{user_did}/{site_id}"
            output_dir = f"{build_dir}/_site"
            self.upload_to_s3(output_dir, s3_path)

            # Stage 8: Invalidate CloudFront
            # [x] Invalidate CloudFront cache
            logger.info("Stage 8: Invalidating CloudFront cache")
            await self.update_build_status(job_id, "running")
            subdomain = site.get('subdomain', user_did.split(':')[-1])
            self.invalidate_cloudfront(subdomain)

            # Stage 9: Complete
            # [x] Update build job status in DynamoDB
            logger.info("Stage 9: Marking build as completed")
            site_url = f"https://{subdomain}.nbhd.city"
            await self.update_build_status(
                job_id,
                "completed",
                output_url=site_url,
                s3_path=f"s3://{self.s3_bucket}/{s3_path}",
                content_count=len(content['posts']) + len(content.get('pages', []))
            )

            # Cleanup
            self.cleanup_build_dir(build_dir)

            logger.info(f"Build {job_id} completed successfully")
            return {
                "status": "success",
                "url": site_url,
                "job_id": job_id
            }

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Build {job_id} failed: {error_msg}", exc_info=True)
            # [x] Log errors to CloudWatch
            # [x] Handles build failures gracefully

            await self.update_build_status(
                job_id,
                "failed",
                error=error_msg
            )

            # Cleanup on error
            self.cleanup_build_dir(build_dir)

            raise

    def clone_template(self, github_url: str, dest: str):
        """
        Clone template repository (shallow clone).

        REQUIREMENT: [ ] Clone template repo from GitHub to /tmp
        """
        logger.info(f"Cloning template from {github_url}")
        try:
            subprocess.run([
                'git', 'clone',
                '--depth', '1',  # Shallow clone (only latest commit)
                github_url,
                dest
            ], check=True, timeout=60, capture_output=True)
            logger.info(f"Successfully cloned to {dest}")
        except subprocess.TimeoutExpired:
            raise Exception(f"Git clone timed out for {github_url}")
        except subprocess.CalledProcessError as e:
            raise Exception(f"Failed to clone template: {e.stderr.decode()}")

    async def fetch_site_content(self, user_did: str, site_id: str) -> Dict:
        """
        Query all content records from DynamoDB.

        REQUIREMENT: [ ] Query content records from DynamoDB (app.nbhd.blog.post)

        Returns: {
            "posts": [...],
            "pages": [...]
        }
        """
        from boto3.dynamodb.conditions import Key, Attr

        logger.info(f"Querying content for site {site_id}")

        try:
            # Query all blog posts
            posts_response = self.table.query(
                KeyConditionExpression=
                    Key("PK").eq(f"USER#{user_did}") &
                    Key("SK").begins_with("RECORD#app.nbhd.blog.post#"),
                FilterExpression=Attr("value.site_id").eq(site_id)
            )

            posts = [self.transform_record_to_11ty(r) for r in posts_response.get("Items", [])]
            logger.info(f"Found {len(posts)} blog posts")

            # Query all pages
            pages_response = self.table.query(
                KeyConditionExpression=
                    Key("PK").eq(f"USER#{user_did}") &
                    Key("SK").begins_with("RECORD#app.nbhd.blog.page#"),
                FilterExpression=Attr("value.site_id").eq(site_id)
            )

            pages = [self.transform_record_to_11ty(r) for r in pages_response.get("Items", [])]
            logger.info(f"Found {len(pages)} pages")

            return {
                "posts": posts,
                "pages": pages
            }
        except Exception as e:
            logger.error(f"Error fetching content: {str(e)}")
            raise

    def transform_record_to_11ty(self, record: Dict) -> Dict:
        """
        Transform AT Protocol record to 11ty data format.

        REQUIREMENT: [ ] Transform AT Protocol records to 11ty data format

        AT Protocol:
        {
            "uri": "at://...",
            "value": {
                "title": "My Post",
                "content": "# Hello...",
                "slug": "my-post",
                "frontmatter": {...}
            }
        }

        11ty:
        {
            "title": "My Post",
            "content": "# Hello...",
            "permalink": "/my-post/",
            "uri": "at://...",
            ...all frontmatter fields
        }
        """
        value = record.get('value', {})

        return {
            "title": value.get('title', 'Untitled'),
            "content": value.get('content', ''),
            "permalink": f"/{value.get('slug', 'post')}/",
            "uri": record.get('uri'),  # Link back to AT Protocol record
            **value.get('frontmatter', {})  # Spread all frontmatter
        }

    async def inject_content_data(self, build_dir: str, content: Dict, site_config: Dict):
        """
        Write content as 11ty data files.

        REQUIREMENT: [ ] Write _data/posts.json, _data/site.json

        Creates:
        - _data/site.json (site configuration)
        - _data/posts.json (all blog posts, sorted by date)
        - _data/pages.json (all pages)
        """
        logger.info("Injecting content data files")

        data_dir = os.path.join(build_dir, '_data')
        os.makedirs(data_dir, exist_ok=True)

        try:
            # Site config
            with open(os.path.join(data_dir, 'site.json'), 'w') as f:
                json.dump(site_config, f, indent=2)
            logger.info("Wrote _data/site.json")

            # Posts (sorted by date descending - newest first)
            posts = sorted(
                content.get('posts', []),
                key=lambda p: p.get('date', ''),
                reverse=True
            )
            with open(os.path.join(data_dir, 'posts.json'), 'w') as f:
                json.dump(posts, f, indent=2)
            logger.info(f"Wrote _data/posts.json ({len(posts)} posts)")

            # Pages
            pages = content.get('pages', [])
            with open(os.path.join(data_dir, 'pages.json'), 'w') as f:
                json.dump(pages, f, indent=2)
            logger.info(f"Wrote _data/pages.json ({len(pages)} pages)")

        except Exception as e:
            logger.error(f"Error injecting content data: {str(e)}")
            raise

    def npm_install(self, build_dir: str):
        """
        Install npm dependencies with timeout.

        REQUIREMENT: [ ] Run npm install (with timeout)
        """
        logger.info("Running npm install")
        try:
            subprocess.run(
                ['npm', 'install'],
                cwd=build_dir,
                check=True,
                timeout=120,  # 2 minutes
                capture_output=True
            )
            logger.info("npm install completed successfully")
        except subprocess.TimeoutExpired:
            raise Exception("npm install timed out after 2 minutes")
        except subprocess.CalledProcessError as e:
            stderr = e.stderr.decode() if e.stderr else "Unknown error"
            raise Exception(f"npm install failed: {stderr}")

    def run_eleventy_build(self, build_dir: str):
        """
        Run 11ty build process.

        REQUIREMENT: [ ] Run npm run build (11ty build)
        """
        logger.info("Running npm run build (11ty)")
        try:
            subprocess.run(
                ['npm', 'run', 'build'],
                cwd=build_dir,
                check=True,
                timeout=180,  # 3 minutes
                capture_output=True
            )
            logger.info("11ty build completed successfully")
        except subprocess.TimeoutExpired:
            raise Exception("11ty build timed out after 3 minutes")
        except subprocess.CalledProcessError as e:
            stderr = e.stderr.decode() if e.stderr else "Unknown error"
            raise Exception(f"11ty build failed: {stderr}")

    def upload_to_s3(self, local_dir: str, s3_prefix: str):
        """
        Upload all files from local directory to S3.

        REQUIREMENT: [ ] Upload _site/ output to S3
        """
        logger.info(f"Uploading {local_dir} to S3 at {s3_prefix}")

        try:
            upload_count = 0
            for root, dirs, files in os.walk(local_dir):
                for file in files:
                    local_path = os.path.join(root, file)
                    relative_path = os.path.relpath(local_path, local_dir)
                    # Convert backslashes to forward slashes for S3 keys
                    s3_key = f"{s3_prefix}/{relative_path}".replace(os.sep, '/')

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
                    upload_count += 1

            logger.info(f"Successfully uploaded {upload_count} files to S3")
        except Exception as e:
            logger.error(f"Error uploading to S3: {str(e)}")
            raise

    def get_content_type(self, filename: str) -> str:
        """
        Determine content type from file extension.

        REQUIREMENT: [ ] (Supports uploading with correct content types)
        """
        content_type, _ = mimetypes.guess_type(filename)
        return content_type or 'application/octet-stream'

    def invalidate_cloudfront(self, subdomain: str):
        """
        Invalidate CloudFront cache for subdomain.

        REQUIREMENT: [ ] Invalidate CloudFront cache
        """
        logger.info(f"Invalidating CloudFront cache for {subdomain}")

        if not self.cloudfront_distribution_id:
            logger.warning("CloudFront distribution ID not configured, skipping invalidation")
            return

        try:
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
            logger.info(f"CloudFront invalidation requested for {subdomain}")
        except Exception as e:
            logger.error(f"Error invalidating CloudFront: {str(e)}")
            raise

    async def update_build_status(self, job_id: str, status: str, **kwargs):
        """
        Update build job status in DynamoDB.

        REQUIREMENT: [ ] Update build job status in DynamoDB
        """
        logger.info(f"Updating build {job_id} status to {status}")

        update_expr = "SET #status = :status, updated_at = :updated_at"
        expr_values = {
            ":status": status,
            ":updated_at": datetime.now(timezone.utc).isoformat()
        }
        expr_names = {"#status": "status"}

        if status == "completed":
            update_expr += ", completed_at = :completed_at, output_url = :output_url"
            expr_values[":completed_at"] = datetime.now(timezone.utc).isoformat()
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

        try:
            self.table.update_item(
                Key={"PK": f"SITE#{job_id}", "SK": "BUILD#METADATA"},
                UpdateExpression=update_expr,
                ExpressionAttributeValues=expr_values,
                ExpressionAttributeNames=expr_names
            )
        except Exception as e:
            logger.error(f"Error updating build status: {str(e)}")
            raise

    async def get_site(self, user_did: str, site_id: str) -> Dict:
        """Get site configuration from DynamoDB."""
        try:
            response = self.table.get_item(
                Key={"PK": f"SITE#{site_id}", "SK": "METADATA"}
            )
            site = response.get("Item", {})
            if not site:
                raise Exception(f"Site {site_id} not found")
            return site
        except Exception as e:
            logger.error(f"Error fetching site: {str(e)}")
            raise

    async def get_template(self, template_id: str) -> Dict:
        """Get template metadata from DynamoDB."""
        try:
            response = self.table.get_item(
                Key={"PK": f"TEMPLATE#{template_id}", "SK": "METADATA"}
            )
            template = response.get("Item", {})
            if not template:
                raise Exception(f"Template {template_id} not found")
            return template
        except Exception as e:
            logger.error(f"Error fetching template: {str(e)}")
            raise

    def cleanup_build_dir(self, build_dir: str):
        """Clean up temporary build directory."""
        import shutil
        try:
            if os.path.exists(build_dir):
                shutil.rmtree(build_dir)
                logger.info(f"Cleaned up build directory {build_dir}")
        except Exception as e:
            logger.warning(f"Error cleaning up build directory: {str(e)}")


async def handler(event, context):
    """
    AWS Lambda handler entry point.

    Event: {
        "site_id": "site-uuid-123",
        "user_did": "did:plc:abc123",
        "job_id": "job-uuid-456"
    }
    """
    builder = SiteBuilder()
    return await builder.handler(event, context)
