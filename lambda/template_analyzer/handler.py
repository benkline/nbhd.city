"""
Lambda handler for template analysis.

Main entry point for AWS Lambda function that analyzes 11ty templates.
"""

import asyncio
import os
import uuid
import tempfile
import json
from typing import Dict, Any, Optional
from datetime import datetime

from validator import validate_eleventy_project
from analyzer import analyze_template
from clone import clone_repository, cleanup_directory, get_commit_sha


# Mock DynamoDB client (would be real boto3 in production)
class DynamoDBClient:
    """Mock DynamoDB client for testing."""

    async def update_template_status(
        self,
        template_id: str,
        status: str,
        progress: Optional[float] = None,
        error: Optional[str] = None,
        **kwargs
    ) -> bool:
        """Update template status in DynamoDB."""
        print(f"[STATUS] Template {template_id}: {status} "
              f"(progress: {progress}, error: {error})")
        return True

    async def update_template_record(
        self,
        template_id: str,
        updates: Dict[str, Any]
    ) -> bool:
        """Update template record in DynamoDB."""
        print(f"[RECORD] Template {template_id} updated with: {list(updates.keys())}")
        return True


# Global DynamoDB client
dynamodb = DynamoDBClient()


async def update_template_status(
    template_id: str,
    status: str,
    progress: Optional[float] = None,
    error: Optional[str] = None,
    message: Optional[str] = None
) -> None:
    """Update template analysis status in DynamoDB."""
    await dynamodb.update_template_status(
        template_id,
        status,
        progress=progress,
        error=error,
        message=message
    )


async def update_template_record(
    template_id: str,
    updates: Dict[str, Any]
) -> None:
    """Update template record in DynamoDB."""
    await dynamodb.update_template_record(template_id, updates)


async def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for analyzing 11ty templates.

    Event schema:
    {
        "template_id": "template-uuid-123",
        "github_url": "https://github.com/user/11ty-blog"
    }

    Requirement: [ ] Validate 11ty project (check eleventy.config.js, package.json)
    Requirement: [ ] Clone GitHub repo to /tmp (shallow clone)
    Requirement: [ ] Find content directory (content/, posts/, src/)
    Requirement: [ ] Scan all .md files and parse frontmatter
    Requirement: [ ] Group by content type (posts, pages, etc.)
    Requirement: [ ] Infer JSON schema from frontmatter samples
    Requirement: [ ] Store schema and content types in DynamoDB
    Requirement: [ ] Handle errors and update status

    Acceptance: [ ] Completes within 5 minute timeout
    Acceptance: [ ] Updates template status to "ready" or "failed"
    """
    template_id = event.get("template_id")
    github_url = event.get("github_url")

    if not template_id or not github_url:
        return {
            "status": "failed",
            "error": "Missing template_id or github_url"
        }

    # Create temporary directory for clone
    build_dir = os.path.join(tempfile.gettempdir(), str(uuid.uuid4()))

    try:
        # Update status: Starting analysis
        await update_template_status(
            template_id,
            "analyzing",
            progress=0.1,
            message="Starting template analysis..."
        )

        # 1. Clone repository
        print(f"Cloning {github_url} to {build_dir}")
        success, error = clone_repository(github_url, build_dir)
        if not success:
            await update_template_status(template_id, "failed", error=error)
            return {"status": "failed", "error": error}

        await update_template_status(
            template_id,
            "analyzing",
            progress=0.3,
            message="Repository cloned, validating..."
        )

        # 2. Validate 11ty project
        is_valid, error = validate_eleventy_project(build_dir)
        if not is_valid:
            await update_template_status(template_id, "failed", error=error)
            return {"status": "failed", "error": error}

        await update_template_status(
            template_id,
            "analyzing",
            progress=0.5,
            message="Project validated, scanning content..."
        )

        # 3-6. Analyze template
        result = analyze_template(build_dir)
        if result.get("error"):
            await update_template_status(
                template_id,
                "failed",
                error=result["error"]
            )
            return result

        await update_template_status(
            template_id,
            "analyzing",
            progress=0.8,
            message="Content analyzed, generating schemas..."
        )

        # 7. Get commit SHA
        commit_sha = get_commit_sha(build_dir)

        # 8. Update DynamoDB record
        update_data = {
            "status": "ready",
            "analyzed_at": datetime.utcnow().isoformat() + "Z",
            "github_commit_sha": commit_sha,
            "content_types": result.get("content_types", {}),
        }

        await update_template_record(template_id, update_data)

        await update_template_status(
            template_id,
            "ready",
            progress=1.0,
            message="Analysis complete"
        )

        print(f"Successfully analyzed template {template_id}")

        return {
            "status": "success",
            "template_id": template_id,
            "content_types": result.get("content_types", {})
        }

    except Exception as e:
        error_msg = f"Analysis failed: {str(e)}"
        print(f"Error analyzing template: {error_msg}")

        await update_template_status(
            template_id,
            "failed",
            error=error_msg
        )

        return {
            "status": "failed",
            "error": error_msg
        }

    finally:
        # Cleanup
        print(f"Cleaning up {build_dir}")
        cleanup_directory(build_dir)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda handler wrapper (synchronous entry point).

    Runs async handler in event loop.
    """
    # Run async handler
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(handler(event, context))


if __name__ == "__main__":
    # For local testing
    import sys

    if len(sys.argv) > 1:
        template_id = sys.argv[1]
        github_url = sys.argv[2] if len(sys.argv) > 2 else "https://github.com/11ty/eleventy-base-blog"

        event = {
            "template_id": template_id,
            "github_url": github_url
        }

        result = lambda_handler(event, None)
        print(json.dumps(result, indent=2))
