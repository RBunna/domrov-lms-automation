resource "aws_launch_template" "lt" {
  name_prefix   = "${var.name}-lt-"
  image_id      = var.ami_id
  instance_type = var.instance_type

  key_name = var.key_name

  vpc_security_group_ids = [var.sg_id]

  iam_instance_profile {
    name = var.iam_instance_profile
  }

  # Enable detailed monitoring
  monitoring {
    enabled = true
  }

  # Use IMDSv2 for improved security
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "domrov-app-instance"
    }
  }
}

resource "aws_autoscaling_group" "asg" {
  name_prefix = "${var.name}-asg-"

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  vpc_zone_identifier = var.subnet_ids
  target_group_arns   = [var.target_group]

  health_check_type         = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.lt.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "domrov-app-asg"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# CPU-based scaling policy
resource "aws_autoscaling_policy" "cpu" {
  name                   = "domrov-cpu-scaling"
  autoscaling_group_name = aws_autoscaling_group.asg.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70
  }
}

# Memory scaling policy (requires CloudWatch agent)
resource "aws_autoscaling_policy" "memory" {
  name                   = "domrov-memory-scaling"
  autoscaling_group_name = aws_autoscaling_group.asg.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    customized_metric_specification {
      metric_dimension {
        name  = "AutoScalingGroupName"
        value = aws_autoscaling_group.asg.name
      }
      metric_name = "MemoryUtilization"
      namespace   = "CWAgent"
      statistic   = "Average"
      unit        = "Percent"
    }
    target_value = 80
  }
}

output "asg_name" {
  value       = aws_autoscaling_group.asg.name
  description = "Name of the Auto Scaling Group"
}

output "asg_arn" {
  value       = aws_autoscaling_group.asg.arn
  description = "ARN of the Auto Scaling Group"
}
