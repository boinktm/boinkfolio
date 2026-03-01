Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::EnableVisualStyles()

function Escape-YamlDouble {
  param([string]$Value)
  if ($null -eq $Value) { return '' }
  return ($Value -replace '"', '\"').Trim()
}

function Get-ListValues {
  param([string]$Raw)

  if ([string]::IsNullOrWhiteSpace($Raw)) {
    return @()
  }

  return ($Raw -split "`r?`n|," |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ -ne '' })
}

function ConvertTo-Slug {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return ''
  }

  $slug = $Value.ToLowerInvariant().Trim()
  $slug = [regex]::Replace($slug, '[^a-z0-9\s-]', '')
  $slug = [regex]::Replace($slug, '\s+', '-')
  $slug = [regex]::Replace($slug, '-+', '-')
  return $slug.Trim('-')
}

function Build-ArrayYaml {
  param(
    [string]$Name,
    [string[]]$Values
  )

  if ($null -eq $Values -or $Values.Count -eq 0) {
    return "${Name}: []"
  }

  $lines = @("${Name}:")
  foreach ($value in $Values) {
    $lines += ('  - "{0}"' -f (Escape-YamlDouble $value))
  }

  return ($lines -join "`n")
}

function Ensure-ContentDirectory {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    [void](New-Item -ItemType Directory -Path $Path -Force)
  }
}

function Unquote-YamlValue {
  param([string]$Value)

  if ($null -eq $Value) { return '' }
  $trimmed = $Value.Trim()
  if ($trimmed.Length -ge 2) {
    if (($trimmed.StartsWith('"') -and $trimmed.EndsWith('"')) -or ($trimmed.StartsWith("'") -and $trimmed.EndsWith("'"))) {
      $trimmed = $trimmed.Substring(1, $trimmed.Length - 2)
    }
  }

  return ($trimmed -replace '\\"', '"')
}

function Parse-MarkdownContentFile {
  param([string]$FilePath)

  if (-not (Test-Path -LiteralPath $FilePath)) {
    throw "File not found: $FilePath"
  }

  $raw = Get-Content -LiteralPath $FilePath -Raw -Encoding UTF8
  $match = [regex]::Match($raw, '(?s)^---\r?\n(.*?)\r?\n---\r?\n?(.*)$')
  if (-not $match.Success) {
    throw 'File does not contain valid frontmatter block.'
  }

  $frontText = $match.Groups[1].Value
  $body = $match.Groups[2].Value
  $map = @{}

  $lines = $frontText -split "`r?`n"
  $index = 0
  while ($index -lt $lines.Count) {
    $line = $lines[$index]
    if ([string]::IsNullOrWhiteSpace($line)) {
      $index += 1
      continue
    }

    $kv = [regex]::Match($line, '^([A-Za-z0-9_]+):\s*(.*)$')
    if (-not $kv.Success) {
      $index += 1
      continue
    }

    $key = $kv.Groups[1].Value
    $value = $kv.Groups[2].Value

    if ($value -eq '') {
      $arr = @()
      $index += 1
      while ($index -lt $lines.Count) {
        $itemMatch = [regex]::Match($lines[$index], '^\s*-\s*(.*)$')
        if (-not $itemMatch.Success) {
          break
        }
        $arr += (Unquote-YamlValue $itemMatch.Groups[1].Value)
        $index += 1
      }
      $map[$key] = $arr
      continue
    }

    $map[$key] = Unquote-YamlValue $value
    $index += 1
  }

  return @{
    Frontmatter = $map
    Body = $body
  }
}

function Join-ListText {
  param([object]$Value)

  if ($null -eq $Value) { return '' }
  if ($Value -is [System.Array]) {
    return ($Value -join [Environment]::NewLine)
  }

  return [string]$Value
}

function Get-FrontmatterValue {
  param(
    [hashtable]$Frontmatter,
    [string]$Key,
    [string]$Default = ''
  )

  if ($null -ne $Frontmatter -and $Frontmatter.ContainsKey($Key) -and $null -ne $Frontmatter[$Key]) {
    return [string]$Frontmatter[$Key]
  }

  return $Default
}

function Get-FrontmatterBool {
  param(
    [hashtable]$Frontmatter,
    [string]$Key,
    [bool]$Default = $false
  )

  $defaultText = if ($Default) { 'true' } else { 'false' }
  return (Get-FrontmatterValue -Frontmatter $Frontmatter -Key $Key -Default $defaultText).ToLowerInvariant() -eq 'true'
}

function Format-MarkdownContent {
  param([string]$InputText)

  if ($null -eq $InputText) {
    return ''
  }

  $normalized = $InputText -replace "`r`n", "`n"
  $normalized = $normalized -replace "`r", "`n"

  $lines = $normalized -split "`n"
  $formattedLines = New-Object System.Collections.Generic.List[string]

  foreach ($line in $lines) {
    $trimmedRight = $line.TrimEnd()

    if ($trimmedRight -match '^(#{1,6})(\S.*)$') {
      $trimmedRight = "$($matches[1]) $($matches[2])"
    }

    if ($trimmedRight -match '^\s*[\*\+]\s+') {
      $trimmedRight = $trimmedRight -replace '^(\s*)[\*\+]\s+', '$1- '
    }

    if ($trimmedRight -match '^\s*\d+\.\S') {
      $trimmedRight = $trimmedRight -replace '^(\s*\d+\.)(\S)', '$1 $2'
    }

    $formattedLines.Add($trimmedRight) | Out-Null
  }

  $result = ($formattedLines -join "`n")
  $result = [regex]::Replace($result, "`n{3,}", "`n`n")

  if (-not [string]::IsNullOrWhiteSpace($result) -and -not $result.EndsWith("`n")) {
    $result += "`n"
  }

  return $result
}

function Get-GitAheadCount {
  param([string]$RepoPath)

  if ([string]::IsNullOrWhiteSpace($RepoPath) -or -not (Test-Path -LiteralPath $RepoPath)) {
    return -1
  }

  $locationPushed = $false
  try {
    Push-Location $RepoPath
    $locationPushed = $true

    [void](& git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null)
    if ($LASTEXITCODE -ne 0) {
      return -1
    }

    $counts = & git rev-list --left-right --count HEAD...@{u} 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace([string]$counts)) {
      return -1
    }

    $parts = ([string]$counts).Trim() -split '\s+'
    if ($parts.Count -lt 1) {
      return -1
    }

    return [int]$parts[0]
  } catch {
    return -1
  } finally {
    if ($locationPushed) {
      Pop-Location
    }
  }
}

function Write-ContentFileDirect {
  param(
    [string]$FilePath,
    [string[]]$FrontmatterLines,
    [string]$Body
  )

  $content = @("---")
  $content += $FrontmatterLines
  $content += "---"
  $content += ""
  $bodyText = if ($null -eq $Body) { '' } else { $Body }
  $content += $bodyText

  [System.IO.File]::WriteAllText($FilePath, ($content -join "`n"), [System.Text.UTF8Encoding]::new($false))
  return $FilePath
}

function Write-ContentFile {
  param(
    [string]$Directory,
    [string]$Slug,
    [string[]]$FrontmatterLines,
    [string]$Body
  )

  Ensure-ContentDirectory -Path $Directory

  $filePath = Join-Path $Directory "$Slug.md"
  if (Test-Path -LiteralPath $filePath) {
    $overwrite = [System.Windows.Forms.MessageBox]::Show(
      "The file already exists:`n$filePath`n`nOverwrite it?",
      'File Exists',
      [System.Windows.Forms.MessageBoxButtons]::YesNo,
      [System.Windows.Forms.MessageBoxIcon]::Question
    )

    if ($overwrite -ne [System.Windows.Forms.DialogResult]::Yes) {
      return $null
    }
  }

  $content = @("---")
  $content += $FrontmatterLines
  $content += "---"
  $content += ""
  $bodyText = if ($null -eq $Body) { '' } else { $Body }
  $content += $bodyText

  [System.IO.File]::WriteAllText($filePath, ($content -join "`n"), [System.Text.UTF8Encoding]::new($false))
  return $filePath
}

function Show-Error {
  param([string]$Message)
  [void][System.Windows.Forms.MessageBox]::Show(
    $Message,
    'Missing Required Fields',
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Warning
  )
}

function Add-FieldRow {
  param(
    [object]$Layout,
    [string]$Label,
    [System.Windows.Forms.Control]$Control,
    [int]$Height = 30
  )

  if ($Layout -is [System.Array]) {
    $Layout = $Layout | Where-Object { $_ -is [System.Windows.Forms.TableLayoutPanel] } | Select-Object -First 1
  }

  if (-not ($Layout -is [System.Windows.Forms.TableLayoutPanel])) {
    throw 'Add-FieldRow expected a TableLayoutPanel layout target.'
  }

  $rowIndex = $Layout.RowCount
  $Layout.RowCount += 1
  [void]$Layout.RowStyles.Add([System.Windows.Forms.RowStyle]::new([System.Windows.Forms.SizeType]::Absolute, $Height))

  $labelControl = [System.Windows.Forms.Label]::new()
  $labelControl.Text = $Label
  $labelControl.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
  $labelControl.Dock = [System.Windows.Forms.DockStyle]::Fill
  $labelControl.Margin = [System.Windows.Forms.Padding]::new(0, 5, 10, 5)

  $Control.Dock = [System.Windows.Forms.DockStyle]::Fill
  $Control.Margin = [System.Windows.Forms.Padding]::new(0, 3, 0, 3)

  $Layout.Controls.Add($labelControl, 0, $rowIndex)
  $Layout.Controls.Add($Control, 1, $rowIndex)
}

function New-TextBoxField {
  param(
    [string]$Default = '',
    [bool]$MultiLine = $false
  )

  $tb = [System.Windows.Forms.TextBox]::new()
  $tb.Text = $Default
  if ($MultiLine) {
    $tb.Multiline = $true
    $tb.ScrollBars = [System.Windows.Forms.ScrollBars]::Vertical
  }
  return $tb
}

function New-CheckBoxField {
  param([bool]$Default = $false)

  $cb = [System.Windows.Forms.CheckBox]::new()
  $cb.Checked = $Default
  $cb.Text = 'Enabled'
  return $cb
}

function Get-ExecutableBaseDirectory {
  $candidates = @()

  if (-not [string]::IsNullOrWhiteSpace($PSScriptRoot)) {
    $candidates += $PSScriptRoot
  }

  if (-not [string]::IsNullOrWhiteSpace($PSCommandPath)) {
    $candidates += (Split-Path -Parent $PSCommandPath)
  }

  $invocationPath = $MyInvocation.MyCommand.Path
  if (-not [string]::IsNullOrWhiteSpace($invocationPath)) {
    $candidates += (Split-Path -Parent $invocationPath)
  }

  $appBase = [System.AppDomain]::CurrentDomain.BaseDirectory
  if (-not [string]::IsNullOrWhiteSpace($appBase)) {
    $candidates += $appBase
  }

  $candidates += (Get-Location).Path

  foreach ($candidate in $candidates) {
    if (-not [string]::IsNullOrWhiteSpace([string]$candidate) -and (Test-Path -LiteralPath $candidate)) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }

  throw 'Unable to determine base directory for content manager.'
}

function Resolve-ProjectRoot {
  param([string]$BaseDirectory)

  if ([string]::IsNullOrWhiteSpace($BaseDirectory)) {
    throw 'Base directory is empty.'
  }

  $resolvedBase = (Resolve-Path -LiteralPath $BaseDirectory).Path

  $directContent = Join-Path $resolvedBase 'src\content'
  if (Test-Path -LiteralPath $directContent) {
    return $resolvedBase
  }

  $parent = Split-Path -Parent $resolvedBase
  if (-not [string]::IsNullOrWhiteSpace($parent)) {
    $parentContent = Join-Path $parent 'src\content'
    if (Test-Path -LiteralPath $parentContent) {
      return $parent
    }
  }

  return $resolvedBase
}

$baseDirectory = Get-ExecutableBaseDirectory
$projectRoot = Resolve-ProjectRoot -BaseDirectory $baseDirectory
$contentRoot = Join-Path $projectRoot 'src\content'

$pushScriptCandidateA = Join-Path $projectRoot 'scripts\push-update.ps1'
$pushScriptCandidateB = Join-Path $baseDirectory 'push-update.ps1'
$pushScriptPath = if (Test-Path -LiteralPath $pushScriptCandidateA) {
  $pushScriptCandidateA
} elseif (Test-Path -LiteralPath $pushScriptCandidateB) {
  $pushScriptCandidateB
} else {
  $pushScriptCandidateA
}

Ensure-ContentDirectory -Path $contentRoot
$lastSavedFilePath = $null
$editingFileByTab = @{
  Art = $null
  Assets = $null
  Mapping = $null
  Musings = $null
}

$form = [System.Windows.Forms.Form]::new()
$form.Text = 'Boinkfolio Content Manager'
$form.Size = [System.Drawing.Size]::new(980, 780)
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
$form.MinimumSize = [System.Drawing.Size]::new(900, 700)

$rootLayout = [System.Windows.Forms.TableLayoutPanel]::new()
$rootLayout.Dock = [System.Windows.Forms.DockStyle]::Fill
$rootLayout.ColumnCount = 1
$rootLayout.RowCount = 3
[void]$rootLayout.RowStyles.Add([System.Windows.Forms.RowStyle]::new([System.Windows.Forms.SizeType]::Absolute, 52))
[void]$rootLayout.RowStyles.Add([System.Windows.Forms.RowStyle]::new([System.Windows.Forms.SizeType]::Percent, 100))
[void]$rootLayout.RowStyles.Add([System.Windows.Forms.RowStyle]::new([System.Windows.Forms.SizeType]::Absolute, 68))
[void]$form.Controls.Add($rootLayout)

$header = [System.Windows.Forms.Label]::new()
$header.Text = 'Create new site content using tabbed forms. Required fields are validated before file creation.'
$header.Dock = [System.Windows.Forms.DockStyle]::Fill
$header.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$header.Padding = [System.Windows.Forms.Padding]::new(12, 0, 12, 0)
[void]$rootLayout.Controls.Add($header, 0, 0)

$tabs = [System.Windows.Forms.TabControl]::new()
$tabs.Dock = [System.Windows.Forms.DockStyle]::Fill
[void]$rootLayout.Controls.Add($tabs, 0, 1)

function New-TabLayout {
  param([string]$Title)

  $tab = [System.Windows.Forms.TabPage]::new($Title)
  $tab.Padding = [System.Windows.Forms.Padding]::new(10)

  $panel = [System.Windows.Forms.Panel]::new()
  $panel.Dock = [System.Windows.Forms.DockStyle]::Fill
  $panel.AutoScroll = $true

  $layout = [System.Windows.Forms.TableLayoutPanel]::new()
  $layout.Dock = [System.Windows.Forms.DockStyle]::Top
  $layout.AutoSize = $true
  $layout.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
  $layout.ColumnCount = 2
  [void]$layout.ColumnStyles.Add([System.Windows.Forms.ColumnStyle]::new([System.Windows.Forms.SizeType]::Absolute, 190))
  [void]$layout.ColumnStyles.Add([System.Windows.Forms.ColumnStyle]::new([System.Windows.Forms.SizeType]::Percent, 100))

  [void]$panel.Controls.Add($layout)
  [void]$tab.Controls.Add($panel)
  [void]$tabs.TabPages.Add($tab)

  return $layout
}

# Art tab
$artLayout = New-TabLayout -Title 'Art'
$artSlug = New-TextBoxField
$artTitle = New-TextBoxField
$artTagline = New-TextBoxField
$artThumbnail = New-TextBoxField
$artFullres = New-TextBoxField
$artImages = New-TextBoxField -MultiLine $true
$artMedium = New-TextBoxField
$artStatus = New-TextBoxField
$artDate = New-TextBoxField -Default (Get-Date -Format 'MMM yyyy')
$artSoftware = New-TextBoxField
$artExternalUrl = New-TextBoxField
$artTags = New-TextBoxField
$artFeatured = New-CheckBoxField
$artBody = New-TextBoxField -MultiLine $true

Add-FieldRow $artLayout 'Slug (optional)' $artSlug
Add-FieldRow $artLayout 'Title *' $artTitle
Add-FieldRow $artLayout 'Tagline *' $artTagline
Add-FieldRow $artLayout 'Thumbnail URL/Path *' $artThumbnail
Add-FieldRow $artLayout 'Fullres URL/Path (optional)' $artFullres
Add-FieldRow $artLayout 'Images (one per line)' $artImages 90
Add-FieldRow $artLayout 'Medium *' $artMedium
Add-FieldRow $artLayout 'Status *' $artStatus
Add-FieldRow $artLayout 'Date *' $artDate
Add-FieldRow $artLayout 'Software (comma/line)' $artSoftware
Add-FieldRow $artLayout 'External URL (optional)' $artExternalUrl
Add-FieldRow $artLayout 'Tags (comma/line)' $artTags
Add-FieldRow $artLayout 'Featured' $artFeatured
Add-FieldRow $artLayout 'Markdown Body' $artBody 180

# Assets tab
$assetsLayout = New-TabLayout -Title 'Assets'
$assetsSlug = New-TextBoxField
$assetsTitle = New-TextBoxField
$assetsSummary = New-TextBoxField
$assetsFilePath = New-TextBoxField
$assetsPreview = New-TextBoxField
$assetsCategory = New-TextBoxField
$assetsSourceType = New-TextBoxField
$assetsDate = New-TextBoxField -Default (Get-Date -Format 'MMM yyyy')
$assetsTags = New-TextBoxField
$assetsPublic = New-CheckBoxField
$assetsRelatedSlug = New-TextBoxField
$assetsBody = New-TextBoxField -MultiLine $true

Add-FieldRow $assetsLayout 'Slug (optional)' $assetsSlug
Add-FieldRow $assetsLayout 'Title *' $assetsTitle
Add-FieldRow $assetsLayout 'Summary *' $assetsSummary
Add-FieldRow $assetsLayout 'File Path/URL *' $assetsFilePath
Add-FieldRow $assetsLayout 'Preview Image (optional)' $assetsPreview
Add-FieldRow $assetsLayout 'Category *' $assetsCategory
Add-FieldRow $assetsLayout 'Source Type *' $assetsSourceType
Add-FieldRow $assetsLayout 'Date *' $assetsDate
Add-FieldRow $assetsLayout 'Tags (comma/line)' $assetsTags
Add-FieldRow $assetsLayout 'Public Asset' $assetsPublic
Add-FieldRow $assetsLayout 'Related Art Slug (optional)' $assetsRelatedSlug
Add-FieldRow $assetsLayout 'Markdown Body' $assetsBody 180

# Mapping tab
$mappingLayout = New-TabLayout -Title 'Mapping'
$mappingSlug = New-TextBoxField
$mappingTitle = New-TextBoxField
$mappingGame = New-TextBoxField
$mappingTagline = New-TextBoxField
$mappingThumb = New-TextBoxField
$mappingImages = New-TextBoxField -MultiLine $true
$mappingVideos = New-TextBoxField -MultiLine $true
$mappingWorkshop = New-TextBoxField
$mappingDate = New-TextBoxField -Default (Get-Date -Format 'MMM yyyy')
$mappingTags = New-TextBoxField
$mappingFeatured = New-CheckBoxField
$mappingBody = New-TextBoxField -MultiLine $true

Add-FieldRow $mappingLayout 'Slug (optional)' $mappingSlug
Add-FieldRow $mappingLayout 'Title *' $mappingTitle
Add-FieldRow $mappingLayout 'Game *' $mappingGame
Add-FieldRow $mappingLayout 'Tagline *' $mappingTagline
Add-FieldRow $mappingLayout 'Thumbnail URL/Path *' $mappingThumb
Add-FieldRow $mappingLayout 'Images (one per line)' $mappingImages 90
Add-FieldRow $mappingLayout 'Video Links (one per line)' $mappingVideos 90
Add-FieldRow $mappingLayout 'Workshop URL (optional)' $mappingWorkshop
Add-FieldRow $mappingLayout 'Date *' $mappingDate
Add-FieldRow $mappingLayout 'Tags (comma/line)' $mappingTags
Add-FieldRow $mappingLayout 'Featured' $mappingFeatured
Add-FieldRow $mappingLayout 'Markdown Body' $mappingBody 200

# Musings tab
$musingsLayout = New-TabLayout -Title 'Musings'
$musingsSlug = New-TextBoxField
$musingsTitle = New-TextBoxField
$musingsExcerpt = New-TextBoxField
$musingsDate = New-TextBoxField -Default (Get-Date -Format 'MMM yyyy')
$musingsCategory = New-TextBoxField
$musingsFeatured = New-CheckBoxField
$musingsBody = New-TextBoxField -MultiLine $true

Add-FieldRow $musingsLayout 'Slug (optional)' $musingsSlug
Add-FieldRow $musingsLayout 'Title *' $musingsTitle
Add-FieldRow $musingsLayout 'Excerpt *' $musingsExcerpt
Add-FieldRow $musingsLayout 'Date *' $musingsDate
Add-FieldRow $musingsLayout 'Category *' $musingsCategory
Add-FieldRow $musingsLayout 'Featured' $musingsFeatured
Add-FieldRow $musingsLayout 'Markdown Body' $musingsBody 240

$actionsPanel = [System.Windows.Forms.FlowLayoutPanel]::new()
$actionsPanel.Dock = [System.Windows.Forms.DockStyle]::Fill
$actionsPanel.FlowDirection = [System.Windows.Forms.FlowDirection]::LeftToRight
$actionsPanel.Padding = [System.Windows.Forms.Padding]::new(10, 8, 10, 8)
$actionsPanel.WrapContents = $false
[void]$rootLayout.Controls.Add($actionsPanel, 0, 2)

$createBtn = [System.Windows.Forms.Button]::new()
$createBtn.Text = 'Create Markdown File'
$createBtn.Width = 170
$createBtn.Height = 36

$editModeCheck = [System.Windows.Forms.CheckBox]::new()
$editModeCheck.Text = 'Edit Existing Mode'
$editModeCheck.AutoSize = $true
$editModeCheck.Padding = [System.Windows.Forms.Padding]::new(8, 8, 8, 0)

$loadBtn = [System.Windows.Forms.Button]::new()
$loadBtn.Text = 'Load Existing File'
$loadBtn.Width = 150
$loadBtn.Height = 36

$clearBtn = [System.Windows.Forms.Button]::new()
$clearBtn.Text = 'Clear All Data'
$clearBtn.Width = 130
$clearBtn.Height = 36

$clearTabBtn = [System.Windows.Forms.Button]::new()
$clearTabBtn.Text = 'Clear Current Tab'
$clearTabBtn.Width = 140
$clearTabBtn.Height = 36

$formatBtn = [System.Windows.Forms.Button]::new()
$formatBtn.Text = 'Auto Format Markdown'
$formatBtn.Width = 170
$formatBtn.Height = 36

$formatOnSaveCheck = [System.Windows.Forms.CheckBox]::new()
$formatOnSaveCheck.Text = 'Auto Format on Save'
$formatOnSaveCheck.Checked = $true
$formatOnSaveCheck.AutoSize = $true
$formatOnSaveCheck.Padding = [System.Windows.Forms.Padding]::new(8, 8, 8, 0)

$pushBtn = [System.Windows.Forms.Button]::new()
$pushBtn.Text = 'Push to Git'
$pushBtn.Width = 120
$pushBtn.Height = 36
$pushBtn.Enabled = $true

$openBtn = [System.Windows.Forms.Button]::new()
$openBtn.Text = 'Open src/content Folder'
$openBtn.Width = 170
$openBtn.Height = 36

$statusLabel = [System.Windows.Forms.Label]::new()
$statusLabel.AutoSize = $true
$statusLabel.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$statusLabel.Padding = [System.Windows.Forms.Padding]::new(18, 10, 0, 0)
$statusLabel.MaximumSize = [System.Drawing.Size]::new(560, 50)

[void]$actionsPanel.Controls.Add($createBtn)
[void]$actionsPanel.Controls.Add($editModeCheck)
[void]$actionsPanel.Controls.Add($loadBtn)
[void]$actionsPanel.Controls.Add($clearTabBtn)
[void]$actionsPanel.Controls.Add($clearBtn)
[void]$actionsPanel.Controls.Add($formatBtn)
[void]$actionsPanel.Controls.Add($formatOnSaveCheck)
[void]$actionsPanel.Controls.Add($pushBtn)
[void]$actionsPanel.Controls.Add($openBtn)
[void]$actionsPanel.Controls.Add($statusLabel)

$editModeCheck.Add_CheckedChanged({
  if ($editModeCheck.Checked) {
    $createBtn.Text = 'Save Markdown Changes'
    $statusLabel.Text = 'Edit mode enabled. Load a file in the current tab.'
  } else {
    $createBtn.Text = 'Create Markdown File'
    $statusLabel.Text = 'Create mode enabled.'
  }
})

$loadBtn.Add_Click({
  $selectedTab = $tabs.SelectedTab.Text
  $subDir = switch ($selectedTab) {
    'Art' { 'art' }
    'Assets' { 'assets' }
    'Mapping' { 'mapping' }
    'Musings' { 'musings' }
  }

  $targetDir = Join-Path $contentRoot $subDir
  Ensure-ContentDirectory -Path $targetDir

  $dialog = [System.Windows.Forms.OpenFileDialog]::new()
  $dialog.Filter = 'Markdown files (*.md)|*.md'
  $dialog.InitialDirectory = $targetDir
  $dialog.Multiselect = $false

  if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
    return
  }

  try {
    $parsed = Parse-MarkdownContentFile -FilePath $dialog.FileName
    $fm = $parsed.Frontmatter

    switch ($selectedTab) {
      'Art' {
        $artSlug.Text = [System.IO.Path]::GetFileNameWithoutExtension($dialog.FileName)
        $artTitle.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'title'
        $artTagline.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'tagline'
        $artThumbnail.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'thumbnail'
        $artFullres.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'fullres'
        $artImages.Text = Join-ListText $fm['images']
        $artMedium.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'medium'
        $artStatus.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'status'
        $artDate.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'date'
        $artSoftware.Text = Join-ListText $fm['software']
        $artExternalUrl.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'externalUrl'
        $artTags.Text = Join-ListText $fm['tags']
        $artFeatured.Checked = Get-FrontmatterBool -Frontmatter $fm -Key 'featured'
        $artBody.Text = $parsed.Body
      }
      'Assets' {
        $assetsSlug.Text = [System.IO.Path]::GetFileNameWithoutExtension($dialog.FileName)
        $assetsTitle.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'title'
        $assetsSummary.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'summary'
        $assetsFilePath.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'filePath'
        $assetsPreview.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'previewImage'
        $assetsCategory.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'category'
        $assetsSourceType.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'sourceType'
        $assetsDate.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'date'
        $assetsTags.Text = Join-ListText $fm['tags']
        $assetsPublic.Checked = Get-FrontmatterBool -Frontmatter $fm -Key 'isPublic'
        $assetsRelatedSlug.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'relatedArtSlug'
        $assetsBody.Text = $parsed.Body
      }
      'Mapping' {
        $mappingSlug.Text = [System.IO.Path]::GetFileNameWithoutExtension($dialog.FileName)
        $mappingTitle.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'title'
        $mappingGame.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'game'
        $mappingTagline.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'tagline'
        $mappingThumb.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'thumbnail'
        $mappingImages.Text = Join-ListText $fm['images']
        $mappingVideos.Text = Join-ListText $fm['videos']
        $mappingWorkshop.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'workshopUrl'
        $mappingDate.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'date'
        $mappingTags.Text = Join-ListText $fm['tags']
        $mappingFeatured.Checked = Get-FrontmatterBool -Frontmatter $fm -Key 'featured'
        $mappingBody.Text = $parsed.Body
      }
      'Musings' {
        $musingsSlug.Text = [System.IO.Path]::GetFileNameWithoutExtension($dialog.FileName)
        $musingsTitle.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'title'
        $musingsExcerpt.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'excerpt'
        $musingsDate.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'date'
        $musingsCategory.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'category'
        $musingsFeatured.Checked = Get-FrontmatterBool -Frontmatter $fm -Key 'featured'
        $musingsBody.Text = $parsed.Body
      }
    }

    $editingFileByTab[$selectedTab] = $dialog.FileName
    $statusLabel.Text = "Loaded: $($dialog.FileName)"
  } catch {
    Show-Error "Unable to load file: $($_.Exception.Message)"
  }
})

$openBtn.Add_Click({
  [System.Diagnostics.Process]::Start('explorer.exe', $contentRoot) | Out-Null
})

$clearBtn.Add_Click({
  $confirm = [System.Windows.Forms.MessageBox]::Show(
    'Clear all data across all tabs? This cannot be undone.',
    'Clear All Data',
    [System.Windows.Forms.MessageBoxButtons]::YesNo,
    [System.Windows.Forms.MessageBoxIcon]::Warning
  )

  if ($confirm -ne [System.Windows.Forms.DialogResult]::Yes) {
    return
  }

  $defaultDate = Get-Date -Format 'MMM yyyy'

  $artSlug.Text = ''
  $artTitle.Text = ''
  $artTagline.Text = ''
  $artThumbnail.Text = ''
  $artFullres.Text = ''
  $artImages.Text = ''
  $artMedium.Text = ''
  $artStatus.Text = ''
  $artDate.Text = $defaultDate
  $artSoftware.Text = ''
  $artExternalUrl.Text = ''
  $artTags.Text = ''
  $artFeatured.Checked = $false
  $artBody.Text = ''

  $assetsSlug.Text = ''
  $assetsTitle.Text = ''
  $assetsSummary.Text = ''
  $assetsFilePath.Text = ''
  $assetsPreview.Text = ''
  $assetsCategory.Text = ''
  $assetsSourceType.Text = ''
  $assetsDate.Text = $defaultDate
  $assetsTags.Text = ''
  $assetsPublic.Checked = $false
  $assetsRelatedSlug.Text = ''
  $assetsBody.Text = ''

  $mappingSlug.Text = ''
  $mappingTitle.Text = ''
  $mappingGame.Text = ''
  $mappingTagline.Text = ''
  $mappingThumb.Text = ''
  $mappingImages.Text = ''
  $mappingVideos.Text = ''
  $mappingWorkshop.Text = ''
  $mappingDate.Text = $defaultDate
  $mappingTags.Text = ''
  $mappingFeatured.Checked = $false
  $mappingBody.Text = ''

  $musingsSlug.Text = ''
  $musingsTitle.Text = ''
  $musingsExcerpt.Text = ''
  $musingsDate.Text = $defaultDate
  $musingsCategory.Text = ''
  $musingsFeatured.Checked = $false
  $musingsBody.Text = ''

  $editingFileByTab['Art'] = $null
  $editingFileByTab['Assets'] = $null
  $editingFileByTab['Mapping'] = $null
  $editingFileByTab['Musings'] = $null
  $lastSavedFilePath = $null

  $statusLabel.Text = 'All form data cleared.'
})

$clearTabBtn.Add_Click({
  $selectedTab = $tabs.SelectedTab.Text
  $confirm = [System.Windows.Forms.MessageBox]::Show(
    "Clear all data in the '$selectedTab' tab?",
    'Clear Current Tab',
    [System.Windows.Forms.MessageBoxButtons]::YesNo,
    [System.Windows.Forms.MessageBoxIcon]::Warning
  )

  if ($confirm -ne [System.Windows.Forms.DialogResult]::Yes) {
    return
  }

  $defaultDate = Get-Date -Format 'MMM yyyy'

  switch ($selectedTab) {
    'Art' {
      $artSlug.Text = ''
      $artTitle.Text = ''
      $artTagline.Text = ''
      $artThumbnail.Text = ''
      $artFullres.Text = ''
      $artImages.Text = ''
      $artMedium.Text = ''
      $artStatus.Text = ''
      $artDate.Text = $defaultDate
      $artSoftware.Text = ''
      $artExternalUrl.Text = ''
      $artTags.Text = ''
      $artFeatured.Checked = $false
      $artBody.Text = ''
      $editingFileByTab['Art'] = $null
    }
    'Assets' {
      $assetsSlug.Text = ''
      $assetsTitle.Text = ''
      $assetsSummary.Text = ''
      $assetsFilePath.Text = ''
      $assetsPreview.Text = ''
      $assetsCategory.Text = ''
      $assetsSourceType.Text = ''
      $assetsDate.Text = $defaultDate
      $assetsTags.Text = ''
      $assetsPublic.Checked = $false
      $assetsRelatedSlug.Text = ''
      $assetsBody.Text = ''
      $editingFileByTab['Assets'] = $null
    }
    'Mapping' {
      $mappingSlug.Text = ''
      $mappingTitle.Text = ''
      $mappingGame.Text = ''
      $mappingTagline.Text = ''
      $mappingThumb.Text = ''
      $mappingImages.Text = ''
      $mappingVideos.Text = ''
      $mappingWorkshop.Text = ''
      $mappingDate.Text = $defaultDate
      $mappingTags.Text = ''
      $mappingFeatured.Checked = $false
      $mappingBody.Text = ''
      $editingFileByTab['Mapping'] = $null
    }
    'Musings' {
      $musingsSlug.Text = ''
      $musingsTitle.Text = ''
      $musingsExcerpt.Text = ''
      $musingsDate.Text = $defaultDate
      $musingsCategory.Text = ''
      $musingsFeatured.Checked = $false
      $musingsBody.Text = ''
      $editingFileByTab['Musings'] = $null
    }
  }

  $lastSavedFilePath = $null
  $statusLabel.Text = "Cleared tab: $selectedTab"
})

$formatBtn.Add_Click({
  $selectedTab = $tabs.SelectedTab.Text
  $targetBody = $null

  switch ($selectedTab) {
    'Art' { $targetBody = $artBody }
    'Assets' { $targetBody = $assetsBody }
    'Mapping' { $targetBody = $mappingBody }
    'Musings' { $targetBody = $musingsBody }
  }

  if ($null -eq $targetBody) {
    Show-Error 'Unable to determine markdown editor for current tab.'
    return
  }

  $targetBody.Text = Format-MarkdownContent $targetBody.Text
  $statusLabel.Text = "Markdown formatted for $selectedTab."
})

$pushBtn.Add_Click({
  if (-not (Test-Path -LiteralPath $pushScriptPath)) {
    Show-Error "Push script not found at: $pushScriptPath"
    return
  }

  $defaultMessage = if (-not [string]::IsNullOrWhiteSpace([string]$lastSavedFilePath)) {
    "Update content: $([System.IO.Path]::GetFileName($lastSavedFilePath))"
  } else {
    "Update site $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
  }

  $confirm = [System.Windows.Forms.MessageBox]::Show(
    "Run Git push now?`n`nCommit message:`n$defaultMessage",
    'Push to Git',
    [System.Windows.Forms.MessageBoxButtons]::YesNo,
    [System.Windows.Forms.MessageBoxIcon]::Question
  )

  if ($confirm -ne [System.Windows.Forms.DialogResult]::Yes) {
    return
  }

  $pushBtn.Enabled = $false
  $statusLabel.Text = 'Running Git push...'
  $locationPushed = $false
  try {
    Push-Location $projectRoot
    $locationPushed = $true
    & $pushScriptPath -Message $defaultMessage
    $statusLabel.Text = 'Git push completed successfully.'
    [void][System.Windows.Forms.MessageBox]::Show(
      'Git push completed successfully.',
      'Push to Git',
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Information
    )
  } catch {
    $aheadCount = Get-GitAheadCount -RepoPath $projectRoot
    if ($aheadCount -eq 0) {
      $statusLabel.Text = 'Git push completed with warning.'
      [void][System.Windows.Forms.MessageBox]::Show(
        "Git push appears to have completed, but returned a warning:`n$($_.Exception.Message)",
        'Push to Git',
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information
      )
    } else {
      $statusLabel.Text = 'Git push failed.'
      [void][System.Windows.Forms.MessageBox]::Show(
        "Git push failed:`n$($_.Exception.Message)",
        'Push to Git',
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
      )
    }
  } finally {
    if ($locationPushed) {
      Pop-Location
    }
    $pushBtn.Enabled = $true
  }
})

$createBtn.Add_Click({
  $selectedTab = $tabs.SelectedTab.Text
  $filePath = $null

  $saveExistingPath = $null
  if ($editModeCheck.Checked) {
    $saveExistingPath = $editingFileByTab[$selectedTab]
    if ([string]::IsNullOrWhiteSpace([string]$saveExistingPath)) {
      Show-Error 'Edit mode is enabled. Click "Load Existing File" for this tab first.'
      return
    }
  }

  switch ($selectedTab) {
    'Art' {
      $title = $artTitle.Text.Trim()
      $slug = if ($artSlug.Text.Trim()) { ConvertTo-Slug $artSlug.Text } else { ConvertTo-Slug $title }
      $tagline = $artTagline.Text.Trim()
      $thumbnail = $artThumbnail.Text.Trim().Replace('\\', '/')
      $medium = $artMedium.Text.Trim()
      $status = $artStatus.Text.Trim()
      $date = $artDate.Text.Trim()

      if ($title -eq '' -or $slug -eq '' -or $tagline -eq '' -or $thumbnail -eq '' -or $medium -eq '' -or $status -eq '' -or $date -eq '') {
        Show-Error 'Art requires: title, tagline, thumbnail, medium, status, and date.'
        return
      }

      $images = Get-ListValues $artImages.Text
      $software = Get-ListValues $artSoftware.Text
      $tags = Get-ListValues $artTags.Text

      $frontmatter = @(
        ('title: "{0}"' -f (Escape-YamlDouble $title)),
        ('tagline: "{0}"' -f (Escape-YamlDouble $tagline)),
        ('thumbnail: "{0}"' -f (Escape-YamlDouble $thumbnail))
      )

      if (-not [string]::IsNullOrWhiteSpace($artFullres.Text)) {
        $frontmatter += ('fullres: "{0}"' -f (Escape-YamlDouble ($artFullres.Text.Trim().Replace('\\', '/'))))
      }

      $frontmatter += Build-ArrayYaml -Name 'images' -Values $images
      $frontmatter += ('medium: "{0}"' -f (Escape-YamlDouble $medium))
      $frontmatter += ('status: "{0}"' -f (Escape-YamlDouble $status))
      $frontmatter += ('date: "{0}"' -f (Escape-YamlDouble $date))
      $frontmatter += Build-ArrayYaml -Name 'software' -Values $software

      if (-not [string]::IsNullOrWhiteSpace($artExternalUrl.Text)) {
        $frontmatter += ('externalUrl: "{0}"' -f (Escape-YamlDouble ($artExternalUrl.Text.Trim())))
      }

      $frontmatter += Build-ArrayYaml -Name 'tags' -Values $tags
      $frontmatter += "featured: $($artFeatured.Checked.ToString().ToLowerInvariant())"

      $artBodyText = if ($formatOnSaveCheck.Checked) { Format-MarkdownContent $artBody.Text } else { $artBody.Text }
      if ($formatOnSaveCheck.Checked) { $artBody.Text = $artBodyText }

      if ($editModeCheck.Checked) {
        $filePath = Write-ContentFileDirect -FilePath $saveExistingPath -FrontmatterLines $frontmatter -Body $artBodyText
      } else {
        $filePath = Write-ContentFile -Directory (Join-Path $contentRoot 'art') -Slug $slug -FrontmatterLines $frontmatter -Body $artBodyText
      }
    }
    'Assets' {
      $title = $assetsTitle.Text.Trim()
      $slug = if ($assetsSlug.Text.Trim()) { ConvertTo-Slug $assetsSlug.Text } else { ConvertTo-Slug $title }
      $summary = $assetsSummary.Text.Trim()
      $fileValue = $assetsFilePath.Text.Trim().Replace('\\', '/')
      $category = $assetsCategory.Text.Trim()
      $sourceType = $assetsSourceType.Text.Trim()
      $date = $assetsDate.Text.Trim()

      if ($title -eq '' -or $slug -eq '' -or $summary -eq '' -or $fileValue -eq '' -or $category -eq '' -or $sourceType -eq '' -or $date -eq '') {
        Show-Error 'Assets requires: title, summary, file path, category, source type, and date.'
        return
      }

      $tags = Get-ListValues $assetsTags.Text

      $frontmatter = @(
        ('title: "{0}"' -f (Escape-YamlDouble $title)),
        ('summary: "{0}"' -f (Escape-YamlDouble $summary)),
        ('filePath: "{0}"' -f (Escape-YamlDouble $fileValue))
      )

      if (-not [string]::IsNullOrWhiteSpace($assetsPreview.Text)) {
        $frontmatter += ('previewImage: "{0}"' -f (Escape-YamlDouble ($assetsPreview.Text.Trim().Replace('\\', '/'))))
      }

      $frontmatter += ('category: "{0}"' -f (Escape-YamlDouble $category))
      $frontmatter += ('sourceType: "{0}"' -f (Escape-YamlDouble $sourceType))
      $frontmatter += ('date: "{0}"' -f (Escape-YamlDouble $date))
      $frontmatter += Build-ArrayYaml -Name 'tags' -Values $tags
      $frontmatter += "isPublic: $($assetsPublic.Checked.ToString().ToLowerInvariant())"

      if (-not [string]::IsNullOrWhiteSpace($assetsRelatedSlug.Text)) {
        $frontmatter += ('relatedArtSlug: "{0}"' -f (Escape-YamlDouble ($assetsRelatedSlug.Text.Trim())))
      }

      $assetsBodyText = if ($formatOnSaveCheck.Checked) { Format-MarkdownContent $assetsBody.Text } else { $assetsBody.Text }
      if ($formatOnSaveCheck.Checked) { $assetsBody.Text = $assetsBodyText }

      if ($editModeCheck.Checked) {
        $filePath = Write-ContentFileDirect -FilePath $saveExistingPath -FrontmatterLines $frontmatter -Body $assetsBodyText
      } else {
        $filePath = Write-ContentFile -Directory (Join-Path $contentRoot 'assets') -Slug $slug -FrontmatterLines $frontmatter -Body $assetsBodyText
      }
    }
    'Mapping' {
      $title = $mappingTitle.Text.Trim()
      $slug = if ($mappingSlug.Text.Trim()) { ConvertTo-Slug $mappingSlug.Text } else { ConvertTo-Slug $title }
      $game = $mappingGame.Text.Trim()
      $tagline = $mappingTagline.Text.Trim()
      $thumb = $mappingThumb.Text.Trim().Replace('\\', '/')
      $date = $mappingDate.Text.Trim()

      if ($title -eq '' -or $slug -eq '' -or $game -eq '' -or $tagline -eq '' -or $thumb -eq '' -or $date -eq '') {
        Show-Error 'Mapping requires: title, game, tagline, thumbnail, and date.'
        return
      }

      $images = Get-ListValues $mappingImages.Text
      $videos = Get-ListValues $mappingVideos.Text
      $tags = Get-ListValues $mappingTags.Text

      $frontmatter = @(
        ('title: "{0}"' -f (Escape-YamlDouble $title)),
        ('game: "{0}"' -f (Escape-YamlDouble $game)),
        ('tagline: "{0}"' -f (Escape-YamlDouble $tagline)),
        ('thumbnail: "{0}"' -f (Escape-YamlDouble $thumb)),
        (Build-ArrayYaml -Name 'images' -Values $images),
        (Build-ArrayYaml -Name 'videos' -Values $videos)
      )

      if (-not [string]::IsNullOrWhiteSpace($mappingWorkshop.Text)) {
        $frontmatter += ('workshopUrl: "{0}"' -f (Escape-YamlDouble ($mappingWorkshop.Text.Trim())))
      }

      $frontmatter += ('date: "{0}"' -f (Escape-YamlDouble $date))
      $frontmatter += Build-ArrayYaml -Name 'tags' -Values $tags
      $frontmatter += "featured: $($mappingFeatured.Checked.ToString().ToLowerInvariant())"

      $mappingBodyText = if ($formatOnSaveCheck.Checked) { Format-MarkdownContent $mappingBody.Text } else { $mappingBody.Text }
      if ($formatOnSaveCheck.Checked) { $mappingBody.Text = $mappingBodyText }

      if ($editModeCheck.Checked) {
        $filePath = Write-ContentFileDirect -FilePath $saveExistingPath -FrontmatterLines $frontmatter -Body $mappingBodyText
      } else {
        $filePath = Write-ContentFile -Directory (Join-Path $contentRoot 'mapping') -Slug $slug -FrontmatterLines $frontmatter -Body $mappingBodyText
      }
    }
    'Musings' {
      $title = $musingsTitle.Text.Trim()
      $slug = if ($musingsSlug.Text.Trim()) { ConvertTo-Slug $musingsSlug.Text } else { ConvertTo-Slug $title }
      $excerpt = $musingsExcerpt.Text.Trim()
      $date = $musingsDate.Text.Trim()
      $category = $musingsCategory.Text.Trim()

      if ($title -eq '' -or $slug -eq '' -or $excerpt -eq '' -or $date -eq '' -or $category -eq '') {
        Show-Error 'Musings requires: title, excerpt, date, and category.'
        return
      }

      $frontmatter = @(
        ('title: "{0}"' -f (Escape-YamlDouble $title)),
        ('excerpt: "{0}"' -f (Escape-YamlDouble $excerpt)),
        ('date: "{0}"' -f (Escape-YamlDouble $date)),
        ('category: "{0}"' -f (Escape-YamlDouble $category)),
        "featured: $($musingsFeatured.Checked.ToString().ToLowerInvariant())"
      )

      $musingsBodyText = if ($formatOnSaveCheck.Checked) { Format-MarkdownContent $musingsBody.Text } else { $musingsBody.Text }
      if ($formatOnSaveCheck.Checked) { $musingsBody.Text = $musingsBodyText }

      if ($editModeCheck.Checked) {
        $filePath = Write-ContentFileDirect -FilePath $saveExistingPath -FrontmatterLines $frontmatter -Body $musingsBodyText
      } else {
        $filePath = Write-ContentFile -Directory (Join-Path $contentRoot 'musings') -Slug $slug -FrontmatterLines $frontmatter -Body $musingsBodyText
      }
    }
  }

  if ($filePath) {
    $verb = if ($editModeCheck.Checked) { 'Updated' } else { 'Created' }
    $statusLabel.Text = "${verb}: $filePath"
    $lastSavedFilePath = $filePath
    [void][System.Windows.Forms.MessageBox]::Show(
      "Content file $($verb.ToLowerInvariant()):`n$filePath",
      'Success',
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Information
    )
  } else {
    $statusLabel.Text = 'No file saved.'
  }
})

[void]$form.ShowDialog()