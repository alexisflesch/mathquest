#!/bin/bash

echo "Starting avatarUrl to avatarEmoji migration..."

# Function to process a single file
process_file() {
    local file="$1"
    echo "Processing: $file"
    
    # Use sed to replace avatarUrl with avatarEmoji
    sed -i.bak \
        -e 's/avatarUrl:/avatarEmoji:/g' \
        -e 's/avatarUrl\?:/avatarEmoji?:/g' \
        -e 's/avatarUrl,/avatarEmoji,/g' \
        -e 's/avatarUrl }/avatarEmoji }/g' \
        -e 's/avatarUrl}/avatarEmoji}/g' \
        -e 's/\.avatarUrl/.avatarEmoji/g' \
        -e 's/\bavatarUrl\b/avatarEmoji/g' \
        -e 's/@param avatarUrl/@param avatarEmoji/g' \
        -e 's/Optional avatar URL/Optional avatar emoji/g' \
        -e 's/Avatar URL/Avatar emoji/g' \
        -e 's/avatar URL/avatar emoji/g' \
        "$file"
    
    # Check if changes were made
    if ! diff -q "$file" "$file.bak" >/dev/null 2>&1; then
        echo "  ✅ Updated: $file"
        rm "$file.bak"
    else
        echo "  ⏭️  No changes needed: $file"
        mv "$file.bak" "$file"
    fi
}

# Process backend source files
echo "Processing backend source files..."
find backend/src -name "*.ts" -not -path "*/generated/*" -not -name "*.test.ts" | while read file; do
    process_file "$file"
done

# Process shared types
echo "Processing shared types..."
find shared/types -name "*.ts" -not -name "*.test.ts" | while read file; do
    process_file "$file"
done

echo "Migration completed!"
