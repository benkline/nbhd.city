# Package the Lambda function code
data "archive_file" "lambda_package" {
  type        = "zip"
  source_dir  = "${path.module}/../api"
  output_path = "${path.module}/lambda_function.zip"

  excludes = [
    "venv",
    "__pycache__",
    "*.pyc",
    ".pytest_cache",
    "tests",
    ".env",
    ".env.local",
    "alembic",
    "alembic.ini"
  ]
}

# Lambda Layer for dependencies (optional but recommended for faster deploys)
resource "aws_lambda_layer_version" "dependencies" {
  count               = var.use_lambda_layer ? 1 : 0
  filename            = var.lambda_layer_zip_path
  layer_name          = "${var.project_name}-dependencies-${var.environment}"
  compatible_runtimes = ["python3.11", "python3.12"]
  description         = "Python dependencies for nbhd.city API"

  # Only create layer if the zip file exists
  lifecycle {
    ignore_changes = [filename]
  }
}

# Lambda Function
resource "aws_lambda_function" "api" {
  filename         = data.archive_file.lambda_package.output_path
  function_name    = "${var.project_name}-api-${var.environment}"
  role            = aws_iam_role.lambda_exec.arn
  handler         = "lambda_handler.handler"
  source_code_hash = data.archive_file.lambda_package.output_base64sha256
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  # Attach dependencies layer if enabled
  layers = var.use_lambda_layer ? [aws_lambda_layer_version.dependencies[0].arn] : []

  environment {
    variables = {
      ENVIRONMENT             = var.environment
      DYNAMODB_TABLE_NAME     = aws_dynamodb_table.nbhd_city.name
      AWS_REGION              = var.aws_region
      SECRET_KEY              = var.jwt_secret_key
      ACCESS_TOKEN_EXPIRE_MINUTES = var.access_token_expire_minutes
      FRONTEND_URL            = var.frontend_url

      # BlueSky OAuth Configuration
      BLUESKY_OAUTH_CLIENT_ID              = var.bluesky_oauth_client_id
      BLUESKY_OAUTH_CLIENT_SECRET          = var.bluesky_oauth_client_secret
      BLUESKY_OAUTH_AUTHORIZATION_ENDPOINT = var.bluesky_oauth_authorization_endpoint
      BLUESKY_OAUTH_TOKEN_ENDPOINT         = var.bluesky_oauth_token_endpoint
      BLUESKY_OAUTH_REDIRECT_URI           = var.bluesky_oauth_redirect_uri
    }
  }

  # VPC configuration (if needed)
  # vpc_config {
  #   subnet_ids         = var.lambda_subnet_ids
  #   security_group_ids = var.lambda_security_group_ids
  # }

  tags = {
    Name = "${var.project_name}-api-${var.environment}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_logs,
    aws_iam_role_policy_attachment.lambda_dynamodb,
    aws_cloudwatch_log_group.lambda
  ]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project_name}-api-${var.environment}"
  retention_in_days = var.lambda_log_retention_days

  tags = {
    Name = "${var.project_name}-api-logs-${var.environment}"
  }
}

# Lambda Function URL (alternative to API Gateway for simple use cases)
# resource "aws_lambda_function_url" "api" {
#   function_name      = aws_lambda_function.api.function_name
#   authorization_type = "NONE"
#
#   cors {
#     allow_credentials = true
#     allow_origins     = ["*"]
#     allow_methods     = ["*"]
#     allow_headers     = ["*"]
#     max_age           = 86400
#   }
# }

# Lambda permission for API Gateway to invoke
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}
