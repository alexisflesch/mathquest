#!/bin/bash

# Script to fix FilteredQuestion.type -> FilteredQuestion.questionType migration
# This script replaces all instances in frontend test and source files

echo "🔧 Fixing FilteredQuestion.type -> questionType migration..."

# Files to fix based on TypeScript errors
FILES=(
    "frontend/src/hooks/__tests__/useStudentGameSocket.stateUpdates.test.ts"
    "frontend/src/hooks/__tests__/useStudentGameSocket.timer.test.ts" 
    "frontend/src/hooks/useStudentGameSocket.ts"
)

for file in "${FILES[@]}"; do
    if [[ -f "/home/aflesch/mathquest/app/$file" ]]; then
        echo "📝 Fixing $file..."
        
        # Replace object property definitions: type: -> questionType:
        sed -i 's/\s*type: '"'"'/                questionType: '"'"'/g' "/home/aflesch/mathquest/app/$file"
        
        # Replace property access: .type -> .questionType
        sed -i 's/\.type)/\.questionType)/g' "/home/aflesch/mathquest/app/$file"
        sed -i 's/\.type\.toBe/\.questionType\.toBe/g' "/home/aflesch/mathquest/app/$file"
        sed -i 's/Question\.type/Question\.questionType/g' "/home/aflesch/mathquest/app/$file"
        
        echo "✅ Fixed $file"
    else
        echo "❌ File not found: $file"
    fi
done

echo "🎉 Migration script completed!"
echo "🔍 Run 'npx tsc --noEmit' to verify fixes..."
