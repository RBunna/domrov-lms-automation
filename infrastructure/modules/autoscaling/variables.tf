variable "name" {
  type        = string
  description = "Name prefix for ASG and launch template resources"
}

variable "ami_id" {
  type        = string
  description = "AMI ID for EC2 instances"
}

variable "instance_type" {
  type        = string
  description = "EC2 instance type"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Subnet IDs for ASG instances"
}

variable "sg_id" {
  type        = string
  description = "Security group ID for instances"
}

variable "key_name" {
  type        = string
  description = "EC2 key pair name"
}

variable "target_group" {
  type        = string
  description = "Target group ARN for ALB attachment"
}

variable "iam_instance_profile" {
  type        = string
  description = "IAM instance profile name"
}

variable "min_size" {
  type        = number
  description = "Minimum number of instances"
  default     = 2
}

variable "max_size" {
  type        = number
  description = "Maximum number of instances"
  default     = 4
}

variable "desired_capacity" {
  type        = number
  description = "Desired number of instances"
  default     = 2
}
