# Session 21 submission evidence

The rubric requires real screenshots and a live or recorded walkthrough. Capture these from your own running GitHub, Docker, AWS and Kubernetes environments. Keep account IDs, tokens and passwords out of screenshots.

## Before the cloud demo

1. Repository: https://github.com/Jagrit3500/DevOps_Capstone_Project. Preserve its real commit history. The rubric asks for at least 10 meaningful commits; this target remains open.
2. Start Docker Desktop. Run `docker compose up --build`, then capture the terminal showing all three services and the browser at `http://localhost:3000` with a candidate added.
3. Run `cd backend` and `python -m pytest -v`; capture the passing test output. Open `/docs` and demonstrate create, read, update and delete. Show the PostgreSQL `candidates` table.
4. Push to `main`. Capture the successful GitHub Actions run URL, its Trivy scan output for both images, the GHCR package pages showing SHA tags, and the commit history.
5. Add a 2–3 sentence explanation of what Trivy scanned and what the result means. Use the actual scan result.

Verified CI result: [run 38914043177](https://github.com/Jagrit3500/DevOps_Capstone_Project/actions/runs/38914043177) passed backend tests, frontend build, both image builds, both Trivy gates and GHCR publication. The EKS deploy job was skipped because the AWS repository variables are not configured yet.

Trivy scanned the operating-system and installed application packages in both runtime images for HIGH and CRITICAL vulnerabilities. Both refreshed images passed the strict gate; the local scan reported zero such findings in each image, and the GitHub Actions scans also passed. Future scans can change as the vulnerability database and image tags are updated.

## AWS and Kubernetes demo

1. Install and configure Terraform, AWS CLI, Helm and kubectl. Use your own AWS account in the expected region. In `terraform/`, run `terraform init`, `terraform fmt -check`, `terraform validate`, `terraform plan` and `terraform apply`. Capture the nonempty plan and AWS Console views of the VPC and EKS cluster.
2. Run the `kubeconfig_command` Terraform output. Install an Ingress controller and Metrics Server. Ensure GHCR packages are public or configure image pull credentials.
3. Apply `k8s/namespace.yaml`; install `helm/hireflow` with your GHCR owner and exact commit SHA. Capture `kubectl get pods -n hireflow`, `kubectl get svc -n hireflow`, `helm list -n hireflow`, `kubectl get hpa -n hireflow`, and the app opened through the Ingress address. Show at least two ready frontend Pods and two ready backend Pods.
4. Install Prometheus and Grafana with the values in `monitoring/`. Generate some requests using `scripts/load-test.sh`. Capture `/metrics`, the Prometheus Targets page with `hireflow-backend` UP, and the HireFlow Grafana dashboard with a populated request or latency panel.
5. Demonstrate troubleshooting using the separate `troubleshooting/broken-image.yaml` and `troubleshooting/broken-service.yaml` resources. Explain ImagePullBackOff and the Service with no endpoints. Remove those demo resources after showing them.
6. Demonstrate a real commit reaching the pipeline, publishing images, and updating the EKS deployment. Record the walkthrough if a live presentation is unavailable.
7. After all deployment evidence is captured, run `terraform destroy` and capture its successful completion. Confirm the EKS cluster, NAT gateway and associated resources are gone.

## GitHub Actions deployment variables

The optional deploy job runs when `EKS_CLUSTER_NAME` is configured as a GitHub Actions repository variable. Also configure `AWS_REGION` and `AWS_ROLE_ARN`. The AWS role must trust this repository's GitHub OIDC identity and allow EKS access. Without these variables, the test, build, scan and publish jobs still run, but the deploy job is skipped.

## Screenshot checklist from GRADING.md

- [ ] Running application in browser at `localhost:3000`
- [ ] `pytest -v` passing output
- [ ] Commit history with at least 10 genuine commits
- [ ] `docker compose up --build` showing frontend, backend and PostgreSQL
- [ ] Successful GitHub Actions run URL
- [ ] GHCR package pages with SHA tags
- [ ] Trivy output for both images and 2–3 sentence result explanation
- [ ] `terraform plan` output
- [ ] AWS Console VPC and EKS cluster in the expected region
- [ ] `kubectl get pods -n hireflow` with Running Pods
- [ ] `kubectl get svc -n hireflow`
- [ ] `helm list -n hireflow`
- [ ] Application through Ingress or LoadBalancer
- [ ] Backend `/metrics` output
- [ ] Prometheus Targets page showing HireFlow UP
- [ ] Grafana dashboard with a populated application metrics panel
- [ ] `terraform destroy` completion
- [ ] Live presentation or recorded walkthrough
