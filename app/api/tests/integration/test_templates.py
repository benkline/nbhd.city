import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


def test_get_all_templates(client):
    """Test GET /api/templates - returns list of templates with metadata"""
    # [x] `GET /api/templates` - List all available templates
    response = client.get("/api/templates")
    assert response.status_code == 200
    data = response.json()

    # Verify response structure
    assert "data" in data
    assert isinstance(data["data"], list)
    assert len(data["data"]) > 0

    # Verify each template has required fields
    template = data["data"][0]
    assert "id" in template
    assert "name" in template
    assert "description" in template
    assert "author" in template
    assert "version" in template
    assert "tags" in template


def test_get_templates_with_pagination(client):
    """Test GET /api/templates with pagination"""
    # [x] Pagination for large template lists
    response = client.get("/api/templates?skip=0&limit=10")
    assert response.status_code == 200
    data = response.json()

    # Verify pagination metadata
    assert "data" in data
    assert "meta" in data
    assert isinstance(data["data"], list)
    assert len(data["data"]) <= 10


def test_get_single_template(client):
    """Test GET /api/templates/{id} - returns single template details"""
    # [x] `GET /api/templates/{id}` - Get single template metadata
    # First get list to get a valid template ID
    list_response = client.get("/api/templates")
    assert list_response.status_code == 200
    templates = list_response.json()["data"]

    if len(templates) > 0:
        template_id = templates[0]["id"]

        # Get single template
        response = client.get(f"/api/templates/{template_id}")
        assert response.status_code == 200
        data = response.json()

        # Verify structure
        assert "data" in data
        template = data["data"]
        assert template["id"] == template_id
        assert "name" in template
        assert "description" in template
        assert "author" in template
        assert "version" in template
        assert "tags" in template


def test_get_single_template_not_found(client):
    """Test GET /api/templates/{id} returns 404 for missing template"""
    # [x] Proper error handling (404 for missing templates)
    response = client.get("/api/templates/nonexistent-template-id")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data


def test_get_template_schema(client):
    """Test GET /api/templates/{id}/schema - returns schema for template"""
    # [x] `GET /api/templates/{id}/schema` - Get config schema
    # First get a valid template ID
    list_response = client.get("/api/templates")
    assert list_response.status_code == 200
    templates = list_response.json()["data"]

    if len(templates) > 0:
        template_id = templates[0]["id"]

        # Get schema
        response = client.get(f"/api/templates/{template_id}/schema")
        assert response.status_code == 200
        data = response.json()

        # Verify schema structure
        assert "data" in data
        schema = data["data"]
        assert isinstance(schema, dict)


def test_get_template_schema_not_found(client):
    """Test GET /api/templates/{id}/schema returns 404 for missing template"""
    response = client.get("/api/templates/nonexistent-template-id/schema")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data


def test_get_template_preview(client):
    """Test GET /api/templates/{id}/preview - returns preview image"""
    # [x] `GET /api/templates/{id}/preview` - Get preview image URL
    # First get a valid template ID
    list_response = client.get("/api/templates")
    assert list_response.status_code == 200
    templates = list_response.json()["data"]

    if len(templates) > 0:
        template_id = templates[0]["id"]

        # Get preview
        response = client.get(f"/api/templates/{template_id}/preview")
        assert response.status_code == 200

        # Should be an image or redirect, not JSON
        assert response.headers.get("content-type") is not None


def test_get_template_preview_not_found(client):
    """Test GET /api/templates/{id}/preview returns 404 for missing template"""
    response = client.get("/api/templates/nonexistent-template-id/preview")
    assert response.status_code == 404


def test_response_structure_valid_json(client):
    """Test all responses have correct JSON structure"""
    # [x] All endpoints return correct JSON structure
    response = client.get("/api/templates")
    assert response.status_code == 200
    data = response.json()

    # Verify standard response structure
    assert "data" in data
    assert "meta" in data
    assert "timestamp" in data["meta"]
    assert "request_id" in data["meta"]
