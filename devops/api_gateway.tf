# API Gateway REST API
resource "aws_api_gateway_rest_api" "api" {
  name        = "${var.project_name}-api-${var.environment}"
  description = "nbhd.city REST API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name = "${var.project_name}-api-${var.environment}"
  }
}

# API Gateway Resource (proxy resource for all paths)
resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "{proxy+}"
}

# API Gateway Method (ANY method for proxy resource)
resource "aws_api_gateway_method" "proxy" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

# API Gateway Integration with Lambda (proxy integration)
resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_method.proxy.resource_id
  http_method = aws_api_gateway_method.proxy.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api.invoke_arn
}

# API Gateway Method for root path
resource "aws_api_gateway_method" "proxy_root" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_rest_api.api.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

# API Gateway Integration for root path
resource "aws_api_gateway_integration" "lambda_root" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_method.proxy_root.resource_id
  http_method = aws_api_gateway_method.proxy_root.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "api" {
  depends_on = [
    aws_api_gateway_integration.lambda,
    aws_api_gateway_integration.lambda_root,
  ]

  rest_api_id = aws_api_gateway_rest_api.api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.proxy.id,
      aws_api_gateway_method.proxy.id,
      aws_api_gateway_integration.lambda.id,
      aws_api_gateway_method.proxy_root.id,
      aws_api_gateway_integration.lambda_root.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage
resource "aws_api_gateway_stage" "api" {
  deployment_id = aws_api_gateway_deployment.api.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = var.environment

  # Enable CloudWatch Logs
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  # Enable X-Ray Tracing
  xray_tracing_enabled = var.enable_xray_tracing

  tags = {
    Name = "${var.project_name}-api-${var.environment}"
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}"
  retention_in_days = var.api_gateway_log_retention_days

  tags = {
    Name = "${var.project_name}-api-gateway-logs-${var.environment}"
  }
}

# API Gateway Method Settings (for throttling)
resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = aws_api_gateway_stage.api.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    logging_level          = var.api_gateway_logging_level
    data_trace_enabled     = var.environment != "production"
    throttling_burst_limit = var.api_gateway_throttle_burst_limit
    throttling_rate_limit  = var.api_gateway_throttle_rate_limit
  }
}

# Custom Domain Name (optional)
# resource "aws_api_gateway_domain_name" "api" {
#   count           = var.custom_domain_name != "" ? 1 : 0
#   domain_name     = var.custom_domain_name
#   certificate_arn = var.acm_certificate_arn
#
#   endpoint_configuration {
#     types = ["REGIONAL"]
#   }
#
#   tags = {
#     Name = "${var.project_name}-api-domain-${var.environment}"
#   }
# }

# Base Path Mapping (optional, for custom domain)
# resource "aws_api_gateway_base_path_mapping" "api" {
#   count       = var.custom_domain_name != "" ? 1 : 0
#   api_id      = aws_api_gateway_rest_api.api.id
#   stage_name  = aws_api_gateway_stage.api.stage_name
#   domain_name = aws_api_gateway_domain_name.api[0].domain_name
# }
