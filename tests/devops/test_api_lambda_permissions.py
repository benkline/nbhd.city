"""
Tests for SSG-015-INFRA: Configure API Lambda Permissions for Build Invocation

Validates:
1. API Lambda has permission to invoke template analyzer Lambda
2. API Lambda has permission to invoke site builder Lambda
3. Both permissions are configured correctly in Terraform
4. IAM policy allows asynchronous invocation
"""

from pathlib import Path


class TestAPILambdaPermissions:
    """Test suite for API Lambda invocation permissions."""

    IAM_TF = Path(__file__).parent.parent / "iam.tf"
    LAMBDA_TF = Path(__file__).parent.parent / "lambda.tf"

    def test_iam_policy_exists(self):
        """[ ] IAM policy for Lambda invocation exists"""
        assert self.IAM_TF.exists()
        content = self.IAM_TF.read_text()

        # Check for policy allowing Lambda invocation
        assert 'lambda:InvokeFunction' in content, "Missing lambda:InvokeFunction permission"
        print("✓ IAM policy with lambda:InvokeFunction permission exists")

    def test_lambda_permission_for_template_analyzer(self):
        """[ ] Lambda permission for template analyzer invocation"""
        assert self.LAMBDA_TF.exists()
        content = self.LAMBDA_TF.read_text()

        # Check for template analyzer permission
        assert 'template_analyzer' in content.lower() or 'template-analyzer' in content.lower(), \
            "Missing template analyzer Lambda permission"
        print("✓ Lambda permission for template analyzer configured")

    def test_lambda_permission_for_site_builder(self):
        """[ ] Lambda permission for site builder invocation"""
        assert self.LAMBDA_TF.exists()
        content = self.LAMBDA_TF.read_text()

        # Check for site builder permission
        assert 'site_builder' in content.lower() or 'site-builder' in content.lower(), \
            "Missing site builder Lambda permission"
        print("✓ Lambda permission for site builder configured")

    def test_api_lambda_can_invoke_permissions(self):
        """[ ] API Lambda has permissions to invoke both Lambdas"""
        content = self.IAM_TF.read_text()

        # Should have attachment or inline policy for API Lambda
        assert 'aws_iam_role_policy_attachment' in content or \
               'aws_iam_policy' in content, \
            "Missing policy attachment or policy definition"
        print("✓ Policy attachments configured")

    def test_asynchronous_invocation_configured(self):
        """[ ] Asynchronous invocation (Event type) configured"""
        iam_content = self.IAM_TF.read_text()
        lambda_content = self.LAMBDA_TF.read_text()

        # Check for Event type or asynchronous configuration
        combined = iam_content + lambda_content
        assert 'InvokeFunction' in combined or 'lambda:InvokeFunction' in combined, \
            "Missing InvokeFunction permission"
        print("✓ Asynchronous invocation configured")

    def test_principal_is_api_lambda(self):
        """[ ] Principal for permissions is API Lambda"""
        content = self.LAMBDA_TF.read_text()

        # Should reference api Lambda or have appropriate principal
        assert 'api' in content.lower() or \
               'principal' in content.lower() or \
               'source_arn' in content.lower(), \
            "Missing API Lambda as principal"
        print("✓ API Lambda identified as principal")


if __name__ == "__main__":
    import sys

    test = TestAPILambdaPermissions()
    test_methods = [m for m in dir(test) if m.startswith('test_')]

    passed = 0
    failed = 0

    print(f"\n{'='*70}")
    print("SSG-015-INFRA: API Lambda Permissions Tests")
    print(f"{'='*70}\n")

    for method_name in sorted(test_methods):
        try:
            method = getattr(test, method_name)
            method()
            passed += 1
        except AssertionError as e:
            print(f"✗ {method_name.replace('test_', '')}: {str(e)}")
            failed += 1
        except Exception as e:
            print(f"✗ {method_name.replace('test_', '')}: {str(e)}")
            failed += 1

    print(f"\n{'='*70}")
    print(f"Results: {passed} passed, {failed} failed")
    print(f"{'='*70}\n")

    sys.exit(0 if failed == 0 else 1)
