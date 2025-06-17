#!/usr/bin/env python3

import os
import json
import sys
import re
from datetime import datetime
from pathlib import Path

class ArchitectureValidator:
    """
    Validates project architecture and enforces organizational rules
    """
    
    def __init__(self, project_root):
        self.project_root = project_root
        self.frontend_path = os.path.join(project_root, 'frontend')
        self.backend_path = os.path.join(project_root, 'backend')
        self.shared_path = os.path.join(project_root, 'shared')
        
        # Architecture rules
        self.rules = {
            'frontend_structure': {
                'required_dirs': ['src', 'public'],
                'optional_dirs': ['components', 'pages', 'hooks', 'utils', 'types'],
                'forbidden_imports': ['../backend/', '../prisma/']
            },
            'backend_structure': {
                'required_dirs': ['src'],
                'optional_dirs': ['routes', 'middleware', 'models', 'utils'],
                'forbidden_imports': ['../frontend/']
            },
            'shared_structure': {
                'required_dirs': ['types'],
                'forbidden_imports': []
            },
            'import_patterns': {
                'use_shared_types': r'@shared/types',
                'avoid_relative_imports': r'\.\./\.\.',
                'proper_absolute_imports': r'@/(components|hooks|utils|pages)'
            }
        }
        
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'violations': [],
            'summary': {
                'total_violations': 0,
                'by_severity': {'critical': 0, 'high': 0, 'medium': 0, 'low': 0},
                'by_module': {},
                'by_rule': {}
            },
            'recommendations': []
        }
    
    def validate(self):
        """Main validation entry point"""
        self._validate_directory_structure()
        self._validate_import_patterns()
        self._validate_cross_module_dependencies()
        self._generate_recommendations()
        return self.results
    
    def _validate_directory_structure(self):
        """Validate that modules have proper directory structure"""
        modules = [
            ('frontend', self.frontend_path, self.rules['frontend_structure']),
            ('backend', self.backend_path, self.rules['backend_structure']),
            ('shared', self.shared_path, self.rules['shared_structure'])
        ]
        
        for module_name, module_path, rules in modules:
            if not os.path.exists(module_path):
                continue
            
            # Check required directories
            for required_dir in rules['required_dirs']:
                dir_path = os.path.join(module_path, required_dir)
                if not os.path.exists(dir_path):
                    self._add_violation(
                        'directory_structure',
                        'high',
                        f'Missing required directory: {required_dir}',
                        module_name,
                        f'{module_name}/{required_dir}'
                    )
            
            # Check for unexpected files in root
            self._check_root_cleanliness(module_name, module_path)
    
    def _validate_import_patterns(self):
        """Validate import patterns across the codebase"""
        modules = [
            ('frontend', self.frontend_path),
            ('backend', self.backend_path),
            ('shared', self.shared_path)
        ]
        
        for module_name, module_path in modules:
            if os.path.exists(module_path):
                self._check_module_imports(module_name, module_path)
    
    def _validate_cross_module_dependencies(self):
        """Validate dependencies between modules"""
        # Check if frontend imports backend code directly
        if os.path.exists(self.frontend_path):
            frontend_files = self._get_code_files(self.frontend_path)
            for file_path in frontend_files:
                self._check_forbidden_imports(file_path, 'frontend')
        
        # Check if backend imports frontend code directly  
        if os.path.exists(self.backend_path):
            backend_files = self._get_code_files(self.backend_path)
            for file_path in backend_files:
                self._check_forbidden_imports(file_path, 'backend')
    
    def _check_module_imports(self, module_name, module_path):
        """Check import patterns within a module"""
        files = self._get_code_files(module_path)
        
        for file_path in files:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    self._analyze_imports(file_path, content, module_name)
            except Exception:
                continue
    
    def _analyze_imports(self, file_path, content, module_name):
        """Analyze import statements in a file"""
        relative_path = os.path.relpath(file_path, self.project_root)
        lines = content.split('\n')
        
        # Check for various import patterns
        import_patterns = [
            (r'import.*from\s+["\']([^"\']+)["\']', 'import'),
            (r'require\(["\']([^"\']+)["\']\)', 'require')
        ]
        
        for line_num, line in enumerate(lines, 1):
            for pattern, import_type in import_patterns:
                matches = re.finditer(pattern, line)
                for match in matches:
                    import_path = match.group(1)
                    self._validate_import_path(
                        relative_path, line_num, import_path, 
                        module_name, line.strip()
                    )
    
    def _validate_import_path(self, file_path, line_num, import_path, module_name, line_content):
        """Validate a specific import path"""
        # Check for excessive relative imports
        if import_path.count('../') > 2:
            self._add_violation(
                'excessive_relative_imports',
                'medium',
                f'Excessive relative import: {import_path}',
                module_name,
                file_path,
                line_num,
                line_content
            )
        
        # Check for @/types usage instead of @shared/types
        if '@/types' in import_path and module_name in ['frontend', 'backend']:
            self._add_violation(
                'incorrect_shared_types',
                'medium',
                f'Use @shared/types instead of @/types: {import_path}',
                module_name,
                file_path,
                line_num,
                line_content
            )
        
        # Check for direct cross-module imports
        forbidden_patterns = {
            'frontend': ['../backend/', '../prisma/'],
            'backend': ['../frontend/'],
            'shared': []
        }
        
        if module_name in forbidden_patterns:
            for forbidden in forbidden_patterns[module_name]:
                if forbidden in import_path:
                    self._add_violation(
                        'forbidden_cross_module_import',
                        'critical',
                        f'Forbidden cross-module import: {import_path}',
                        module_name,
                        file_path,
                        line_num,
                        line_content
                    )
    
    def _check_forbidden_imports(self, file_path, module_name):
        """Check for forbidden imports in a file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            forbidden_patterns = self.rules[f'{module_name}_structure']['forbidden_imports']
            relative_path = os.path.relpath(file_path, self.project_root)
            
            for pattern in forbidden_patterns:
                if pattern in content:
                    lines = content.split('\n')
                    for line_num, line in enumerate(lines, 1):
                        if pattern in line and ('import' in line or 'require' in line):
                            self._add_violation(
                                'forbidden_import',
                                'critical',
                                f'Forbidden import pattern: {pattern}',
                                module_name,
                                relative_path,
                                line_num,
                                line.strip()
                            )
        except Exception:
            pass
    
    def _check_root_cleanliness(self, module_name, module_path):
        """Check if module root is clean (no loose files)"""
        allowed_root_files = {
            'package.json', 'tsconfig.json', 'next.config.ts', 'next.config.js',
            'tailwind.config.mjs', 'postcss.config.mjs', 'jest.config.js',
            'eslint.config.mjs', '.eslintrc.json', '.gitignore', 'README.md',
            'nodemon.json', 'example.env', '.env.example'
        }
        
        try:
            items = os.listdir(module_path)
            for item in items:
                item_path = os.path.join(module_path, item)
                if os.path.isfile(item_path) and item not in allowed_root_files:
                    # Check if it's a temporary or generated file
                    if not self._is_acceptable_root_file(item):
                        self._add_violation(
                            'loose_root_file',
                            'low',
                            f'Loose file in module root: {item}',
                            module_name,
                            f'{module_name}/{item}'
                        )
        except Exception:
            pass
    
    def _is_acceptable_root_file(self, filename):
        """Check if a root file is acceptable"""
        acceptable_patterns = [
            r'\.log$',
            r'\.tmp$',
            r'\.temp$',
            r'^\..*',  # Hidden files
            r'.*\.md$',  # Documentation
            r'.*\.txt$'  # Text files
        ]
        
        for pattern in acceptable_patterns:
            if re.search(pattern, filename, re.IGNORECASE):
                return True
        
        return False
    
    def _add_violation(self, rule_type, severity, message, module, file_path, line_num=None, line_content=None):
        """Add a violation to the results"""
        violation = {
            'rule': rule_type,
            'severity': severity,
            'message': message,
            'module': module,
            'file': file_path,
            'line': line_num,
            'line_content': line_content,
            'fixable': self._is_fixable(rule_type)
        }
        
        self.results['violations'].append(violation)
        self.results['summary']['total_violations'] += 1
        self.results['summary']['by_severity'][severity] += 1
        
        if module not in self.results['summary']['by_module']:
            self.results['summary']['by_module'][module] = 0
        self.results['summary']['by_module'][module] += 1
        
        if rule_type not in self.results['summary']['by_rule']:
            self.results['summary']['by_rule'][rule_type] = 0
        self.results['summary']['by_rule'][rule_type] += 1
    
    def _is_fixable(self, rule_type):
        """Determine if a rule violation is auto-fixable"""
        fixable_rules = [
            'incorrect_shared_types',
            'loose_root_file'
        ]
        return rule_type in fixable_rules
    
    def _get_code_files(self, directory):
        """Get all code files in directory recursively"""
        code_files = []
        ignore_dirs = {'node_modules', '.next', 'dist', 'build', 'coverage', '.git'}
        code_extensions = {'.js', '.jsx', '.ts', '.tsx', '.py', '.mjs'}
        
        for root, dirs, files in os.walk(directory):
            # Remove ignored directories
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            
            for file in files:
                if any(file.endswith(ext) for ext in code_extensions):
                    code_files.append(os.path.join(root, file))
        
        return code_files
    
    def _generate_recommendations(self):
        """Generate recommendations based on violations"""
        recommendations = []
        
        critical_count = self.results['summary']['by_severity']['critical']
        if critical_count > 0:
            recommendations.append({
                'category': 'architecture',
                'priority': 'critical',
                'issue': f'Found {critical_count} critical architecture violations',
                'action': 'Fix forbidden cross-module imports immediately'
            })
        
        # Check for specific violation types
        if 'incorrect_shared_types' in self.results['summary']['by_rule']:
            count = self.results['summary']['by_rule']['incorrect_shared_types']
            recommendations.append({
                'category': 'imports',
                'priority': 'medium',
                'issue': f'Found {count} files using @/types instead of @shared/types',
                'action': 'Update import paths to use shared types properly'
            })
        
        if 'excessive_relative_imports' in self.results['summary']['by_rule']:
            count = self.results['summary']['by_rule']['excessive_relative_imports']
            recommendations.append({
                'category': 'maintainability',
                'priority': 'medium',
                'issue': f'Found {count} files with excessive relative imports',
                'action': 'Use absolute imports or path aliases instead'
            })
        
        if 'directory_structure' in self.results['summary']['by_rule']:
            count = self.results['summary']['by_rule']['directory_structure']
            recommendations.append({
                'category': 'structure',
                'priority': 'high',
                'issue': f'Found {count} directory structure violations',
                'action': 'Create missing required directories'
            })
        
        self.results['recommendations'] = recommendations

def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Validate project architecture')
    parser.add_argument('--project-root', default=None, help='Project root directory')
    parser.add_argument('--json', action='store_true', help='Output JSON only')
    args = parser.parse_args()
    
    if args.project_root:
        project_root = args.project_root
    else:
        # Default to grandparent directory (assuming script is in scripts/python/)
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
    
    try:
        validator = ArchitectureValidator(project_root)
        results = validator.validate()
        
        # Output JSON for programmatic use
        print(json.dumps(results, indent=2))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'timestamp': datetime.now().isoformat(),
            'violations': [],
            'summary': {'total_violations': 0}
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == '__main__':
    main()
