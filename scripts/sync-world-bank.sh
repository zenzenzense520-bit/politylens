#!/usr/bin/env bash
# 修改：世界银行 WDI 年度同步统一从 scripts 入口运行，日志写入 logs，失败即停止。
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p logs
node_modules/.bin/esbuild scripts/data/sync-world-bank.ts --bundle --platform=node --format=esm --outfile=logs/sync-world-bank.mjs 2>&1 | tee logs/sync-world-bank.log
node logs/sync-world-bank.mjs 2>&1 | tee -a logs/sync-world-bank.log
