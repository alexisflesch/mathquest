#!/usr/bin/env python3

import os
import json
import sys
import re
from datetime import datetime
from pathlib import Path

class PerformanceAnalyzer:
    """
    Analyzes code for performance anti-patterns and red flags
    """
    
    def __init__(self, project_root):
        self.project_root = project_root
        self.frontend_path = os.path.join(project_root, 'frontend')
        self.backend_path = os.path.join(project_root, 'backend')
        self.shared_path = os.path.join(project_root, 'shared')
        
        # Performance anti-patterns
        self.patterns = {
            'react_patterns': {
                'inline_functions': {
                    'pattern': r'(?:onClick|onChange|onSubmit|onKeyDown|onKeyUp|onFocus|onBlur)\s*=\s*\{[^}]*=>[^}]*\}',
                    'severity': 'medium',
                    'description': 'Inline function in JSX prop (causes re-renders)'
                },
                'missing_key_prop': {
                    'pattern': r'\.map\s*\([^)]*\)\s*\.map\s*\([^)]*\)|\.map\s*\([^)]*=>\s*<[^>]*(?!.*key=)',
                    'severity': 'high',
                    'description': 'Missing key prop in mapped JSX elements'
                },
                'unnecessary_rerenders': {
                    'pattern': r'useState\s*\(\s*\{\s*\}|\[\s*\]|\s*new\s+Date\(\)',
                    'severity': 'medium',
                    'description': 'Object/array/date creation in useState (causes re-renders)'
                }
            },
            'database_patterns': {
                'n_plus_one': {
                    'pattern': r'for\s*\([^)]*\)\s*\{[^}]*(?:findUnique|findFirst|findMany)[^}]*\}',
                    'severity': 'critical',
                    'description': 'Potential N+1 query pattern'
                },
                'missing_indexes': {
                    'pattern': r'where:\s*\{[^}]*(?:email|username|slug|userId)(?![^}]*index)',
                    'severity': 'high',
                    'description': 'Query on field that should be indexed'
                },
                'large_result_sets': {
                    'pattern': r'findMany\(\)\s*(?!.*take\s*:|.*limit\s*:)',
                    'severity': 'medium',
                    'description': 'Potentially unbounded query (missing pagination)'
                }
            },
            'async_patterns': {
                'blocking_operations': {
                    'pattern': r'(?:fs\.readFileSync|fs\.writeFileSync|JSON\.parse\s*\([^)]*fs\.read)',
                    'severity': 'high',
                    'description': 'Synchronous file operation (blocks event loop)'
                },
                'promise_antipatterns': {
                    'pattern': r'new Promise\s*\(\s*\([^)]*\)\s*=>\s*\{[^}]*(?:setTimeout|setInterval)',
                    'severity': 'medium',
                    'description': 'Manual Promise wrapping (use util.promisify or async/await)'
                },
                'unhandled_promises': {
                    'pattern': r'(?<!await\s)(?<!return\s)(?:fetch\(|axios\.|api\.)',
                    'severity': 'medium',
                    'description': 'Async operation without await or error handling'
                }
            },
            'memory_patterns': {
                'memory_leaks': {
                    'pattern': r'setInterval\s*\([^)]*\)(?![^}]*clearInterval)',
                    'severity': 'high',
                    'description': 'setInterval without clearInterval (potential memory leak)'
                },
                'large_objects': {
                    'pattern': r'JSON\.stringify\s*\([^)]*\)(?![^}]*\.slice\()',
                    'severity': 'low',
                    'description': 'Large JSON stringify operation'
                },
                'dom_leaks': {
                    'pattern': r'addEventListener\s*\([^)]*\)(?![^}]*removeEventListener)',
                    'severity': 'medium',
                    'description': 'Event listener without cleanup'
                }
            },
            'algorithm_patterns': {
                'nested_loops': {
                    'pattern': r'for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)\s*\{[^}]*for\s*\(',
                    'severity': 'high',
                    'description': 'Triple nested loop (O(n³) complexity)'
                },
                'inefficient_search': {
                    'pattern': r'\.find\s*\([^)]*\)\.find\s*\(|\.filter\s*\([^)]*\)\.find\s*\(',
                    'severity': 'medium',
                    'description': 'Chained array searches (inefficient)'
                },
                'repeated_calculations': {
                    'pattern': r'Math\.\w+\([^)]*\).*Math\.\w+\([^)]*\)',
                    'severity': 'low',
                    'description': 'Repeated mathematical calculations'
                }
            }
        }
        
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'performance_issues': [],
            'summary': {
                'total_files': 0,
                'total_issues': 0,
                'by_severity': {'critical': 0, 'high': 0, 'medium': 0, 'low': 0},
                'by_category': {},
                'by_module': {}
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
        """Analyze a specific module for performance issues"""
        files = self._get_code_files(module_path)
        
        for file_path in files:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    self._analyze_file(file_path, content, module_name)
                    self.results['summary']['total_files'] += 1
            except Exception:
                continue
    
    def _analyze_file(self, file_path, content, module_name):
        """Analyze a single file for performance issues"""
        relative_path = os.path.relpath(file_path, self.project_root)
        lines = content.split('\n')
        
        # Determine which pattern categories to check based on file type
        categories_to_check = self._get_relevant_categories(file_path, module_name)
        
        for category in categories_to_check:
            if category in self.patterns:
                for pattern_name, pattern_info in self.patterns[category].items():
                    self._check_pattern(
                        pattern_info, pattern_name, category,
                        content, lines, relative_path, module_name
                    )
    
    def _get_relevant_categories(self, file_path, module_name):
        """Determine which pattern categories are relevant for this file"""
        categories = ['async_patterns', 'memory_patterns', 'algorithm_patterns']
        
        file_ext = os.path.splitext(file_path)[1].lower()
        
        # React-specific patterns for frontend JSX/TSX files
        if module_name == 'frontend' and file_ext in ['.jsx', '.tsx']:
            categories.append('react_patterns')
        
        # Database patterns for backend files
        if module_name == 'backend' and any(keyword in file_path.lower() 
                                          for keyword in ['model', 'db', 'database', 'prisma']):
            categories.append('database_patterns')
        
        return categories
    
    def _check_pattern(self, pattern_info, pattern_name, category, content, lines, file_path, module_name):
        """Check for a specific performance pattern in the file"""
        matches = re.finditer(pattern_info['pattern'], content, re.MULTILINE | re.DOTALL)
        
        for match in matches:
            # Skip if it's in a comment
            if self._is_in_comment(content, match.start()):
                continue
            
            # Get line number
            line_num = content[:match.start()].count('\n') + 1
            line_content = lines[line_num - 1].strip() if line_num <= len(lines) else ""
            
            # Skip test files unless it's a critical issue
            if self._is_test_file(file_path) and pattern_info['severity'] not in ['critical', 'high']:
                continue
            
            issue = {
                'file': file_path,
                'module': module_name,
                'category': category,
                'pattern': pattern_name,
                'line': line_num,
                'column': match.start() - content.rfind('\n', 0, match.start()),
                'severity': pattern_info['severity'],
                'description': pattern_info['description'],
                'matched_text': match.group()[:100] + ('...' if len(match.group()) > 100 else ''),
                'line_content': line_content,
                'fixable': self._is_fixable(pattern_name, category)
            }
            
            self.results['performance_issues'].append(issue)
            self.results['summary']['total_issues'] += 1
            self.results['summary']['by_severity'][pattern_info['severity']] += 1
            
            if category not in self.results['summary']['by_category']:
                self.results['summary']['by_category'][category] = 0
            self.results['summary']['by_category'][category] += 1
            
            if module_name not in self.results['summary']['by_module']:
                self.results['summary']['by_module'][module_name] = 0
            self.results['summary']['by_module'][module_name] += 1
    
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
    
    def _is_test_file(self, file_path):
        """Check if this is a test file"""
        test_indicators = ['.test.', '.spec.', '__tests__', '/test/', '/tests/']
        return any(indicator in file_path.lower() for indicator in test_indicators)
    
    def _is_fixable(self, pattern_name, category):
        """Determine if this performance issue is auto-fixable"""
        fixable_patterns = {
            'react_patterns': ['missing_key_prop'],
            'async_patterns': ['promise_antipatterns'],
            'memory_patterns': [],
            'database_patterns': [],
            'algorithm_patterns': []
        }
        
        return pattern_name in fixable_patterns.get(category, [])
    
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
        """Generate recommendations based on performance analysis"""
        recommendations = []
        
        critical_count = self.results['summary']['by_severity']['critical']
        if critical_count > 0:
            recommendations.append({
                'category': 'performance',
                'priority': 'critical',
                'issue': f'Found {critical_count} critical performance issues',
                'action': 'Fix N+1 queries and blocking operations immediately'
            })
        
        high_count = self.results['summary']['by_severity']['high']
        if high_count > 0:
            recommendations.append({
                'category': 'performance',
                'priority': 'high',
                'issue': f'Found {high_count} high-priority performance issues',
                'action': 'Address missing indexes, memory leaks, and algorithmic complexity'
            })
        
        # Category-specific recommendations
        if 'react_patterns' in self.results['summary']['by_category']:
            count = self.results['summary']['by_category']['react_patterns']
            recommendations.append({
                'category': 'react_performance',
                'priority': 'medium',
                'issue': f'Found {count} React performance anti-patterns',
                'action': 'Use useCallback, useMemo, and proper key props'
            })
        
        if 'database_patterns' in self.results['summary']['by_category']:
            count = self.results['summary']['by_category']['database_patterns']
            recommendations.append({
                'category': 'database_performance',
                'priority': 'high',
                'issue': f'Found {count} database performance issues',
                'action': 'Add indexes, implement pagination, and optimize queries'
            })
        
        if 'memory_patterns' in self.results['summary']['by_category']:
            count = self.results['summary']['by_category']['memory_patterns']
            recommendations.append({
                'category': 'memory_management',
                'priority': 'medium',
                'issue': f'Found {count} potential memory leaks',
                'action': 'Add proper cleanup for intervals and event listeners'
            })
        
        self.results['recommendations'] = recommendations

def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Analyze performance issues in code')
    parser.add_argument('--project-root', default=None, help='Project root directory')
    parser.add_argument('--json', action='store_true', help='Output JSON only')
    args = parser.parse_args()
    
    if args.project_root:
        project_root = args.project_root
    else:
        # Default to grandparent directory (assuming script is in scripts/python/)
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
    
    try:
        analyzer = PerformanceAnalyzer(project_root)
        results = analyzer.analyze()
        
        # Output JSON for programmatic use
        print(json.dumps(results, indent=2))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'timestamp': datetime.now().isoformat(),
            'performance_issues': [],
            'summary': {'total_issues': 0}
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == '__main__':
    main()
