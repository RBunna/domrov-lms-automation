variable "vpc_id" {
  type        = string
  description = "VPC ID where security groups will be created"
}

variable "admin_cidr_blocks" {
  type        = list(string)
  description = "CIDR blocks allowed for SSH access"
  default     = ["0.0.0.0/0"]
}
