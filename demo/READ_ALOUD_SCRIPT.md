# HireFlow: recording steps and speaking script

Follow this sequence: slides, codebase, a new CI/CD push, Terraform and AWS Console, Argo CD, Kubernetes and the application, Prometheus, Grafana. The instructor requires a real screen walkthrough and a new push. Camera footage is optional in this guide; the published requirements do not specify a face camera. Use your microphone and explain what the screen proves.

Aim for about 15-25 minutes, depending on pipeline time. This is a suggested length, not an instructor limit. Read the quoted passages naturally. Only say a check passed after the screen shows it passed. The slides contain earlier deployment snapshots; use the new run and live output for current revisions.

## A. Prepare before recording

### A1. Recording setup

On Windows 11, open Snipping Tool, choose Record, then New; alternatively press Windows+Shift+R. Select the screen area containing your maximized applications. Turn on the microphone in the recording toolbar and choose the correct microphone. Record a 15-second test while switching between a browser and PowerShell. Play it back and check your voice and command text are readable. If recording controls or microphone options are missing, update Snipping Tool through Microsoft Store before the real recording.

For the real recording, use the same screen area for the slides, editor, browser and terminals. Start on slide 1. Stop using the recording toolbar and save the completed MP4 as `demo/HireFlow_Walkthrough.mp4`.

Keep these speaking notes on your phone, on paper, or on a second screen outside the captured area. Practise the sequence once before the final recording.

### A2. Open the project and verify login

Open a main PowerShell window:

```powershell
Set-Location 'C:\Users\jagri\Documents\DevOps_Project'
git status --short
git pull --ff-only
$env:AWS_PROFILE = 'hireflow-admin'
kubectl get nodes
$lb = kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
Write-Output "Application: http://$lb"
```

The Git working tree should be clean before you make the recording's README edit. If AWS reports an expired session, sign in before recording:

```powershell
aws login --profile hireflow-admin --region ap-south-1
```

Open the displayed application URL. Keep these browser pages ready:

- Repository: https://github.com/Jagrit3500/DevOps_Capstone_Project
- Actions: https://github.com/Jagrit3500/DevOps_Capstone_Project/actions
- Backend package: https://github.com/Jagrit3500/DevOps_Capstone_Project/pkgs/container/hireflow-backend
- Frontend package: https://github.com/Jagrit3500/DevOps_Capstone_Project/pkgs/container/hireflow-frontend
- AWS Console: VPC, subnets, `hireflow-eks`, and `hireflow-workers`, all in Mumbai.

Open `demo/HireFlow_Presentation.pdf` and the project folder in your code editor. Increase editor and terminal text size until the grader can read it. Keep sign-in prompts, `.env`, credentials, Terraform state, and Secret values out of the recorded area.

### A3. Start monitoring access

In a second PowerShell window:

```powershell
$env:AWS_PROFILE = 'hireflow-admin'
kubectl port-forward -n monitoring svc/prometheus-server 9090:80
```

In a third PowerShell window:

```powershell
$env:AWS_PROFILE = 'hireflow-admin'
kubectl port-forward -n monitoring svc/grafana 3001:80
```

Leave both commands running. Open http://localhost:9090/targets and http://localhost:3001. Grafana uses 3001 here because the local Compose frontend can already occupy port 3000. Sign in to Grafana before recording and open the dashboard titled `HireFlow - Application Overview` (the title uses a dash between the words). Set the dashboard time range to the last 15 minutes and refresh.

If you do not know the Grafana password, run the following in the main terminal before recording. It copies the password to your clipboard without printing it:

```powershell
$grafanaEncoded = kubectl get secret grafana -n monitoring -o jsonpath='{.data.admin-password}'
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($grafanaEncoded)) | Set-Clipboard
Remove-Variable grafanaEncoded
```

Use username `admin` and paste the clipboard into Grafana's password field. After signing in:

```powershell
Set-Clipboard -Value ''
```

Do not record password retrieval or login. Close the password-manager save prompt if it obscures the dashboard.

## B. Start recording and present all ten slides

### Slide 1: HireFlow

Show slide 1 and say:

> Hello, my name is Jagrit. This is HireFlow, my DevSecOps capstone project. HireFlow tracks candidates through a recruitment pipeline. I will explain the application and its architecture, then demonstrate how a Git change becomes a tested, scanned container image running on AWS, with monitoring.

### Slide 2: Project overview

> HireFlow lets a team create, view, update and remove candidates. Candidates move through applied, screening, interview, offer, hired and rejected stages. The dashboard retrieves its records and statistics from the backend API, and PostgreSQL stores the data. This is a classroom demonstration, so I use fictional candidate information.

### Slide 3: Technology stack

> The frontend uses React and Vite, with Nginx serving the built application. The backend uses Python FastAPI, SQLAlchemy and Alembic. PostgreSQL is the database. Docker packages the application, GitHub Actions handles continuous integration, and GHCR stores images. Terraform provisions AWS infrastructure. Helm defines Kubernetes resources, Argo CD reconciles them from Git, and Prometheus and Grafana provide monitoring.

### Slide 4: Architecture

Point to the delivery path, then the request path:

> There are two flows in this architecture. For delivery, a push starts GitHub Actions. It tests the application, builds and scans both images, publishes them to GHCR, and commits their SHA tags to production Helm values. Argo CD watches Git and applies the desired Kubernetes configuration. For user requests, traffic reaches an AWS load balancer and ingress-nginx. The root path goes to the frontend and slash api goes to the backend. Only the backend connects to PostgreSQL.

### Slide 5: CI/CD pipeline

> This slide contains an earlier successful pipeline. In the live demonstration, I will trigger a new run. Backend tests and frontend checks must pass before image publication. Both image scans must pass before the deployment is promoted. Using the Git commit SHA as the image tag makes the deployed version traceable to its source.

### Slide 6: DevSecOps gates

> Trivy scans operating-system and installed application packages in both runtime images. A HIGH or CRITICAL finding causes the pipeline to fail. The frontend job also runs npm audit for its dependencies. A passing scan reflects the scanner's database at that time; authentication, TLS and other security controls still matter. Database passwords come from environment configuration locally and Kubernetes Secrets in the cluster. GitHub Actions uses AWS OIDC instead of a stored long-lived AWS access key.

### Slide 7: Infrastructure

> Terraform provisions the network and EKS infrastructure in Mumbai. The VPC contains two public and two private subnets across two Availability Zones. Worker nodes run in private subnets, and a NAT gateway provides outbound connectivity. The stack includes IAM roles, the EBS CSI driver for persistent storage, and Metrics Server for resource metrics. The configured worker node group has a desired size of two.

### Slide 8: Kubernetes and GitOps

> The backend and frontend each run with at least two replicas. Kubernetes readiness probes check whether the application can serve requests, while liveness probes check whether it is alive. Both application Services use ClusterIP. Ingress supplies the public routing. Helm provides reusable templates and values; Argo CD renders the chart and applies its manifests from Git. I will show the current sync status and image versions in the live section.

### Slide 9: Observability

> The backend exposes Prometheus metrics. Prometheus scrapes them, and Grafana displays request rate, the ninety-fifth percentile request latency, and server error rate. These metrics help distinguish availability problems, slow responses, and application errors. I will show the live target and dashboard after the deployment walkthrough.

### Slide 10: Demo and lessons

> One issue was PostgreSQL initialization on an EBS volume: the mount root contained lost plus found. Setting PGDATA to a subdirectory fixed initialization. Another issue was frontend startup before the backend was ready; Compose now waits for backend database readiness. The main lesson is to verify each stage with evidence: tests, image scans, infrastructure plans, rollout status and live metrics. The API currently uses HTTP without user authentication, so this is a capstone deployment rather than a finished production service.

Transition:

> I will now demonstrate the live project, starting with the codebase.

## C. Codebase walkthrough

Show the root folder structure:

> The repository separates application code from delivery and infrastructure configuration. Backend and frontend contain the application. Terraform provisions AWS. Helm and Kubernetes files describe workloads and networking. The workflow automates delivery, Argo CD defines GitOps reconciliation, and monitoring contains Prometheus and Grafana configuration.

Open these files one at a time; point to the relevant lines while speaking:

1. `backend/app/routes.py`:

> These routes implement candidate create, read, update and delete operations, filtering, and pipeline statistics. The route handlers use database sessions and SQLAlchemy models.

2. `backend/app/models.py` and `backend/alembic/versions/001_initial.py`:

> The Candidate model defines the stored fields. Alembic manages the database schema through a migration, so schema changes are version controlled.

3. `backend/conftest.py` and `backend/tests/test_candidates.py`:

> The tests use an isolated SQLite database instead of the cloud database. The suite covers health, CRUD, validation, duplicates, filtering and metrics. There are twenty-two backend test cases in the current project.

4. `frontend/src/api.js`:

> The frontend calls relative slash api URLs, so it does not embed an AWS load balancer hostname. It retrieves candidate pages and reports failed API responses.

5. `backend/Dockerfile`, `frontend/Dockerfile`, and `docker-compose.yml`:

> Both application images run as non-root users. The frontend uses a multi-stage Node build and Nginx runtime. Compose starts PostgreSQL, waits for its health, starts the backend and migrations, then waits for backend readiness before starting the frontend.

6. `.github/workflows/ci.yml`:

> This workflow connects the quality checks, image builds, security scans, registry publication and GitOps promotion. I will trigger it now.

## D. Trigger a new push and show CI/CD

In the editor, add this useful sentence to the README's local setup instructions and save:

> During local startup, Compose waits for the backend database readiness check before starting the frontend.

Say:

> I am adding a documentation note about startup readiness. I will commit and push it to demonstrate the real pipeline trigger. This workflow also runs for a documentation push to main.

In the main PowerShell window:

```powershell
git diff -- README.md
git add -- README.md
git commit -m "Clarify local startup readiness for the walkthrough"
$demoSha = git rev-parse HEAD
git push origin main
Write-Output "Source commit for this demonstration: $demoSha"
```

Do not use `[skip ci]`. Open the new Actions run, identified by this commit. Keep `$demoSha` in the same main terminal for later verification.

While the run executes, show the jobs and say:

> The backend job runs pytest first. The frontend job then audits dependencies, builds the React application, and runs two API pagination tests. The image job builds both containers. Trivy checks each image, and publication happens only after both security gates pass. The final job writes the scanned image SHA to production Helm values and waits for Argo CD to roll out that version.

Open the pytest step, frontend audit/test steps, both Trivy steps and publication step as they complete. Leave enough time for the text to be read. You can explain the configuration while waiting. The recording must include the new trigger and its successful completion. Do not describe an old green run as the new run.

After the new run is green:

> The new pipeline has completed successfully. Its tests, build checks and security gates passed, and both images were published. The promotion job confirmed that Argo CD applied the expected image version and that both deployments completed their rollouts.

Open the backend and frontend package pages and show this run's full SHA tag. Then show the bot's promotion commit or `helm/hireflow/values-prod.yaml` on GitHub:

> These images use the source commit SHA. The promotion commit updates the deployment configuration in Git. Its own Git commit is different from the application's source SHA, which is expected: one identifies the GitOps configuration change and the other identifies the built application.

If the run fails, inspect and resolve the failure before recording the final successful walkthrough. Do not claim a failed or skipped stage passed.

## E. Terraform and AWS Console

Show `terraform/variables.tf`, `vpc.tf` and `eks.tf`:

> Terraform variables define deployment settings such as region, CIDRs and worker capacity. These resources define the VPC, routing, EKS cluster and worker node group. Infrastructure changes go through a plan before application.

Run in the main terminal:

```powershell
$env:AWS_PROFILE = 'hireflow-terraform'
terraform -chdir=terraform fmt -check
terraform -chdir=terraform validate
terraform -chdir=terraform plan -no-color
```

After successful validation and `No changes`:

> Terraform validation passed. The current plan reports no changes because the AWS infrastructure is already provisioned and matches the configuration. This is a drift check; it is not the initial creation plan.

Optionally open the archived plan screenshot in `evidence/terraform-original-plan-archived.png`:

> This is a labelled display of the recovered original provisioning output from October seventeenth. It planned twenty-six resources. The transcript and recovery provenance are saved with the evidence. The initial worker instance type was subsequently corrected, and today's plan verifies the current configuration.

Switch to AWS Console in Mumbai. Show VPC, subnets, cluster and node group:

> The Console confirms the Terraform-managed resources exist in Mumbai. Here is the HireFlow VPC and its two public and two private subnets. The EKS cluster is Active. The HireFlow worker node group is Active and configured for two c7i-flex.large workers. This is AWS evidence for the infrastructure defined in the repository.

Do not run apply or destroy for this presentation.

## F. Argo CD and GitOps

Switch back to the main terminal:

```powershell
$env:AWS_PROFILE = 'hireflow-admin'
kubectl get application hireflow -n argocd -o wide
kubectl get deployment backend frontend -n hireflow -o wide
Write-Output "Expected application source SHA: $demoSha"
```

When the output shows Synced/Healthy and both images end in `$demoSha`, say:

> Argo CD reports Synced and Healthy. Synced means the managed resources match the desired Git configuration. Healthy means Argo's health checks report the application resources healthy. Both backend and frontend use the same source SHA from the pipeline I just triggered, and both have two available replicas.

Open `argocd/hireflow-application.yaml`:

> This Application follows main and points to the HireFlow Helm chart and production values. Automated reconciliation and self-healing keep the managed resources aligned with Git. The CI promotion job changes image tags in Git; Argo CD applies the resulting Kubernetes manifests.

The kubectl Application output is sufficient to show the requested sync state; the Argo browser UI is optional.

## G. Kubernetes and live candidate demonstration

Run these separately so the output is readable:

```powershell
kubectl get nodes
kubectl get pods -n hireflow
kubectl get svc -n hireflow
kubectl get ingress -n hireflow
kubectl get pvc -n hireflow
kubectl get hpa -n hireflow
& "$env:TEMP\helm-v3.22.1\windows-amd64\helm.exe" list -n hireflow
```

Say while pointing at the corresponding output:

> The nodes are Ready. There are two backend Pods, two frontend Pods and a PostgreSQL Pod. The application Services are internal ClusterIP Services. Ingress-nginx supplies the public entry point. PostgreSQL's volume claim is Bound, so its data uses persistent storage. The autoscalers have CPU metrics; light traffic can leave them at their minimum of two replicas. Helm lists the original chart release; Argo CD now manages subsequent manifest reconciliation.

Show `helm/hireflow/templates/ingress.yaml` and the readiness section of `backend-deployment.yaml` briefly:

> The ingress template routes slash to the frontend and slash api to the backend. The backend readiness probe calls slash ready, which checks database connectivity.

Refresh the load balancer hostname in case it changed:

```powershell
$lb = kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
Write-Output "http://$lb"
```

Open that URL in the browser. Use Add Candidate with:

- Name: Demo Candidate
- Email: demo.video@example.com
- Position: DevOps Engineer
- Department: Platform
- Status: applied
- Priority: medium

If this email already exists, use a different fictional example.com email. Say:

> This is the running application through the public Ingress. I will create a fictional candidate, change their stage and remove them. These actions use the live backend API and database.

Add the candidate, show the row and statistics, edit the stage to interview and priority to high, and save. Search for `Demo Candidate`, then delete the record and confirm:

> The new candidate appeared in the list, the update changed their stage, and deletion removed the demonstration record. The dashboard data comes from API responses rather than fixed candidate counts.

## H. Prometheus

Open `http://<the current load balancer hostname>/metrics`, or run:

```powershell
$metricsText = (Invoke-WebRequest "http://$lb/metrics" -UseBasicParsing).Content
$metricsText -split '\r?\n' | Select-String '^http_requests_total' | Select-Object -First 8
```

Then show http://localhost:9090/targets and locate `hireflow-backend`:

> The backend exposes Prometheus-formatted metrics. The hireflow-backend target is UP, which shows Prometheus can scrape it successfully. The target has a configured scrape interval, and these metrics feed the Grafana dashboard.

Do not present UP as proof of every application function; the CRUD and readiness checks provide separate evidence.

## I. Grafana

If you want additional traffic visible on the graphs, run this in the main terminal and explain what it does:

```powershell
1..60 | ForEach-Object {
    Invoke-WebRequest "http://$lb/health" -UseBasicParsing | Out-Null
    Start-Sleep -Milliseconds 200
}
```

> I am sending sixty health requests to generate a small amount of demonstration traffic. This demonstrates request metrics; it is not a stress test or proof that the autoscaler has scaled.

Open http://localhost:3001, select the HireFlow dashboard, use a recent time range and refresh after a scrape interval. Point to populated panels:

> Grafana queries Prometheus for these panels. HTTP Requests per second shows the incoming request rate. The ninety-fifth percentile latency describes a response-time threshold below which approximately ninety-five percent of observed requests fall. The error panel shows the rate of server errors. Zero errors is a valid value; the panel should still contain data rather than show No data. These panels help monitor the deployed application after delivery.

Read the values actually visible if you mention numbers. If panels show No data, check the time range, target health and refresh before continuing.

## J. Closing and saving

> This completes the HireFlow walkthrough, from application code through automated tests, image scanning and publication, infrastructure, GitOps deployment, Kubernetes and monitoring. The project demonstrates the delivery path for a working recruitment application. Improvements for production would include authentication, TLS, database backups and stronger database availability. I will preserve the live stack for evaluation and perform a verified teardown afterward to avoid continuing AWS costs. Thank you.

Stop the recorder. Save as:

`C:\Users\jagri\Documents\DevOps_Project\demo\HireFlow_Walkthrough.mp4`

Replay the beginning, the new pipeline completion and the monitoring section. Confirm your voice is audible, the text is readable, all required sections are present in order, and no credentials appear. After recording, stop both monitoring port-forwards with Ctrl+C. The MP4 still needs to be uploaded to the repository or a release asset; saving it locally does not complete submission. Ask the project agent to attach the finished recording and update its link before submitting the course form. Teardown remains after evaluation and requires an explicit decision.

## Sources

- Required order: https://github.com/Nency-Ravaliya/devsecops-python/blob/main/SUBMISSION.md
- Grading criteria: https://github.com/Nency-Ravaliya/devsecops-python/blob/main/GRADING.md
- Windows recording controls: https://support.microsoft.com/en-us/windows/apps/use-snipping-tool-to-capture-screenshots
- Microphone support: https://www.microsoft.com/en-us/windows/learning-center/how-to-use-snipping-tool-on-windows-screenshots-shortcuts-and-screen-recordings
