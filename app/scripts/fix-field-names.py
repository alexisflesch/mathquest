#!/usr/bin/env python3
"""
MathQuest Field Name Standardization Script

This script fixes field name inconsistencies throughout the codebase to ensure
canonical naming conventions are used everywhere:

- questionIds → questionUids (for arrays)
- niveau/niveaux → gradeLevel  
- nom → name
- enseignant_id → creatorId
- questions_ids → questionUids
- And other legacy field names

Usage: python3 scripts/fix-field-names.py
"""

import os
import re
import glob
from typing import List, Tuple, Dict

# Define field name mappings (old_name -> new_name)
FIELD_MAPPINGS = {
    # Question ID inconsistencies
    'questionIds': 'questionUids',
    'questions_ids': 'questionUids',
    
    # French to English conversions
    'niveau': 'gradeLevel',
    'niveaux': 'gradeLevel', 
    'nom': 'name',
    'enseignant_id': 'creatorId',
    
    # Other legacy names
    'ownerId': 'creatorId',
    'categories': 'discipline',
    'date_creation': 'createdAt',
    'type': 'defaultMode'
}

# File patterns to process
INCLUDE_PATTERNS = [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx'
]

# Directories to exclude
EXCLUDE_DIRS = [
    'node_modules',
    '.next',
    'dist',
    'coverage',
    '.git',
    'test-results',
    'playwright-report'
]

def should_process_file(file_path: str) -> bool:
    """Check if a file should be processed based on exclude patterns."""
    normalized_path = os.path.normpath(file_path)
    
    # Skip files in excluded directories
    for exclude_dir in EXCLUDE_DIRS:
        if exclude_dir in normalized_path.split(os.sep):
            return False
    
    return True

def find_field_replacements(content: str, mapping: Dict[str, str]) -> List[Tuple[str, str, str]]:
    """Find field name replacements needed in the content."""
    replacements = []
    
    for old_field, new_field in mapping.items():
        # Pattern for object property access/definition
        patterns = [
            # Object property definitions: { questionIds: ... }
            rf'\b{re.escape(old_field)}\s*:',
            # Object property access: obj.questionIds
            rf'\.{re.escape(old_field)}\b',
            # Destructuring: { questionIds } = 
            rf'\{{\s*[^}}]*\b{re.escape(old_field)}\b[^}}]*\}}',
            # Variable names: const questionIds =
            rf'\b{re.escape(old_field)}\b(?=\s*[=:])',
            # String literals in templates: "questionIds"
            rf'["\']({re.escape(old_field)})["\']',
            # Comments mentioning the field
            rf'//.*\b{re.escape(old_field)}\b',
            rf'/\*.*\b{re.escape(old_field)}\b.*\*/'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, content, re.MULTILINE | re.DOTALL)
            for match in matches:
                old_text = match.group(0)
                new_text = old_text.replace(old_field, new_field)
                if old_text != new_text:
                    replacements.append((old_text, new_text, f"Replace {old_field} with {new_field}"))
    
    return replacements

def fix_file_content(content: str) -> Tuple[str, List[str]]:
    """Fix field names in file content and return the updated content and list of changes."""
    changes = []
    updated_content = content
    
    # Process each mapping
    for old_field, new_field in FIELD_MAPPINGS.items():
        # More precise regex patterns to avoid false positives
        patterns = [
            # Object property with colon: questionIds:
            (rf'\b{re.escape(old_field)}(\s*:)', rf'{new_field}\1'),
            # Object property access: .questionIds
            (rf'\.{re.escape(old_field)}\b', f'.{new_field}'),
            # String literals: "questionIds" or 'questionIds'
            (rf'(["\']){re.escape(old_field)}\1', rf'\1{new_field}\1'),
            # Variable declarations: const questionIds =
            (rf'\b{re.escape(old_field)}(\s*=)', rf'{new_field}\1'),
            # Destructuring: { questionIds, ... } - simpler pattern
            (rf'\{{\s*{re.escape(old_field)}\s*[,}}]', rf'{{{new_field}'),
        ]
        
        for pattern, replacement in patterns:
            old_content = updated_content
            updated_content = re.sub(pattern, replacement, updated_content)
            if old_content != updated_content:
                count = len(re.findall(pattern, old_content))
                changes.append(f"  - {old_field} → {new_field} ({count} occurrences)")
    
    return updated_content, changes

def process_file(file_path: str) -> List[str]:
    """Process a single file and return list of changes made."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        updated_content, changes = fix_file_content(original_content)
        
        if changes:
            # Write back the updated content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            
            print(f"✅ Fixed {file_path}:")
            for change in changes:
                print(change)
            print()
            
            return changes
        
        return []
        
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return []

def main():
    """Main function to process all files."""
    print("🔧 MathQuest Field Name Standardization")
    print("=" * 50)
    print()
    
    # Get the app root directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    app_root = os.path.dirname(script_dir)
    
    print(f"📁 Processing files in: {app_root}")
    print(f"🎯 Field mappings:")
    for old, new in FIELD_MAPPINGS.items():
        print(f"  - {old} → {new}")
    print()
    
    # Find all files to process
    files_to_process = []
    for pattern in INCLUDE_PATTERNS:
        for file_path in glob.glob(os.path.join(app_root, pattern), recursive=True):
            if should_process_file(file_path):
                files_to_process.append(file_path)
    
    print(f"📊 Found {len(files_to_process)} files to process")
    print()
    
    # Process each file
    total_changes = 0
    files_changed = 0
    
    for file_path in files_to_process:
        relative_path = os.path.relpath(file_path, app_root)
        changes = process_file(file_path)
        if changes:
            files_changed += 1
            total_changes += len(changes)
    
    print("📊 Summary:")
    print(f"  - Files processed: {len(files_to_process)}")
    print(f"  - Files changed: {files_changed}")
    print(f"  - Total changes: {total_changes}")
    print()
    
    if files_changed > 0:
        print("✅ Field name standardization complete!")
        print("🔍 Please run 'npx tsc --noEmit' to verify no type errors were introduced.")
    else:
        print("ℹ️  No changes needed - field names are already standardized!")

if __name__ == "__main__":
    main()
