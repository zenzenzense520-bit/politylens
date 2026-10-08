# 修改：此脚本仅同步固定版本历史边界；世界银行逐年观测改由 sync-world-bank.sh 校验后写入。
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$boundaryDir = Join-Path $root 'public/data/historical-basemaps'
$rawBoundaryDir = Join-Path $boundaryDir 'raw'
New-Item -ItemType Directory -Force $rawBoundaryDir | Out-Null
$revision = 'da7a4b735ecef70aebdc9c73e409d8a2500d50f3'
$baseUrl = "https://raw.githubusercontent.com/aourednik/historical-basemaps/$revision"
Invoke-WebRequest "$baseUrl/index.json" -OutFile "$boundaryDir/index.json"
$index = Get-Content "$boundaryDir/index.json" -Raw | ConvertFrom-Json
$snapshots = @()
foreach ($entry in ($index.years | Where-Object { $_.year -ge 1900 })) {
  $target = Join-Path $rawBoundaryDir $entry.filename
  Invoke-WebRequest "$baseUrl/geojson/$($entry.filename)" -OutFile "$target.pending"
  $geo = Get-Content "$target.pending" -Raw | ConvertFrom-Json
  if ($geo.type -ne 'FeatureCollection' -or $geo.features.Count -lt 1) { throw "无效边界 $($entry.filename)" }
  Move-Item -LiteralPath "$target.pending" -Destination $target -Force
  $snapshots += [ordered]@{ year = $entry.year; filename = $entry.filename; features = $geo.features.Count; sha256 = (Get-FileHash $target -Algorithm SHA256).Hash }
  Write-Output "已核验边界 $($entry.year)：$($geo.features.Count) 个区域"
}
[ordered]@{ revision = $revision; retrievedAt = (Get-Date).ToUniversalTime().ToString('o'); source = 'https://github.com/aourednik/historical-basemaps'; snapshots = $snapshots } | ConvertTo-Json -Depth 6 | Set-Content "$boundaryDir/raw-manifest.json" -Encoding utf8
