#!/bin/bash

# Script to add QUESTION_TYPES imports to frontend files
# Part of Phase 3A: Question Type Constants migration

set -e

echo "🔧 Adding QUESTION_TYPES imports to frontend files..."

FRONTEND_DIR="/home/aflesch/mathquest/app/frontend"
FILES_NEEDING_IMPORT=(
    "src/app/live/[code]/page.tsx"
    "src/app/live/__tests__/LiveGamePage.tournament.test.tsx"
    "src/app/student/practice/session/page.tsx"
    "src/app/teacher/dashboard/[code]/page.tsx"
    "src/app/teacher/games/new/page.tsx"
    "src/app/teacher/projection/[gameCode]/page.tsx"
    "src/app/teacher/quiz/create/page.tsx"
    "src/components/QuestionCard.tsx"
    "src/components/TournamentQuestionCard.tsx"
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
    filepath="$FRONTEND_DIR/$file"
    
    if [[ -f "$filepath" ]]; then
        # Check if the import already exists
        if ! grep -q "QUESTION_TYPES" "$filepath" || ! grep -q "@shared/types" "$filepath"; then
            echo "  📝 Adding import to: $file"
            
            # Find the last import line and add our import after it
            # Use a temporary file for safety
            temp_file=$(mktemp)
            
            # Find the line number of the last import
            last_import_line=$(grep -n "^import\|^export.*from" "$filepath" | tail -1 | cut -d: -f1)
            
            if [[ -n "$last_import_line" ]]; then
                # Insert the import after the last import line
                head -n "$last_import_line" "$filepath" > "$temp_file"
                echo "import { QUESTION_TYPES } from '@shared/types';" >> "$temp_file"
                tail -n +"$((last_import_line + 1))" "$filepath" >> "$temp_file"
                mv "$temp_file" "$filepath"
                ((count++))
            else
                # No imports found, add at the top
                echo "import { QUESTION_TYPES } from '@shared/types';" > "$temp_file"
                cat "$filepath" >> "$temp_file"
                mv "$temp_file" "$filepath"
                ((count++))
            fi
        else
            echo "  ✅ Import already exists: $file"
        fi
    else
        echo "  ⚠️  File not found: $file"
    fi
done

echo "✅ Added imports to $count files"
echo "🧪 Running TypeScript check..."

cd "$FRONTEND_DIR"
if npx tsc --noEmit; then
    echo "✅ TypeScript compilation successful!"
else
    echo "❌ TypeScript compilation failed. Check the errors above."
    exit 1
fi
