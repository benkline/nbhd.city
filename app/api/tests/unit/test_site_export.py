"""
Unit tests for site export functionality (SSG-018).

Tests for:
- README generation
- ZIP creation
- Error handling
"""

import pytest
import json
import zipfile
import io
from datetime import datetime

# Mock imports to avoid dependencies
import sys
from unittest.mock import MagicMock, AsyncMock, patch


def test_generate_deployment_readme():
    """Test README generation with site metadata."""
    from sites import generate_deployment_readme

    site = {
        "name": "My Awesome Blog",
        "template_id": "blog",
        "id": "site-123"
    }

    readme = generate_deployment_readme(site)

    # Check content
    assert "My Awesome Blog" in readme
    assert "Netlify" in readme
    assert "Vercel" in readme
    assert "GitHub Pages" in readme
    assert "AWS S3" in readme
    assert "11ty" in readme
    assert "template: blog" in readme

    # Check structure
    assert "# Quick Start" in readme
    assert "## Deployment Options" in readme
    assert "## Your Content" in readme


def test_create_site_zip_structure():
    """Test ZIP archive structure and contents."""
    from sites import create_site_zip

    # Mock data
    site_files = [
        ("index.html", b"<html>Home</html>"),
        ("css/style.css", b"body { color: blue; }"),
        ("js/app.js", b"console.log('Hello');"),
    ]

    content_records = {
        "posts": [
            {
                "id": "post-1",
                "title": "First Post",
                "content": "# Hello World"
            }
        ],
        "pages": [
            {
                "id": "page-1",
                "title": "About",
                "content": "# About Me"
            }
        ]
    }

    site_config = {
        "id": "site-123",
        "name": "My Site",
        "template_id": "blog"
    }

    readme_content = "# My Site\n\nDeployment instructions..."

    # Create ZIP
    buffer = create_site_zip(site_files, content_records, site_config, readme_content)

    # Verify it's a valid ZIP
    assert buffer.getvalue()[:2] == b"PK"  # ZIP signature

    # Read and verify contents
    with zipfile.ZipFile(buffer, "r") as zf:
        filenames = zf.namelist()

        # Check required files
        assert "README.md" in filenames
        assert "site/index.html" in filenames
        assert "site/css/style.css" in filenames
        assert "site/js/app.js" in filenames
        assert "content/posts.json" in filenames
        assert "content/pages.json" in filenames
        assert "config/site.json" in filenames

        # Verify content
        assert zf.read("README.md") == readme_content.encode()
        assert zf.read("site/index.html") == b"<html>Home</html>"

        # Verify JSON files
        posts = json.loads(zf.read("content/posts.json"))
        assert len(posts) == 1
        assert posts[0]["title"] == "First Post"

        pages = json.loads(zf.read("content/pages.json"))
        assert len(pages) == 1
        assert pages[0]["title"] == "About"

        config = json.loads(zf.read("config/site.json"))
        assert config["name"] == "My Site"


def test_create_site_zip_empty_content():
    """Test ZIP creation with empty content records."""
    from sites import create_site_zip

    site_files = [("index.html", b"<html></html>")]
    content_records = {"posts": [], "pages": []}
    site_config = {"id": "site-123", "name": "Empty Site"}
    readme_content = "# Empty Site"

    buffer = create_site_zip(site_files, content_records, site_config, readme_content)

    with zipfile.ZipFile(buffer, "r") as zf:
        posts = json.loads(zf.read("content/posts.json"))
        pages = json.loads(zf.read("content/pages.json"))

        assert posts == []
        assert pages == []


def test_create_site_zip_compression():
    """Test that ZIP uses deflate compression."""
    from sites import create_site_zip

    # Create large file to see compression benefit
    large_content = b"x" * 10000
    site_files = [("large.txt", large_content)]

    buffer = create_site_zip(site_files, {"posts": [], "pages": []}, {}, "")

    with zipfile.ZipFile(buffer, "r") as zf:
        for info in zf.filelist:
            if info.filename == "site/large.txt":
                # Verify compression was applied
                assert info.compress_type == zipfile.ZIP_DEFLATED
                assert info.compress_size < info.file_size


@pytest.mark.asyncio
async def test_download_site_files_from_s3_empty():
    """Test handling of site with no files."""
    from sites import download_site_files_from_s3

    with patch("aioboto3.Session") as mock_session:
        mock_s3_client = AsyncMock()
        mock_paginator = AsyncMock()

        # Mock empty paginator
        async def async_paginate(*args, **kwargs):
            yield {}  # No Contents

        mock_paginator.paginate = lambda **kwargs: async_paginate()
        mock_s3_client.get_paginator.return_value = mock_paginator

        mock_session_instance = MagicMock()
        mock_session_instance.__aenter__ = AsyncMock(return_value=mock_s3_client)
        mock_session_instance.__aexit__ = AsyncMock(return_value=None)
        mock_session.return_value = mock_session_instance

        files = await download_site_files_from_s3("did:plc:user123", "site-456")

        assert files == []


@pytest.mark.asyncio
async def test_fetch_site_content_records_empty():
    """Test fetching content for site with no records."""
    from sites import fetch_site_content_records

    with patch("dynamodb_client.get_table") as mock_get_table:
        mock_table = AsyncMock()
        mock_table.query.return_value = {"Items": []}

        async def async_table():
            return mock_table

        mock_get_table.return_value = mock_table
        mock_table.__aenter__ = AsyncMock(return_value=mock_table)
        mock_table.__aexit__ = AsyncMock(return_value=None)

        result = await fetch_site_content_records("did:plc:user123", "site-456")

        assert result == {"posts": [], "pages": []}
