# Infrastructure Outputs

# Network Outputs
output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "ID of the VPC"
}

output "vpc_cidr" {
  value       = "10.0.0.0/16"
  description = "CIDR block of the VPC"
}

output "public_subnet_ids" {
  value       = module.vpc.public_subnets
  description = "IDs of the public subnets"
}

output "private_subnet_ids" {
  value       = module.vpc.private_subnets
  description = "IDs of the private subnets"
}

# ALB Outputs
output "alb_dns_name" {
  value       = module.alb.alb_dns
  description = "DNS name of the Application Load Balancer"
}

output "alb_arn" {
  value       = module.alb.alb_arn
  description = "ARN of the Application Load Balancer"
}

output "alb_target_group_arn" {
  value       = module.alb.target_group_arn
  description = "ARN of the ALB target group"
}

# ASG Outputs
output "asg_name" {
  value       = module.asg.asg_name
  description = "Name of the Auto Scaling Group"
}

output "asg_arn" {
  value       = module.asg.asg_arn
  description = "ARN of the Auto Scaling Group"
}

# RDS Outputs
output "rds_endpoint" {
  value       = module.rds.db_instance_endpoint
  description = "RDS instance endpoint (host:port)"
  sensitive   = true
}

output "rds_database_name" {
  value       = "domrovdb"
  description = "Name of the RDS database"
}

output "rds_username" {
  value       = var.db_user
  description = "RDS administrator username"
  sensitive   = true
}

output "rds_arn" {
  value       = module.rds.db_instance_arn
  description = "ARN of the RDS instance"
}

# S3 Outputs
output "s3_bucket_id" {
  value       = module.s3.bucket_id
  description = "ID of the application S3 bucket"
}

output "s3_bucket_arn" {
  value       = module.s3.bucket_arn
  description = "ARN of the application S3 bucket"
}

# CloudFront Outputs
output "cloudfront_distributions" {
  value = {
    for domain, dist in aws_cloudfront_distribution.frontend :
    domain => {
      domain_name     = dist.domain_name
      distribution_id = dist.id
    }
  }
  description = "CloudFront distribution details for frontend domains"
}

output "frontend_domains" {
  value = {
    for domain in var.domain_names :
    domain => "https://${domain}"
  }
  description = "Frontend domain URLs"
}

# Security Outputs
output "security_group_alb" {
  value       = module.security.alb_sg
  description = "ALB security group ID"
}

output "security_group_ec2" {
  value       = module.security.ec2_sg
  description = "EC2 security group ID"
}

output "security_group_rds" {
  value       = module.security.rds_sg
  description = "RDS security group ID"
}

# Application Endpoints
output "application_url" {
  value       = "http://${module.alb.alb_dns}"
  description = "Application URL via ALB"
}

output "connection_info" {
  value = {
    alb_dns          = module.alb.alb_dns
    application_url  = "http://${module.alb.alb_dns}"
    frontend_domains = var.domain_names
    rds_endpoint     = module.rds.db_instance_endpoint
    s3_bucket        = module.s3.bucket_id
    asg_name         = module.asg.asg_name
    region           = var.region
  }
  description = "Summary of all connection information"
}
