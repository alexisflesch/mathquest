#!/bin/bash

# Fix remaining backend timer field references
# Handles any remaining legacy timer field names

set -e

echo "🔧 Fixing remaining backend timer field references..."

# Fix specific files that still have legacy references
FILES_TO_FIX=(
    "/home/aflesch/mathquest/app/backend/src/sockets/handlers/sharedLiveHandler.ts"
    "/home/aflesch/mathquest/app/backend/src/sockets/handlers/teacherControl/startTimer.ts"
    "/home/aflesch/mathquest/app/backend/src/sockets/handlers/sharedGameFlow.ts"
)

for file in "${FILES_TO_FIX[@]}"; do
    if [[ -f "$file" ]]; then
        echo "📝 Processing: $file"
        
        # More comprehensive replacements
        # Fix timer object properties with word boundaries
        sed -i 's/\btimerObj\.duration\b/timerObj.durationMs/g' "$file"
        sed -i 's/\btimer\.duration\b/timer.durationMs/g' "$file"
        sed -i 's/\btimerObj\.timeRemaining\b/timerObj.timeRemainingMs/g' "$file"
        sed -i 's/\btimer\.timeRemaining\b/timer.timeRemainingMs/g' "$file"
        
        # Fix object literal properties
        sed -i 's/\bduration:\s*/durationMs: /g' "$file"
        sed -i 's/\btimeRemaining:\s*/timeRemainingMs: /g' "$file"
        
        # Fix variable references
        sed -i 's/\bconst duration\b/const durationMs/g' "$file"
        sed -i 's/\blet duration\b/let durationMs/g' "$file"
        sed -i 's/\bvar duration\b/var durationMs/g' "$file"
        
        echo "✅ $file updated"
    else
        echo "⚠️ File not found: $file"
    fi
done

# Find and fix any remaining timer-related files
echo ""
echo "🔍 Scanning for remaining legacy timer field usage..."

# Find files with legacy timer property access
LEGACY_FILES=$(find /home/aflesch/mathquest/app/backend/src -name "*.ts" -exec grep -l "\.duration[^M]" {} \; 2>/dev/null | head -5)

if [[ -n "$LEGACY_FILES" ]]; then
    echo "Found files with legacy .duration:"
    echo "$LEGACY_FILES"
    
    echo "$LEGACY_FILES" | while read -r file; do
        if [[ -f "$file" ]]; then
            echo "📝 Auto-fixing: $file"
            sed -i 's/\.duration\b/.durationMs/g' "$file"
        fi
    done
fi

LEGACY_TIME_FILES=$(find /home/aflesch/mathquest/app/backend/src -name "*.ts" -exec grep -l "\.timeRemaining[^M]" {} \; 2>/dev/null | head -5)

if [[ -n "$LEGACY_TIME_FILES" ]]; then
    echo "Found files with legacy .timeRemaining:"
    echo "$LEGACY_TIME_FILES"
    
    echo "$LEGACY_TIME_FILES" | while read -r file; do
        if [[ -f "$file" ]]; then
            echo "📝 Auto-fixing: $file"
            sed -i 's/\.timeRemaining\b/.timeRemainingMs/g' "$file"
        fi
    done
fi

echo ""
echo "✅ Remaining backend timer field references fixed!"
echo ""
echo "🔍 Final verification:"
echo "Legacy .duration references remaining:"
find /home/aflesch/mathquest/app/backend/src -name "*.ts" -exec grep -n "\.duration[^M]" {} + 2>/dev/null | head -3 || echo "  ✅ None found"

echo ""
echo "Legacy .timeRemaining references remaining:"
find /home/aflesch/mathquest/app/backend/src -name "*.ts" -exec grep -n "\.timeRemaining[^M]" {} + 2>/dev/null | head -3 || echo "  ✅ None found"
