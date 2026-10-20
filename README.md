# ⚡ HireFlow — Recruitment Pipeline Tracker

> A DevOps Final Capstone Project (Session 21)
> Domain: **Recruitment / HR Tech SaaS**

HireFlow is a full-stack recruitment pipeline capstone demo that lets hiring teams manage candidates through every stage: **Applied → Screening → Interview → Offer → Hired / Rejected**.

---

## 🏗️ Architecture

```text
Developer -> GitHub main -> GitHub Actions
                            |-- pytest + frontend tests/build
                            |-- Build both Docker images
                            |-- Trivy HIGH/CRITICAL gates
                            |-- Publish SHA tags to GHCR
                            `-- Commit image tags to production Helm values
                                             |
                                          Argo CD
                                             |
Terraform -> AWS VPC + EKS <--- Helm manifests from Git
                       |
Public load balancer -> ingress-nginx
                         |-- /    -> frontend ClusterIP -> React/Nginx
                         `-- /api -> backend ClusterIP -> FastAPI -> PostgreSQL/PVC
                                                          |
                                                    /metrics
                                                          |
                                                    Prometheus -> Grafana
```

---

## 📁 Repository Structure

```
DevOps_Project/
├── backend/                  # FastAPI Python application
│   ├── app/                  # main.py, routes, models, schemas, database
│   ├── alembic/              # DB migrations
│   ├── tests/                # Pytest test suite
│   ├── Dockerfile            # Non-root container image
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── conftest.py
│   └── pytest.ini
├── frontend/                 # React + Vite SaaS dashboard
│   ├── src/                  # App.jsx, api.js, index.css
│   ├── Dockerfile            # Multi-stage Node build + Nginx runtime
│   ├── nginx.conf            # Nginx proxy config
│   └── vite.config.js
├── docker-compose.yml        # Full local stack (one command)
├── terraform/                # AWS VPC + EKS infrastructure
│   ├── providers.tf
│   ├── variables.tf
│   ├── vpc.tf
│   ├── eks.tf
│   ├── outputs.tf
│   └── terraform.tfvars.example
├── helm/hireflow/            # Kubernetes Helm chart
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── backend-deployment.yaml
│       ├── backend-service.yaml
│       ├── frontend.yaml
│       ├── postgres.yaml
│       ├── ingress.yaml
│       ├── hpa.yaml
│       └── serviceaccount.yaml
├── k8s/
│   └── namespace.yaml        # Kubernetes namespace
├── monitoring/
│   ├── prometheus-values.yaml
│   └── grafana-values.yaml
├── scripts/
│   └── load-test.sh
└── .github/workflows/
    └── ci.yml                # GitHub Actions CI/CD pipeline
```

---

## 🚀 Quick Start — Run Locally

### Prerequisites
- Docker Desktop
- Docker Compose

```bash
cp .env.example .env
# Replace the placeholder password in .env before starting the stack.
docker compose up --build
```

| Service   | URL                              |
|-----------|----------------------------------|
| Frontend  | http://localhost:3000            |
| API Docs  | http://localhost:8000/docs       |
| Health    | http://localhost:8000/health     |
| Metrics   | http://localhost:8000/metrics    |

Stop:
```bash
docker compose down
```

Remove volumes too:
```bash
docker compose down -v
```

---

## 🔧 Backend — Run Directly (Python)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Set DB_USER, DB_PASSWORD, DB_HOST and DB_NAME in your shell,
# or provide a complete DATABASE_URL. Never commit a real password.
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

---

## ✅ Testing

```bash
cd backend
pytest -v
```

Tests use an isolated **SQLite test database** — no PostgreSQL required in CI.

The suite currently has 22 passing cases covering health, CRUD, filtering,
statistics, duplicate emails, invalid updates and demo-seed configuration.

---

## 🐳 Docker

```bash
# Backend only
docker build -t hireflow-backend ./backend

# Frontend only
docker build -t hireflow-frontend ./frontend

# Full stack
docker compose up --build
```

Both images run as **non-root users**.
Frontend uses a **multi-stage build** (Node 20 → Nginx).

---

## ⚙️ CI/CD Pipeline (GitHub Actions)

Pipeline runs on every push to `main`:

1. **Pytest** — fails the build if any test fails
2. **npm run build** — builds the React frontend
   The frontend job also runs `npm audit --audit-level=high` and pagination regression tests.
3. **Frontend tests** - verifies API pagination and error handling
4. **Docker build** - builds both images tagged with the Git commit SHA
5. **Trivy** - scans both images and stops publication on HIGH or CRITICAL CVEs
6. **GHCR push** - publishes the scanned SHA-tagged images

Images are published to **GitHub Container Registry (GHCR)**:
```
ghcr.io/<owner>/hireflow-backend:<sha>
ghcr.io/<owner>/hireflow-frontend:<sha>
```

The deploy job uses GitHub OIDC to assume a repository-and-`main`-branch-scoped AWS role; it stores no long-lived AWS key. Terraform creates the OIDC provider and role. This repository uses GitHub's immutable OIDC subject, so the trust policy includes its owner and repository IDs. The role can only describe this EKS cluster through IAM. EKS `aws-auth` maps it to the `hireflow:ci-deploy` group. After both scans pass, CI commits the exact image SHA to [production Helm values](helm/hireflow/values-prod.yaml), then waits for Argo CD to deploy that version. The bot commit includes `[skip ci]` to prevent a second build. [Argo CD's Application](argocd/hireflow-application.yaml) follows `main` and applies the Helm chart. The `hireflow` namespace and `hireflow-db` Secret must exist before enabling the deploy job. Repository Actions variables are `AWS_REGION`, `EKS_CLUSTER_NAME`, and `AWS_ROLE_ARN`.

---

## 🏗️ Infrastructure (Terraform)

Provisions AWS resources:

| Resource | Details |
|---|---|
| VPC | 10.0.0.0/16 with DNS enabled |
| Public Subnets | 2 × /24 across 2 AZs |
| Private Subnets | 2 × /24 across 2 AZs |
| Internet Gateway | For public subnets |
| NAT Gateway | For private subnet egress |
| EKS Cluster | Kubernetes 1.35 |
| Node Group | c7i-flex.large, min 1 / max 4 / desired 2 |

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your region etc.

terraform init
terraform plan
terraform apply

# After evaluation — IMPORTANT, avoid AWS costs:
terraform destroy
```

> ⚠️ **Never commit `terraform.tfvars` or AWS credentials to Git.**

---

## ☸️ Kubernetes + Helm

```bash
# Apply namespace
kubectl apply -f k8s/namespace.yaml

# Terraform installs the EBS CSI driver for persistent volumes and Metrics Server for the HPA.
# Install ingress-nginx first. Ingress routes / to frontend and /api to backend.
# Create a hireflow-db Secret in this namespace with a password key.
# Make the GHCR packages public, or configure imagePullSecrets in Helm values.
# Each backend Pod runs Alembic migrations before starting.
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --version 4.15.1 --namespace ingress-nginx --create-namespace \
  -f k8s/ingress-nginx-values.yaml --wait

# Bootstrap the chart once, then let Argo CD own subsequent image changes.
helm upgrade --install hireflow ./helm/hireflow \
  --namespace hireflow -f helm/hireflow/values-prod.yaml --wait
helm upgrade --install argocd argo/argo-cd --version 10.10.5 \
  --namespace argocd --create-namespace -f argocd/values.yaml --wait
kubectl apply -f argocd/hireflow-application.yaml

# Verify
kubectl get pods -n hireflow
kubectl get svc -n hireflow
kubectl get ingress -n hireflow
kubectl get application hireflow -n argocd
# Open http://<ingress-nginx-controller EXTERNAL-IP/DNS> after the load balancer is ready.
```

---

## 📊 Observability

```bash
# Add Helm repos
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana-community https://grafana-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm upgrade --install prometheus prometheus-community/prometheus \
  -n monitoring --create-namespace \
  -f monitoring/prometheus-values.yaml --wait --timeout 10m

# Install Grafana
helm upgrade --install grafana grafana-community/grafana \
  -n monitoring \
  -f monitoring/grafana-values.yaml --wait --timeout 10m

# Access each UI locally in a separate terminal; Grafana is not publicly exposed.
kubectl port-forward -n monitoring svc/prometheus-server 9090:80
kubectl port-forward -n monitoring svc/grafana 3000:80
# Prometheus targets: http://localhost:9090/targets
# Grafana dashboard: http://localhost:3000
# Grafana's admin password is stored in the grafana Secret in the monitoring namespace.
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service info |
| GET | `/health` | Liveness probe |
| GET | `/ready` | Readiness probe (checks DB) |
| GET | `/metrics` | Prometheus metrics |
| GET | `/api/candidates/` | List candidates (filterable) |
| GET | `/api/candidates/{id}` | Get candidate |
| POST | `/api/candidates/` | Create candidate |
| PUT | `/api/candidates/{id}` | Update candidate |
| DELETE | `/api/candidates/{id}` | Delete candidate |
| GET | `/api/candidates/stats` | Pipeline statistics |

Full docs: **http://localhost:8000/docs**

---

## 🛡️ Security

- Docker images run as **non-root** users
- **Trivy** scans every image build — HIGH/CRITICAL CVEs fail the pipeline
- Compose reads the local password from ignored `.env`; Helm reads it from an existing Kubernetes Secret
- Fictional candidates are seeded only when `SEED_DEMO_DATA=true`; seeding defaults to false in Compose and cloud deployments
- This classroom API has no user authentication; use sample data only until access control is added
- `.gitignore` excludes `.env`, `__pycache__`, `node_modules`, `.venv`, `terraform.tfvars`
- AWS credentials must **never** be committed to Git

---

## 📋 Grading Checklist

| Module | Status |
|--------|--------|
| M1 - Application | Compose stack, PostgreSQL, API and frontend HTTP verified locally; [browser screenshot](evidence/local-app.png) and [mobile screenshot](evidence/mobile-app.png) captured |
| M2 - Testing | 22 pytest cases passed locally; [test screenshot](evidence/pytest-passing.png) captured |
| M3 - Git | Public repository with more than 10 meaningful commits; [history screenshot](evidence/commit-history.png) captured |
| M4 - Docker | Both images built and all three Compose services started locally; [build screenshot](evidence/compose-build-start.png) and [services/database screenshot](evidence/docker-services-database.png) captured |
| M5 - CI/CD | Tests, frontend build, image builds, Trivy gates, GHCR publication, and GitOps promotion passed in [run 39476145373](https://github.com/Jagrit3500/DevOps_Capstone_Project/actions/runs/39476145373). |
| M6 - DevSecOps | Both image Trivy HIGH/CRITICAL gates passed in the deployment run; [backend](evidence/trivy-backend-summary.png) and [frontend](evidence/trivy-frontend-summary.png) scan screenshots captured. The frontend runtime updates Alpine packages during its build. |
| M7 - Terraform | VPC, EKS, EBS CSI, and Metrics Server applied in `ap-south-1`; fmt, validate, and [a captured no-drift plan](evidence/terraform-current-plan.txt) passed. [AWS Console evidence](evidence/aws-eks.png) and [current plan screenshot](evidence/terraform-plan-result.png) captured; [recovered original plan](evidence/terraform-original-plan-archived.png) captured with provenance; post-evaluation teardown proof remains. |
| M8 — Kubernetes + Helm | Two backend and two frontend Pods ready, PostgreSQL running, HPA metrics present, frontend/backend Services are ClusterIP, and Ingress routes `/` and `/api` through ingress-nginx. Argo CD reports Synced and Healthy. |
| M9 — Observability | Prometheus target UP and Grafana application panels populated; [metrics](evidence/backend-metrics.txt), [Prometheus](evidence/prometheus-targets.png), and [Grafana](evidence/grafana-dashboard.png) evidence captured. |
| M10 — Documentation | README and audit present; see `demo/` for presentation artifacts and remaining submission steps. |


## Configuration and limitations

Database credentials come from ignored environment configuration locally and the existing `hireflow-db` Kubernetes Secret in EKS. AWS access uses short-lived local profiles and GitHub OIDC. Terraform variables configure region, names, CIDRs, worker capacity, and repository trust. Helm values configure images, replicas, resources, storage, and ingress. Browser requests use relative `/api` URLs; candidate counts and records come from PostgreSQL through the API. Fixed API routes, service DNS names, ports, enum values, branding, and optional fictional seed fixtures are application contracts/defaults, not credentials or fabricated live data.

This capstone exposes a public HTTP API without authentication or TLS. Use fictional records. Database backups, production access control, TLS, and high-availability PostgreSQL are outside the grading requirements. The UI implements the candidate pipeline; calendar and account settings are not implemented or advertised. AWS regional and Docker registry DNS has intermittently failed on this workstation; retry connectivity before changing infrastructure.

The full requirement audit is in [AUDIT.md](AUDIT.md), with [evidence](EVIDENCE.md), a [slide deck](demo/HireFlow_Presentation.pdf), and the [recording guide](demo/VIDEO_SCRIPT.md). AWS Console and terminal screenshots are collected. The original creation-plan transcript and a labelled archived-output screenshot have been recovered. A genuine video and post-evaluation teardown proof remain required. Do not describe the submission as complete until these items and the course form are handled.

Verify either the local or public deployment without leaving a test record:

```powershell
./scripts/verify-app.ps1 -BaseUrl http://localhost:3000
# Or pass the current ingress-nginx-controller load balancer URL.
```
