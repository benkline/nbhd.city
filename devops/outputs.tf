# Frontend outputs
output "frontend_bucket_name" {
  description = "S3 bucket name for frontend assets"
  value       = aws_s3_bucket.frontend.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "frontend_url" {
  description = "Frontend URL"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

# Backend outputs
output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.api.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.api.arn
}

output "api_gateway_url" {
  description = "Full API Gateway URL"
  value       = "${aws_apigatewayv2_api.api.api_endpoint}"
}

# Environment outputs
output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_region" {
  description = "AWS Region"
  value       = data.aws_region.current.name
}

output "deployment_summary" {
  description = "Deployment summary"
  value = {
    frontend_url        = "https://${aws_cloudfront_distribution.frontend.domain_name}"
    api_url             = aws_apigatewayv2_api.api.api_endpoint
    cloudfront_dist_id  = aws_cloudfront_distribution.frontend.id
    lambda_function     = aws_lambda_function.api.function_name
    s3_bucket          = aws_s3_bucket.frontend.id
  }
}
