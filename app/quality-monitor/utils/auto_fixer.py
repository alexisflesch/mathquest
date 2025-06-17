"""
Auto-fixer for MathQuest Quality Monitor
Applies safe automatic fixes for common code quality issues.
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, Any, List, Optional


class AutoFixer:
    """Applies automatic fixes for safe code quality issues."""
    
    def __init__(self, project_root: Path):
        self.project_root = Path(project_root)
        self.backup_dir = self.project_root / '.quality-monitor-backups'
        self.backup_dir.mkdir(exist_ok=True)
    
    def apply_fix(self, recommendation: Dict[str, Any]) -> Dict[str, Any]:
        """Apply a fix based on a recommendation."""
        fix_result = {
            'success': False,
            'recommendation': recommendation,
            'files_modified': [],
            'backup_created': False,
            'error': None
        }
        
        try:
            category = recommendation.get('category', '')
            source = recommendation.get('source', '')
            
            # Route to appropriate fix method
            if category == 'imports' and 'hardcoded' in recommendation.get('issue', '').lower():
                return self._fix_hardcoded_imports(recommendation)
            elif category == 'console' and 'console.log' in recommendation.get('issue', ''):
                return self._fix_console_statements(recommendation)
            elif category == 'unused' and 'unused' in recommendation.get('issue', '').lower():
                return self._fix_unused_code(recommendation)
            elif category == 'formatting' or 'format' in recommendation.get('action', '').lower():
                return self._fix_formatting_issues(recommendation)
            elif category == 'dependencies':
                return self._fix_dependency_issues(recommendation)
            else:
                fix_result['error'] = f"No auto-fix available for category: {category}"
                return fix_result
                
        except Exception as e:
            fix_result['error'] = str(e)
            return fix_result
    
    def _fix_hardcoded_imports(self, recommendation: Dict[str, Any]) -> Dict[str, Any]:
        """Fix hardcoded import paths and event names."""
        fix_result = {
            'success': False,
            'recommendation': recommendation,
            'files_modified': [],
            'backup_created': False,
            'error': None
        }
        
        try:
            # Look for TypeScript/JavaScript files with hardcoded imports
            for file_path in self._find_files_with_extensions(['.ts', '.tsx', '.js', '.jsx']):
                content = file_path.read_text(encoding='utf-8')
                original_content = content
                
                # Fix hardcoded event names
                content = self._fix_event_names(content)
                
                # Fix relative import paths
                content = self._fix_import_paths(content, file_path)
                
                # If content changed, create backup and save
                if content != original_content:
                    self._create_backup(file_path)
                    file_path.write_text(content, encoding='utf-8')
                    fix_result['files_modified'].append(str(file_path))
                    fix_result['backup_created'] = True
            
            fix_result['success'] = len(fix_result['files_modified']) > 0
            if not fix_result['success']:
                fix_result['error'] = "No hardcoded imports found to fix"
                
        except Exception as e:
            fix_result['error'] = str(e)
        
        return fix_result
    
    def _fix_console_statements(self, recommendation: Dict[str, Any]) -> Dict[str, Any]:
        """Remove or replace console.log statements."""
        fix_result = {
            'success': False,
            'recommendation': recommendation,
            'files_modified': [],
            'backup_created': False,
            'error': None
        }
        
        try:
            # Pattern to match console.log statements
            console_patterns = [
                r'console\.log\([^)]*\);?\s*\n?',
                r'console\.debug\([^)]*\);?\s*\n?',
                r'console\.info\([^)]*\);?\s*\n?'
            ]
            
            for file_path in self._find_files_with_extensions(['.ts', '.tsx', '.js', '.jsx']):
                content = file_path.read_text(encoding='utf-8')
                original_content = content
                
                # Remove console statements
                for pattern in console_patterns:
                    content = re.sub(pattern, '', content, flags=re.MULTILINE)
                
                # Clean up extra blank lines
                content = re.sub(r'\n\s*\n\s*\n', r'\n\n', content)
                
                if content != original_content:
                    self._create_backup(file_path)
                    file_path.write_text(content, encoding='utf-8')
                    fix_result['files_modified'].append(str(file_path))
                    fix_result['backup_created'] = True
            
            fix_result['success'] = len(fix_result['files_modified']) > 0
            if not fix_result['success']:
                fix_result['error'] = "No console statements found to fix"
                
        except Exception as e:
            fix_result['error'] = str(e)
        
        return fix_result
    
    def _fix_unused_code(self, recommendation: Dict[str, Any]) -> Dict[str, Any]:
        """Remove unused imports and variables (conservative approach)."""
        fix_result = {
            'success': False,
            'recommendation': recommendation,
            'files_modified': [],
            'backup_created': False,
            'error': None
        }
        
        try:
            # Only remove obviously unused imports (very conservative)
            unused_import_patterns = [
                r'import\s+\{\s*\}\s+from\s+[\'"][^\'"]+[\'"];?\s*\n?',  # Empty imports
                r'import\s+[\'"][^\'"]+[\'"];\s*\n?(?=\s*import)',  # Duplicate imports
            ]
            
            for file_path in self._find_files_with_extensions(['.ts', '.tsx', '.js', '.jsx']):
                content = file_path.read_text(encoding='utf-8')
                original_content = content
                
                # Remove obviously unused imports
                for pattern in unused_import_patterns:
                    content = re.sub(pattern, '', content, flags=re.MULTILINE)
                
                if content != original_content:
                    self._create_backup(file_path)
                    file_path.write_text(content, encoding='utf-8')
                    fix_result['files_modified'].append(str(file_path))
                    fix_result['backup_created'] = True
            
            fix_result['success'] = len(fix_result['files_modified']) > 0
            if not fix_result['success']:
                fix_result['error'] = "No safe unused code fixes available"
                
        except Exception as e:
            fix_result['error'] = str(e)
        
        return fix_result
    
    def _fix_formatting_issues(self, recommendation: Dict[str, Any]) -> Dict[str, Any]:
        """Fix basic formatting issues."""
        fix_result = {
            'success': False,
            'recommendation': recommendation,
            'files_modified': [],
            'backup_created': False,
            'error': None
        }
        
        try:
            for file_path in self._find_files_with_extensions(['.ts', '.tsx', '.js', '.jsx']):
                content = file_path.read_text(encoding='utf-8')
                original_content = content
                
                # Fix trailing whitespace
                content = re.sub(r'[ \t]+$', '', content, flags=re.MULTILINE)
                
                # Fix multiple blank lines
                content = re.sub(r'\n{3,}', r'\n\n', content)
                
                # Ensure file ends with single newline
                content = content.rstrip() + '\n'
                
                # Fix simple spacing issues
                content = re.sub(r'\s+;', ';', content)  # Remove space before semicolon
                content = re.sub(r'{\s+', '{ ', content)  # Fix brace spacing
                content = re.sub(r'\s+}', ' }', content)  # Fix brace spacing
                
                if content != original_content:
                    self._create_backup(file_path)
                    file_path.write_text(content, encoding='utf-8')
                    fix_result['files_modified'].append(str(file_path))
                    fix_result['backup_created'] = True
            
            fix_result['success'] = len(fix_result['files_modified']) > 0
            if not fix_result['success']:
                fix_result['error'] = "No formatting issues found to fix"
                
        except Exception as e:
            fix_result['error'] = str(e)
        
        return fix_result
    
    def _fix_dependency_issues(self, recommendation: Dict[str, Any]) -> Dict[str, Any]:
        """Fix package.json dependency issues."""
        fix_result = {
            'success': False,
            'recommendation': recommendation,
            'files_modified': [],
            'backup_created': False,
            'error': None
        }
        
        try:
            # Find package.json files
            package_json_files = list(self.project_root.rglob('package.json'))
            
            for package_file in package_json_files:
                # Skip node_modules
                if 'node_modules' in str(package_file):
                    continue
                
                with open(package_file, 'r') as f:
                    package_data = json.load(f)
                
                original_data = json.dumps(package_data, sort_keys=True)
                
                # Fix common dependency issues
                if 'dependencies' in package_data and 'devDependencies' in package_data:
                    # Remove duplicates between deps and devDeps
                    deps = set(package_data['dependencies'].keys())
                    dev_deps = set(package_data['devDependencies'].keys())
                    
                    # Move development-only packages to devDependencies
                    dev_only_packages = {'eslint', 'typescript', 'jest', '@types/', 'prettier'}
                    for dep_name in list(package_data['dependencies'].keys()):
                        if any(dev_pkg in dep_name for dev_pkg in dev_only_packages):
                            if dep_name not in package_data['devDependencies']:
                                package_data['devDependencies'][dep_name] = package_data['dependencies'][dep_name]
                                del package_data['dependencies'][dep_name]
                
                new_data = json.dumps(package_data, sort_keys=True)
                
                if new_data != original_data:
                    self._create_backup(package_file)
                    with open(package_file, 'w') as f:
                        json.dump(package_data, f, indent=2)
                    fix_result['files_modified'].append(str(package_file))
                    fix_result['backup_created'] = True
            
            fix_result['success'] = len(fix_result['files_modified']) > 0
            if not fix_result['success']:
                fix_result['error'] = "No dependency issues found to fix"
                
        except Exception as e:
            fix_result['error'] = str(e)
        
        return fix_result
    
    def _fix_event_names(self, content: str) -> str:
        """Fix hardcoded event names with constants."""
        # Common hardcoded event patterns
        event_replacements = {
            r'"user-joined"': 'EVENTS.USER_JOINED',
            r"'user-joined'": 'EVENTS.USER_JOINED',
            r'"user-left"': 'EVENTS.USER_LEFT',
            r"'user-left'": 'EVENTS.USER_LEFT',
            r'"game-started"': 'EVENTS.GAME_STARTED',
            r"'game-started'": 'EVENTS.GAME_STARTED',
            r'"game-ended"': 'EVENTS.GAME_ENDED',
            r"'game-ended'": 'EVENTS.GAME_ENDED',
            r'"question-answered"': 'EVENTS.QUESTION_ANSWERED',
            r"'question-answered'": 'EVENTS.QUESTION_ANSWERED',
        }
        
        for pattern, replacement in event_replacements.items():
            content = re.sub(pattern, replacement, content)
        
        return content
    
    def _fix_import_paths(self, content: str, file_path: Path) -> str:
        """Fix relative import paths."""
        # Fix common import path issues
        import_patterns = [
            (r'from [\'"]\.\.\/\.\.\/\.\.\/([^\'"]+)[\'"]', r'from "@/\1"'),  # Deep relative to absolute
            (r'from [\'"]\.\.\/\.\.\/([^\'"]+)[\'"]', r'from "@/\1"'),  # Relative to absolute
        ]
        
        for pattern, replacement in import_patterns:
            content = re.sub(pattern, replacement, content)
        
        return content
    
    def _find_files_with_extensions(self, extensions: List[str]) -> List[Path]:
        """Find all files with given extensions in the project."""
        files = []
        
        for ext in extensions:
            pattern = f"**/*{ext}"
            files.extend(self.project_root.rglob(pattern))
        
        # Filter out node_modules and other irrelevant directories
        filtered_files = []
        for file_path in files:
            path_str = str(file_path)
            if not any(ignore in path_str for ignore in ['node_modules', '.git', 'dist', 'build', '.next']):
                filtered_files.append(file_path)
        
        return filtered_files
    
    def _create_backup(self, file_path: Path) -> Path:
        """Create a backup of the file before modifying it."""
        from datetime import datetime
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"{file_path.name}.{timestamp}.backup"
        
        # Create backup directory structure
        relative_path = file_path.relative_to(self.project_root)
        backup_file = self.backup_dir / relative_path.parent / backup_name
        backup_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Copy file to backup
        import shutil
        shutil.copy2(file_path, backup_file)
        
        return backup_file
    
    def restore_backup(self, backup_path: Path, original_path: Path) -> bool:
        """Restore a file from backup."""
        try:
            import shutil
            shutil.copy2(backup_path, original_path)
            return True
        except Exception:
            return False
    
    def list_backups(self) -> List[Dict[str, Any]]:
        """List all available backups."""
        backups = []
        
        for backup_file in self.backup_dir.rglob("*.backup"):
            parts = backup_file.name.split('.')
            if len(parts) >= 3:
                original_name = '.'.join(parts[:-2])
                timestamp = parts[-2]
                
                backups.append({
                    'backup_path': backup_file,
                    'original_name': original_name,
                    'timestamp': timestamp,
                    'size': backup_file.stat().st_size
                })
        
        return sorted(backups, key=lambda x: x['timestamp'], reverse=True)
