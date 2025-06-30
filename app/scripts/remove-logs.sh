#!/bin/bash
# Script to remove all logger.whatever and console.log statements from backend/
# Usage: bash remove-logs.sh

set -e

BACKEND_DIR="$(dirname "$0")/../backend"

# Remove all logger.whatever (logger.info, logger.error, etc.)
find "$BACKEND_DIR" -type f -name '*.js' -o -name '*.ts' | while read -r file; do
  # Remove logger.<anything>(...);
  sed -i.bak -E '/logger\.[a-zA-Z0-9_]+\s*\(/d' "$file"
  # Remove console.log(...);
  sed -i.bak -E '/console\.log\s*\(/d' "$file"
  # Clean up backup
  rm -f "$file.bak"
done

echo "All logger.* and console.log statements removed from backend/"
