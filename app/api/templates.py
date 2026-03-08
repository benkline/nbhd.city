from fastapi import APIRouter, HTTPException, Query, Depends, status
from models import (
    TemplateResponse,
    TemplateSchemaResponse,
    CustomTemplateCreate,
    CustomTemplateRegistrationResponse,
    CustomTemplateStatusResponse,
    TemplateContentTypesResponse,
)
from auth import get_current_user
from dynamodb_client import get_table
from dynamodb_repository import create_template_analysis, get_template_analysis_status, get_user_custom_templates
from datetime import datetime
from typing import List, Optional
from decimal import Decimal
import uuid
import re
from urllib.parse import urlparse
import boto3
import os
import json
import logging

logger = logging.getLogger(__name__)

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


# SSG-020: Template Analysis Endpoints
# NOTE: These routes MUST come before /{template_id} routes to avoid parameter capture


@router.post("/analyze-url", status_code=status.HTTP_202_ACCEPTED)
async def analyze_template_url(
    request_body: dict,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Analyze an 11ty template from a GitHub URL.

    - **github_url**: GitHub repository URL (https://github.com/user/repo)

    Returns 202 Accepted with template_id for polling status.

    REQUIREMENT: [x] POST /api/templates/analyze-url endpoint
    REQUIREMENT: [x] Validates GitHub URL format
    REQUIREMENT: [x] Creates template record in DynamoDB
    REQUIREMENT: [x] Invokes template_analyzer Lambda asynchronously
    REQUIREMENT: [x] Returns 202 Accepted with template_id
    """
    # Extract and validate input
    github_url = request_body.get("github_url", "").strip()

    if not github_url:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="github_url is required"
        )

    # Validate GitHub URL
    is_valid, error_msg = validate_github_url(github_url)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=error_msg or "Invalid GitHub URL"
        )

    # Create template ID and analysis job
    template_id = str(uuid.uuid4())
    template_name = github_url.split("/")[-1].replace(".git", "")

    # Store in DynamoDB
    async with get_table() as table:
        await create_template_analysis(table, template_id, github_url, user_id)

    # Invoke Lambda asynchronously
    invoke_template_analyzer_async(template_id, github_url, template_name)

    # Return 202 Accepted
    return {
        "data": {
            "template_id": template_id,
            "status": "analyzing",
            "message": "Template analysis started",
            "poll_url": f"/api/templates/{template_id}/analysis-status"
        },
        "meta": {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
        }
    }


@router.get("/{template_id}/analysis-status")
async def get_template_analysis_status_endpoint(
    template_id: str,
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Get the analysis status of a template.

    Returns current progress, inferred schema, and content types when complete.

    REQUIREMENT: [x] GET /api/templates/{template_id}/analysis-status endpoint
    REQUIREMENT: [x] Returns job progress (0-1.0)
    REQUIREMENT: [x] Returns content types when analysis completes
    REQUIREMENT: [x] Returns error if analysis failed
    """
    async with get_table() as table:
        record = await get_template_analysis_status(table, template_id)

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found"
        )

    # Build response with status-specific fields
    status_value = record.get("status", "analyzing")
    response_data = {
        "template_id": template_id,
        "status": status_value,
    }

    if status_value == "analyzing":
        response_data["progress"] = record.get("progress", 0.0)
        response_data["message"] = record.get("message", "Analyzing template...")
    elif status_value == "ready":
        response_data["schema"] = record.get("schema")
        response_data["content_types"] = record.get("content_types")
        response_data["message"] = "Analysis complete"
    elif status_value == "failed":
        response_data["error"] = record.get("error", "Analysis failed")

    return {
        "data": response_data,
        "meta": {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
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


# Lambda Invocation Helper

def invoke_template_analyzer_async(template_id: str, github_url: str, template_name: str) -> bool:
    """
    Invoke the template analyzer Lambda function asynchronously.

    In development mode (when using local DynamoDB), runs the analyzer
    directly. In production, invokes AWS Lambda.

    REQUIREMENT: [ ] Async invocation of analyzer Lambda

    Args:
        template_id: UUID of the template being analyzed
        github_url: GitHub URL of the template repository
        template_name: Name of the template

    Returns:
        bool: True if invocation successful, False otherwise
    """
    # Check if we're in development mode (using local DynamoDB)
    is_dev = os.getenv('DYNAMODB_ENDPOINT_URL', '').startswith('http://')

    if is_dev:
        # Development mode: run analyzer in background thread
        import threading

        def run_analyzer_in_thread():
            try:
                # Import modules using importlib for dynamic loading
                import importlib.util
                import sys
                import os

                # Use print() for diagnostic output so it shows in Docker logs
                print(f"\n{'='*60}")
                print(f"[ANALYZER {template_id}] Starting path resolution")
                print(f"[ANALYZER {template_id}] CWD: {os.getcwd()}")
                print(f"[ANALYZER {template_id}] __file__: {__file__}")
                print(f"{'='*60}")

                # Check if path exists
                docker_path = '/app/lambda/template_analyzer'
                app_lambda_exists = os.path.exists(docker_path)
                print(f"[ANALYZER {template_id}] {docker_path} exists: {app_lambda_exists}")

                # Debug: list /app directory contents
                if os.path.exists('/app'):
                    app_contents = os.listdir('/app')
                    print(f"[ANALYZER {template_id}] /app contents: {app_contents}")

                if os.path.exists('/app/lambda'):
                    lambda_contents = os.listdir('/app/lambda')
                    print(f"[ANALYZER {template_id}] /app/lambda contents: {lambda_contents}")

                if app_lambda_exists:
                    lambda_base = docker_path
                    print(f"[ANALYZER {template_id}] ✓ Using Docker path: {lambda_base}")
                else:
                    # Local development - try relative path
                    lambda_base = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'lambda', 'template_analyzer'))
                    print(f"[ANALYZER {template_id}] Using local path: {lambda_base}")
                    print(f"[ANALYZER {template_id}] Local path exists: {os.path.exists(lambda_base)}")

                # Load analyzer module dynamically
                print(f"\n[ANALYZER {template_id}] Loading modules from {lambda_base}...")

                analyzer_path = os.path.join(lambda_base, "analyzer.py")
                print(f"[ANALYZER {template_id}] analyzer_path: {analyzer_path}")
                print(f"[ANALYZER {template_id}] analyzer.py exists: {os.path.exists(analyzer_path)}")

                try:
                    spec = importlib.util.spec_from_file_location("analyzer", analyzer_path)
                    print(f"[ANALYZER {template_id}] spec created: {spec is not None}")
                    if spec is None:
                        raise Exception(f"spec_from_file_location returned None for {analyzer_path}")

                    analyzer_module = importlib.util.module_from_spec(spec)
                    print(f"[ANALYZER {template_id}] module from spec created")

                    spec.loader.exec_module(analyzer_module)
                    print(f"[ANALYZER {template_id}] ✓ analyzer module loaded successfully")
                    analyze_template = analyzer_module.analyze_template
                except Exception as e:
                    print(f"[ANALYZER {template_id}] ✗ ERROR loading analyzer module: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    raise

                # Load clone module
                print(f"[ANALYZER {template_id}] Loading clone module...")
                clone_path = os.path.join(lambda_base, "clone.py")
                print(f"[ANALYZER {template_id}] clone_path: {clone_path}, exists: {os.path.exists(clone_path)}")

                try:
                    spec = importlib.util.spec_from_file_location("clone", clone_path)
                    clone_module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(clone_module)
                    clone_repository = clone_module.clone_repository
                    cleanup_directory = clone_module.cleanup_directory
                    get_commit_sha = clone_module.get_commit_sha
                    print(f"[ANALYZER {template_id}] ✓ clone module loaded successfully")
                except Exception as e:
                    print(f"[ANALYZER {template_id}] ✗ ERROR loading clone module: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    raise

                # Load validator module
                print(f"[ANALYZER {template_id}] Loading validator module...")
                validator_path = os.path.join(lambda_base, "validator.py")
                print(f"[ANALYZER {template_id}] validator_path: {validator_path}, exists: {os.path.exists(validator_path)}")

                try:
                    spec = importlib.util.spec_from_file_location("validator", validator_path)
                    validator_module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(validator_module)
                    validate_eleventy_project = validator_module.validate_eleventy_project
                    print(f"[ANALYZER {template_id}] ✓ validator module loaded successfully")
                except Exception as e:
                    print(f"[ANALYZER {template_id}] ✗ ERROR loading validator module: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    raise

                print(f"[ANALYZER {template_id}] Importing dependencies...")
                try:
                    from dynamodb_client import get_table
                    from datetime import datetime
                    import tempfile
                    import uuid
                    import asyncio
                    print(f"[ANALYZER {template_id}] ✓ All dependencies imported")
                except Exception as e:
                    print(f"[ANALYZER {template_id}] ✗ ERROR importing dependencies: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    raise

                # Now run the analysis
                build_dir = os.path.join(tempfile.gettempdir(), str(uuid.uuid4()))
                print(f"[ANALYZER {template_id}] Build dir: {build_dir}")

                async def analyze():
                    import time
                    start_time = time.time()
                    print(f"[ANALYZER {template_id}] Starting async analyze function...")

                    async with get_table() as table:
                        print(f"[ANALYZER {template_id}] Got DynamoDB table connection")
                        # Update status: Starting
                        logger.info(f"\n[{template_id}] ===== STARTING ANALYSIS FLOW =====")
                        logger.info(f"[{template_id}] GitHub URL: {github_url}")
                        logger.info(f"[{template_id}] Build dir: {build_dir}")

                        await table.update_item(
                            Key={"PK": f"TEMPLATE#{template_id}", "SK": "ANALYSIS"},
                            UpdateExpression="SET #status = :status, progress = :progress, #message = :message",
                            ExpressionAttributeNames={"#status": "status", "#message": "message"},
                            ExpressionAttributeValues={":status": "analyzing", ":progress": Decimal("0.1"), ":message": "Starting analysis..."}
                        )

                        try:
                            # Clone repository
                            elapsed = time.time() - start_time
                            msg = f"[{template_id}] PHASE 1: Clone (elapsed: {elapsed:.1f}s)"
                            logger.info(msg)
                            print(msg)
                            print(f"[{template_id}] Calling clone_repository({github_url}, {build_dir})...")
                            success, error = clone_repository(github_url, build_dir)
                            print(f"[{template_id}] clone_repository returned: success={success}, error={error}")
                            if not success:
                                elapsed = time.time() - start_time
                                err_msg = f"[{template_id}] ✗ Clone FAILED: {error} (elapsed: {elapsed:.1f}s)"
                                logger.info(err_msg)
                                print(err_msg)
                                await table.update_item(
                                    Key={"PK": f"TEMPLATE#{template_id}", "SK": "ANALYSIS"},
                                    UpdateExpression="SET #status = :status, #error = :error",
                                    ExpressionAttributeNames={"#status": "status", "#error": "error"},
                                    ExpressionAttributeValues={":status": "failed", ":error": error}
                                )
                                return

                            elapsed = time.time() - start_time
                            logger.info(f"[{template_id}] ✓ Clone COMPLETE (elapsed: {elapsed:.1f}s)")
                            print(f"[{template_id}] ✓ Clone COMPLETE (elapsed: {elapsed:.1f}s)")

                            # Validate 11ty project
                            elapsed = time.time() - start_time
                            msg = f"[{template_id}] PHASE 2: Validate (elapsed: {elapsed:.1f}s)"
                            logger.info(msg)
                            print(msg)
                            print(f"[{template_id}] Calling validate_eleventy_project({build_dir})...")
                            is_valid, error = validate_eleventy_project(build_dir)
                            print(f"[{template_id}] validate_eleventy_project returned: is_valid={is_valid}, error={error}")
                            if not is_valid:
                                elapsed = time.time() - start_time
                                logger.info(f"[{template_id}] ✗ Validation FAILED: {error} (elapsed: {elapsed:.1f}s)")
                                await table.update_item(
                                    Key={"PK": f"TEMPLATE#{template_id}", "SK": "ANALYSIS"},
                                    UpdateExpression="SET #status = :status, #error = :error",
                                    ExpressionAttributeNames={"#status": "status", "#error": "error"},
                                    ExpressionAttributeValues={":status": "failed", ":error": error}
                                )
                                return

                            elapsed = time.time() - start_time
                            logger.info(f"[{template_id}] ✓ Validation COMPLETE (elapsed: {elapsed:.1f}s)")

                            # Analyze template
                            elapsed = time.time() - start_time
                            msg = f"[{template_id}] PHASE 3: Analyze (elapsed: {elapsed:.1f}s)"
                            logger.info(msg)
                            print(msg)
                            print(f"[{template_id}] Calling analyze_template({build_dir})...")
                            result = analyze_template(build_dir, validate_eleventy_project)
                            print(f"[{template_id}] analyze_template returned: {result.get('status')}")
                            if result.get("error"):
                                elapsed = time.time() - start_time
                                logger.info(f"[{template_id}] ✗ Analysis FAILED: {result.get('error')} (elapsed: {elapsed:.1f}s)")
                                await table.update_item(
                                    Key={"PK": f"TEMPLATE#{template_id}", "SK": "ANALYSIS"},
                                    UpdateExpression="SET #status = :status, #error = :error",
                                    ExpressionAttributeNames={"#status": "status", "#error": "error"},
                                    ExpressionAttributeValues={":status": "failed", ":error": result.get("error")}
                                )
                                return

                            elapsed = time.time() - start_time
                            logger.info(f"[{template_id}] ✓ Analysis COMPLETE (elapsed: {elapsed:.1f}s)")

                            # Get commit SHA
                            commit_sha = get_commit_sha(build_dir)

                            # Update with success
                            elapsed = time.time() - start_time
                            logger.info(f"[{template_id}] ✓✓✓ Analysis SUCCESSFUL (total time: {elapsed:.1f}s)")
                            logger.info(f"[{template_id}] Content types: {list(result.get('content_types', {}).keys())}")
                            logger.info(f"[{template_id}] ===== ANALYSIS COMPLETE =====\n")

                            print(f"[{template_id}] Updating DynamoDB with final status...")
                            try:
                                await table.update_item(
                                    Key={"PK": f"TEMPLATE#{template_id}", "SK": "ANALYSIS"},
                                    UpdateExpression="SET #status = :status, progress = :progress, analyzed_at = :analyzed, github_commit_sha = :sha, content_types = :types",
                                    ExpressionAttributeNames={"#status": "status"},
                                    ExpressionAttributeValues={
                                        ":status": "ready",
                                        ":progress": Decimal("1.0"),
                                        ":analyzed": datetime.utcnow().isoformat() + "Z",
                                        ":sha": commit_sha,
                                        ":types": result.get("content_types", {})
                                    }
                                )
                                print(f"[{template_id}] ✓ DynamoDB update successful - status now 'ready'")
                            except Exception as e:
                                print(f"[{template_id}] ✗ DynamoDB update FAILED: {str(e)}")
                                import traceback
                                traceback.print_exc()
                                raise
                        finally:
                            elapsed = time.time() - start_time
                            logger.info(f"[{template_id}] Cleaning up {build_dir}")
                            cleanup_directory(build_dir)
                            logger.info(f"[{template_id}] Cleanup complete (total elapsed: {elapsed:.1f}s)")

                print(f"[ANALYZER {template_id}] Creating asyncio event loop...")
                try:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    print(f"[ANALYZER {template_id}] Event loop created, running analyze()...")
                    loop.run_until_complete(analyze())
                    print(f"[ANALYZER {template_id}] ✓ analyze() completed successfully")
                except Exception as e:
                    print(f"[ANALYZER {template_id}] ✗ ERROR in event loop: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    raise

            except Exception as e:
                print(f"\n[ANALYZER {template_id}] FATAL ERROR: {str(e)}")
                import traceback
                traceback.print_exc()
                print(f"[ANALYZER {template_id}] Thread stopping due to error\n")

        # Start in background thread
        print(f"\n[INVOKE] Starting background analyzer thread for template {template_id}")
        print(f"[INVOKE] GitHub URL: {github_url}")
        thread = threading.Thread(target=run_analyzer_in_thread, daemon=True)
        thread.start()
        print(f"[INVOKE] Thread started, returning 202\n")
        return True
    else:
        # Production mode: invoke real AWS Lambda
        try:
            lambda_client = boto3.client(
                'lambda',
                region_name=os.getenv('AWS_REGION', 'us-east-1')
            )

            response = lambda_client.invoke(
                FunctionName=os.getenv('TEMPLATE_ANALYZER_LAMBDA_NAME', 'nbhd-city-template-analyzer'),
                InvocationType='Event',  # Async invocation
                Payload=json.dumps({
                    'template_id': template_id,
                    'github_url': github_url,
                    'template_name': template_name
                })
            )
            return True
        except Exception as e:
            # Log error but don't fail the request - Lambda will retry
            logger.info(f"Warning: Failed to invoke template analyzer Lambda: {str(e)}")
            return False


# Custom Template Endpoints

@router.post("/custom", status_code=status.HTTP_202_ACCEPTED)
async def register_custom_template(
    template: CustomTemplateCreate,
    user_id: str = None
) -> dict:
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
    # For dev mode: use test user if not authenticated
    effective_user_id = user_id or "did:plc:devuser"
    print(f"[REGISTER_CUSTOM] Creating template {template_id}, user_id={effective_user_id}")

    # Store in DynamoDB
    # Requirement: [x] Store template metadata in DynamoDB
    print(f"[REGISTER_CUSTOM] Calling create_template_analysis...")
    try:
        async with get_table() as table:
            await create_template_analysis(table, template_id, template.github_url, effective_user_id, template.name)
        print(f"[REGISTER_CUSTOM] ✓ create_template_analysis completed successfully")
    except Exception as e:
        print(f"[REGISTER_CUSTOM] ✗ create_template_analysis failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

    # Requirement: [x] Async invocation of analyzer Lambda
    print(f"[REGISTER_CUSTOM] Invoking analyzer...")
    invoke_template_analyzer_async(template_id, template.github_url, template.name)
    print(f"[REGISTER_CUSTOM] ✓ Analyzer invoked")

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


@router.get("/custom/user/list")
async def list_user_custom_templates(
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Get all custom templates for the current user that are ready to use.

    Returns templates where analysis has completed successfully with schema
    and content types inferred.
    """
    # Use the authenticated user ID
    effective_user_id = user_id
    try:
        async with get_table() as table:
            templates = await get_user_custom_templates(table, effective_user_id)

        return {
            "data": templates,
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
            }
        }
    except Exception as err:
        logger.error(f"Error listing user custom templates: {str(err)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve custom templates"
        )


@router.get("/custom/{template_id}/status")
async def get_custom_template_status(template_id: str) -> dict:
    """
    Get analysis status of a custom template.

    Requirement: [ ] `GET /api/templates/custom/{id}/status` - Check analysis status
    Acceptance: [ ] Status polling works correctly
    """
    # Try to read from DynamoDB first
    from dynamodb_client import get_table

    try:
        async with get_table() as table:
            response = await table.get_item(
                Key={"PK": f"TEMPLATE#{template_id}", "SK": "ANALYSIS"}
            )
            template = response.get("Item")
    except Exception:
        template = None

    # Fall back to in-memory if DynamoDB not available
    if not template and template_id in CUSTOM_TEMPLATES:
        template = CUSTOM_TEMPLATES[template_id]

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found"
        )

    status_value = template.get("status", "analyzing")

    response_data = {
        "template_id": template_id,
        "status": status_value,
    }

    # Add status-specific fields
    if status_value == "analyzing":
        progress = template.get("progress", Decimal("0.0"))
        # Convert Decimal to float for JSON serialization
        response_data["progress"] = float(progress) if isinstance(progress, Decimal) else progress
        response_data["message"] = template.get("message", "Analyzing template...")
    elif status_value == "ready":
        response_data["progress"] = 1.0  # Return full progress for ready state
        response_data["message"] = template.get("message", "Analysis complete!")
        response_data["schema"] = template.get("schema")
        response_data["content_types"] = template.get("content_types")
    elif status_value == "failed":
        response_data["error"] = template.get("error", "Analysis failed")
        response_data["message"] = template.get("error", "Analysis failed")

    return {
        "data": response_data,
        "meta": {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
        }
    }


@router.delete("/custom/{template_id}")
async def delete_custom_template(template_id: str) -> dict:
    """
    Delete a custom template from user's library.

    Removes the template from DynamoDB and makes it unavailable for site creation.

    Requirement: [ ] Users can delete their templates (SSG-028)
    """
    try:
        async with get_table() as table:
            # Delete both METADATA and ANALYSIS records
            await table.delete_item(Key={"PK": f"TEMPLATE#{template_id}", "SK": "METADATA"})
            await table.delete_item(Key={"PK": f"TEMPLATE#{template_id}", "SK": "ANALYSIS"})

            # Also delete CONTENT_TYPES and SAMPLES if they exist
            await table.delete_item(Key={"PK": f"TEMPLATE#{template_id}", "SK": "CONTENT_TYPES"})
            await table.delete_item(Key={"PK": f"TEMPLATE#{template_id}", "SK": "SAMPLES"})

        # Fall back to in-memory if needed
        if template_id in CUSTOM_TEMPLATES:
            del CUSTOM_TEMPLATES[template_id]

        return {
            "data": {
                "template_id": template_id,
                "status": "deleted"
            },
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
            }
        }
    except Exception as e:
        logger.error(f"Error deleting template {template_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete template"
        )


@router.post("/custom/{template_id}/reanalyze")
async def reanalyze_custom_template(template_id: str) -> dict:
    """
    Re-analyze a previously analyzed custom template.

    Resets the analysis status to "analyzing" and re-invokes the template analyzer Lambda.

    Requirement: [ ] Users can re-analyze templates
    """
    try:
        async with get_table() as table:
            # Get the template metadata to retrieve github_url
            metadata_response = await table.get_item(
                Key={"PK": f"TEMPLATE#{template_id}", "SK": "METADATA"}
            )
            metadata = metadata_response.get("Item")

            if not metadata:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Template not found"
                )

            github_url = metadata.get("github_url")

            # Reset analysis record to "analyzing"
            await table.update_item(
                Key={"PK": f"TEMPLATE#{template_id}", "SK": "ANALYSIS"},
                UpdateExpression="SET #status = :status, progress = :progress, message = :message, error = :null",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":status": "analyzing",
                    ":progress": Decimal("0.0"),
                    ":message": "Re-analysis queued",
                    ":null": None
                }
            )

            # Invoke analyzer again
            invoke_template_analyzer_async(template_id, github_url, metadata.get("template_id", template_id))

        return {
            "data": {
                "template_id": template_id,
                "status": "analyzing",
                "message": "Re-analysis started"
            },
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error re-analyzing template {template_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to re-analyze template"
        )


@router.patch("/custom/{template_id}")
async def update_custom_template(template_id: str, updates: dict) -> dict:
    """
    Update custom template metadata (name, description).

    Allows users to rename and update the description of their templates.

    Requirement: [ ] Users can rename their templates (SSG-028)
    """
    try:
        async with get_table() as table:
            # Get existing metadata
            metadata_response = await table.get_item(
                Key={"PK": f"TEMPLATE#{template_id}", "SK": "METADATA"}
            )
            metadata = metadata_response.get("Item")

            if not metadata:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Template not found"
                )

            # Build update expression for provided fields
            update_expr_parts = ["updated_at = :updated_at"]
            expr_values = {":updated_at": datetime.utcnow().isoformat() + "Z"}
            expr_names = {}

            if "name" in updates and updates["name"]:
                update_expr_parts.append("template_name = :name")
                expr_values[":name"] = updates["name"].strip()

            if "description" in updates and updates["description"]:
                update_expr_parts.append("description = :description")
                expr_values[":description"] = updates["description"].strip()

            if not (updates.get("name") or updates.get("description")):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="At least one of 'name' or 'description' must be provided"
                )

            # Update the METADATA record
            await table.update_item(
                Key={"PK": f"TEMPLATE#{template_id}", "SK": "METADATA"},
                UpdateExpression="SET " + ", ".join(update_expr_parts),
                ExpressionAttributeNames=expr_names if expr_names else None,
                ExpressionAttributeValues=expr_values
            )

            return {
                "data": {
                    "template_id": template_id,
                    "updated": updates,
                    "status": "updated"
                },
                "meta": {
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "request_id": "req-" + datetime.utcnow().strftime("%Y%m%d%H%M%S")
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating template {template_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update template"
        )


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
