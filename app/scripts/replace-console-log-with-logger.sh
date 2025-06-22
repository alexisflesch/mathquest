#!/bin/bash
# Replace all console.log with logger.info in .ts and .tsx files (backend only)
# Usage: bash scripts/replace-console-log-with-logger.sh

set -e

ROOT_DIR="$(dirname "$0")/.."
cd "$ROOT_DIR"

# Find all .ts and .tsx files in backend (excluding node_modules, dist, etc)
find backend/src -type f \( -name '*.ts' -o -name '*.tsx' \) \
  ! -path '*/node_modules/*' ! -path '*/dist/*' \
  -exec sed -i 's/console\.log/logger.info/g' {} +

echo "All console.log replaced with logger.info in backend/src."
