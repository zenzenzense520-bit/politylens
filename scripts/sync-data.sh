#!/usr/bin/env bash
# 修改：数据同步通过统一脚本记录日志，任一来源失败即停止。
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p logs
# PowerShell 7 按 UTF-8 读取中文脚本，避免 Windows PowerShell 5 的默认编码损坏。
pwsh.exe -NoProfile -File scripts/data/sync.ps1 2>&1 | tee logs/sync-data.log
# 修改：世界银行 WDI 改走逐年校验同步，保留既有 WGI 快照。
bash scripts/sync-world-bank.sh 2>&1 | tee -a logs/sync-data.log
node scripts/data/correct-boundaries.mjs 2>&1 | tee -a logs/sync-data.log
bash scripts/sync-cliopatria.sh 2>&1 | tee -a logs/sync-data.log
# 修改：同步 V-Dem 五大民主指数并保留来源哈希。
bash scripts/sync-vdem.sh 2>&1 | tee -a logs/sync-data.log
# 修改：重建固化来源的 COW NMC 摘录，随后运行全量本地数据回归。
bash scripts/sync-nmc.sh 2>&1 | tee -a logs/sync-data.log
bash scripts/check.sh 2>&1 | tee -a logs/sync-data.log
