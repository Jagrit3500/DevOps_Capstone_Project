variable "aws_region" {
  description = "AWS region to deploy HireFlow infrastructure"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name prefix used in all resource names"
  type        = string
  default     = "hireflow"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "eks_cluster_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.35"
}

variable "node_group_instance_types" {
  description = "EC2 instance types for EKS worker nodes"
  type        = list(string)
  default     = ["c7i-flex.large"]
}

variable "node_group_min_size" {
  description = "Minimum number of EKS worker nodes"
  type        = number
  default     = 1
}

variable "node_group_max_size" {
  description = "Maximum number of EKS worker nodes"
  type        = number
  default     = 4
}

variable "node_group_desired_size" {
  description = "Desired number of EKS worker nodes"
  type        = number
  default     = 2
}

variable "github_repository" {
  description = "GitHub owner/repository allowed to deploy to EKS through OIDC"
  type        = string
  default     = "Jagrit3500/DevOps_Capstone_Project"
}

variable "github_deploy_branch" {
  description = "GitHub branch allowed to assume the EKS deploy role"
  type        = string
  default     = "main"
}
