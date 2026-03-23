# Remote state backend for team collaboration and disaster recovery
# Uses S3 with file-based locking

terraform {
  backend "s3" {
    bucket       = "domrov-terraform-state"
    key          = "prod/terraform.tfstate"
    region       = "ap-southeast-1"
    encrypt      = true
    use_lockfile = true
  }
}

# SETUP INSTRUCTIONS: Create the S3 backend before first terraform init
# Run these commands in order:
# 
# 1. Create S3 bucket:
#    aws s3api create-bucket --bucket domrov-terraform-state --region ap-southeast-1 --create-bucket-configuration LocationConstraint=ap-southeast-1
#
# 2. Enable versioning:
#    aws s3api put-bucket-versioning --bucket domrov-terraform-state --versioning-configuration Status=Enabled
#
# 3. Enable encryption:
#    aws s3api put-bucket-encryption --bucket domrov-terraform-state --server-side-encryption-configuration '{
#      "Rules": [{
#        "ApplyServerSideEncryptionByDefault": {
#          "SSEAlgorithm": "AES256"
#        }
#      }]
#    }'
#
# 4. Block public access:
#    aws s3api put-public-access-block --bucket domrov-terraform-state --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
#
# After running these commands, run: terraform init
