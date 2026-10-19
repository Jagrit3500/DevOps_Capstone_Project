# GitHub Actions assumes this role only for pushes to the configured repository's
# main branch. The role can discover this EKS cluster; Kubernetes RBAC determines
# what it can change after authentication through aws-auth.
locals {
  github_owner        = split("/", var.github_repository)[0]
  github_repo         = split("/", var.github_repository)[1]
  github_oidc_subject = "repo:${local.github_owner}@${var.github_owner_id}/${local.github_repo}@${var.github_repository_id}:ref:refs/heads/${var.github_deploy_branch}"
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]

  tags = { Project = var.project_name }
}

data "aws_iam_policy_document" "github_actions_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [local.github_oidc_subject]
    }
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = "${var.project_name}-github-deploy-role"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json

  tags = { Project = var.project_name }
}

resource "aws_iam_role_policy" "github_actions_describe_cluster" {
  name = "${var.project_name}-describe-eks"
  role = aws_iam_role.github_actions_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["eks:DescribeCluster"]
      Resource = aws_eks_cluster.main.arn
    }]
  })
}
