# 11ty Site Builder Lambda Function
# Builds static sites from templates and content, uploads to S3, invalidates CloudFront

# Archive packaging for site builder Lambda
data "archive_file" "lambda_site_builder_package" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/site_builder"
  output_path = "${path.module}/.terraform/lambda_site_builder.zip"

  excludes = [
    "__pycache__",
    "*.pyc",
    ".pytest_cache",
    "tests"
  ]
}

# IAM role for site builder Lambda execution
resource "aws_iam_role" "lambda_site_builder_exec" {
  name = "${var.project_name}-site-builder-${var.environment}"

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

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-site-builder-${var.environment}"
    }
  )
}

# IAM policy: CloudWatch Logs for site builder
resource "aws_iam_policy" "lambda_site_builder_logging" {
  name        = "${var.project_name}-site-builder-logging-${var.environment}"
  description = "IAM policy for site builder Lambda to write logs to CloudWatch"

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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-site-builder-${var.environment}:*"
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-site-builder-logging-${var.environment}"
    }
  )
}

# IAM policy: DynamoDB access for site builder
resource "aws_iam_policy" "lambda_site_builder_dynamodb" {
  name        = "${var.project_name}-site-builder-dynamodb-${var.environment}"
  description = "IAM policy for site builder Lambda to access DynamoDB (GetItem, PutItem, UpdateItem, Query)"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.nbhd_city.arn,
          "${aws_dynamodb_table.nbhd_city.arn}/index/*"
        ]
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-site-builder-dynamodb-${var.environment}"
    }
  )
}

# IAM policy: S3 access for site builder (read/write to sites bucket)
resource "aws_iam_policy" "lambda_site_builder_s3" {
  name        = "${var.project_name}-site-builder-s3-${var.environment}"
  description = "IAM policy for site builder Lambda to read/write to S3 sites bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.sites.arn,
          "${aws_s3_bucket.sites.arn}/*"
        ]
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-site-builder-s3-${var.environment}"
    }
  )
}

# IAM policy: CloudFront cache invalidation
resource "aws_iam_policy" "lambda_site_builder_cloudfront" {
  name        = "${var.project_name}-site-builder-cloudfront-${var.environment}"
  description = "IAM policy for site builder Lambda to invalidate CloudFront cache"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation"
        ]
        Resource = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.sites.id}"
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-site-builder-cloudfront-${var.environment}"
    }
  )
}

# Attach logging policy to site builder role
resource "aws_iam_role_policy_attachment" "lambda_site_builder_logs" {
  role       = aws_iam_role.lambda_site_builder_exec.name
  policy_arn = aws_iam_policy.lambda_site_builder_logging.arn
}

# Attach DynamoDB policy to site builder role
resource "aws_iam_role_policy_attachment" "lambda_site_builder_dynamodb" {
  role       = aws_iam_role.lambda_site_builder_exec.name
  policy_arn = aws_iam_policy.lambda_site_builder_dynamodb.arn
}

# Attach S3 policy to site builder role
resource "aws_iam_role_policy_attachment" "lambda_site_builder_s3" {
  role       = aws_iam_role.lambda_site_builder_exec.name
  policy_arn = aws_iam_policy.lambda_site_builder_s3.arn
}

# Attach CloudFront policy to site builder role
resource "aws_iam_role_policy_attachment" "lambda_site_builder_cloudfront" {
  role       = aws_iam_role.lambda_site_builder_exec.name
  policy_arn = aws_iam_policy.lambda_site_builder_cloudfront.arn
}

# CloudWatch log group for site builder Lambda
resource "aws_cloudwatch_log_group" "lambda_site_builder" {
  name              = "/aws/lambda/${var.project_name}-site-builder-${var.environment}"
  retention_in_days = var.lambda_log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-site-builder-logs-${var.environment}"
    }
  )
}

# Site builder Lambda function
resource "aws_lambda_function" "site_builder" {
  filename            = data.archive_file.lambda_site_builder_package.output_path
  function_name       = "${var.project_name}-site-builder-${var.environment}"
  role                = aws_iam_role.lambda_site_builder_exec.arn
  handler             = "handler.handler"
  source_code_hash    = data.archive_file.lambda_site_builder_package.output_base64sha256
  runtime             = var.lambda_runtime
  timeout             = 300  # 5 minutes for building and uploading sites
  memory_size         = 1024 # 1 GB for npm install + 11ty build
  architectures       = ["x86_64"]

  # Ephemeral storage for npm modules and build output (4 GB = 4096 MB)
  ephemeral_storage {
    size = 4096
  }

  environment {
    variables = {
      ENVIRONMENT                = var.environment
      DYNAMODB_TABLE_NAME        = aws_dynamodb_table.nbhd_city.name
      S3_BUCKET                  = aws_s3_bucket.sites.bucket
      CLOUDFRONT_DISTRIBUTION_ID = aws_cloudfront_distribution.sites.id
      AWS_REGION                 = var.aws_region
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-site-builder-${var.environment}"
    }
  )

  depends_on = [
    aws_iam_role_policy_attachment.lambda_site_builder_logs,
    aws_iam_role_policy_attachment.lambda_site_builder_dynamodb,
    aws_iam_role_policy_attachment.lambda_site_builder_s3,
    aws_iam_role_policy_attachment.lambda_site_builder_cloudfront,
    aws_cloudwatch_log_group.lambda_site_builder
  ]
}

# Lambda permission: Allow API Lambda to invoke site builder Lambda
resource "aws_lambda_permission" "api_invoke_site_builder" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.site_builder.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}
