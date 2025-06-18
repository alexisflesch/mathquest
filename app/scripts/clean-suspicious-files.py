#!/usr/bin/env python3
"""
Suspicious Files Cleaner
Identifies and handles backup, temporary, and duplicate files that clutter the codebase.
"""

import os
import re
import shutil
import sys
from pathlib import Path
from typing import List, Dict, Set


class SuspiciousFilesCleaner:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.backup_dir = self.project_root / ".quality-monitor-backups"
        self.backup_dir.mkdir(exist_ok=True)
        
        print(f"🧹 Starting Suspicious Files Cleaner...")
        print(f"📁 Project root: {self.project_root}")
        print(f"📁 Backup directory: {self.backup_dir}")
        
        # Patterns for suspicious files
        self.suspicious_patterns = [
            r'\.backup$',
            r'\.bak$', 
            r'\.old$',
            r'\.tmp$',
            r'\.temp$',
            r'_backup\.',
            r'_old\.',
            r'_temp\.',
            r'copy\d*\.',
            r'Copy\d*\.',
            r'NEW\.',
            r'test\d*\.',
            r'\.orig$',
            r'~$',
            r'#.*#$',
            r'\.swp$',
            r'\.swo$'
        ]
        
        # Directories to ignore
        self.ignore_dirs = {
            'node_modules', 
            '.git', 
            '.next', 
            'dist', 
            'build',
            '__pycache__',
            '.vscode',
            'coverage',
            'playwright-report',
            'test-results',
            '.quality-monitor-backups'
        }
    
    def find_suspicious_files(self) -> Dict[str, List[Path]]:
        """Find all suspicious files categorized by type."""
        suspicious_files = {
            'backup_files': [],
            'temp_files': [],
            'duplicate_files': [],
            'test_files': [],
            'editor_files': []
        }
        
        print(f"\n🔍 Scanning for suspicious files...")
        
        for root, dirs, files in os.walk(self.project_root):
            # Skip ignored directories
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]
            
            root_path = Path(root)
            
            for file in files:
                file_path = root_path / file
                relative_path = file_path.relative_to(self.project_root)
                
                # Skip files in backup directory
                if str(relative_path).startswith('.quality-monitor-backups'):
                    continue
                
                # Check against suspicious patterns
                for pattern in self.suspicious_patterns:
                    if re.search(pattern, file, re.IGNORECASE):
                        self.categorize_suspicious_file(file_path, suspicious_files)
                        break
                
                # Check for potential duplicates based on naming
                if self.is_potential_duplicate(file):
                    suspicious_files['duplicate_files'].append(file_path)
        
        return suspicious_files
    
    def categorize_suspicious_file(self, file_path: Path, categories: Dict[str, List[Path]]):
        """Categorize a suspicious file into the appropriate category."""
        file_name = file_path.name.lower()
        
        if any(pattern in file_name for pattern in ['backup', 'bak', 'old', 'orig']):
            categories['backup_files'].append(file_path)
        elif any(pattern in file_name for pattern in ['temp', 'tmp']):
            categories['temp_files'].append(file_path)
        elif any(pattern in file_name for pattern in ['test', 'copy']):
            categories['test_files'].append(file_path)
        elif any(pattern in file_name for pattern in ['~', '#', '.swp', '.swo']):
            categories['editor_files'].append(file_path)
        else:
            categories['duplicate_files'].append(file_path)
    
    def is_potential_duplicate(self, filename: str) -> bool:
        """Check if filename suggests it might be a duplicate."""
        duplicate_indicators = [
            r'copy\d*',
            r'Copy\d*',
            r'\(\d+\)',
            r'_\d+\.',
            r'-\d+\.',
            r'new_',
            r'NEW_'
        ]
        
        for pattern in duplicate_indicators:
            if re.search(pattern, filename, re.IGNORECASE):
                return True
        return False
    
    def analyze_file_safety(self, file_path: Path) -> Dict[str, any]:
        """Analyze if a file is safe to remove."""
        safety_info = {
            'safe_to_remove': False,
            'reason': '',
            'action': 'review',
            'similar_files': []
        }
        
        # Check file size
        try:
            size = file_path.stat().st_size
        except:
            size = 0
        
        # Check if there's a similar file without suspicious suffix
        base_name = self.get_base_filename(file_path.name)
        similar_file = file_path.parent / base_name
        
        if similar_file.exists() and similar_file != file_path:
            safety_info['similar_files'].append(similar_file)
            
            # If similar file is newer or larger, backup file is likely safe to remove
            try:
                similar_stat = similar_file.stat()
                if similar_stat.st_mtime > file_path.stat().st_mtime:
                    safety_info['safe_to_remove'] = True
                    safety_info['reason'] = 'Newer version exists'
                    safety_info['action'] = 'backup_and_remove'
            except:
                pass
        
        # Very small files are often safe to remove
        if size < 100:
            safety_info['safe_to_remove'] = True
            safety_info['reason'] = 'Very small file (< 100 bytes)'
            safety_info['action'] = 'backup_and_remove'
        
        # Editor temporary files are always safe to remove
        if any(ext in file_path.name for ext in ['~', '#', '.swp', '.swo']):
            safety_info['safe_to_remove'] = True
            safety_info['reason'] = 'Editor temporary file'
            safety_info['action'] = 'remove'
        
        return safety_info
    
    def get_base_filename(self, filename: str) -> str:
        """Get the base filename without suspicious suffixes."""
        # Remove common suspicious suffixes
        base = filename
        for pattern in [r'\.backup$', r'\.bak$', r'\.old$', r'\.tmp$', r'\.temp$', 
                       r'_backup\.*', r'_old\.*', r'_temp\.*', r'copy\d*\.', r'Copy\d*\.']:
            base = re.sub(pattern, '', base, flags=re.IGNORECASE)
        
        # Remove trailing numbers/copies
        base = re.sub(r'\(\d+\)', '', base)
        base = re.sub(r'_\d+\.', '.', base)
        base = re.sub(r'-\d+\.', '.', base)
        
        return base
    
    def backup_and_remove_file(self, file_path: Path, reason: str):
        """Safely backup and remove a file."""
        try:
            # Create backup
            relative_path = file_path.relative_to(self.project_root)
            backup_path = self.backup_dir / relative_path
            backup_path.parent.mkdir(parents=True, exist_ok=True)
            
            shutil.copy2(file_path, backup_path)
            
            # Remove original
            file_path.unlink()
            
            print(f"   ✅ Removed: {relative_path} (backed up)")
            print(f"      Reason: {reason}")
            
            return True
        except Exception as e:
            print(f"   ❌ Failed to remove {file_path}: {e}")
            return False
    
    def remove_file(self, file_path: Path, reason: str):
        """Remove a file without backup."""
        try:
            file_path.unlink()
            relative_path = file_path.relative_to(self.project_root)
            print(f"   ✅ Removed: {relative_path}")
            print(f"      Reason: {reason}")
            return True
        except Exception as e:
            print(f"   ❌ Failed to remove {file_path}: {e}")
            return False
    
    def clean_files(self, auto_remove: bool = False):
        """Clean suspicious files with user confirmation or auto mode."""
        suspicious_files = self.find_suspicious_files()
        
        total_files = sum(len(files) for files in suspicious_files.values())
        if total_files == 0:
            print(f"✅ No suspicious files found!")
            return
        
        print(f"\n📊 Found {total_files} suspicious files:")
        
        removed_count = 0
        backed_up_count = 0
        
        for category, files in suspicious_files.items():
            if not files:
                continue
                
            print(f"\n📂 {category.replace('_', ' ').title()}: {len(files)} files")
            
            for file_path in files:
                relative_path = file_path.relative_to(self.project_root)
                safety_info = self.analyze_file_safety(file_path)
                
                print(f"   📄 {relative_path}")
                print(f"      Status: {safety_info['reason'] or 'Manual review needed'}")
                
                if auto_remove and safety_info['safe_to_remove']:
                    if safety_info['action'] == 'remove':
                        if self.remove_file(file_path, safety_info['reason']):
                            removed_count += 1
                    elif safety_info['action'] == 'backup_and_remove':
                        if self.backup_and_remove_file(file_path, safety_info['reason']):
                            backed_up_count += 1
                elif safety_info['safe_to_remove']:
                    print(f"      Recommended: {safety_info['action']}")
                else:
                    print(f"      Recommended: Manual review required")
        
        if auto_remove:
            print(f"\n✅ Cleanup completed:")
            print(f"   🗑️  Removed: {removed_count} files")
            print(f"   💾 Backed up and removed: {backed_up_count} files")
            print(f"   📁 Backups saved to: {self.backup_dir}")
        else:
            print(f"\n💡 To automatically clean safe files, run with --auto flag")
            print(f"   python scripts/clean-suspicious-files.py {self.project_root} --auto")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python clean-suspicious-files.py <project_root> [--auto]")
        sys.exit(1)
    
    project_root = sys.argv[1]
    auto_remove = '--auto' in sys.argv
    
    cleaner = SuspiciousFilesCleaner(project_root)
    cleaner.clean_files(auto_remove=auto_remove)
