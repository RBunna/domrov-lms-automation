region        = "ap-southeast-1"
ami_id        = "ami-0e7ff22101b84bcff" 
key_name      = "domrov.pem" 
instance_type = "t3.micro"
db_user = "admin"

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
