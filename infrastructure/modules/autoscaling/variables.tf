variable "ami_id" {
  type = string
}

variable "instance_type" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "sg_id" {
  type = string
}

variable "key_name" {
  type = string
}

variable "target_group" {
  type = string
}

variable "iam_instance_profile" {
  type = string
}

variable "name" {
  description = "Name of the Auto Scaling Group"
  type        = string
}