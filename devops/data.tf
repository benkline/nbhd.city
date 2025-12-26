# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Get AWS region data
data "aws_region" "current" {}
