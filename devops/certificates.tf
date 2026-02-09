# ACM wildcard certificate for subdomain routing
# Must be in us-east-1 for CloudFront usage

# Wildcard certificate for *.sites_domain
resource "aws_acm_certificate" "sites_wildcard" {
  provider            = aws.us_east_1
  domain_name         = "*.${var.sites_domain}"
  validation_method   = "DNS"
  subject_alternative_names = [var.sites_domain]

  tags = merge(
    var.tags,
    {
      Name = "sites-wildcard-${var.sites_domain}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# DNS validation records for ACM certificate
resource "aws_route53_record" "sites_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.sites_wildcard.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = local.route53_zone_id

  depends_on = [aws_route53_zone.sites, data.aws_route53_zone.sites]
}

# Wait for certificate validation to complete
resource "aws_acm_certificate_validation" "sites_wildcard" {
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.sites_wildcard.arn

  # Wait for all DNS validation records to be created
  # Note: DNS propagation can take up to 10-15 minutes globally
  timeouts {
    create = "30m"
  }

  depends_on = [aws_route53_record.sites_cert_validation]
}
