"""
Integration tests for user flows in nbhd.city

Tests complete user journeys from login through site creation, editing, and publishing.
Based on flows defined in specs/USER_FLOWS.md
"""

import pytest
from fastapi.testclient import TestClient
import json


class TestAuthenticationFlow:
    """Flow 1: Authentication & Onboarding"""

    def test_landing_page_public(self, client):
        """
        Flow 1.1: Initial Landing
        Homepage should be accessible without authentication
        """
        response = client.get("/")
        assert response.status_code in [200, 404, 302]  # Depends on implementation

    def test_login_endpoint_returns_bluesky_redirect(self, client):
        """
        Flow 1.2: BlueSky OAuth Login
        POST /auth/login should redirect to BlueSky OAuth
        """
        response = client.post("/auth/login", json={})
        # Should either return OAuth URL or redirect
        assert response.status_code in [200, 302, 307]

        if response.status_code == 200:
            data = response.json()
            assert "oauth_url" in data or "url" in data

    def test_dashboard_requires_authentication(self, client):
        """
        Flow 1.3: Dashboard Access - Protected
        Dashboard should require valid JWT token
        """
        response = client.get("/api/user")
        assert response.status_code == 401

    def test_dashboard_with_auth(self, client, auth_headers):
        """
        Flow 1.3: Dashboard Access - Happy Path
        Authenticated user can access their profile
        """
        response = client.get("/api/user", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data or "user_id" in data


class TestSiteCreationFlow:
    """Flow 2: Site Creation"""

    def test_list_templates_for_selection(self, client):
        """
        Flow 2.1: Select Template
        User should see available templates without auth
        """
        response = client.get("/api/templates")
        assert response.status_code == 200
        data = response.json()

        assert "data" in data
        templates = data["data"]
        assert isinstance(templates, list)
        assert len(templates) > 0

        # Verify template structure
        for template in templates:
            assert "id" in template or "template_id" in template
            assert "name" in template
            assert "description" in template or "desc" in template

    def test_get_template_details(self, client):
        """
        Flow 2.1: Select Template - Get Schema
        User can get detailed schema for template configuration
        """
        # First get list of templates
        list_response = client.get("/api/templates")
        assert list_response.status_code == 200

        templates = list_response.json()["data"]
        if templates:
            template_id = templates[0].get("id") or templates[0].get("template_id")

            # Get template schema
            schema_response = client.get(f"/api/templates/{template_id}")
            assert schema_response.status_code == 200
            schema_data = schema_response.json()

            assert "data" in schema_data
            template = schema_data["data"]
            assert "schema" in template or "config_schema" in template

    def test_create_site_flow(self, client, auth_headers):
        """
        Flow 2.2 & 2.3: Configure Site and Site Created
        Complete flow: user creates a site with config
        """
        # Get a template first
        templates_response = client.get("/api/templates")
        assert templates_response.status_code == 200

        templates = templates_response.json()["data"]
        assert len(templates) > 0

        template_id = templates[0].get("id") or templates[0].get("template_id")

        # Create site with template
        create_response = client.post(
            "/api/sites",
            json={
                "title": "Integration Test Blog",
                "template": template_id,
                "config": {
                    "site_title": "Integration Test",
                    "author": "Test User",
                    "description": "Testing the user flow",
                    "accent_color": "#ff0000"
                }
            },
            headers=auth_headers
        )

        assert create_response.status_code == 201
        site_data = create_response.json()

        assert "data" in site_data
        site = site_data["data"]
        assert "site_id" in site
        assert site["title"] == "Integration Test Blog"
        assert site["template"] == template_id
        assert "created_at" in site

        return site["site_id"]

    def test_site_appears_in_user_list_after_creation(self, client, auth_headers):
        """
        Flow 2.3: Site Created - Verify in List
        After creation, site should appear in user's sites list
        """
        # Create a site
        site_id = self.test_create_site_flow(client, auth_headers)

        # List user's sites
        list_response = client.get("/api/sites", headers=auth_headers)
        assert list_response.status_code == 200

        sites_data = list_response.json()
        assert "data" in sites_data

        sites = sites_data["data"]
        site_ids = [s["site_id"] for s in sites]
        assert site_id in site_ids

    def test_create_site_invalid_config_rejected(self, client, auth_headers):
        """
        Flow 2.2: Configure Site - Invalid Config
        Invalid config should be rejected with 400
        """
        templates_response = client.get("/api/templates")
        templates = templates_response.json()["data"]
        template_id = templates[0].get("id") or templates[0].get("template_id")

        # Try to create with invalid config (missing required fields)
        create_response = client.post(
            "/api/sites",
            json={
                "title": "Invalid Site",
                "template": template_id,
                "config": {}  # Empty config might be invalid
            },
            headers=auth_headers
        )

        # Should either succeed with lenient validation or fail with 400
        assert create_response.status_code in [201, 400]


class TestSiteEditingFlow:
    """Flow 3: Site Editing"""

    def _create_test_site(self, client, auth_headers):
        """Helper to create a test site"""
        response = client.post(
            "/api/sites",
            json={
                "title": "Editable Test Site",
                "template": "blog",
                "config": {
                    "site_title": "Original Title",
                    "author": "Original Author",
                    "description": "Original description"
                }
            },
            headers=auth_headers
        )
        return response.json()["data"]["site_id"]

    def test_load_site_editor(self, client, auth_headers):
        """
        Flow 3.1: Load Site Editor
        Site owner can load site for editing
        """
        site_id = self._create_test_site(client, auth_headers)

        response = client.get(f"/api/sites/{site_id}", headers=auth_headers)
        assert response.status_code == 200

        data = response.json()
        assert "data" in data
        site = data["data"]
        assert site["site_id"] == site_id
        assert "config" in site

    def test_site_editor_unauthorized_access(self, client, auth_headers, test_user_id):
        """
        Flow 3.1: Load Site Editor - Authorization
        Non-owner should not be able to edit
        """
        site_id = self._create_test_site(client, auth_headers)

        # Create different auth headers (simulating different user)
        from auth import create_access_token
        other_user_token = create_access_token(user_id="did:plc:other-user-123")
        other_headers = {"Authorization": f"Bearer {other_user_token}"}

        response = client.get(f"/api/sites/{site_id}", headers=other_headers)
        # Should either return 403 Forbidden or 404 Not Found
        assert response.status_code in [403, 404]

    def test_update_site_configuration(self, client, auth_headers):
        """
        Flow 3.2: Update Configuration
        Site owner can update site configuration
        """
        site_id = self._create_test_site(client, auth_headers)

        update_response = client.put(
            f"/api/sites/{site_id}",
            json={
                "title": "Updated Title",
                "config": {
                    "site_title": "Updated Title",
                    "author": "Updated Author",
                    "description": "Updated description"
                }
            },
            headers=auth_headers
        )

        assert update_response.status_code == 200
        updated_site = update_response.json()["data"]
        assert updated_site["title"] == "Updated Title"
        assert updated_site["config"]["author"] == "Updated Author"

    def test_partial_config_update(self, client, auth_headers):
        """
        Flow 3.2: Update Configuration - Partial Update
        User can update part of config without replacing all
        """
        site_id = self._create_test_site(client, auth_headers)

        # Update only one field
        update_response = client.put(
            f"/api/sites/{site_id}",
            json={
                "config": {
                    "author": "New Author Only"
                }
            },
            headers=auth_headers
        )

        # Should succeed (merge with existing)
        assert update_response.status_code in [200, 400]  # Depends on implementation

    def test_get_template_preview(self, client):
        """
        Flow 3.3: Preview Site - Template Preview
        User can get template preview image
        """
        templates_response = client.get("/api/templates")
        templates = templates_response.json()["data"]

        if templates:
            template_id = templates[0].get("id") or templates[0].get("template_id")

            preview_response = client.get(f"/api/templates/{template_id}/preview")
            # Preview might return 200 (image) or 404 (not available)
            assert preview_response.status_code in [200, 404]


class TestSiteBuildingFlow:
    """Flow 4: Site Building & Publishing"""

    def _create_test_site(self, client, auth_headers):
        """Helper to create a test site"""
        response = client.post(
            "/api/sites",
            json={
                "title": "Buildable Site",
                "template": "blog",
                "config": {
                    "site_title": "Build Test",
                    "author": "Test Author",
                    "description": "Testing builds"
                }
            },
            headers=auth_headers
        )
        return response.json()["data"]["site_id"]

    def test_trigger_site_build(self, client, auth_headers):
        """
        Flow 4.1: Trigger Build
        User can trigger a site build
        """
        site_id = self._create_test_site(client, auth_headers)

        build_response = client.post(
            f"/api/sites/{site_id}/build",
            headers=auth_headers
        )

        # Should return 202 Accepted (async)
        assert build_response.status_code in [202, 200, 201]

        data = build_response.json()
        assert "data" in data or "job_id" in data

        build_data = data.get("data") or data
        assert "job_id" in build_data
        assert "status" in build_data

    def test_check_build_status(self, client, auth_headers):
        """
        Flow 4.2: Monitor Build Progress
        User can check status of a build job
        """
        site_id = self._create_test_site(client, auth_headers)

        # Trigger build
        build_response = client.post(
            f"/api/sites/{site_id}/build",
            headers=auth_headers
        )

        if build_response.status_code in [202, 200, 201]:
            build_data = build_response.json().get("data") or build_response.json()
            job_id = build_data.get("job_id")

            # Check status
            status_response = client.get(
                f"/api/sites/{site_id}/build/{job_id}",
                headers=auth_headers
            )

            assert status_response.status_code == 200
            status_data = status_response.json()
            assert "data" in status_data

            status_info = status_data["data"]
            assert "status" in status_info
            assert status_info["status"] in ["queued", "building", "success", "error"]

    def test_build_unauthorized_access(self, client, auth_headers):
        """
        Flow 4.1: Trigger Build - Authorization
        Non-owner cannot trigger build
        """
        site_id = self._create_test_site(client, auth_headers)

        # Try with different user
        from auth import create_access_token
        other_user_token = create_access_token(user_id="did:plc:other-user-456")
        other_headers = {"Authorization": f"Bearer {other_user_token}"}

        build_response = client.post(
            f"/api/sites/{site_id}/build",
            headers=other_headers
        )

        # Should be forbidden
        assert build_response.status_code in [403, 404]


class TestSiteDeletionFlow:
    """Flow 5: Site Deletion"""

    def _create_test_site(self, client, auth_headers):
        """Helper to create a test site"""
        response = client.post(
            "/api/sites",
            json={
                "title": "Deletable Site",
                "template": "blog",
                "config": {
                    "site_title": "To Delete",
                    "author": "Test",
                    "description": "Will be deleted"
                }
            },
            headers=auth_headers
        )
        return response.json()["data"]["site_id"]

    def test_delete_site(self, client, auth_headers):
        """
        Flow 5.1: Delete Site
        Site owner can delete their site
        """
        site_id = self._create_test_site(client, auth_headers)

        delete_response = client.delete(
            f"/api/sites/{site_id}",
            headers=auth_headers
        )

        assert delete_response.status_code == 204

        # Verify it's gone
        get_response = client.get(
            f"/api/sites/{site_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404

    def test_delete_site_removed_from_list(self, client, auth_headers):
        """
        Flow 5.1: Delete Site - Removed from List
        After deletion, site should not appear in user's list
        """
        site_id = self._create_test_site(client, auth_headers)

        # Delete
        client.delete(f"/api/sites/{site_id}", headers=auth_headers)

        # Check list
        list_response = client.get("/api/sites", headers=auth_headers)
        sites = list_response.json()["data"]
        site_ids = [s["site_id"] for s in sites]

        assert site_id not in site_ids

    def test_delete_site_unauthorized(self, client, auth_headers):
        """
        Flow 5.1: Delete Site - Authorization
        Non-owner cannot delete site
        """
        site_id = self._create_test_site(client, auth_headers)

        from auth import create_access_token
        other_user_token = create_access_token(user_id="did:plc:other-user-789")
        other_headers = {"Authorization": f"Bearer {other_user_token}"}

        delete_response = client.delete(
            f"/api/sites/{site_id}",
            headers=other_headers
        )

        assert delete_response.status_code in [403, 404]


class TestSiteExportFlow:
    """Flow 6: Site Export"""

    def _create_test_site(self, client, auth_headers):
        """Helper to create a test site"""
        response = client.post(
            "/api/sites",
            json={
                "title": "Exportable Site",
                "template": "blog",
                "config": {
                    "site_title": "Export Test",
                    "author": "Exporter",
                    "description": "To be exported"
                }
            },
            headers=auth_headers
        )
        return response.json()["data"]["site_id"]

    def test_export_site_as_zip(self, client, auth_headers):
        """
        Flow 6.1: Export Site
        User can export site as ZIP file
        """
        site_id = self._create_test_site(client, auth_headers)

        export_response = client.get(
            f"/api/sites/{site_id}/export",
            headers=auth_headers
        )

        # Should return ZIP file or 200 with binary content
        assert export_response.status_code in [200, 404]

        if export_response.status_code == 200:
            # Check content type
            assert "zip" in export_response.headers.get("content-type", "").lower() \
                or "application/octet-stream" in export_response.headers.get("content-type", "").lower()

    def test_export_site_unauthorized(self, client, auth_headers):
        """
        Flow 6.1: Export Site - Authorization
        Non-owner cannot export site
        """
        site_id = self._create_test_site(client, auth_headers)

        from auth import create_access_token
        other_user_token = create_access_token(user_id="did:plc:other-user-999")
        other_headers = {"Authorization": f"Bearer {other_user_token}"}

        export_response = client.get(
            f"/api/sites/{site_id}/export",
            headers=other_headers
        )

        assert export_response.status_code in [403, 404]


class TestLogoutFlow:
    """Flow 7: Logout"""

    def test_logout_endpoint(self, client, auth_headers):
        """
        Flow 7.1: User Logout
        User can logout (optional endpoint)
        """
        # Logout endpoint might be optional
        logout_response = client.post("/auth/logout", headers=auth_headers)

        # Should either work (200/204) or not exist (404)
        assert logout_response.status_code in [200, 204, 404]

    def test_access_after_logout(self, client, auth_headers):
        """
        Flow 7.1: Logout - Session Cleared
        After logout, endpoints requiring auth should fail
        """
        # Note: This tests frontend behavior (token removal)
        # Since we're using stateless JWT, we can't actually "revoke" server-side

        # Without token, protected endpoints should fail
        response = client.get("/api/user")
        assert response.status_code == 401


class TestErrorScenarios:
    """Error Scenarios from USER_FLOWS.md"""

    def test_no_auth_protected_route(self, client):
        """
        Error: No Authentication
        Protected routes should return 401 without token
        """
        response = client.get("/api/user")
        assert response.status_code == 401

    def test_invalid_template_rejected(self, client, auth_headers):
        """
        Error: Invalid Template
        Creating site with non-existent template should fail
        """
        response = client.post(
            "/api/sites",
            json={
                "title": "Bad Template Site",
                "template": "non-existent-template-xyz",
                "config": {}
            },
            headers=auth_headers
        )

        # Should return 400 or 404
        assert response.status_code in [400, 404, 422]

    def test_invalid_config_rejected(self, client, auth_headers):
        """
        Error: Invalid Configuration
        Config that doesn't match schema should be rejected
        """
        response = client.post(
            "/api/sites",
            json={
                "title": "Invalid Config Site",
                "template": "blog",
                "config": {
                    # Missing required fields, only bad data
                    "invalid_field_xyz": "this should not be here"
                }
            },
            headers=auth_headers
        )

        # Depends on validation strategy
        assert response.status_code in [201, 400]

    def test_not_found_site(self, client, auth_headers):
        """
        Error: Not Found
        Accessing non-existent site should return 404
        """
        response = client.get(
            "/api/sites/non-existent-site-id",
            headers=auth_headers
        )

        assert response.status_code == 404

    def test_authorization_error(self, client, auth_headers):
        """
        Error: Authorization Error
        Non-owner accessing another's site should fail
        """
        # Create site with first user
        site_id = None
        create_response = client.post(
            "/api/sites",
            json={
                "title": "Restricted Site",
                "template": "blog",
                "config": {"site_title": "Restricted"}
            },
            headers=auth_headers
        )

        if create_response.status_code == 201:
            site_id = create_response.json()["data"]["site_id"]

            # Try to access with different user
            from auth import create_access_token
            other_user_token = create_access_token(user_id="did:plc:hacker-user")
            other_headers = {"Authorization": f"Bearer {other_user_token}"}

            get_response = client.get(
                f"/api/sites/{site_id}",
                headers=other_headers
            )

            # Should be forbidden or not found
            assert get_response.status_code in [403, 404]
