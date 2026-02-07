"""
Integration tests for site export endpoint (SSG-018).

Tests for:
- Full export flow
- Authorization checks
- Error handling
- ZIP downloadability
"""

import pytest
import json
import zipfile
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock


@pytest.fixture
def client():
    """Create test client."""
    from main import app

    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Create authorization headers."""
    from auth import create_access_token

    token = create_access_token("did:plc:testuser")
    return {"Authorization": f"Bearer {token}"}


def test_export_site_not_found(client, auth_headers):
    """Test exporting non-existent site returns 404."""
    response = client.get("/api/sites/nonexistent/export", headers=auth_headers)

    assert response.status_code == 404
    assert "Site not found" in response.text


def test_export_site_not_owned(client, auth_headers):
    """Test exporting another user's site returns 403."""
    from sites import SITES_STORE

    # Create site for different user
    SITES_STORE["other-site"] = {
        "id": "other-site",
        "user_id": "did:plc:otheruser",
        "name": "Other User's Site",
        "template_id": "blog"
    }

    response = client.get("/api/sites/other-site/export", headers=auth_headers)

    assert response.status_code == 403
    assert "Not authorized" in response.text


def test_export_site_not_built(client, auth_headers):
    """Test exporting unbuilt site returns 400."""
    from sites import SITES_STORE

    # Create site
    SITES_STORE["test-site"] = {
        "id": "test-site",
        "user_id": "did:plc:testuser",
        "name": "Test Site",
        "template_id": "blog"
    }

    with patch("sites.download_site_files_from_s3") as mock_download:
        mock_download.return_value = []  # No files

        response = client.get("/api/sites/test-site/export", headers=auth_headers)

        assert response.status_code == 400
        assert "must be built" in response.text


@pytest.mark.asyncio
async def test_export_site_success(client, auth_headers):
    """Test successful site export."""
    from sites import SITES_STORE

    # Create site
    SITES_STORE["test-site"] = {
        "id": "test-site",
        "user_id": "did:plc:testuser",
        "name": "Test Site",
        "template_id": "blog"
    }

    # Mock S3 download
    mock_files = [
        ("index.html", b"<html>Home</html>"),
        ("css/style.css", b"body { color: blue; }"),
    ]

    # Mock content records
    mock_content = {
        "posts": [{"id": "post-1", "title": "First Post"}],
        "pages": [{"id": "page-1", "title": "About"}],
    }

    with patch("sites.download_site_files_from_s3") as mock_download, \
         patch("sites.fetch_site_content_records") as mock_fetch:

        mock_download.return_value = mock_files
        mock_fetch.return_value = mock_content

        response = client.get("/api/sites/test-site/export", headers=auth_headers)

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/zip"
        assert "test-site-export.zip" in response.headers["content-disposition"]


def test_export_site_zip_content(client, auth_headers):
    """Test exported ZIP contains expected files."""
    from sites import SITES_STORE

    SITES_STORE["test-site"] = {
        "id": "test-site",
        "user_id": "did:plc:testuser",
        "name": "Test Site",
        "template_id": "blog"
    }

    mock_files = [
        ("index.html", b"<html>Home</html>"),
        ("css/style.css", b"body { color: blue; }"),
    ]

    mock_content = {
        "posts": [{"id": "post-1", "title": "First Post"}],
        "pages": [],
    }

    with patch("sites.download_site_files_from_s3", return_value=mock_files), \
         patch("sites.fetch_site_content_records", return_value=mock_content):

        response = client.get("/api/sites/test-site/export", headers=auth_headers)

        # Verify ZIP is valid
        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, "r") as zf:
            filenames = zf.namelist()

            # Check required files exist
            assert "README.md" in filenames
            assert "site/index.html" in filenames
            assert "site/css/style.css" in filenames
            assert "content/posts.json" in filenames
            assert "content/pages.json" in filenames
            assert "config/site.json" in filenames

            # Verify README is readable
            readme = zf.read("README.md").decode()
            assert "Test Site" in readme
            assert "Netlify" in readme

            # Verify content
            posts = json.loads(zf.read("content/posts.json"))
            assert posts[0]["title"] == "First Post"


def test_export_site_filename_format(client, auth_headers):
    """Test export filename includes site ID."""
    from sites import SITES_STORE

    SITES_STORE["my-awesome-site"] = {
        "id": "my-awesome-site",
        "user_id": "did:plc:testuser",
        "name": "My Awesome Site",
        "template_id": "blog"
    }

    with patch("sites.download_site_files_from_s3", return_value=[("index.html", b"<html></html>")]), \
         patch("sites.fetch_site_content_records", return_value={"posts": [], "pages": []}):

        response = client.get("/api/sites/my-awesome-site/export", headers=auth_headers)

        disposition = response.headers["content-disposition"]
        assert "my-awesome-site-export.zip" in disposition


def test_export_site_requires_auth(client):
    """Test export requires authentication."""
    response = client.get("/api/sites/test-site/export")

    assert response.status_code == 401


def test_export_site_preserves_file_structure(client, auth_headers):
    """Test ZIP preserves directory structure."""
    from sites import SITES_STORE

    SITES_STORE["test-site"] = {
        "id": "test-site",
        "user_id": "did:plc:testuser",
        "name": "Test Site",
        "template_id": "blog"
    }

    mock_files = [
        ("index.html", b"home"),
        ("about/index.html", b"about"),
        ("blog/posts/first-post/index.html", b"post"),
        ("assets/css/style.css", b"css"),
        ("assets/js/app.js", b"js"),
    ]

    with patch("sites.download_site_files_from_s3", return_value=mock_files), \
         patch("sites.fetch_site_content_records", return_value={"posts": [], "pages": []}):

        response = client.get("/api/sites/test-site/export", headers=auth_headers)

        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, "r") as zf:
            filenames = zf.namelist()

            # Check structure is preserved
            assert "site/index.html" in filenames
            assert "site/about/index.html" in filenames
            assert "site/blog/posts/first-post/index.html" in filenames
            assert "site/assets/css/style.css" in filenames
            assert "site/assets/js/app.js" in filenames


# Import at end to avoid circular imports
import io
