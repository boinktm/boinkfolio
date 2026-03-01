param(
  [switch]$NoDesktopShortcut
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = (Resolve-Path (Join-Path $scriptDir '..')).Path
$inputScript = Join-Path $scriptDir 'content-manager.ps1'
$outputDir = Join-Path $projectRoot 'desktop-app'
$outputExe = Join-Path $outputDir 'BoinkfolioContentManager.exe'

if (-not (Test-Path -LiteralPath $inputScript)) {
  throw "Could not find content manager script: $inputScript"
}

if (-not (Test-Path -LiteralPath $outputDir)) {
  [void](New-Item -Path $outputDir -ItemType Directory -Force)
}

if (-not (Get-Command Invoke-ps2exe -ErrorAction SilentlyContinue)) {
  Write-Host 'Installing ps2exe module for current user...'
  if (-not (Get-PSRepository -Name 'PSGallery' -ErrorAction SilentlyContinue)) {
    throw 'PSGallery repository is unavailable. Please enable internet access and try again.'
  }

  if (-not (Get-PackageProvider -Name NuGet -ErrorAction SilentlyContinue)) {
    Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Force -Scope CurrentUser
  }

  Set-PSRepository -Name PSGallery -InstallationPolicy Trusted
  Install-Module -Name ps2exe -Scope CurrentUser -Force -AllowClobber -Confirm:$false
}

Import-Module ps2exe -Force

Invoke-ps2exe `
  -InputFile $inputScript `
  -OutputFile $outputExe `
  -NoConsole `
  -Title 'Boinkfolio Content Manager' `
  -Description 'Create and edit Boinkfolio markdown content.' `
  -Company 'Boinkfolio' `
  -Product 'Boinkfolio Content Manager' `
  -Version '1.0.0.0'

if (-not (Test-Path -LiteralPath $outputExe)) {
  throw 'EXE build completed but output file was not found.'
}

if (-not $NoDesktopShortcut) {
  $desktopPath = [Environment]::GetFolderPath('Desktop')
  $shortcutPath = Join-Path $desktopPath 'Boinkfolio Content Manager.lnk'

  $wshShell = New-Object -ComObject WScript.Shell
  $shortcut = $wshShell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = $outputExe
  $shortcut.WorkingDirectory = $projectRoot
  $shortcut.Description = 'Launch Boinkfolio Content Manager'
  $shortcut.Save()

  Write-Host "Desktop shortcut created: $shortcutPath"
}

Write-Host "EXE created: $outputExe"
