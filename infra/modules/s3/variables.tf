
# File: modules/s3-bucket/variables.tf
variable "bucket_name" {
  description = "The name of the S3 bucket. If omitted, Terraform will assign a random, unique name."
  type        = string
  default     = null
}

variable "bucket_prefix" {
  description = "Creates a unique bucket name beginning with the specified prefix."
  type        = string
  default     = null
}

variable "force_destroy" {
  description = "Boolean that indicates all objects should be deleted from the bucket when the bucket is destroyed."
  type        = bool
  default     = false
}

variable "object_lock_enabled" {
  description = "Indicates whether this bucket has an Object Lock configuration enabled."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Map of tags to assign to the bucket."
  type        = map(string)
  default     = {}
}

variable "versioning_enabled" {
  description = "Enable versioning for the S3 bucket."
  type        = bool
  default     = false
}

variable "enable_encryption" {
  description = "Enable server-side encryption for the S3 bucket."
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "The AWS KMS master key ID used for SSE-KMS encryption."
  type        = string
  default     = null
}

variable "enable_logging" {
  description = "Enable access logging for the S3 bucket."
  type        = bool
  default     = false
}

variable "logging_target_bucket" {
  description = "The name of the bucket where access logs will be stored."
  type        = string
  default     = null
}

variable "logging_target_prefix" {
  description = "A prefix for all log object keys."
  type        = string
  default     = "logs/"
}

variable "lifecycle_rules" {
  description = "List of lifecycle rules for the bucket."
  type = list(object({
    id                       = string
    enabled                  = bool
    prefix                   = optional(string)
    tags                     = optional(map(string))
    expiration_days          = optional(number)
    transition_days          = optional(number)
    transition_storage_class = optional(string)
  }))
  default = []
}
