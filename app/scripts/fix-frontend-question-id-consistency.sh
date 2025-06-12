#!/bin/bash

# Fix Frontend questionId vs questionUid Consistency
# This script updates all frontend files to use consistent questionUid naming

set -e

echo "🔧 Frontend Question ID Consistency Fix Script"
echo "=============================================="

FRONTEND_DIR="/home/aflesch/mathquest/app/frontend"
BACKUP_DIR="/tmp/frontend-question-id-backup-$(date +%Y%m%d-%H%M%S)"

# Create backup
echo "📦 Creating backup at $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
cp -r "$FRONTEND_DIR/src" "$BACKUP_DIR/"

echo "🔍 Scanning for questionId references in frontend..."

# Function to update files
update_file() {
    local file="$1"
    local description="$2"
    
    if [[ ! -f "$file" ]]; then
        echo "⚠️  File not found: $file"
        return
    fi
    
    echo "🔄 Updating $description: $(basename "$file")"
    
    # Create temporary file
    local temp_file=$(mktemp)
    
    # Apply multiple sed replacements in sequence
    sed \
        -e 's/questionId:/questionUid:/g' \
        -e 's/questionId,/questionUid,/g' \
        -e 's/questionId\s*}/questionUid }/g' \
        -e 's/questionId\([^a-zA-Z0-9_]\)/questionUid\1/g' \
        -e 's/\.questionId\b/.questionUid/g' \
        -e 's/currentQuestionId/currentQuestionUid/g' \
        -e 's/timerQuestionId/timerQuestionUid/g' \
        -e 's/(questionId:/(questionUid:/g' \
        -e 's/{ questionId/{ questionUid/g' \
        -e 's/questionId\s*=\s*/questionUid = /g' \
        -e 's/questionId\s*\?/questionUid?/g' \
        -e 's/questionId\s*!/questionUid!/g' \
        -e 's/questionId\s*\.\s*/questionUid./g' \
        -e 's/emitTimerAction.*questionId/emitTimerAction(action, questionUid, duration)/g' \
        "$file" > "$temp_file"
    
    # Check if file actually changed
    if ! cmp -s "$file" "$temp_file"; then
        mv "$temp_file" "$file"
        echo "✅ Updated: $(basename "$file")"
    else
        rm "$temp_file"
        echo "⏭️  No changes needed: $(basename "$file")"
    fi
}

# Update specific critical files first
echo ""
echo "🎯 Updating critical files..."

# useUnifiedGameManager.ts - Fix the remaining questionId reference in dependency array
if [[ -f "$FRONTEND_DIR/src/hooks/useUnifiedGameManager.ts" ]]; then
    echo "🔄 Fixing useUnifiedGameManager.ts dependency array..."
    sed -i 's/timer\.timerState\.questionId/timer.timerState.questionUid/g' "$FRONTEND_DIR/src/hooks/useUnifiedGameManager.ts"
    echo "✅ Fixed useUnifiedGameManager.ts"
fi

# useTeacherQuizSocket.ts - Fix timerQuestionId
if [[ -f "$FRONTEND_DIR/src/hooks/useTeacherQuizSocket.ts" ]]; then
    echo "🔄 Fixing useTeacherQuizSocket.ts..."
    sed -i \
        -e 's/timerQuestionId/timerQuestionUid/g' \
        -e 's/questionId:/questionUid:/g' \
        -e 's/emitTimerAction.*questionId.*duration/emitTimerAction(action: string, questionUid?: string, duration?: number)/g' \
        "$FRONTEND_DIR/src/hooks/useTeacherQuizSocket.ts"
    echo "✅ Fixed useTeacherQuizSocket.ts"
fi

# Update all hook files
echo ""
echo "🔗 Updating hook files..."
find "$FRONTEND_DIR/src/hooks" -name "*.ts" -type f | while read -r file; do
    case "$(basename "$file")" in
        useGameTimer.ts|useUnifiedGameManager.ts|useTeacherQuizSocket.ts)
            echo "⏭️  Skipping already updated: $(basename "$file")"
            ;;
        *)
            update_file "$file" "hook"
            ;;
    esac
done

# Update test files
echo ""
echo "🧪 Updating test files..."
find "$FRONTEND_DIR/src" -name "*.test.ts" -o -name "*.test.tsx" -o -name "__tests__" -type d | while read -r path; do
    if [[ -d "$path" ]]; then
        find "$path" -name "*.ts" -o -name "*.tsx" | while read -r file; do
            update_file "$file" "test file"
        done
    else
        update_file "$path" "test file"
    fi
done

# Update migration files
echo ""
echo "📦 Updating migration files..."
if [[ -d "$FRONTEND_DIR/src/hooks/migrations" ]]; then
    find "$FRONTEND_DIR/src/hooks/migrations" -name "*.ts" -type f | while read -r file; do
        update_file "$file" "migration"
    done
fi

# Update component files that might reference timer state
echo ""
echo "🎨 Updating component files..."
find "$FRONTEND_DIR/src" -name "*.tsx" -type f | grep -E "(component|page|layout)" | while read -r file; do
    # Only update files that actually contain questionId references
    if grep -q "questionId" "$file" 2>/dev/null; then
        update_file "$file" "component"
    fi
done

# Update utility files
echo ""
echo "🛠️  Updating utility files..."
find "$FRONTEND_DIR/src/utils" -name "*.ts" -type f 2>/dev/null | while read -r file; do
    if grep -q "questionId" "$file" 2>/dev/null; then
        update_file "$file" "utility"
    fi
done

# Special handling for specific patterns
echo ""
echo "🎯 Applying special pattern fixes..."

# Fix function parameter patterns
find "$FRONTEND_DIR/src" -name "*.ts" -o -name "*.tsx" | xargs sed -i \
    -e 's/start(questionId:/start(questionUid:/g' \
    -e 's/start(\s*questionId\s*,/start(questionUid,/g' \
    -e 's/(questionId\s*:\s*string)/(questionUid: string)/g' \
    -e 's/function.*questionId.*string/function(questionUid: string)/g'

# Fix object destructuring patterns
find "$FRONTEND_DIR/src" -name "*.ts" -o -name "*.tsx" | xargs sed -i \
    -e 's/{\s*questionId\s*}/{ questionUid }/g' \
    -e 's/{\s*questionId\s*,/{ questionUid,/g' \
    -e 's/,\s*questionId\s*}/, questionUid }/g'

# Fix interface and type definitions
find "$FRONTEND_DIR/src" -name "*.ts" -o -name "*.tsx" | xargs sed -i \
    -e 's/questionId\?\s*:\s*string/questionUid?: string/g' \
    -e 's/questionId\s*:\s*string/questionUid: string/g' \
    -e 's/questionId\s*:\s*string\s*|/questionUid: string |/g'

echo ""
echo "🔍 Checking for any remaining questionId references..."

# Find remaining questionId references (excluding node_modules, .git, etc.)
REMAINING_REFS=$(find "$FRONTEND_DIR/src" -name "*.ts" -o -name "*.tsx" | xargs grep -l "questionId" 2>/dev/null | head -10)

if [[ -n "$REMAINING_REFS" ]]; then
    echo "⚠️  Found remaining questionId references in:"
    echo "$REMAINING_REFS"
    echo ""
    echo "🔍 Showing context for manual review..."
    echo "$REMAINING_REFS" | head -3 | while read -r file; do
        echo "--- $file ---"
        grep -n "questionId" "$file" | head -3
        echo ""
    done
else
    echo "✅ No remaining questionId references found!"
fi

echo ""
echo "📊 Summary:"
echo "- Backup created at: $BACKUP_DIR"
echo "- Updated files in: $FRONTEND_DIR/src"
echo "- Converted questionId → questionUid throughout frontend"
echo "- Converted currentQuestionId → currentQuestionUid"
echo "- Converted timerQuestionId → timerQuestionUid"
echo ""
echo "🎯 Next steps:"
echo "1. Run TypeScript compilation: npm run type-check"
echo "2. Run tests: npm test"
echo "3. Check for any remaining compilation errors"
echo ""
echo "✅ Frontend question ID consistency fix completed!"
