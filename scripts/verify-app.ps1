param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl
)

$ErrorActionPreference = 'Stop'
$BaseUrl = $BaseUrl.TrimEnd('/')
$candidateId = $null
function Assert-Check([bool]$Condition, [string]$Message) {
  if (-not $Condition) { throw $Message }
  Write-Output "PASS: $Message"
}

Assert-Check ((Invoke-WebRequest "$BaseUrl/" -UseBasicParsing).StatusCode -eq 200) 'Frontend responds with HTTP 200'
Assert-Check ((Invoke-RestMethod "$BaseUrl/health").status -eq 'healthy') 'Backend health is healthy'
Assert-Check ((Invoke-RestMethod "$BaseUrl/ready").database -eq 'connected') 'Readiness verifies the database'
Assert-Check ((Invoke-WebRequest "$BaseUrl/metrics" -UseBasicParsing).Content.Contains('http_requests_total')) 'Prometheus request metrics are exposed'

try {
  $payload = @{
    name = 'Audit Smoke Candidate'
    email = "audit-$([guid]::NewGuid().ToString('N'))@example.com"
    position = 'DevOps Engineer'
    department = 'Platform'
    status = 'applied'
    priority = 'medium'
  } | ConvertTo-Json
  $created = Invoke-RestMethod "$BaseUrl/api/candidates/" -Method Post -ContentType 'application/json' -Body $payload
  $candidateId = $created.id
  Assert-Check ($null -ne $candidateId) 'Create candidate returns an ID'
  $read = Invoke-RestMethod "$BaseUrl/api/candidates/$candidateId"
  Assert-Check ($read.email -eq $created.email) 'Read returns the created candidate'
  $updated = Invoke-RestMethod "$BaseUrl/api/candidates/$candidateId" -Method Put -ContentType 'application/json' -Body '{"status":"interview","priority":"high"}'
  Assert-Check ($updated.status -eq 'interview' -and $updated.priority -eq 'high') 'Update persists stage and priority'
  $filtered = @(Invoke-RestMethod "$BaseUrl/api/candidates/?status=interview")
  Assert-Check ($candidateId -in $filtered.id) 'Status filter includes the updated candidate'
  $stats = Invoke-RestMethod "$BaseUrl/api/candidates/stats"
  Assert-Check ($stats.interview -ge 1 -and $stats.high_priority -ge 1) 'Statistics reflect the test candidate'
}
finally {
  if ($null -ne $candidateId) {
    Invoke-RestMethod "$BaseUrl/api/candidates/$candidateId" -Method Delete | Out-Null
    Write-Output "PASS: Deleted synthetic candidate $candidateId"
  }
}
try {
  Invoke-RestMethod "$BaseUrl/api/candidates/$candidateId" | Out-Null
  throw 'Deleted candidate is still readable'
}
catch {
  if ([int]$_.Exception.Response.StatusCode -ne 404) { throw }
  Write-Output 'PASS: Deleted candidate returns HTTP 404'
}
