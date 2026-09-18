#!/usr/bin/env bash
# 修改：从固化 CSV 重新生成 NMC 国力数据 nmc.json，并保留日志。
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p logs
node scripts/data/generate-nmc.mjs 2>&1 | tee logs/sync-nmc.log
