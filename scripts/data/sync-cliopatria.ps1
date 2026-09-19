$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '../..')
$cache = Join-Path $root 'logs/cache/cliopatria'
$output = Join-Path $root 'public/data/cliopatria'
New-Item -ItemType Directory -Force -Path $cache, $output | Out-Null
$zip = Join-Path $cache 'cliopatria.geojson.zip'
$extract = Join-Path $cache 'extracted'
New-Item -ItemType Directory -Force -Path $extract | Out-Null
$base = 'https://raw.githubusercontent.com/Seshat-Global-History-Databank/cliopatria/main'
Invoke-WebRequest "$base/cliopatria.geojson.zip" -OutFile $zip
Expand-Archive -LiteralPath $zip -DestinationPath $extract -Force
Invoke-WebRequest "$base/LICENSE.md" -OutFile (Join-Path $output 'LICENSE.md')
$geojson = Get-ChildItem -LiteralPath $extract -Filter '*.geojson' -File | Select-Object -First 1
if (-not $geojson) { throw 'ClioPatria 解压后未找到 GeoJSON' }
$geojson.FullName | Set-Content (Join-Path $cache 'input-path.txt') -Encoding utf8
Write-Output "ClioPatria 原始 SHA-256：$((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash)"
Write-Output "ClioPatria 输入：$($geojson.FullName)"
