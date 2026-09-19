#!/usr/bin/env bash
set -euo pipefail
# 修改：通过统一脚本分析 ClioPatria 字段、年份覆盖和实体关系。
cd "$(dirname "$0")/.."
mkdir -p logs
input="${1:?请提供 cliopatria GeoJSON 路径}"
node_modules/.bin/esbuild scripts/data/inspect-cliopatria.ts --bundle --platform=node --format=cjs --outfile=logs/inspect-cliopatria.cjs
node logs/inspect-cliopatria.cjs "$input" | tee logs/cliopatria-inspection.json
