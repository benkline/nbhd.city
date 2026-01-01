variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "nbhd-city"
}

variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "enable_point_in_time_recovery" {
  description = "Enable PITR for DynamoDB"
  type        = bool
  default     = true
}

variable "enable_streams" {
  description = "Enable DynamoDB Streams"
  type        = bool
  default     = false
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.11"
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Lambda memory in MB"
  type        = number
  default     = 512
}

variable "lambda_log_retention_days" {
  description = "Log retention days"
  type        = number
  default     = 14
}

variable "use_lambda_layer" {
  description = "Use Lambda layer"
  type        = bool
  default     = false
}

variable "lambda_layer_zip_path" {
  description = "Path to layer zip"
  type        = string
  default     = ""
}

variable "api_gateway_log_retention_days" {
  description = "API Gateway log retention"
  type        = number
  default     = 14
}

variable "api_gateway_logging_level" {
  description = "API Gateway logging level"
  type        = string
  default     = "INFO"
}

variable "api_gateway_throttle_burst_limit" {
  description = "Throttle burst limit"
  type        = number
  default     = 5000
}

variable "api_gateway_throttle_rate_limit" {
  description = "Throttle rate limit"
  type        = number
  default     = 10000
}

variable "enable_xray_tracing" {
  description = "Enable X-Ray tracing"
  type        = bool
  default     = false
}

variable "jwt_secret_key" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "access_token_expire_minutes" {
  description = "Token expiration minutes"
  type        = number
  default     = 10080
}

variable "frontend_url" {
  description = "Frontend URL"
  type        = string
  default     = "http://localhost:3000"
}

variable "bluesky_oauth_client_id" {
  description = "BlueSky OAuth client ID"
  type        = string
  sensitive   = true
}

variable "bluesky_oauth_client_secret" {
  description = "BlueSky OAuth client secret"
  type        = string
  sensitive   = true
}

variable "bluesky_oauth_authorization_endpoint" {
  description = "BlueSky OAuth authorization endpoint"
  type        = string
  default     = "https://bsky.social/oauth/authorize"
}

variable "bluesky_oauth_token_endpoint" {
  description = "BlueSky OAuth token endpoint"
  type        = string
  default     = "https://bsky.social/oauth/token"
}

variable "bluesky_oauth_redirect_uri" {
  description = "BlueSky OAuth redirect URI"
  type        = string
  default     = ""
}

variable "custom_domain_name" {
  description = "Custom domain name"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN"
  type        = string
  default     = ""
}
