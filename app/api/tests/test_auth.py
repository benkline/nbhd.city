"""
Tests for authentication endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
from main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


class TestTestLoginEndpoint:
    """Tests for the /auth/test-login endpoint."""

    def test_login_with_valid_bluesky_credentials(self, client):
        """Test successful login with valid BlueSky credentials."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "accessJwt": "test-jwt-token",
            "did": "did:plc:test123",
            "handle": "testuser.bsky.social"
        }

        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = AsyncMock()
            mock_client_class.return_value = mock_client

            response = client.post(
                "/auth/test-login",
                json={
                    "username": "testuser@example.com",
                    "password": "validpassword"
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"
            assert data["user"]["id"] == "did:plc:test123"
            assert data["user"]["handle"] == "testuser.bsky.social"


    def test_login_with_missing_password(self, client):
        """Test login with missing password."""
        response = client.post(
            "/auth/test-login",
            json={"username": "testuser@example.com", "password": ""}
        )

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "required" in data["detail"].lower()

    def test_login_response_contains_valid_token(self, client):
        """Test that login response contains a valid JWT token."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "accessJwt": "bluesky-jwt",
            "did": "did:plc:test123",
            "handle": "testuser.bsky.social"
        }

        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = AsyncMock()
            mock_client_class.return_value = mock_client

            response = client.post(
                "/auth/test-login",
                json={
                    "username": "testuser@example.com",
                    "password": "validpassword"
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert isinstance(data["access_token"], str)
            assert len(data["access_token"]) > 0
            # JWT should have 3 parts separated by dots
            parts = data["access_token"].split(".")
            assert len(parts) == 3

    def test_login_extracts_user_handle_from_bluesky(self, client):
        """Test that login extracts and returns the BlueSky handle."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "accessJwt": "jwt",
            "did": "did:plc:abc123",
            "handle": "alice.bsky.social"
        }

        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = AsyncMock()
            mock_client_class.return_value = mock_client

            response = client.post(
                "/auth/test-login",
                json={
                    "username": "alice@example.com",
                    "password": "password123"
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["user"]["handle"] == "alice.bsky.social"
            assert data["user"]["id"] == "did:plc:abc123"
