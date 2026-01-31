# S3 bucket for built static sites
# Sites are organized as: /sites/{user_did}/{site_id}/

resource "aws_s3_bucket" "sites" {
  bucket = "${var.project_name}-sites-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    var.tags,
    {
      Name = "sites-storage"
    }
  )
}

# Block all public access to S3 bucket (CloudFront uses OAC)
resource "aws_s3_bucket_public_access_block" "sites" {
  bucket = aws_s3_bucket.sites.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning for data protection and rollback capability
resource "aws_s3_bucket_versioning" "sites" {
  bucket = aws_s3_bucket.sites.id

  versioning_configuration {
    status = "Enabled"
  }
}

# CORS configuration to allow requests from subdomains
resource "aws_s3_bucket_cors_configuration" "sites" {
  bucket = aws_s3_bucket.sites.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["https://*.${var.sites_domain}", "https://${var.sites_domain}"]
    max_age_seconds = 3000
  }
}

# Bucket policy: Allow CloudFront to access via Origin Access Control (OAC)
resource "aws_s3_bucket_policy" "sites" {
  bucket = aws_s3_bucket.sites.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudFrontOACAccess"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.sites.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.sites.id}"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.sites]
}

# Lifecycle rule: Delete old object versions after 30 days to save on storage
resource "aws_s3_bucket_lifecycle_configuration" "sites" {
  bucket = aws_s3_bucket.sites.id

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# Origin Access Control for CloudFront (more secure than legacy OAI)
resource "aws_cloudfront_origin_access_control" "sites" {
  name                              = "${var.project_name}-sites-oac"
  description                       = "OAC for ${var.project_name} sites bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}
