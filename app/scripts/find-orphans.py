#!/usr/bin/env python3
"""
Find orphaned files in TypeScript/React project

This script finds files that are never imported by other files,
which are potential candidates for removal.
"""

import os
import re
import sys
from pathlib import Path
from collections import defaultdict

def find_typescript_files(directory):
    """Find all TypeScript/React files, excluding node_modules"""
    extensions = {'.ts', '.tsx', '.js', '.jsx'}
    files = []
    
    for root, dirs, filenames in os.walk(directory):
        # Skip node_modules and other common directories
        dirs[:] = [d for d in dirs if d not in {'node_modules', '.git', '.next', 'dist', 'build'}]
        
        for filename in filenames:
            if any(filename.endswith(ext) for ext in extensions):
                files.append(os.path.join(root, filename))
    
    return files

def extract_imports(file_path):
    """Extract import statements from a file"""
    imports = set()
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Match various import patterns
        patterns = [
            r"import.*?from\s+['\"]([^'\"]+)['\"]",  # import ... from '...'
            r"import\s+['\"]([^'\"]+)['\"]",          # import '...'
            r"require\s*\(\s*['\"]([^'\"]+)['\"]\s*\)",  # require('...')
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            for match in matches:
                # Skip external packages (no ./ or ../)
                if match.startswith('.'):
                    imports.add(match)
        
    except Exception as e:
        print(f"Error reading {file_path}: {e}", file=sys.stderr)
    
    return imports

def resolve_import_path(import_path, current_file_dir, project_root):
    """Resolve relative import to absolute file path"""
    if import_path.startswith('./'):
        # Relative to current directory
        resolved = os.path.join(current_file_dir, import_path[2:])
    elif import_path.startswith('../'):
        # Relative to parent directory
        resolved = os.path.normpath(os.path.join(current_file_dir, import_path))
    else:
        # Could be absolute from src root
        resolved = os.path.join(project_root, 'src', import_path)
    
    # Try different extensions
    extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx']
    for ext in extensions:
        full_path = resolved + ext
        if os.path.exists(full_path):
            return os.path.abspath(full_path)
    
    return None

def is_nextjs_special_file(file_path):
    """Check if file is a special Next.js file that shouldn't be considered orphaned"""
    filename = os.path.basename(file_path)
    special_names = ['page.tsx', 'layout.tsx', 'loading.tsx', 'error.tsx', 'not-found.tsx', 'route.ts']
    return filename in special_names

def find_orphaned_files(directory):
    """Find files that are never imported by other files"""
    # Find all TypeScript/JavaScript files
    all_files = find_typescript_files(directory)
    
    # Parse imports for each file
    imported_files = set()
    project_root = os.path.abspath(directory)
    
    for file_path in all_files:
        file_dir = os.path.dirname(file_path)
        imports = extract_imports(file_path)
        
        for import_path in imports:
            resolved = resolve_import_path(import_path, file_dir, project_root)
            if resolved:
                imported_files.add(resolved)
    
    # Files that exist but are never imported
    orphaned_files = []
    for file_path in all_files:
        abs_path = os.path.abspath(file_path)
        
        # Skip special Next.js files
        if is_nextjs_special_file(file_path):
            continue
        
        # Skip test files
        if file_path.endswith(('.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx')):
            continue
            
        # Skip config files
        if any(name in os.path.basename(file_path).lower() for name in ['config', 'setup']):
            continue
            
        # Skip entry points (index files are often entry points)
        if 'index.' in os.path.basename(file_path):
            continue
            
        # Skip middleware and other special files
        if 'middleware.' in os.path.basename(file_path):
            continue
            
        if abs_path not in imported_files:
            orphaned_files.append(abs_path)
    
    return orphaned_files, len(all_files), len(imported_files)

def main():
    if len(sys.argv) > 1:
        project_dir = sys.argv[1]
    else:
        project_dir = '.'
    
    orphaned, total_files, imported_count = find_orphaned_files(project_dir)
    
    print(f"\n📊 Analysis Results:")
    print(f"Total files: {total_files}")
    print(f"Imported files: {imported_count}")
    print(f"Orphaned files: {len(orphaned)}")
    
    if orphaned:
        print(f"\n🗑️  Potentially orphaned files:")
        for file_path in sorted(orphaned):
            rel_path = os.path.relpath(file_path, project_dir)
            # Get file size
            size = os.path.getsize(file_path)
            print(f"  {rel_path} ({size} bytes)")
    else:
        print("\n✅ No orphaned files found!")

if __name__ == "__main__":
    main()
