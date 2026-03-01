param(
  [string]$Message,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Invoke-GitCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,

    [Parameter(Mandatory = $true)]
    [string]$DisplayText
  )

  if ($DryRun) {
    Write-Host "[dry-run] git $DisplayText"
    return
  }

  $stderrPath = [System.IO.Path]::GetTempFileName()
  try {
    $stdout = & git @Arguments 2> $stderrPath
    $exitCode = $LASTEXITCODE
    $stderr = if (Test-Path -LiteralPath $stderrPath) {
      (Get-Content -LiteralPath $stderrPath -Raw)
    } else {
      ''
    }

    if (-not [string]::IsNullOrWhiteSpace($stdout)) {
      $stdoutText = [string]$stdout
      if (-not [string]::IsNullOrWhiteSpace($stdoutText)) {
        Write-Host $stdoutText.TrimEnd()
      }
    }

    if (-not [string]::IsNullOrWhiteSpace($stderr)) {
      $stderrText = $stderr.Trim()
      if ($stderrText -match 'LF will be replaced by CRLF') {
        Write-Host "Git line-ending note: $stderrText"
      } else {
        Write-Host $stderrText
      }
    }

    if ($exitCode -ne 0) {
      throw "git $DisplayText failed (exit code $exitCode)."
    }
  } finally {
    if (Test-Path -LiteralPath $stderrPath) {
      Remove-Item -LiteralPath $stderrPath -Force -ErrorAction SilentlyContinue
    }
  }
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

Invoke-GitCommand -Arguments @('add', '-A') -DisplayText 'add -A'
Invoke-GitCommand -Arguments @('commit', '-m', $Message) -DisplayText ("commit -m `"{0}`"" -f $Message)
Invoke-GitCommand -Arguments @('push') -DisplayText 'push'

if ($DryRun) {
  Write-Host 'Dry run complete. No Git changes were made.'
} else {
  Write-Host 'Update pushed successfully.'
}