"""
Integration tests for SSG-020: Template Analysis API Endpoint

Tests for:
- POST /api/templates/analyze-url - Trigger template analysis
- GET /api/templates/{template_id}/analysis-status - Check analysis status
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
import uuid
from datetime import datetime
import json


class TestAnalyzeUrlEndpoint:
    """
    Test POST /api/templates/analyze-url endpoint
    Requirement: Trigger async template analysis from GitHub URL
    """

    def test_analyze_url_valid_github_url(self, client, auth_headers):
        """
        [ ] Valid GitHub URLs accepted
        Acceptance Criterion: Valid GitHub URLs accepted
        """
        payload = {
            "github_url": "https://github.com/user/11ty-blog"
        }

        response = client.post("/api/templates/analyze-url", json=payload, headers=auth_headers)

        # Should return 202 Accepted for async operation
        assert response.status_code == 202, f"Expected 202, got {response.status_code}: {response.text}"
        data = response.json()

        # Verify response structure
        assert "data" in data
        assert "meta" in data

        response_data = data["data"]

        # Requirement: Returns template_id
        assert "template_id" in response_data
        assert response_data["template_id"] is not None
        assert len(response_data["template_id"]) > 0

        # Requirement: status should be "analyzing"
        assert response_data["status"] == "analyzing"

        # Requirement: Should have poll URL
        assert "poll_url" in response_data
        assert response_data["poll_url"] == f"/api/templates/{response_data['template_id']}/analysis-status"

        # Requirement: Should have message
        assert "message" in response_data
        assert response_data["message"] == "Template analysis started"

    def test_analyze_url_missing_github_url(self, client, auth_headers):
        """
        [ ] Rejects requests without github_url
        Acceptance Criterion: Returns 422 for missing github_url
        """
        payload = {}

        response = client.post("/api/templates/analyze-url", json=payload, headers=auth_headers)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_analyze_url_invalid_github_url(self, client, auth_headers):
        """
        [ ] Rejects invalid GitHub URLs
        Acceptance Criterion: Returns 422 for invalid URLs
        """
        invalid_urls = [
            "not-a-url",
            "https://gitlab.com/user/repo",  # Not GitHub
            "https://github.com/",  # Missing path
            "https://github.com/user/",  # Missing repo name
            "http://github.com/user/repo",  # HTTP not HTTPS
        ]

        for invalid_url in invalid_urls:
            payload = {"github_url": invalid_url}
            response = client.post("/api/templates/analyze-url", json=payload, headers=auth_headers)

            assert response.status_code == 422, f"Should reject {invalid_url}"
            data = response.json()
            assert "detail" in data

    def test_analyze_url_empty_string(self, client, auth_headers):
        """
        [ ] Rejects empty github_url
        Acceptance Criterion: Returns 422 for empty string
        """
        payload = {"github_url": ""}

        response = client.post("/api/templates/analyze-url", json=payload, headers=auth_headers)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_analyze_url_whitespace_only(self, client, auth_headers):
        """
        [ ] Rejects whitespace-only github_url
        Acceptance Criterion: Returns 422 for whitespace
        """
        payload = {"github_url": "   "}

        response = client.post("/api/templates/analyze-url", json=payload, headers=auth_headers)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_analyze_url_requires_authentication(self, client):
        """
        [ ] Authentication: Only allow authenticated users
        Acceptance Criterion: Returns 401 for unauthenticated requests
        """
        payload = {
            "github_url": "https://github.com/user/11ty-blog"
        }

        response = client.post("/api/templates/analyze-url", json=payload)

        assert response.status_code == 401

    def test_analyze_url_multiple_concurrent_requests(self, client, auth_headers):
        """
        [ ] Handles concurrent analysis jobs
        Acceptance Criterion: Multiple concurrent requests return different template_ids
        """
        urls = [
            "https://github.com/user1/blog1",
            "https://github.com/user2/blog2",
            "https://github.com/user3/blog3",
        ]

        template_ids = []
        for url in urls:
            payload = {"github_url": url}
            response = client.post("/api/templates/analyze-url", json=payload, headers=auth_headers)

            assert response.status_code == 202
            data = response.json()
            template_id = data["data"]["template_id"]
            template_ids.append(template_id)

        # All template_ids should be unique
        assert len(template_ids) == len(set(template_ids))

    def test_analyze_url_response_structure(self, client, auth_headers):
        """
        [ ] Returns correct JSON structure
        Acceptance Criterion: Response has required fields
        """
        payload = {
            "github_url": "https://github.com/user/11ty-blog"
        }

        response = client.post("/api/templates/analyze-url", json=payload, headers=auth_headers)

        assert response.status_code == 202
        data = response.json()

        # Verify standard response structure
        assert "data" in data
        assert "meta" in data

        # Verify meta fields
        assert "timestamp" in data["meta"]
        assert "request_id" in data["meta"]

        # Verify data fields
        assert "template_id" in data["data"]
        assert "status" in data["data"]
        assert "message" in data["data"]
        assert "poll_url" in data["data"]

    def test_analyze_url_github_url_with_trailing_slash(self, client, auth_headers):
        """
        [ ] Handles GitHub URLs with trailing slash
        Acceptance Criterion: Accepts and normalizes URLs
        """
        payload = {
            "github_url": "https://github.com/user/11ty-blog/"
        }

        response = client.post("/api/templates/analyze-url", json=payload, headers=auth_headers)

        assert response.status_code == 202
        data = response.json()
        assert "template_id" in data["data"]

    def test_analyze_url_github_url_with_git_extension(self, client, auth_headers):
        """
        [ ] Handles GitHub URLs with .git extension
        Acceptance Criterion: Accepts and normalizes URLs
        """
        payload = {
            "github_url": "https://github.com/user/11ty-blog.git"
        }

        response = client.post("/api/templates/analyze-url", json=payload, headers=auth_headers)

        assert response.status_code == 202
        data = response.json()
        assert "template_id" in data["data"]


class TestAnalysisStatusEndpoint:
    """
    Test GET /api/templates/{template_id}/analysis-status endpoint
    Requirement: Poll for template analysis progress and results
    """

    def test_analysis_status_not_found(self, client, auth_headers):
        """
        [ ] Returns 404 for non-existent template_id
        Acceptance Criterion: Returns 404 with detail
        """
        template_id = str(uuid.uuid4())

        response = client.get(f"/api/templates/{template_id}/analysis-status", headers=auth_headers)

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data

    def test_analysis_status_requires_authentication(self, client):
        """
        [ ] Authentication: Only allow authenticated users
        Acceptance Criterion: Returns 401 for unauthenticated requests
        """
        template_id = str(uuid.uuid4())

        response = client.get(f"/api/templates/{template_id}/analysis-status")

        assert response.status_code == 401

    def test_analysis_status_analyzing_state(self, client, auth_headers):
        """
        [ ] Returns progress for analyzing state
        Acceptance Criterion: Returns progress field (0-1.0) for analyzing status
        """
        # First create an analysis job
        create_payload = {
            "github_url": "https://github.com/user/11ty-blog"
        }
        create_response = client.post("/api/templates/analyze-url", json=create_payload, headers=auth_headers)
        assert create_response.status_code == 202

        template_id = create_response.json()["data"]["template_id"]

        # Give the background task a moment to start
        import time
        time.sleep(1)

        # Now check status
        response = client.get(f"/api/templates/{template_id}/analysis-status", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "data" in data
        assert "meta" in data

        response_data = data["data"]

        # Requirement: Returns template_id
        assert response_data["template_id"] == template_id

        # Requirement: Returns status field
        assert "status" in response_data
        assert response_data["status"] in ["analyzing", "ready", "failed"]

        # If analyzing, should have progress
        if response_data["status"] == "analyzing":
            assert "progress" in response_data
            assert isinstance(response_data["progress"], (int, float))
            assert 0 <= response_data["progress"] <= 1.0
            assert "message" in response_data

        # If ready, should have schema and content_types
        elif response_data["status"] == "ready":
            assert "schema" in response_data
            assert "content_types" in response_data
            assert "message" in response_data

        # If failed, should have error
        elif response_data["status"] == "failed":
            assert "error" in response_data

    def test_analysis_status_response_structure(self, client, auth_headers):
        """
        [ ] Returns correct JSON structure
        Acceptance Criterion: Response has required fields
        """
        # First create an analysis job
        create_payload = {
            "github_url": "https://github.com/user/11ty-blog"
        }
        create_response = client.post("/api/templates/analyze-url", json=create_payload, headers=auth_headers)
        assert create_response.status_code == 202

        template_id = create_response.json()["data"]["template_id"]

        response = client.get(f"/api/templates/{template_id}/analysis-status", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        # Verify standard response structure
        assert "data" in data
        assert "meta" in data

        # Verify meta fields
        assert "timestamp" in data["meta"]
        assert "request_id" in data["meta"]

        # Verify data fields
        assert "template_id" in data["data"]
        assert "status" in data["data"]

    def test_analysis_status_polling_workflow(self, client, auth_headers):
        """
        [ ] Supports polling workflow
        Acceptance Criterion: Status endpoint returns consistent template_id across multiple polls
        """
        # First create an analysis job
        create_payload = {
            "github_url": "https://github.com/user/11ty-blog"
        }
        create_response = client.post("/api/templates/analyze-url", json=create_payload, headers=auth_headers)
        assert create_response.status_code == 202

        template_id = create_response.json()["data"]["template_id"]

        # Poll multiple times
        for _ in range(3):
            response = client.get(f"/api/templates/{template_id}/analysis-status", headers=auth_headers)

            assert response.status_code == 200
            data = response.json()
            assert data["data"]["template_id"] == template_id

            import time
            time.sleep(0.5)

    def test_analysis_status_invalid_template_id_format(self, client, auth_headers):
        """
        [ ] Handles various invalid template_id formats
        Acceptance Criterion: Returns 404 for non-existent IDs
        """
        invalid_ids = [
            "not-a-uuid",
            "123",
            "abcdef",
            "xyz-xyz-xyz",
        ]

        for invalid_id in invalid_ids:
            response = client.get(f"/api/templates/{invalid_id}/analysis-status", headers=auth_headers)

            assert response.status_code == 404
            data = response.json()
            assert "detail" in data


class TestAnalyzUrlIntegration:
    """
    Integration tests for the complete analyze workflow
    """

    def test_analyze_create_and_poll_workflow(self, client, auth_headers):
        """
        [ ] Complete workflow: Create analysis job, then poll status
        Acceptance Criterion: Can create job and poll status
        """
        # Step 1: Create analysis job
        create_payload = {
            "github_url": "https://github.com/user/11ty-blog"
        }
        create_response = client.post("/api/templates/analyze-url", json=create_payload, headers=auth_headers)

        assert create_response.status_code == 202
        create_data = create_response.json()
        template_id = create_data["data"]["template_id"]

        # Step 2: Poll status
        status_response = client.get(f"/api/templates/{template_id}/analysis-status", headers=auth_headers)

        assert status_response.status_code == 200
        status_data = status_response.json()

        # Verify we get consistent template_id
        assert status_data["data"]["template_id"] == template_id

    def test_dynamodb_stores_analysis_record(self, client, auth_headers):
        """
        [ ] Analysis metadata stored in DynamoDB
        Acceptance Criterion: Records are persisted correctly
        """
        payload = {
            "github_url": "https://github.com/user/11ty-blog"
        }

        response = client.post("/api/templates/analyze-url", json=payload, headers=auth_headers)

        assert response.status_code == 202
        data = response.json()
        template_id = data["data"]["template_id"]

        # Verify we can retrieve it
        status_response = client.get(f"/api/templates/{template_id}/analysis-status", headers=auth_headers)
        assert status_response.status_code == 200
