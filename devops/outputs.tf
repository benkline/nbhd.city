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

output "sites_bucket_name" {
  description = "Name of the S3 bucket for static sites"
  value       = aws_s3_bucket.sites.bucket
}

output "sites_bucket_arn" {
  description = "ARN of the S3 bucket for static sites"
  value       = aws_s3_bucket.sites.arn
}

output "sites_cloudfront_domain_name" {
  description = "CloudFront domain name for sites distribution (for CNAME configuration)"
  value       = aws_cloudfront_distribution.sites.domain_name
}

output "sites_cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution for sites"
  value       = aws_cloudfront_distribution.sites.id
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID for sites domain"
  value       = local.route53_zone_id
}

output "route53_name_servers" {
  description = "Route53 name servers (configure at domain registrar for delegation)"
  value = var.create_hosted_zone ? (
    aws_route53_zone.sites[0].name_servers
    ) : (
    data.aws_route53_zone.sites[0].name_servers
  )
}

output "sites_domain" {
  description = "Domain used for static sites routing"
  value       = var.sites_domain
}

output "lambda_template_analyzer_function_name" {
  description = "Name of the template analyzer Lambda function"
  value       = aws_lambda_function.template_analyzer.function_name
}

output "lambda_template_analyzer_function_arn" {
  description = "ARN of the template analyzer Lambda function"
  value       = aws_lambda_function.template_analyzer.arn
}

output "lambda_template_analyzer_role_arn" {
  description = "ARN of the template analyzer Lambda execution role"
  value       = aws_iam_role.lambda_template_analyzer_exec.arn
}

output "lambda_site_builder_function_name" {
  description = "Name of the site builder Lambda function"
  value       = aws_lambda_function.site_builder.function_name
}

output "lambda_site_builder_function_arn" {
  description = "ARN of the site builder Lambda function"
  value       = aws_lambda_function.site_builder.arn
}

output "lambda_site_builder_role_arn" {
  description = "ARN of the site builder Lambda execution role"
  value       = aws_iam_role.lambda_site_builder_exec.arn
}

output "deployment_summary" {
  description = "Deployment summary"
  value = {
    environment        = var.environment
    region            = var.aws_region
    api_url           = aws_api_gateway_stage.api.invoke_url
    dynamodb_table    = aws_dynamodb_table.nbhd_city.name
    lambda_function   = aws_lambda_function.api.function_name
    sites_domain      = var.sites_domain
    sites_bucket      = aws_s3_bucket.sites.bucket
    sites_cloudfront  = aws_cloudfront_distribution.sites.domain_name
  }
}
