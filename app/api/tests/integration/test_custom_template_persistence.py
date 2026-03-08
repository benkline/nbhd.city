"""
Integration test for custom template persistence across page navigation.

Tests the workflow:
1. User analyzes a custom template from GitHub URL
2. User navigates away (simulated)
3. User returns to template gallery
4. Custom template should still be available
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from decimal import Decimal


class TestCustomTemplatePersistence:
    """Test that custom templates persist across navigation"""


    def test_custom_template_persists_after_navigation(self, client, auth_headers):
        """
        Test the complete workflow:
        1. Analyze custom template
        2. Verify it appears in user's templates
        3. Simulate navigation away and back
        4. Verify template still appears
        """
        import boto3
        import os
        from datetime import datetime

        # Step 1: Register template for analysis
        template_url = "https://github.com/user/test-11ty-blog"
        payload = {
            "github_url": template_url,
        }

        # Mock the analyzer to prevent actual Lambda invocation
        with patch('templates.invoke_template_analyzer_async') as mock_invoke:
            mock_invoke.return_value = True

            # Analyze the template
            response = client.post(
                "/api/templates/analyze-url",
                json=payload,
                headers=auth_headers
            )

            assert response.status_code == 202, f"Failed to start analysis: {response.text}"
            data = response.json()
            template_id = data["data"]["template_id"]

        # Step 2: Manually update the template status to "ready" in DynamoDB
        # (simulating analyzer completion)
        dynamodb = boto3.resource(
            "dynamodb",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            endpoint_url=os.getenv("DYNAMODB_ENDPOINT_URL"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "dummy"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "dummy")
        )
        table = dynamodb.Table(os.getenv("DYNAMODB_TABLE_NAME", "nbhd-city"))
        table.update_item(
            Key={"PK": f"TEMPLATE#{template_id}", "SK": "ANALYSIS"},
            UpdateExpression="SET #status = :status, progress = :progress, analyzed_at = :analyzed, github_commit_sha = :sha, content_types = :types",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={
                ":status": "ready",
                ":progress": Decimal("1.0"),
                ":analyzed": datetime.utcnow().isoformat() + "Z",
                ":sha": "abc123def456",
                ":types": {
                    "blog": {
                        "directory": "src/blog",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "date": {"type": "string"}
                            }
                        }
                    }
                }
            }
        )

        # Step 3: Fetch user's custom templates (first time)
        list_response = client.get(
            "/api/templates/custom/user/list",
            headers=auth_headers
        )

        assert list_response.status_code == 200, f"Failed to list templates: {list_response.text}"
        templates_data = list_response.json()
        templates_list = templates_data.get("data", [])

        # Verify template appears in list
        assert len(templates_list) > 0, "No custom templates found after analysis"
        found_template = next(
            (t for t in templates_list if t.get("id") == template_id),
            None
        )
        assert found_template is not None, f"Template {template_id} not found in user's list"
        assert found_template["status"] == "ready", "Template should have ready status"
        assert found_template["is_custom"] is True, "Should be marked as custom"
        assert "schema" in found_template, "Template should have inferred schema"
        assert "content_types" in found_template, "Template should have content types"

        # Step 4: Simulate navigation away and back by calling the endpoint again
        # This tests that the data persists in DynamoDB
        list_response_2 = client.get(
            "/api/templates/custom/user/list",
            headers=auth_headers
        )

        assert list_response_2.status_code == 200
        templates_data_2 = list_response_2.json()
        templates_list_2 = templates_data_2.get("data", [])

        # Verify template STILL appears after "navigation"
        assert len(templates_list_2) > 0, "Templates disappeared after navigation"
        found_template_2 = next(
            (t for t in templates_list_2 if t.get("id") == template_id),
            None
        )
        assert found_template_2 is not None, f"Template {template_id} disappeared after navigation"
        assert found_template_2["status"] == "ready"
        assert found_template_2["is_custom"] is True

    def test_multiple_users_templates_isolated(self, client, auth_headers):
        """
        Test that templates are properly isolated per user
        """
        from auth import create_access_token
        import boto3
        import os
        from datetime import datetime

        user1_did = "did:plc:user1"
        user2_did = "did:plc:user2"

        # Create tokens for both users
        user1_headers = {"Authorization": f"Bearer {create_access_token(user_id=user1_did)}"}
        user2_headers = {"Authorization": f"Bearer {create_access_token(user_id=user2_did)}"}

        # Mock analyzer
        with patch('templates.invoke_template_analyzer_async') as mock_invoke:
            mock_invoke.return_value = True

            # User 1 analyzes a template
            response1 = client.post(
                "/api/templates/analyze-url",
                json={"github_url": "https://github.com/user1/template1"},
                headers=user1_headers
            )
            assert response1.status_code == 202
            template1_id = response1.json()["data"]["template_id"]

            # User 2 analyzes a different template
            response2 = client.post(
                "/api/templates/analyze-url",
                json={"github_url": "https://github.com/user2/template2"},
                headers=user2_headers
            )
            assert response2.status_code == 202
            template2_id = response2.json()["data"]["template_id"]

        # Update both templates to "ready" status
        dynamodb = boto3.resource(
            "dynamodb",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            endpoint_url=os.getenv("DYNAMODB_ENDPOINT_URL"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "dummy"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "dummy")
        )
        table = dynamodb.Table(os.getenv("DYNAMODB_TABLE_NAME", "nbhd-city"))
        for template_id in [template1_id, template2_id]:
            table.update_item(
                Key={"PK": f"TEMPLATE#{template_id}", "SK": "ANALYSIS"},
                UpdateExpression="SET #status = :status, progress = :progress, analyzed_at = :analyzed, github_commit_sha = :sha, content_types = :types",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":status": "ready",
                    ":progress": Decimal("1.0"),
                    ":analyzed": datetime.utcnow().isoformat() + "Z",
                    ":sha": "abc123",
                    ":types": {"default": {"directory": "src"}}
                }
            )

        # User 1 should only see their template
        list1 = client.get(
            "/api/templates/custom/user/list",
            headers=user1_headers
        )
        templates1 = list1.json()["data"]
        assert any(t["id"] == template1_id for t in templates1), "User 1 should see their template"
        assert not any(t["id"] == template2_id for t in templates1), "User 1 should not see User 2's template"

        # User 2 should only see their template
        list2 = client.get(
            "/api/templates/custom/user/list",
            headers=user2_headers
        )
        templates2 = list2.json()["data"]
        assert any(t["id"] == template2_id for t in templates2), "User 2 should see their template"
        assert not any(t["id"] == template1_id for t in templates2), "User 2 should not see User 1's template"

    def test_analyzing_templates_shown(self, client, auth_headers):
        """
        Test that analyzing templates are included in the list endpoint
        So users can see templates they're currently analyzing
        """
        import boto3
        import os
        import uuid
        from datetime import datetime

        # Create a template in DynamoDB with "analyzing" status
        template_id = str(uuid.uuid4())
        dynamodb = boto3.resource(
            "dynamodb",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            endpoint_url=os.getenv("DYNAMODB_ENDPOINT_URL"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "dummy"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "dummy")
        )
        table = dynamodb.Table(os.getenv("DYNAMODB_TABLE_NAME", "nbhd-city"))

        # Manually create an analyzing template record
        table.put_item(Item={
            "PK": f"TEMPLATE#{template_id}",
            "SK": "METADATA",
            "template_id": template_id,
            "github_url": "https://github.com/test/analyzing",
            "user_did": "did:plc:test123",
            "status": "analyzing",
            "created_at": datetime.utcnow().isoformat() + "Z",
            "entity_type": "template_analysis"
        })

        table.put_item(Item={
            "PK": f"TEMPLATE#{template_id}",
            "SK": "ANALYSIS",
            "template_id": template_id,
            "status": "analyzing",
            "progress": Decimal("0.5"),
            "message": "Analyzing...",
            "content_types": None,
            "schema": None
        })

        # List templates - should INCLUDE the analyzing template
        response = client.get(
            "/api/templates/custom/user/list",
            headers=auth_headers
        )

        assert response.status_code == 200
        templates = response.json()["data"]

        # Should include templates that are currently analyzing
        found_template = next(
            (t for t in templates if t["id"] == template_id),
            None
        )
        assert found_template is not None, "Should show analyzing templates"
        assert found_template["status"] == "analyzing", "Template should show analyzing status"
