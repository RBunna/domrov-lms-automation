region        = "ap-southeast-1"
ami_id        = "ami-0c55b159cbfafe1f0" # Replace with your desired AMI in ap-southeast-1
key_name      = "your-ec2-key-pair"
instance_type = "t3.medium"

# IMPORTANT: Database credentials should NOT be stored in this file
# For production, use one of these approaches:
# 1. Environment variables: export TF_VAR_db_pass="your_password"
# 2. AWS Secrets Manager
# 3. HashiCorp Vault
# 4. Terraform Cloud Remote Runs
# For local testing only, set via environment:
# export TF_VAR_db_user=admin
# export TF_VAR_db_pass=$(aws secretsmanager get-secret-value --secret-id rds-password --query SecretString --output text)

db_user = "admin"
# db_pass set via environment variable TF_VAR_db_pass

hosted_zone_id    = "Z1EXAMPLE1234567"
admin_cidr_blocks = ["10.0.0.0/8"] # Update with your IP/VPN range

asg_min_size         = 2
asg_max_size         = 4
asg_desired_capacity = 2

rds_multi_az                = true
rds_allocated_storage       = 100
rds_backup_retention_period = 30

domain_names        = ["domrov.app", "admin.domrov.app"]
acm_certificate_arn = ""
