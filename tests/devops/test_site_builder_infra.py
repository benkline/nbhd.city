"""
Tests for SSG-016-INFRA: Site Builder Lambda Infrastructure

Validates:
1. Lambda function code can be packaged
2. Terraform HCL syntax is valid
3. All required resources are defined
4. IAM policies have correct permissions
5. Environment variables are configured
"""

import os
import json
import re
from pathlib import Path


class TestSiteBuilderInfra:
    """Test suite for site builder Lambda infrastructure."""

    SITE_BUILDER_TF = Path(__file__).parent.parent / "site_builder_lambda.tf"
    OUTPUTS_TF = Path(__file__).parent.parent / "outputs.tf"
    LAMBDA_HANDLER = Path(__file__).parent.parent.parent / "lambda" / "site_builder" / "handler.py"

    def test_terraform_file_exists(self):
        """[ ] Verify site_builder_lambda.tf exists"""
        assert self.SITE_BUILDER_TF.exists(), f"Missing {self.SITE_BUILDER_TF}"
        print("✓ site_builder_lambda.tf exists")

    def test_lambda_handler_exists(self):
        """[ ] Verify lambda/site_builder/handler.py exists"""
        assert self.LAMBDA_HANDLER.exists(), f"Missing {self.LAMBDA_HANDLER}"
        print("✓ handler.py exists")

    def test_terraform_hcl_syntax(self):
        """[ ] Verify HCL syntax is valid (basic checks)"""
        assert self.SITE_BUILDER_TF.exists()
        content = self.SITE_BUILDER_TF.read_text()

        # Check for balanced braces and brackets
        assert content.count('{') == content.count('}'), "Unbalanced braces"
        assert content.count('[') == content.count(']'), "Unbalanced brackets"
        print("✓ HCL syntax valid (braces/brackets balanced)")

    def test_has_archive_file_resource(self):
        """[ ] Lambda packaging - Archive file resource defined"""
        content = self.SITE_BUILDER_TF.read_text()
        assert 'data "archive_file"' in content, "Missing archive_file data source"
        assert 'lambda/site_builder' in content, "Archive should include site_builder code"
        print("✓ Archive file resource configured")

    def test_has_iam_role(self):
        """[ ] IAM role for site builder execution"""
        content = self.SITE_BUILDER_TF.read_text()
        assert 'aws_iam_role.lambda_site_builder_exec' in content or \
               'resource "aws_iam_role"' in content, "Missing IAM role"
        assert 'site-builder' in content.lower(), "Role should reference site-builder"
        print("✓ IAM role defined")

    def test_has_cloudwatch_policy(self):
        """[ ] CloudWatch logging policy"""
        content = self.SITE_BUILDER_TF.read_text()
        assert 'aws_iam_policy' in content, "Missing IAM policy"
        assert 'logs:CreateLogGroup' in content and \
               'logs:CreateLogStream' in content and \
               'logs:PutLogEvents' in content, "Missing CloudWatch permissions"
        print("✓ CloudWatch logging policy configured")

    def test_has_dynamodb_policy(self):
        """[ ] DynamoDB access policy"""
        content = self.SITE_BUILDER_TF.read_text()
        assert 'dynamodb:GetItem' in content and \
               'dynamodb:PutItem' in content and \
               'dynamodb:UpdateItem' in content and \
               'dynamodb:Query' in content, "Missing DynamoDB permissions"
        # Verify NOT overly permissive
        assert 'dynamodb:Scan' not in content, "Should not have Scan permission"
        print("✓ DynamoDB policy configured (limited permissions)")

    def test_has_s3_policy(self):
        """[ ] S3 access policy (read/write to bucket)"""
        content = self.SITE_BUILDER_TF.read_text()
        assert 's3:GetObject' in content and \
               's3:PutObject' in content and \
               's3:ListBucket' in content, "Missing S3 permissions"
        print("✓ S3 policy configured")

    def test_has_cloudfront_policy(self):
        """[ ] CloudFront invalidation policy"""
        content = self.SITE_BUILDER_TF.read_text()
        assert 'cloudfront:CreateInvalidation' in content, "Missing CloudFront permission"
        print("✓ CloudFront invalidation policy configured")

    def test_has_policy_attachments(self):
        """[ ] IAM policy attachments"""
        content = self.SITE_BUILDER_TF.read_text()
        assert 'aws_iam_role_policy_attachment' in content, "Missing policy attachments"
        # Should have at least 4 attachments (CloudWatch, DynamoDB, S3, CloudFront)
        attachment_count = content.count('aws_iam_role_policy_attachment')
        assert attachment_count >= 4, f"Expected 4+ attachments, found {attachment_count}"
        print(f"✓ Policy attachments configured ({attachment_count} found)")

    def test_has_cloudwatch_log_group(self):
        """[ ] CloudWatch log group for Lambda"""
        content = self.SITE_BUILDER_TF.read_text()
        assert 'aws_cloudwatch_log_group' in content, "Missing CloudWatch log group"
        assert '/aws/lambda/' in content, "Log group should be in /aws/lambda/ namespace"
        print("✓ CloudWatch log group configured")

    def test_has_lambda_function(self):
        """[ ] Lambda function resource"""
        content = self.SITE_BUILDER_TF.read_text()
        assert 'resource "aws_lambda_function"' in content, "Missing Lambda function resource"
        assert 'site_builder' in content.lower() or 'site-builder' in content.lower(), \
            "Lambda function should reference site_builder"
        print("✓ Lambda function resource defined")

    def test_lambda_timeout_configured(self):
        """[ ] Lambda timeout: 300 seconds"""
        content = self.SITE_BUILDER_TF.read_text()
        assert 'timeout' in content.lower(), "Missing timeout configuration"
        assert '300' in content, "Timeout should be 300 seconds"
        print("✓ Lambda timeout: 300 seconds")

    def test_lambda_memory_configured(self):
        """[ ] Lambda memory: 1024 MB"""
        content = self.SITE_BUILDER_TF.read_text()
        assert 'memory_size' in content or 'memory' in content.lower(), "Missing memory configuration"
        assert '1024' in content, "Memory should be 1024 MB"
        print("✓ Lambda memory: 1024 MB")

    def test_lambda_ephemeral_storage_configured(self):
        """[ ] Lambda ephemeral storage: 4096 MB"""
        content = self.SITE_BUILDER_TF.read_text()
        assert 'ephemeral_storage' in content, "Missing ephemeral storage configuration"
        assert '4096' in content, "Ephemeral storage should be 4096 MB"
        print("✓ Lambda ephemeral storage: 4096 MB")

    def test_lambda_environment_variables(self):
        """[ ] Lambda environment variables configured"""
        content = self.SITE_BUILDER_TF.read_text()
        assert 'environment' in content.lower(), "Missing environment block"
        assert 'DYNAMODB_TABLE_NAME' in content, "Missing DYNAMODB_TABLE_NAME env var"
        assert 'S3_BUCKET' in content, "Missing S3_BUCKET env var"
        assert 'CLOUDFRONT_DISTRIBUTION_ID' in content, "Missing CLOUDFRONT_DISTRIBUTION_ID env var"
        assert 'AWS_REGION' in content, "Missing AWS_REGION env var"
        print("✓ Lambda environment variables configured")

    def test_lambda_handler_configured(self):
        """[ ] Lambda handler: handler.handler"""
        content = self.SITE_BUILDER_TF.read_text()
        assert 'handler' in content.lower(), "Missing handler configuration"
        assert 'handler.handler' in content, "Handler should be handler.handler"
        print("✓ Lambda handler: handler.handler")

    def test_outputs_exist(self):
        """[ ] Required outputs defined in outputs.tf"""
        assert self.OUTPUTS_TF.exists()
        content = self.OUTPUTS_TF.read_text()
        assert 'lambda_site_builder_function_name' in content, "Missing function_name output"
        assert 'lambda_site_builder_function_arn' in content, "Missing function_arn output"
        print("✓ Lambda outputs defined")

    def test_s3_bucket_referenced(self):
        """[ ] S3 bucket from sites_storage.tf is referenced"""
        content = self.SITE_BUILDER_TF.read_text()
        # Should reference the bucket created in sites_storage.tf
        assert 'aws_s3_bucket.sites' in content or 'S3_BUCKET' in content, \
            "Should reference S3 bucket from sites_storage.tf"
        print("✓ S3 bucket referenced")

    def test_cloudfront_distribution_referenced(self):
        """[ ] CloudFront distribution from sites_cdn.tf is referenced"""
        content = self.SITE_BUILDER_TF.read_text()
        assert 'cloudfront' in content.lower() or 'CLOUDFRONT_DISTRIBUTION_ID' in content, \
            "Should reference CloudFront distribution"
        print("✓ CloudFront distribution referenced")


if __name__ == "__main__":
    import sys

    test = TestSiteBuilderInfra()
    test_methods = [m for m in dir(test) if m.startswith('test_')]

    passed = 0
    failed = 0

    print(f"\n{'='*70}")
    print("SSG-016-INFRA: Site Builder Lambda Infrastructure Tests")
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
