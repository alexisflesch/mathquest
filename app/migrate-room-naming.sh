#!/bin/bash

# Room Naming Migration Script
# Migrates from live_${code} and tournament_${code} to game_${code}

set -e

echo "🚀 Starting room naming migration..."
echo "This will replace all instances of 'live_\${' and 'tournament_\${' with 'game_\${''"

# Backup current state
echo "📦 Creating backup..."
git add . 2>/dev/null || true
git commit -m "Backup before room naming migration" 2>/dev/null || echo "No changes to backup"

# Function to replace patterns in files
replace_in_files() {
    local pattern="$1"
    local replacement="$2"
    local description="$3"
    
    echo "🔄 $description"
    
    # Find and replace in TypeScript, JavaScript, and Markdown files
    find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.md" \) \
        -not -path "./node_modules/*" \
        -not -path "./.git/*" \
        -not -path "./coverage/*" \
        -not -path "./dist/*" \
        -not -path "./build/*" \
        -exec grep -l "$pattern" {} \; | while read file; do
        echo "  📝 Updating: $file"
        sed -i "s/$pattern/$replacement/g" "$file"
    done
}

# 1. Replace live_${ with game_${
replace_in_files "live_\\\${" "game_\\\${" "Replacing 'live_\${' with 'game_\${'"

# 2. Replace tournament_${ with game_${
replace_in_files "tournament_\\\${" "game_\\\${" "Replacing 'tournament_\${' with 'game_\${'"

# 3. Replace live_" + with game_" + (for string concatenation)
replace_in_files "live_\"" "game_\"" "Replacing 'live_\"' with 'game_\"'"

# 4. Replace tournament_" + with game_" + (for string concatenation)
replace_in_files "tournament_\"" "game_\"" "Replacing 'tournament_\"' with 'game_\"'"

# 5. Replace 'live_' + with 'game_' + (for string concatenation)
replace_in_files "'live_'" "'game_'" "Replacing \"'live_'\" with \"'game_'\""

# 6. Replace 'tournament_' + with 'game_' + (for string concatenation)
replace_in_files "'tournament_'" "'game_'" "Replacing \"'tournament_'\" with \"'game_'\""

# 7. Replace room: "live_ with room: "game_
replace_in_files "room: \"live_" "room: \"game_" "Replacing room assignment patterns"

# 8. Replace room: "tournament_ with room: "game_
replace_in_files "room: \"tournament_" "room: \"game_" "Replacing room assignment patterns"

echo "✅ Pattern replacement complete!"

# Show summary of changes
echo "📊 Summary of changes:"
git diff --name-only 2>/dev/null | while read file; do
    if [[ -f "$file" ]]; then
        changes=$(git diff "$file" | grep -E "^[\+\-].*game_" | wc -l)
        if [[ $changes -gt 0 ]]; then
            echo "  📄 $file: $changes lines changed"
        fi
    fi
done

echo ""
echo "🎉 Room naming migration completed!"
echo ""
echo "Next steps:"
echo "1. Review the changes with: git diff"
echo "2. Test the application to ensure everything works"
echo "3. Update documentation with: ./update-docs.sh"
echo "4. Run tests to verify functionality"
echo ""
echo "If you need to revert: git reset --hard HEAD~1"
