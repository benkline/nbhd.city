# Template Analyzer Lambda Function
# Analyzes 11ty templates from GitHub repositories and stores content schemas in DynamoDB

# Archive packaging for template analyzer Lambda
data "archive_file" "lambda_template_analyzer_package" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/template_analyzer"
  output_path = "${path.module}/.terraform/lambda_template_analyzer.zip"

  excludes = [
    "__pycache__",
    "*.pyc",
    ".pytest_cache",
    "tests"
  ]
}

# IAM role for template analyzer Lambda execution
resource "aws_iam_role" "lambda_template_analyzer_exec" {
  name = "${var.project_name}-template-analyzer-${var.environment}"

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
      Name = "${var.project_name}-template-analyzer-${var.environment}"
    }
  )
}

# IAM policy: CloudWatch Logs for template analyzer
resource "aws_iam_policy" "lambda_template_analyzer_logging" {
  name        = "${var.project_name}-template-analyzer-logging-${var.environment}"
  description = "IAM policy for template analyzer Lambda to write logs to CloudWatch"

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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-template-analyzer-${var.environment}:*"
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-template-analyzer-logging-${var.environment}"
    }
  )
}

# IAM policy: DynamoDB access for template analyzer (limited permissions)
resource "aws_iam_policy" "lambda_template_analyzer_dynamodb" {
  name        = "${var.project_name}-template-analyzer-dynamodb-${var.environment}"
  description = "IAM policy for template analyzer Lambda to access DynamoDB (limited to GetItem, PutItem, UpdateItem)"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DescribeTable"
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
      Name = "${var.project_name}-template-analyzer-dynamodb-${var.environment}"
    }
  )
}

# Attach logging policy to template analyzer role
resource "aws_iam_role_policy_attachment" "lambda_template_analyzer_logs" {
  role       = aws_iam_role.lambda_template_analyzer_exec.name
  policy_arn = aws_iam_policy.lambda_template_analyzer_logging.arn
}

# Attach DynamoDB policy to template analyzer role
resource "aws_iam_role_policy_attachment" "lambda_template_analyzer_dynamodb" {
  role       = aws_iam_role.lambda_template_analyzer_exec.name
  policy_arn = aws_iam_policy.lambda_template_analyzer_dynamodb.arn
}

# CloudWatch log group for template analyzer Lambda
resource "aws_cloudwatch_log_group" "lambda_template_analyzer" {
  name              = "/aws/lambda/${var.project_name}-template-analyzer-${var.environment}"
  retention_in_days = var.lambda_log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-template-analyzer-logs-${var.environment}"
    }
  )
}

# Template analyzer Lambda function
resource "aws_lambda_function" "template_analyzer" {
  filename         = data.archive_file.lambda_template_analyzer_package.output_path
  function_name    = "${var.project_name}-template-analyzer-${var.environment}"
  role             = aws_iam_role.lambda_template_analyzer_exec.arn
  handler          = "handler.lambda_handler"
  source_code_hash = data.archive_file.lambda_template_analyzer_package.output_base64sha256
  runtime          = var.lambda_runtime
  timeout          = 300  # 5 minutes for template analysis
  memory_size      = 512  # 512 MB for processing repositories

  environment {
    variables = {
      ENVIRONMENT         = var.environment
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.nbhd_city.name
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-template-analyzer-${var.environment}"
    }
  )

  depends_on = [
    aws_iam_role_policy_attachment.lambda_template_analyzer_logs,
    aws_iam_role_policy_attachment.lambda_template_analyzer_dynamodb,
    aws_cloudwatch_log_group.lambda_template_analyzer
  ]
}
