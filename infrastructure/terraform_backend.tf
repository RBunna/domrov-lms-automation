# Terraform Remote State Backend Infrastructure
# 
# This configuration creates the infrastructure for Terraform remote state.
# Initially uses local state, then migrates to S3 after first apply.
#
# Workflow:
# 1. terraform init         (uses local state)
# 2. terraform apply        (creates S3 bucket, DynamoDB table)
# 3. Update backend.tf to use S3
# 4. terraform init -migrate-state (migration to remote backend)

# S3 Bucket for Terraform State
resource "aws_s3_bucket" "terraform_state" {
  bucket_prefix = "domrov-terraform-state-"

  tags = {
    Name        = "domrov-terraform-state"
    Environment = "production"
    Purpose     = "Terraform Remote State"
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning for state file protection
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption at rest
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# DynamoDB Table for State Locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "domrov-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "domrov-terraform-locks"
    Environment = "production"
    Purpose     = "Terraform State Locking"
  }
}

# S3 Bucket Logging (optional but recommended for audit)
resource "aws_s3_bucket" "terraform_state_logs" {
  bucket_prefix = "domrov-terraform-state-logs-"

  tags = {
    Name        = "domrov-terraform-state-logs"
    Environment = "production"
  }
}

# Block public access to logs bucket
resource "aws_s3_bucket_public_access_block" "terraform_state_logs" {
  bucket = aws_s3_bucket.terraform_state_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning on logs bucket
resource "aws_s3_bucket_versioning" "terraform_state_logs" {
  bucket = aws_s3_bucket.terraform_state_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption on logs bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state_logs" {
  bucket = aws_s3_bucket.terraform_state_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Configure logging for state bucket
resource "aws_s3_bucket_logging" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  target_bucket = aws_s3_bucket.terraform_state_logs.id
  target_prefix = "state-access-logs/"

  depends_on = [aws_s3_bucket_public_access_block.terraform_state_logs]
}

# Lifecycle policy for logs (keep for 90 days)
resource "aws_s3_bucket_lifecycle_configuration" "terraform_state_logs" {
  bucket = aws_s3_bucket.terraform_state_logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    expiration {
      days = 90
    }
  }
}
