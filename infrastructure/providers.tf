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

# Cloudflare Provider Configuration
# CHANGE NOTES: Added for DNS management instead of AWS Route53
# The API token is read from the TF_VAR_cloudflare_api_token environment variable
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
