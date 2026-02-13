locals {
  account_id = "720628977141"
  region     = "ap-south-1"
  us_region  = "us-east-1"
  env        = "prod"

  # Mumbai region resources
  vpc_id              = "vpc-09bd46856478bb95c"
  subnet_ids          = ["subnet-021bb6a7bfb0bc877", "subnet-0c2e6304c64419946"]
  virginia_vpc_id     = "vpc-09e9fa557b73dd241"
  virginia_subnet_ids = ["subnet-058d2906bc6bf6f7e"]
  # Regional naming
  mumbai_prefix    = "${local.env}-mumbai"
  virginia_prefix  = "${local.env}-virginia"
  prefix_name      = local.mumbai_prefix
  ecs_cluster_name = "${local.prefix_name}-ecs-cluster"
  ecs_service_names = {
    java_backend_name = {
      container_name = "${local.prefix_name}-java-backend"
      container_port = 8080
    }
    python_backend_name = {
      container_name = "${local.prefix_name}-python-backend"
      container_port = 8081
    }
  }
  vpc_cidr_block       = "172.31.0.0/16"
  db_username          = "dbadmin"
  db_password          = "CLuFDujjvVyUtQ3S9AGojHzmoDs="
  s3_bucket_arns       = ["arn:aws:s3:::${local.prefix_name}-data-bucket"]
  db_name              = "postgresdb"
  db_host              = "terraform-20250630184205875500000001.cruswooeaqns.ap-south-1.rds.amazonaws.com"
  db_port              = "5432"
  api_key              = "340c59d8-1c8c-4757-a1fc-b5ff4e5ff186"
  api_key_header       = "x-api-key"
  allowed_origins      = ["http://localhost:30000", "https://courts-and-law.vercel.app"]
  s3_access_key_id     = "AKIA4EN5RCRKGXJE6GFJ"
  s3_secret_access_key = "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"
}