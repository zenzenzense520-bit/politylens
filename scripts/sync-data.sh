#!/usr/bin/env bash
# 修改：数据同步通过统一脚本记录日志，任一来源失败即停止。
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p logs
# PowerShell 7 按 UTF-8 读取中文脚本，避免 Windows PowerShell 5 的默认编码损坏。
pwsh.exe -NoProfile -File scripts/data/sync.ps1 2>&1 | tee logs/sync-data.log
node scripts/data/correct-boundaries.mjs 2>&1 | tee -a logs/sync-data.log
