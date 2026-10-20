# HireFlow project handoff

Current audit: 21 October 2026, Asia/Kolkata. Repository: `Jagrit3500/DevOps_Capstone_Project`, branch `main`.

Read [AUDIT.md](AUDIT.md), [EVIDENCE.md](EVIDENCE.md), and [demo/VIDEO_SCRIPT.md](demo/VIDEO_SCRIPT.md) first. These replace the obsolete direct-Helm-CI and frontend-LoadBalancer deployment instructions.

## Current architecture and verification

GitHub Actions runs backend tests, frontend build/tests, Docker builds, strict Trivy gates, GHCR SHA publication, and image-tag promotion in Git. Argo CD reconciles `helm/hireflow/values-prod.yaml`. Ingress-nginx exposes the app; backend and frontend Services are ClusterIP. EKS `hireflow-eks` runs in `ap-south-1`. Terraform has two public and two private subnets and two private workers. PostgreSQL, Prometheus, and Grafana use Bound EBS PVCs.

Fresh audit checks passed 22 backend tests, 2 frontend pagination tests, a frontend build, live public CRUD with cleanup, backend readiness/metrics, Prometheus `up=1`, Grafana health, and Terraform validation plus a full-refresh no-drift plan. Gitleaks scanned 17 committed revisions without findings before the final audit commit. Evidence timestamps distinguish prior screenshots from current command output.

## Local tooling and credentials

Use global `python -m pytest` from `backend/`; the existing `backend/.venv` only has pip. CI uses Python 3.12. Node/npm are in `C:/Program Files/nodejs`. Docker Desktop may need `docker desktop start`.

Set `AWS_PROFILE=hireflow-admin` for kubectl/Helm and `hireflow-terraform` for Terraform. AWS CLI is in `C:/Users/jagri/AppData/Local/Programs/Amazon/AWSCLIV2`; Terraform is in the WinGet Hashicorp.Terraform package, and Helm is in `$env:TEMP/helm-v3.22.1/windows-amd64/helm.exe`. Local short-lived credentials may expire; use AWS login only when needed. Never print credentials or Secret values. The current shell sandbox requires elevation for kubeconfig, network, and Git metadata writes.

Terraform state is local in `terraform/` and represents real resources. Preserve it. Do not recreate resources or alter infrastructure merely to obtain a nonempty plan. Terraform variables use immutable GitHub owner/repository IDs in OIDC trust; these identifiers are intentionally public configuration. Preserve `hireflow-db`. PostgreSQL needs `PGDATA` below the EBS mount root because of `lost+found`. Server-side apply was removed from the Argo Application to correct false StatefulSet drift.

## Remaining submission work

The real MP4 presentation, AWS Console VPC/EKS screenshots, original nonempty creation-plan screenshot if recoverable, and course form submission remain. No computer/browser session was exposed to this agent for the recording or AWS Console. The PDF deck and recording script are ready. The video must show a new push and CI run, not only an earlier green run.

Keep the infrastructure live for the presentation. After evaluation, obtain the user's explicit teardown decision, uninstall Kubernetes resources that create AWS load balancers/volumes, then destroy the preserved Terraform stack and verify cloud cleanup. The live stack incurs charges; no destruction has been authorized or performed.

Final successful pipeline: [39476145373](https://github.com/Jagrit3500/DevOps_Capstone_Project/actions/runs/39476145373); deployed app source `d04a9e74108f841999164a6a6d9b1b3b52c413da`, captured Argo revision `71f195c26e3053571192e7624436f914698ba063`. Compose now waits for backend readiness. AWS login refreshed successfully; the final live checks passed. Remaining screenshot requirements include terminal Pods/Services/Helm/metrics captures in addition to the Console pages.
