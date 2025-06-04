#!/bin/bash

# Script to migrate avatarUrl to avatarEmoji throughout the codebase
# This script will update TypeScript files, excluding test files and generated files

echo "🔄 Starting avatarUrl to avatarEmoji migration..."

# Function to perform replacements in a file
migrate_file() {
    local file="$1"
    echo "Processing: $file"
    
    # Create backup
    cp "$file" "$file.bak"
    
    # Replace avatarUrl with avatarEmoji in various contexts
    sed -i 's/avatarUrl:/avatarEmoji:/g' "$file"
    sed -i 's/avatarUrl\?:/avatarEmoji?:/g' "$file"
    sed -i 's/avatarUrl\s*\?:/avatarEmoji?:/g' "$file"
    sed -i 's/avatarUrl,/avatarEmoji,/g' "$file"
    sed -i 's/avatarUrl }/avatarEmoji }/g' "$file"
    sed -i 's/avatarUrl}/avatarEmoji}/g' "$file"
    sed -i 's/avatarUrl =/avatarEmoji =/g' "$file"
    sed -i 's/\.avatarUrl/.avatarEmoji/g' "$file"
    sed -i 's/\bavatarUrl\b/avatarEmoji/g' "$file"
    
    # Special case for function parameters and comments
    sed -i 's/@param avatarUrl/@param avatarEmoji/g' "$file"
    sed -i 's/Optional avatar URL/Optional avatar emoji/g' "$file"
    sed -i 's/Avatar URL/Avatar emoji/g' "$file"
    sed -i 's/avatar URL/avatar emoji/g' "$file"
    
    # Zod schema updates - remove URL validation for emoji fields
    sed -i 's/z\.string()\.url({ message: "Invalid URL format for avatar\." })\.optional()/z.string().optional()/g' "$file"
    sed -i 's/z\.string()\.url.*avatar.*\.optional()/z.string().optional()/g' "$file"
    
    # Check if file was actually changed
    if ! diff -q "$file" "$file.bak" > /dev/null 2>&1; then
        echo "  ✅ Updated: $file"
    else
        echo "  ⏭️  No changes: $file"
        rm "$file.bak"
    fi
}

# Find and process TypeScript files in backend/src and shared/types
echo "🔍 Finding TypeScript files to process..."

# Backend source files (excluding tests and generated files)
find backend/src -name "*.ts" -not -path "*/tests/*" -not -path "*/test/*" -not -path "*/generated/*" -not -name "*.test.ts" -not -name "*.spec.ts" | while read -r file; do
    migrate_file "$file"
done

# Shared types files
find shared/types -name "*.ts" -not -name "*.test.ts" -not -name "*.spec.ts" | while read -r file; do
    migrate_file "$file"
done

# Frontend hook files (these have socket event references)
find frontend/src/hooks -name "*.ts" -not -name "*.test.ts" -not -name "*.spec.ts" | while read -r file; do
    migrate_file "$file"
done

echo ""
echo "🧹 Cleaning up backup files..."
find . -name "*.bak" -delete

echo ""
echo "✅ Migration completed!"
echo ""
echo "📝 Summary of changes:"
echo "   - Changed avatarUrl field names to avatarEmoji"
echo "   - Updated function parameter names and comments"
echo "   - Removed URL validation from Zod schemas for avatar fields"
echo ""
echo "🔧 Next steps:"
echo "   1. Run database migration: npx prisma migrate dev --name rename-avatar-url-to-emoji"
echo "   2. Regenerate Prisma client: npx prisma generate"
echo "   3. Test the application to ensure everything works"
echo ""
echo "⚠️  Note: You may need to manually update test files that expect the old field names."
