# Data source for Ubuntu 22.04 LTS AMI
data "aws_ami" "ubuntu" {
  provider    = aws.virginia
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Key pair for SSH access
resource "aws_key_pair" "ec2_key_pair" {
  provider   = aws.virginia
  key_name   = "${local.virginia_prefix}-ec2-key"
  public_key = file("${path.module}/ec2_public_key.txt") # Update this path to your public key
}

# Security group for EC2 instance
resource "aws_security_group" "ec2_sg" {
  provider    = aws.virginia
  name        = "${local.virginia_prefix}-ec2-sg"
  description = "Security group for EC2 instance"
  vpc_id      = local.virginia_vpc_id

  tags = {
    Name = "${local.virginia_prefix}-ec2-sg"
  }
}

# Security group rules for EC2 instance
resource "aws_vpc_security_group_ingress_rule" "ec2_ssh" {
  provider          = aws.virginia
  security_group_id = aws_security_group.ec2_sg.id
  description       = "SSH access"
  from_port         = 22
  to_port           = 22
  ip_protocol       = "tcp"
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "ec2_http" {
  provider          = aws.virginia
  security_group_id = aws_security_group.ec2_sg.id
  description       = "HTTP access"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "ec2_https" {
  provider          = aws.virginia
  security_group_id = aws_security_group.ec2_sg.id
  description       = "HTTPS access"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_egress_rule" "ec2_all_outbound" {
  provider          = aws.virginia
  security_group_id = aws_security_group.ec2_sg.id
  description       = "All outbound traffic"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

# EC2 Instance
resource "aws_instance" "main" {
  provider                    = aws.virginia
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = "t3.micro"
  key_name                    = aws_key_pair.ec2_key_pair.key_name
  vpc_security_group_ids      = [aws_security_group.ec2_sg.id]
  subnet_id                   = local.virginia_subnet_ids[0]
  associate_public_ip_address = true

  # Root block device configuration
  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    delete_on_termination = true

    tags = {
      Name = "${local.virginia_prefix}-ec2-root-volume"
    }
  }

  # User data script for initial setup
  user_data_base64 = base64encode(<<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y docker.io
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ubuntu
    
    # Install AWS CLI
    apt-get install -y awscli
    
    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Create application directory
    mkdir -p /opt/app
    chown ubuntu:ubuntu /opt/app
  EOF
  )

  # Metadata options for security
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  # CPU options for cost optimization
  cpu_options {
    core_count       = 1
    threads_per_core = 2
  }

  # Credit specification for burstable performance
  credit_specification {
    cpu_credits = "standard"
  }

  # Instance monitoring
  monitoring = false

  # Disable source/destination check if needed for NAT/VPN
  source_dest_check = true

  # Instance termination protection
  disable_api_termination = false
  disable_api_stop        = false

  tags = {
    Name        = "${local.virginia_prefix}-ec2-instance"
    Environment = local.env
    Purpose     = "Application Server"
  }
}

# Outputs
output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.main.id
}

output "ec2_instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.main.public_ip
}

output "ec2_instance_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.main.private_ip
}

output "ec2_instance_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.main.public_dns
}

output "ec2_instance_private_dns" {
  description = "Private DNS name of the EC2 instance"
  value       = aws_instance.main.private_dns
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2_sg.id
}

output "ec2_key_pair_name" {
  description = "Name of the EC2 key pair"
  value       = aws_key_pair.ec2_key_pair.key_name
}