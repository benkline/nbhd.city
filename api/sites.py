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
