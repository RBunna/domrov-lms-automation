# Frontend Static Site Hosting with CloudFront
# This configuration creates S3 buckets for each frontend domain,
# with CloudFront distributions and Route53 DNS records

locals {
  frontends = var.domain_names
}

# Create S3 buckets for each frontend domain
resource "aws_s3_bucket" "frontend" {
  for_each      = toset(local.frontends)
  bucket_prefix = replace(each.value, ".", "-")
  tags = {
    Name = "frontend-${each.value}"
  }
}

# Block public access to frontend S3 buckets
resource "aws_s3_bucket_public_access_block" "frontend_pab" {
  for_each = aws_s3_bucket.frontend

  bucket = each.value.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning on frontend buckets
resource "aws_s3_bucket_versioning" "frontend_versioning" {
  for_each = aws_s3_bucket.frontend

  bucket = each.value.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption on frontend buckets
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend_encryption" {
  for_each = aws_s3_bucket.frontend

  bucket = each.value.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Create CloudFront Origin Access Identity for each domain
resource "aws_cloudfront_origin_access_identity" "oai" {
  for_each = toset(local.frontends)
  comment  = "OAI for ${each.value}"
}

# Create bucket policies to allow CloudFront access via OAI
resource "aws_s3_bucket_policy" "frontend_policy" {
  for_each = aws_s3_bucket.frontend

  bucket = each.value.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAI"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai[each.key].iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${each.value.arn}/*"
      }
    ]
  })
}

# CloudFront distributions for each frontend
resource "aws_cloudfront_distribution" "frontend" {
  for_each = toset(local.frontends)

  origin {
    domain_name = aws_s3_bucket.frontend[each.key].bucket_regional_domain_name
    origin_id   = "s3-${each.key}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai[each.key].cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-${each.key}"
    compress         = true

    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Use CloudFront default certificate or ACM certificate if specified
  viewer_certificate {
    cloudfront_default_certificate = var.acm_certificate_arn == "" ? true : false
    acm_certificate_arn            = var.acm_certificate_arn != "" ? var.acm_certificate_arn : null
    ssl_support_method             = var.acm_certificate_arn != "" ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = {
    Name = "frontend-${each.key}"
  }
}

# Route53 DNS records pointing to CloudFront
resource "aws_route53_record" "frontend" {
  for_each = toset(local.frontends)

  zone_id = var.hosted_zone_id
  name    = each.key
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend[each.key].domain_name
    zone_id                = aws_cloudfront_distribution.frontend[each.key].hosted_zone_id
    evaluate_target_health = false
  }
}
