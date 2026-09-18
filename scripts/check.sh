#!/usr/bin/env bash
# 修改：复用已安装的 esbuild 验证 TypeScript 规则，无新增依赖。
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p logs
node_modules/.bin/esbuild scripts/tests/data-check.ts --bundle --platform=node --format=cjs --outfile=logs/data-check.cjs
node logs/data-check.cjs 2>&1 | tee logs/data-check.log
