variable "subnet_ids" { type = list(string) }
variable "sg_id" {}
variable "username" {}
variable "password" {}

resource "aws_db_subnet_group" "db" {
  subnet_ids = var.subnet_ids
}

resource "aws_db_instance" "db" {
  engine         = "postgres"
  instance_class = "db.t3.micro"

  allocated_storage = 20

  username = var.username
  password = var.password

  db_subnet_group_name   = aws_db_subnet_group.db.name
  vpc_security_group_ids = [var.sg_id]

  skip_final_snapshot = true
}