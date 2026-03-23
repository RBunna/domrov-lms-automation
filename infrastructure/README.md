# Domrov LMS - Infrastructure as Code (Terraform)

This directory contains production-ready Terraform configuration for deploying the Domrov Learning Management System on AWS.

## 📋 Overview

The infrastructure follows AWS best practices and creates:

### Network & Security

- **VPC**: 10.0.0.0/16 with IPv4 only
- **Subnets**: 2 public + 2 private across 2 AZs
- **Security Groups**: Restricted access (SSH limited to admin IPs)
- **NAT Gateway**: For private subnet outbound traffic (optional)

### Compute

- **Application Load Balancer**: Routes HTTP/HTTPS traffic
- **Auto Scaling Group**: 2-4 EC2 instances (t3.medium)
- **Launch Template**: Configured with security best practices

### Database

- **RDS PostgreSQL**: Multi-AZ deployment for high availability
- **Storage**: 100GB gp3 with encryption
- **Backup**: 30-day automated backups
- **Monitoring**: CloudWatch integration

### Storage & CDN

- **S3 Buckets**: Private access with versioning and encryption
- **CloudFront**: CDN distributions for static assets
- **Access Control**: Origin Access Identities (OAI) for secure S3 access

### Monitoring

- **CloudWatch**: CPU and memory monitoring
- **Auto Scaling Policies**: CPU-based scaling (70% threshold)
- **Alarms**: High CPU utilization alerts

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              AWS Region: ap-southeast-1                 │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐   │
│  │            VPC (10.0.0.0/16)                    │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │  Internet (Route53 + CloudFront)          │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  │         ↓                                        │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │  Public Subnets (ALB)                      │ │   │
│  │  │  - ALB (HTTP/HTTPS)                        │ │   │
│  │  │  - NAT Gateway (optional)                  │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  │         ↓                                        │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │  Private Subnets (Application)             │ │   │
│  │  │  - ASG (EC2 × 2-4)                         │ │   │
│  │  │  - NestJS Application                      │ │   │
│  │  │  - Python Workers (gRPC)                   │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  │         ↓                                        │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │  Private Subnets (Data)                    │ │   │
│  │  │  - RDS PostgreSQL (Multi-AZ)               │ │   │
│  │  │  - ElastiCache (optional)                  │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  S3 Buckets (Global)                            │   │
│  │  - Frontend Assets (CloudFront)                 │   │
│  │  - Application Data (Private)                   │   │
│  │  - Logs (Access & CloudFront)                   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
infrastructure/
├── backend.tf                 # Remote state backend (S3 + DynamoDB)
├── main.tf                    # Root module orchestrating all services
├── providers.tf               # AWS provider configuration
├── variables.tf               # Input variables (region, AMI, credentials)
├── outputs.tf                 # Terraform outputs
├── frontend.tf                # CloudFront + S3 for static sites
├── terraform.tfvars           # Variable values (DO NOT COMMIT SECRETS)
├── terraform.tfvars.example   # Example variables file
├── versions.tf                # Terraform version requirements
├── DEPLOYMENT_GUIDE.md        # Detailed deployment instructions
├── README.md                  # This file
├── modules/
│   ├── vpc/                   # VPC, subnets, internet gateway
│   ├── security/              # Security groups
│   ├── iam/                   # IAM roles and policies
│   ├── s3/                    # S3 buckets with encryption/versioning
│   ├── alb/                   # Application Load Balancer
│   ├── autoscaling/           # Auto Scaling Group
│   ├── rds/                   # RDS PostgreSQL database
│   └── cloudwatch/            # CloudWatch monitoring
└── environments/
    └── prod/                  # Production environment (deprecated - moved to root)
```

## 🚀 Quick Start

### 1. Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured
- EC2 key pair created

### 2. Initialize

```bash
cd infrastructure
terraform init
```

### 3. Plan

```bash
terraform plan
```

### 4. Apply

```bash
export TF_VAR_db_pass="YourPassword123!@#"
terraform apply
```

## 🔑 Key Features

✅ **Security**

- No hardcoded credentials
- Security groups with least-privilege access
- SSH restricted to admin IPs only
- S3 bucket public access blocked
- Encryption at rest (S3, RDS)
- Security group rules for inter-service communication

✅ **High Availability**

- RDS Multi-AZ deployment
- Auto Scaling Group (2-4 instances)
- Application Load Balancer
- Multiple subnets across AZs

✅ **Observability**

- CloudWatch monitoring and alarms
- RDS enhanced monitoring
- Application Load Balancer access logs
- Auto Scaling activity logs

✅ **Backup & Recovery**

- RDS automated backups (30 days)
- S3 versioning enabled
- CloudFront distribution caching
- Final snapshot before RDS deletion

✅ **Best Practices**

- Modular Terraform structure
- Remote state backend (S3 + DynamoDB)
- Environment variables for secrets
- Comprehensive variable documentation
- Rich output information

## 📊 Estimated Costs (Monthly)

```
Component                          Estimated Cost
────────────────────────────────────────────────
VPC & Networking                   $0 (free tier)
EC2 (2× t3.medium on-demand)       ~$60-80
RDS PostgreSQL (db.t3.small, Multi-AZ) ~$200-250
ALB                                ~$15-20
S3 Storage (100GB)                 ~$2-3
CloudFront (1TB transfer)          ~$10-15
Data Transfer                      ~$10-20
────────────────────────────────────────────────
Total Monthly                      ~$300-400
```

**Note**: Use Reserved Instances for 30-40% savings on compute.

## 🔧 Configuration

### Update Infrastructure Size

Edit `terraform.tfvars`:

```hcl
# Increase instance type for more power
instance_type = "t3.large"

# Increase database size
rds_allocated_storage = 200

# Adjust auto-scaling
asg_max_size = 10
```

### Enable HTTPS

```hcl
# Set ACM certificate ARN
acm_certificate_arn = "arn:aws:acm:..."
enable_https_redirect = true
```

### Restrict SSH Access

```hcl
# Limit SSH to your office IP
admin_cidr_blocks = ["203.0.113.0/24", "198.51.100.0/24"]
```

## 📝 Variables

| Variable            | Type   | Default                              | Description                |
| ------------------- | ------ | ------------------------------------ | -------------------------- |
| `region`            | string | `ap-southeast-1`                     | AWS region                 |
| `ami_id`            | string | -                                    | Ubuntu 22.04 AMI ID        |
| `key_name`          | string | -                                    | EC2 key pair name          |
| `db_user`           | string | `admin`                              | RDS username               |
| `db_pass`           | string | -                                    | RDS password (use env var) |
| `instance_type`     | string | `t3.medium`                          | EC2 instance type          |
| `admin_cidr_blocks` | list   | `["0.0.0.0/0"]`                      | SSH access CIDR blocks     |
| `rds_multi_az`      | bool   | `true`                               | Enable RDS Multi-AZ        |
| `domain_names`      | list   | `["domrov.app", "admin.domrov.app"]` | CloudFront domains         |

## 🎯 Outputs

After `terraform apply`, retrieve outputs:

```bash
terraform output connection_info
```

Key outputs:

- `alb_dns_name`: Application Load Balancer DNS
- `rds_endpoint`: Database connection string
- `cloudfront_distributions`: CloudFront URLs
- `asg_name`: Auto Scaling Group name
- `s3_bucket_id`: Application S3 bucket

## 🔗 Accessing Services

### Application

```bash
curl http://$(terraform output -raw alb_dns_name)
```

### Database

```bash
psql -h $(terraform output -raw rds_endpoint | cut -d: -f1) \
  -U admin -d domrovdb
```

### Frontend

```
https://domrov.app
https://admin.domrov.app
```

## ⚠️ Important Notes

1. **Credentials**: Never commit `terraform.tfvars` with real passwords
2. **State Locking**: Backend configured with DynamoDB locks
3. **Database**: `skip_final_snapshot = false` creates snapshot on destroy
4. **Costs**: Review AWS pricing before applying
5. **SSH**: Default allows all IPs - restrict in `admin_cidr_blocks`

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [AWS Terraform Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Documentation](https://www.terraform.io/docs)

## 🤝 Support

For issues or questions:

1. Check `DEPLOYMENT_GUIDE.md` for troubleshooting
2. Review Terraform logs: `TF_LOG=DEBUG terraform apply`
3. Check AWS CloudFormation events console

## 📄 License

[Your License Here]

---

**Status**: ✅ Production Ready  
**Last Updated**: 2024  
**Maintained By**: [Your Team]
