variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "ap-southeast-1"
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
}

variable "key_name" {
  description = "EC2 key pair name for SSH access"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type for ASG"
  type        = string
  default     = "t3.medium"
}

variable "db_user" {
  description = "RDS database admin username"
  type        = string
  sensitive   = true
}

variable "db_pass" {
  description = "RDS database admin password"
  type        = string
  sensitive   = true
}

variable "domain_names" {
  description = "List of frontend domain names"
  type        = list(string)
  default     = ["domrov.app", "admin.domrov.app"]
}

# CHANGE NOTES: Removed hosted_zone_id (Route53)
# Now using Cloudflare for DNS management
variable "cloudflare_api_token" {
  description = "Cloudflare API token for DNS management"
  type        = string
  sensitive   = true

  # Set via environment variable: export TF_VAR_cloudflare_api_token="your-api-token"
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for the root domain (e.g., domrov.app)"
  type        = string
  sensitive   = false

  # Retrieve from Cloudflare dashboard: Zone ID is shown in the Overview page
}

variable "cloudflare_proxy_enabled" {
  description = "Enable Cloudflare proxy (orange cloud) for DNS records"
  type        = bool
  default     = true

  # When true: Cloudflare proxies all traffic (acts as CDN + WAF)
  # When false: DNS only (CNAME bypass)
  # Note: For Full (Strict) SSL mode, origin must have valid certificate
}


variable "admin_cidr_blocks" {
  description = "CIDR blocks allowed for SSH access (restrict to admin IPs)"
  type        = list(string)
  default     = ["0.0.0.0/0"] # CHANGE THIS: Replace with your admin IP or VPN IP range
}

variable "asg_min_size" {
  description = "Auto Scaling Group minimum size"
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "Auto Scaling Group maximum size"
  type        = number
  default     = 4
}

variable "asg_desired_capacity" {
  description = "Auto Scaling Group desired capacity"
  type        = number
  default     = 2
}

variable "rds_multi_az" {
  description = "Enable Multi-AZ for RDS (high availability)"
  type        = bool
  default     = true
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 100
}

variable "rds_backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
  default     = 30
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for CloudFront custom domains"
  type        = string
  default     = "" # Set if you have an existing certificate
}

variable "enable_https_redirect" {
  description = "Enable HTTPS redirect for ALB"
  type        = bool
  default     = false # Set to true if you have HTTPS certificates
}
