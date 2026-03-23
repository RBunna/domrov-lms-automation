# Production-ready Domrov LMS Cloud Infrastructure
# This root module consolidates all environment-specific infrastructure

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
