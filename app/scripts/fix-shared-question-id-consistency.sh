#!/bin/bash

# Fix shared folder questionId vs questionUid consistency
# This script updates shared types to use questionUid consistently

SHARED_DIR="/home/aflesch/mathquest/app/shared"

echo "🔧 Fixing shared folder questionId vs questionUid consistency..."

# Counter for tracking changes
changes_made=0

# Function to update a file with sed replacements
update_file() {
    local file="$1"
    local changes_count=0
    
    echo "Processing: $file"
    
    # Make backup
    cp "$file" "$file.backup"
    
    # Apply replacements
    sed -i \
        -e 's/questionId:/questionUid:/g' \
        -e 's/questionId\?:/questionUid?:/g' \
        -e 's/questionId: string/questionUid: string/g' \
        -e 's/questionId\?: string/questionUid?: string/g' \
        -e 's/questionId: string | null/questionUid: string | null/g' \
        -e 's/questionId\?: string | null/questionUid?: string | null/g' \
        -e 's/questionId: string | null | undefined/questionUid: string | null | undefined/g' \
        -e 's/questionId\?: string | null | undefined/questionUid?: string | null | undefined/g' \
        -e 's/currentQuestionId/currentQuestionUid/g' \
        -e 's/timerQuestionId/timerQuestionUid/g' \
        -e 's/Question ID/Question UID/g' \
        -e 's/question ID/question UID/g' \
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

# Find and update TypeScript files in shared folder
find "$SHARED_DIR" -name "*.ts" -type f | while read -r file; do
    if [[ "$file" =~ \.(ts|tsx)$ ]]; then
        # Skip backup files and node_modules
        if [[ ! "$file" =~ \.backup$ ]] && [[ ! "$file" =~ node_modules ]]; then
            update_file "$file"
        fi
    fi
done

echo ""
echo "🎯 Summary:"
echo "  Total lines changed: $changes_made"
echo ""

if [ $changes_made -gt 0 ]; then
    echo "✅ Shared folder questionId consistency fixes completed!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Run TypeScript compilation: npm run type-check"
    echo "2. Run tests to verify changes"
    echo "3. Commit changes if all tests pass"
else
    echo "ℹ️  No changes were needed in shared folder"
fi

echo ""
echo "🔍 To verify changes, you can run:"
echo "  grep -r 'questionId' $SHARED_DIR --include='*.ts' --include='*.tsx'"
echo ""
