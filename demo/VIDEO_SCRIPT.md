# HireFlow recording guide

For exact narration and detailed screen actions, use [the complete read-aloud script](READ_ALOUD_SCRIPT.md). It includes recorder setup, each slide, every live section, and saving the MP4.

The [submission instructions](https://github.com/Nency-Ravaliya/devsecops-python/blob/main/SUBMISSION.md) require a real MP4 screen share. Start with the [PDF slides](HireFlow_Presentation.pdf), then show the live tools in this order. Record at a readable 1080p resolution and keep passwords, tokens, Secret values, and AWS sign-in prompts out of the capture. Sign in to AWS, GitHub, Argo CD, and Grafana before starting the recording.

## 1. Slides, about 2 minutes

The deck shows the verified 20 October deployment snapshot. Use `evidence/final-ci-result.txt` and `evidence/final-live-verification.txt` for the latest source SHA and Argo CD revision during the live section.

Present the ten slides in order. Explain that HireFlow tracks candidates through hiring stages, with a FastAPI API, React frontend, and PostgreSQL database. On the architecture slide, explain that CI publishes scanned images and commits SHA tags to Git, Argo CD syncs the Helm chart, and Ingress sends public requests to internal Services. The PDF is the required slide deck; keep it open at full screen.

## 2. Codebase, about 1 minute

Show `backend/app/routes.py`, `backend/alembic/versions/001_initial.py`, `frontend/src/api.js`, `docker-compose.yml`, `.github/workflows/ci.yml`, `terraform/`, `helm/hireflow/`, `argocd/hireflow-application.yaml`, and `monitoring/`. Mention that `.env` and Terraform state are ignored. Do not open the live Kubernetes Secrets.

## 3. CI/CD, about 5 minutes including the run

During the recording, make a small meaningful documentation change, commit it **without** `[skip ci]`, and push to `main`. This live push is required by the submission rules. Show the new GitHub Actions run completing backend tests, frontend dependency audit/tests/build, image builds, both Trivy scans, GHCR publication, and GitOps promotion. Wait for it to finish, then show the SHA tag in GHCR, the bot commit in `helm/hireflow/values-prod.yaml`, and the matching deployment and Argo CD revision. A documentation-only push still rebuilds images because the workflow runs on every push to `main`. The earlier [successful audit pipeline](https://github.com/Jagrit3500/DevOps_Capstone_Project/actions/runs/39472054163) is a useful rehearsal.

## 4. Terraform and AWS Console, about 2 minutes

From PowerShell in `terraform/`, set `$env:AWS_PROFILE = 'hireflow-terraform'`, then run `terraform fmt -check`, `terraform validate`, and `terraform plan`. The current plan should say `No changes`; explain that Terraform already provisioned the stack. In AWS Console, set the region to **Mumbai (`ap-south-1`)** and show the HireFlow VPC, public/private subnets, `hireflow-eks` cluster, and the Ready `hireflow-workers` node group. If an original nonempty creation plan screenshot exists, include it here. Do not re-create resources solely to get a nonempty plan.

## 5. Argo CD, about 1 minute

From the repository root in PowerShell:

```powershell
$env:AWS_PROFILE = 'hireflow-admin'
kubectl get application hireflow -n argocd -o wide
kubectl get deployment backend frontend -n hireflow -o wide
```

Show `Synced` and `Healthy`, the Git revision, and the same SHA on both images. If using the Argo CD UI, port-forward `svc/argocd-server` in namespace `argocd` and sign in before recording. The UI is intentionally private.

## 6. Kubernetes, about 1 minute

```powershell
kubectl get nodes
kubectl get pods,svc,ingress,hpa -n hireflow
kubectl get svc ingress-nginx-controller -n ingress-nginx
```

Show two Ready backend Pods, two Ready frontend Pods, one Ready PostgreSQL Pod, two ClusterIP app Services, and Ingress paths `/` and `/api`. Open the Ingress load balancer DNS name in the browser and refresh the live app.

Also capture readable terminal screenshots of `kubectl get pods -n hireflow`, `kubectl get svc -n hireflow`, and `helm list -n hireflow` for the rubric. The existing text transcripts verify these checks but do not replace the requested screenshots. Capture `/metrics` output too.

## 7. Prometheus, about 1 minute

In a separate terminal run `kubectl port-forward -n monitoring svc/prometheus-server 9090:80`; open `http://localhost:9090/targets` and show `hireflow-backend` as `UP`. Optionally open the Ingress `/metrics` endpoint to show Prometheus format. Close the port forward after the demo.

## 8. Grafana, about 1 minute

In a separate terminal set `$env:AWS_PROFILE = 'hireflow-admin'`, then run `kubectl port-forward -n monitoring svc/grafana 3001:80`; open the HireFlow dashboard at `http://localhost:3001` and show the requests and latency panels with data. Port 3001 avoids conflict with the local Compose frontend on port 3000. Sign in before the recording so the password never appears on screen. Close the port forward afterward.

## After the recording

Save the actual screen-share video as `demo/HireFlow_Walkthrough.mp4`. Review it once to ensure the text is legible and all required sections appear in the specified order. Commit the MP4 to this repository if GitHub accepts its size; otherwise publish it as a GitHub release asset and link it from this folder. Preserve the live infrastructure until the reviewer has seen the demo. After evaluation, run and capture a verified `terraform destroy` only when the stack can be removed.
