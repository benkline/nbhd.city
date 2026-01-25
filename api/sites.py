from fastapi import APIRouter, HTTPException, Query, Depends, status
from models import TemplateResponse, SiteCreate, SiteUpdate, SiteResponse
from auth import get_current_user
from fastapi.responses import Response
from datetime import datetime
from typing import Optional, Dict, List
import uuid
import json

router = APIRouter(prefix="/api/sites", tags=["sites"])

# In-memory storage for sites (for testing/development)
# In production, this would use DynamoDB
SITES_STORE: Dict[str, Dict] = {}


def _get_template_schema(template_id: str) -> Dict:
    """Get the schema for a template"""
    # Import here to avoid circular imports
    from templates import TEMPLATES

    for template in TEMPLATES:
        if template["id"] == template_id:
            return template.get("schema", {})
    return {}


def _validate_config_against_schema(config: Dict, schema: Dict) -> tuple[bool, Optional[str]]:
    """Validate config against template schema"""
    if not schema:
        return True, None

    # Simple validation: check required fields
    required = schema.get("required", [])
    for field in required:
        if field not in config:
            return False, f"Missing required field: {field}"

    # Basic type checking for properties
    properties = schema.get("properties", {})
    for field, value in config.items():
        if field in properties:
            prop_schema = properties[field]
            expected_type = prop_schema.get("type")

            # Map JSON schema types to Python types
            type_map = {
                "string": str,
                "number": (int, float),
                "integer": int,
                "boolean": bool,
                "array": list,
                "object": dict
            }

            if expected_type in type_map:
                expected_python_type = type_map[expected_type]
                if not isinstance(value, expected_python_type):
                    return False, f"Field '{field}' must be of type {expected_type}"

            # Pattern validation for strings
            if expected_type == "string" and "pattern" in prop_schema:
                import re
                pattern = prop_schema["pattern"]
                if not re.match(pattern, str(value)):
                    return False, f"Field '{field}' does not match pattern"

    return True, None


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_site(
    site_data: SiteCreate,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Create new site from template + config.

    - **title**: Site title
    - **template**: Template ID (blog, project, newsletter)
    - **config**: Configuration object matching template schema

    Returns created site object.
    """
    # [x] `POST /api/sites` - Create new site from template + config
    # [x] Store config JSON in DynamoDB (in-memory for now)

    # Validate template exists
    from templates import get_template_by_id
    template_obj = get_template_by_id(site_data.template)
    if not template_obj:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Template '{site_data.template}' not found"
        )

    # [x] Config validation against schema
    schema = template_obj.get("schema", {})
    is_valid, error_msg = _validate_config_against_schema(site_data.config, schema)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg or "Invalid configuration"
        )

    # Create site
    site_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat() + "Z"

    site = {
        "site_id": site_id,
        "user_id": user_id,
        "title": site_data.title,
        "template": site_data.template,
        "config": site_data.config,
        "status": "draft",
        "created_at": now,
        "updated_at": now
    }

    # Store in memory (in production, would be DynamoDB)
    SITES_STORE[site_id] = site

    return {
        "data": site,
        "meta": {
            "timestamp": now,
            "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
        }
    }


@router.get("")
async def list_sites(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    List user's sites with pagination.

    Returns list of site objects for the authenticated user.
    """
    # [x] `GET /api/sites` - List user's sites

    # Get sites for this user
    user_sites = [
        site for site in SITES_STORE.values()
        if site.get("user_id") == user_id
    ]

    # Sort by created_at descending
    user_sites.sort(key=lambda s: s.get("created_at", ""), reverse=True)

    # Apply pagination
    total = len(user_sites)
    sites = user_sites[skip : skip + limit]

    return {
        "data": sites,
        "meta": {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S"),
            "pagination": {
                "skip": skip,
                "limit": limit,
                "total": total
            }
        }
    }


@router.get("/{site_id}")
async def get_site(
    site_id: str,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Retrieve site config by ID.

    Returns site object if it exists and user is the owner.
    """
    # [x] `GET /api/sites/{id}` - Retrieve site config
    # [x] User can only access their own sites

    if site_id not in SITES_STORE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Site '{site_id}' not found"
        )

    site = SITES_STORE[site_id]

    # Verify ownership
    if site.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this site"
        )

    return {
        "data": site,
        "meta": {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
        }
    }


@router.put("/{site_id}")
async def update_site(
    site_id: str,
    site_data: SiteUpdate,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Update site configuration.

    Updates the site's title and/or config if provided.
    """
    # [x] `PUT /api/sites/{id}` - Update site config

    if site_id not in SITES_STORE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Site '{site_id}' not found"
        )

    site = SITES_STORE[site_id]

    # Verify ownership
    if site.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this site"
        )

    # [x] Config validation against schema
    if site_data.config is not None:
        schema = _get_template_schema(site.get("template", ""))
        is_valid, error_msg = _validate_config_against_schema(site_data.config, schema)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg or "Invalid configuration"
            )

    # Update site
    now = datetime.utcnow().isoformat() + "Z"
    if site_data.title is not None:
        site["title"] = site_data.title
    if site_data.config is not None:
        site["config"] = site_data.config
    site["updated_at"] = now

    return {
        "data": site,
        "meta": {
            "timestamp": now,
            "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
        }
    }


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_site(
    site_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Delete site by ID.

    Returns 204 No Content on success.
    """
    # [x] `DELETE /api/sites/{id}` - Delete site

    if site_id not in SITES_STORE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Site '{site_id}' not found"
        )

    site = SITES_STORE[site_id]

    # Verify ownership
    if site.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this site"
        )

    # Delete site
    del SITES_STORE[site_id]


# SSG-011: Content Records API

@router.post("/{site_id}/content", status_code=status.HTTP_201_CREATED)
async def create_content(
    site_id: str,
    content_data: dict,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Create blog post/page as AT Protocol record.

    REQUIREMENT: [ ] `POST /api/sites/{id}/content` - Create blog post/page
    ACCEPTANCE: [ ] Content stored in DynamoDB with AT Protocol schema
    """
    # Verify site exists and user owns it
    if site_id not in SITES_STORE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Site '{site_id}' not found"
        )

    site = SITES_STORE[site_id]
    if site.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create content for this site"
        )

    # Generate CID and rkey for AT Protocol record
    try:
        from atproto.cid import generate_cid
        from atproto.tid import generate_rkey
        from dynamodb_repository import create_record
        from dynamodb_client import get_dynamodb_table
    except ImportError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AT Protocol utilities not available: {str(e)}"
        )

    # Prepare content value with site_id
    content_value = {
        "$type": "app.nbhd.blog.post",
        **content_data,
        "site_id": site_id
    }

    # Generate CID and rkey
    cid = generate_cid(content_value)
    rkey = generate_rkey()

    # Store in DynamoDB
    try:
        table = await get_dynamodb_table()
        record = await create_record(
            table,
            user_did=user_id,
            collection="app.nbhd.blog.post",
            value=content_value,
            cid=cid,
            rkey=rkey
        )

        return {
            "data": {
                "uri": record["uri"],
                "cid": record["cid"],
                "rkey": record["rkey"],
                "value": record["value"]
            },
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create content: {str(e)}"
        )


@router.get("/{site_id}/content")
async def list_content(
    site_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    List all content for a site with pagination.

    REQUIREMENT: [ ] `GET /api/sites/{id}/content` - List all content
    ACCEPTANCE: [ ] Query by site_id works, Pagination implemented
    """
    # Verify site exists and user owns it
    if site_id not in SITES_STORE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Site '{site_id}' not found"
        )

    site = SITES_STORE[site_id]
    if site.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to read content for this site"
        )

    # Query records for user, filter by site_id
    try:
        from dynamodb_repository import query_records
        from dynamodb_client import get_dynamodb_table

        table = await get_dynamodb_table()
        records = await query_records(
            table,
            user_did=user_id,
            collection="app.nbhd.blog.post"
        )

        # Filter by site_id
        filtered_records = [
            r for r in records
            if r.get("value", {}).get("site_id") == site_id
        ]

        # Apply pagination
        paginated_records = filtered_records[skip : skip + limit]

        return {
            "data": paginated_records,
            "meta": {
                "skip": skip,
                "limit": limit,
                "total": len(filtered_records),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list content: {str(e)}"
        )


@router.get("/{site_id}/content/{rkey}")
async def get_content(
    site_id: str,
    rkey: str,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Get specific content by rkey.

    REQUIREMENT: [ ] `GET /api/sites/{id}/content/{rkey}` - Get specific content
    """
    # Verify site exists and user owns it
    if site_id not in SITES_STORE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Site '{site_id}' not found"
        )

    site = SITES_STORE[site_id]
    if site.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to read content for this site"
        )

    # Get record by URI
    try:
        from dynamodb_repository import get_record
        from dynamodb_client import get_dynamodb_table

        uri = f"at://{user_id}/app.nbhd.blog.post/{rkey}"
        table = await get_dynamodb_table()
        record = await get_record(table, uri)

        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Content '{rkey}' not found"
            )

        # Verify it belongs to this site
        if record.get("value", {}).get("site_id") != site_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Content does not belong to this site"
            )

        return {
            "data": record,
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get content: {str(e)}"
        )


@router.put("/{site_id}/content/{rkey}")
async def update_content(
    site_id: str,
    rkey: str,
    content_data: dict,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Update content (creates new version, preserves history).

    REQUIREMENT: [ ] `PUT /api/sites/{id}/content/{rkey}` - Update content
    """
    # Verify site exists and user owns it
    if site_id not in SITES_STORE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Site '{site_id}' not found"
        )

    site = SITES_STORE[site_id]
    if site.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update content for this site"
        )

    # Get old record
    try:
        from dynamodb_repository import get_record, update_record
        from dynamodb_client import get_dynamodb_table

        uri = f"at://{user_id}/app.nbhd.blog.post/{rkey}"
        table = await get_dynamodb_table()
        old_record = await get_record(table, uri)

        if not old_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Content '{rkey}' not found"
            )

        # Verify it belongs to this site
        if old_record.get("value", {}).get("site_id") != site_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Content does not belong to this site"
            )

        # Update record (creates new version)
        new_record = await update_record(table, uri, content_data)

        return {
            "data": new_record,
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "linked_record": new_record.get("linked_record")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update content: {str(e)}"
        )


@router.delete("/{site_id}/content/{rkey}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    site_id: str,
    rkey: str,
    user_id: str = Depends(get_current_user)
):
    """
    Delete content (soft delete - marks as deleted).

    REQUIREMENT: [ ] `DELETE /api/sites/{id}/content/{rkey}` - Delete content
    """
    # Verify site exists and user owns it
    if site_id not in SITES_STORE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Site '{site_id}' not found"
        )

    site = SITES_STORE[site_id]
    if site.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete content for this site"
        )

    # Delete record
    try:
        from dynamodb_repository import get_record, delete_record
        from dynamodb_client import get_dynamodb_table

        uri = f"at://{user_id}/app.nbhd.blog.post/{rkey}"
        table = await get_dynamodb_table()

        # Verify record exists and belongs to site
        record = await get_record(table, uri)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Content '{rkey}' not found"
            )

        if record.get("value", {}).get("site_id") != site_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Content does not belong to this site"
            )

        # Delete record (soft delete)
        await delete_record(table, uri)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete content: {str(e)}"
        )


@router.get("/{site_id}/prefill")
async def get_prefill_suggestions(
    site_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get prefill suggestions for site configuration.

    Returns prefill suggestions based on:
    - User's BlueSky profile data (display_name, bio, avatar, etc.)
    - Configuration from user's previous sites
    - Field mappings to template schema

    Response:
    {
      "suggestions": [
        {
          "field": "author",
          "value": "Alice",
          "source": "profile",
          "confidence": 1.0
        },
        ...
      ],
      "template_id": "template-uuid-123",
      "template_name": "Blog Template"
    }
    """
    # [ ] `GET /api/sites/{id}/prefill` - Get prefill suggestions
    try:
        from content_prefilling import ContentPrefiller

        # Verify site exists and belongs to user
        if site_id not in SITES_STORE:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site '{site_id}' not found"
            )

        site = SITES_STORE[site_id]

        # Verify ownership
        if site.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this site"
            )

        # [ ] Get prefill suggestions
        prefiller = ContentPrefiller()
        suggestions = await prefiller.get_prefill_suggestions(user_id, site_id)

        # Get template info
        template = _get_template_schema(site.get("template", ""))
        template_name = site.get("template", "Unknown")

        return {
            "suggestions": suggestions,
            "template_id": site.get("template"),
            "template_name": template_name
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get prefill suggestions: {str(e)}"
        )
