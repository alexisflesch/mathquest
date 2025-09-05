#!/usr/bin/env python3
"""
Script to fix unescaped entities in React/JSX files
"""
import os
import re
import glob

# Define replacements for unescaped entities
REPLACEMENTS = {
    "'": "&apos;",  # Right single quotation mark
    "'": "&apos;",  # Left single quotation mark
    """: "&quot;",  # Left double quotation mark
    """: "&quot;",  # Right double quotation mark
}

def fix_unescaped_entities(file_path):
    """Fix unescaped entities in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply replacements
        for char, entity in REPLACEMENTS.items():
            content = content.replace(char, entity)
        
        # Only write if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed entities in: {file_path}")
            return True
        
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main function to process all TSX/JSX files"""
    # Find all React component files
    patterns = [
        'src/**/*.tsx',
        'src/**/*.jsx'
    ]
    
    files_changed = 0
    
    for pattern in patterns:
        for file_path in glob.glob(pattern, recursive=True):
            if fix_unescaped_entities(file_path):
                files_changed += 1
    
    print(f"\nFixed entities in {files_changed} files")

if __name__ == "__main__":
    main()
