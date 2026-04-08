from fastapi import APIRouter, HTTPException, Query, Depends, status
from models import TemplateResponse, SiteCreate, SiteUpdate, SiteResponse, BuildJobCreate, BuildJobResponse
from auth import get_current_user
from fastapi.responses import Response, StreamingResponse
from datetime import datetime
from typing import Optional, Dict, List, Tuple
import uuid
import json
import io
import zipfile
import aioboto3
import os
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

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


def _synthesize_content_types_from_template(template_id: str, template_obj: Dict) -> Dict:
    """
    Synthesize content types from a template.

    For built-in templates, creates a default content type based on the template ID.
    For custom templates, uses content_types from template analysis if available.

    Args:
        template_id: Template ID (e.g., "blog", "project")
        template_obj: Template object from templates.py

    Returns:
        dict: Content types mapping name to schema/metadata
    """
    # For custom templates with analysis results
    if template_obj.get("content_types"):
        return template_obj.get("content_types", {})

    # For built-in templates, synthesize based on template type
    if template_id == "blog":
        return {
            "post": {
                "schema": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "title": "Post Title"},
                        "content": {"type": "string", "title": "Post Content"},
                        "tags": {"type": "array", "title": "Tags"}
                    },
                    "required": ["title", "content"]
                },
                "is_primary": True
            }
        }
    elif template_id == "project":
        return {
            "showcase": {
                "schema": {
                    "type": "object",
                    "properties": {
                        "site_title": {"type": "string", "title": "Project Title"},
                        "author": {"type": "string", "title": "Author"},
                        "description": {"type": "string", "title": "Description"}
                    },
                    "required": ["site_title", "author"]
                },
                "is_primary": True
            }
        }

    # Default fallback
    return {
        "default": {
            "schema": {
                "type": "object",
                "properties": {}
            },
            "is_primary": True
        }
    }


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
    - **site_type**: "personal", "project", or "nbhd"
    - **nbhd_id**: Required for project and nbhd sites, forbidden for personal

    Returns created site object.
    """
    from templates import get_template_by_id
    from dynamodb_client import get_table
    from dynamodb_repository import create_site as create_site_db, get_neighborhood, store_site_content_types

    # Validate template exists
    template_obj = get_template_by_id(site_data.template)
    if not template_obj:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Template '{site_data.template}' not found"
        )

    # Config validation against schema
    schema = template_obj.get("schema", {})
    is_valid, error_msg = _validate_config_against_schema(site_data.config, schema)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg or "Invalid configuration"
        )

    # Use context manager to properly manage DynamoDB session
    try:
        async with get_table() as table:
            # For project and nbhd sites, verify neighborhood exists
            if site_data.site_type in ['project', 'nbhd'] and site_data.nbhd_id:
                nbhd = await get_neighborhood(table, site_data.nbhd_id)
                if not nbhd:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Neighborhood {site_data.nbhd_id} not found"
                    )

                # For nbhd sites, verify user is admin (created the nbhd)
                if site_data.site_type == 'nbhd' and nbhd.get('created_by') != user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Only neighborhood admins can create nbhd sites"
                    )

            # Create site in DynamoDB
            site = await create_site_db(table, {
                "user_id": user_id,
                "title": site_data.title,
                "template": site_data.template,
                "config": site_data.config,
                "site_type": site_data.site_type,
                "nbhd_id": site_data.nbhd_id,
                "status": "draft"
            })

            # Store content types extracted from template
            content_types = _synthesize_content_types_from_template(site_data.template, template_obj)
            await store_site_content_types(table, site["site_id"], content_types)

            now = datetime.utcnow().isoformat() + "Z"
            return {
                "data": site,
                "meta": {
                    "timestamp": now,
                    "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        import sys
        print(f"ERROR creating site: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create site: {str(e)}"
        )


@router.get("")
async def list_sites(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    site_type: Optional[str] = None,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    List user's sites, optionally filtered by type.

    Returns list of site objects for the authenticated user.
    """
    from dynamodb_client import get_table
    from dynamodb_repository import list_sites_by_user

    try:
        async with get_table() as table:
            # Uses GSI4 (user_id + site_type) for efficient querying
            sites = await list_sites_by_user(table, user_id, site_type)

            # Sort by created_at descending
            sites.sort(key=lambda s: s.get("created_at", ""), reverse=True)

            # Apply pagination
            total = len(sites)
            paginated_sites = sites[skip : skip + limit]

            return {
                "data": paginated_sites,
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list sites: {str(e)}"
        )


@router.get("/{site_id}")
async def get_site(
    site_id: str,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Retrieve site config by ID.

    Returns site object if it exists and user is the owner.
    """
    from dynamodb_client import get_dynamodb_table
    from dynamodb_repository import get_site as get_site_db

    try:
        table = await get_dynamodb_table()
        site = await get_site_db(table, site_id)

        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site '{site_id}' not found"
            )

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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get site: {str(e)}"
        )


@router.get("/{site_id}/content-types")
async def get_site_content_types(
    site_id: str,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Retrieve content types for a site.

    Returns the content types that were extracted and stored during site creation.
    """
    from dynamodb_client import get_dynamodb_table
    from dynamodb_repository import get_site as get_site_db, get_site_content_types as get_content_types_db

    try:
        table = await get_dynamodb_table()
        site = await get_site_db(table, site_id)

        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site '{site_id}' not found"
            )

        # Verify ownership
        if site.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this site"
            )

        # Get content types
        content_types_item = await get_content_types_db(table, site_id)
        if not content_types_item:
            # Return empty dict if not found (fallback)
            content_types = {}
            timestamp = datetime.utcnow().isoformat() + "Z"
            request_id = "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
        else:
            content_types = content_types_item.get("content_types", {})
            # Use the stored created_at timestamp for consistency across retrievals
            timestamp = content_types_item.get("created_at", datetime.utcnow().isoformat() + "Z")
            # Generate request_id from the created_at timestamp so it's consistent
            created_at = content_types_item.get("created_at", "")
            if created_at:
                # Parse the created_at timestamp and format it to create consistent request_id
                try:
                    # Extract YYYYMMDDHHMSS from ISO format timestamp
                    dt_str = created_at.replace("-", "").replace(":", "").replace("T", "").split(".")[0]
                    request_id = "req-" + dt_str
                except:
                    request_id = "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
            else:
                request_id = "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")

        return {
            "data": content_types,
            "meta": {
                "timestamp": timestamp,
                "request_id": request_id
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get content types: {str(e)}"
        )


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
    from dynamodb_client import get_dynamodb_table
    from dynamodb_repository import get_site as get_site_db

    try:
        table = await get_dynamodb_table()
        site = await get_site_db(table, site_id)

        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site '{site_id}' not found"
            )

        # Verify ownership
        if site.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this site"
            )

        # Validate title if provided (not empty string)
        if site_data.title is not None and site_data.title == "":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Site title cannot be empty"
            )

        # Validate visibility if provided
        if site_data.visibility is not None and site_data.visibility not in ["public", "private"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Visibility must be 'public' or 'private'"
            )

        # Config validation against schema
        if site_data.config is not None:
            schema = _get_template_schema(site.get("template", ""))
            is_valid, error_msg = _validate_config_against_schema(site_data.config, schema)
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_msg or "Invalid configuration"
                )

        # Update site in DynamoDB
        now = datetime.utcnow().isoformat() + "Z"
        update_expr = "SET updated_at = :now"
        expr_values = {":now": now}

        if site_data.title is not None:
            update_expr += ", title = :title"
            expr_values[":title"] = site_data.title
        if site_data.tagline is not None:
            update_expr += ", tagline = :tagline"
            expr_values[":tagline"] = site_data.tagline
        if site_data.visibility is not None:
            update_expr += ", visibility = :visibility"
            expr_values[":visibility"] = site_data.visibility
        if site_data.config is not None:
            update_expr += ", #config = :config"
            expr_values[":config"] = site_data.config

        update_kwargs = {
            "Key": {"PK": f"SITE#{site_id}", "SK": "METADATA"},
            "UpdateExpression": update_expr,
            "ExpressionAttributeValues": expr_values,
        }
        # Only add ExpressionAttributeNames if we're updating config (which uses #config)
        if site_data.config is not None:
            update_kwargs["ExpressionAttributeNames"] = {"#config": "config"}

        await table.update_item(**update_kwargs)

        # Fetch updated site
        updated_site = await get_site_db(table, site_id)

        return {
            "data": updated_site,
            "meta": {
                "timestamp": now,
                "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update site: {str(e)}"
        )


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_site(
    site_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Delete site by ID.

    Returns 204 No Content on success.
    """
    from dynamodb_client import get_dynamodb_table
    from dynamodb_repository import get_site as get_site_db

    try:
        table = await get_dynamodb_table()
        site = await get_site_db(table, site_id)

        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site '{site_id}' not found"
            )

        # Verify ownership
        if site.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this site"
            )

        # Delete site from DynamoDB
        await table.delete_item(Key={"PK": f"SITE#{site_id}", "SK": "METADATA"})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete site: {str(e)}"
        )


@router.get("/{site_id}/settings")
async def get_settings(
    site_id: str,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Get site settings.

    Returns settings object for the site if user is the owner.
    """
    from dynamodb_client import get_dynamodb_table
    from dynamodb_repository import get_site as get_site_db

    try:
        table = await get_dynamodb_table()
        site = await get_site_db(table, site_id)

        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site '{site_id}' not found"
            )

        # Verify ownership
        if site.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this site's settings"
            )

        settings = site.get("settings", {})

        return {
            "data": settings,
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get site settings: {str(e)}"
        )


@router.put("/{site_id}/settings")
async def update_settings(
    site_id: str,
    settings_data: dict,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Update site settings.

    Saves settings object for the site.
    """
    from dynamodb_client import get_dynamodb_table
    from dynamodb_repository import get_site as get_site_db

    try:
        table = await get_dynamodb_table()
        site = await get_site_db(table, site_id)

        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site '{site_id}' not found"
            )

        # Verify ownership
        if site.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this site's settings"
            )

        # Update settings in DynamoDB
        now = datetime.utcnow().isoformat() + "Z"
        await table.update_item(
            Key={"PK": f"SITE#{site_id}", "SK": "METADATA"},
            UpdateExpression="SET settings = :settings, updated_at = :now",
            ExpressionAttributeValues={
                ":settings": settings_data,
                ":now": now
            }
        )

        # Fetch updated site
        updated_site = await get_site_db(table, site_id)
        updated_settings = updated_site.get("settings", {})

        return {
            "data": updated_settings,
            "meta": {
                "timestamp": now,
                "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update site settings: {str(e)}"
        )


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
    try:
        from dynamodb_client import get_dynamodb_table
        from dynamodb_repository import get_site as get_site_db

        table = await get_dynamodb_table()
        site = await get_site_db(table, site_id)

        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site '{site_id}' not found"
            )

        if site.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to create content for this site"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify site: {str(e)}"
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
    try:
        from dynamodb_client import get_dynamodb_table
        from dynamodb_repository import get_site as get_site_db

        table = await get_dynamodb_table()
        site = await get_site_db(table, site_id)

        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site '{site_id}' not found"
            )

        if site.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to read content for this site"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify site: {str(e)}"
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
    try:
        from dynamodb_client import get_dynamodb_table
        from dynamodb_repository import get_site as get_site_db

        table = await get_dynamodb_table()
        site = await get_site_db(table, site_id)

        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site '{site_id}' not found"
            )

        if site.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to read content for this site"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify site: {str(e)}"
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
    try:
        from dynamodb_client import get_dynamodb_table
        from dynamodb_repository import get_site as get_site_db

        table = await get_dynamodb_table()
        site = await get_site_db(table, site_id)

        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site '{site_id}' not found"
            )

        if site.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update content for this site"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify site: {str(e)}"
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
    try:
        from dynamodb_client import get_dynamodb_table
        from dynamodb_repository import get_site as get_site_db

        table = await get_dynamodb_table()
        site = await get_site_db(table, site_id)

        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site '{site_id}' not found"
            )

        if site.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete content for this site"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify site: {str(e)}"
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
        from dynamodb_client import get_dynamodb_table
        from dynamodb_repository import get_site as get_site_db

        # Verify site exists and belongs to user
        table = await get_dynamodb_table()
        site = await get_site_db(table, site_id)

        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site '{site_id}' not found"
            )

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


# Build Job Endpoints

@router.post("/{site_id}/build", status_code=status.HTTP_202_ACCEPTED)
async def trigger_build(
    site_id: str,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Trigger a build for a site.

    Returns 202 Accepted with job_id and polling URL.
    The actual build happens asynchronously via Lambda.

    REQUIREMENT: [ ] `POST /api/sites/{id}/build` - Trigger build
    REQUIREMENT: [ ] Validates user owns the site
    REQUIREMENT: [ ] Create build job record in DynamoDB
    REQUIREMENT: [ ] Invoke build Lambda asynchronously
    """
    try:
        from dynamodb_client import get_dynamodb_table
        from dynamodb_repository import create_build_job, invoke_lambda_async, get_site as get_site_db

        # Verify site exists and belongs to user
        table = await get_dynamodb_table()
        site = await get_site_db(table, site_id)

        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site '{site_id}' not found"
            )

        # Verify ownership
        if site.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this site"
            )

        # Create build job in DynamoDB
        table = await get_dynamodb_table()
        build_job = await create_build_job(
            table=table,
            site_id=site_id,
            user_did=user_id,
            trigger="manual"
        )

        # Invoke Lambda asynchronously
        try:
            invoke_lambda_async(
                job_id=build_job["job_id"],
                site_id=site_id,
                user_did=user_id
            )
        except Exception as e:
            # Log error but don't fail the request - job is queued
            print(f"Warning: Failed to invoke Lambda: {str(e)}")

        return {
            "data": {
                "job_id": build_job["job_id"],
                "status": build_job["status"],
                "site_id": site_id,
                "started_at": build_job["started_at"],
                "poll_url": f"/api/sites/{site_id}/builds/{build_job['job_id']}"
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to trigger build: {str(e)}"
        )


@router.get("/{site_id}/builds/{job_id}")
async def get_build_status(
    site_id: str,
    job_id: str,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Get status of a specific build job.

    REQUIREMENT: [ ] `GET /api/sites/{id}/builds/{job_id}` - Get build status
    ACCEPTANCE CRITERIA: [ ] Status polling works
    """
    try:
        from dynamodb_client import get_dynamodb_table
        from dynamodb_repository import get_build_job, get_site as get_site_db

        # Verify site exists and belongs to user
        table = await get_dynamodb_table()
        site = await get_site_db(table, site_id)

        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site '{site_id}' not found"
            )

        # Verify ownership
        if site.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this site"
            )

        # Get build job from DynamoDB
        table = await get_dynamodb_table()
        build_job = await get_build_job(table, site_id, job_id)

        if not build_job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Build job '{job_id}' not found"
            )

        # Verify build job belongs to this site
        if build_job.get("site_id") != site_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Build job does not belong to this site"
            )

        return {
            "data": {
                "job_id": build_job["job_id"],
                "site_id": build_job["site_id"],
                "status": build_job["status"],
                "started_at": build_job["started_at"],
                "completed_at": build_job.get("completed_at"),
                "duration_seconds": build_job.get("duration_seconds"),
                "output_url": build_job.get("output_url"),
                "error": build_job.get("error"),
                "error_stage": build_job.get("error_stage"),
                "trigger": build_job.get("trigger", "manual"),
                "content_count": build_job.get("content_count")
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get build status: {str(e)}"
        )


@router.get("/{site_id}/builds")
async def list_builds(
    site_id: str,
    user_id: str = Depends(get_current_user),
    limit: int = Query(100, ge=1, le=1000)
) -> dict:
    """
    List all build jobs for a site.

    ACCEPTANCE CRITERIA: [ ] Status polling works (list builds)
    """
    try:
        from dynamodb_client import get_dynamodb_table
        from dynamodb_repository import list_build_jobs_for_site, get_site as get_site_db

        # Verify site exists and belongs to user
        table = await get_dynamodb_table()
        site = await get_site_db(table, site_id)

        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site '{site_id}' not found"
            )

        # Verify ownership
        if site.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this site"
            )

        # Get build jobs from DynamoDB
        table = await get_dynamodb_table()
        builds, next_key = await list_build_jobs_for_site(
            table=table,
            site_id=site_id,
            limit=limit
        )

        return {
            "data": [
                {
                    "job_id": build["job_id"],
                    "site_id": build["site_id"],
                    "status": build["status"],
                    "started_at": build["started_at"],
                    "completed_at": build.get("completed_at"),
                    "duration_seconds": build.get("duration_seconds"),
                    "output_url": build.get("output_url"),
                    "error": build.get("error"),
                    "error_stage": build.get("error_stage"),
                    "trigger": build.get("trigger", "manual"),
                    "content_count": build.get("content_count")
                }
                for build in builds
            ],
            "pagination": {
                "next_key": next_key
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list builds: {str(e)}"
        )


# ============================================================================
# Site Export Endpoints (SSG-018)
# ============================================================================


async def download_site_files_from_s3(user_did: str, site_id: str) -> List[Tuple[str, bytes]]:
    """
    Download all built static files from S3.

    Args:
        user_did: User's BlueSky DID
        site_id: Site ID

    Returns:
        List of (relative_path, content) tuples

    Raises:
        ClientError: If S3 operation fails
    """
    s3_bucket = os.getenv("S3_BUCKET", "nbhd-city-sites")
    aws_region = os.getenv("AWS_REGION", "us-east-1")
    prefix = f"sites/{user_did}/{site_id}/"

    files = []
    session = aioboto3.Session()

    try:
        async with session.client("s3", region_name=aws_region) as s3_client:
            paginator = s3_client.get_paginator("list_objects_v2")
            pages = paginator.paginate(Bucket=s3_bucket, Prefix=prefix)

            async for page in pages:
                if "Contents" not in page:
                    continue

                for obj in page["Contents"]:
                    # Skip the prefix itself
                    if obj["Key"] == prefix or obj["Key"].endswith("/"):
                        continue

                    # Get relative path (remove prefix)
                    relative_path = obj["Key"][len(prefix):]

                    # Download file
                    response = await s3_client.get_object(Bucket=s3_bucket, Key=obj["Key"])
                    content = await response["Body"].read()

                    files.append((relative_path, content))

    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download site files: {str(e)}"
        )

    return files


async def fetch_site_content_records(user_did: str, site_id: str) -> Dict[str, List[Dict]]:
    """
    Fetch all content records (posts and pages) for a site from DynamoDB.

    Args:
        user_did: User's BlueSky DID
        site_id: Site ID

    Returns:
        Dictionary with "posts" and "pages" keys containing records

    Raises:
        Exception: If DynamoDB operation fails
    """
    from dynamodb_client import get_table

    try:
        async with get_table() as table:
            # Query blog posts
            posts_response = await table.query(
                KeyConditionExpression=Key("PK").eq(f"USER#{user_did}") &
                Key("SK").begins_with("RECORD#app.nbhd.blog.post#"),
                FilterExpression=Attr("value.site_id").eq(site_id)
            )

            posts = posts_response.get("Items", [])

            # Query pages
            pages_response = await table.query(
                KeyConditionExpression=Key("PK").eq(f"USER#{user_did}") &
                Key("SK").begins_with("RECORD#app.nbhd.blog.page#"),
                FilterExpression=Attr("value.site_id").eq(site_id)
            )

            pages = pages_response.get("Items", [])

            return {
                "posts": posts,
                "pages": pages
            }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch content records: {str(e)}"
        )


def generate_deployment_readme(site: Dict) -> str:
    """
    Generate a README with deployment instructions.

    Args:
        site: Site configuration dictionary

    Returns:
        Markdown content for README
    """
    site_name = site.get("name", "My Site")
    template_id = site.get("template_id", "blog")
    export_date = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    readme = f"""# {site_name}

Exported from nbhd.city on {export_date}

## Quick Start

This is a static site built with [11ty](https://www.11ty.dev/). Extract this archive and follow the deployment instructions below for your hosting platform.

### Directory Structure

- `/site/` - Built HTML, CSS, and JavaScript files (ready to deploy)
- `/content/` - Original content files (backup)
  - `posts.json` - All blog posts
  - `pages.json` - All pages
- `/config/site.json` - Site configuration

## Deployment Options

### 1. Netlify (Easiest)

1. Go to [netlify.com](https://netlify.com)
2. Sign in or create a free account
3. Click "Add new site" → "Deploy manually"
4. Drag and drop the `/site` folder
5. Your site will be live in seconds!

### 2. Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Upload the `/site` folder
4. Configure as "Other" static site (no build command needed)
5. Deploy

### 3. GitHub Pages

1. Create a new GitHub repository
2. Clone it locally
3. Copy the contents of `/site` into the repository
4. Push to GitHub:
   ```bash
   git add .
   git commit -m "Deploy site"
   git push origin main
   ```
5. Go to repository Settings → Pages
6. Set source to "main" branch
7. Your site will be published at `https://username.github.io/repository-name`

### 4. AWS S3 + CloudFront

1. Create an S3 bucket
2. Upload the `/site` contents
3. Enable static website hosting in bucket settings
4. (Optional) Create a CloudFront distribution for faster delivery

### 5. Generic Static Host (Netlify, Surge, etc.)

Any static hosting service works. Upload the contents of `/site` and you're done.

## Your Content

Your original content is preserved in the `/content` directory:

- `posts.json` - All your blog posts
- `pages.json` - All your pages

You can use this as a backup or reference when migrating content to another platform.

## Site Configuration

See `/config/site.json` for site metadata and settings.

## Need Help?

- [11ty Documentation](https://www.11ty.dev/docs/)
- [Static Site Hosting Guides](https://www.11ty.dev/docs/deployment/)
- [nbhd.city Help](https://nbhd.city)

---

Template: {template_id}
"""

    return readme


def create_site_zip(
    site_files: List[Tuple[str, bytes]],
    content_records: Dict[str, List[Dict]],
    site_config: Dict,
    readme_content: str
) -> io.BytesIO:
    """
    Create an in-memory ZIP archive with all site files and content.

    Args:
        site_files: List of (relative_path, content) tuples from S3
        content_records: Dictionary with "posts" and "pages" keys
        site_config: Site configuration dictionary
        readme_content: README markdown content

    Returns:
        BytesIO buffer containing ZIP archive
    """
    buffer = io.BytesIO()

    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        # Add README
        zf.writestr("README.md", readme_content)

        # Add built site files
        for relative_path, content in site_files:
            zf.writestr(f"site/{relative_path}", content)

        # Add content records as JSON
        zf.writestr(
            "content/posts.json",
            json.dumps(content_records.get("posts", []), indent=2)
        )
        zf.writestr(
            "content/pages.json",
            json.dumps(content_records.get("pages", []), indent=2)
        )

        # Add site configuration
        zf.writestr(
            "config/site.json",
            json.dumps(site_config, indent=2)
        )

    buffer.seek(0)
    return buffer


@router.get("/{site_id}/export")
async def export_site(
    site_id: str,
    user_id: str = Depends(get_current_user)
) -> StreamingResponse:
    """
    Export a complete static site as a downloadable ZIP file.

    Includes:
    - All built static files (HTML, CSS, JS)
    - Original content from DynamoDB (posts, pages)
    - Site configuration
    - Deployment instructions README

    Returns:
        ZIP file as StreamingResponse

    Raises:
        404: Site not found
        403: User is not the owner
        400: Site has not been built yet
    """
    try:
        # Validate site exists and user owns it
        from dynamodb_client import get_dynamodb_table
        from dynamodb_repository import get_site as get_site_db

        table = await get_dynamodb_table()
        site = await get_site_db(table, site_id)

        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Site not found"
            )

        if site.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to export this site"
            )

        # Download S3 files
        site_files = await download_site_files_from_s3(user_id, site_id)

        if not site_files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Site must be built before export"
            )

        # Fetch content records from DynamoDB
        content_records = await fetch_site_content_records(user_id, site_id)

        # Generate README
        readme_content = generate_deployment_readme(site)

        # Create ZIP archive
        zip_buffer = create_site_zip(
            site_files,
            content_records,
            site,
            readme_content
        )

        # Return as streaming response
        return StreamingResponse(
            iter([zip_buffer.getvalue()]),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=\"{site_id}-export.zip\""
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create export: {str(e)}"
        )
