# Archive the API code for Lambda
data "archive_file" "api_code" {
  type        = "zip"
  source_dir  = var.api_artifact_path
  output_path = "${path.module}/../api_lambda.zip"

  # Exclude files that shouldn't be in Lambda
  excludes = [
    "venv",
    "__pycache__",
    ".pytest_cache",
    ".env",
    "*.pyc",
    ".git",
  ]
}

# Lambda execution role
resource "aws_iam_role" "lambda_execution" {
  name = "${var.project_name}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda layer for Python dependencies
resource "aws_lambda_layer_version" "dependencies" {
  filename   = "${path.module}/../lambda_layer.zip"
  source_code_hash = data.archive_file.dependencies.output_base64sha256

  layer_name          = "${var.project_name}-dependencies"
  compatible_runtimes = ["python3.11"]

  depends_on = [data.archive_file.dependencies]
}

# Archive for Lambda layer
data "archive_file" "dependencies" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_layer"
  output_path = "${path.module}/../lambda_layer.zip"
}

# Lambda function
resource "aws_lambda_function" "api" {
  filename      = data.archive_file.api_code.output_path
  function_name = "${var.project_name}-api"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "main.app"
  runtime       = "python3.11"
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  source_code_hash = data.archive_file.api_code.output_base64sha256

  layers = [aws_lambda_layer_version.dependencies.arn]

  environment {
    variables = {
      BLUESKY_OAUTH_CLIENT_ID      = var.bluesky_oauth_client_id
      BLUESKY_OAUTH_CLIENT_SECRET  = var.bluesky_oauth_client_secret
      BLUESKY_OAUTH_REDIRECT_URI   = "https://${aws_cloudfront_distribution.frontend.domain_name}/auth/success"
      SECRET_KEY                   = var.jwt_secret_key
      ACCESS_TOKEN_EXPIRE_MINUTES  = "10080"
      FRONTEND_URL                 = "https://${aws_cloudfront_distribution.frontend.domain_name}"
      ENVIRONMENT                  = var.environment
    }
  }

  tags = {
    Name = "${var.project_name}-api"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_lambda_layer_version.dependencies,
  ]
}

# API Gateway REST API
resource "aws_apigatewayv2_api" "api" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["https://${aws_cloudfront_distribution.frontend.domain_name}"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["*"]
    expose_headers = ["content-length"]
    max_age      = 86400
  }

  tags = {
    Name = "${var.project_name}-api"
  }
}

# API Gateway integration with Lambda
resource "aws_apigatewayv2_integration" "lambda" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  target             = aws_lambda_function.api.arn
  payload_format_version = "2.0"

  lifecycle {
    ignore_changes = [request_parameters]
  }
}

# API Gateway routes
resource "aws_apigatewayv2_route" "catch_all" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# API Gateway stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      httpMethod      = "$context.httpMethod"
      requestId       = "$context.requestId"
      resourcePath    = "$context.resourcePath"
      routeKey        = "$context.routeKey"
      sourceIp        = "$context.sourceIp"
      status          = "$context.status"
      error           = "$context.error.message"
      integrationErrorMessage = "$context.integrationErrorMessage"
    })
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

# CloudWatch log group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-api"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-api-logs"
  }
}

# CloudWatch log group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project_name}-api"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-lambda-logs"
  }
}
