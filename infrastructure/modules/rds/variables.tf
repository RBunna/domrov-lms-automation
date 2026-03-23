variable "subnet_ids" {
  type        = list(string)
  description = "List of subnet IDs for RDS"
}

variable "sg_id" {
  type        = string
  description = "Security group ID for RDS instance"
}

variable "username" {
  type        = string
  description = "RDS administrator username"
  sensitive   = true
}

variable "password" {
  type        = string
  description = "RDS administrator password"
  sensitive   = true
}

variable "multi_az" {
  type        = bool
  description = "Enable Multi-AZ deployment"
  default     = true
}

variable "allocated_storage" {
  type        = number
  description = "Allocated storage in GB"
  default     = 100
}

variable "backup_retention_period" {
  type        = number
  description = "Number of days to retain backups"
  default     = 30
}
