# Session 21 submission evidence

The rubric requires real screenshots and a live or recorded walkthrough. Capture these from your own running GitHub, Docker, AWS and Kubernetes environments. Keep account IDs, tokens and passwords out of screenshots.

## Evidence already captured

- Local application and responsive UI: [desktop](evidence/local-app.png) and [390px mobile](evidence/mobile-app.png).
- Local quality and containers: [19 passing tests](evidence/pytest-passing.png), [Compose build/start](evidence/compose-build-start.png), and [running services with database](evidence/docker-services-database.png).
- Source control and CI: [commit history](evidence/commit-history.png), [green Actions run](evidence/ci-success.png), [backend GHCR package](evidence/ghcr-backend.png), and [frontend GHCR package](evidence/ghcr-frontend.png).
- Image security: [backend clean scan](evidence/trivy-backend-clean.png), [backend summary](evidence/trivy-backend-summary.png), and [frontend summary](evidence/trivy-frontend-summary.png).
- AWS application and monitoring: [Kubernetes and Helm command output](evidence/eks-status.txt), [live EKS application](evidence/live-eks-app.png), [backend metrics output](evidence/backend-metrics.txt), [Prometheus target UP](evidence/prometheus-targets.png), and [Grafana dashboard](evidence/grafana-dashboard.png).
- Deliberate failure exercise: [image pull failure and service with no endpoints](evidence/troubleshooting-demo.txt). The demonstration resources were removed.

The AWS and monitoring screenshots above were captured on 17 October 2026. Recheck live resources before a presentation. A refreshed [Terraform plan](evidence/terraform-current-plan.txt) on 19 October showed no changes.

## Before the cloud demo

1. Repository: https://github.com/Jagrit3500/DevOps_Capstone_Project. Preserve its real commit history. The rubric's target of at least 10 meaningful commits has been met; see the [GitHub history screenshot](evidence/commit-history.png).
2. Start Docker Desktop. Copy `.env.example` to `.env` and set a local password (the current local `.env` is already set up and ignored by Git). Run `docker compose up --build`, then capture the terminal showing all three services and the browser at `http://localhost:3000` with a candidate added.
3. Run `cd backend` and `python -m pytest -v`; capture the passing test output. Open `/docs` and demonstrate create, read, update and delete. Show the PostgreSQL `candidates` table.
4. Push to `main`. Capture the successful GitHub Actions run URL, its Trivy scan output for both images, the GHCR package pages showing SHA tags, and the commit history.
5. Add a 2–3 sentence explanation of what Trivy scanned and what the result means. Use the actual scan result.

Verified CI result: [run 38922674760](https://github.com/Jagrit3500/DevOps_Capstone_Project/actions/runs/38922674760) passed backend tests, frontend build, both image builds, both Trivy gates and GHCR publication. The [run screenshot](evidence/ci-success.png) shows those jobs green. The EKS deploy job was skipped because the AWS repository variables are not configured yet. The [backend](evidence/ghcr-backend.png) and [frontend](evidence/ghcr-frontend.png) GHCR screenshots show the SHA-tagged images are public. A [390px mobile screenshot](evidence/mobile-app.png) was captured with `node scripts/capture-mobile.mjs`; its viewport and document width both measured 390px.

Trivy scanned the operating-system and installed application packages in both runtime images for HIGH and CRITICAL vulnerabilities. Both refreshed images passed the strict gate; the local scan reported zero such findings in each image, and the GitHub Actions scans also passed. Future scans can change as the vulnerability database and image tags are updated.

## AWS and Kubernetes demo

1. Terraform infrastructure was applied in `ap-south-1`; `fmt -check`, `validate`, and a later no-drift `plan` passed. Capture AWS Console views of the VPC and EKS cluster. The original nonempty creation plan is in the terminal history but was not saved as a standalone screenshot.
2. Run the `kubeconfig_command` Terraform output. Terraform installs the EBS CSI add-on for the application's PVC and Metrics Server for HPA CPU metrics. Ensure GHCR packages are public or configure Helm `imagePullSecrets`.
3. The `hireflow` namespace and `hireflow-db` Secret already exist; preserve the Secret and never commit its password. The Helm release was deployed with SHA-tagged GHCR images. Recheck `kubectl get pods,svc,pvc,hpa -n hireflow`, `helm list -n hireflow`, and the app through the frontend load balancer. Two frontend and two backend Pods were ready in the last captured output.
4. Prometheus and Grafana were installed with the values in `monitoring/`. Their backend target and populated dashboard were captured. They use ClusterIP Services; port-forward them again if the demo requires the UIs.
5. The troubleshooting exercise was captured in `evidence/troubleshooting-demo.txt`; the demo resources were removed. Repeat live only if the presentation requires it.
6. Demonstrate a real commit reaching the pipeline, publishing images, and updating the EKS deployment. Record the walkthrough if a live presentation is unavailable.
7. After all deployment evidence is captured, uninstall the application and monitoring Helm releases, then delete remaining PVCs. Run `terraform destroy` and capture its successful completion. Confirm the EKS cluster, EBS volumes, NAT gateway and associated resources are gone.

## GitHub Actions deployment variables

The deploy job now has the `AWS_REGION`, `EKS_CLUSTER_NAME`, and `AWS_ROLE_ARN` repository variables. Terraform created a GitHub OIDC role restricted to this repository's `main` branch; `k8s/ci-deploy-rbac.yaml` and `scripts/configure-ci-eks-access.ps1` grant its EKS identity access to deploy HireFlow. The `hireflow-db` Secret already exists and is checked by the workflow. A new successful Actions deployment run must still be captured before this is marked complete.

## Screenshot checklist from GRADING.md

- [x] Running application in browser at `localhost:3000`
- [x] `pytest -v` passing output — [screenshot](evidence/pytest-passing.png)
- [x] Commit history with at least 10 genuine commits
- [x] `docker compose up --build` and running frontend, backend and PostgreSQL — [build](evidence/compose-build-start.png), [services/database](evidence/docker-services-database.png)
- [x] Successful GitHub Actions run URL and screenshot
- [x] GHCR package pages with SHA tags
- [x] Trivy output for both images and result explanation — [backend](evidence/trivy-backend-summary.png), [frontend](evidence/trivy-frontend-summary.png); explanation above
- [x] Complete no-drift `terraform plan` output — [captured output](evidence/terraform-current-plan.txt). Original creation-plan screenshot remains unavailable.
- [ ] AWS Console VPC and EKS cluster in the expected region
- [x] `kubectl get pods -n hireflow` with Running Pods — [captured output](evidence/eks-status.txt)
- [x] `kubectl get svc -n hireflow` — [captured output](evidence/eks-status.txt)
- [x] `helm list -n hireflow` — [captured output](evidence/eks-status.txt)
- [x] Application through LoadBalancer — [browser screenshot](evidence/live-eks-app.png)
- [x] Backend `/metrics` output — [captured response](evidence/backend-metrics.txt)
- [x] Prometheus Targets page showing HireFlow UP — [screenshot](evidence/prometheus-targets.png)
- [x] Grafana dashboard with a populated application metrics panel — [screenshot](evidence/grafana-dashboard.png)
- [ ] `terraform destroy` completion
- [ ] Live presentation or recorded walkthrough
