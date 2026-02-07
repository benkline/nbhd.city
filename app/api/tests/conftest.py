import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from main import app
from auth import create_access_token


@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Headers with valid JWT token for testing"""
    token = create_access_token(user_id="did:plc:test123")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_user_id():
    """Test user ID"""
    return "did:plc:test123"
