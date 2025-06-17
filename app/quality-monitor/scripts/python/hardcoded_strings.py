#!/usr/bin/env python3

import os
import re
import json
import sys
from datetime import datetime

class HardcodedStringsAnalyzer:
    """
    Analyzes code for hardcoded strings that should be configurable
    """
    
    def __init__(self, project_root):
        self.project_root = project_root
        self.frontend_path = os.path.join(project_root, 'frontend')
        self.backend_path = os.path.join(project_root, 'backend')
        self.shared_path = os.path.join(project_root, 'shared')
        
        # Patterns for different types of hardcoded strings
        self.patterns = {
            'urls': {
                'pattern': r'["\']https?://[^\s"\']+["\']',
                'severity': 'medium',
                'description': 'Hardcoded URL found'
            },
            'api_endpoints': {
                'pattern': r'["\'][/][a-zA-Z0-9/_-]+["\']',
                'severity': 'medium', 
                'description': 'Hardcoded API endpoint'
            },
            'error_messages': {
                'pattern': r'(?:throw new Error|console\.error|logger\.error)\s*\(\s*["\'][^"\']{20,}["\']',
                'severity': 'low',
                'description': 'Hardcoded error message'
            },
            'user_messages': {
                'pattern': r'(?:alert|confirm|prompt)\s*\(\s*["\'][^"\']{10,}["\']',
                'severity': 'high',
                'description': 'Hardcoded user-facing message'
            },
            'socket_events': {
                'pattern': r'(?:emit|on|once)\s*\(\s*["\'][a-zA-Z_][a-zA-Z0-9_-]*["\']',
                'severity': 'high',
                'description': 'Hardcoded socket event name'
            },
            'database_queries': {
                'pattern': r'["\'](?:SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s+[^"\']*["\']',
                'severity': 'high',
                'description': 'Hardcoded SQL query'
            },
            'file_paths': {
                'pattern': r'["\'](?:[./]|[A-Za-z]:\\)[^"\']*["\']',
                'severity': 'medium',
                'description': 'Hardcoded file path'
            },
            'magic_numbers': {
                'pattern': r'(?<!\w)(?:timeout|delay|limit|max|min|size|length|width|height)\s*[:=]\s*\d{3,}',
                'severity': 'medium',
                'description': 'Magic number (should be configurable)'
            }
        }
        
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'hardcoded_strings': [],
            'summary': {
                'total_files': 0,
                'total_issues': 0,
                'by_severity': {'high': 0, 'medium': 0, 'low': 0},
                'by_type': {}
            },
            'recommendations': []
        }
    
    def analyze(self):
        """Main analysis entry point"""
        modules = [
            ('frontend', self.frontend_path),
            ('backend', self.backend_path), 
            ('shared', self.shared_path)
        ]
        
        for module_name, module_path in modules:
            if os.path.exists(module_path):
                self._analyze_module(module_name, module_path)
        
        self._generate_recommendations()
        return self.results
    
    def _analyze_module(self, module_name, module_path):
        """Analyze a specific module for hardcoded strings"""
        files = self._get_code_files(module_path)
        
        for file_path in files:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    self._analyze_file(file_path, content, module_name)
                    self.results['summary']['total_files'] += 1
            except Exception as e:
                continue
    
    def _analyze_file(self, file_path, content, module_name):
        """Analyze a single file for hardcoded strings"""
        relative_path = os.path.relpath(file_path, self.project_root)
        lines = content.split('\n')
        
        for pattern_name, pattern_info in self.patterns.items():
            matches = re.finditer(pattern_info['pattern'], content, re.IGNORECASE | re.MULTILINE)
            
            for match in matches:
                # Skip if it's in a comment
                if self._is_in_comment(content, match.start()):
                    continue
                
                # Get line number
                line_num = content[:match.start()].count('\n') + 1
                line_content = lines[line_num - 1].strip() if line_num <= len(lines) else ""
                
                # Skip certain safe patterns
                if self._is_safe_pattern(match.group(), pattern_name, line_content):
                    continue
                
                issue = {
                    'file': relative_path,
                    'module': module_name,
                    'line': line_num,
                    'column': match.start() - content.rfind('\n', 0, match.start()),
                    'type': pattern_name,
                    'severity': pattern_info['severity'],
                    'description': pattern_info['description'],
                    'matched_text': match.group(),
                    'line_content': line_content,
                    'fixable': self._is_fixable(pattern_name)
                }
                
                self.results['hardcoded_strings'].append(issue)
                self.results['summary']['total_issues'] += 1
                self.results['summary']['by_severity'][pattern_info['severity']] += 1
                
                if pattern_name not in self.results['summary']['by_type']:
                    self.results['summary']['by_type'][pattern_name] = 0
                self.results['summary']['by_type'][pattern_name] += 1
    
    def _is_in_comment(self, content, position):
        """Check if position is within a comment"""
        # Check for single-line comment
        line_start = content.rfind('\n', 0, position) + 1
        line_to_pos = content[line_start:position]
        if '//' in line_to_pos:
            return True
        
        # Check for multi-line comment
        before_pos = content[:position]
        last_comment_start = before_pos.rfind('/*')
        last_comment_end = before_pos.rfind('*/')
        
        return last_comment_start > last_comment_end
    
    def _is_safe_pattern(self, matched_text, pattern_name, line_content):
        """Check if the matched pattern is safe to ignore"""
        safe_patterns = {
            'urls': [
                'localhost',
                '127.0.0.1',
                'example.com',
                'test.com'
            ],
            'api_endpoints': [
                '/api',
                '/health',
                '/ping'
            ],
            'socket_events': [
                'connection',
                'disconnect',
                'error'
            ]
        }
        
        if pattern_name in safe_patterns:
            for safe in safe_patterns[pattern_name]:
                if safe in matched_text.lower():
                    return True
        
        # Skip import statements
        if 'import' in line_content or 'require(' in line_content:
            return True
        
        # Skip test files with obvious test data
        if any(test_word in line_content.lower() for test_word in ['test', 'mock', 'fixture', 'stub']):
            return True
        
        return False
    
    def _is_fixable(self, pattern_name):
        """Determine if this type of hardcoded string is auto-fixable"""
        fixable_patterns = ['socket_events', 'magic_numbers']
        return pattern_name in fixable_patterns
    
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
        """Generate recommendations based on analysis"""
        recommendations = []
        
        high_severity = self.results['summary']['by_severity']['high']
        if high_severity > 0:
            recommendations.append({
                'category': 'critical',
                'priority': 'high',
                'issue': f'Found {high_severity} high-severity hardcoded strings',
                'action': 'Move user-facing messages, socket events, and SQL queries to configuration files'
            })
        
        medium_severity = self.results['summary']['by_severity']['medium'] 
        if medium_severity > 10:
            recommendations.append({
                'category': 'maintainability',
                'priority': 'medium', 
                'issue': f'Found {medium_severity} medium-severity hardcoded strings',
                'action': 'Consider extracting URLs, file paths, and magic numbers to constants'
            })
        
        # Check for specific patterns
        if 'socket_events' in self.results['summary']['by_type']:
            count = self.results['summary']['by_type']['socket_events']
            recommendations.append({
                'category': 'architecture',
                'priority': 'high',
                'issue': f'Found {count} hardcoded socket event names',
                'action': 'Extract socket events to shared constants to prevent typos'
            })
        
        if 'user_messages' in self.results['summary']['by_type']:
            count = self.results['summary']['by_type']['user_messages']
            recommendations.append({
                'category': 'i18n',
                'priority': 'medium',
                'issue': f'Found {count} hardcoded user messages',
                'action': 'Implement internationalization (i18n) system for user-facing text'
            })
        
        self.results['recommendations'] = recommendations

def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Analyze hardcoded strings in code')
    parser.add_argument('--project-root', default=None, help='Project root directory')
    parser.add_argument('--json', action='store_true', help='Output JSON only')
    args = parser.parse_args()
    
    if args.project_root:
        project_root = args.project_root
    else:
        # Default to grandparent directory (assuming script is in scripts/python/)
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
    
    try:
        analyzer = HardcodedStringsAnalyzer(project_root)
        results = analyzer.analyze()
        
        # Output JSON for programmatic use
        print(json.dumps(results, indent=2))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'timestamp': datetime.now().isoformat(),
            'hardcoded_strings': [],
            'summary': {'total_files': 0, 'total_issues': 0}
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == '__main__':
    main()
