# this enables the user to do CRUD on the s3 bucket (prod-data-bucket)

locals {
  user_name   = "${local.prefix_name}-user"
  policy_name = "${local.prefix_name}-s3-crud-policy"
  role_name   = "${local.prefix_name}-s3-crud-role"
  policies = [
    "s3:ListBucket",
    "s3:GetBucketLocation",
    "s3:GetBucketVersioning",
    "s3:GetObject",
    "s3:GetObjectVersion",
    "s3:PutObject",
    "s3:DeleteObject",
    "s3:DeleteObjectVersion"
  ]
}

resource "aws_iam_user" "this" {
  name          = local.user_name
  force_destroy = false
}

resource "aws_iam_access_key" "this" {
  user = aws_iam_user.this.name
}

# Create IAM Policy for S3 CRUD operations
resource "aws_iam_user_policy" "s3_crud" {
  name = local.policy_name
  user = aws_iam_user.this.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Sid      = "ListAllBuckets"
          Effect   = "Allow"
          Action   = ["s3:ListAllMyBuckets"]
          Resource = "arn:aws:s3:::*"
        }
      ],
      [
        {
          Sid      = "S3ObjectOperations"
          Effect   = "Allow"
          Action   = ["s3:*"]
          Resource = flatten([for arn in local.s3_bucket_arns : [arn, "${arn}/*"]])
        }
      ]
    )
  })
}

# resource "aws_iam_user_policy" "bitbucket_user" {
#   name = "bitbucket-user-policy"
#   user = aws_iam_user.bitbucket_user.name
#   policy = jsonencode({
#     "Version" : "2012-10-17",
#     "Statement" : [
#       {
#         "Effect" : "Allow",
#         "Action" : [
#           "ecr:GetAuthorizationToken",
#           "ecr:BatchCheckLayerAvailability",
#           "ecr:GetDownloadUrlForLayer",
#           "ecr:BatchGetImage",
#           "ecr:PutImage",
#           "ecr:InitiateLayerUpload",
#           "ecr:UploadLayerPart",
#           "ecr:CompleteLayerUpload"
#         ],
#         "Resource" : "${aws_ecr_repository.prod_ecr.arn}"
#       },
#       {
#         "Effect" : "Allow",
#         "Action" : [
#           "ecs:UpdateService",
#           "ecs:DescribeServices"
#         ],
#         "Resource" : "*"
#       }
#     ]
#   })
# }