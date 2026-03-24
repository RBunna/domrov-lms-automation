# Cloudflare DNS Module Main Configuration
# 
# This module manages DNS records in Cloudflare for:
# 1. CloudFront distributions (frontend domains)
# 2. Application Load Balancer (API/backend domains)
#
# CHANGE NOTES:
# - Replaces AWS Route53 DNS management
# - Uses Cloudflare proxy for SSL/TLS termination
# - Supports Full (Strict) SSL mode with ACM certificates
# - Modular design for easy management

# ============================================================
# CLOUDFRONT DISTRIBUTION DNS RECORDS
# ============================================================
# CNAME records pointing frontend domains to CloudFront distributions
# 
# DNS Resolution Flow:
# 1. User requests domrov.app
# 2. Cloudflare resolves to CloudFront domain
# 3. CloudFront serves content from S3 origin
# 4. Cloudflare proxy adds SSL/TLS encryption
#
# Requirements:
# - CloudFront distribution must have valid ACM certificate
# - ACM certificate must match domain name or be a wildcard certificate

resource "cloudflare_record" "frontend_distributions" {
  for_each = var.cloudfront_distributions

  zone_id = var.cloudflare_zone_id
  name    = each.key
  type    = "CNAME"
  content = each.value.domain_name
  ttl     = 1 # TTL 1 = Automatic (Cloudflare optimizes caching)
  proxied = var.cloudflare_proxy_enabled

  comment = "CloudFront distribution for ${each.key} (Managed by Terraform)"

  # Allow changes from Cloudflare dashboard without Terraform conflicts
  lifecycle {
    ignore_changes = [comment]
  }
}

# ============================================================
# ALB DNS RECORDS (OPTIONAL)
# ============================================================
# CNAME records for ALB endpoints (e.g., api.domrov.app)
# Only created if enable_alb_records is true
#
# Usage Example in root main.tf:
# enable_alb_records = true
# alb_records = {
#   "api.domrov.app" = module.alb.alb_dns_name
# }

resource "cloudflare_record" "alb" {
  for_each = var.enable_alb_records ? var.alb_records : {}

  zone_id = var.cloudflare_zone_id
  name    = each.key
  type    = "CNAME"
  content = each.value
  ttl     = 1
  proxied = var.cloudflare_proxy_enabled

  comment = "ALB endpoint for ${each.key} (Managed by Terraform)"

  lifecycle {
    ignore_changes = [comment]
  }
}

# ============================================================
# OUTPUTS FOR REFERENCE
# ============================================================
# Display all DNS records managed by this module

locals {
  all_records = merge(
    {
      for domain, record in cloudflare_record.frontend_distributions :
      domain => {
        type    = record.type
        content = record.content
        proxied = record.proxied
        status  = record.status
        ttl     = record.ttl
      }
    },
    {
      for domain, record in cloudflare_record.alb :
      domain => {
        type    = record.type
        content = record.content
        proxied = record.proxied
        status  = record.status
        ttl     = record.ttl
      }
    }
  )
}
