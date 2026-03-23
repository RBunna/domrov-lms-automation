provider "aws" {
  region = var.region

  # Credentials are read from environment variables:
  # AWS_ACCESS_KEY_ID or AWS_PROFILE
  # AWS_SECRET_ACCESS_KEY
  # 
  # For production, use AWS STS assume role or SSO profiles
  # Example: export AWS_PROFILE=your-production-profile
}

provider "random" {
  # Used for S3 bucket naming randomization
}
