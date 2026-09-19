#!/usr/bin/env bash
set -euo pipefail
# 修改：下载 ClioPatria、生成项目所需逐年快照并记录日志。
cd "$(dirname "$0")/.."
mkdir -p logs
pwsh.exe -NoProfile -File scripts/data/sync-cliopatria.ps1 2>&1 | tee logs/sync-cliopatria.log
input="$(tr -d '\r\n' < logs/cache/cliopatria/input-path.txt)"
node_modules/.bin/esbuild scripts/data/generate-cliopatria.ts --bundle --platform=node --format=cjs --outfile=logs/generate-cliopatria.cjs
node logs/generate-cliopatria.cjs "$input" 2>&1 | tee -a logs/sync-cliopatria.log
