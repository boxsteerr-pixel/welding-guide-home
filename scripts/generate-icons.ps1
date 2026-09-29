param([int[]]$Sizes = @(192, 512))

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$outputDirectory = Join-Path $PSScriptRoot '..\assets\icons'

foreach ($size in $Sizes) {
  $bitmap = [System.Drawing.Bitmap]::new($size, $size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::FromArgb(18, 59, 93))

  $margin = [int]($size * 0.205)
  $panel = [System.Drawing.Rectangle]::new($margin, [int]($size * 0.245), $size - (2 * $margin), [int]($size * 0.51))
  $graphics.FillRectangle([System.Drawing.Brushes]::White, $panel)
  $header = [System.Drawing.Rectangle]::new($panel.X + [int]($size * 0.055), $panel.Y + [int]($size * 0.055), $panel.Width - [int]($size * 0.11), [int]($size * 0.09))
  $graphics.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(39, 138, 197)), $header)
  $tileBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(18, 59, 93))
  $tileWidth = [int]($size * 0.18)
  $tileHeight = [int]($size * 0.11)
  $tileY = $panel.Y + [int]($size * 0.23)
  $graphics.FillRectangle($tileBrush, $panel.X + [int]($size * 0.055), $tileY, $tileWidth, $tileHeight)
  $graphics.FillRectangle($tileBrush, $panel.Right - [int]($size * 0.055) - $tileWidth, $tileY, $tileWidth, $tileHeight)

  $bolt = [System.Drawing.Point[]]@(
    [System.Drawing.Point]::new([int]($size * .72), [int]($size * .12)),
    [System.Drawing.Point]::new([int]($size * .63), [int]($size * .31)),
    [System.Drawing.Point]::new([int]($size * .72), [int]($size * .31)),
    [System.Drawing.Point]::new([int]($size * .61), [int]($size * .49)),
    [System.Drawing.Point]::new([int]($size * .65), [int]($size * .35)),
    [System.Drawing.Point]::new([int]($size * .57), [int]($size * .35)),
    [System.Drawing.Point]::new([int]($size * .66), [int]($size * .12))
  )
  $graphics.FillPolygon([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 189, 74)), $bolt)
  $graphics.Dispose()
  $bitmap.Save((Join-Path $outputDirectory "icon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}
