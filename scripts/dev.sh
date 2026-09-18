#!/usr/bin/env bash
set -euo pipefail
# 修改：固定工作目录并保留运行日志。
cd "$(dirname "$0")/.."
mkdir -p logs
npm run dev -- "$@" 2>&1 | tee logs/dev.log
