param(
  [string]$Message,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Invoke-GitCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$CommandText
  )

  if ($DryRun) {
    Write-Host "[dry-run] git $CommandText"
    return
  }

  Invoke-Expression "git $CommandText"
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw 'Git is not installed or not available in PATH.'
}

$inRepo = git rev-parse --is-inside-work-tree 2>$null
if ($LASTEXITCODE -ne 0 -or $inRepo -ne 'true') {
  throw 'Current directory is not a Git repository.'
}

$status = git status --porcelain
if (-not $status) {
  Write-Host 'No changes detected. Nothing to push.'
  exit 0
}

if ([string]::IsNullOrWhiteSpace($Message) -and -not $DryRun) {
  $defaultMessage = "Update site $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
  $enteredMessage = Read-Host "Commit message (leave blank for default: '$defaultMessage')"

  if ([string]::IsNullOrWhiteSpace($enteredMessage)) {
    $Message = $defaultMessage
  } else {
    $Message = $enteredMessage.Trim()
  }
}

if ([string]::IsNullOrWhiteSpace($Message)) {
  $Message = "Update site $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

Invoke-GitCommand -CommandText 'add -A'
Invoke-GitCommand -CommandText ("commit -m `"{0}`"" -f $Message)
Invoke-GitCommand -CommandText 'push'

if ($DryRun) {
  Write-Host 'Dry run complete. No Git changes were made.'
} else {
  Write-Host 'Update pushed successfully.'
}