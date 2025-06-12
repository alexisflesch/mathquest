#!/bin/bash

# Final Migration Verification Script
# Verifies complete unit clarity in timer naming

set -e

echo "🔍 Final Timer Unit Migration Verification"
echo "========================================"

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Change to frontend directory
cd "$FRONTEND_DIR"

echo "📊 Scanning for timer unit clarity..."

echo ""
echo "1️⃣ Checking for remaining ambiguous timer references..."

# Count any remaining timeLeft without Ms suffix (should be very few, mostly in tests)
AMBIGUOUS_TIMELEFT=$(grep -r "timeLeft[^M]" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | grep -v "timeLeftMs" | grep -v "localTimeLeftMs" | wc -l || echo "0")

# Count any remaining localTimeLeft without Ms suffix 
AMBIGUOUS_LOCALTIMELEFT=$(grep -r "localTimeLeft[^M]" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | grep -v "localTimeLeftMs" | wc -l || echo "0")

# Count any duration without Ms suffix (excluding CSS/animation durations)
AMBIGUOUS_DURATION=$(grep -r "duration[^M]" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | grep -v "transition" | grep -v "animation" | grep -v "durationMs" | wc -l || echo "0")

echo "  - Ambiguous timeLeft references: $AMBIGUOUS_TIMELEFT"
echo "  - Ambiguous localTimeLeft references: $AMBIGUOUS_LOCALTIMELEFT" 
echo "  - Ambiguous duration references: $AMBIGUOUS_DURATION"

echo ""
echo "2️⃣ Checking for proper unit-explicit naming..."

# Count explicit milliseconds references
MS_REFERENCES=$(grep -r "timeLeftMs\|localTimeLeftMs\|durationMs" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l || echo "0")

# Count explicit seconds references
S_REFERENCES=$(grep -r "timeLeftS\|timerS\|timeLimitSeconds" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l || echo "0")

echo "  - Explicit milliseconds references (Ms suffix): $MS_REFERENCES"
echo "  - Explicit seconds references (S/Seconds suffix): $S_REFERENCES"

echo ""
echo "3️⃣ Checking conversion utilities..."

# Check if conversion utilities exist
CONVERSION_UTILS=$(grep -r "timerConversions\|msToSecondsDisplay\|secondsToMsInternal" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l || echo "0")

echo "  - Timer conversion utility references: $CONVERSION_UTILS"

echo ""
echo "4️⃣ Checking display components..."

# Check TournamentTimer uses timerS
TOURNAMENT_TIMER_S=$(grep -r "timerS" src/components/TournamentTimer.tsx 2>/dev/null | wc -l || echo "0")

# Check formatTimer functions
FORMAT_TIMER_FUNCS=$(grep -r "formatTimer" --include="*.tsx" src/ 2>/dev/null | wc -l || echo "0")

echo "  - TournamentTimer timerS usage: $TOURNAMENT_TIMER_S"
echo "  - formatTimer functions found: $FORMAT_TIMER_FUNCS"

echo ""
echo "5️⃣ TypeScript compilation check..."

# Check TypeScript compilation
echo "  - Running TypeScript compilation check..."
if npm run type-check > /dev/null 2>&1; then
    echo "  ✅ TypeScript compilation: PASSED"
    TS_STATUS="✅ PASSED"
else
    echo "  ❌ TypeScript compilation: FAILED"
    TS_STATUS="❌ FAILED"
fi

echo ""
echo "📋 FINAL MIGRATION REPORT"
echo "========================"

# Calculate completion percentage
TOTAL_LEGACY_REFS=$((AMBIGUOUS_TIMELEFT + AMBIGUOUS_LOCALTIMELEFT))
TOTAL_EXPLICIT_REFS=$((MS_REFERENCES + S_REFERENCES))

if [ $TOTAL_EXPLICIT_REFS -gt 0 ]; then
    COMPLETION_PERCENT=$(( (TOTAL_EXPLICIT_REFS * 100) / (TOTAL_EXPLICIT_REFS + TOTAL_LEGACY_REFS) ))
else
    COMPLETION_PERCENT=0
fi

echo "📊 Migration Progress: ${COMPLETION_PERCENT}%"
echo ""
echo "✅ COMPLETED:"
echo "  - Explicit unit naming: $TOTAL_EXPLICIT_REFS references"
echo "  - Conversion utilities: $CONVERSION_UTILS references"
echo "  - TypeScript compilation: $TS_STATUS"
echo ""

if [ $TOTAL_LEGACY_REFS -gt 0 ]; then
    echo "🟡 REMAINING WORK:"
    echo "  - Legacy timer references: $TOTAL_LEGACY_REFS (mostly in test files)"
    echo ""
fi

echo "🎯 UNIT CLARITY STATUS:"
if [ $TOTAL_LEGACY_REFS -lt 20 ] && [ $TOTAL_EXPLICIT_REFS -gt 100 ]; then
    echo "  ✅ EXCELLENT - Nearly complete unit clarity achieved"
elif [ $TOTAL_LEGACY_REFS -lt 50 ] && [ $TOTAL_EXPLICIT_REFS -gt 50 ]; then
    echo "  🟡 GOOD - Most references are unit-explicit"
else
    echo "  🔴 NEEDS WORK - Many ambiguous references remain"
fi

echo ""
echo "📝 RECOMMENDATIONS:"

if [ $AMBIGUOUS_TIMELEFT -gt 10 ]; then
    echo "  - Update remaining timeLeft references to timeLeftMs or timeLeftS"
fi

if [ $AMBIGUOUS_LOCALTIMELEFT -gt 5 ]; then
    echo "  - Update remaining localTimeLeft references to localTimeLeftMs"
fi

if [ $CONVERSION_UTILS -eq 0 ]; then
    echo "  - Add timer conversion utilities for explicit unit handling"
fi

if [ "$TS_STATUS" = "❌ FAILED" ]; then
    echo "  - Fix TypeScript compilation errors before deployment"
fi

echo ""
echo "✅ Migration verification complete!"

if [ $COMPLETION_PERCENT -ge 85 ] && [ "$TS_STATUS" = "✅ PASSED" ]; then
    echo "🎉 MIGRATION SUCCESSFUL - Ready for production!"
    exit 0
else
    echo "⚠️  Additional work needed before deployment"
    exit 1
fi
