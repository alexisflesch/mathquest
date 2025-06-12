#!/bin/bash

# Backend Timer Field Naming Consistency Fix
# Priority 1: Fix backend-frontend naming inconsistency
# 
# This script systematically updates ALL backend timer field names to match
# the unit-explicit naming convention used by the frontend:
# - timeRemaining -> timeRemainingMs  
# - duration -> durationMs
# - questionUid -> questionId (standardize)

set -e

echo "🔥 BACKEND TIMER NAMING CONSISTENCY FIX"
echo "========================================"
echo "Converting legacy timer field names to unit-explicit naming..."

# Base directory for backend files
BACKEND_DIR="/home/aflesch/mathquest/app/backend/src"

# Function to safely replace in files
safe_replace() {
    local pattern="$1"
    local replacement="$2" 
    local file="$3"
    
    # Check if file exists and pattern exists
    if [[ -f "$file" ]] && grep -q "$pattern" "$file"; then
        echo "  📝 Updating: $file"
        sed -i "s/$pattern/$replacement/g" "$file"
    fi
}

# Function to update timer field names in a file
update_timer_fields() {
    local file="$1"
    
    if [[ ! -f "$file" ]]; then
        return
    fi
    
    echo "🔧 Processing: $file"
    
    # Fix timeRemaining -> timeRemainingMs
    safe_replace "timeRemaining" "timeRemainingMs" "$file"
    
    # Fix .duration -> .durationMs (be careful with property access)
    safe_replace "\.duration" ".durationMs" "$file"
    safe_replace "duration:" "durationMs:" "$file"
    safe_replace "duration," "durationMs," "$file"
    safe_replace "duration " "durationMs " "$file"
    
    # Fix questionUid -> questionId for consistency
    safe_replace "questionUid" "questionId" "$file"
}

# 1. Fix gameStateService.ts (already partially done)
echo "1️⃣ Fixing gameStateService.ts implementation..."
update_timer_fields "$BACKEND_DIR/core/gameStateService.ts"

# 2. Fix timer action handlers
echo "2️⃣ Fixing timer action handlers..."
find "$BACKEND_DIR/sockets/handlers" -name "*.ts" -type f | while read -r file; do
    update_timer_fields "$file"
done

# 3. Fix shared live handler
echo "3️⃣ Fixing shared handlers..."
update_timer_fields "$BACKEND_DIR/sockets/handlers/sharedLiveHandler.ts"
update_timer_fields "$BACKEND_DIR/sockets/handlers/sharedGameFlow.ts"

# 4. Fix any remaining backend files
echo "4️⃣ Fixing remaining backend files..."
find "$BACKEND_DIR" -name "*.ts" -type f | while read -r file; do
    # Skip already processed files
    if [[ "$file" != *"/sockets/handlers/"* ]] && [[ "$file" != *"gameStateService.ts"* ]]; then
        update_timer_fields "$file"
    fi
done

# 5. Update backend type definitions
echo "5️⃣ Fixing backend type definitions..."
if [[ -f "$BACKEND_DIR/types" ]]; then
    find "$BACKEND_DIR/types" -name "*.ts" -type f | while read -r file; do
        update_timer_fields "$file"
    done
fi

echo ""
echo "✅ Backend timer field naming consistency fix completed!"
echo ""
echo "📋 Summary of changes:"
echo "  • timeRemaining → timeRemainingMs"
echo "  • duration → durationMs" 
echo "  • questionUid → questionId"
echo ""
echo "🚨 NEXT STEPS:"
echo "  1. Run TypeScript compilation to check for errors"
echo "  2. Update socket event emissions to use new field names"
echo "  3. Test backend-frontend communication"
