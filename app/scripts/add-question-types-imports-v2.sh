#!/bin/bash

# Better script to add QUESTION_TYPES imports to frontend files
# Part of Phase 3A: Question Type Constants migration

set -e

echo "🔧 Adding QUESTION_TYPES imports to frontend files..."

FRONTEND_DIR="/home/aflesch/mathquest/app/frontend"

# Function to add import to a file
add_import_to_file() {
    local file="$1"
    local filepath="$FRONTEND_DIR/$file"
    
    if [[ ! -f "$filepath" ]]; then
        echo "  ⚠️  File not found: $file"
        return 1
    fi
    
    # Check if the import already exists
    if grep -q "import.*QUESTION_TYPES.*@shared/types" "$filepath"; then
        echo "  ✅ Import already exists: $file"
        return 0
    fi
    
    echo "  📝 Adding import to: $file"
    
    # Use sed to add import after the last import line
    # Find the last line that starts with 'import' or 'export ... from'
    local last_import_line=$(grep -n "^import\|^export.*from" "$filepath" | tail -1 | cut -d: -f1)
    
    if [[ -n "$last_import_line" ]]; then
        # Insert the import after the last import
        sed -i "${last_import_line}a\\import { QUESTION_TYPES } from '@shared/types';" "$filepath"
    else
        # No imports found, add at the top (after any comments)
        sed -i "1i\\import { QUESTION_TYPES } from '@shared/types';" "$filepath"
    fi
    
    return 0
}

# Files that need the import (based on TypeScript errors)
FILES_NEEDING_IMPORT=(
    "src/app/student/practice/session/page.tsx"
    "src/app/teacher/dashboard/[code]/page.tsx"
    "src/app/teacher/games/new/page.tsx"
    "src/app/teacher/projection/[gameCode]/page.tsx"
    "src/app/teacher/quiz/create/page.tsx"
    "src/hooks/__tests__/usePracticeGameSocket.test.ts"
    "src/hooks/__tests__/useStudentGameSocket.eventListeners.test.ts"
    "src/hooks/__tests__/useStudentGameSocket.stateUpdates.test.ts"
    "src/hooks/__tests__/useStudentGameSocket.timer.test.ts"
    "src/hooks/__tests__/useTeacherQuizSocket.eventListeners.test.ts"
    "src/hooks/__tests__/useTeacherQuizSocket.stateUpdates.test.ts"
    "src/hooks/__tests__/useTeacherQuizSocket.timer.test.ts"
    "src/hooks/useUnifiedGameManager.ts"
)

count=0

for file in "${FILES_NEEDING_IMPORT[@]}"; do
    if add_import_to_file "$file"; then
        ((count++))
    fi
done

echo "✅ Processed $count files"
