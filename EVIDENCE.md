# HireFlow submission evidence

Verified against the instructor's [grading rubric](https://github.com/Nency-Ravaliya/devsecops-python/blob/main/GRADING.md) on 20 October 2026. See [AUDIT.md](AUDIT.md) for the requirement matrix and limitations.

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
- [Troubleshooting exercise](evidence/troubleshooting-demo.txt): deliberate bad image and Service selector, with temporary resources removed.

## Presentation

- [Ten-page PDF slide deck](demo/HireFlow_Presentation.pdf) covers overview, stack, architecture, CI/CD, infrastructure, Kubernetes, observability, and lessons.
- [Recording guide](demo/VIDEO_SCRIPT.md) gives the required sequence, commands, and screens. A real MP4 walkthrough has **not** been recorded. The [submission instructions](https://github.com/Nency-Ravaliya/devsecops-python/blob/main/SUBMISSION.md) say the MP4 is mandatory and must show live tools.

## Evidence still to capture

1. Original nonempty Terraform creation plan screenshot, if available from the provisioning session.
2. AWS Console screenshots showing the HireFlow VPC and EKS cluster in `ap-south-1`. No AWS Console browser session was accessible to this agent.
3. Genuine walkthrough MP4 following `demo/VIDEO_SCRIPT.md`.
4. Successful `terraform destroy` screenshot **after** the evaluation; the live stack is being preserved for the walkthrough and currently incurs AWS charges.

Keep credentials, database passwords, and Grafana admin passwords out of screenshots and video.


## Final audit checks (20 October 2026)

- [Instructor repository file inventory](evidence/reference-review.txt) records every tracked file and reviewed source revision.
- [Current automated validation](evidence/audit-validation.txt) contains the 22-case backend result and two frontend API test results. The earlier pytest screenshot shows the 19-case suite before the audit fixes.
- [Current Terraform plan](evidence/terraform-current-plan.txt) is a full-refresh, no-drift plan, not the original creation plan.
- [Current live verification](evidence/final-live-verification.txt) records public API smoke checks, resource readiness, Argo CD, Prometheus, Grafana, and Helm releases.
- [Secret scan summary](evidence/secret-scan-summary.txt) records the redacted Gitleaks result. Scanner findings containing possible secrets are excluded from Git.

- [Final CI job/step result](evidence/final-ci-result.txt): [run 39476145373](https://github.com/Jagrit3500/DevOps_Capstone_Project/actions/runs/39476145373) succeeded on 21 October. Earlier screenshots are retained as historical evidence.

Additional screenshots still needed: live `kubectl get pods`, `kubectl get svc`, `helm list`, and metrics output. The text checks pass but do not replace screenshots explicitly requested by the rubric.

- [Final local Compose verification](evidence/final-compose-verification.txt): immediate CRUD checks passed after readiness gating; backend UID 1001, frontend UID 101.
