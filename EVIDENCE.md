# HireFlow submission evidence

Evidence collected against the instructor's [grading rubric](https://github.com/Nency-Ravaliya/devsecops-python/blob/main/GRADING.md). The root [README](README.md) describes the architecture, setup, module checklist, and limitations. Dates below identify when each verification was performed.

## Application, tests, and containers

- [Local desktop](evidence/local-app.png), [mobile](evidence/mobile-app.png), and [current public Ingress](evidence/live-ingress-app.png).
- [Earlier 19-case pytest screenshot](evidence/pytest-passing.png).
- [Docker Compose build/start](evidence/compose-build-start.png) and [three running services plus database](evidence/docker-services-database.png).
- Live public Ingress CRUD smoke test passed create, read, update, statistics, and delete. The synthetic record was removed; `/api/candidates/` returned `[]` afterward.

## Git, CI/CD, and security

- [Commit history](evidence/commit-history.png).
- [Earlier GitOps workflow screenshot](evidence/ci-gitops-success.png) and [run 39476145373](https://github.com/Jagrit3500/DevOps_Capstone_Project/actions/runs/39476145373). Its tests, frontend build, image builds, both Trivy scans, GHCR publication, and image promotion jobs passed.
- [GHCR backend](evidence/ghcr-backend.png) and [GHCR frontend](evidence/ghcr-frontend.png) package screenshots.
- [Backend Trivy result](evidence/trivy-backend-summary.png) and [frontend Trivy result](evidence/trivy-frontend-summary.png). Trivy checked operating system and installed application packages in both runtime images for HIGH and CRITICAL vulnerabilities; the strict gate passed. Vulnerability results can change when its database or the images change.

## AWS, Kubernetes, GitOps, and monitoring

- [Live Kubernetes and Argo CD status](evidence/live-gitops-status.txt): Argo CD `Synced` and `Healthy`, two ready backend replicas, two ready frontend replicas, PostgreSQL ready, ClusterIP Services, Ingress, HPA metrics, and two Ready nodes.
- [Public application through Ingress](evidence/live-ingress-app.png). HTTP checks returned 200 from `/`, healthy JSON from `/health`, and `[]` from `/api/candidates/`.
- [Terraform no-drift plan](evidence/terraform-current-plan.txt). The infrastructure was already provisioned when this plan was captured. Do not present it as the original nonempty creation plan.
- [Backend Prometheus metrics](evidence/backend-metrics.txt), [Prometheus target UP](evidence/prometheus-targets.png), and [Grafana live dashboard](evidence/grafana-dashboard.png). A fresh Prometheus query on 20 October returned `up=1` for `hireflow-backend`.

## Presentation

- [Ten-page PDF slide deck](demo/HireFlow_Presentation.pdf) covers overview, stack, architecture, CI/CD, infrastructure, Kubernetes, observability, and lessons.
- The real MP4 walkthrough remains outstanding. The [submission instructions](https://github.com/Nency-Ravaliya/devsecops-python/blob/main/SUBMISSION.md) require slides followed by a live demonstration, including a new push and complete CI/CD run. Upload the finished video under `demo/` or as a GitHub release asset, and add its link here.

## Evidence still to capture

1. Genuine walkthrough MP4 covering the sequence in the submission instructions.
2. Successful `terraform destroy` screenshot **after** the evaluation; the live stack is being preserved for the walkthrough and currently incurs AWS charges.

Keep credentials, database passwords, and Grafana admin passwords out of screenshots and video.


## Final audit checks (20 October 2026)

- [Current automated validation](evidence/audit-validation.txt) contains the 22-case backend result and two frontend API test results. The earlier pytest screenshot shows the 19-case suite before the audit fixes.
- [Current Terraform plan](evidence/terraform-current-plan.txt) is a full-refresh, no-drift plan, not the original creation plan.
- [Current live verification](evidence/final-live-verification.txt) records public API smoke checks, resource readiness, Argo CD, Prometheus, Grafana, and Helm releases.
- [Secret scan summary](evidence/secret-scan-summary.txt) records the redacted Gitleaks result. Scanner findings containing possible secrets are excluded from Git.

- [Final CI job/step result](evidence/final-ci-result.txt): [run 39476145373](https://github.com/Jagrit3500/DevOps_Capstone_Project/actions/runs/39476145373) succeeded on 21 October. Earlier screenshots are retained as historical evidence.

The requested Pods, Services, Helm, metrics, and AWS Console screenshots were supplied by the user and saved on 21 October; links follow.

- [Final local Compose verification](evidence/final-compose-verification.txt): immediate CRUD checks passed after readiness gating; backend UID 1001, frontend UID 101.

## User-captured evidence - 21 October 2026

- [AWS VPC](evidence/aws-vpc.png).
- [AWS public/private subnets](evidence/aws-subnets.png).
- [AWS EKS cluster](evidence/aws-eks.png).
- [AWS worker node group](evidence/aws-eks-nodegroup.png).
- [Running Pods](evidence/kubernetes-pods.png).
- [ClusterIP Services](evidence/kubernetes-services.png).
- [Helm release](evidence/helm-release.png).
- [Argo CD Synced/Healthy](evidence/argocd-status.png).
- [Ingress](evidence/kubernetes-ingress.png).
- [Prometheus metrics output](evidence/backend-metrics.png).
- [Terraform refresh](evidence/terraform-plan-refresh.png).
- [Terraform no-drift result](evidence/terraform-plan-result.png).

The current Terraform screenshot shows a genuine no-drift plan. It does not represent the original nonempty creation plan. The Argo CD screenshot shows Synced/Healthy at documentation revision `6c10818`; the deployed application source remains `d04a9e7`.

## Original creation-plan recovery

The original user-provided plan text was recovered from the provisioning conversation: **26 to add, 0 to change, 0 to destroy**. [Archived output](evidence/terraform-original-creation-plan.txt) and [recovery provenance](evidence/terraform-plan-recovery.md) are preserved. An original screenshot was not found; any screenshot of the recovered file must be labelled as an archived-output display.

- [Labelled screenshot of recovered original plan output](evidence/terraform-original-plan-archived.png), captured by the user on 21 October. It displays the archived 17 October plan summary: 26 to add, 0 to change, 0 to destroy. This is a new screenshot of recovered historical text; the original screenshot was not found. The transcript and provenance are linked above.
