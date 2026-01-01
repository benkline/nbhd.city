output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.nbhd_city.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.nbhd_city.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.api.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.api.arn
}

output "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_exec.arn
}

output "api_gateway_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.api.id
}

output "api_gateway_url" {
  description = "URL of the API Gateway endpoint"
  value       = aws_api_gateway_stage.api.invoke_url
}

output "api_gateway_stage" {
  description = "Name of the API Gateway stage"
  value       = aws_api_gateway_stage.api.stage_name
}

output "cloudwatch_log_group_lambda" {
  description = "CloudWatch Log Group name for Lambda"
  value       = aws_cloudwatch_log_group.lambda.name
}

output "cloudwatch_log_group_api_gateway" {
  description = "CloudWatch Log Group name for API Gateway"
  value       = aws_cloudwatch_log_group.api_gateway.name
}

output "deployment_summary" {
  description = "Deployment summary"
  value = {
    environment        = var.environment
    region            = var.aws_region
    api_url           = aws_api_gateway_stage.api.invoke_url
    dynamodb_table    = aws_dynamodb_table.nbhd_city.name
    lambda_function   = aws_lambda_function.api.function_name
  }
}
