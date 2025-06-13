#!/usr/bin/env python3
"""
Fix Missing QUESTION_TYPES Imports in Backend
==============================================

This script automatically adds the missing import statement for QUESTION_TYPES
to all backend files that use it but don't have the import.

Based on TypeScript errors showing 35 missing QUESTION_TYPES references
across 12 backend files.

Usage: python3 scripts/fix-backend-question-types-imports.py
"""

import os
import re
from pathlib import Path

# Define the import statement to add
IMPORT_STATEMENT = "import { QUESTION_TYPES } from '@shared/constants/questionTypes';"

# Files that need the import (based on TypeScript error output)
AFFECTED_FILES = [
    "src/core/gameStateService.ts",
    "src/sockets/handlers/game/requestNextQuestion.ts",
    "tests/integration/gameFlow-e2e.test.ts",
    "tests/integration/gameHandler.test.ts",
    "tests/integration/mockedGameHandler.test.ts",
    "tests/integration/practiceMode.test.ts",
    "tests/integration/projectorHandler.test.ts",
    "tests/integration/questionApi.test.ts",
    "tests/integration/teacherQuiz.test.ts",
    "tests/integration/tournament-creation-e2e.test.ts",
    "tests/integration/tournament-flow-e2e.test.ts",
    "tests/unit/questionService.test.ts"
]

def has_question_types_usage(content):
    """Check if file uses QUESTION_TYPES"""
    return "QUESTION_TYPES." in content

def has_question_types_import(content):
    """Check if file already has QUESTION_TYPES import"""
    import_patterns = [
        r"import\s*\{[^}]*QUESTION_TYPES[^}]*\}\s*from\s*['\"]@shared/constants/questionTypes['\"]",
        r"import\s*\{[^}]*QUESTION_TYPES[^}]*\}\s*from\s*['\"]@shared/types['\"]",
        r"import\s*\*\s*as\s*\w+\s*from\s*['\"]@shared/constants/questionTypes['\"]"
    ]
    
    for pattern in import_patterns:
        if re.search(pattern, content, re.MULTILINE):
            return True
    return False

def find_best_import_position(content):
    """Find the best position to insert the import statement"""
    lines = content.split('\n')
    
    # Find the last import statement
    last_import_index = -1
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('import ') and not stripped.startswith('import type'):
            last_import_index = i
    
    if last_import_index != -1:
        # Insert after the last import
        return last_import_index + 1
    
    # If no imports found, look for the first non-comment, non-empty line
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped and not stripped.startswith('//') and not stripped.startswith('/*') and not stripped.startswith('*'):
            return i
    
    # Fallback: insert at the beginning
    return 0

def add_import_to_file(file_path):
    """Add QUESTION_TYPES import to a single file"""
    try:
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file uses QUESTION_TYPES
        if not has_question_types_usage(content):
            print(f"  ⚠️  {file_path}: No QUESTION_TYPES usage found")
            return False
        
        # Check if import already exists
        if has_question_types_import(content):
            print(f"  ✅ {file_path}: Import already exists")
            return False
        
        # Find where to insert the import
        lines = content.split('\n')
        insert_position = find_best_import_position(content)
        
        # Insert the import statement
        lines.insert(insert_position, IMPORT_STATEMENT)
        
        # Write the file back
        new_content = '\n'.join(lines)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"  ✅ {file_path}: Added QUESTION_TYPES import")
        return True
        
    except Exception as e:
        print(f"  ❌ {file_path}: Error - {e}")
        return False

def main():
    """Main script execution"""
    print("🔧 Fixing Missing QUESTION_TYPES Imports in Backend")
    print("=" * 50)
    
    # Change to backend directory
    backend_dir = Path(__file__).parent.parent / "backend"
    if not backend_dir.exists():
        backend_dir = Path.cwd()
    
    os.chdir(backend_dir)
    print(f"Working directory: {os.getcwd()}")
    print()
    
    files_processed = 0
    files_modified = 0
    
    for file_path in AFFECTED_FILES:
        print(f"Processing: {file_path}")
        
        if not os.path.exists(file_path):
            print(f"  ⚠️  {file_path}: File not found")
            continue
        
        files_processed += 1
        if add_import_to_file(file_path):
            files_modified += 1
    
    print()
    print("📊 Summary:")
    print(f"  Files processed: {files_processed}")
    print(f"  Files modified: {files_modified}")
    print(f"  Files skipped: {files_processed - files_modified}")
    
    if files_modified > 0:
        print()
        print("🎉 Success! Run 'npm run type-check' or 'tsc' to verify fixes.")
    else:
        print()
        print("ℹ️  No files needed modification.")

if __name__ == "__main__":
    main()
