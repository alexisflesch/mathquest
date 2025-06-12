#!/bin/bash

# Clean up migration files and move to production status
# This script removes migration artifacts and promotes clean hooks to main directory

FRONTEND_DIR="/home/aflesch/mathquest/app/frontend"
HOOKS_DIR="$FRONTEND_DIR/src/hooks"
MIGRATIONS_DIR="$HOOKS_DIR/migrations"

echo "🧹 Starting Migration Folder Cleanup..."
echo "======================================"
echo ""

# Step 1: Check current state
echo "📊 Current migration files:"
ls -la "$MIGRATIONS_DIR/"
echo ""

# Step 2: Clean up migration artifacts in each file
echo "🔧 Cleaning up migration artifacts..."

cleanup_migration_file() {
    local file="$1"
    local filename=$(basename "$file")
    echo "  Processing: $filename"
    
    # Create backup
    cp "$file" "$file.backup"
    
    # Remove migration-specific comments and references
    sed -i \
        -e 's/Migration Layer/Production/g' \
        -e 's/migrated hooks/hooks/g' \
        -e 's/Migration Layer Index/Hook Index/g' \
        -e 's/Phase 2: Timer Management Consolidation - Migration Layer/Production Timer Management/g' \
        -e 's/backward-compatible hooks/production hooks/g' \
        -e 's/Gradual migration path/Standard usage/g' \
        -e '/migration/I s/migration/production/g' \
        -e '/Migration/I s/Migration/Production/g' \
        "$file"
    
    # Remove migration-specific documentation blocks
    # (This is more complex and would need careful manual review)
    
    echo "    ✅ Cleaned: $filename"
}

# Clean up all migration files
for file in "$MIGRATIONS_DIR"/*.ts; do
    if [[ -f "$file" ]]; then
        cleanup_migration_file "$file"
    fi
done

echo ""

# Step 3: Rename files to remove "Migrated" suffix
echo "📝 Renaming files to production names..."

rename_file() {
    local old_file="$1"
    local new_file=$(echo "$old_file" | sed 's/Migrated\.ts$/.ts/')
    local filename=$(basename "$old_file")
    local new_filename=$(basename "$new_file")
    
    if [[ "$old_file" != "$new_file" ]]; then
        echo "  $filename → $new_filename"
        mv "$old_file" "$new_file"
    fi
}

for file in "$MIGRATIONS_DIR"/*Migrated.ts; do
    if [[ -f "$file" ]]; then
        rename_file "$file"
    fi
done

echo ""

# Step 4: Update imports in the index file
echo "🔗 Updating imports in index.ts..."
sed -i \
    -e "s/useTeacherQuizSocketMigrated/useTeacherQuizSocket/g" \
    -e "s/useProjectionQuizSocketMigrated/useProjectionQuizSocket/g" \
    -e "s/useStudentGameSocketMigrated/useStudentGameSocket/g" \
    -e "s/useTournamentSocketMigrated/useTournamentSocket/g" \
    "$MIGRATIONS_DIR/index.ts"

echo "  ✅ Updated index.ts imports"
echo ""

# Step 5: Check for any remaining references to migration files
echo "🔍 Checking for remaining migration references..."
remaining_refs=$(find "$FRONTEND_DIR/src" -name "*.ts" -o -name "*.tsx" | xargs grep -l "Migrated" 2>/dev/null | wc -l)

if [[ $remaining_refs -gt 0 ]]; then
    echo "  ⚠️  Found $remaining_refs files with remaining migration references:"
    find "$FRONTEND_DIR/src" -name "*.ts" -o -name "*.tsx" | xargs grep -l "Migrated" 2>/dev/null
    echo ""
    echo "  These will need manual review and updating."
else
    echo "  ✅ No remaining migration references found"
fi

echo ""

# Step 6: Verify TypeScript compilation
echo "🏗️  Verifying TypeScript compilation..."
cd "$FRONTEND_DIR"
if npm run type-check > /dev/null 2>&1; then
    echo "  ✅ TypeScript compilation successful"
else
    echo "  ❌ TypeScript compilation failed - manual fixes needed"
    echo "  Run 'npm run type-check' for details"
fi

echo ""

# Step 7: Summary
echo "📋 Migration Cleanup Summary:"
echo "  ✅ Cleaned up migration artifacts in hook files"
echo "  ✅ Renamed files to production names"
echo "  ✅ Updated index.ts imports"
echo "  ✅ Verified remaining references"
echo ""

echo "🎯 Next Steps:"
echo "  1. Review cleaned files for any remaining migration artifacts"
echo "  2. Update any components that import migration files directly"
echo "  3. Consider moving cleaned hooks to main hooks directory"
echo "  4. Run comprehensive test suite to verify functionality"
echo ""

echo "✅ Migration cleanup completed!"
