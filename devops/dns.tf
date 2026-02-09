# Route53 DNS configuration for wildcard subdomain routing
# Supports custom domains via sites_domain variable

# Hosted zone for the sites domain (conditional creation)
resource "aws_route53_zone" "sites" {
  count = var.create_hosted_zone ? 1 : 0
  name  = var.sites_domain

  tags = merge(
    var.tags,
    {
      Name = "sites-${var.sites_domain}"
    }
  )
}

# Data source to reference existing hosted zone if not created
data "aws_route53_zone" "sites" {
  count = var.create_hosted_zone ? 0 : 1
  name  = var.sites_domain
}

# Local to simplify zone ID reference
locals {
  route53_zone_id = var.create_hosted_zone ? aws_route53_zone.sites[0].zone_id : data.aws_route53_zone.sites[0].zone_id
}

# Wildcard A record: *.{sites_domain} → CloudFront distribution
resource "aws_route53_record" "wildcard_sites" {
  zone_id = local.route53_zone_id
  name    = "*.${var.sites_domain}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.sites.domain_name
    zone_id                = aws_cloudfront_distribution.sites.hosted_zone_id
    evaluate_target_health = false
  }

  depends_on = [aws_cloudfront_distribution.sites]
}

# Apex domain A record: {sites_domain} → main frontend CloudFront
# Points the root domain to the frontend distribution
resource "aws_route53_record" "apex_sites" {
  zone_id = local.route53_zone_id
  name    = var.sites_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }

  depends_on = [aws_cloudfront_distribution.frontend]
}
