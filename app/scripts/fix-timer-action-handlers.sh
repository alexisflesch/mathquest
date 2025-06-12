#!/bin/bash

# Fix backend timer action handlers to use unit-explicit naming
# Focuses on the critical timerAction.ts file

set -e

echo "🔧 Fixing backend timer action handlers..."

# Primary target: the main timer action handler
TIMER_ACTION_FILE="/home/aflesch/mathquest/app/backend/src/sockets/handlers/teacherControl/timerAction.ts"

if [[ -f "$TIMER_ACTION_FILE" ]]; then
    echo "📝 Updating: $TIMER_ACTION_FILE"
    
    # Fix timer object property references
    sed -i 's/timer\.duration/timer.durationMs/g' "$TIMER_ACTION_FILE"
    sed -i 's/timer\.timeRemaining/timer.timeRemainingMs/g' "$TIMER_ACTION_FILE"
    
    # Fix object literal assignments
    sed -i 's/duration:/durationMs:/g' "$TIMER_ACTION_FILE"
    sed -i 's/timeRemaining:/timeRemainingMs:/g' "$TIMER_ACTION_FILE"
    
    # Fix questionUid -> questionId for consistency  
    sed -i 's/questionUid/questionId/g' "$TIMER_ACTION_FILE"
    
    echo "✅ $TIMER_ACTION_FILE updated"
else
    echo "❌ Timer action file not found: $TIMER_ACTION_FILE"
fi

# Fix pause timer handler
PAUSE_TIMER_FILE="/home/aflesch/mathquest/app/backend/src/sockets/handlers/teacherControl/pauseTimer.ts"

if [[ -f "$PAUSE_TIMER_FILE" ]]; then
    echo "📝 Updating: $PAUSE_TIMER_FILE"
    
    sed -i 's/timer\.duration/timer.durationMs/g' "$PAUSE_TIMER_FILE"
    sed -i 's/timer\.timeRemaining/timer.timeRemainingMs/g' "$PAUSE_TIMER_FILE"
    sed -i 's/duration:/durationMs:/g' "$PAUSE_TIMER_FILE"
    sed -i 's/timeRemaining:/timeRemainingMs:/g' "$PAUSE_TIMER_FILE"
    
    echo "✅ $PAUSE_TIMER_FILE updated"
fi

# Fix helper functions
HELPERS_FILE="/home/aflesch/mathquest/app/backend/src/sockets/handlers/teacherControl/helpers.ts"

if [[ -f "$HELPERS_FILE" ]]; then
    echo "📝 Updating: $HELPERS_FILE"
    
    sed -i 's/backendTimer\.duration/backendTimer.durationMs/g' "$HELPERS_FILE"
    sed -i 's/backendTimer\.timeRemaining/backendTimer.timeRemainingMs/g' "$HELPERS_FILE"
    sed -i 's/duration:/durationMs:/g' "$HELPERS_FILE"
    sed -i 's/timeRemaining:/timeRemainingMs:/g' "$HELPERS_FILE"
    
    echo "✅ $HELPERS_FILE updated"
fi

# Fix shared live handler
SHARED_LIVE_FILE="/home/aflesch/mathquest/app/backend/src/sockets/handlers/sharedLiveHandler.ts"

if [[ -f "$SHARED_LIVE_FILE" ]]; then
    echo "📝 Updating: $SHARED_LIVE_FILE"
    
    sed -i 's/timerObj\.duration/timerObj.durationMs/g' "$SHARED_LIVE_FILE"
    sed -i 's/timerObj\.timeRemaining/timerObj.timeRemainingMs/g' "$SHARED_LIVE_FILE"
    
    echo "✅ $SHARED_LIVE_FILE updated"
fi

echo ""
echo "🔍 Verification - checking for remaining issues in timer handlers..."

# Check for remaining legacy references
echo "Checking for legacy 'duration' property access:"
find /home/aflesch/mathquest/app/backend/src/sockets/handlers -name "*.ts" -exec grep -l "\.duration[^M]" {} \; 2>/dev/null || echo "  ✅ No legacy .duration found"

echo ""
echo "Checking for legacy 'timeRemaining' property access:"
find /home/aflesch/mathquest/app/backend/src/sockets/handlers -name "*.ts" -exec grep -l "\.timeRemaining[^M]" {} \; 2>/dev/null || echo "  ✅ No legacy .timeRemaining found"

echo ""
echo "✅ Backend timer action handlers updated!"
