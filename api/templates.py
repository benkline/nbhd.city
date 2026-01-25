from fastapi import APIRouter, HTTPException, Query, status
from models import (
    TemplateResponse,
    TemplateSchemaResponse,
    CustomTemplateCreate,
    CustomTemplateRegistrationResponse,
    CustomTemplateStatusResponse,
    TemplateContentTypesResponse,
)
from datetime import datetime
from typing import List, Optional
import uuid
import re
from urllib.parse import urlparse

router = APIRouter(prefix="/api/templates", tags=["templates"])

# Store for custom templates (in-memory for now, would be DynamoDB in production)
CUSTOM_TEMPLATES = {}

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


# URL Validation Functions

def validate_github_url(url: str) -> tuple[bool, Optional[str]]:
    """
    Validate GitHub URL format.

    Allowed domains: github.com, gitlab.com, bitbucket.org
    Must be HTTPS or valid git@ format.

    Returns: (is_valid, error_message)
    """
    if not url:
        return False, "GitHub URL is required"

    # Normalize URL - convert git@ to https://
    normalized_url = url
    if url.startswith("git@"):
        # Convert git@github.com:user/repo.git to https://github.com/user/repo
        match = re.match(r"git@([^:]+):(.+?)(?:\.git)?$", url)
        if match:
            domain, path = match.groups()
            normalized_url = f"https://{domain}/{path}"
        else:
            return False, "Invalid git@ URL format"

    # Parse URL
    try:
        parsed = urlparse(normalized_url)
    except Exception:
        return False, "Invalid URL format"

    # Check protocol
    if parsed.scheme not in ["https", "http"]:
        return False, "URL must use https:// or http://"

    # Reject http (should be https)
    if parsed.scheme == "http":
        return False, "URL must use https://"

    # Check domain
    allowed_domains = ["github.com", "gitlab.com", "bitbucket.org"]
    domain = parsed.netloc.lower()

    if domain not in allowed_domains:
        # Reject localhost and internal IPs
        if domain.startswith("localhost") or domain.startswith("127."):
            return False, "Localhost URLs are not allowed"
        if re.match(r"^192\.168\.", domain) or re.match(r"^10\.", domain):
            return False, "Internal IP addresses are not allowed"
        return False, f"Domain must be one of: {', '.join(allowed_domains)}"

    # Check path (should have user/repo)
    path_parts = [p for p in parsed.path.split("/") if p]
    if len(path_parts) < 2:
        return False, "URL must include user/repository (e.g., github.com/user/repo)"

    return True, None


# Custom Template Endpoints

@router.post("/custom", status_code=status.HTTP_202_ACCEPTED)
async def register_custom_template(template: CustomTemplateCreate) -> dict:
    """
    Register a custom 11ty template from GitHub.

    - **name**: Name of the template
    - **github_url**: GitHub URL (https://github.com/user/repo)
    - **is_public**: Whether template is public or private

    Returns 202 Accepted with template_id for polling status.

    Requirement: [ ] `POST /api/templates/custom` - Register template from GitHub URL
    Acceptance: [ ] Valid GitHub URLs accepted, Returns 202 Accepted with template_id
    """
    # Validate required fields
    if not template.name or not template.name.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Template name is required"
        )

    if not template.github_url or not template.github_url.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="GitHub URL is required"
        )

    # Validate GitHub URL
    # Requirement: [ ] GitHub URL validation (github.com, gitlab.com, bitbucket.org)
    is_valid, error_msg = validate_github_url(template.github_url)
    if not is_valid:
        # Requirement: [ ] Invalid URLs rejected with error
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=error_msg or "Invalid GitHub URL"
        )

    # Check if already registered (by github_url)
    for stored_id, stored_template in CUSTOM_TEMPLATES.items():
        if stored_template.get("github_url") == template.github_url:
            # Return existing template (could also return 409 Conflict)
            return {
                "data": {
                    "template_id": stored_id,
                    "status": stored_template.get("status", "analyzing"),
                    "message": "Template already registered",
                    "poll_url": f"/api/templates/custom/{stored_id}/status"
                },
                "meta": {
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
                }
            }

    # Create template record
    template_id = str(uuid.uuid4())

    # Store in-memory (would be DynamoDB in production)
    # Requirement: [ ] Store template metadata in DynamoDB
    CUSTOM_TEMPLATES[template_id] = {
        "template_id": template_id,
        "name": template.name,
        "github_url": template.github_url,
        "is_public": template.is_public,
        "status": "analyzing",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "owner_did": None,  # Would be set from auth context
        "is_custom": True
    }

    # TODO: Invoke analyzer Lambda asynchronously
    # Requirement: [ ] Async invocation of analyzer Lambda

    # Return 202 Accepted
    # Requirement: [ ] Returns 202 Accepted with template_id
    # Acceptance: [ ] Returns 202 Accepted with template_id
    return {
        "data": {
            "template_id": template_id,
            "status": "analyzing",
            "message": "Template analysis started",
            "poll_url": f"/api/templates/custom/{template_id}/status"
        },
        "meta": {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
        }
    }


@router.get("/custom/{template_id}/status")
async def get_custom_template_status(template_id: str) -> dict:
    """
    Get analysis status of a custom template.

    Requirement: [ ] `GET /api/templates/custom/{id}/status` - Check analysis status
    Acceptance: [ ] Status polling works correctly
    """
    # Check if template exists
    if template_id not in CUSTOM_TEMPLATES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found"
        )

    template = CUSTOM_TEMPLATES[template_id]
    status_value = template.get("status", "analyzing")

    response_data = {
        "template_id": template_id,
        "status": status_value,
    }

    # Add status-specific fields
    if status_value == "analyzing":
        response_data["progress"] = template.get("progress", 0.0)
        response_data["message"] = template.get("message", "Analyzing template...")
    elif status_value == "ready":
        response_data["schema"] = template.get("schema")
        response_data["content_types"] = template.get("content_types")
    elif status_value == "failed":
        response_data["error"] = template.get("error", "Analysis failed")

    return {
        "data": response_data,
        "meta": {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
        }
    }


@router.get("/{template_id}/content-types")
async def get_template_content_types(template_id: str) -> dict:
    """
    Get inferred content types for a template.

    Requirement: [ ] `GET /api/templates/{id}/content-types` - Get inferred content types
    """
    # Check custom templates first
    if template_id in CUSTOM_TEMPLATES:
        template = CUSTOM_TEMPLATES[template_id]
        content_types = template.get("content_types", {})

        return {
            "data": {
                "template_id": template_id,
                "content_types": content_types
            },
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
            }
        }

    # Check built-in templates
    template = get_template_by_id(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found"
        )

    # For built-in templates, construct content types from schema
    schema = template.get("schema", {})
    content_types = {
        "default": {
            "directory": "content",
            "schema": schema
        }
    }

    return {
        "data": {
            "template_id": template_id,
            "content_types": content_types
        },
        "meta": {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
        }
    }
