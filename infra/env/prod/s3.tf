module "s3_app_bucket" {
  source = "../../modules/s3"
  bucket_name        = "${local.prefix_name}-data-bucket"
  force_destroy      = false
  versioning_enabled = false
  enable_encryption  = false

  # Enable logging
  enable_logging = false

  # Lifecycle rules example
  lifecycle_rules = [
    {
      id                       = "transition-to-glacier"
      enabled                  = true
      prefix                   = "archives/"
      transition_days          = 30
      transition_storage_class = "GLACIER"
    }
  ]
}

