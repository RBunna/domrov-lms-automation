variable "ami_id" {}
variable "instance_type" {}
variable "subnet_ids" { type = list(string) }
variable "sg_id" {}
variable "key_name" {}
variable "target_group" {}
variable "iam_instance_profile" {}

resource "aws_launch_template" "lt" {
  image_id      = var.ami_id
  instance_type = var.instance_type

  key_name = var.key_name

  vpc_security_group_ids = [var.sg_id]

  iam_instance_profile {
    name = var.iam_instance_profile
  }
}

resource "aws_autoscaling_group" "asg" {
  min_size         = 2
  max_size         = 4
  desired_capacity = 2

  vpc_zone_identifier = var.subnet_ids
  target_group_arns   = [var.target_group]

  launch_template {
    id      = aws_launch_template.lt.id
    version = "$Latest"
  }
}

resource "aws_autoscaling_policy" "cpu" {
  name                   = "cpu-target-tracking-policy"
  autoscaling_group_name = aws_autoscaling_group.asg.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70
  }
}

output "asg_name" {
  value = aws_autoscaling_group.asg.name
}
