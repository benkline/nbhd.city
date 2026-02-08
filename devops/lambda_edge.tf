# Lambda@Edge function for subdomain routing
# Must be in us-east-1 for CloudFront association

# IAM role for Lambda@Edge function
resource "aws_iam_role" "lambda_edge_subdomain_router" {
  name               = "${var.project_name}-lambda-edge-subdomain-router-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "lambda-edge-subdomain-router"
    }
  )
}

# IAM policy: CloudWatch Logs (Lambda@Edge writes logs to multiple regions)
resource "aws_iam_role_policy" "lambda_edge_logs" {
  name = "${var.project_name}-lambda-edge-logs-${var.environment}"
  role = aws_iam_role.lambda_edge_subdomain_router.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/us-east-1.${var.project_name}-subdomain-router*"
      }
    ]
  })
}

# IAM policy: DynamoDB read access for subdomain lookup
resource "aws_iam_role_policy" "lambda_edge_dynamodb" {
  name = "${var.project_name}-lambda-edge-dynamodb-${var.environment}"
  role = aws_iam_role.lambda_edge_subdomain_router.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${aws_dynamodb_table.nbhd_city.name}",
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${aws_dynamodb_table.nbhd_city.name}/index/GSI8"
        ]
      }
    ]
  })
}

# Archive subdomain router function code (with dependencies)
data "archive_file" "lambda_edge_subdomain_router" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_edge_subdomain_router"
  output_path = "${path.module}/.terraform/lambda_edge_subdomain_router.zip"

  depends_on = [
    # Ensure dependencies are installed first
    null_resource.lambda_edge_npm_install
  ]
}

# Null resource to run npm install before archiving
resource "null_resource" "lambda_edge_npm_install" {
  triggers = {
    package_json = filemd5("${path.module}/lambda_edge_subdomain_router/package.json")
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/lambda_edge_subdomain_router && npm install --production"
  }
}

# Lambda@Edge function for subdomain routing
resource "aws_lambda_function" "subdomain_router" {
  provider            = aws.us_east_1
  filename            = data.archive_file.lambda_edge_subdomain_router.output_path
  function_name       = "${var.project_name}-subdomain-router-${var.environment}"
  role                = aws_iam_role.lambda_edge_subdomain_router.arn
  handler             = "index.handler"
  runtime             = "nodejs20.x"
  source_code_hash    = data.archive_file.lambda_edge_subdomain_router.output_base64sha256
  timeout             = 5
  memory_size         = 128
  publish             = true # Required for Lambda@Edge
  architectures       = ["x86_64"] # Lambda@Edge requires x86_64

  # NOTE: Lambda@Edge cannot have environment variables
  # Configuration must be hardcoded or read from DynamoDB/resources at runtime

  # Lambda@Edge has strict packaging requirements
  # The zip must not exceed 1 MB
  vpc_config {
    # Lambda@Edge cannot run in VPC, this block should be empty
    subnet_ids         = []
    security_group_ids = []
  }

  depends_on = [
    aws_iam_role_policy.lambda_edge_logs,
    aws_iam_role_policy.lambda_edge_dynamodb
  ]

  tags = merge(
    var.tags,
    {
      Name = "subdomain-router"
    }
  )
}

# CloudWatch Log Group for Lambda@Edge in us-east-1
resource "aws_cloudwatch_log_group" "lambda_edge_subdomain_router" {
  provider            = aws.us_east_1
  name                = "/aws/lambda/us-east-1.${aws_lambda_function.subdomain_router.function_name}"
  retention_in_days   = var.lambda_log_retention_days
  kms_key_id          = null # Lambda@Edge logs cannot be encrypted

  tags = merge(
    var.tags,
    {
      Name = "lambda-edge-subdomain-router-logs"
    }
  )
}
