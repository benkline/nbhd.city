# Cache policy for API requests (no caching, forward all)
resource "aws_cloudfront_cache_policy" "frontend_api" {
  name            = "${var.project_name}-frontend-api-cache-policy"
  comment         = "No caching for API requests"
  default_ttl     = 0
  max_ttl         = 0
  min_ttl         = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["Host", "Authorization"]
      }
    }

    query_strings_config {
      query_string_behavior = "all"
    }

    cookies_config {
      cookie_behavior = "all"
    }
  }
}

# Cache policy for static assets
resource "aws_cloudfront_cache_policy" "frontend_static" {
  name            = "${var.project_name}-frontend-static-cache-policy"
  comment         = "Cache policy for static assets"
  default_ttl     = 3600   # 1 hour
  max_ttl         = 86400  # 1 day
  min_ttl         = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }

    cookies_config {
      cookie_behavior = "none"
    }
  }
}

# S3 bucket for frontend assets
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "${var.project_name}-frontend"
  }
}

# Block all public access by default (CloudFront will handle access)
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning for the bucket
resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket policy to allow CloudFront access
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.frontend.id}"
          }
        }
      }
    ]
  })
}

# Upload frontend assets to S3
resource "aws_s3_object" "frontend_files" {
  for_each = fileset(var.frontend_artifact_path, "**")

  bucket = aws_s3_bucket.frontend.id
  key    = each.value
  source = "${var.frontend_artifact_path}/${each.value}"

  # Set correct content type
  content_type = lookup(
    {
      "html"  = "text/html"
      "js"    = "application/javascript"
      "css"   = "text/css"
      "json"  = "application/json"
      "png"   = "image/png"
      "jpg"   = "image/jpeg"
      "gif"   = "image/gif"
      "svg"   = "image/svg+xml"
      "woff"  = "font/woff"
      "woff2" = "font/woff2"
    },
    regex("\\w+$", each.value),
    "application/octet-stream"
  )

  etag = filemd5("${var.frontend_artifact_path}/${each.value}")

  tags = {
    Name = "frontend-asset-${each.value}"
  }
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "frontend" {
  comment = "${var.project_name}-frontend-oai"
}

# CloudFront distribution for frontend
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "s3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # Optional: API Gateway origin (uncomment when API is deployed)
  # origin {
  #   domain_name = var.api_gateway_domain
  #   origin_id   = "api-gateway"
  # }

  # Cache behavior for API requests (optional, requires api-gateway origin)
  # Uncomment when API Gateway is deployed
  # ordered_cache_behavior {
  #   path_pattern           = "/api/*"
  #   allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
  #   cached_methods         = ["GET", "HEAD"]
  #   target_origin_id       = "api-gateway"
  #   viewer_protocol_policy = "redirect-to-https"
  #   compress               = true
  #
  #   cache_policy_id          = aws_cloudfront_cache_policy.frontend_api.id
  #   origin_request_policy_id = aws_cloudfront_origin_request_policy.frontend_api.id
  # }

  # Default cache behavior for frontend assets
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-frontend"

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    cache_policy_id          = aws_cloudfront_cache_policy.frontend_static.id
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  depends_on = [aws_s3_bucket_public_access_block.frontend]

  tags = {
    Name = "${var.project_name}-frontend-cdn"
  }
}

# Origin Access Control for S3
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.project_name}-frontend-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 bucket CORS configuration
resource "aws_s3_bucket_cors_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
