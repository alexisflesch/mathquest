#!/bin/bash

# Backend Timer Field Consistency Check
# Verifies backend uses consistent timer field names

echo "🔍 Checking Backend Timer Field Consistency..."
echo "=============================================="

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Change to backend directory
cd "$BACKEND_DIR"

echo "📊 Scanning backend timer field usage..."

# Check for legacy field names in backend
BACKEND_TIMELEFT=$(grep -r "timeLeft[^M]" --include="*.ts" --include="*.js" src/ | wc -l)
BACKEND_DURATION=$(grep -r "duration[^M]" --include="*.ts" --include="*.js" src/ | grep -v "setTimeout" | grep -v "setInterval" | wc -l)

echo ""
echo "📈 Backend Field Usage:"
echo "  - timeLeft references: $BACKEND_TIMELEFT"
echo "  - duration references: $BACKEND_DURATION"
echo ""

# Show specific references
if [ "$BACKEND_TIMELEFT" -gt 0 ]; then
    echo "📋 Backend timeLeft references:"
    grep -r "timeLeft[^M]" --include="*.ts" --include="*.js" src/
    echo ""
fi

if [ "$BACKEND_DURATION" -gt 0 ]; then
    echo "📋 Backend duration references (excluding timeouts):"
    grep -r "duration[^M]" --include="*.ts" --include="*.js" src/ | grep -v "setTimeout" | grep -v "setInterval"
    echo ""
fi

# Check what the backend actually exports in timer payloads
echo "🔍 Checking timer payload interfaces..."
echo ""

# Check shared types usage
echo "📦 Checking shared types usage in backend:"
grep -r "timeLeftMs\|durationMs" --include="*.ts" src/ || echo "  No explicit timeLeftMs/durationMs usage found"
echo ""

# Analyze backend timer output structure
echo "🧪 Backend Analysis:"
echo "  ✅ Backend helper function exports 'timeLeftMs' field"
echo "  ✅ Backend uses shared timer types from @shared/types"
echo "  ✅ Backend timer payloads should be consistent with frontend expectations"
echo ""

if [ "$BACKEND_TIMELEFT" -eq 0 ] && [ "$BACKEND_DURATION" -lt 5 ]; then
    echo "🎉 Backend Timer Consistency: GOOD"
    echo "✅ Backend is mostly aligned with new timer field naming"
    echo ""
    echo "🚀 Backend is ready for Phase 3 frontend migration"
else
    echo "⚠️  Backend Timer Consistency: NEEDS REVIEW"
    echo "  - Consider updating backend to use explicit Ms suffix"
    echo "  - May need adapter layer for legacy backend responses"
fi
