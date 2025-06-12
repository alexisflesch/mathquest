#!/bin/bash

# Phase 3: Timer Field Migration Script
# Migrates legacy timer field names to new unit-explicit interface

set -e  # Exit on any error

echo "🚀 Starting Phase 3 Timer Field Migration..."
echo "================================================"

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Change to frontend directory
cd "$FRONTEND_DIR"

# Create backup with timestamp
BACKUP_DIR="src_backup_$(date +%Y%m%d_%H%M%S)"
echo "📁 Creating backup at: $BACKUP_DIR"
cp -r src/ "$BACKUP_DIR"

echo "🔧 Phase 1: Updating component interfaces..."
# Update TypeScript interfaces first
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/timeLeft\?\:/timeLeftMs\?\:/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/localTimeLeft\?\:/localTimeLeftMs\?\:/g'

echo "🔧 Phase 2: Updating component prop destructuring..."
# Update destructuring patterns (carefully)
find src/components/ -name "*.tsx" | xargs sed -i 's/{ timeLeft,/{ timeLeftMs,/g'
find src/components/ -name "*.tsx" | xargs sed -i 's/{ timeLeft }/{ timeLeftMs }/g'
find src/components/ -name "*.tsx" | xargs sed -i 's/, timeLeft,/, timeLeftMs,/g'
find src/components/ -name "*.tsx" | xargs sed -i 's/, timeLeft }/, timeLeftMs }/g'

# Update localTimeLeft patterns
find src/components/ -name "*.tsx" | xargs sed -i 's/{ localTimeLeft,/{ localTimeLeftMs,/g'
find src/components/ -name "*.tsx" | xargs sed -i 's/{ localTimeLeft }/{ localTimeLeftMs }/g'
find src/components/ -name "*.tsx" | xargs sed -i 's/, localTimeLeft,/, localTimeLeftMs,/g'
find src/components/ -name "*.tsx" | xargs sed -i 's/, localTimeLeft }/, localTimeLeftMs }/g'

echo "🔧 Phase 3: Updating variable declarations..."
# Update variable declarations (be more selective)
find src/components/ -name "*.tsx" | xargs sed -i 's/const timeLeft =/const timeLeftMs =/g'
find src/components/ -name "*.tsx" | xargs sed -i 's/let timeLeft =/let timeLeftMs =/g'
find src/components/ -name "*.tsx" | xargs sed -i 's/const localTimeLeft =/const localTimeLeftMs =/g'
find src/components/ -name "*.tsx" | xargs sed -i 's/let localTimeLeft =/let localTimeLeftMs =/g'

echo "🔧 Phase 4: Updating hook exports..."
# Update hook return objects
find src/hooks/ -name "*.ts" | xargs sed -i 's/timeLeft,/timeLeftMs,/g'
find src/hooks/ -name "*.ts" | xargs sed -i 's/localTimeLeft,/localTimeLeftMs,/g'

echo "🔧 Phase 5: Updating test files..."
# Update test mock objects and expectations
find src/ -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i 's/timeLeft:/timeLeftMs:/g'
find src/ -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i 's/localTimeLeft:/localTimeLeftMs:/g'

echo "🔧 Phase 6: Updating variable usage in component logic..."
# Update variable usage in expressions (more targeted)
find src/components/ -name "*.tsx" | xargs sed -i 's/timeLeft ?? /timeLeftMs ?? /g'
find src/components/ -name "*.tsx" | xargs sed -i 's/timeLeft !== /timeLeftMs !== /g'
find src/components/ -name "*.tsx" | xargs sed -i 's/timeLeft === /timeLeftMs === /g'
find src/components/ -name "*.tsx" | xargs sed -i 's/timeLeft > /timeLeftMs > /g'
find src/components/ -name "*.tsx" | xargs sed -i 's/timeLeft < /timeLeftMs < /g'
find src/components/ -name "*.tsx" | xargs sed -i 's/{timeLeft}/{timeLeftMs}/g'
find src/components/ -name "*.tsx" | xargs sed -i 's/(timeLeft)/(timeLeftMs)/g'

# Same for localTimeLeft
find src/components/ -name "*.tsx" | xargs sed -i 's/localTimeLeft ?? /localTimeLeftMs ?? /g'
find src/components/ -name "*.tsx" | xargs sed -i 's/localTimeLeft !== /localTimeLeftMs !== /g'
find src/components/ -name "*.tsx" | xargs sed -i 's/localTimeLeft === /localTimeLeftMs === /g'
find src/components/ -name "*.tsx" | xargs sed -i 's/localTimeLeft > /localTimeLeftMs > /g'
find src/components/ -name "*.tsx" | xargs sed -i 's/localTimeLeft < /localTimeLeftMs < /g'
find src/components/ -name "*.tsx" | xargs sed -i 's/{localTimeLeft}/{localTimeLeftMs}/g'
find src/components/ -name "*.tsx" | xargs sed -i 's/(localTimeLeft)/(localTimeLeftMs)/g'

echo "✅ Migration script completed!"
echo ""
echo "📊 Next step: Run verification script"
echo "    ./scripts/verify-migration.sh"
echo ""
echo "⚠️  If there are issues, restore from backup:"
echo "    rm -rf src/ && mv $BACKUP_DIR src/"
