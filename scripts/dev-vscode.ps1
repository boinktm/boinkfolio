$ErrorActionPreference = 'Stop'

$workspaceRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$openedInSimpleBrowser = $false

Push-Location $workspaceRoot.Path
try {
  # Prevent inherited debug sessions from forcing inspector attach on nested npm/node runs.
  $env:NODE_OPTIONS = ''
  $env:VSCODE_INSPECTOR_OPTIONS = ''

  # Clear stale boinkfolio Astro dev servers so launch stays on the expected fixed port.
  Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object {
      $_.CommandLine -match 'boinkfolio' -and (
        $_.CommandLine -match 'astro\.mjs"?\s+dev' -or
        $_.CommandLine -match 'run\s+dev\s+--'
      )
    } |
    ForEach-Object {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }

  # Use cmd redirection so stderr lines do not become PowerShell NativeCommandError records.
  cmd.exe /d /c "npm run dev -- --host 127.0.0.1 --port 4321 --strictPort 2>&1" | ForEach-Object {
    $line = "$_"
    Write-Host $line

    # Strip ANSI escape sequences and non-printable control chars before parsing URLs.
    $cleanLine = $line -replace "`e\[[0-9;?]*[ -/]*[@-~]", ''
    $cleanLine = $cleanLine -replace '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', ''

    if (-not $openedInSimpleBrowser -and $cleanLine -match '(https?://127\.0\.0\.1:\d+/[^\s]*)') {
      $url = $matches[1].Trim()
      $url = $url -replace '\[[0-9;]*m', ''
      $url = $url -replace '[^A-Za-z0-9:/?&=%._#\-~+]', ''
      $url = ($url -split '\[')[0]
      $url = $url.Trim()
      $payload = @($url) | ConvertTo-Json -Compress
      $encodedPayload = [System.Uri]::EscapeDataString($payload)
      $commandUri = "vscode://command/workbench.action.browser.open?$encodedPayload"

      Write-Host "Launching VS Code browser: $url"

      try {
        Start-Process $commandUri | Out-Null
        $openedInSimpleBrowser = $true
      }
      catch {
        Write-Host "Failed to launch VS Code browser command URI: $($_.Exception.Message)"
      }
    }
  }

  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
