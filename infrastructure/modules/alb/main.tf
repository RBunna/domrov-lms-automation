resource "aws_lb" "alb" {
  name_prefix        = "drv"
  load_balancer_type = "application"
  subnets            = var.subnet_ids
  security_groups    = [var.sg_id]

  enable_deletion_protection = false

  tags = {
    Name = "domrov-alb"
  }
}

resource "aws_lb_target_group" "tg" {
  name_prefix = "drv"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 3
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = {
    Name = "domrov-target-group"
  }
}

resource "aws_lb_listener" "listener" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tg.arn
  }
}

output "target_group_arn" {
  value       = aws_lb_target_group.tg.arn
  description = "Target group ARN"
}

output "alb_dns" {
  value       = aws_lb.alb.dns_name
  description = "DNS name of the ALB"
}

output "alb_arn" {
  value       = aws_lb.alb.arn
  description = "ARN of the ALB"
}
