#!/bin/bash

# Fix gameStateService.ts timer field references
# Updates the implementation to use durationMs and timeRemainingMs

set -e

FILE="/home/aflesch/mathquest/app/backend/src/core/gameStateService.ts"

echo "🔧 Fixing gameStateService.ts timer field references..."

# Fix the specific lines we found with grep
# Line 172: duration: 0 -> durationMs: 0
sed -i 's/duration: 0,/durationMs: 0,/g' "$FILE"

# Line 270: duration: (question.timeLimit...) -> durationMs: (question.timeLimit...)
sed -i 's/duration: (question\.timeLimit/durationMs: (question.timeLimit/g' "$FILE"

# Line 393: gameState.timer.duration -> gameState.timer.durationMs  
sed -i 's/gameState\.timer\.duration/gameState.timer.durationMs/g' "$FILE"

# Line 392: gameState.timer.timeRemaining -> gameState.timer.timeRemainingMs
sed -i 's/gameState\.timer\.timeRemaining/gameState.timer.timeRemainingMs/g' "$FILE"

echo "✅ gameStateService.ts timer fields updated!"

# Verify the changes
echo ""
echo "📋 Verification - checking for remaining legacy field names:"
echo "Legacy 'duration' references (should be empty):"
grep -n "\.duration" "$FILE" || echo "  ✅ No legacy .duration references found"

echo ""
echo "Legacy 'timeRemaining' references (should be empty):"  
grep -n "\.timeRemaining[^M]" "$FILE" || echo "  ✅ No legacy .timeRemaining references found"

echo ""
echo "New 'durationMs' references:"
grep -n "\.durationMs" "$FILE" || echo "  ❌ No durationMs references found"

echo ""
echo "New 'timeRemainingMs' references:"
grep -n "\.timeRemainingMs" "$FILE" || echo "  ❌ No timeRemainingMs references found"
