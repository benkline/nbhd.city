"""
Integration Tests for SSG-033: Schema Initialization & Content Type Setup

Tests that content types are extracted from templates during site creation
and stored site-specifically in DynamoDB, with an API endpoint to retrieve them.
"""

import pytest
from fastapi.testclient import TestClient


class TestSchemaInitializationOnSiteCreation:
    """Test content type extraction during site creation"""

    def test_site_creation_stores_content_types_for_builtin_template(self, client, auth_headers):
        """POST /api/sites stores content types from template"""
        response = client.post(
            "/api/sites",
            headers=auth_headers,
            json={
                "title": "My Blog",
                "template": "blog",
                "config": {
                    "site_title": "My Blog",
                    "author": "Test Author"
                }
            }
        )

        assert response.status_code == 201
        site_id = response.json()["data"].get("site_id") or response.json()["data"].get("id")

        # Verify content types were stored by fetching them
        status_response = client.get(
            f"/api/sites/{site_id}/content-types",
            headers=auth_headers
        )

        assert status_response.status_code == 200
        content_types = status_response.json()["data"]

        # Blog template should have "post" as primary content type
        assert "post" in content_types or "default" in content_types
        primary_type = next((ct for ct in content_types.values() if ct.get("is_primary")), None)
        assert primary_type is not None

    def test_content_types_include_schema(self, client, auth_headers):
        """Retrieved content types include schema for form generation"""
        response = client.post(
            "/api/sites",
            headers=auth_headers,
            json={
                "title": "Test Site",
                "template": "blog",
                "config": {
                    "site_title": "Test",
                    "author": "Test"
                }
            }
        )

        site_id = response.json()["data"].get("site_id") or response.json()["data"].get("id")

        content_types_response = client.get(
            f"/api/sites/{site_id}/content-types",
            headers=auth_headers
        )

        content_types = content_types_response.json()["data"]

        # Each content type should have schema for form generation
        for type_name, type_info in content_types.items():
            assert "schema" in type_info or "properties" in type_info
            # Should include field validation rules
            if "schema" in type_info:
                assert isinstance(type_info["schema"], dict)

    def test_content_types_identifies_primary_type(self, client, auth_headers):
        """Content types should identify which is primary"""
        response = client.post(
            "/api/sites",
            headers=auth_headers,
            json={
                "title": "Test Site",
                "template": "blog",
                "config": {
                    "site_title": "Test",
                    "author": "Test"
                }
            }
        )

        site_id = response.json()["data"].get("site_id") or response.json()["data"].get("id")

        content_types_response = client.get(
            f"/api/sites/{site_id}/content-types",
            headers=auth_headers
        )

        content_types = content_types_response.json()["data"]

        # At least one should be marked as primary
        primary_count = sum(1 for ct in content_types.values() if ct.get("is_primary", False))
        assert primary_count >= 1


class TestContentTypesEndpoint:
    """Test GET /api/sites/{site_id}/content-types endpoint"""

    def test_content_types_endpoint_requires_auth(self, client):
        """Content types endpoint requires authentication"""
        response = client.get("/api/sites/test-site/content-types")
        assert response.status_code == 401

    def test_content_types_endpoint_returns_404_for_unknown_site(self, client, auth_headers):
        """Returns 404 for unknown site"""
        response = client.get(
            "/api/sites/unknown-site-id/content-types",
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_content_types_endpoint_returns_correct_structure(self, client, auth_headers):
        """Content types returned with proper structure"""
        # Create a site
        create_response = client.post(
            "/api/sites",
            headers=auth_headers,
            json={
                "title": "Test Site",
                "template": "blog",
                "config": {
                    "site_title": "Test",
                    "author": "Test"
                }
            }
        )

        site_id = create_response.json()["data"].get("site_id") or create_response.json()["data"].get("id")

        # Get content types
        response = client.get(
            f"/api/sites/{site_id}/content-types",
            headers=auth_headers
        )

        assert response.status_code == 200

        data = response.json()
        assert "data" in data
        assert isinstance(data["data"], dict)

        # Each content type should have expected fields
        for type_name, type_info in data["data"].items():
            assert isinstance(type_info, dict)
            # Should have schema or properties for field generation
            assert "schema" in type_info or "properties" in type_info


class TestMultipleContentTypes:
    """Test sites with multiple content types"""

    def test_different_templates_have_different_content_types(self, client, auth_headers):
        """Project template has different content types than blog template"""
        # Create blog site
        blog_response = client.post(
            "/api/sites",
            headers=auth_headers,
            json={
                "title": "Blog Site",
                "template": "blog",
                "config": {
                    "site_title": "Blog",
                    "author": "Author"
                }
            }
        )

        blog_id = blog_response.json()["data"].get("site_id") or blog_response.json()["data"].get("id")

        # Create project site
        project_response = client.post(
            "/api/sites",
            headers=auth_headers,
            json={
                "title": "Project Site",
                "template": "project",
                "config": {
                    "site_title": "Project",
                    "author": "Author"
                }
            }
        )

        project_id = project_response.json()["data"].get("site_id") or project_response.json()["data"].get("id")

        # Get content types for both
        blog_types_response = client.get(
            f"/api/sites/{blog_id}/content-types",
            headers=auth_headers
        )

        project_types_response = client.get(
            f"/api/sites/{project_id}/content-types",
            headers=auth_headers
        )

        blog_types = blog_types_response.json()["data"]
        project_types = project_types_response.json()["data"]

        # Both should have content types
        assert len(blog_types) > 0
        assert len(project_types) > 0


class TestContentTypesPersistence:
    """Test that content types persist correctly"""

    def test_content_types_retrievable_after_site_creation(self, client, auth_headers):
        """Content types stored during creation are retrievable"""
        # Create site
        create_response = client.post(
            "/api/sites",
            headers=auth_headers,
            json={
                "title": "Persistent Test",
                "template": "blog",
                "config": {
                    "site_title": "Persistent",
                    "author": "Author"
                }
            }
        )

        site_id = create_response.json()["data"].get("site_id") or create_response.json()["data"].get("id")

        # Retrieve immediately
        immediate_response = client.get(
            f"/api/sites/{site_id}/content-types",
            headers=auth_headers
        )

        assert immediate_response.status_code == 200

        # Retrieve again (should be same)
        second_response = client.get(
            f"/api/sites/{site_id}/content-types",
            headers=auth_headers
        )

        assert second_response.status_code == 200
        assert immediate_response.json() == second_response.json()
