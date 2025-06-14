#!/usr/bin/env python3
"""
Fix script to revert incorrect defaultMode conversions back to type
"""

import os
import re

def fix_type_attributes(root_dir):
    """Fix incorrect defaultMode -> type conversions"""
    
    # Patterns to fix
    fixes = [
        # HTML attributes that should be 'type'
        (r'defaultMode="button"', 'type="button"'),
        (r'defaultMode="submit"', 'type="submit"'),
        (r'defaultMode="text"', 'type="text"'),
        (r'defaultMode="email"', 'type="email"'),
        (r'defaultMode="password"', 'type="password"'),
        (r'defaultMode="checkbox"', 'type="checkbox"'),
        (r'defaultMode="number"', 'type="number"'),
        (r'defaultMode="tel"', 'type="tel"'),
        (r'defaultMode="image/svg\+xml"', 'type="image/svg+xml"'),
        
        # Dynamic defaultMode assignments that should be type
        (r'defaultMode=\{showPassword \? \'text\' : \'password\'\}', 'type={showPassword ? \'text\' : \'password\'}'),
        (r'defaultMode=\{snackbarType\}', 'type={snackbarType}'),
        
        # Component props that should not be defaultMode
        (r'(\s+)defaultMode=("(?:error|success|danger)")', r'\1type=\2'),
        (r'(\s+)defaultMode=\{([^}]+)\}', r'\1type={\2}'),
        
        # Function parameter names
        (r'defaultMode: string\): type is', 'type: string): type is'),
        (r'\.includes\(type as any\)', '.includes(type as any)'),
        (r'input\.defaultMode', 'input.type'),
        
        # Interface properties that should be type
        (r'(\s+)defaultMode(\s*=\s*[\'"][^\'"]*)([\'"],?)', r'\1type\2\3'),
        
        # Template literal expressions
        (r'\$\{defaultMode\$', '${type}'),
    ]
    
    # File extensions to process
    extensions = ['.ts', '.tsx', '.js', '.jsx']
    
    files_processed = 0
    changes_made = 0
    
    for root, dirs, files in os.walk(root_dir):
        # Skip node_modules and other irrelevant directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '.next', 'dist', 'coverage']]
        
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    
                    # Apply fixes
                    for pattern, replacement in fixes:
                        content = re.sub(pattern, replacement, content)
                    
                    # Special case fixes for specific issues
                    
                    # Fix template literal in typeErrors.ts
                    if 'typeErrors.ts' in file_path:
                        content = re.sub(
                            r'\$\{defaultMode\$\{context \? ` in \$\{context\}` : ""\s*\}\.\s*\\nValue:',
                            '${type}${context ? ` in ${context}` : ""}.\nValue:',
                            content
                        )
                    
                    # Fix function parameter issues
                    if 'questionTypes.ts' in file_path:
                        content = re.sub(r'function isValidQuestionType\(defaultMode: string\): type is', 
                                       'function isValidQuestionType(type: string): type is', content)
                        content = re.sub(r'\.includes\(type as any\)', '.includes(type as any)', content)
                    
                    # Fix component interfaces that incorrectly have defaultMode
                    if 'ConfirmationModal.tsx' in file_path:
                        content = re.sub(r'defaultMode = \'danger\',', 'type = \'danger\',', content)
                        content = re.sub(r'switch \(type\)', 'switch (type)', content)
                    
                    if 'Snackbar.tsx' in file_path:
                        content = re.sub(r'defaultMode = "success",', 'type = "success",', content)
                    
                    # Fix gradeLevel property access issues
                    content = re.sub(r'data\.gradeLevel', 'data.levels', content)
                    content = re.sub(r'externalFilter\?\.gradeLevel', 'externalFilter?.niveau', content)
                    
                    if content != original_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        changes_made += 1
                        print(f"Fixed: {file_path}")
                    
                    files_processed += 1
                
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
    
    print(f"\nProcessed {files_processed} files")
    print(f"Made changes to {changes_made} files")

if __name__ == "__main__":
    # Run from the app root directory
    fix_type_attributes(".")
