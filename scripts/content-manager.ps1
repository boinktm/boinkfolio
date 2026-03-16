Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::EnableVisualStyles()

# Frutiger Aero Dark Theme
$global:themeBg = [System.Drawing.Color]::FromArgb(10, 25, 40)
$global:themeFg = [System.Drawing.Color]::FromArgb(230, 240, 255)
$global:themeInputBg = [System.Drawing.Color]::FromArgb(20, 40, 60)
$global:themeSidebar = [System.Drawing.Color]::FromArgb(5, 15, 25)
$global:themeBorder = [System.Drawing.Color]::FromArgb(50, 80, 110)
$global:themeAccent = [System.Drawing.Color]::FromArgb(0, 230, 170)
$global:themeAccentDark = [System.Drawing.Color]::FromArgb(0, 180, 130)
$global:mainFont = [System.Drawing.Font]::new('Segoe UI', [float]9)

function Style-Button {
  param([System.Windows.Forms.Button]$Btn, [bool]$IsPrimary = $false)
  $Btn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
  $Btn.FlatAppearance.BorderColor = $global:themeBorder
  $Btn.BackColor = if ($IsPrimary) { $global:themeAccent } else { $global:themeInputBg }
  $Btn.ForeColor = if ($IsPrimary) { [System.Drawing.Color]::Black } else { $global:themeFg }
  $Btn.Cursor = [System.Windows.Forms.Cursors]::Hand
  $Btn.Font = [System.Drawing.Font]::new('Segoe UI', [float]9, [System.Drawing.FontStyle]::Bold)
}

function Style-GlossyButton {
  param(
    [System.Windows.Forms.Button]$Btn,
    [System.Drawing.Color]$BaseColor,
    [System.Drawing.Color]$DarkColor
  )

  $Btn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
  $Btn.FlatAppearance.BorderSize = 0
  $Btn.BackColor = $BaseColor
  $Btn.ForeColor = [System.Drawing.Color]::Black
  $Btn.Font = [System.Drawing.Font]::new('Segoe UI', [float]10, [System.Drawing.FontStyle]::Bold)
  $Btn.Cursor = [System.Windows.Forms.Cursors]::Hand

  $Btn.Paint.Add({
    param($sender, $e)
    $g = $e.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    $rect = $Btn.ClientRectangle

    $currentBaseColor = if ($Btn.Capture) { $DarkColor } else { $BaseColor }

    $lightColor = [System.Windows.Forms.ControlPaint]::Light($currentBaseColor, 0.6)
    $darkColor = [System.Windows.Forms.ControlPaint]::Dark($currentBaseColor, 0.1)

    $g.Clear($Btn.Parent.BackColor)

    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $path.AddArc($rect.X, $rect.Y, 12, 12, 180, 90)
    $path.AddArc($rect.Right - 12, $rect.Y, 12, 12, 270, 90)
    $path.AddArc($rect.Right - 12, $rect.Bottom - 12, 12, 12, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - 12, 12, 12, 90, 90)
    $path.CloseAllFigures()

    $gradientBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new($rect, $lightColor, $darkColor, [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
    $g.FillPath($gradientBrush, $path)

    $glareRect = [System.Drawing.Rectangle]::new($rect.X, $rect.Y, $rect.Width, [int]($rect.Height / 2))
    $glarePath = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $glarePath.AddArc($glareRect.X, $glareRect.Y, 12, 12, 180, 90)
    $glarePath.AddArc($glareRect.Right - 12, $glareRect.Y, 12, 12, 270, 90)
    $glarePath.AddLine($glareRect.Right, $glareRect.Y + 6, $glareRect.Right)
    $glarePath.AddLine($rect.Right, $rect.Height / 2, $rect.Left, $rect.Height / 2)
    $glareBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new($glareRect, [System.Drawing.Color]::FromArgb(160, [System.Drawing.Color]::White), [System.Drawing.Color]::FromArgb(10, [System.Drawing.Color]::White), [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
    $g.FillPath($glareBrush, $glarePath)

    $textFormat = [System.Windows.Forms.TextFormatFlags]::HorizontalCenter -bor [System.Windows.Forms.TextFormatFlags]::VerticalCenter
    [System.Windows.Forms.TextRenderer]::DrawText($g, $Btn.Text, $Btn.Font, $rect, $Btn.ForeColor, $textFormat)

    $gradientBrush.Dispose()
    $glareBrush.Dispose()
    $path.Dispose()
    $glarePath.Dispose()
  })
}


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

function Write-TextFileDirect {
  param(
    [string]$FilePath,
    [string]$Content
  )

  $text = if ($null -eq $Content) { '' } else { $Content }
  [System.IO.File]::WriteAllText($FilePath, $text, [System.Text.UTF8Encoding]::new($false))
  return $FilePath
}

function Write-TextFile {
  param(
    [string]$Directory,
    [string]$FileName,
    [string]$Content
  )

  Ensure-ContentDirectory -Path $Directory

  $filePath = Join-Path $Directory $FileName
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

  $text = if ($null -eq $Content) { '' } else { $Content }
  [System.IO.File]::WriteAllText($filePath, $text, [System.Text.UTF8Encoding]::new($false))
  return $filePath
}

function Escape-AstroSingleQuoted {
  param([string]$Value)

  if ($null -eq $Value) {
    return ''
  }

  $escaped = $Value.Trim()
  $escaped = $escaped -replace '\\', '\\\\'
  $escaped = $escaped -replace "'", "\\'"
  $escaped = $escaped -replace "`r?`n", ' '
  return $escaped
}

function Build-AstroStringArrayLiteral {
  param([string[]]$Values)

  if ($null -eq $Values -or $Values.Count -eq 0) {
    return ''
  }

  return (($Values | ForEach-Object { Escape-AstroSingleQuoted $_ }) -join '|')
}

function Build-GuideSectionsLiteral {
  param([string]$OutlineRaw)

  $lines = @()
  if (-not [string]::IsNullOrWhiteSpace($OutlineRaw)) {
    $lines = ($OutlineRaw -split "`r?`n" |
      ForEach-Object { $_.Trim() } |
      Where-Object { $_ -ne '' })
  }

  if ($lines.Count -eq 0) {
    $lines = @('Overview', 'Setup', 'Workflow', 'Examples', 'Curriculum', 'Common Mistakes')
  }

  return (($lines | ForEach-Object { Escape-AstroSingleQuoted $_ }) -join '|')
}

function Build-GuideAstroContent {
  param(
    [string]$TemplatePath,
    [string]$Title,
    [string]$Description,
    [string]$Category,
    [string]$Date,
    [string]$HeroImage,
    [string[]]$Tags,
    [bool]$Featured,
    [string]$OutlineRaw
  )

  if (-not (Test-Path -LiteralPath $TemplatePath)) {
    throw "Guide template not found: $TemplatePath"
  }

  $template = Get-Content -LiteralPath $TemplatePath -Raw -Encoding UTF8

  $safeTitle = Escape-AstroSingleQuoted $Title
  $safeDescription = Escape-AstroSingleQuoted $Description
  $safeCategory = Escape-AstroSingleQuoted $Category
  $safeDate = Escape-AstroSingleQuoted $Date
  $safeHeroImage = Escape-AstroSingleQuoted $HeroImage
  $tagLiteral = Build-AstroStringArrayLiteral -Values $Tags
  $featuredLiteral = $Featured.ToString().ToLowerInvariant()
  $sectionsLiteral = Build-GuideSectionsLiteral -OutlineRaw $OutlineRaw

  $template = $template.Replace('__GUIDE_TITLE__', $safeTitle)
  $template = $template.Replace('__GUIDE_DESCRIPTION__', $safeDescription)
  $template = $template.Replace('__GUIDE_CATEGORY__', $safeCategory)
  $template = $template.Replace('__GUIDE_DATE__', $safeDate)
  $template = $template.Replace('__GUIDE_HERO_IMAGE__', $safeHeroImage)
  $template = $template.Replace('__GUIDE_TAGS__', $tagLiteral)
  $template = $template.Replace('__GUIDE_FEATURED__', $featuredLiteral)
  $template = $template.Replace('__GUIDE_SECTIONS__', $sectionsLiteral)

  if (-not $template.EndsWith("`n")) {
    $template += "`n"
  }

  return $template
}

function Get-GoogleDriveFileId {
  param([string]$Url)

  if ([string]::IsNullOrWhiteSpace($Url)) {
    return $null
  }

  $trimmed = $Url.Trim()

  $fileMatch = [regex]::Match($trimmed, 'https?://drive\.google\.com/file/d/([A-Za-z0-9_-]+)')
  if ($fileMatch.Success) {
    return $fileMatch.Groups[1].Value
  }

  if ($trimmed -match 'drive\.google\.com') {
    $queryMatch = [regex]::Match($trimmed, '[\?&]id=([A-Za-z0-9_-]+)')
    if ($queryMatch.Success) {
      return $queryMatch.Groups[1].Value
    }
  }

  return $null
}

function Normalize-ImageUrl {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return ''
  }

  $normalized = $Value.Trim().Replace('\\', '/')
  $googleDriveId = Get-GoogleDriveFileId -Url $normalized
  if (-not [string]::IsNullOrWhiteSpace($googleDriveId)) {
    return "https://drive.google.com/uc?export=view&id=$googleDriveId"
  }

  return $normalized
}

function Normalize-ImageUrlList {
  param([string[]]$Values)

  if ($null -eq $Values -or $Values.Count -eq 0) {
    return @()
  }

  return ($Values |
    ForEach-Object { Normalize-ImageUrl $_ } |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
}

function Attach-ImageUrlNormalization {
  param(
    [System.Windows.Forms.TextBox]$TextBox,
    [bool]$TreatAsList = $false
  )

  if ($null -eq $TextBox) {
    return
  }

  $state = [pscustomobject]@{
    IsNormalizing = $false
  }

  $applyNormalization = {
    if ($state.IsNormalizing) {
      return
    }

    $current = $TextBox.Text
    $normalized = if ($TreatAsList) {
      (Normalize-ImageUrlList (Get-ListValues $current)) -join [Environment]::NewLine
    } else {
      Normalize-ImageUrl $current
    }

    if ($normalized -eq $current) {
      return
    }

    $state.IsNormalizing = $true
    try {
      $TextBox.Text = $normalized
      $TextBox.SelectionStart = $TextBox.Text.Length
      $TextBox.SelectionLength = 0
    } finally {
      $state.IsNormalizing = $false
    }
  }.GetNewClosure()

  $TextBox.Add_TextChanged({
    if ($state.IsNormalizing) {
      return
    }

    $current = $TextBox.Text
    if ([string]::IsNullOrWhiteSpace($current)) {
      return
    }

    # Normalize immediately for pasted Google Drive links while avoiding work on unrelated typing.
    if ($current -match 'drive\.google\.com') {
      $applyNormalization.Invoke()
    }
  }.GetNewClosure())

  $TextBox.Add_Leave({
    $applyNormalization.Invoke()
  }.GetNewClosure())
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

function Handle-FileBrowse {
  param(
    [System.Windows.Forms.TextBox]$TargetTextBox,
    [string]$ContentCollection,
    [bool]$AllowMultiSelect = $false
  )

  $publicRoot = Join-Path $projectRoot 'public'
  $destDir = Join-Path $publicRoot "images\$ContentCollection"
  if (-not (Test-Path -LiteralPath $destDir)) {
    [void](New-Item -ItemType Directory -Path $destDir -Force)
  }

  $dialog = [System.Windows.Forms.OpenFileDialog]::new()
  $dialog.Filter = 'Image files (*.jpg, *.jpeg, *.png, *.gif, *.webp, *.svg)|*.jpg;*.jpeg;*.png;*.gif;*.webp;*.svg|All files (*.*)|*.*'
  $dialog.InitialDirectory = (Get-Location).Path
  $dialog.Multiselect = $AllowMultiSelect

  if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
    return
  }

  $urls = @()
  foreach ($file in $dialog.FileNames) {
    $fileName = [System.IO.Path]::GetFileName($file)
    $destPath = Join-Path $destDir $fileName
    if (Test-Path -LiteralPath $destPath) {
      $overwrite = [System.Windows.Forms.MessageBox]::Show(
        "The file already exists in the destination:`n$destPath`n`nOverwrite it?",
        'File Exists',
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Question
      )

      if ($overwrite -ne [System.Windows.Forms.DialogResult]::Yes) {
        # If not overwriting, assume the user wants to use the existing file
        $relativeUrl = ($destPath -replace [regex]::Escape($publicRoot), '' -replace '\\', '/').TrimStart('/')
        $urls += "/$relativeUrl"
        continue
      }
    }

    try {
      Copy-Item -LiteralPath $file -Destination $destPath -Force
      $relativeUrl = ($destPath -replace [regex]::Escape($publicRoot), '' -replace '\\', '/').TrimStart('/')
      $urls += "/$relativeUrl"
    } catch {
      Show-Error "Failed to copy file '$fileName': $($_.Exception.Message)"
    }
  }

  if ($urls.Count -gt 0) {
    if ($AllowMultiSelect) {
      $existingUrls = Get-ListValues $TargetTextBox.Text
      $allUrls = $existingUrls + $urls
      $TargetTextBox.Text = ($allUrls -join [Environment]::NewLine)
      $statusLabel.Text = "Added $($urls.Count) image(s)."
    } else {
      $TargetTextBox.Text = $urls[0]
      $statusLabel.Text = "Set image to: $($urls[0])"
    }
  }
}

function Add-FileFieldRow {
  param(
    [object]$Layout,
    [string]$Label,
    [System.Windows.Forms.TextBox]$Control,
    [int]$Height = 30,
    [string]$ContentCollection,
    [bool]$AllowMultiSelect = $false
  )

  if ($Layout -is [System.Array]) {
    $Layout = $Layout | Where-Object { $_ -is [System.Windows.Forms.TableLayoutPanel] } | Select-Object -First 1
  }

  $rowIndex = $Layout.RowCount
  $Layout.RowCount += 1
  [void]$Layout.RowStyles.Add([System.Windows.Forms.RowStyle]::new([System.Windows.Forms.SizeType]::Absolute, $Height))

  $labelControl = [System.Windows.Forms.Label]::new()
  $labelControl.Text = $Label
  $labelControl.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
  $labelControl.Dock = [System.Windows.Forms.DockStyle]::Fill
  $labelControl.Margin = [System.Windows.Forms.Padding]::new(0, 5, 10, 5)

  $cell = [System.Windows.Forms.TableLayoutPanel]::new()
  $cell.Dock = [System.Windows.Forms.DockStyle]::Fill
  $cell.ColumnCount = 2
  $cell.RowCount = 1
  $cell.Margin = [System.Windows.Forms.Padding]::new(0, 3, 0, 3)
  [void]$cell.ColumnStyles.Add([System.Windows.Forms.ColumnStyle]::new([System.Windows.Forms.SizeType]::Percent, 100))
  [void]$cell.ColumnStyles.Add([System.Windows.Forms.ColumnStyle]::new([System.Windows.Forms.SizeType]::Absolute, 80))

  $Control.Dock = [System.Windows.Forms.DockStyle]::Fill

  $browseBtn = [System.Windows.Forms.Button]::new()
  $browseBtn.Text = 'Browse...'
  $browseBtn.Dock = [System.Windows.Forms.DockStyle]::Fill
  $browseBtn.Margin = [System.Windows.Forms.Padding]::new(4, -1, 0, 0)
  Style-Button -Btn $browseBtn
  $browseBtn.Add_Click({ Handle-FileBrowse -TargetTextBox $Control -ContentCollection $ContentCollection -AllowMultiSelect $AllowMultiSelect }.GetNewClosure())

  [void]$cell.Controls.Add($Control, 0, 0)
  [void]$cell.Controls.Add($browseBtn, 1, 0)

  $Layout.Controls.Add($labelControl, 0, $rowIndex)
  $Layout.Controls.Add($cell, 1, $rowIndex)
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
  $tb.BackColor = $global:themeInputBg
  $tb.ForeColor = $global:themeFg
  $tb.BorderStyle = [System.Windows.Forms.BorderStyle]::FixedSingle
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
$guidePagesRoot = Join-Path $projectRoot 'src\pages\assets-and-guides'
$guideTemplatePath = Join-Path $projectRoot 'src\templates\interactive-guide-template.astro'

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
Ensure-ContentDirectory -Path $guidePagesRoot
$lastSavedFilePath = $null
$editingFileByTab = @{
  Art = $null
  Assets = $null
  Mapping = $null
  Musings = $null
  Guides = $null
}

$form = [System.Windows.Forms.Form]::new()
$form.Text = 'Boinkfolio Content Manager'
$form.Size = [System.Drawing.Size]::new(980, 780)
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
$form.MinimumSize = [System.Drawing.Size]::new(900, 700)
$form.BackColor = $global:themeBg
$form.ForeColor = $global:themeFg
$form.Font = $global:mainFont

$rootLayout = [System.Windows.Forms.TableLayoutPanel]::new()
$rootLayout.Dock = [System.Windows.Forms.DockStyle]::Fill
$rootLayout.ColumnCount = 2
$rootLayout.RowCount = 1
[void]$rootLayout.ColumnStyles.Add([System.Windows.Forms.ColumnStyle]::new([System.Windows.Forms.SizeType]::Absolute, 220))
[void]$rootLayout.ColumnStyles.Add([System.Windows.Forms.ColumnStyle]::new([System.Windows.Forms.SizeType]::Percent, 100))
[void]$form.Controls.Add($rootLayout)

$sidebarPanel = [System.Windows.Forms.FlowLayoutPanel]::new()
$sidebarPanel.Dock = [System.Windows.Forms.DockStyle]::Fill
$sidebarPanel.BackColor = $global:themeSidebar
$sidebarPanel.FlowDirection = [System.Windows.Forms.FlowDirection]::TopDown
$sidebarPanel.WrapContents = $false
$sidebarPanel.Margin = [System.Windows.Forms.Padding]::new(0)
[void]$rootLayout.Controls.Add($sidebarPanel, 0, 0)

$brandLabel = [System.Windows.Forms.Label]::new()
$brandLabel.Text = "BOINKFOLIO"
$brandLabel.ForeColor = $global:themeAccent
$brandLabel.Font = [System.Drawing.Font]::new('Segoe UI Black', [float]16)
$brandLabel.AutoSize = $false
$brandLabel.Size = [System.Drawing.Size]::new(220, 80)
$brandLabel.TextAlign = [System.Drawing.ContentAlignment]::MiddleCenter
[void]$sidebarPanel.Controls.Add($brandLabel)

$mainLayout = [System.Windows.Forms.TableLayoutPanel]::new()
$mainLayout.Dock = [System.Windows.Forms.DockStyle]::Fill
$mainLayout.ColumnCount = 1
$mainLayout.RowCount = 3
[void]$mainLayout.RowStyles.Add([System.Windows.Forms.RowStyle]::new([System.Windows.Forms.SizeType]::Absolute, 52))
[void]$mainLayout.RowStyles.Add([System.Windows.Forms.RowStyle]::new([System.Windows.Forms.SizeType]::Percent, 100))
[void]$mainLayout.RowStyles.Add([System.Windows.Forms.RowStyle]::new([System.Windows.Forms.SizeType]::Absolute, 110))
[void]$rootLayout.Controls.Add($mainLayout, 1, 0)

$header = [System.Windows.Forms.Label]::new()
$header.Text = 'Select a category from the sidebar to manage content.'
$header.Dock = [System.Windows.Forms.DockStyle]::Fill
$header.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$header.Padding = [System.Windows.Forms.Padding]::new(12, 0, 12, 0)
[void]$mainLayout.Controls.Add($header, 0, 0)

$contentContainer = [System.Windows.Forms.Panel]::new()
$contentContainer.Dock = [System.Windows.Forms.DockStyle]::Fill
[void]$mainLayout.Controls.Add($contentContainer, 0, 1)

$global:navButtons = @{}
$global:contentPanels = @{}
$global:currentTab = 'Art'

function Switch-Tab {
  param([string]$TabName)
  $global:currentTab = $TabName
  foreach ($key in $global:contentPanels.Keys) {
    $global:contentPanels[$key].Visible = ($key -eq $TabName)
  }
  foreach ($key in $global:navButtons.Keys) {
    if ($key -eq $TabName) {
      $global:navButtons[$key].BackColor = $global:themeAccent
      $global:navButtons[$key].ForeColor = [System.Drawing.Color]::Black
    } else {
      $global:navButtons[$key].BackColor = $global:themeSidebar
      $global:navButtons[$key].ForeColor = $global:themeFg
    }
  }

  $createBtnVar = Get-Variable -Name createBtn -Scope Script -ErrorAction SilentlyContinue
  $editModeVar = Get-Variable -Name editModeCheck -Scope Script -ErrorAction SilentlyContinue
  if ($null -ne $createBtnVar -and $null -ne $editModeVar) {
    $isEditMode = [bool]$editModeVar.Value.Checked
    if ($TabName -eq 'Guides') {
      $createBtnVar.Value.Text = if ($isEditMode) { 'Save Guide Page' } else { 'Create Guide Page' }
    } else {
      $createBtnVar.Value.Text = if ($isEditMode) { 'Save Markdown Changes' } else { 'Create Markdown File' }
    }
  }
}

function New-NavTab {
  param([string]$Title)

  $btn = [System.Windows.Forms.Button]::new()
  $btn.Text = $Title.ToUpper()
  $btn.Size = [System.Drawing.Size]::new(220, 50)
  $btn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
  $btn.FlatAppearance.BorderSize = 0
  $btn.Margin = [System.Windows.Forms.Padding]::new(0)
  $btn.Font = [System.Drawing.Font]::new('Segoe UI', [float]10, [System.Drawing.FontStyle]::Bold)
  $btn.Cursor = [System.Windows.Forms.Cursors]::Hand
  $btn.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
  $btn.Padding = [System.Windows.Forms.Padding]::new(30, 0, 0, 0)
  $btn.Add_Click({ Switch-Tab -TabName $Title }.GetNewClosure())
  [void]$sidebarPanel.Controls.Add($btn)
  $global:navButtons[$Title] = $btn

  $panel = [System.Windows.Forms.Panel]::new()
  $panel.Dock = [System.Windows.Forms.DockStyle]::Fill
  $panel.AutoScroll = $true
  $panel.Visible = $false
  $panel.Padding = [System.Windows.Forms.Padding]::new(10)

  $layout = [System.Windows.Forms.TableLayoutPanel]::new()
  $layout.Dock = [System.Windows.Forms.DockStyle]::Top
  $layout.AutoSize = $true
  $layout.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
  $layout.ColumnCount = 2
  [void]$layout.ColumnStyles.Add([System.Windows.Forms.ColumnStyle]::new([System.Windows.Forms.SizeType]::Absolute, 190))
  [void]$layout.ColumnStyles.Add([System.Windows.Forms.ColumnStyle]::new([System.Windows.Forms.SizeType]::Percent, 100))

  [void]$panel.Controls.Add($layout)
  [void]$contentContainer.Controls.Add($panel)
  $global:contentPanels[$Title] = $panel

  return $layout
}

# Art tab
$artLayout = New-NavTab -Title 'Art'
$artSlug = New-TextBoxField
$artTitle = New-TextBoxField
$artTagline = New-TextBoxField
$artThumbnail = New-TextBoxField
$artFullres = New-TextBoxField
$artImages = New-TextBoxField -MultiLine $true
$artVideos = New-TextBoxField -MultiLine $true
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
Add-FileFieldRow $artLayout 'Thumbnail URL/Path *' $artThumbnail -ContentCollection 'art'
Add-FileFieldRow $artLayout 'Fullres URL/Path (optional)' $artFullres -ContentCollection 'art'
Add-FileFieldRow $artLayout 'Images (one per line)' $artImages 90 -ContentCollection 'art' -AllowMultiSelect $true
Add-FieldRow $artLayout 'Video Links (one per line)' $artVideos 90
Add-FieldRow $artLayout 'Medium *' $artMedium
Add-FieldRow $artLayout 'Status *' $artStatus
Add-FieldRow $artLayout 'Date *' $artDate
Add-FieldRow $artLayout 'Software (comma/line)' $artSoftware
Add-FieldRow $artLayout 'External URL (optional)' $artExternalUrl
Add-FieldRow $artLayout 'Tags (comma/line)' $artTags
Add-FieldRow $artLayout 'Featured' $artFeatured
Add-FieldRow $artLayout 'Markdown Body' $artBody 180

# Assets tab
$assetsLayout = New-NavTab -Title 'Assets'
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
Add-FileFieldRow $assetsLayout 'File Path/URL *' $assetsFilePath -ContentCollection 'assets'
Add-FileFieldRow $assetsLayout 'Preview Image (optional)' $assetsPreview -ContentCollection 'assets'
Add-FieldRow $assetsLayout 'Category *' $assetsCategory
Add-FieldRow $assetsLayout 'Source Type *' $assetsSourceType
Add-FieldRow $assetsLayout 'Date *' $assetsDate
Add-FieldRow $assetsLayout 'Tags (comma/line)' $assetsTags
Add-FieldRow $assetsLayout 'Public Asset' $assetsPublic
Add-FieldRow $assetsLayout 'Related Art Slug (optional)' $assetsRelatedSlug
Add-FieldRow $assetsLayout 'Markdown Body' $assetsBody 180

# Mapping tab
$mappingLayout = New-NavTab -Title 'Mapping'
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
Add-FileFieldRow $mappingLayout 'Thumbnail URL/Path *' $mappingThumb -ContentCollection 'mapping'
Add-FileFieldRow $mappingLayout 'Images (one per line)' $mappingImages 90 -ContentCollection 'mapping' -AllowMultiSelect $true
Add-FieldRow $mappingLayout 'Video Links (one per line)' $mappingVideos 90
Add-FieldRow $mappingLayout 'Workshop URL (optional)' $mappingWorkshop
Add-FieldRow $mappingLayout 'Date *' $mappingDate
Add-FieldRow $mappingLayout 'Tags (comma/line)' $mappingTags
Add-FieldRow $mappingLayout 'Featured' $mappingFeatured
Add-FieldRow $mappingLayout 'Markdown Body' $mappingBody 200

# Musings tab
$musingsLayout = New-NavTab -Title 'Musings'
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

# Guides tab
$guidesLayout = New-NavTab -Title 'Guides'
$guidesSlug = New-TextBoxField
$guidesTitle = New-TextBoxField
$guidesDescription = New-TextBoxField -MultiLine $true
$guidesCategory = New-TextBoxField
$guidesHero = New-TextBoxField
$guidesDate = New-TextBoxField -Default (Get-Date -Format 'MMM yyyy')
$guidesTags = New-TextBoxField
$guidesFeatured = New-CheckBoxField
$guidesBody = New-TextBoxField -MultiLine $true

Add-FieldRow $guidesLayout 'Slug (optional)' $guidesSlug
Add-FieldRow $guidesLayout 'Title *' $guidesTitle
Add-FieldRow $guidesLayout 'Description *' $guidesDescription 60
Add-FieldRow $guidesLayout 'Category' $guidesCategory
Add-FileFieldRow $guidesLayout 'Hero Image (optional)' $guidesHero -ContentCollection 'guides'
Add-FieldRow $guidesLayout 'Date *' $guidesDate
Add-FieldRow $guidesLayout 'Tags (comma/line)' $guidesTags
Add-FieldRow $guidesLayout 'Featured' $guidesFeatured
Add-FieldRow $guidesLayout 'Section Outline (one per line)' $guidesBody 240

Attach-ImageUrlNormalization -TextBox $artThumbnail
Attach-ImageUrlNormalization -TextBox $artFullres
Attach-ImageUrlNormalization -TextBox $artImages -TreatAsList $true
Attach-ImageUrlNormalization -TextBox $assetsFilePath
Attach-ImageUrlNormalization -TextBox $assetsPreview
Attach-ImageUrlNormalization -TextBox $mappingThumb
Attach-ImageUrlNormalization -TextBox $mappingImages -TreatAsList $true
Attach-ImageUrlNormalization -TextBox $guidesHero

$actionsPanel = [System.Windows.Forms.TableLayoutPanel]::new()
$actionsPanel.Dock = [System.Windows.Forms.DockStyle]::Fill
$actionsPanel.ColumnCount = 1
$actionsPanel.RowCount = 2
[void]$actionsPanel.ColumnStyles.Add([System.Windows.Forms.ColumnStyle]::new([System.Windows.Forms.SizeType]::Percent, 100))
[void]$actionsPanel.RowStyles.Add([System.Windows.Forms.RowStyle]::new([System.Windows.Forms.SizeType]::Absolute, 50))
[void]$actionsPanel.RowStyles.Add([System.Windows.Forms.RowStyle]::new([System.Windows.Forms.SizeType]::Absolute, 50))
$actionsPanel.Padding = [System.Windows.Forms.Padding]::new(0)
[void]$mainLayout.Controls.Add($actionsPanel, 0, 2)

$topActionsRow = [System.Windows.Forms.FlowLayoutPanel]::new()
$topActionsRow.Dock = [System.Windows.Forms.DockStyle]::Fill
$topActionsRow.FlowDirection = [System.Windows.Forms.FlowDirection]::LeftToRight
$topActionsRow.Padding = [System.Windows.Forms.Padding]::new(10, 4, 10, 0)
$topActionsRow.WrapContents = $false

$bottomActionsRow = [System.Windows.Forms.FlowLayoutPanel]::new()
$bottomActionsRow.Dock = [System.Windows.Forms.DockStyle]::Fill
$bottomActionsRow.FlowDirection = [System.Windows.Forms.FlowDirection]::LeftToRight
$bottomActionsRow.Padding = [System.Windows.Forms.Padding]::new(10, 4, 10, 4)
$bottomActionsRow.WrapContents = $false

[void]$actionsPanel.Controls.Add($topActionsRow, 0, 0)
[void]$actionsPanel.Controls.Add($bottomActionsRow, 0, 1)

$createBtn = [System.Windows.Forms.Button]::new()
$createBtn.Text = 'Create Markdown File'
$createBtn.Width = 190
$createBtn.Height = 42
Style-GlossyButton -Btn $createBtn -BaseColor $global:themeAccent -DarkColor $global:themeAccentDark

$editModeCheck = [System.Windows.Forms.CheckBox]::new()
$editModeCheck.Text = 'Edit Existing Mode'
$editModeCheck.AutoSize = $true
$editModeCheck.Padding = [System.Windows.Forms.Padding]::new(8, 12, 8, 0)

$loadBtn = [System.Windows.Forms.Button]::new()
$loadBtn.Text = 'Load'
$loadBtn.Width = 80
$loadBtn.Height = 36
Style-Button -Btn $loadBtn

$clearBtn = [System.Windows.Forms.Button]::new()
$clearBtn.Text = 'Clear All'
$clearBtn.Width = 90
$clearBtn.Height = 36
Style-Button -Btn $clearBtn

$clearTabBtn = [System.Windows.Forms.Button]::new()
$clearTabBtn.Text = 'Clear Tab'
$clearTabBtn.Width = 90
$clearTabBtn.Height = 36
Style-Button -Btn $clearTabBtn

$formatBtn = [System.Windows.Forms.Button]::new()
$formatBtn.Text = 'Format MD'
$formatBtn.Width = 100
$formatBtn.Height = 36
Style-Button -Btn $formatBtn

$formatOnSaveCheck = [System.Windows.Forms.CheckBox]::new()
$formatOnSaveCheck.Text = 'Auto Format on Save'
$formatOnSaveCheck.Checked = $true
$formatOnSaveCheck.AutoSize = $true
$formatOnSaveCheck.Padding = [System.Windows.Forms.Padding]::new(8, 12, 8, 0)

$pushBtn = [System.Windows.Forms.Button]::new()
$pushBtn.Text = 'Push to Git'
$pushBtn.Width = 120
$pushBtn.Height = 42
Style-GlossyButton -Btn $pushBtn -BaseColor $global:themeAccent -DarkColor $global:themeAccentDark

$openBtn = [System.Windows.Forms.Button]::new()
$openBtn.Text = 'Open Folder'
$openBtn.Width = 110
$openBtn.Height = 36
Style-Button -Btn $openBtn

$updateNoteLabel = [System.Windows.Forms.Label]::new()
$updateNoteLabel.Text = 'Update Note:'
$updateNoteLabel.AutoSize = $true
$updateNoteLabel.Padding = [System.Windows.Forms.Padding]::new(0, 10, 0, 0)

$updateNoteBox = [System.Windows.Forms.TextBox]::new()
$updateNoteBox.Width = 320
$updateNoteBox.Height = 28
$updateNoteBox.BackColor = $global:themeInputBg
$updateNoteBox.ForeColor = $global:themeFg
$updateNoteBox.BorderStyle = [System.Windows.Forms.BorderStyle]::FixedSingle
$updateNoteBox.Margin = [System.Windows.Forms.Padding]::new(4, 6, 4, 0)

$statusLabel = [System.Windows.Forms.Label]::new()
$statusLabel.AutoSize = $true
$statusLabel.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$statusLabel.Padding = [System.Windows.Forms.Padding]::new(18, 10, 0, 0)
$statusLabel.MaximumSize = [System.Drawing.Size]::new(400, 50)

[void]$topActionsRow.Controls.Add($createBtn)
[void]$topActionsRow.Controls.Add($editModeCheck)
[void]$topActionsRow.Controls.Add($loadBtn)
[void]$topActionsRow.Controls.Add($clearTabBtn)
[void]$topActionsRow.Controls.Add($clearBtn)
[void]$topActionsRow.Controls.Add($formatBtn)
[void]$topActionsRow.Controls.Add($formatOnSaveCheck)

[void]$bottomActionsRow.Controls.Add($updateNoteLabel)
[void]$bottomActionsRow.Controls.Add($updateNoteBox)
[void]$bottomActionsRow.Controls.Add($pushBtn)
[void]$bottomActionsRow.Controls.Add($openBtn)
[void]$bottomActionsRow.Controls.Add($statusLabel)

$editModeCheck.Add_CheckedChanged({
  $isGuidesTab = ($global:currentTab -eq 'Guides')
  if ($editModeCheck.Checked) {
    $createBtn.Text = if ($isGuidesTab) { 'Save Guide Page' } else { 'Save Markdown Changes' }
    $statusLabel.Text = 'Edit mode enabled. Load a file in the current tab.'
  } else {
    $createBtn.Text = if ($isGuidesTab) { 'Create Guide Page' } else { 'Create Markdown File' }
    $statusLabel.Text = 'Create mode enabled.'
  }
})

$loadBtn.Add_Click({
  $selectedTab = $global:currentTab

  if ($selectedTab -eq 'Guides') {
    Ensure-ContentDirectory -Path $guidePagesRoot

    $dialog = [System.Windows.Forms.OpenFileDialog]::new()
    $dialog.Filter = 'Astro files (*.astro)|*.astro'
    $dialog.InitialDirectory = $guidePagesRoot
    $dialog.Multiselect = $false

    if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
      return
    }

    try {
      $guidesSlug.Text = [System.IO.Path]::GetFileNameWithoutExtension($dialog.FileName)
      $rawGuide = Get-Content -LiteralPath $dialog.FileName -Raw -Encoding UTF8
      $guidesBody.Text = $rawGuide

      $titleMatch = [regex]::Match($rawGuide, "title:\s*'((?:\\'|[^'])*)'")
      if ($titleMatch.Success) {
        $guidesTitle.Text = $titleMatch.Groups[1].Value -replace "\\'", "'"
      }

      $descriptionMatch = [regex]::Match($rawGuide, "description:\s*'((?:\\'|[^'])*)'")
      if ($descriptionMatch.Success) {
        $guidesDescription.Text = $descriptionMatch.Groups[1].Value -replace "\\'", "'"
      }

      $categoryMatch = [regex]::Match($rawGuide, "category:\s*'((?:\\'|[^'])*)'")
      if ($categoryMatch.Success) {
        $guidesCategory.Text = $categoryMatch.Groups[1].Value -replace "\\'", "'"
      }

      $dateMatch = [regex]::Match($rawGuide, "date:\s*'((?:\\'|[^'])*)'")
      if ($dateMatch.Success) {
        $guidesDate.Text = $dateMatch.Groups[1].Value -replace "\\'", "'"
      }

      $heroMatch = [regex]::Match($rawGuide, "heroImage:\s*'((?:\\'|[^'])*)'")
      if ($heroMatch.Success) {
        $guidesHero.Text = $heroMatch.Groups[1].Value -replace "\\'", "'"
      }

      $featuredMatch = [regex]::Match($rawGuide, "featuredToken:\s*'((?:\\'|[^'])*)'")
      if ($featuredMatch.Success) {
        $guidesFeatured.Checked = (($featuredMatch.Groups[1].Value -replace "\\'", "'").ToLowerInvariant() -eq 'true')
      }

      $tagMatch = [regex]::Match($rawGuide, "tags:\s*'((?:\\'|[^'])*)'")
      if ($tagMatch.Success) {
        $tagValues = ($tagMatch.Groups[1].Value -replace "\\'", "'") -split '\|' |
          ForEach-Object { $_.Trim() } |
          Where-Object { $_ -ne '' }
        $guidesTags.Text = ($tagValues -join [Environment]::NewLine)
      }

      $editingFileByTab[$selectedTab] = $dialog.FileName
      $statusLabel.Text = "Loaded guide page: $($dialog.FileName)"
    } catch {
      Show-Error "Unable to load guide page: $($_.Exception.Message)"
    }

    return
  }

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
        $artVideos.Text = Join-ListText $fm['videos']
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
      'Guides' {
        $guidesSlug.Text = [System.IO.Path]::GetFileNameWithoutExtension($dialog.FileName)
        $guidesTitle.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'title'
        $guidesDescription.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'description'
        $guidesCategory.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'category'
        $guidesHero.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'heroImage'
        $guidesDate.Text = Get-FrontmatterValue -Frontmatter $fm -Key 'date'
        $guidesTags.Text = Join-ListText $fm['tags']
        $guidesFeatured.Checked = Get-FrontmatterBool -Frontmatter $fm -Key 'featured'
        $guidesBody.Text = $parsed.Body
      }
    }

    $editingFileByTab[$selectedTab] = $dialog.FileName
    $statusLabel.Text = "Loaded: $($dialog.FileName)"
  } catch {
    Show-Error "Unable to load file: $($_.Exception.Message)"
  }
})

$openBtn.Add_Click({
  $selectedTab = $global:currentTab
  $openPath = if ($selectedTab -eq 'Guides') {
    $guidePagesRoot
  } else {
    $contentRoot
  }

  [System.Diagnostics.Process]::Start('explorer.exe', $openPath) | Out-Null
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
  $artVideos.Text = ''
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

  $guidesSlug.Text = ''
  $guidesTitle.Text = ''
  $guidesDescription.Text = ''
  $guidesCategory.Text = ''
  $guidesHero.Text = ''
  $guidesDate.Text = $defaultDate
  $guidesTags.Text = ''
  $guidesFeatured.Checked = $false
  $guidesBody.Text = ''

  $editingFileByTab['Art'] = $null
  $editingFileByTab['Assets'] = $null
  $editingFileByTab['Mapping'] = $null
  $editingFileByTab['Musings'] = $null
  $editingFileByTab['Guides'] = $null
  $lastSavedFilePath = $null

  $statusLabel.Text = 'All form data cleared.'
})

$clearTabBtn.Add_Click({
  $selectedTab = $global:currentTab
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
      $artVideos.Text = ''
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
    'Guides' {
        $guidesSlug.Text = ''
        $guidesTitle.Text = ''
        $guidesDescription.Text = ''
        $guidesCategory.Text = ''
        $guidesHero.Text = ''
        $guidesDate.Text = $defaultDate
        $guidesTags.Text = ''
        $guidesFeatured.Checked = $false
        $guidesBody.Text = ''
        $editingFileByTab['Guides'] = $null
    }
  }

  $lastSavedFilePath = $null
  $statusLabel.Text = "Cleared tab: $selectedTab"
})

$formatBtn.Add_Click({
  $selectedTab = $global:currentTab

  if ($selectedTab -eq 'Guides') {
    $statusLabel.Text = 'Format MD is disabled for Guides. Edit the Astro template directly.'
    return
  }

  $targetBody = $null

  switch ($selectedTab) {
    'Art' { $targetBody = $artBody }
    'Assets' { $targetBody = $assetsBody }
    'Mapping' { $targetBody = $mappingBody }
    'Musings' { $targetBody = $musingsBody }
    'Guides' { $targetBody = $guidesBody }
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

  $userNote = $updateNoteBox.Text.Trim()
  $defaultMessage = if (-not [string]::IsNullOrWhiteSpace($userNote)) {
    $userNote
  } elseif (-not [string]::IsNullOrWhiteSpace([string]$lastSavedFilePath)) {
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
  $selectedTab = $global:currentTab
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
      $thumbnail = Normalize-ImageUrl $artThumbnail.Text
      $medium = $artMedium.Text.Trim()
      $status = $artStatus.Text.Trim()
      $date = $artDate.Text.Trim()

      if ($title -eq '' -or $slug -eq '' -or $tagline -eq '' -or $thumbnail -eq '' -or $medium -eq '' -or $status -eq '' -or $date -eq '') {
        Show-Error 'Art requires: title, tagline, thumbnail, medium, status, and date.'
        return
      }

      $images = Normalize-ImageUrlList (Get-ListValues $artImages.Text)
      $videos = Get-ListValues $artVideos.Text
      $software = Get-ListValues $artSoftware.Text
      $tags = Get-ListValues $artTags.Text

      $artThumbnail.Text = $thumbnail
      $artImages.Text = ($images -join [Environment]::NewLine)

      $frontmatter = @(
        ('title: "{0}"' -f (Escape-YamlDouble $title)),
        ('tagline: "{0}"' -f (Escape-YamlDouble $tagline)),
        ('thumbnail: "{0}"' -f (Escape-YamlDouble $thumbnail))
      )

      if (-not [string]::IsNullOrWhiteSpace($artFullres.Text)) {
        $fullres = Normalize-ImageUrl $artFullres.Text
        $artFullres.Text = $fullres
        $frontmatter += ('fullres: "{0}"' -f (Escape-YamlDouble $fullres))
      }

      $frontmatter += Build-ArrayYaml -Name 'images' -Values $images
      $frontmatter += Build-ArrayYaml -Name 'videos' -Values $videos
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
      $fileValue = Normalize-ImageUrl $assetsFilePath.Text
      $category = $assetsCategory.Text.Trim()
      $sourceType = $assetsSourceType.Text.Trim()
      $date = $assetsDate.Text.Trim()

      if ($title -eq '' -or $slug -eq '' -or $summary -eq '' -or $fileValue -eq '' -or $category -eq '' -or $sourceType -eq '' -or $date -eq '') {
        Show-Error 'Assets requires: title, summary, file path, category, source type, and date.'
        return
      }

      $tags = Get-ListValues $assetsTags.Text
      $assetsFilePath.Text = $fileValue

      $frontmatter = @(
        ('title: "{0}"' -f (Escape-YamlDouble $title)),
        ('summary: "{0}"' -f (Escape-YamlDouble $summary)),
        ('filePath: "{0}"' -f (Escape-YamlDouble $fileValue))
      )

      if (-not [string]::IsNullOrWhiteSpace($assetsPreview.Text)) {
        $previewValue = Normalize-ImageUrl $assetsPreview.Text
        $assetsPreview.Text = $previewValue
        $frontmatter += ('previewImage: "{0}"' -f (Escape-YamlDouble $previewValue))
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
      $thumb = Normalize-ImageUrl $mappingThumb.Text
      $date = $mappingDate.Text.Trim()

      if ($title -eq '' -or $slug -eq '' -or $game -eq '' -or $tagline -eq '' -or $thumb -eq '' -or $date -eq '') {
        Show-Error 'Mapping requires: title, game, tagline, thumbnail, and date.'
        return
      }

      $images = Normalize-ImageUrlList (Get-ListValues $mappingImages.Text)
      $videos = Get-ListValues $mappingVideos.Text
      $tags = Get-ListValues $mappingTags.Text

      $mappingThumb.Text = $thumb
      $mappingImages.Text = ($images -join [Environment]::NewLine)

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
    'Guides' {
      if ($editModeCheck.Checked -and -not [string]::IsNullOrWhiteSpace($guidesBody.Text) -and ($guidesBody.Text -match '<Layout')) {
        $filePath = Write-TextFileDirect -FilePath $saveExistingPath -Content $guidesBody.Text
        break
      }

      $title = $guidesTitle.Text.Trim()
      $slug = if ($guidesSlug.Text.Trim()) { ConvertTo-Slug $guidesSlug.Text } else { ConvertTo-Slug $title }
      $description = $guidesDescription.Text.Trim()
      $date = $guidesDate.Text.Trim()

      if ($title -eq '' -or $slug -eq '' -or $description -eq '' -or $date -eq '') {
        Show-Error 'Guides requires: title, description, and date.'
        return
      }

      $tags = Get-ListValues $guidesTags.Text
      $category = if ([string]::IsNullOrWhiteSpace($guidesCategory.Text)) { 'General' } else { $guidesCategory.Text.Trim() }
      $heroImage = if ([string]::IsNullOrWhiteSpace($guidesHero.Text)) { '' } else { Normalize-ImageUrl $guidesHero.Text }
      $guidesHero.Text = $heroImage

      $astroContent = Build-GuideAstroContent `
        -TemplatePath $guideTemplatePath `
        -Title $title `
        -Description $description `
        -Category $category `
        -Date $date `
        -HeroImage $heroImage `
        -Tags $tags `
        -Featured $guidesFeatured.Checked `
        -OutlineRaw $guidesBody.Text

      if ($editModeCheck.Checked) {
        $filePath = Write-TextFileDirect -FilePath $saveExistingPath -Content $astroContent
      } else {
        $filePath = Write-TextFile -Directory $guidePagesRoot -FileName ("$slug.astro") -Content $astroContent
      }

      if ($filePath) {
        $guidesBody.Text = $astroContent
      }
    }
  }

  if ($filePath) {
    $verb = if ($editModeCheck.Checked) { 'Updated' } else { 'Created' }
    $statusLabel.Text = "${verb}: $filePath"
    $lastSavedFilePath = $filePath
    [void][System.Windows.Forms.MessageBox]::Show(
      "File $($verb.ToLowerInvariant()):`n$filePath",
      'Success',
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Information
    )
  } else {
    $statusLabel.Text = 'No file saved.'
  }
})

Switch-Tab -TabName 'Art'

[void]$form.ShowDialog()