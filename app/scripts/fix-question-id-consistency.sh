#!/bin/bash

# Fix questionUid vs questionId consistency in backend
# Standardizes on questionId throughout the backend to match frontend expectations

set -e

echo "🔧 Fixing questionUid/questionId consistency in backend..."

# Function to safely replace questionUid with questionId
fix_question_id() {
    local file="$1"
    
    if [[ -f "$file" ]]; then
        echo "📝 Processing: $file"
        
        # Replace questionUid with questionId in:
        # - Variable names
        # - Object properties  
        # - Interface definitions
        # - Function parameters
        # - Comments
        
        sed -i 's/questionUid/questionId/g' "$file"
        echo "✅ $file updated"
    fi
}

# Fix all TypeScript files in backend
echo "🔍 Finding backend files with questionUid..."

BACKEND_FILES=$(find /home/aflesch/mathquest/app/backend/src -name "*.ts" -exec grep -l "questionUid" {} \; 2>/dev/null)

if [[ -n "$BACKEND_FILES" ]]; then
    echo "Found files with questionUid:"
    echo "$BACKEND_FILES"
    echo ""
    
    echo "$BACKEND_FILES" | while read -r file; do
        fix_question_id "$file"
    done
else
    echo "✅ No files with questionUid found in backend"
fi

# Also check interface definitions and type files
echo ""
echo "🔍 Checking backend type definitions..."

TYPE_FILES=$(find /home/aflesch/mathquest/app/backend -name "*.ts" -path "*/types/*" -exec grep -l "questionUid" {} \; 2>/dev/null)

if [[ -n "$TYPE_FILES" ]]; then
    echo "Found type files with questionUid:"
    echo "$TYPE_FILES"
    
    echo "$TYPE_FILES" | while read -r file; do
        fix_question_id "$file"
    done
fi

echo ""
echo "🔍 Final verification - checking for remaining questionUid:"
REMAINING=$(find /home/aflesch/mathquest/app/backend/src -name "*.ts" -exec grep -n "questionUid" {} + 2>/dev/null | head -5)

if [[ -n "$REMAINING" ]]; then
    echo "❌ Some questionUid references still remain:"
    echo "$REMAINING"
else
    echo "✅ All questionUid references have been converted to questionId"
fi

echo ""
echo "📋 Summary:"
echo "  • Standardized all backend questionUid → questionId"
echo "  • This matches frontend expectations"  
echo "  • Backend-frontend field name consistency achieved"
