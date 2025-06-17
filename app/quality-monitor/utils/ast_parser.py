"""
AST Parser for MathQuest Quality Monitor
Provides utilities for parsing and analyzing JavaScript/TypeScript AST.
"""

import ast
import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Set


class ASTParser:
    """Parser for analyzing JavaScript/TypeScript code using AST patterns."""
    
    def __init__(self):
        self.file_cache = {}
    
    def parse_javascript_file(self, file_path: Path) -> Dict[str, Any]:
        """Parse a JavaScript/TypeScript file and extract key information."""
        try:
            content = file_path.read_text(encoding='utf-8')
            
            # For JS/TS, we'll use regex patterns since we don't have a JS AST parser
            # This is a simplified approach but effective for quality monitoring
            
            analysis = {
                'file': str(file_path),
                'imports': self._extract_imports(content),
                'exports': self._extract_exports(content),
                'functions': self._extract_functions(content),
                'classes': self._extract_classes(content),
                'variables': self._extract_variables(content),
                'hardcoded_strings': self._extract_hardcoded_strings(content),
                'console_statements': self._extract_console_statements(content),
                'todo_comments': self._extract_todo_comments(content),
                'typescript_issues': self._extract_typescript_issues(content),
                'complexity_metrics': self._calculate_complexity_metrics(content)
            }
            
            return analysis
            
        except Exception as e:
            return {
                'file': str(file_path),
                'error': str(e),
                'imports': [],
                'exports': [],
                'functions': [],
                'classes': [],
                'variables': [],
                'hardcoded_strings': [],
                'console_statements': [],
                'todo_comments': [],
                'typescript_issues': [],
                'complexity_metrics': {}
            }
    
    def parse_python_file(self, file_path: Path) -> Dict[str, Any]:
        """Parse a Python file using the built-in AST module."""
        try:
            content = file_path.read_text(encoding='utf-8')
            tree = ast.parse(content)
            
            analysis = {
                'file': str(file_path),
                'imports': self._extract_python_imports(tree),
                'functions': self._extract_python_functions(tree),
                'classes': self._extract_python_classes(tree),
                'variables': self._extract_python_variables(tree),
                'complexity_metrics': self._calculate_python_complexity(tree, content)
            }
            
            return analysis
            
        except Exception as e:
            return {
                'file': str(file_path),
                'error': str(e),
                'imports': [],
                'functions': [],
                'classes': [],
                'variables': [],
                'complexity_metrics': {}
            }
    
    def _extract_imports(self, content: str) -> List[Dict[str, Any]]:
        """Extract import statements from JavaScript/TypeScript."""
        imports = []
        
        # ES6 imports
        import_patterns = [
            r'import\s+(.+?)\s+from\s+[\'"]([^\'"]+)[\'"]',
            r'import\s+[\'"]([^\'"]+)[\'"]',
            r'const\s+(.+?)\s*=\s*require\([\'"]([^\'"]+)[\'"]\)',
            r'import\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)'  # Dynamic imports
        ]
        
        for pattern in import_patterns:
            matches = re.finditer(pattern, content, re.MULTILINE)
            for match in matches:
                if len(match.groups()) == 2:
                    imports.append({
                        'what': match.group(1).strip(),
                        'from': match.group(2),
                        'line': content[:match.start()].count('\n') + 1,
                        'type': 'named' if '{' in match.group(1) else 'default'
                    })
                else:
                    imports.append({
                        'what': '',
                        'from': match.group(1),
                        'line': content[:match.start()].count('\n') + 1,
                        'type': 'side-effect'
                    })
        
        return imports
    
    def _extract_exports(self, content: str) -> List[Dict[str, Any]]:
        """Extract export statements from JavaScript/TypeScript."""
        exports = []
        
        export_patterns = [
            r'export\s+default\s+(\w+)',
            r'export\s+\{([^}]+)\}',
            r'export\s+(const|let|var|function|class)\s+(\w+)',
            r'export\s+\*\s+from\s+[\'"]([^\'"]+)[\'"]'
        ]
        
        for pattern in export_patterns:
            matches = re.finditer(pattern, content, re.MULTILINE)
            for match in matches:
                exports.append({
                    'name': match.group(1) if match.lastindex >= 1 else 'unknown',
                    'type': 'default' if 'default' in match.group(0) else 'named',
                    'line': content[:match.start()].count('\n') + 1
                })
        
        return exports
    
    def _extract_functions(self, content: str) -> List[Dict[str, Any]]:
        """Extract function definitions from JavaScript/TypeScript."""
        functions = []
        
        function_patterns = [
            r'function\s+(\w+)\s*\([^)]*\)\s*\{',
            r'const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{',
            r'(\w+)\s*:\s*\([^)]*\)\s*=>\s*\{',  # Object method
            r'async\s+function\s+(\w+)\s*\([^)]*\)\s*\{',
            r'(\w+)\s*\([^)]*\)\s*\{'  # Method definition
        ]
        
        for pattern in function_patterns:
            matches = re.finditer(pattern, content, re.MULTILINE)
            for match in matches:
                name = match.group(1) if match.group(1) else 'anonymous'
                line_num = content[:match.start()].count('\n') + 1
                
                # Calculate function length
                start_pos = match.end() - 1  # Position of opening brace
                brace_count = 1
                pos = start_pos + 1
                
                while pos < len(content) and brace_count > 0:
                    if content[pos] == '{':
                        brace_count += 1
                    elif content[pos] == '}':
                        brace_count -= 1
                    pos += 1
                
                function_content = content[start_pos:pos]
                lines = function_content.count('\n')
                
                functions.append({
                    'name': name,
                    'line': line_num,
                    'length': lines,
                    'is_async': 'async' in match.group(0),
                    'is_arrow': '=>' in match.group(0)
                })
        
        return functions
    
    def _extract_classes(self, content: str) -> List[Dict[str, Any]]:
        """Extract class definitions from JavaScript/TypeScript."""
        classes = []
        
        class_pattern = r'class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{'
        matches = re.finditer(class_pattern, content, re.MULTILINE)
        
        for match in matches:
            classes.append({
                'name': match.group(1),
                'extends': match.group(2) if match.group(2) else None,
                'line': content[:match.start()].count('\n') + 1
            })
        
        return classes
    
    def _extract_variables(self, content: str) -> List[Dict[str, Any]]:
        """Extract variable declarations from JavaScript/TypeScript."""
        variables = []
        
        var_patterns = [
            r'(const|let|var)\s+(\w+)\s*=',
            r'(\w+)\s*:\s*\w+(?:\[\])?(?:\s*=|;)'  # TypeScript type annotations
        ]
        
        for pattern in var_patterns:
            matches = re.finditer(pattern, content, re.MULTILINE)
            for match in matches:
                var_type = match.group(1) if match.group(1) in ['const', 'let', 'var'] else 'typed'
                var_name = match.group(2) if len(match.groups()) >= 2 else match.group(1)
                
                variables.append({
                    'name': var_name,
                    'type': var_type,
                    'line': content[:match.start()].count('\n') + 1
                })
        
        return variables
    
    def _extract_hardcoded_strings(self, content: str) -> List[Dict[str, Any]]:
        """Extract hardcoded strings that might be problematic."""
        hardcoded = []
        
        # Event names, API endpoints, etc.
        suspicious_patterns = [
            (r'[\'"]\/api\/[^\'"]*[\'"]', 'api_endpoint'),
            (r'[\'"][a-z]+-[a-z-]+[\'"]', 'event_name'),
            (r'[\'"]https?:\/\/[^\'"]+[\'"]', 'url'),
            (r'[\'"][A-Z0-9_]{10,}[\'"]', 'token_or_key')
        ]
        
        for pattern, category in suspicious_patterns:
            matches = re.finditer(pattern, content, re.MULTILINE)
            for match in matches:
                hardcoded.append({
                    'value': match.group(0),
                    'category': category,
                    'line': content[:match.start()].count('\n') + 1,
                    'column': match.start() - content.rfind('\n', 0, match.start())
                })
        
        return hardcoded
    
    def _extract_console_statements(self, content: str) -> List[Dict[str, Any]]:
        """Extract console statements."""
        console_statements = []
        
        console_pattern = r'console\.(log|debug|info|warn|error)\s*\([^)]*\)'
        matches = re.finditer(console_pattern, content, re.MULTILINE)
        
        for match in matches:
            console_statements.append({
                'type': match.group(1),
                'line': content[:match.start()].count('\n') + 1,
                'statement': match.group(0)
            })
        
        return console_statements
    
    def _extract_todo_comments(self, content: str) -> List[Dict[str, Any]]:
        """Extract TODO/FIXME comments."""
        todos = []
        
        todo_pattern = r'\/\/\s*(TODO|FIXME|HACK|XXX|NOTE):?\s*(.*)$'
        matches = re.finditer(todo_pattern, content, re.MULTILINE | re.IGNORECASE)
        
        for match in matches:
            todos.append({
                'type': match.group(1).upper(),
                'message': match.group(2).strip(),
                'line': content[:match.start()].count('\n') + 1
            })
        
        return todos
    
    def _extract_typescript_issues(self, content: str) -> List[Dict[str, Any]]:
        """Extract TypeScript-specific issues."""
        issues = []
        
        # Type assertions
        type_assertion_patterns = [
            r'<\w+>',  # <Type>
            r'as\s+\w+',  # as Type
            r':\s*any\b',  # : any
            r'@ts-ignore',  # @ts-ignore comments
            r'@ts-nocheck'  # @ts-nocheck comments
        ]
        
        categories = ['type_assertion', 'type_assertion', 'any_usage', 'ts_ignore', 'ts_nocheck']
        
        for pattern, category in zip(type_assertion_patterns, categories):
            matches = re.finditer(pattern, content, re.MULTILINE)
            for match in matches:
                issues.append({
                    'category': category,
                    'pattern': match.group(0),
                    'line': content[:match.start()].count('\n') + 1
                })
        
        return issues
    
    def _calculate_complexity_metrics(self, content: str) -> Dict[str, Any]:
        """Calculate basic complexity metrics."""
        lines = content.split('\n')
        
        metrics = {
            'total_lines': len(lines),
            'code_lines': len([line for line in lines if line.strip() and not line.strip().startswith('//')]),
            'comment_lines': len([line for line in lines if line.strip().startswith('//')]),
            'blank_lines': len([line for line in lines if not line.strip()]),
            'cyclomatic_complexity': self._calculate_cyclomatic_complexity(content),
            'nesting_depth': self._calculate_max_nesting_depth(content)
        }
        
        return metrics
    
    def _calculate_cyclomatic_complexity(self, content: str) -> int:
        """Calculate cyclomatic complexity."""
        # Count decision points
        decision_keywords = ['if', 'else if', 'while', 'for', 'case', 'catch', '&&', '||', '?']
        complexity = 1  # Base complexity
        
        for keyword in decision_keywords:
            if keyword in ['&&', '||', '?']:
                complexity += content.count(keyword)
            else:
                # Use word boundaries for keywords
                pattern = r'\b' + re.escape(keyword) + r'\b'
                complexity += len(re.findall(pattern, content))
        
        return complexity
    
    def _calculate_max_nesting_depth(self, content: str) -> int:
        """Calculate maximum nesting depth."""
        max_depth = 0
        current_depth = 0
        
        for char in content:
            if char == '{':
                current_depth += 1
                max_depth = max(max_depth, current_depth)
            elif char == '}':
                current_depth = max(0, current_depth - 1)
        
        return max_depth
    
    def _extract_python_imports(self, tree: ast.AST) -> List[Dict[str, Any]]:
        """Extract imports from Python AST."""
        imports = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append({
                        'what': alias.name,
                        'alias': alias.asname,
                        'line': node.lineno,
                        'type': 'import'
                    })
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ''
                for alias in node.names:
                    imports.append({
                        'what': alias.name,
                        'from': module,
                        'alias': alias.asname,
                        'line': node.lineno,
                        'type': 'from_import'
                    })
        
        return imports
    
    def _extract_python_functions(self, tree: ast.AST) -> List[Dict[str, Any]]:
        """Extract functions from Python AST."""
        functions = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                functions.append({
                    'name': node.name,
                    'line': node.lineno,
                    'args': [arg.arg for arg in node.args.args],
                    'is_async': isinstance(node, ast.AsyncFunctionDef),
                    'decorators': [d.id if isinstance(d, ast.Name) else str(d) for d in node.decorator_list]
                })
        
        return functions
    
    def _extract_python_classes(self, tree: ast.AST) -> List[Dict[str, Any]]:
        """Extract classes from Python AST."""
        classes = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                bases = []
                for base in node.bases:
                    if isinstance(base, ast.Name):
                        bases.append(base.id)
                
                classes.append({
                    'name': node.name,
                    'line': node.lineno,
                    'bases': bases,
                    'decorators': [d.id if isinstance(d, ast.Name) else str(d) for d in node.decorator_list]
                })
        
        return classes
    
    def _extract_python_variables(self, tree: ast.AST) -> List[Dict[str, Any]]:
        """Extract variable assignments from Python AST."""
        variables = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        variables.append({
                            'name': target.id,
                            'line': node.lineno,
                            'type': 'assignment'
                        })
        
        return variables
    
    def _calculate_python_complexity(self, tree: ast.AST, content: str) -> Dict[str, Any]:
        """Calculate complexity metrics for Python code."""
        lines = content.split('\n')
        
        # Count different node types
        node_counts = {}
        for node in ast.walk(tree):
            node_type = type(node).__name__
            node_counts[node_type] = node_counts.get(node_type, 0) + 1
        
        return {
            'total_lines': len(lines),
            'code_lines': len([line for line in lines if line.strip() and not line.strip().startswith('#')]),
            'comment_lines': len([line for line in lines if line.strip().startswith('#')]),
            'blank_lines': len([line for line in lines if not line.strip()]),
            'node_counts': node_counts,
            'functions': node_counts.get('FunctionDef', 0) + node_counts.get('AsyncFunctionDef', 0),
            'classes': node_counts.get('ClassDef', 0)
        }
