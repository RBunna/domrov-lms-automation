# Production-ready Domrov LMS Cloud Infrastructure
# This root module consolidates all environment-specific infrastructure
#
# CHANGE NOTES:
# - Replaced AWS Route53 with Cloudflare DNS management (main change)
# - Added cloudflare module for modular DNS management
# - Removed hosted_zone_id variable dependency

# Ensure all modules are properly sourced from the local filesystem

module "vpc" {
  source = "./modules/vpc"
}

module "security" {
  source            = "./modules/security"
  vpc_id            = module.vpc.vpc_id
  admin_cidr_blocks = var.admin_cidr_blocks
}

module "iam" {
  source = "./modules/iam"
}

module "s3" {
  source = "./modules/s3"
}

module "alb" {
  source     = "./modules/alb"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.public_subnets
  sg_id      = module.security.alb_sg
}

module "asg" {
  source = "./modules/autoscaling"

  name                 = "domrov"
  ami_id               = var.ami_id
  instance_type        = var.instance_type
  subnet_ids           = module.vpc.public_subnets
  sg_id                = module.security.ec2_sg
  key_name             = var.key_name
  target_group         = module.alb.target_group_arn
  iam_instance_profile = module.iam.instance_profile
  min_size             = var.asg_min_size
  max_size             = var.asg_max_size
  desired_capacity     = var.asg_desired_capacity
}

module "rds" {
  source = "./modules/rds"

  subnet_ids              = module.vpc.private_subnets
  sg_id                   = module.security.rds_sg
  username                = var.db_user
  password                = var.db_pass
  multi_az                = var.rds_multi_az
  allocated_storage       = var.rds_allocated_storage
  backup_retention_period = var.rds_backup_retention_period
}

module "cloudwatch" {
  source   = "./modules/cloudwatch"
  asg_name = module.asg.asg_name
}

# ============================================================
# CLOUDFLARE DNS MANAGEMENT MODULE
# ============================================================
# CHANGE NOTES: 
# - NEW: Replaces AWS Route53 DNS records
# - Manages all DNS records in Cloudflare
# - Enables Cloudflare proxy for SSL/TLS and CDN
# - Supports Full (Strict) SSL mode with ACM certificates
# 
# PREREQUISITES:
# 1. Domain registered in Cloudflare
# 2. Cloudflare API token with DNS edit permissions
# 3. CloudFront distributions must have valid ACM certificates
#
# SETUP:
# 1. Get Cloudflare Zone ID from dashboard (Overview tab)
# 2. Generate API token with "Edit zone DNS" permission
# 3. Set environment variables:
#    export TF_VAR_cloudflare_zone_id="your-zone-id"
#    export TF_VAR_cloudflare_api_token="your-api-token"
# 4. Run: terraform init && terraform plan && terraform apply

module "cloudflare" {
  source = "./modules/cloudflare"

  cloudflare_zone_id = var.cloudflare_zone_id
  domain_names       = var.domain_names

  # Pass CloudFront distributions for DNS configuration
  cloudfront_distributions = {
    for domain in var.domain_names :
    domain => {
      domain_name    = aws_cloudfront_distribution.frontend[domain].domain_name
      hosted_zone_id = aws_cloudfront_distribution.frontend[domain].hosted_zone_id
    }
  }

  cloudflare_proxy_enabled = var.cloudflare_proxy_enabled

  # Optional: Enable ALB DNS records
  enable_alb_records = false
  alb_records = {
    # Uncomment and set to enable ALB records:
    # "api.domrov.app" = module.alb.alb_dns_name
  }

  depends_on = [aws_cloudfront_distribution.frontend]
}
