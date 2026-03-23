# Domrov LMS - Terraform Deployment Guide

This guide provides step-by-step instructions for deploying the production-ready cloud infrastructure on AWS.

## Prerequisites

Before you start, ensure you have:

1. **AWS Account** with appropriate permissions
2. **Terraform** installed (>= 1.5.0)
3. **AWS CLI** installed and configured
4. **Valid EC2 key pair** in your AWS account
5. **Route53 hosted zone** already created
6. **Administrator access** to your AWS account for initial setup

## Pre-Deployment Setup

### 1. Configure AWS Credentials

Use one of these approaches (in order of preference for production):

**Option A: AWS Profile (Recommended)**

```bash
# Configure a named profile
aws configure --profile domrov-prod

# Export the profile to environment
export AWS_PROFILE=domrov-prod
```

**Option B: Environment Variables**

```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=ap-southeast-1
```

**Option C: AWS SSO**

```bash
aws sso login --profile domrov-prod
export AWS_PROFILE=domrov-prod
```

### 2. Set Database Password

Store your database password securely:

```bash
# Option 1: Export as environment variable
export TF_VAR_db_pass="YourSecurePassword123!@#"

# Option 2: Use AWS Secrets Manager (Recommended for production)
aws secretsmanager create-secret \
  --name rds-password \
  --secret-string "YourSecurePassword123!@#"

export TF_VAR_db_pass=$(aws secretsmanager get-secret-value \
  --secret-id rds-password \
  --query SecretString \
  --output text)
```

### 3. Create Remote State Backend

Set up S3 bucket and DynamoDB table for Terraform state:

```bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket domrov-terraform-state \
  --region ap-southeast-1 \
  --create-bucket-configuration LocationConstraint=ap-southeast-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket domrov-terraform-state \
  --versioning-configuration Status=Enabled

# Block public access
aws s3api put-public-access-block \
  --bucket domrov-terraform-state \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket domrov-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-1
```

### 4. Prepare Terraform Variables

Copy the example variables file and customize:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:

- `ami_id`: Ubuntu 22.04 AMI in ap-southeast-1
- `key_name`: Your EC2 key pair name
- `hosted_zone_id`: Your Route53 hosted zone ID
- `admin_cidr_blocks`: Your office/VPN IP range (restrict SSH access)
- `db_user`: Database username
- `domain_names`: Your frontend domain names

Example:

```hcl
ami_id      = "ami-0c55b159cbfafe1f0"  # Ubuntu 22.04 in ap-southeast-1
key_name    = "my-prod-key"
hosted_zone_id = "Z1EXAMPLE1234567"
admin_cidr_blocks = ["203.0.113.0/24"]  # Your office IP / VPN
db_user     = "admin"
domain_names = ["domrov.app", "admin.domrov.app"]
```

### 5. Verify the AMI ID

Find the correct Ubuntu 22.04 AMI for your region:

```bash
aws ec2 describe-images \
  --region ap-southeast-1 \
  --owners 099720109477 \
  --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
  --query 'Images | sort_by(@, &CreationDate) | [-1].[ImageId,Name]' \
  --output text
```

## Deployment Process

### Step 1: Initialize Terraform

```bash
cd infrastructure
terraform init
```

### Step 2: Validate Configuration

```bash
terraform validate
```

Output should show:

```
Success! The configuration is valid.
```

### Step 3: Plan Infrastructure

Create a plan to preview changes:

```bash
terraform plan -out=tfplan
```

Review the output carefully. You should see approximately:

- 1 VPC
- 2 internet gateways
- 2 public subnets
- 2 private subnets
- 3 security groups
- 1 ALB with target group and listener
- 1 Auto Scaling Group
- 1 RDS PostgreSQL instance (Multi-AZ)
- 1 S3 bucket with logging
- 2 CloudFront distributions
- 2 Route53 records

### Step 4: Apply Infrastructure

**IMPORTANT**: This will create real AWS resources and incur charges.

```bash
terraform apply tfplan
```

The deployment will take approximately 15-20 minutes.

### Step 5: Verify Deployment

Retrieve outputs:

```bash
terraform output connection_info
```

Expected outputs:

- `alb_dns`: Your Application Load Balancer DNS
- `application_url`: URL to access your application
- `rds_endpoint`: RDS connection string
- `asg_name`: Auto Scaling Group name
- `frontend_domains`: Your static site domains

## Post-Deployment Steps

### 1. Configure Application on EC2 Instances

SSH into an instance to configure your application:

```bash
# Get the ALB DNS
ALB_DNS=$(terraform output -raw alb_dns)

# SSH to instance (via ALB IP or through bastion)
ssh -i your-key.pem ec2-user@<instance-ip>
```

### 2. Deploy Application Code

On the EC2 instances:

```bash
# Install Node.js/NestJS dependencies
curl https://nodejs.org/dist/v18.16.0/node-v18.16.0-linux-x64.tar.xz | tar -xJ -C /opt
export PATH=/opt/node-v18.16.0-linux-x64/bin:$PATH

# Clone and deploy your application
git clone <your-repo>
cd backend_nest
npm install
npm run build
npm start
```

### 3. Create Application Database

Connect to RDS:

```bash
# Get RDS endpoint
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)

# Connect to database
psql -h $RDS_ENDPOINT -U admin -d domrovdb

# Run migrations (from your application)
# npm run migration:run
```

### 4. Deploy Frontend

For each frontend domain:

```bash
# Build your React/admin app
cd apps/admin  # or apps/react-client
npm run build

# Upload to S3 and invalidate CloudFront cache
AWS_PROFILE=domrov-prod aws s3 sync dist/ s3://frontend-domrov-app/

# Invalidate CloudFront cache
DIST_ID=$(terraform output -json cloudfront_distributions | jq -r '.["domrov.app"].distribution_id')
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

### 5. Configure SSL/HTTPS

For production, set up SSL certificates:

```bash
# Request ACM certificate
aws acm request-certificate \
  --domain-name domrov.app \
  --subject-alternative-names admin.domrov.app \
  --validation-method DNS \
  --region ap-southeast-1

# Update terraform.tfvars with certificate ARN
# acm_certificate_arn = "arn:aws:acm:..."

# Reapply to update CloudFront
terraform apply
```

## Monitoring & Maintenance

### Monitor Auto Scaling Group

```bash
# View instances
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names $(terraform output -raw asg_name)

# View scaling activities
aws autoscaling describe-scaling-activities \
  --auto-scaling-group-name $(terraform output -raw asg_name)
```

### Monitor RDS

```bash
# View database metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=domrov-postgres \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### View ALB Logs

```bash
# ALB logs are stored in S3
aws s3 ls s3://domrov-alb-logs/
```

## Backup & Disaster Recovery

### RDS Backups

Automated backups are enabled (30-day retention):

```bash
# Manual backup
aws rds create-db-snapshot \
  --db-instance-identifier domrov-postgres \
  --db-snapshot-identifier domrov-postgres-backup-$(date +%Y%m%d-%H%M%S)

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier domrov-postgres
```

### S3 Bucket Backup

Versioning is enabled on all S3 buckets:

```bash
# List versions
aws s3api list-object-versions --bucket $(terraform output -json s3_outputs | jq -r '.bucket_id')
```

## Scaling & Performance Tuning

### Auto Scaling Configuration

Modify ASG settings in `terraform.tfvars`:

```hcl
asg_min_size = 2           # Minimum instances
asg_max_size = 6           # Maximum instances
asg_desired_capacity = 3   # Desired instances

rds_multi_az = true        # High availability for RDS
```

### Reapply changes:

```bash
terraform plan
terraform apply
```

## Cost Optimization

### Review Costs

```bash
# Get EC2 costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --filter file://cost-filter.json
```

### Reduce Costs

1. **Downsize RDS**: Change `instance_type` from `db.t3.small` to `db.t3.micro`
2. **Reduce ASG capacity**: Lower `asg_max_size` and `asg_desired_capacity`
3. **Use Reserved Instances**: Purchase RIs for RDS and EC2

## Destruction (Caution!)

To destroy all infrastructure:

```bash
# Create final snapshot
terraform apply -var="rds_backup_retention_period=7"

# List all snapshots
aws rds describe-db-snapshots

# Destroy infrastructure (WARNING: This will delete all resources)
terraform destroy
```

**IMPORTANT**: This will:

- Delete all EC2 instances
- Delete RDS database (final snapshot will be retained)
- Delete S3 buckets (with data!)
- Delete all security groups and VPC

## Troubleshooting

### Common Issues

**Issue: Terraform state lock**

```bash
# View locks
aws dynamodb scan --table-name terraform-locks

# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

**Issue: EC2 instance fails to launch**

- Check AMI ID exists in your region
- Verify EC2 key pair exists
- Check security group configuration

**Issue: RDS connection fails**

- Verify RDS security group allows TCP 5432 from EC2
- Check RDS endpoint in terraform output
- Verify database credentials

**Issue: CloudFront shows 403 Forbidden**

- Check S3 bucket policy
- Verify CloudFront OAI has access
- Check CloudFront cache TTL

## Support & References

- **Terraform Documentation**: https://www.terraform.io/docs
- **AWS Documentation**: https://docs.aws.amazon.com/
- **Architecture Diagram**: See `infrastructure/diagram.py`

---

**Created**: 2024
**Last Updated**: 2024
**Status**: Production Ready
