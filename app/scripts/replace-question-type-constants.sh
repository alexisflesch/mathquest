#!/bin/bash

# Question Type Constants Replacement Script
# Replaces hard-coded question type strings with constants from shared/constants
# Part of Phase 3A: Question Type Constants extraction

set -e

echo "🔄 Starting question type constants replacement..."

# Define the project root
PROJECT_ROOT="/home/aflesch/mathquest/app"
cd "$PROJECT_ROOT"

# Replacement mappings
declare -A replacements=(
    ["'choix_simple'"]="QUESTION_TYPES.SINGLE_CHOICE"
    ["'choix_multiple'"]="QUESTION_TYPES.MULTIPLE_CHOICE"
    ["'multiple_choice_single_answer'"]="QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER"
    ["'multiple_choice'"]="QUESTION_TYPES.MULTIPLE_CHOICE_EN"
)

# Files to exclude from replacement (documentation, logs, etc.)
exclude_patterns=(
    "*/docs/*"
    "*/log.md"
    "*/plan.md"
    "*backup*"
    "*/dist/*"
    "*/node_modules/*"
    "*/coverage/*"
    "*/.git/*"
    "*/shared/constants/questionTypes.ts"  # Don't replace in the constants file itself
)

# Create exclude string for find command
exclude_args=""
for pattern in "${exclude_patterns[@]}"; do
    exclude_args="$exclude_args -not -path \"$pattern\""
done

# Function to add import if needed
add_import_if_needed() {
    local file="$1"
    
    # Check if file already has QUESTION_TYPES import
    if ! grep -q "QUESTION_TYPES" "$file" 2>/dev/null; then
        # Check if file has any shared imports
        if grep -q "from ['\"].*shared/" "$file" 2>/dev/null; then
            # Add to existing shared import section
            if grep -q "import.*from ['\"].*shared/constants" "$file" 2>/dev/null; then
                # Already has constants import, add QUESTION_TYPES to it
                sed -i 's/import {/import { QUESTION_TYPES, /' "$file"
            else
                # Add new constants import after other shared imports
                last_shared_import=$(grep -n "from ['\"].*shared/" "$file" | tail -1 | cut -d: -f1)
                if [ ! -z "$last_shared_import" ]; then
                    sed -i "${last_shared_import}a\\import { QUESTION_TYPES } from '../../shared/constants';" "$file"
                fi
            fi
        else
            # No shared imports, add at top after other imports
            if grep -q "^import" "$file" 2>/dev/null; then
                last_import=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
                sed -i "${last_import}a\\import { QUESTION_TYPES } from '../../shared/constants';" "$file"
            else
                # No imports at all, add at very top
                sed -i '1i\\import { QUESTION_TYPES } from '../../shared/constants';' "$file"
            fi
        fi
    fi
}

# Function to determine correct import path
get_import_path() {
    local file="$1"
    local file_dir=$(dirname "$file")
    
    # Calculate relative path to shared/constants
    if [[ "$file" == */frontend/* ]]; then
        echo "../../../shared/constants"
    elif [[ "$file" == */backend/* ]]; then
        echo "../../../shared/constants"
    elif [[ "$file" == */shared/* ]]; then
        echo "../constants"
    else
        echo "../../shared/constants"
    fi
}

# Find all TypeScript/JavaScript files (excluding certain patterns)
echo "🔍 Finding files to update..."
file_list=$(eval "find $PROJECT_ROOT -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \) $exclude_args")

# Counter for changes
total_files=0
modified_files=0
total_replacements=0

# Process each file
while IFS= read -r file; do
    if [ -f "$file" ]; then
        total_files=$((total_files + 1))
        file_modified=false
        file_replacements=0
        
        # Check if file contains any of our target strings
        if grep -q "'choix_simple'\|'choix_multiple'\|'multiple_choice_single_answer'\|'multiple_choice'" "$file" 2>/dev/null; then
            echo "📝 Processing: $file"
            
            # Perform replacements
            for find_str in "${!replacements[@]}"; do
                replace_str="${replacements[$find_str]}"
                
                # Count occurrences before replacement
                count=$(grep -o "$find_str" "$file" 2>/dev/null | wc -l)
                
                if [ "$count" -gt 0 ]; then
                    echo "   🔄 Replacing $count occurrence(s) of $find_str with $replace_str"
                    sed -i "s/$find_str/$replace_str/g" "$file"
                    file_replacements=$((file_replacements + count))
                    file_modified=true
                fi
            done
            
            # Add import if we made replacements
            if [ "$file_modified" = true ]; then
                # Only add import for TypeScript/JavaScript files (not JSON, etc.)
                if [[ "$file" == *.ts || "$file" == *.tsx || "$file" == *.js || "$file" == *.jsx ]]; then
                    import_path=$(get_import_path "$file")
                    
                    # Check if file already has QUESTION_TYPES import
                    if ! grep -q "QUESTION_TYPES" "$file" 2>/dev/null; then
                        echo "   📦 Adding import for QUESTION_TYPES"
                        
                        # Insert import at appropriate location
                        if grep -q "^import" "$file" 2>/dev/null; then
                            # Add after last import
                            last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
                            sed -i "${last_import_line}a\\import { QUESTION_TYPES } from '$import_path';" "$file"
                        else
                            # Add at top of file
                            sed -i "1i\\import { QUESTION_TYPES } from '$import_path';" "$file"
                        fi
                    fi
                fi
                
                modified_files=$((modified_files + 1))
                total_replacements=$((total_replacements + file_replacements))
            fi
        fi
    fi
done <<< "$file_list"

echo ""
echo "✅ Replacement complete!"
echo "📊 Summary:"
echo "   - Files scanned: $total_files"
echo "   - Files modified: $modified_files"
echo "   - Total replacements: $total_replacements"
echo ""
echo "🧪 Running TypeScript compilation check..."

# Check TypeScript compilation for each module
echo "   Checking shared module..."
if npx tsc --noEmit --project shared/tsconfig.json; then
    echo "   ✅ Shared module compiles cleanly"
else
    echo "   ❌ Shared module has TypeScript errors"
    exit 1
fi

echo "   Checking frontend module..."
if npx tsc --noEmit --project frontend/tsconfig.json; then
    echo "   ✅ Frontend module compiles cleanly"
else
    echo "   ❌ Frontend module has TypeScript errors"
    exit 1
fi

echo "   Checking backend module..."
if npx tsc --noEmit --project backend/tsconfig.json; then
    echo "   ✅ Backend module compiles cleanly"
else
    echo "   ❌ Backend module has TypeScript errors"
    exit 1
fi

echo ""
echo "🎉 All replacements completed successfully!"
echo "📋 Next steps:"
echo "   1. Review the changes with: git diff"
echo "   2. Test the application to ensure functionality"
echo "   3. Update plan.md and log.md with progress"
