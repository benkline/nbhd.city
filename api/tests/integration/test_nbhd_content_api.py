"""
Integration tests for neighborhood content API (NBHD-002).

Tests 6 endpoints + admin middleware with 23 test cases covering:
- Welcome content (create, update, get)
- Announcements (create, list, delete)
- CMS view (aggregated content)
- Error handling (404, 403, 401)
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
import uuid

from main import app
from dynamodb_repository import now_iso
from dynamodb_client import get_table
from auth import create_access_token


@pytest.fixture
def test_user_id() -> str:
    """Create test user DID."""
    return "did:plc:test-user-nbhd"


@pytest.fixture
def test_other_user_id() -> str:
    """Alternative test user DID (non-admin)."""
    return "did:plc:other-user-nbhd"


@pytest.fixture
def auth_headers(test_user_id: str) -> dict:
    """Generate auth headers for test user."""
    token = create_access_token(test_user_id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_other_user(test_other_user_id: str) -> dict:
    """Generate auth headers for non-admin user."""
    token = create_access_token(test_other_user_id)
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def test_neighborhood(test_user_id: str):
    """Create a test neighborhood in DynamoDB."""
    nbhd_id = str(uuid.uuid4())
    nbhd_did = f"did:plc:nbhd-{nbhd_id}"

    async with get_table() as table:
        nbhd = {
            "PK": f"NBHD#{nbhd_id}",
            "SK": "METADATA",
            "id": nbhd_id,
            "name": "Test Neighborhood",
            "description": "Test nbhd for content API",
            "created_by": test_user_id,
            "created_at": now_iso(),
            "nbhd_did": nbhd_did,
            "member_count": 0,
            "entity_type": "neighborhood"
        }
        await table.put_item(Item=nbhd)

    return nbhd


@pytest_asyncio.fixture
async def async_client() -> AsyncClient:
    """Create async test client."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


# ==================== Welcome Content Tests ====================

@pytest.mark.asyncio
async def test_create_welcome_content_admin(
    async_client: AsyncClient,
    auth_headers: dict,
    test_neighborhood
):
    """Create welcome content as admin (success)."""
    nbhd_id = test_neighborhood["id"]

    response = await async_client.post(
        f"/api/nbhds/{nbhd_id}/content/welcome",
        headers=auth_headers,
        json={
            "title": "Welcome to Our Neighborhood",
            "content": "# Hello!\n\nWelcome to our community."
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert data["data"]["value"]["title"] == "Welcome to Our Neighborhood"
    assert data["data"]["value"]["$type"] == "app.nbhd.welcome"
    assert data["data"]["rkey"] == "default"


@pytest.mark.asyncio
async def test_update_welcome_content(
    async_client: AsyncClient,
    auth_headers: dict,
    test_neighborhood
):
    """Update existing welcome content (replaces singleton)."""
    nbhd_id = test_neighborhood["id"]

    # Create initial
    response1 = await async_client.post(
        f"/api/nbhds/{nbhd_id}/content/welcome",
        headers=auth_headers,
        json={
            "title": "Welcome",
            "content": "Version 1"
        }
    )
    assert response1.status_code == 201

    # Update
    response2 = await async_client.post(
        f"/api/nbhds/{nbhd_id}/content/welcome",
        headers=auth_headers,
        json={
            "title": "Welcome Updated",
            "content": "Version 2"
        }
    )

    assert response2.status_code == 201
    data = response2.json()
    assert data["meta"]["action"] == "update"
    assert data["data"]["value"]["title"] == "Welcome Updated"


@pytest.mark.asyncio
async def test_get_welcome_public(
    async_client: AsyncClient,
    auth_headers: dict,
    test_neighborhood
):
    """Get welcome content without auth (public)."""
    nbhd_id = test_neighborhood["id"]

    # Create content first
    await async_client.post(
        f"/api/nbhds/{nbhd_id}/content/welcome",
        headers=auth_headers,
        json={
            "title": "Welcome",
            "content": "Public content"
        }
    )

    # Get without auth
    response = await async_client.get(
        f"/api/nbhds/{nbhd_id}/content/welcome"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["data"] is not None
    assert data["data"]["value"]["title"] == "Welcome"


@pytest.mark.asyncio
async def test_get_welcome_not_found_nbhd(
    async_client: AsyncClient
):
    """Get welcome for nonexistent neighborhood returns 404."""
    response = await async_client.get(
        f"/api/nbhds/nonexistent-id/content/welcome"
    )

    assert response.status_code == 404
    assert "Neighborhood not found" in response.json()["detail"]


@pytest.mark.asyncio
async def test_create_welcome_non_admin(
    async_client: AsyncClient,
    auth_headers_other_user: dict,
    test_neighborhood
):
    """Non-admin cannot create welcome content (403)."""
    nbhd_id = test_neighborhood["id"]

    response = await async_client.post(
        f"/api/nbhds/{nbhd_id}/content/welcome",
        headers=auth_headers_other_user,
        json={
            "title": "Hacker Content",
            "content": "Should fail"
        }
    )

    assert response.status_code == 403
    assert "Only neighborhood admins" in response.json()["detail"]


@pytest.mark.asyncio
async def test_create_welcome_unauthorized(
    async_client: AsyncClient,
    test_neighborhood
):
    """Create welcome without auth returns 401/403."""
    nbhd_id = test_neighborhood["id"]

    response = await async_client.post(
        f"/api/nbhds/{nbhd_id}/content/welcome",
        json={
            "title": "No Auth",
            "content": "Should fail"
        }
    )

    # FastAPI dependency injection returns 403 for missing auth
    assert response.status_code in [403, 401]


# ==================== Announcements Tests ====================

@pytest.mark.asyncio
async def test_create_announcement_admin(
    async_client: AsyncClient,
    auth_headers: dict,
    test_neighborhood
):
    """Create announcement as admin (success)."""
    nbhd_id = test_neighborhood["id"]

    response = await async_client.post(
        f"/api/nbhds/{nbhd_id}/content/announcements",
        headers=auth_headers,
        json={
            "title": "New Announcement",
            "content": "Important update",
            "priority": "high",
            "pinned": True
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert data["data"]["value"]["title"] == "New Announcement"
    assert data["data"]["value"]["$type"] == "app.nbhd.announcement"
    assert data["data"]["value"]["priority"] == "high"
    assert data["data"]["value"]["pinned"] is True


@pytest.mark.asyncio
async def test_create_announcement_non_admin(
    async_client: AsyncClient,
    auth_headers_other_user: dict,
    test_neighborhood
):
    """Non-admin cannot create announcement (403)."""
    nbhd_id = test_neighborhood["id"]

    response = await async_client.post(
        f"/api/nbhds/{nbhd_id}/content/announcements",
        headers=auth_headers_other_user,
        json={
            "title": "Spam",
            "content": "Hacked"
        }
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_announcements_public(
    async_client: AsyncClient,
    auth_headers: dict,
    test_neighborhood
):
    """List announcements without auth (public)."""
    nbhd_id = test_neighborhood["id"]

    # Create some announcements
    for i in range(3):
        await async_client.post(
            f"/api/nbhds/{nbhd_id}/content/announcements",
            headers=auth_headers,
            json={
                "title": f"Announcement {i+1}",
                "content": f"Content {i+1}"
            }
        )

    # List without auth
    response = await async_client.get(
        f"/api/nbhds/{nbhd_id}/content/announcements"
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 3


@pytest.mark.asyncio
async def test_list_announcements_pagination(
    async_client: AsyncClient,
    auth_headers: dict,
    test_neighborhood
):
    """Pagination works correctly."""
    nbhd_id = test_neighborhood["id"]

    # Create 15 announcements
    for i in range(15):
        await async_client.post(
            f"/api/nbhds/{nbhd_id}/content/announcements",
            headers=auth_headers,
            json={
                "title": f"Announcement {i+1}",
                "content": f"Content {i+1}"
            }
        )

    # List with limit=10
    response = await async_client.get(
        f"/api/nbhds/{nbhd_id}/content/announcements?limit=10&offset=0"
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 10
    assert data["meta"]["pagination"]["total"] == 15
    assert data["meta"]["pagination"]["offset"] == 0
    assert data["meta"]["pagination"]["limit"] == 10

    # Next page
    response2 = await async_client.get(
        f"/api/nbhds/{nbhd_id}/content/announcements?limit=10&offset=10"
    )

    assert response2.status_code == 200
    data2 = response2.json()
    assert len(data2["data"]) == 5


@pytest.mark.asyncio
async def test_list_announcements_sorting(
    async_client: AsyncClient,
    auth_headers: dict,
    test_neighborhood
):
    """Announcements sorted newest first (by rkey/TID)."""
    nbhd_id = test_neighborhood["id"]

    # Create announcements
    rkeys = []
    for i in range(3):
        response = await async_client.post(
            f"/api/nbhds/{nbhd_id}/content/announcements",
            headers=auth_headers,
            json={
                "title": f"Announcement {i+1}",
                "content": f"Content {i+1}"
            }
        )
        rkeys.append(response.json()["data"]["rkey"])

    # List and verify order (newest first)
    response = await async_client.get(
        f"/api/nbhds/{nbhd_id}/content/announcements"
    )

    data = response.json()
    returned_rkeys = [r["rkey"] for r in data["data"]]

    # TIDs are chronologically sortable, so newest should come first
    assert returned_rkeys == sorted(returned_rkeys, reverse=True)


@pytest.mark.asyncio
async def test_delete_announcement_admin(
    async_client: AsyncClient,
    auth_headers: dict,
    test_neighborhood
):
    """Delete announcement as admin (soft delete)."""
    nbhd_id = test_neighborhood["id"]

    # Create announcement
    create_response = await async_client.post(
        f"/api/nbhds/{nbhd_id}/content/announcements",
        headers=auth_headers,
        json={
            "title": "To Delete",
            "content": "This will be deleted"
        }
    )

    rkey = create_response.json()["data"]["rkey"]

    # Delete
    response = await async_client.delete(
        f"/api/nbhds/{nbhd_id}/content/announcements/{rkey}",
        headers=auth_headers
    )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_announcement_non_admin(
    async_client: AsyncClient,
    auth_headers: dict,
    auth_headers_other_user: dict,
    test_neighborhood
):
    """Non-admin cannot delete announcement (403)."""
    nbhd_id = test_neighborhood["id"]

    # Create announcement
    create_response = await async_client.post(
        f"/api/nbhds/{nbhd_id}/content/announcements",
        headers=auth_headers,
        json={
            "title": "Protected",
            "content": "Only admin can delete"
        }
    )

    rkey = create_response.json()["data"]["rkey"]

    # Try to delete as non-admin
    response = await async_client.delete(
        f"/api/nbhds/{nbhd_id}/content/announcements/{rkey}",
        headers=auth_headers_other_user
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_announcement_not_found(
    async_client: AsyncClient,
    auth_headers: dict,
    test_neighborhood
):
    """Delete nonexistent announcement returns 404."""
    nbhd_id = test_neighborhood["id"]

    response = await async_client.delete(
        f"/api/nbhds/{nbhd_id}/content/announcements/nonexistent-rkey",
        headers=auth_headers
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_soft_delete_behavior(
    async_client: AsyncClient,
    auth_headers: dict,
    test_neighborhood
):
    """Soft-deleted announcements don't appear in list."""
    nbhd_id = test_neighborhood["id"]

    # Create announcement
    create_response = await async_client.post(
        f"/api/nbhds/{nbhd_id}/content/announcements",
        headers=auth_headers,
        json={
            "title": "Will Delete",
            "content": "Testing soft delete"
        }
    )

    rkey = create_response.json()["data"]["rkey"]

    # Verify it appears in list
    list_response1 = await async_client.get(
        f"/api/nbhds/{nbhd_id}/content/announcements"
    )
    assert len(list_response1.json()["data"]) == 1

    # Delete it
    await async_client.delete(
        f"/api/nbhds/{nbhd_id}/content/announcements/{rkey}",
        headers=auth_headers
    )

    # Verify it's gone from list
    list_response2 = await async_client.get(
        f"/api/nbhds/{nbhd_id}/content/announcements"
    )
    assert len(list_response2.json()["data"]) == 0


@pytest.mark.asyncio
async def test_announcement_priority_validation(
    async_client: AsyncClient,
    auth_headers: dict,
    test_neighborhood
):
    """Priority field validation."""
    nbhd_id = test_neighborhood["id"]

    # Valid priorities
    for priority in ["low", "normal", "high"]:
        response = await async_client.post(
            f"/api/nbhds/{nbhd_id}/content/announcements",
            headers=auth_headers,
            json={
                "title": f"Priority {priority}",
                "content": f"Test {priority}",
                "priority": priority
            }
        )
        assert response.status_code == 201

    # Invalid priority should fail validation
    response = await async_client.post(
        f"/api/nbhds/{nbhd_id}/content/announcements",
        headers=auth_headers,
        json={
            "title": "Bad Priority",
            "content": "Test",
            "priority": "invalid"
        }
    )
    assert response.status_code == 422  # Pydantic validation error


# ==================== CMS View Tests ====================

@pytest.mark.asyncio
async def test_get_cms_view_admin(
    async_client: AsyncClient,
    auth_headers: dict,
    test_neighborhood
):
    """Get CMS view aggregates all content."""
    nbhd_id = test_neighborhood["id"]

    # Create welcome
    await async_client.post(
        f"/api/nbhds/{nbhd_id}/content/welcome",
        headers=auth_headers,
        json={
            "title": "Welcome",
            "content": "Welcome text"
        }
    )

    # Create announcements
    for i in range(3):
        await async_client.post(
            f"/api/nbhds/{nbhd_id}/content/announcements",
            headers=auth_headers,
            json={
                "title": f"Announcement {i+1}",
                "content": f"Content {i+1}"
            }
        )

    # Get CMS view
    response = await async_client.get(
        f"/api/nbhds/{nbhd_id}/content/cms",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["data"]["welcome_content"] is not None
    assert len(data["data"]["announcements"]) == 3
    assert data["data"]["announcement_count"] == 3
    assert data["data"]["nbhd_id"] == nbhd_id


@pytest.mark.asyncio
async def test_get_cms_view_non_admin(
    async_client: AsyncClient,
    auth_headers_other_user: dict,
    test_neighborhood
):
    """Non-admin cannot access CMS view (403)."""
    nbhd_id = test_neighborhood["id"]

    response = await async_client.get(
        f"/api/nbhds/{nbhd_id}/content/cms",
        headers=auth_headers_other_user
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_cms_view_unauthorized(
    async_client: AsyncClient,
    test_neighborhood
):
    """Get CMS view without auth returns 403."""
    nbhd_id = test_neighborhood["id"]

    response = await async_client.get(
        f"/api/nbhds/{nbhd_id}/content/cms"
    )

    assert response.status_code in [403, 401]


# ==================== Error Handling Tests ====================

@pytest.mark.asyncio
async def test_404_nonexistent_nbhd_announcements(
    async_client: AsyncClient
):
    """404 for announcements on nonexistent neighborhood."""
    response = await async_client.get(
        "/api/nbhds/nonexistent/content/announcements"
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_validation_error_missing_field(
    async_client: AsyncClient,
    auth_headers: dict,
    test_neighborhood
):
    """Validation error for missing required field."""
    nbhd_id = test_neighborhood["id"]

    response = await async_client.post(
        f"/api/nbhds/{nbhd_id}/content/welcome",
        headers=auth_headers,
        json={
            "title": "Missing content"
            # content is missing
        }
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_validation_error_title_too_long(
    async_client: AsyncClient,
    auth_headers: dict,
    test_neighborhood
):
    """Validation error for title exceeding max_length."""
    nbhd_id = test_neighborhood["id"]

    response = await async_client.post(
        f"/api/nbhds/{nbhd_id}/content/welcome",
        headers=auth_headers,
        json={
            "title": "x" * 201,  # max is 200
            "content": "Valid content"
        }
    )

    assert response.status_code == 422
