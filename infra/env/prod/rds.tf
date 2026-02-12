
# setting up a free RDS instance 
# aws supports 20GB of free data for 1 year
resource "aws_db_instance" "postgres_free_tier" {
  allocated_storage = 20
  storage_type      = "gp2"
  engine            = "postgres"
  engine_version    = "14"
  instance_class    = "db.t3.micro"

  # Database configuration
  db_name  = "postgresdb"
  username = local.db_username
  password = local.db_password

  backup_retention_period = 7
  backup_window           = "03:00-04:00"

  maintenance_window = "sun:04:00-sun:05:00"

  # Security and networking
  publicly_accessible    = true
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name

  skip_final_snapshot        = true
  deletion_protection        = true
  auto_minor_version_upgrade = true

  storage_encrypted = true

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

}

resource "aws_security_group" "rds_sg" {
  name        = "rds-postgres-sg"
  description = "Security group for RDS PostgreSQL instance"
  vpc_id      = local.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "rds_sg_ingress_rule_1" {
  security_group_id = aws_security_group.rds_sg.id

  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 5432
  ip_protocol = "tcp"
  to_port     = 5432
}

resource "aws_vpc_security_group_ingress_rule" "rds_sg_ingress_rule_2" {
  security_group_id = aws_security_group.rds_sg.id

  cidr_ipv4   = local.vpc_cidr_block
  from_port   = 5432
  ip_protocol = "tcp"
  to_port     = 5432
}

resource "aws_vpc_security_group_egress_rule" "rds_sg_egress_rule_1" {
  security_group_id = aws_security_group.rds_sg.id

  cidr_ipv4   = "0.0.0.0/0"
  ip_protocol = "-1"
}

resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "rds-postgres-subnet-group"
  subnet_ids = local.subnet_ids
}