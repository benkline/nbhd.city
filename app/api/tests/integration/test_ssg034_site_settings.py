"""
Integration Tests for SSG-034: Site Settings & Configuration

Tests for updating site settings: title, tagline, visibility, and configuration.
"""

import pytest
from fastapi.testclient import TestClient


class TestUpdateSiteSettings:
    """Test updating site settings"""

    def test_update_site_title(self, client, auth_headers):
        """Update site title and verify it's saved"""
        # Create a site
        create_response = client.post(
            "/api/sites",
            headers=auth_headers,
            json={
                "title": "Original Title",
                "template": "blog",
                "config": {
                    "site_title": "Blog",
                    "author": "Author"
                }
            }
        )
        assert create_response.status_code == 201
        site_id = create_response.json()["data"]["site_id"]

        # Update title
        update_response = client.put(
            f"/api/sites/{site_id}",
            headers=auth_headers,
            json={"title": "Updated Title"}
        )
        assert update_response.status_code == 200
        updated_site = update_response.json()["data"]
        assert updated_site["title"] == "Updated Title"

    def test_update_site_tagline(self, client, auth_headers):
        """Update site tagline and verify it's saved"""
        # Create a site
        create_response = client.post(
            "/api/sites",
            headers=auth_headers,
            json={
                "title": "My Site",
                "template": "blog",
                "config": {
                    "site_title": "Blog",
                    "author": "Author"
                }
            }
        )
        assert create_response.status_code == 201
        site_id = create_response.json()["data"]["site_id"]

        # Update tagline
        update_response = client.put(
            f"/api/sites/{site_id}",
            headers=auth_headers,
            json={"tagline": "My awesome blog"}
        )
        assert update_response.status_code == 200
        updated_site = update_response.json()["data"]
        assert updated_site.get("tagline") == "My awesome blog"

    def test_update_site_visibility_public(self, client, auth_headers):
        """Set site visibility to public"""
        # Create a site
        create_response = client.post(
            "/api/sites",
            headers=auth_headers,
            json={
                "title": "My Site",
                "template": "blog",
                "config": {
                    "site_title": "Blog",
                    "author": "Author"
                }
            }
        )
        assert create_response.status_code == 201
        site_id = create_response.json()["data"]["site_id"]

        # Set visibility to public
        update_response = client.put(
            f"/api/sites/{site_id}",
            headers=auth_headers,
            json={"visibility": "public"}
        )
        assert update_response.status_code == 200
        updated_site = update_response.json()["data"]
        assert updated_site.get("visibility") == "public"

    def test_update_site_visibility_private(self, client, auth_headers):
        """Set site visibility to private"""
        # Create a site
        create_response = client.post(
            "/api/sites",
            headers=auth_headers,
            json={
                "title": "My Site",
                "template": "blog",
                "config": {
                    "site_title": "Blog",
                    "author": "Author"
                }
            }
        )
        assert create_response.status_code == 201
        site_id = create_response.json()["data"]["site_id"]

        # Set visibility to private
        update_response = client.put(
            f"/api/sites/{site_id}",
            headers=auth_headers,
            json={"visibility": "private"}
        )
        assert update_response.status_code == 200
        updated_site = update_response.json()["data"]
        assert updated_site.get("visibility") == "private"

    def test_update_site_multiple_fields(self, client, auth_headers):
        """Update multiple fields at once"""
        # Create a site
        create_response = client.post(
            "/api/sites",
            headers=auth_headers,
            json={
                "title": "Original",
                "template": "blog",
                "config": {
                    "site_title": "Blog",
                    "author": "Author"
                }
            }
        )
        assert create_response.status_code == 201
        site_id = create_response.json()["data"]["site_id"]

        # Update multiple fields
        update_response = client.put(
            f"/api/sites/{site_id}",
            headers=auth_headers,
            json={
                "title": "New Title",
                "tagline": "A new tagline",
                "visibility": "public"
            }
        )
        assert update_response.status_code == 200
        updated_site = update_response.json()["data"]
        assert updated_site["title"] == "New Title"
        assert updated_site.get("tagline") == "A new tagline"
        assert updated_site.get("visibility") == "public"


class TestUpdateSiteSettingsValidation:
    """Test validation of site settings updates"""

    def test_update_site_empty_title_rejected(self, client, auth_headers):
        """Empty title string is rejected"""
        # Create a site
        create_response = client.post(
            "/api/sites",
            headers=auth_headers,
            json={
                "title": "My Site",
                "template": "blog",
                "config": {
                    "site_title": "Blog",
                    "author": "Author"
                }
            }
        )
        assert create_response.status_code == 201
        site_id = create_response.json()["data"]["site_id"]

        # Try to update with empty title
        update_response = client.put(
            f"/api/sites/{site_id}",
            headers=auth_headers,
            json={"title": ""}
        )
        assert update_response.status_code == 400
        assert "empty" in update_response.json()["detail"].lower()

    def test_update_site_invalid_visibility(self, client, auth_headers):
        """Invalid visibility value is rejected"""
        # Create a site
        create_response = client.post(
            "/api/sites",
            headers=auth_headers,
            json={
                "title": "My Site",
                "template": "blog",
                "config": {
                    "site_title": "Blog",
                    "author": "Author"
                }
            }
        )
        assert create_response.status_code == 201
        site_id = create_response.json()["data"]["site_id"]

        # Try to update with invalid visibility
        update_response = client.put(
            f"/api/sites/{site_id}",
            headers=auth_headers,
            json={"visibility": "hidden"}
        )
        assert update_response.status_code == 400
        assert "public" in update_response.json()["detail"].lower() or "private" in update_response.json()["detail"].lower()

    def test_update_site_requires_auth(self, client):
        """Update endpoint requires authentication"""
        response = client.put(
            "/api/sites/test-site-id",
            json={"title": "New Title"}
        )
        assert response.status_code == 401

    def test_update_nonexistent_site(self, client, auth_headers):
        """Updating nonexistent site returns 404"""
        response = client.put(
            "/api/sites/nonexistent-site-id",
            headers=auth_headers,
            json={"title": "New Title"}
        )
        assert response.status_code == 404

    def test_update_site_wrong_owner(self, client, auth_headers):
        """Only site owner can update"""
        from auth import create_access_token

        # Create a site
        create_response = client.post(
            "/api/sites",
            headers=auth_headers,
            json={
                "title": "My Site",
                "template": "blog",
                "config": {
                    "site_title": "Blog",
                    "author": "Author"
                }
            }
        )
        assert create_response.status_code == 201
        site_id = create_response.json()["data"]["site_id"]

        # Try to update with different user
        other_token = create_access_token(user_id="did:plc:other")
        other_headers = {"Authorization": f"Bearer {other_token}"}

        update_response = client.put(
            f"/api/sites/{site_id}",
            headers=other_headers,
            json={"title": "Hacked Title"}
        )
        assert update_response.status_code == 403
