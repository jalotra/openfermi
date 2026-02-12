# resource "aws_ecr_repository" "prod_ecr" {
#   name                 = "${local.prefix_name}-prod_ecr"
#   image_tag_mutability = "MUTABLE"
# }

# data "aws_iam_policy_document" "prod_ecr_policy_document" {
#   statement {
#     sid    = "AWS ECR policy"
#     effect = "Allow"

#     principals {
#       type        = "AWS"
#       identifiers = [local.account_id]
#     }

#     actions = [
#       "ecr:GetDownloadUrlForLayer",
#       "ecr:BatchGetImage",
#       "ecr:BatchCheckLayerAvailability",
#       "ecr:PutImage",
#       "ecr:InitiateLayerUpload",
#       "ecr:UploadLayerPart",
#       "ecr:CompleteLayerUpload",
#       "ecr:DescribeRepositories",
#       "ecr:GetRepositoryPolicy",
#       "ecr:ListImages",
#       "ecr:DeleteRepository",
#       "ecr:BatchDeleteImage",
#       "ecr:SetRepositoryPolicy",
#       "ecr:DeleteRepositoryPolicy",
#     ]
#   }
# }

# resource "aws_ecr_repository_policy" "prod_ecr_policy" {
#   repository = aws_ecr_repository.prod_ecr.name
#   policy     = data.aws_iam_policy_document.prod_ecr_policy_document.json
# }

# # remove last 14 days images from ECR which are tagged or untagged
# resource "aws_ecr_lifecycle_policy" "prod_ecr_lifecycle_policy" {
#   repository = aws_ecr_repository.prod_ecr.name

#   policy = <<EOF
# {
#     "rules": [
#         {
#             "rulePriority": 1,
#             "description": "Keep last 10 images",
#             "selection": {
#                 "tagStatus": "tagged",
#                 "tagPrefixList": ["v"],
#                 "countType": "imageCountMoreThan",
#                 "countNumber": 10
#             },
#             "action": {
#                 "type": "expire"
#             }
#         }
#     ]
# }
# EOF
# }
