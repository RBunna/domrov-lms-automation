module "vpc" {
  source = "../../modules/vpc"
}

module "security" {
  source = "../../modules/security"
  vpc_id = module.vpc.vpc_id
}

module "iam" {
  source = "../../modules/iam"
}

module "s3" {
  source = "../../modules/s3"
}

module "alb" {
  source = "../../modules/alb"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.public_subnets
  sg_id      = module.security.alb_sg
}

module "asg" {
  source = "../../modules/autoscaling"

  ami_id        = var.ami_id
  instance_type = "t3.micro"
  subnet_ids    = module.vpc.public_subnets
  sg_id         = module.security.ec2_sg
  key_name      = var.key_name
  target_group  = module.alb.target_group_arn
  iam_instance_profile = module.iam.instance_profile
}

module "rds" {
  source = "../../modules/rds"

  subnet_ids = module.vpc.private_subnets
  sg_id      = module.security.rds_sg
  username   = var.db_user
  password   = var.db_pass
}

module "cloudwatch" {
  source   = "../../modules/cloudwatch"
  asg_name = module.asg.asg_name
}