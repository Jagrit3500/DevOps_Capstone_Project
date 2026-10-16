# ⚡ HireFlow — Recruitment Pipeline Tracker

> A DevOps Final Capstone Project (Session 21)  
> Domain: **Recruitment / HR Tech SaaS**

HireFlow is a full-stack recruitment pipeline capstone demo that lets hiring teams manage candidates through every stage: **Applied → Screening → Interview → Offer → Hired / Rejected**.

---

## 🏗️ Architecture

```
Developer
   |
   v
Git / GitHub
   |
   v
GitHub Actions CI/CD
   |-- pytest (quality gate)
   |-- npm run build (frontend)
   |-- Docker build (backend + frontend)
   |-- Trivy security scan (HIGH/CRITICAL CVEs fail the build)
   `-- Push images to GHCR with SHA tags
              |
              v
        Terraform (AWS)
              |
       VPC + EKS Cluster
              |
              v
            Helm
              |
    +---------+---------+
    |                   |
 Frontend            Backend
  React + Vite        FastAPI
  Nginx               PostgreSQL
    |                   |
    +-------> Prometheus + Grafana
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

The suite currently has 17 passing cases covering health, CRUD, filtering,
statistics, duplicate emails and invalid updates.

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
3. **Docker build** - builds both images tagged with the Git commit SHA  
4. **Trivy** - scans both images and stops publication on HIGH or CRITICAL CVEs  
5. **GHCR push** - publishes the scanned SHA-tagged images  

Images are published to **GitHub Container Registry (GHCR)**:
```
ghcr.io/<owner>/hireflow-backend:<sha>
ghcr.io/<owner>/hireflow-frontend:<sha>
```

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
| Node Group | t3.medium, min 1 / max 4 / desired 2 |

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

# Terraform installs the EBS CSI driver for persistent volumes.
# Install an Ingress controller and Metrics Server in the cluster first.
# Create a hireflow-db Secret in this namespace with a password key.
# Make the GHCR packages public, or configure imagePullSecrets in Helm values.
# Each backend Pod runs serialized Alembic migrations before starting.
helm upgrade --install hireflow ./helm/hireflow \
  --namespace hireflow \
  --set registry=ghcr.io/jagrit3500 \
  --set backend.tag=<sha> \
  --set frontend.tag=<sha> \
  --wait

# Verify
kubectl get pods -n hireflow
kubectl get svc -n hireflow
helm list -n hireflow
```

---

## 📊 Observability

```bash
# Add Helm repos
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Prometheus
helm upgrade --install prometheus prometheus-community/prometheus \
  -n monitoring --create-namespace \
  -f monitoring/prometheus-values.yaml

# Install Grafana
helm upgrade --install grafana grafana/grafana \
  -n monitoring \
  -f monitoring/grafana-values.yaml \
  --set adminPassword=<your-secure-password>

# Check metrics
curl http://localhost:8000/metrics
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
- This classroom API has no user authentication; use sample data only until access control is added
- `.gitignore` excludes `.env`, `__pycache__`, `node_modules`, `.venv`, `terraform.tfvars`
- AWS credentials must **never** be committed to Git

---

## 📋 Grading Checklist

| Module | Status |
|--------|--------|
| M1 - Application | Compose stack, PostgreSQL, API and frontend HTTP verified locally; [browser screenshot](evidence/local-app.png) captured |
| M2 - Testing | 17 pytest cases passed locally |
| M3 - Git | Repository pushed to GitHub; the rubric's 10 meaningful commit target is still pending |
| M4 - Docker | Both images built and all three Compose services started locally; browser screenshot captured, terminal screenshot pending |
| M5 - CI/CD | Tests, frontend build, image builds and GHCR publication passed in [audit run 38920212698](https://github.com/Jagrit3500/DevOps_Capstone_Project/actions/runs/38920212698); [earlier green run screenshot](evidence/ci-success.png) and [GHCR package screenshots](evidence/README.md) captured, EKS deploy skipped until AWS is configured |
| M6 - DevSecOps | Both image Trivy HIGH/CRITICAL gates passed in run 38914043177; evidence screenshots pending |
| M7 - Terraform | Init, fmt and validate passed locally; AWS plan/apply/destroy pending |
| M8 — Kubernetes + Helm | Chart prepared; cluster deployment proof pending |
| M9 — Observability | Backend `/metrics` verified locally; Prometheus target and Grafana panel pending |
| M10 — Documentation | README present; live or recorded demonstration pending |
