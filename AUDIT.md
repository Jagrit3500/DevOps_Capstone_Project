# HireFlow capstone audit

Audited on 20 October 2026; final verification on 21 October 2026 against the instructor's [submission rules](https://github.com/Nency-Ravaliya/devsecops-python/blob/main/SUBMISSION.md) and [100 point grading rubric](https://github.com/Nency-Ravaliya/devsecops-python/blob/main/GRADING.md). The reference repository was inspected for its instructions and example structure; HireFlow is an independent recruitment application.

## Result

The application and infrastructure are running. The current [GitHub Actions run](https://github.com/Jagrit3500/DevOps_Capstone_Project/actions/runs/39476145373) passed tests, frontend build, two image builds, both Trivy gates, GHCR publication, GitOps promotion, and EKS rollout. Argo CD reports **Synced / Healthy** at revision `71f195c`. The two backend and two frontend replicas, PostgreSQL, ingress controller, Prometheus, and Grafana Pods are healthy. The public Ingress served `/` with HTTP 200, `/health` with `{"status":"healthy"}`, and `/api/candidates/` with `[]`. A synthetic candidate passed create, read, update, statistics, and delete through this Ingress; the record was removed. Prometheus returned `up=1` for `hireflow-backend`.

This is **not yet a complete submission**. The required real walkthrough MP4, course form, and post-evaluation `terraform destroy` evidence are outstanding. The live stack remains deployed for the demonstration and incurs AWS charges.

## Rubric matrix

| Module | Requirement and evidence | Status |
| --- | --- | --- |
| M1 Application | FastAPI `/health`; GET/POST/PUT/DELETE candidate API; PostgreSQL with Alembic migration; responsive React UI. Local and [current Ingress screenshot](evidence/live-ingress-app.png). Live CRUD smoke test passed and cleaned up. | Met |
| M2 Testing | `backend/tests/` contains 22 cases and an isolated SQLite test database. Local `pytest -q` passed 22/22; CI test job passed. [Current 22-case output](evidence/audit-validation.txt), [earlier 19-case screenshot](evidence/pytest-passing.png). | Met |
| M3 Git | Public repository with more than ten meaningful commits and `.gitignore` for secrets/build artifacts. [Commit history](evidence/commit-history.png). | Met; repository URL still must be submitted in the course form |
| M4 Docker | Both Dockerfiles build, run non-root; frontend has a multi-stage Node/Nginx build; Compose runs frontend, backend, and PostgreSQL. [Build evidence](evidence/compose-build-start.png), [service evidence](evidence/docker-services-database.png). | Met |
| M5 CI/CD | Push to `main` runs tests before image builds, builds frontend and both images, scans, pushes SHA tags, commits production values, and waits for Argo CD rollout. [Run 39476145373](https://github.com/Jagrit3500/DevOps_Capstone_Project/actions/runs/39476145373), [earlier run screenshot](evidence/ci-gitops-success.png), [GHCR backend](evidence/ghcr-backend.png), [GHCR frontend](evidence/ghcr-frontend.png). | Met |
| M6 DevSecOps | Trivy scans both images; HIGH/CRITICAL findings fail the job before publication. [Backend](evidence/trivy-backend-summary.png) and [frontend](evidence/trivy-frontend-summary.png) output. Earlier frontend scan found vulnerable Alpine packages; refreshing the runtime packages cleared the blocking scan. | Met |
| M7 Terraform | Valid HCL, successful init/apply, VPC with two public subnets, EKS and worker node group. Current [no-drift plan](evidence/terraform-current-plan.txt) and [cluster status](evidence/live-gitops-status.txt). | Functionally met; Historical creation plan recovered with a labelled display screenshot; AWS Console and current plan screenshots captured. Post-evaluation destroy evidence remains; original screenshot unavailable |
| M8 Kubernetes + Helm | Helm chart renders and deployed. Backend/frontend Services are ClusterIP; Ingress sends `/` to frontend and `/api` to backend. Two replicas each and all Pods Running. [Live status](evidence/live-gitops-status.txt), [Ingress app](evidence/live-ingress-app.png). | Met; [Pods](evidence/kubernetes-pods.png), [Services](evidence/kubernetes-services.png), [Helm](evidence/helm-release.png), [Ingress](evidence/kubernetes-ingress.png) screenshots captured |
| M9 Observability | Backend `/metrics`, Prometheus backend target `UP`, Grafana panel data, Bound monitoring PVCs. [Metrics](evidence/backend-metrics.txt), [Prometheus](evidence/prometheus-targets.png), [Grafana](evidence/grafana-dashboard.png). Live Prometheus query returned `up=1`. | Met; [metrics screenshot](evidence/backend-metrics.png) captured |
| M10 Presentation | README covers setup and architecture; [10-page PDF deck](demo/HireFlow_Presentation.pdf) covers all eight required topics. | Partial: real walkthrough MP4 is mandatory and remains |

## Configuration and security review

- No AWS key, database password, or Grafana password is stored in tracked application, Helm, Terraform, or workflow files. The `.env.example` value is a placeholder; Compose requires `POSTGRES_PASSWORD` from ignored `.env`. Kubernetes reads `hireflow-db` through Secret references. GitHub Actions uses OIDC rather than static AWS keys.
- Production image tags are immutable Git SHAs in `helm/hireflow/values-prod.yaml`. CI updates this file after both scans pass. Repository/owner names, AWS region, VPC CIDRs, instance type, and resource names are configuration identifiers; they are intentionally explicit or exposed as Terraform/Helm variables.
- This classroom API has no user authentication. The Ingress is public and HTTP only. Do not store real candidate personal information until authentication and TLS are added. The cloud database currently has no candidate records.
- The initial PostgreSQL `initdb` crash from an EBS mount `lost+found` directory was fixed by setting `PGDATA` to a subdirectory. The earlier worker creation error was fixed by changing the unsupported `t3.medium` to `c7i-flex.large`. An Argo CD StatefulSet false drift was fixed by removing `ServerSideApply=true`; it now reports Synced and Healthy.
- AWS CLI login is short-lived and this workstation has shown intermittent DNS resolution failures for AWS regional endpoints. Reauthenticate only when needed; retry DNS before changing cluster settings.

## Remaining submission actions

1. Record a genuine screen-share MP4 following [the recording guide](demo/VIDEO_SCRIPT.md), with slides first and then the live codebase, CI/CD push/run, Terraform plan plus AWS Console VPC/EKS, Argo CD sync, Kubernetes, Prometheus Targets, and Grafana. Save it under `demo/` and commit it or attach it as a GitHub release asset. The recording must show the live tools; exporting the PDF as a slideshow does not meet the video rule.
2. Review the recovered original creation-plan transcript, provenance, and labelled archived-output screenshot linked below. AWS Console VPC/EKS and current plan screenshots are captured. The current plan is correctly empty because the resources already exist. Do not modify the infrastructure just to manufacture a nonempty plan.
3. After the evaluation and recording, decide whether to tear down. The rubric asks for a `terraform destroy` completion screenshot. Destruction removes the live cluster and is intentionally deferred until the demo is finished.
4. Submit the public repository URL through the instructor's form. This external form submission is a user action.

## Reproduction commands

Use the `hireflow-admin` AWS profile for Kubernetes and Helm. Use `hireflow-terraform` for Terraform. From the repository root:

```powershell
$env:AWS_PROFILE = 'hireflow-admin'
kubectl get application hireflow -n argocd
kubectl get pods,svc,ingress,hpa -n hireflow
kubectl get pods -n monitoring
kubectl get svc ingress-nginx-controller -n ingress-nginx
```

The public endpoint is the `EXTERNAL-IP` DNS name of `ingress-nginx-controller`. It can change if that Service is recreated.


## Full repository review and final audit fixes

Every instructor text file was read, including both workflow versions, application/tests/migrations, Docker/Compose, Helm, Kubernetes, monitoring, Terraform, and troubleshooting examples. [The file inventory](evidence/reference-review.txt) records the reviewed revision and SHA256 hashes. Binary `.DS_Store` files are Finder metadata. The rubric takes precedence where illustrative reference code conflicts with its requirements (Docker Hub versus GHCR, Kind versus AWS EKS, and inconsistent reference Ingress ports).

The review found and fixed inactive sidebar navigation, silent candidate truncation after 100 rows, delete errors that left a stuck dialog, nullable form values, and resume URL lengths exceeding the PostgreSQL column limit. Frontend pagination now has two regression tests in CI. Backend tests now include metrics and both oversized-URL rejection paths: 22 tests pass. Local fictional seeding now defaults to false and requires explicit opt-in. Both backend containers receive the configured PostgreSQL port.

Hardcoding assessment: no committed application credentials were found by the history scanner. Environment variables and Kubernetes Secrets supply passwords; OIDC supplies AWS CI credentials. Terraform variables and Helm values hold environment settings. Static application routes, enums, internal service names/ports, branding, immutable image SHAs, and optional fictional seed data remain intentional contracts/defaults. It would be inaccurate to claim that every literal in the repository is dynamically configured.

Fresh verification: 22 backend tests passed, two frontend tests passed, frontend production build passed, public CRUD/readiness/metrics checks passed with cleanup, all app and monitoring Pods were Running, all PVCs were Bound, HPA CPU metrics worked, Prometheus reported `up=1`, Grafana health reported database `ok`, and Terraform fmt/validate plus a full-refresh plan passed with no drift. The first Terraform attempt failed on STS DNS; retry succeeded. Existing screenshots remain labeled historical where applicable.

Submission readiness is separate from software health. M1/M2/M4/M5/M6/M8/M9 functionality is verified. M3 still needs the course form. M7 has recovered historical planning evidence and retains the post-evaluation destroy evidence gap, and M10 cannot earn full credit without the actual video. No speculative total score is claimed; the instructor determines points and late penalties.

The dependency audit also found Vite 5/esbuild development-server advisories, including [the Windows path access advisory](https://github.com/vitejs/vite/security/advisories/GHSA-fx2h-pf6j-xcff). Vite was upgraded to patched 6.4.4 with its lockfile, and `npm audit` then reported zero vulnerabilities. CI now audits frontend dependencies before building, in addition to scanning both runtime images with Trivy. The rebuilt local Compose application passed the full smoke test, and `id` confirmed backend UID 1001 and frontend UID 101.


## Final result - 21 October 2026

[Run 39476145373](https://github.com/Jagrit3500/DevOps_Capstone_Project/actions/runs/39476145373) passed all jobs, including 22 backend tests, frontend dependency audit, frontend build and two pagination tests, both Docker image builds, strict Trivy gates, GHCR publication, and GitOps promotion. The deployed source SHA is `d04a9e74108f841999164a6a6d9b1b3b52c413da`. Argo CD was Synced/Healthy at `71f195c26e3053571192e7624436f914698ba063` with both app Deployments 2/2 ready. [Final CI evidence](evidence/final-ci-result.txt) and [live checks](evidence/final-live-verification.txt) record the results.

The final Compose test caught a brief 502 startup race. The backend now has a database readiness healthcheck, and the frontend waits for it. `docker compose up --build --wait --wait-timeout 120 -d` then passed, followed immediately by the full CRUD smoke test. Both runtime containers use non-root users. The committed ten-page PDF contains an actual architecture diagram and all required slide topics; it matches the local binary byte-for-byte. Earlier screenshot captures show their capture-time versions.

Remaining items are submission evidence or user participation, not unverified claims of completion:

1. Record and upload the real walkthrough MP4, including a new push and complete CI run. The recording guide now treats this push as mandatory.
2. AWS Console and requested terminal screenshots are now collected; see the evidence update below.
3. Historical creation-plan evidence is now recovered and labelled; the original screenshot was not found. The current full-refresh plan is genuinely empty because infrastructure matches configuration. No infrastructure was changed to manufacture evidence.
4. Submit the public repository link through the course form.
5. After evaluation, explicitly authorize teardown, then capture successful cleanup and Terraform destroy. The live EKS stack remains deployed and incurs charges.

The source lists a deadline of 19 October 2026 at 23:59 IST, with a weekday label that does not match the calendar date, and a late penalty. Confirm any extension with the instructor; this audit does not assume one.

## Screenshot collection complete - 21 October 2026

The user supplied twelve genuine screenshots covering the VPC, four subnets, Active EKS cluster and worker node group, five Running/Ready Pods, ClusterIP Services, deployed Helm release, Synced/Healthy Argo CD, Ingress, Prometheus-formatted metrics, and the completed no-drift Terraform plan. [All captures are indexed here](EVIDENCE.md#user-captured-evidence---21-october-2026). AWS Console and terminal screenshot gaps are closed. The remaining submission items are the genuine walkthrough video, course form, and post-evaluation teardown evidence. Historical creation-plan evidence was subsequently recovered as described below.

## Original planning evidence recovered

The original user-provided Terraform output from 17 October 2026 was recovered from the project conversation and saved as [archived text](evidence/terraform-original-creation-plan.txt). It shows **Plan: 26 to add, 0 to change, 0 to destroy**. [Recovery provenance](evidence/terraform-plan-recovery.md) records its source and checksum. The user captured [a clearly labelled display of this archived output](evidence/terraform-original-plan-archived.png) on 21 October. This is a screenshot of recovered historical text, not an original capture-time screenshot. The initial t3.medium worker setting was subsequently corrected to c7i-flex.large; current Console evidence and the no-drift plan reflect the deployed configuration. The grader can assess the recovered evidence with that provenance.
