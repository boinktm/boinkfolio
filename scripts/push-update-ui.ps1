Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pushScript = Join-Path $scriptDir 'push-update.ps1'

if (-not (Test-Path $pushScript)) {
  [System.Windows.Forms.MessageBox]::Show(
    "Could not find push script at:`n$pushScript",
    'Push Update',
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Error
  ) | Out-Null
  exit 1
}

$repoRoot = Resolve-Path (Join-Path $scriptDir '..')

$form = New-Object System.Windows.Forms.Form
$form.Text = 'Boinkfolio Push Update'
$form.Size = New-Object System.Drawing.Size(520, 250)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false

$labelMessage = New-Object System.Windows.Forms.Label
$labelMessage.Text = 'Commit message (optional):'
$labelMessage.AutoSize = $true
$labelMessage.Location = New-Object System.Drawing.Point(20, 20)

$textMessage = New-Object System.Windows.Forms.TextBox
$textMessage.Location = New-Object System.Drawing.Point(20, 45)
$textMessage.Size = New-Object System.Drawing.Size(465, 25)

$checkDryRun = New-Object System.Windows.Forms.CheckBox
$checkDryRun.Text = 'Dry run only (no Git changes)'
$checkDryRun.AutoSize = $true
$checkDryRun.Location = New-Object System.Drawing.Point(20, 85)

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = 'Ready'
$statusLabel.AutoSize = $true
$statusLabel.Location = New-Object System.Drawing.Point(20, 170)

$buttonPush = New-Object System.Windows.Forms.Button
$buttonPush.Text = 'Push Update'
$buttonPush.Size = New-Object System.Drawing.Size(120, 34)
$buttonPush.Location = New-Object System.Drawing.Point(20, 120)

$buttonClose = New-Object System.Windows.Forms.Button
$buttonClose.Text = 'Close'
$buttonClose.Size = New-Object System.Drawing.Size(90, 34)
$buttonClose.Location = New-Object System.Drawing.Point(150, 120)

$buttonClose.Add_Click({
  $form.Close()
})

$buttonPush.Add_Click({
  $buttonPush.Enabled = $false
  $statusLabel.Text = 'Running push script...'

  try {
    Push-Location $repoRoot

    $parameters = @{}
    if ([string]::IsNullOrWhiteSpace($textMessage.Text)) {
      $parameters['Message'] = "Update site $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    } else {
      $parameters['Message'] = $textMessage.Text.Trim()
    }
    if ($checkDryRun.Checked) {
      $parameters['DryRun'] = $true
    }

    & $pushScript @parameters

    if ($checkDryRun.Checked) {
      $statusLabel.Text = 'Dry run complete.'
      $resultMessage = 'Dry run complete. No Git changes were made.'
    } else {
      $statusLabel.Text = 'Update pushed successfully.'
      $resultMessage = 'Update pushed successfully.'
    }

    [System.Windows.Forms.MessageBox]::Show(
      $resultMessage,
      'Push Update',
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Information
    ) | Out-Null
  } catch {
    $statusLabel.Text = 'Push failed.'
    [System.Windows.Forms.MessageBox]::Show(
      "Push failed:`n$($_.Exception.Message)",
      'Push Update',
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
  } finally {
    Pop-Location
    $buttonPush.Enabled = $true
  }
})

$form.Controls.Add($labelMessage)
$form.Controls.Add($textMessage)
$form.Controls.Add($checkDryRun)
$form.Controls.Add($buttonPush)
$form.Controls.Add($buttonClose)
$form.Controls.Add($statusLabel)

[void]$form.ShowDialog()