# Cloudflare DNS Module Variables

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for the primary domain"
  type        = string
  sensitive   = false
}

variable "domain_names" {
  description = "List of domain names to create DNS records for"
  type        = list(string)
}

variable "cloudfront_distributions" {
  description = "Map of CloudFront distribution objects keyed by domain name"
  type = map(object({
    domain_name    = string
    hosted_zone_id = string
  }))
}

variable "cloudflare_proxy_enabled" {
  description = "Enable Cloudflare proxy (orange cloud) for all DNS records"
  type        = bool
  default     = true
}

variable "enable_alb_records" {
  description = "Enable ALB DNS records in addition to CloudFront"
  type        = bool
  default     = false
}

variable "alb_records" {
  description = "Map of ALB domain names to ALB DNS names for CNAME records"
  type        = map(string)
  default     = {}

  # Example:
  # {
  #   "api.domrov.app" = "domrov-alb-123456.ap-southeast-1.elb.amazonaws.com"
  # }
}
