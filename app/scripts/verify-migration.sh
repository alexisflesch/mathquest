#!/bin/bash

# Phase 3: Migration Verification Script
# Verifies that timer field migration was successful

set -e

echo "🔍 Verifying Phase 3 Timer Field Migration..."
echo "============================================="

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Change to frontend directory
cd "$FRONTEND_DIR"

echo "📊 Scanning for remaining legacy timer field references..."

# Count remaining legacy references
TIMELEFT_COUNT=$(grep -r "timeLeft[^M]" --include="*.ts" --include="*.tsx" src/ | wc -l)
LOCALTIMELEFT_COUNT=$(grep -r "localTimeLeft[^M]" --include="*.ts" --include="*.tsx" src/ | wc -l)

# Count duration references (exclude UI-related ones)
DURATION_COUNT=$(grep -r "duration[^M]" --include="*.ts" --include="*.tsx" src/ | grep -v "transition" | grep -v "animation" | grep -v "setTimeout" | grep -v "setInterval" | wc -l)

echo ""
echo "📈 Migration Results:"
echo "  - timeLeft references remaining: $TIMELEFT_COUNT (target: 0)"
echo "  - localTimeLeft references remaining: $LOCALTIMELEFT_COUNT (target: 0)"  
echo "  - duration references remaining: $DURATION_COUNT (target: 0, excluding UI)"
echo ""

# Show specific remaining references for review
if [ "$TIMELEFT_COUNT" -gt 0 ]; then
    echo "⚠️  Remaining timeLeft references:"
    grep -r "timeLeft[^M]" --include="*.ts" --include="*.tsx" src/ | head -10
    echo ""
fi

if [ "$LOCALTIMELEFT_COUNT" -gt 0 ]; then
    echo "⚠️  Remaining localTimeLeft references:"
    grep -r "localTimeLeft[^M]" --include="*.ts" --include="*.tsx" src/ | head -10
    echo ""
fi

if [ "$DURATION_COUNT" -gt 0 ]; then
    echo "⚠️  Remaining duration references (excluding UI):"
    grep -r "duration[^M]" --include="*.ts" --include="*.tsx" src/ | grep -v "transition" | grep -v "animation" | grep -v "setTimeout" | grep -v "setInterval" | head -10
    echo ""
fi

# TypeScript compilation check
echo "🔍 Checking TypeScript compilation..."
if npm run type-check >/dev/null 2>&1; then
    echo "✅ TypeScript compilation successful"
    TS_SUCCESS=true
else
    echo "❌ TypeScript compilation failed"
    echo "Running detailed type check:"
    npm run type-check
    TS_SUCCESS=false
fi

echo ""

# Run timer-related tests
echo "🧪 Running timer-related tests..."
if npm test -- --testNamePattern="timer" --passWithNoTests >/dev/null 2>&1; then
    echo "✅ Timer tests passed"
    TESTS_SUCCESS=true
else
    echo "❌ Timer tests failed"
    echo "Running detailed tests:"
    npm test -- --testNamePattern="timer" --passWithNoTests
    TESTS_SUCCESS=false
fi

echo ""
echo "📋 Final Assessment:"

# Overall success check
if [ "$TIMELEFT_COUNT" -eq 0 ] && [ "$LOCALTIMELEFT_COUNT" -eq 0 ] && [ "$DURATION_COUNT" -eq 0 ] && [ "$TS_SUCCESS" = true ] && [ "$TESTS_SUCCESS" = true ]; then
    echo "🎉 Phase 3 Migration SUCCESSFUL!"
    echo "✅ All legacy timer field references eliminated"
    echo "✅ TypeScript compilation passes"
    echo "✅ All timer tests pass"
    echo ""
    echo "🚀 Ready for production deployment"
    exit 0
else
    echo "⚠️  Phase 3 Migration requires manual fixes:"
    
    if [ "$TIMELEFT_COUNT" -gt 0 ] || [ "$LOCALTIMELEFT_COUNT" -gt 0 ] || [ "$DURATION_COUNT" -gt 0 ]; then
        echo "  - Legacy field references need manual cleanup"
    fi
    
    if [ "$TS_SUCCESS" = false ]; then
        echo "  - TypeScript compilation errors need fixing"
    fi
    
    if [ "$TESTS_SUCCESS" = false ]; then
        echo "  - Timer test failures need investigation"
    fi
    
    echo ""
    echo "🛠️  Next steps:"
    echo "  1. Review remaining legacy references above"
    echo "  2. Fix TypeScript compilation errors"
    echo "  3. Fix failing timer tests"
    echo "  4. Re-run this verification script"
    
    exit 1
fi
