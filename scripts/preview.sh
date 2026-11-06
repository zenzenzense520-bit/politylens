#!/usr/bin/env bash
set -euo pipefail
# Build once, then serve the production bundle at the project root.
cd "$(dirname "$0")/.."
mkdir -p logs
npm run preview -- --host 127.0.0.1 --port 4173 2>&1 | tee logs/preview.log
