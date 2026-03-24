terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }

    # CHANGE NOTES: Added Cloudflare provider for DNS management
    # Replaces AWS Route53 DNS records with Cloudflare
    # Install: terraform init (will download provider automatically)
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}
