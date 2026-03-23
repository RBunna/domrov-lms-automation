resource "aws_db_subnet_group" "db" {
  name_prefix = "domrov-db-"
  description = "Subnet group for RDS"
  subnet_ids  = var.subnet_ids

  tags = {
    Name = "domrov-db-subnet-group"
  }
}

resource "aws_db_instance" "db" {
  identifier     = "domrov-postgres"
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = "db.t3.small"

  allocated_storage = var.allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true
  iops              = 3000

  db_name  = "domrovdb"
  username = var.username
  password = var.password
  port     = 5432

  db_subnet_group_name   = aws_db_subnet_group.db.name
  vpc_security_group_ids = [var.sg_id]

  # High Availability
  multi_az = var.multi_az

  # Backup strategy
  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"
  copy_tags_to_snapshot   = true

  # Enhanced monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn

  # Automatic minor version upgrade
  auto_minor_version_upgrade = true

  # Snapshot and final snapshot
  skip_final_snapshot       = false
  final_snapshot_identifier = "domrov-postgres-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  tags = {
    Name = "domrov-postgres"
  }

  depends_on = [aws_iam_role_policy.rds_monitoring]
}

# IAM role for enhanced RDS monitoring
resource "aws_iam_role" "rds_monitoring" {
  name_prefix = "domrov-rds-monitoring-"
  description = "Role for RDS enhanced monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

output "db_instance_identifier" {
  value       = aws_db_instance.db.identifier
  description = "The name of the RDS instance"
}

output "db_instance_endpoint" {
  value       = aws_db_instance.db.endpoint
  description = "Connection endpoint of the RDS instance"
  sensitive   = true
}

output "db_instance_arn" {
  value       = aws_db_instance.db.arn
  description = "ARN of the RDS instance"
}
