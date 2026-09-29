#!/usr/bin/env bash
# 修改：V-Dem 同步统一经 scripts 入口运行，日志写入 logs，失败直接终止。
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p logs
node_modules/.bin/esbuild scripts/data/sync-vdem.ts --bundle --platform=node --format=esm --outfile=logs/sync-vdem.mjs 2>&1 | tee logs/sync-vdem.log
node logs/sync-vdem.mjs 2>&1 | tee -a logs/sync-vdem.log
