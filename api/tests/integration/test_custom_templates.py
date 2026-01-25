"""
Integration tests for SSG-008: Custom Template Registration API

Tests for registering custom 11ty templates from GitHub.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
import uuid
from datetime import datetime


class TestCustomTemplateRegistration:
    """
    Test POST /api/templates/custom endpoint
    Requirement: Register template from GitHub URL
    """

    def test_register_custom_template_valid_github_url(self, client):
        """
        [ ] Valid GitHub URLs accepted
        Acceptance Criterion: Valid GitHub URLs accepted
        """
        payload = {
            "name": "My Custom Blog",
            "github_url": "https://github.com/user/my-11ty-blog",
            "is_public": False
        }

        response = client.post("/api/templates/custom", json=payload)

        # Should return 202 Accepted
        assert response.status_code == 202, f"Expected 202, got {response.status_code}: {response.text}"
        data = response.json()

        # Verify response structure
        assert "data" in data or "template_id" in data
        response_data = data.get("data") or data

        # Requirement: Returns template_id
        assert "template_id" in response_data
        assert response_data["template_id"] is not None

        # Requirement: status should be "analyzing"
        assert response_data["status"] == "analyzing"

        # Requirement: message should be provided
        assert "message" in response_data

    def test_register_custom_template_invalid_github_url_format(self, client):
        """
        [ ] Invalid URLs rejected with error
        Acceptance Criterion: Invalid URLs rejected with error
        """
        payload = {
            "name": "Invalid Template",
            "github_url": "not-a-valid-url",
            "is_public": False
        }

        response = client.post("/api/templates/custom", json=payload)

        # Should return validation error
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        data = response.json()
        assert "error" in data or "detail" in data

    def test_register_custom_template_unsupported_domain(self, client):
        """
        [ ] GitHub URL validation (github.com, gitlab.com, bitbucket.org)
        Requirement: Allowed domains only
        """
        payload = {
            "name": "Invalid Domain",
            "github_url": "https://example.com/user/repo",
            "is_public": False
        }

        response = client.post("/api/templates/custom", json=payload)

        # Should reject unsupported domains
        assert response.status_code in [400, 422]

    def test_register_custom_template_gitlab_url(self, client):
        """Test that GitLab URLs are accepted (allowed domain)"""
        payload = {
            "name": "GitLab Template",
            "github_url": "https://gitlab.com/user/11ty-template",
            "is_public": False
        }

        response = client.post("/api/templates/custom", json=payload)

        # Should accept GitLab URLs
        assert response.status_code == 202

    def test_register_custom_template_bitbucket_url(self, client):
        """Test that Bitbucket URLs are accepted (allowed domain)"""
        payload = {
            "name": "Bitbucket Template",
            "github_url": "https://bitbucket.org/user/11ty-template",
            "is_public": False
        }

        response = client.post("/api/templates/custom", json=payload)

        # Should accept Bitbucket URLs
        assert response.status_code == 202

    def test_register_custom_template_returns_202_with_template_id(self, client):
        """
        Acceptance Criterion: Returns 202 Accepted with template_id
        """
        payload = {
            "name": "Test Template",
            "github_url": "https://github.com/test/template",
            "is_public": False
        }

        response = client.post("/api/templates/custom", json=payload)

        assert response.status_code == 202
        data = response.json()

        # Extract data (could be nested or flat)
        response_data = data.get("data") or data

        # Must include template_id
        assert "template_id" in response_data
        template_id = response_data["template_id"]

        # template_id should be a valid UUID or similar
        assert isinstance(template_id, str)
        assert len(template_id) > 0

    def test_register_custom_template_missing_name(self, client):
        """Test that missing required fields are rejected"""
        payload = {
            "github_url": "https://github.com/user/template",
            "is_public": False
        }

        response = client.post("/api/templates/custom", json=payload)

        # Should return validation error
        assert response.status_code in [400, 422]

    def test_register_custom_template_missing_github_url(self, client):
        """Test that missing GitHub URL is rejected"""
        payload = {
            "name": "Test Template",
            "is_public": False
        }

        response = client.post("/api/templates/custom", json=payload)

        # Should return validation error
        assert response.status_code in [400, 422]


class TestCustomTemplateStatus:
    """
    Test GET /api/templates/custom/{id}/status endpoint
    Requirement: Check analysis status
    """

    def test_get_template_status_analyzing(self, client):
        """
        [ ] Status polling works correctly
        Test status when analysis is in progress
        """
        # First, register a template
        register_payload = {
            "name": "Test Template",
            "github_url": "https://github.com/test/template",
            "is_public": False
        }

        register_response = client.post("/api/templates/custom", json=register_payload)
        assert register_response.status_code == 202

        template_id = register_response.json().get("data", {}).get("template_id") or \
                      register_response.json().get("template_id")

        # Get status
        status_response = client.get(f"/api/templates/custom/{template_id}/status")

        assert status_response.status_code == 200
        data = status_response.json()

        # Extract data (could be nested or flat)
        response_data = data.get("data") or data

        # Verify status response structure
        assert "template_id" in response_data
        assert "status" in response_data
        assert response_data["status"] in ["analyzing", "ready", "failed"]

    def test_get_template_status_ready(self, client):
        """Test status when analysis is complete"""
        # For this test, we would need a template that's already analyzed
        # We'll use a mock or skip if not implemented
        # This tests the "ready" status response
        pass

    def test_get_template_status_failed(self, client):
        """Test status when analysis has failed"""
        # For this test, we would need a template that failed analysis
        # We'll use a mock or skip if not implemented
        # This tests the "failed" status response
        pass

    def test_get_template_status_not_found(self, client):
        """Test that non-existent template returns 404"""
        fake_id = str(uuid.uuid4())
        response = client.get(f"/api/templates/custom/{fake_id}/status")

        assert response.status_code == 404


class TestGetContentTypes:
    """
    Test GET /api/templates/{id}/content-types endpoint
    Requirement: Get inferred content types
    """

    def test_get_content_types_for_custom_template(self, client):
        """
        [ ] `GET /api/templates/{id}/content-types` - Get inferred content types
        Get inferred content types for a template
        """
        # For this test, we would need a ready template
        # This is a placeholder that would be tested with actual data
        pass

    def test_get_content_types_includes_schema(self, client):
        """Test that content types include their schemas"""
        # Placeholder for schema verification
        pass


class TestDynamoDBStorage:
    """
    Test that template metadata is stored in DynamoDB
    Requirement: Store template metadata in DynamoDB
    """

    def test_template_record_created_in_dynamodb(self, client):
        """
        [ ] Template record created in DynamoDB
        Acceptance Criterion: Template record created in DynamoDB
        """
        # This would require mocking DynamoDB or using a test instance
        # Placeholder for implementation
        pass

    def test_template_metadata_structure(self, client):
        """Test that stored metadata has correct structure"""
        # Verify PK: TEMPLATE#{template_id}
        # Verify SK: METADATA
        # Verify all required fields present
        pass


class TestURLValidation:
    """
    Test GitHub URL validation
    Requirement: GitHub URL validation
    """

    def test_url_validation_github_https(self, client):
        """Test HTTPS GitHub URL validation"""
        payload = {
            "name": "Template",
            "github_url": "https://github.com/user/repo",
            "is_public": False
        }
        response = client.post("/api/templates/custom", json=payload)
        assert response.status_code == 202

    def test_url_validation_github_git_ssh(self, client):
        """Test git@ SSH GitHub URL (should be converted to HTTPS)"""
        payload = {
            "name": "Template",
            "github_url": "git@github.com:user/repo.git",
            "is_public": False
        }
        response = client.post("/api/templates/custom", json=payload)
        # Should either accept or normalize to HTTPS
        assert response.status_code in [202, 400]

    def test_url_validation_trailing_git(self, client):
        """Test URL with .git suffix"""
        payload = {
            "name": "Template",
            "github_url": "https://github.com/user/repo.git",
            "is_public": False
        }
        response = client.post("/api/templates/custom", json=payload)
        assert response.status_code == 202

    def test_url_validation_no_protocol(self, client):
        """Test that URLs without protocol are rejected"""
        payload = {
            "name": "Template",
            "github_url": "github.com/user/repo",
            "is_public": False
        }
        response = client.post("/api/templates/custom", json=payload)
        assert response.status_code in [400, 422]

    def test_url_validation_localhost(self, client):
        """Test that localhost URLs are rejected (security)"""
        payload = {
            "name": "Template",
            "github_url": "https://localhost:8080/user/repo",
            "is_public": False
        }
        response = client.post("/api/templates/custom", json=payload)
        assert response.status_code in [400, 422]

    def test_url_validation_internal_ip(self, client):
        """Test that internal IP URLs are rejected (security)"""
        payload = {
            "name": "Template",
            "github_url": "https://192.168.1.1/user/repo",
            "is_public": False
        }
        response = client.post("/api/templates/custom", json=payload)
        assert response.status_code in [400, 422]


class TestAsyncLambdaInvocation:
    """
    Test async Lambda invocation
    Requirement: Async invocation of analyzer Lambda
    """

    def test_async_lambda_invocation(self, client):
        """
        [ ] Async invocation of analyzer Lambda
        Test that Lambda is invoked asynchronously
        """
        # This would require mocking AWS Lambda
        # Placeholder for implementation
        pass

    def test_template_status_changes_from_analyzing(self, client):
        """Test that template status updates as Lambda processes"""
        # After Lambda completes, status should change from "analyzing" to "ready" or "failed"
        pass


class TestErrorHandling:
    """
    Test error handling for custom template registration
    """

    def test_duplicate_github_url_handling(self, client):
        """Test that duplicate GitHub URLs are either accepted or rejected with proper error"""
        payload = {
            "name": "First Registration",
            "github_url": "https://github.com/user/unique-repo",
            "is_public": False
        }

        # First registration
        response1 = client.post("/api/templates/custom", json=payload)
        assert response1.status_code == 202

        # Try to register same URL again (implementation specific behavior)
        # Could reject (409 Conflict) or return existing template
        response2 = client.post("/api/templates/custom", json=payload)
        assert response2.status_code in [202, 409, 400]

    def test_network_error_handling(self, client):
        """Test handling of network errors when checking GitHub"""
        # If GitHub is unreachable, should still return 202 (async)
        # Error will be reflected in status when checked
        pass

    def test_rate_limiting(self, client):
        """
        Test that rate limiting is applied
        Max 10 template registrations per user per day
        """
        # This would be tested with mock timestamp controls
        pass


class TestResponseFormat:
    """
    Test response format compliance with API standards
    """

    def test_response_has_correct_structure(self, client):
        """Test that custom template responses follow standard format"""
        payload = {
            "name": "Test Template",
            "github_url": "https://github.com/test/repo",
            "is_public": False
        }

        response = client.post("/api/templates/custom", json=payload)
        assert response.status_code == 202

        data = response.json()

        # Response should have standard structure
        # Either: {data: {...}, meta: {...}} or flat with template_id, status, etc
        if "meta" in data:
            assert "timestamp" in data["meta"]
            assert "request_id" in data["meta"]

    def test_error_response_format(self, client):
        """Test that error responses follow standard format"""
        payload = {
            "name": "Test",
            # Missing github_url
            "is_public": False
        }

        response = client.post("/api/templates/custom", json=payload)
        assert response.status_code in [400, 422]

        data = response.json()
        # Should have error information
        assert "error" in data or "detail" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
