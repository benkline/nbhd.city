variable "project_name" {
  description = "Project name"
  type        = string
  default     = "nbhd-city"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "frontend_artifact_path" {
  description = "Path to frontend build artifacts"
  type        = string
  default     = "../frontend/dist"
}

variable "api_artifact_path" {
  description = "Path to API code"
  type        = string
  default     = "../api"
}

variable "bluesky_oauth_client_id" {
  description = "BlueSky OAuth Client ID"
  type        = string
  sensitive   = true
}

variable "bluesky_oauth_client_secret" {
  description = "BlueSky OAuth Client Secret"
  type        = string
  sensitive   = true
}

variable "jwt_secret_key" {
  description = "JWT Secret Key"
  type        = string
  sensitive   = true
}

variable "cloudfront_enabled" {
  description = "Enable CloudFront distribution"
  type        = bool
  default     = true
}

variable "enable_logging" {
  description = "Enable CloudWatch logging"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "nbhd.city"
    ManagedBy   = "OpenTofu"
  }
}
