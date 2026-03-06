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

import boto3
from botocore.exceptions import ClientError
import aioboto3

from validator import validate_eleventy_project
from analyzer import analyze_template
from clone import clone_repository, cleanup_directory, get_commit_sha


# DynamoDB client for persisting analysis results
class DynamoDBClient:
    """DynamoDB client for storing template analysis results."""

    def __init__(self):
        """Initialize DynamoDB client."""
        self.table_name = os.getenv('DYNAMODB_TABLE', 'nbhd-city')
        self.region = os.getenv('AWS_REGION', 'us-east-1')
        self.session = aioboto3.Session()

    async def update_template_status(
        self,
        template_id: str,
        status: str,
        progress: Optional[float] = None,
        error: Optional[str] = None,
        message: Optional[str] = None,
        **kwargs
    ) -> bool:
        """
        Update template analysis status in DynamoDB.

        Updates TEMPLATE#{template_id}#ANALYSIS record with progress and status.
        """
        try:
            async with self.session.resource('dynamodb', region_name=self.region) as dynamodb:
                table = await dynamodb.Table(self.table_name)

                # Build update expression
                update_expr = "SET #status = :status, updated_at = :updated_at"
                expr_values = {
                    ":status": status,
                    ":updated_at": datetime.utcnow().isoformat() + "Z"
                }
                expr_names = {"#status": "status"}

                if progress is not None:
                    update_expr += ", progress = :progress"
                    expr_values[":progress"] = progress

                if message is not None:
                    update_expr += ", message = :message"
                    expr_values[":message"] = message

                if error is not None:
                    update_expr += ", error = :error"
                    expr_values[":error"] = error

                # Update ANALYSIS record
                await table.update_item(
                    Key={
                        "PK": f"TEMPLATE#{template_id}",
                        "SK": "ANALYSIS"
                    },
                    UpdateExpression=update_expr,
                    ExpressionAttributeNames=expr_names,
                    ExpressionAttributeValues=expr_values
                )

                print(f"[DynamoDB] Updated analysis status: {template_id} -> {status}")
                return True

        except ClientError as e:
            print(f"[DynamoDB Error] Failed to update status: {str(e)}")
            return False

    async def update_template_record(
        self,
        template_id: str,
        updates: Dict[str, Any]
    ) -> bool:
        """
        Update template metadata and analysis results in DynamoDB.

        Stores:
        - TEMPLATE#{id}#METADATA: github_url, commit_sha, analysis_date
        - TEMPLATE#{id}#CONTENT_TYPES: inferred schemas for each content type
        - TEMPLATE#{id}#SAMPLES: example records from each content type
        """
        try:
            async with self.session.resource('dynamodb', region_name=self.region) as dynamodb:
                table = await dynamodb.Table(self.table_name)

                # Store METADATA
                if "github_url" in updates or "commit_sha" in updates:
                    metadata = {
                        "PK": f"TEMPLATE#{template_id}",
                        "SK": "METADATA",
                        "template_id": template_id,
                        "updated_at": datetime.utcnow().isoformat() + "Z"
                    }
                    if "github_url" in updates:
                        metadata["github_url"] = updates["github_url"]
                    if "commit_sha" in updates:
                        metadata["commit_sha"] = updates["commit_sha"]
                    if "analysis_date" in updates:
                        metadata["analysis_date"] = updates["analysis_date"]

                    await table.put_item(Item=metadata)
                    print(f"[DynamoDB] Stored METADATA for {template_id}")

                # Store CONTENT_TYPES
                if "content_types" in updates:
                    content_types = {
                        "PK": f"TEMPLATE#{template_id}",
                        "SK": "CONTENT_TYPES",
                        "template_id": template_id,
                        "content_types": updates["content_types"],
                        "updated_at": datetime.utcnow().isoformat() + "Z"
                    }
                    await table.put_item(Item=content_types)
                    print(f"[DynamoDB] Stored CONTENT_TYPES for {template_id}")

                # Store SAMPLES
                if "samples" in updates:
                    samples = {
                        "PK": f"TEMPLATE#{template_id}",
                        "SK": "SAMPLES",
                        "template_id": template_id,
                        "samples": updates["samples"],
                        "updated_at": datetime.utcnow().isoformat() + "Z"
                    }
                    await table.put_item(Item=samples)
                    print(f"[DynamoDB] Stored SAMPLES for {template_id}")

                return True

        except ClientError as e:
            print(f"[DynamoDB Error] Failed to update records: {str(e)}")
            return False


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

        # 8. Update DynamoDB record with analysis results
        update_data = {
            "github_url": github_url,
            "commit_sha": commit_sha,
            "analysis_date": datetime.utcnow().isoformat() + "Z",
            "content_types": result.get("content_types", {}),
            "samples": result.get("samples", {})  # Example records from each content type
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
