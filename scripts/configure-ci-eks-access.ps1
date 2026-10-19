param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^arn:aws:iam::[0-9]{12}:role/[A-Za-z0-9+=,.@_/-]+$')]
  [string]$RoleArn
)

$ErrorActionPreference = 'Stop'

# Preserve EKS's existing worker-node mapping while adding the CI role.
$configMap = kubectl get configmap aws-auth -n kube-system -o json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $configMap) {
  throw 'Could not read the EKS aws-auth ConfigMap.'
}

$mapRoles = [string]$configMap.data.mapRoles
if ($mapRoles.Contains("rolearn: $RoleArn")) {
  Write-Output 'GitHub Actions role is already mapped in aws-auth.'
  exit 0
}

$newEntry = @"
- rolearn: $RoleArn
  username: github-actions-hireflow
  groups:
  - hireflow:ci-deploy
"@
$updated = $mapRoles.TrimEnd() + "`n" + $newEntry.Trim() + "`n"
$patch = @{ data = @{ mapRoles = $updated } } | ConvertTo-Json -Depth 4 -Compress
$patchFile = [System.IO.Path]::GetTempFileName()
try {
  [System.IO.File]::WriteAllText($patchFile, $patch, [System.Text.UTF8Encoding]::new($false))
  kubectl patch configmap aws-auth -n kube-system --type merge --patch-file $patchFile
  if ($LASTEXITCODE -ne 0) {
    throw 'Could not update the EKS aws-auth ConfigMap.'
  }
}
finally {
  Remove-Item -LiteralPath $patchFile -ErrorAction SilentlyContinue
}
Write-Output 'Mapped the GitHub Actions role to hireflow:ci-deploy.'
