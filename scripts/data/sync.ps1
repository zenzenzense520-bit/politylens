# 修改：固定上游版本，下载真实边界与世界银行原始观测，并保存来源和校验和。
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$boundaryDir = Join-Path $root 'public/data/historical-basemaps'
$rawBoundaryDir = Join-Path $boundaryDir 'raw'
$observationDir = Join-Path $root 'public/data/observations'
New-Item -ItemType Directory -Force $observationDir,$rawBoundaryDir | Out-Null
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
$countries = 'CHN;USA;DEU;JPN;GBR;FRA;IND;RUS'
$indicators = @(
  @{ code = 'NY.GDP.MKTP.CD'; label = 'GDP（现价美元）'; unit = '美元'; sourceId = 2 },
  @{ code = 'NY.GDP.PCAP.CD'; label = '人均 GDP（现价美元）'; unit = '美元/人'; sourceId = 2 },
  @{ code = 'SP.POP.TOTL'; label = '总人口'; unit = '人'; sourceId = 2 },
  @{ code = 'GOV_WGI_GE.EST'; label = '政府效能（WGI 2025 修订）'; unit = '原始估计值，通常约 -2.5～2.5'; sourceId = 3 },
  @{ code = 'GOV_WGI_RL.EST'; label = '法治（WGI 2025 修订）'; unit = '原始估计值，通常约 -2.5～2.5'; sourceId = 3 },
  @{ code = 'GOV_WGI_CC.EST'; label = '腐败控制（WGI 2025 修订）'; unit = '原始估计值，通常约 -2.5～2.5'; sourceId = 3 }
)
$records = @()
$sources = @()
foreach ($indicator in $indicators) {
  $url = "https://api.worldbank.org/v2/country/$countries/indicator/$($indicator.code)?source=$($indicator.sourceId)&date=1960:2024&format=json&per_page=10000"
  $response = Invoke-RestMethod $url
  if ($response.Count -ne 2 -or $response[0].pages -ne 1) { throw "响应不完整：$($indicator.code)" }
  $sources += [ordered]@{ code = $indicator.code; label = $indicator.label; unit = $indicator.unit; url = $url; updated = $response[0].lastupdated; sourceId = $indicator.sourceId }
  foreach ($row in $response[1]) {
    if ([int]$row.date -notin @(1966, 1995, 2020, 2021, 2024)) { continue }
    $records += [ordered]@{ iso = $row.countryiso3code; year = [int]$row.date; code = $indicator.code; value = $row.value; status = $(if ($null -eq $row.value) { 'missing' } else { 'observed' }); decimal = $row.decimal }
  }
  Write-Output "已获取 $($indicator.code)，来源更新时间 $($response[0].lastupdated)"
}
[ordered]@{ publisher = 'World Bank'; retrievedAt = (Get-Date).ToUniversalTime().ToString('o'); sources = $sources; records = $records } | ConvertTo-Json -Depth 8 | Set-Content "$observationDir/world-bank.json" -Encoding utf8
