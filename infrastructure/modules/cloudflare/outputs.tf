# Cloudflare DNS Module Outputs

output "frontend_records" {
  description = "All CloudFront DNS records created in Cloudflare"
  value = {
    for domain, record in cloudflare_record.frontend_distributions :
    domain => {
      name    = record.name
      type    = record.type
      content = record.content
      proxied = record.proxied
      status  = record.status
      ttl     = record.ttl
      id      = record.id
    }
  }
}

output "alb_records" {
  description = "All ALB DNS records created in Cloudflare (if enabled)"
  value = {
    for domain, record in cloudflare_record.alb :
    domain => {
      name    = record.name
      type    = record.type
      content = record.content
      proxied = record.proxied
      status  = record.status
      ttl     = record.ttl
      id      = record.id
    }
  }
}

output "all_dns_records" {
  description = "Combined output of all DNS records for quick reference"
  value       = local.all_records
}

output "dns_status" {
  description = "DNS configuration summary"
  value = {
    zone_id          = var.cloudflare_zone_id
    proxy_enabled    = var.cloudflare_proxy_enabled
    frontend_domains = length(cloudflare_record.frontend_distributions)
    alb_domains      = length(cloudflare_record.alb)
    ssl_mode         = var.cloudflare_proxy_enabled ? "Full (Strict)" : "DNS Only"
  }
}
