terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }

    awscc = {
      source = "hashicorp/awscc"
    }
  }

  cloud {
    organization = "pavitra-startup"
    workspaces {
      name = "law"
    }
  }
}

# Default provider for Mumbai region (ap-south-1)
provider "aws" {
  region = local.region
  assume_role {
    role_arn = "arn:aws:iam::${local.account_id}:role/terraform-role"
  }
  default_tags {
    tags = {
      scope       = "environment"
      managed-by  = "terraform"
      environment = local.env
      team        = "pavitra"
      region      = "mumbai"
    }
  }
}

# Provider for Virginia region (us-east-1)
provider "aws" {
  alias  = "virginia"
  region = local.us_region
  assume_role {
    role_arn = "arn:aws:iam::${local.account_id}:role/terraform-role"
  }
  default_tags {
    tags = {
      scope       = "environment"
      managed-by  = "terraform"
      environment = local.env
      team        = "pavitra"
      region      = "virginia"
    }
  }
}
