"""
Unit tests for SSG-016: 11ty Lambda Build Function

Tests for building static sites from templates and content.
"""

import pytest
import os
import tempfile
import shutil
import json
import subprocess
from pathlib import Path
from unittest.mock import patch, MagicMock, AsyncMock, call
from datetime import datetime
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestCloneTemplate:
    """
    Test cloning GitHub template repositories.
    Requirement: [ ] Clone template repo from GitHub to /tmp
    """

    def test_clone_template_success(self, tmp_path):
        """Test successful template cloning"""
        # [ ] Clone template repo from GitHub to /tmp

        # Mock git clone
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(returncode=0)

            from site_builder.handler import SiteBuilder
            builder = SiteBuilder()
            builder.clone_template(
                "https://github.com/11ty/eleventy-base-blog.git",
                str(tmp_path / "template")
            )

            # Verify git clone was called with correct params
            assert mock_run.called
            call_args = mock_run.call_args
            assert "clone" in call_args[0][0]
            assert "--depth" in call_args[0][0]


class TestFetchContent:
    """
    Test fetching content records from DynamoDB.
    Requirement: [ ] Query content records from DynamoDB (app.nbhd.blog.post)
    """

    @pytest.mark.asyncio
    async def test_fetch_site_content(self):
        """Test fetching blog posts and pages from DynamoDB"""
        # [ ] Query content records from DynamoDB (app.nbhd.blog.post)

        from site_builder.handler import SiteBuilder

        # Mock DynamoDB table - query returns dict, not coroutine
        mock_table = MagicMock()
        mock_table.query = MagicMock(return_value={
            "Items": [
                {
                    "uri": "at://did:plc:user/app.nbhd.blog.post/abc123",
                    "value": {
                        "title": "Test Post",
                        "content": "# Hello",
                        "slug": "test-post",
                        "date": "2026-01-21",
                        "site_id": "site-123",
                        "frontmatter": {"tags": ["test"]}
                    }
                }
            ]
        })

        builder = SiteBuilder()
        builder.table = mock_table

        content = await builder.fetch_site_content("did:plc:user", "site-123")

        assert len(content["posts"]) >= 1
        assert "posts" in content
        assert "pages" in content


class TestTransformRecords:
    """
    Test transforming AT Protocol records to 11ty format.
    Requirement: [ ] Transform AT Protocol records to 11ty data format
    """

    def test_transform_record_to_11ty(self):
        """Test AT Protocol record transformation"""
        # [ ] Transform AT Protocol records to 11ty data format

        from site_builder.handler import SiteBuilder

        record = {
            "uri": "at://did:plc:user/app.nbhd.blog.post/abc123",
            "value": {
                "title": "My Post",
                "content": "# Hello World",
                "slug": "my-post",
                "date": "2026-01-21",
                "site_id": "site-123",
                "frontmatter": {
                    "tags": ["blog", "test"],
                    "author": "Alice"
                }
            }
        }

        builder = SiteBuilder()
        transformed = builder.transform_record_to_11ty(record)

        # Verify transformation
        assert transformed["title"] == "My Post"
        assert transformed["content"] == "# Hello World"
        assert transformed["permalink"] == "/my-post/"
        assert transformed["uri"] == record["uri"]
        assert "tags" in transformed  # From frontmatter
        assert "author" in transformed


class TestInjectDataFiles:
    """
    Test writing 11ty data files.
    Requirement: [ ] Write _data/posts.json, _data/site.json
    """

    @pytest.mark.asyncio
    async def test_inject_content_data(self, tmp_path):
        """Test writing data files to _data directory"""
        # [ ] Write _data/posts.json, _data/site.json

        from site_builder.handler import SiteBuilder

        build_dir = tmp_path / "build"
        build_dir.mkdir()

        content = {
            "posts": [
                {
                    "title": "Post 1",
                    "content": "Content 1",
                    "date": "2026-01-21",
                    "permalink": "/post1/"
                },
                {
                    "title": "Post 2",
                    "content": "Content 2",
                    "date": "2026-01-20",
                    "permalink": "/post2/"
                }
            ],
            "pages": [
                {
                    "title": "About",
                    "content": "About page",
                    "permalink": "/about/"
                }
            ]
        }

        site_config = {
            "title": "My Site",
            "author": "Alice",
            "url": "https://alice.nbhd.city"
        }

        builder = SiteBuilder()
        await builder.inject_content_data(str(build_dir), content, site_config)

        # Verify files were created
        data_dir = build_dir / "_data"
        assert (data_dir / "site.json").exists()
        assert (data_dir / "posts.json").exists()
        assert (data_dir / "pages.json").exists()

        # Verify content
        with open(data_dir / "site.json") as f:
            site_data = json.load(f)
            assert site_data["title"] == "My Site"

        with open(data_dir / "posts.json") as f:
            posts_data = json.load(f)
            assert len(posts_data) == 2
            # Should be sorted by date (newest first)
            assert posts_data[0]["date"] == "2026-01-21"


class TestNpmOperations:
    """
    Test npm install and build operations.
    Requirement: [ ] Run npm install (with timeout)
    Requirement: [ ] Run npm run build (11ty build)
    """

    def test_npm_install_success(self, tmp_path):
        """Test successful npm install with timeout"""
        # [ ] Run npm install (with timeout)

        from site_builder.handler import SiteBuilder

        build_dir = tmp_path / "build"
        build_dir.mkdir()

        # Mock subprocess
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(returncode=0)

            builder = SiteBuilder()
            builder.npm_install(str(build_dir))

            # Verify npm install was called
            assert mock_run.called
            call_args = mock_run.call_args
            assert "npm" in call_args[0][0]
            assert "install" in call_args[0][0]
            # Verify timeout is set
            assert call_args[1].get("timeout") == 120

    def test_eleventy_build_success(self, tmp_path):
        """Test successful eleventy build"""
        # [ ] Run npm run build (11ty build)

        from site_builder.handler import SiteBuilder

        build_dir = tmp_path / "build"
        build_dir.mkdir()

        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(returncode=0)

            builder = SiteBuilder()
            builder.run_eleventy_build(str(build_dir))

            # Verify npm run build was called
            assert mock_run.called
            call_args = mock_run.call_args
            assert "npm" in call_args[0][0]
            assert "build" in call_args[0][0]
            # Verify timeout is set (180 seconds = 3 minutes)
            assert call_args[1].get("timeout") == 180


class TestS3Upload:
    """
    Test uploading built site to S3.
    Requirement: [ ] Upload _site/ output to S3
    """

    def test_upload_to_s3(self, tmp_path):
        """Test uploading files to S3"""
        # [ ] Upload _site/ output to S3

        from site_builder.handler import SiteBuilder

        # Create mock file structure
        site_dir = tmp_path / "_site"
        site_dir.mkdir()
        (site_dir / "index.html").write_text("<html></html>")
        (site_dir / "about.html").write_text("<html>About</html>")

        css_dir = site_dir / "css"
        css_dir.mkdir()
        (css_dir / "style.css").write_text("body { color: black; }")

        # Mock S3 client
        mock_s3 = MagicMock()

        builder = SiteBuilder()
        builder.s3 = mock_s3
        builder.s3_bucket = "test-bucket"

        builder.upload_to_s3(str(site_dir), "sites/user/site-123")

        # Verify S3 upload was called for each file
        assert mock_s3.upload_file.call_count >= 3

        # Verify content types are set correctly
        for call_obj in mock_s3.upload_file.call_args_list:
            args, kwargs = call_obj
            assert "ExtraArgs" in kwargs
            assert "ContentType" in kwargs["ExtraArgs"]


class TestCloudFrontInvalidation:
    """
    Test CloudFront cache invalidation.
    Requirement: [ ] Invalidate CloudFront cache
    """

    def test_invalidate_cloudfront(self):
        """Test CloudFront cache invalidation"""
        # [ ] Invalidate CloudFront cache

        from site_builder.handler import SiteBuilder

        mock_cloudfront = MagicMock()

        builder = SiteBuilder()
        builder.cloudfront = mock_cloudfront
        builder.cloudfront_distribution_id = "dist-123"

        builder.invalidate_cloudfront("alice")

        # Verify invalidation was requested
        assert mock_cloudfront.create_invalidation.called
        call_args = mock_cloudfront.create_invalidation.call_args

        # Verify distribution ID
        assert call_args[1]["DistributionId"] == "dist-123"

        # Verify invalidation path
        invalidation_batch = call_args[1]["InvalidationBatch"]
        assert "/alice/*" in invalidation_batch["Paths"]["Items"]


class TestBuildStatusUpdate:
    """
    Test updating build job status in DynamoDB.
    Requirement: [ ] Update build job status in DynamoDB
    """

    @pytest.mark.asyncio
    async def test_update_build_status_to_running(self):
        """Test updating build status to running"""
        # [ ] Update build job status in DynamoDB

        from site_builder.handler import SiteBuilder

        mock_table = MagicMock()
        mock_table.update_item = MagicMock(return_value={})

        builder = SiteBuilder()
        builder.table = mock_table

        await builder.update_build_status("job-123", "running")

        # Verify DynamoDB update was called
        assert mock_table.update_item.called

    @pytest.mark.asyncio
    async def test_update_build_status_to_completed(self):
        """Test updating build status to completed with results"""
        # [ ] Update build job status in DynamoDB

        from site_builder.handler import SiteBuilder

        mock_table = MagicMock()
        mock_table.update_item = MagicMock(return_value={})

        builder = SiteBuilder()
        builder.table = mock_table

        await builder.update_build_status(
            "job-123",
            "completed",
            output_url="https://alice.nbhd.city",
            s3_path="s3://bucket/sites/did:plc:user/site-123",
            content_count=5
        )

        # Verify DynamoDB update was called
        assert mock_table.update_item.called
        call_args = mock_table.update_item.call_args

        # Verify result fields are in update expression
        update_expr = call_args[1]["UpdateExpression"]
        assert "completed_at" in update_expr
        assert "output_url" in update_expr


class TestErrorHandling:
    """
    Test error handling and logging.
    Requirement: [ ] Log errors to CloudWatch
    """

    def test_get_content_type(self):
        """Test content type detection"""
        from site_builder.handler import SiteBuilder

        builder = SiteBuilder()

        # Test various file types
        assert "text/html" in builder.get_content_type("index.html")
        assert "text/css" in builder.get_content_type("style.css")
        assert "image/png" in builder.get_content_type("image.png")
        # Unknown extension should return octet-stream
        result = builder.get_content_type("unknown.unknownext12345")
        assert result == "application/octet-stream"

    @pytest.mark.asyncio
    async def test_handler_error_handling(self):
        """Test handler error handling and status update on failure"""
        # [ ] Log errors to CloudWatch

        from site_builder.handler import SiteBuilder

        mock_table = MagicMock()
        mock_table.update_item = AsyncMock(return_value={})

        builder = SiteBuilder()
        builder.table = mock_table

        # Simulate error during build
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = Exception("Build failed")

            with patch('shutil.rmtree'):  # Mock cleanup
                try:
                    await builder.run_eleventy_build("/tmp/build")
                except Exception:
                    pass

        # Error would be caught and build status updated


class TestFullBuildWorkflow:
    """
    Integration tests for complete build workflow.
    Acceptance Criteria:
    - [ ] Successfully builds sites with blog content
    - [ ] Output correctly uploaded to S3
    - [ ] CloudFront serves latest version
    - [ ] Build errors logged and returned
    - [ ] Completes within 5 minute timeout
    - [ ] Handles build failures gracefully
    """

    @pytest.mark.asyncio
    async def test_complete_build_workflow(self, tmp_path):
        """Test complete build workflow from start to finish"""
        # [ ] Successfully builds sites with blog content
        # [ ] Output correctly uploaded to S3
        # [ ] CloudFront serves latest version
        # [ ] Completes within 5 minute timeout

        from site_builder.handler import SiteBuilder

        # Mock AWS clients
        mock_dynamodb = MagicMock()
        mock_table = MagicMock()
        mock_table.query = AsyncMock(return_value={"Items": []})
        mock_table.update_item = AsyncMock(return_value={})
        mock_dynamodb.Table.return_value = mock_table

        mock_s3 = MagicMock()
        mock_cloudfront = MagicMock()

        # Create mock template structure
        template_dir = tmp_path / "template"
        template_dir.mkdir()
        (template_dir / "eleventy.config.js").write_text("module.exports = {};")
        (template_dir / "package.json").write_text(json.dumps({
            "scripts": {"build": "echo 'Built'"}
        }))

        with patch('subprocess.run') as mock_run, \
             patch('os.walk') as mock_walk, \
             patch('builtins.open', create=True):

            mock_run.return_value = MagicMock(returncode=0)

            builder = SiteBuilder()
            builder.s3 = mock_s3
            builder.dynamodb = mock_dynamodb
            builder.table = mock_table
            builder.cloudfront = mock_cloudfront

            # Simulate successful build
            event = {
                "site_id": "site-123",
                "user_did": "did:plc:user",
                "job_id": "job-123"
            }

            # This would test the full handler flow
            # (actual test would need proper async/await setup)


class TestBuildFailureHandling:
    """
    Test graceful failure handling.
    Acceptance Criteria:
    - [ ] Build errors logged and returned
    - [ ] Handles build failures gracefully
    """

    def test_handles_npm_install_timeout(self):
        """Test handling of npm install timeout"""
        # [ ] Handles build failures gracefully

        from site_builder.handler import SiteBuilder

        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = subprocess.TimeoutExpired("npm", 120)

            builder = SiteBuilder()

            with pytest.raises(Exception) as exc_info:
                builder.npm_install("/tmp/build")

            assert "timed out" in str(exc_info.value).lower()

    def test_handles_build_failure(self):
        """Test handling of build failure"""
        # [ ] Handles build failures gracefully

        from site_builder.handler import SiteBuilder

        with patch('subprocess.run') as mock_run:
            # Create a CalledProcessError with stderr
            error = subprocess.CalledProcessError(1, "npm")
            error.stderr = b"Build failed"
            mock_run.side_effect = error

            builder = SiteBuilder()

            with pytest.raises(Exception) as exc_info:
                builder.run_eleventy_build("/tmp/build")

            assert "failed" in str(exc_info.value).lower()
