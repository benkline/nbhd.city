# CloudFront distribution for static sites
# Serves sites from S3 with Lambda@Edge subdomain routing

# Cache policy for static content (aggressive caching for site assets)
resource "aws_cloudfront_cache_policy" "sites" {
  name            = "${var.project_name}-sites-cache-policy"
  comment         = "Cache policy for static sites"
  default_ttl     = 3600   # 1 hour
  max_ttl         = 86400  # 1 day
  min_ttl         = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    # Forward Host header so Lambda@Edge can extract subdomain
    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["Host"]
      }
    }

    query_strings_config {
      query_string_behavior = "none"
    }

    cookies_config {
      cookie_behavior = "none"
    }
  }
}

# Origin request policy to forward required headers to origin
resource "aws_cloudfront_origin_request_policy" "sites" {
  name            = "${var.project_name}-sites-origin-request-policy"
  comment         = "Forward Host header for Lambda@Edge subdomain extraction"

  # Headers config: Forward Host header to Lambda@Edge
  headers_config {
    header_behavior = "whitelist"
    headers {
      items = ["Host"]
    }
  }

  # Query strings: Don't forward
  query_strings_config {
    query_string_behavior = "none"
  }

  # Cookies: Don't forward
  cookies_config {
    cookie_behavior = "none"
  }
}

# CloudFront distribution for sites
resource "aws_cloudfront_distribution" "sites" {
  enabled = true
  comment = "Static sites distribution for ${var.sites_domain}"

  # Route all subdomains to this distribution
  aliases = ["*.${var.sites_domain}"]

  # Origin: S3 bucket with Origin Access Control
  origin {
    domain_name              = aws_s3_bucket.sites.bucket_regional_domain_name
    origin_id                = "sites-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.sites.id
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "sites-s3"

    cache_policy_id            = aws_cloudfront_cache_policy.sites.id
    origin_request_policy_id   = aws_cloudfront_origin_request_policy.sites.id
    compress                   = true
    viewer_protocol_policy     = "redirect-to-https"

    # Lambda@Edge for origin-request event: subdomain routing
    lambda_function_association {
      event_type   = "origin-request"
      lambda_arn   = aws_lambda_function.subdomain_router.qualified_arn
      include_body = false
    }
  }

  # Custom error responses
  custom_error_response {
    error_code            = 404
    error_caching_min_ttl = 300
    response_code         = 404
    response_page_path    = "/404.html"
  }

  custom_error_response {
    error_code            = 403
    error_caching_min_ttl = 300
    response_code         = 404
    response_page_path    = "/404.html"
  }

  # CloudFront viewer certificate: Custom SSL certificate
  viewer_certificate {
    acm_certificate_arn            = aws_acm_certificate.sites_wildcard.arn
    cloudfront_default_certificate = false
    minimum_protocol_version       = "TLSv1.2_2021"
    ssl_support_method             = "sni-only"
  }

  # Price class: PriceClass_100 (US, Europe, Japan only for cost optimization)
  # Change to PriceClass_All if global distribution needed
  price_class = "PriceClass_100"

  # Enable HTTP/2 and HTTP/2 push
  http_version = "http2and3"

  # Geo-restriction: Allow all locations
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Retain distribution when destroyed (prevents accidental deletion)
  retain_on_delete = false

  # NOTE: Certificate dependency removed - using default certificate for now
  # Once DNS is updated at registrar and certificate validates, update viewer_certificate above

  tags = merge(
    var.tags,
    {
      Name = "sites-cdn"
    }
  )
}
