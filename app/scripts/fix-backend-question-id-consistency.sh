#!/bin/bash

# Fix backend folder questionId vs questionUid consistency
# This script updates backend files to use questionUid consistently with shared types

BACKEND_DIR="/home/aflesch/mathquest/app/backend"

echo "🔧 Fixing backend questionId vs questionUid consistency..."

# Counter for tracking changes
changes_made=0

# Function to update a file with specific replacements
update_file() {
    local file="$1"
    local changes_count=0
    
    echo "Processing: $file"
    
    # Make backup
    cp "$file" "$file.backup"
    
    # Apply more targeted replacements for backend code
    sed -i \
        -e 's/questionId: data\.questionId/questionUid: data.questionUid/g' \
        -e 's/questionId: questionId/questionUid: questionUid/g' \
        -e 's/{ questionId,/{ questionUid,/g' \
        -e 's/questionId,$/questionUid,/g' \
        -e 's/questionId}/questionUid}/g' \
        -e 's/questionId: undefined/questionUid: undefined/g' \
        -e 's/questionId: string/questionUid: string/g' \
        -e 's/questionId: '\''question-1'\''/questionUid: '\''question-1'\''/g' \
        -e 's/data\.questionId/data.questionUid/g' \
        -e 's/{ accessCode, userId, questionId/{ accessCode, userId, questionUid/g' \
        -e 's/questionId: questionId,/questionUid: questionUid,/g' \
        -e 's/questionId,$/questionUid,/g' \
        -e 's/questionId: '\''question-/questionUid: '\''question-/g' \
        "$file"
    
    # Check if file was changed
    if ! diff -q "$file" "$file.backup" > /dev/null; then
        changes_count=$(diff -u "$file.backup" "$file" | grep -c '^[+-][[:space:]]*[^+-]')
        echo "  ✅ Updated: $changes_count lines changed"
        ((changes_made += changes_count))
        rm "$file.backup"
    else
        echo "  ⏸️  No changes needed"
        rm "$file.backup"
    fi
}

# Find and update TypeScript files in backend folder
find "$BACKEND_DIR" -name "*.ts" -type f | while read -r file; do
    if [[ "$file" =~ \.(ts|tsx)$ ]]; then
        # Skip backup files and node_modules
        if [[ ! "$file" =~ \.backup$ ]] && [[ ! "$file" =~ node_modules ]]; then
            update_file "$file"
        fi
    fi
done

echo ""
echo "🎯 Summary:"
echo "  Processing complete"
echo ""
echo "✅ Backend questionId consistency fixes completed!"
echo ""
echo "📋 Next steps:"
echo "1. Run TypeScript compilation: npm run type-check"
echo "2. Run tests to verify changes"
echo "3. Commit changes if all tests pass"

echo ""
echo "🔍 To verify changes, you can run:"
echo "  grep -r 'questionId' $BACKEND_DIR --include='*.ts' --include='*.tsx'"
echo ""
