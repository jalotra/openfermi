# data "aws_availability_zones" "available" {}

# module "ecs_cluster" {
#   source                                = "../../modules/ecs_cluster"
#   cluster_name                          = local.ecs_cluster_name
#   default_capacity_provider_use_fargate = false
#   autoscaling_capacity_providers = {
#     odi = {
#       auto_scaling_group_arn         = module.autoscaling["odi"].autoscaling_group_arn
#       managed_termination_protection = "ENABLED"

#       managed_scaling = {
#         maximum_scaling_step_size = 2
#         minimum_scaling_step_size = 1
#         status                    = "ENABLED"
#         target_capacity           = 60
#       }

#       default_capacity_provider_strategy = {
#         weight = 100
#         base   = 0
#       }
#     }
#     # For now spot instances are disabled
#     # Spot instances
#     # spot_instances = {
#     #   auto_scaling_group_arn         = module.autoscaling["spot_instances"].autoscaling_group_arn
#     #   managed_termination_protection = "ENABLED"

#     #   managed_scaling = {
#     #     maximum_scaling_step_size = 2
#     #     minimum_scaling_step_size = 1
#     #     status                    = "ENABLED"
#     #     target_capacity           = 5
#     #   }

#     #   default_capacity_provider_strategy = {
#     #     weight = 100
#     #   }
#     # }
#   }
# }


# module "ecs_service" {
#   source      = "../../modules/ecs_service"
#   name        = "java-backend-ecs-service"
#   cluster_arn = module.ecs_cluster.arn
#   cpu         = "512"
#   memory      = "512"

#   # Task Definition
#   requires_compatibilities = ["EC2"]
#   capacity_provider_strategy = {
#     # On-demand instances
#     odi = {
#       capacity_provider = module.ecs_cluster.autoscaling_capacity_providers["odi"].name
#       weight            = 1
#       base              = 1
#     }
#   }

#   volume = {
#     my-vol = {}
#   }

#   # Container definition(s)
#   container_definitions = {
#     java-backend = {
#       image = "834158007380.dkr.ecr.ap-south-1.amazonaws.com/prod-mumbai-prod_ecr:java-backend-latest"
#       port_mappings = [
#         {
#           name          = "java-backend"
#           containerPort = 80
#           protocol      = "tcp"
#         }
#       ]
#       environment = [
#         {
#           name  = "DB_NAME"
#           value = "${local.db_name}"
#         },
#         {
#           name  = "DB_HOST"
#           value = "${local.db_host}"
#         },
#         {
#           name  = "DB_PORT"
#           value = "${local.db_port}"
#         },
#         {
#           name  = "POSTGRES_USERNAME"
#           value = "${local.db_username}"
#         },
#         {
#           name  = "POSTGRES_PASSWORD"
#           value = "${local.db_password}"
#         },
#         {
#           name  = "API_KEY"
#           value = "${local.api_key}"
#         },
#         {
#           name  = "API_KEY_HEADER"
#           value = "${local.api_key_header}"
#         },
#         {
#           name  = "ALLOWED_ORIGINS"
#           value = "${join(",", local.allowed_origins)}"
#         },
#         {
#           name  = "S3_ACCESS_KEY_ID",
#           value = "${local.s3_access_key_id}"
#         },
#         {
#           name  = "S3_SECRET_ACCESS_KEY",
#           value = "${local.s3_secret_access_key}"
#         }
#       ]
#       cpu                      = "512"
#       memory                   = "512"
#       readonly_root_filesystem = false

#       cloudwatch_log_group_name              = "/aws/ecs/java-backend"
#       cloudwatch_log_group_retention_in_days = 7

#       log_configuration = {
#         logDriver = "awslogs"
#       }
#     }
#   }

#   load_balancer = {
#     service = {
#       target_group_arn = module.alb.target_groups["java-backend"].arn
#       container_name   = "java-backend"
#       container_port   = 80
#     }
#   }

#   subnet_ids = local.subnet_ids
#   security_group_rules = {
#     java-backend = {
#       type                     = "ingress"
#       from_port                = 80
#       to_port                  = 80
#       protocol                 = "tcp"
#       description              = "Service port"
#       source_security_group_id = module.alb.security_group_id
#     }
#     rds-database = {
#       type                     = "ingress"
#       from_port                = 5432
#       to_port                  = 5432
#       protocol                 = "tcp"
#       description              = "RDS database port"
#       source_security_group_id = module.alb.security_group_id
#     }
#   }

# }

# ################################################################################
# # Supporting Resources
# ################################################################################

# # https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-optimized_AMI.html#ecs-optimized-ami-linux
# data "aws_ssm_parameter" "ecs_optimized_ami" {
#   name = "/aws/service/ecs/optimized-ami/amazon-linux-2/recommended"
# }

# module "alb" {
#   source  = "terraform-aws-modules/alb/aws"
#   version = "~> 9.0"

#   name = "${local.prefix_name}-alb"

#   load_balancer_type = "application"

#   vpc_id  = local.vpc_id
#   subnets = local.subnet_ids

#   # For example only
#   enable_deletion_protection = false

#   # Security Group
#   security_group_ingress_rules = {
#     all_http = {
#       from_port   = 80
#       to_port     = 80
#       ip_protocol = "tcp"
#       cidr_ipv4   = "0.0.0.0/0"
#     }
#   }
#   security_group_egress_rules = {
#     all = {
#       ip_protocol = "-1"
#       cidr_ipv4   = local.vpc_cidr_block
#     }
#   }

#   listeners = {
#     ex_http = {
#       port     = 80
#       protocol = "HTTP"
#       forward  = true

#       forward = {
#         target_group_key = "java-backend"
#       }
#     }
#   }

#   target_groups = {
#     java-backend = {
#       backend_protocol                  = "HTTP"
#       backend_port                      = 80
#       target_type                       = "ip"
#       deregistration_delay              = 5
#       load_balancing_cross_zone_enabled = true

#       health_check = {
#         enabled             = true
#         healthy_threshold   = 5
#         interval            = 30
#         matcher             = "200"
#         path                = "/health"
#         port                = "traffic-port"
#         protocol            = "HTTP"
#         timeout             = 5
#         unhealthy_threshold = 2
#       }

#       # Theres nothing to attach here in this definition. Instead,
#       # ECS will attach the IPs of the tasks to this target group
#       create_attachment = false
#     }
#   }
# }

# module "autoscaling" {
#   source                 = "terraform-aws-modules/autoscaling/aws"
#   version                = "9.0.1"
#   create_launch_template = true
#   initial_lifecycle_hooks = null

#   for_each = {
#     # On-demand instances
#     odi = {
#       instance_type              = "t3.micro"
#       use_mixed_instances_policy = false
#       mixed_instances_policy = {
#         launch_template = {
#           launch_template_version = "$Latest"
#           launch_template_name    = "hello-world"
#         }
#       }

#       user_data = <<-EOT
#         #!/bin/bash

#         cat <<'EOF' >> /etc/ecs/ecs.config
#         ECS_CLUSTER=${local.ecs_cluster_name}
#         ECS_LOGLEVEL=debug
#         ECS_ENABLE_TASK_IAM_ROLE=true
#         EOF
#       EOT
#     }
#     # For now spot instances are disabled
#     # Spot instances
#     # spot_instances = {
#     #   instance_type              = "t2.micro"
#     #   use_mixed_instances_policy = true
#     #   mixed_instances_policy = {
#     #     launch_template = {
#     #       launch_template_version = "$Latest"
#     #       launch_template_name    = "hello-world"
#     #     }

#     #     instances_distribution = {
#     #       on_demand_base_capacity                  = 0
#     #       on_demand_percentage_above_base_capacity = 0
#     #       spot_allocation_strategy                 = "price-capacity-optimized"
#     #     }

#     #     override = [
#     #       {
#     #         instance_type     = "t3.micro"
#     #         weighted_capacity = "1"
#     #       }
#     #     ]
#     #   }
#     #   user_data = <<-EOT
#     #     #!/bin/bash

#     #     cat <<'EOF' >> /etc/ecs/ecs.config
#     #     ECS_CLUSTER=${local.ecs_cluster_name}
#     #     ECS_LOGLEVEL=debug
#     #     ECS_ENABLE_TASK_IAM_ROLE=true
#     #     ECS_ENABLE_SPOT_INSTANCE_DRAINING=true
#     #     EOF
#     #   EOT
#     # }
#   }

#   name = "${local.prefix_name}-${each.key}"

#   image_id      = jsondecode(data.aws_ssm_parameter.ecs_optimized_ami.value)["image_id"]
#   instance_type = each.value.instance_type

#   security_groups                 = [module.autoscaling_sg.security_group_id]
#   user_data                       = base64encode(each.value.user_data)
#   ignore_desired_capacity_changes = true

#   create_iam_instance_profile = true
#   iam_role_name               = "${local.prefix_name}-${each.key}-role"
#   iam_role_description        = "ECS role"
#   iam_role_policies = {
#     AmazonEC2ContainerServiceforEC2Role = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
#     AmazonSSMManagedInstanceCore        = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
#   }

#   vpc_zone_identifier = local.subnet_ids
#   health_check_type   = "EC2"
#   min_size            = 1
#   max_size            = 1
#   desired_capacity    = 1

#   # https://github.com/hashicorp/terraform-provider-aws/issues/12582
#   autoscaling_group_tags = {
#     AmazonECSManaged = true
#   }

#   # Required for  managed_termination_protection = "ENABLED"
#   protect_from_scale_in = true

#   # Spot instances
#   use_mixed_instances_policy = each.value.use_mixed_instances_policy
#   mixed_instances_policy     = each.value.mixed_instances_policy

# }

# module "autoscaling_sg" {
#   source  = "terraform-aws-modules/security-group/aws"
#   version = "~> 5.0"

#   name        = "${local.prefix_name}-autoscaling-sg"
#   description = "Autoscaling group security group"
#   vpc_id      = local.vpc_id

#   computed_ingress_with_source_security_group_id = [
#     {
#       rule                     = "http-80-tcp"
#       source_security_group_id = module.alb.security_group_id
#     }
#   ]
#   number_of_computed_ingress_with_source_security_group_id = 1

#   egress_rules = ["all-all"]

# }