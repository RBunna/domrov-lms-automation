# Terraform Local Backend Configuration
# 
# WORKFLOW:
# 1. terraform init && terraform apply
#    ↓ Creates S3 bucket and DynamoDB table (in terraform_backend.tf)
# 2. After apply, get bucket name from terraform state
# 3. Uncomment remote backend config below
# 4. terraform init -migrate-state
#
# See MIGRATE_TO_REMOTE_BACKEND.md for detailed steps

terraform {
  # Local backend - uses terraform.tfstate file in current directory
  # After first 'terraform apply', resources are created to support remote backend
}

# After first apply completes, follow these steps to migrate to remote backend:
# 1. In powershell, run: terraform state show aws_s3_bucket.terraform_state
# 2. Copy the bucket ID (e.g., "domrov-terraform-state-a1b2c3d4")
# 3. Uncomment the backend config below and replace BUCKET_NAME with the actual bucket ID
# 4. Run: terraform init -migrate-state
# 5. Answer 'yes' to migrate existing state to S3
#
# REMOTE BACKEND CONFIG (uncomment after first apply):
#
# terraform {
#   backend "s3" {
#     bucket         = "BUCKET_NAME_FROM_STEP_2"  # e.g., "domrov-terraform-state-a1b2c3d4"
#     key            = "prod/terraform.tfstate"
#     region         = "ap-southeast-1"
#     encrypt        = true
#     dynamodb_table = "domrov-terraform-locks"
#   }
# }
