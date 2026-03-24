region        = "ap-southeast-1"
ami_id        = "ami-0e7ff22101b84bcff"
key_name      = "domrov.pem"
instance_type = "t3.micro"
db_user       = "admin"

# CHANGE NOTES: Removed hosted_zone_id (Route53)
# Now using Cloudflare for DNS management

# Cloudflare Configuration
# Get Zone ID from: https://dash.cloudflare.com/ → Your Domain → Overview → bottom right
# Environment variable: export TF_VAR_cloudflare_zone_id="your-zone-id"
cloudflare_zone_id = "CHANGE_THIS_ZONE_ID"

# Enable Cloudflare proxy (orange cloud) for SSL/TLS and CDN
cloudflare_proxy_enabled = true

# Admin CIDR blocks for SSH access
admin_cidr_blocks = ["10.0.0.0/8"] # Update with your IP/VPN range

# Auto Scaling Group configuration
asg_min_size         = 2
asg_max_size         = 4
asg_desired_capacity = 2

# RDS Database configuration
rds_multi_az                = true
rds_allocated_storage       = 100
rds_backup_retention_period = 30

# Frontend domains (DNS records will be created in Cloudflare)
domain_names = ["domrov.app", "admin.domrov.app"]

# ACM Certificate (optional - leave empty for CloudFront default certificate)
acm_certificate_arn = ""

# IMPORTANT: Set Cloudflare API Token via environment variable:
# export TF_VAR_cloudflare_api_token="your-cloudflare-api-token"
# 
# To generate API token:
# 1. Go to https://dash.cloudflare.com/profile/api-tokens
# 2. Click "Create Token"
# 3. Select "Edit zone DNS" template
# 4. Choose your domain in "Zone Resources"
# 5. Click "Continue to summary" and "Create Token"
