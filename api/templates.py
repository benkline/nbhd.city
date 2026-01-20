from fastapi import APIRouter, HTTPException, Query, status
from models import TemplateResponse, TemplateSchemaResponse
from datetime import datetime
from typing import List

router = APIRouter(prefix="/api/templates", tags=["templates"])

# Mock template data - in production this would come from a database
TEMPLATES = [
    {
        "id": "blog",
        "name": "Blog",
        "description": "Personal blog template with posts, tags, and RSS",
        "author": "nbhd.city",
        "version": "1.0.0",
        "tags": ["blog", "content", "rss"],
        "preview_url": "/api/templates/blog/preview",
        "schema": {
            "type": "object",
            "properties": {
                "site_title": {
                    "type": "string",
                    "title": "Site Title",
                    "description": "The title of your blog"
                },
                "author": {
                    "type": "string",
                    "title": "Author Name",
                    "description": "Your name"
                },
                "description": {
                    "type": "string",
                    "title": "Site Description",
                    "description": "A brief description of your blog"
                },
                "accent_color": {
                    "type": "string",
                    "title": "Accent Color",
                    "description": "Primary color for the site (hex format)",
                    "pattern": "^#[0-9A-Fa-f]{6}$"
                }
            },
            "required": ["site_title", "author"]
        }
    },
    {
        "id": "project",
        "name": "Project Showcase",
        "description": "Team project page with gallery and contributors",
        "author": "nbhd.city",
        "version": "1.0.0",
        "tags": ["project", "portfolio", "team"],
        "preview_url": "/api/templates/project/preview",
        "schema": {
            "type": "object",
            "properties": {
                "project_name": {
                    "type": "string",
                    "title": "Project Name"
                },
                "description": {
                    "type": "string",
                    "title": "Project Description"
                },
                "team_members": {
                    "type": "array",
                    "title": "Team Members",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "role": {"type": "string"}
                        }
                    }
                }
            },
            "required": ["project_name"]
        }
    },
    {
        "id": "newsletter",
        "name": "Newsletter Archive",
        "description": "Email newsletter archive with latest and past issues",
        "author": "nbhd.city",
        "version": "1.0.0",
        "tags": ["newsletter", "email", "archive"],
        "preview_url": "/api/templates/newsletter/preview",
        "schema": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "title": "Newsletter Title"
                },
                "description": {
                    "type": "string",
                    "title": "Newsletter Description"
                },
                "signup_url": {
                    "type": "string",
                    "title": "Signup URL",
                    "format": "uri"
                }
            },
            "required": ["title"]
        }
    }
]


def get_template_by_id(template_id: str):
    """Helper function to find a template by ID"""
    for template in TEMPLATES:
        if template["id"] == template_id:
            return template
    return None


@router.get("")
async def list_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    type: str = Query(None),
    tags: str = Query(None)
) -> dict:
    """
    List all available 11ty templates.

    - **skip**: Number of templates to skip (pagination)
    - **limit**: Maximum number of templates to return
    - **type**: Filter by template type (optional)
    - **tags**: Filter by comma-separated tags (optional)

    Returns paginated list of template metadata.
    """
    # Filter templates if parameters provided
    filtered = TEMPLATES

    if type:
        filtered = [t for t in filtered if type.lower() in [tag.lower() for tag in t.get("tags", [])]]

    if tags:
        tag_list = [tag.strip().lower() for tag in tags.split(",")]
        filtered = [
            t for t in filtered
            if any(tag.lower() in tag_list for tag in t.get("tags", []))
        ]

    # Apply pagination
    total = len(filtered)
    templates = filtered[skip : skip + limit]

    # Remove full schema from list response
    templates_response = [
        {
            "id": t["id"],
            "name": t["name"],
            "description": t["description"],
            "author": t["author"],
            "version": t["version"],
            "tags": t["tags"],
            "preview_url": t.get("preview_url")
        }
        for t in templates
    ]

    return {
        "data": templates_response,
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


@router.get("/{template_id}")
async def get_template(template_id: str) -> dict:
    """
    Get single template details including metadata and schema.

    Returns template object with full schema for configuration.
    """
    template = get_template_by_id(template_id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found"
        )

    return {
        "data": {
            "id": template["id"],
            "name": template["name"],
            "description": template["description"],
            "author": template["author"],
            "version": template["version"],
            "tags": template["tags"],
            "preview_url": template.get("preview_url"),
            "schema": template.get("schema")
        },
        "meta": {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
        }
    }


@router.get("/{template_id}/schema")
async def get_template_schema(template_id: str) -> dict:
    """
    Get configuration schema for a template.

    Schema describes the configuration fields users need to fill in
    when creating a site from this template.
    """
    template = get_template_by_id(template_id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found"
        )

    return {
        "data": template.get("schema", {}),
        "meta": {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
        }
    }


@router.get("/{template_id}/preview")
async def get_template_preview(template_id: str):
    """
    Get template preview image.

    Returns a redirect to the preview image URL or the image data.
    """
    template = get_template_by_id(template_id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found"
        )

    preview_url = template.get("preview_url")
    if not preview_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Preview not available for template '{template_id}'"
        )

    # Return a placeholder PNG image for testing
    # In production, this would return actual template preview images
    return {
        "preview_url": preview_url,
        "template_id": template_id,
        "meta": {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
        }
    }
