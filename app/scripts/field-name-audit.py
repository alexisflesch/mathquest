#!/usr/bin/env python3
"""
Field Name Consistency Audit Script

Finds all occurrences of legacy field names in frontend components
that need to be converted to canonical shared type field names.

Canonical names:
- gradeLevel (not niveau, level, niveaux)
- name (not nom)  
- questionIds (not questions_ids)
- creatorId (not ownerId, enseignant_id)
"""

import os
import re
import subprocess
from pathlib import Path

def run_grep(pattern, directory, file_pattern="**/*.tsx"):
    """Run grep search and return results"""
    try:
        result = subprocess.run([
            'grep', '-r', '-n', '--include=' + file_pattern.replace('**/', '*.'), 
            pattern, directory
        ], capture_output=True, text=True)
        return result.stdout.strip().split('\n') if result.stdout.strip() else []
    except Exception as e:
        print(f"Error running grep: {e}")
        return []

def analyze_field_usage(frontend_dir):
    """Analyze field name usage in frontend"""
    
    print("🔍 FIELD NAME CONSISTENCY AUDIT")
    print("=" * 50)
    
    # Define legacy → canonical mappings
    field_mappings = {
        'niveau': 'gradeLevel',
        'niveaux': 'gradeLevel', 
        'level': 'gradeLevel',
        'nom': 'name',
        'questions_ids': 'questionIds',
        'ownerId': 'creatorId',
        'enseignant_id': 'creatorId'
    }
    
    issues = {}
    
    for legacy_field, canonical_field in field_mappings.items():
        print(f"\n📋 Searching for legacy field: '{legacy_field}' → should be '{canonical_field}'")
        
        # Search for the legacy field usage
        matches = run_grep(legacy_field, frontend_dir)
        
        if matches and matches != ['']:
            issues[legacy_field] = []
            for match in matches:
                if ':' in match:
                    file_path, line_content = match.split(':', 1)
                    # Skip if this is just a comment or string literal
                    if not any(skip in line_content.lower() for skip in ['comment', '//', '/*', 'placeholder']):
                        issues[legacy_field].append({
                            'file': file_path,
                            'line': line_content.strip(),
                            'canonical': canonical_field
                        })
            
            if issues[legacy_field]:
                print(f"  ⚠️  Found {len(issues[legacy_field])} occurrences:")
                for issue in issues[legacy_field][:5]:  # Show first 5
                    print(f"     {issue['file']}: {issue['line'][:80]}...")
                if len(issues[legacy_field]) > 5:
                    print(f"     ... and {len(issues[legacy_field]) - 5} more")
            else:
                print(f"  ✅ No problematic occurrences found")
        else:
            print(f"  ✅ No occurrences found")
    
    # Summary
    print(f"\n📊 SUMMARY")
    print("=" * 30)
    total_issues = sum(len(issue_list) for issue_list in issues.values())
    print(f"Total field name issues found: {total_issues}")
    
    if total_issues > 0:
        print(f"\n🎯 RECOMMENDED ACTION:")
        print(f"Create systematic conversion script to replace:")
        for legacy_field, issue_list in issues.items():
            if issue_list:
                canonical = field_mappings[legacy_field]
                print(f"  - {legacy_field} → {canonical} ({len(issue_list)} files)")
    
    return issues

if __name__ == "__main__":
    frontend_dir = "/home/aflesch/mathquest/app/frontend/src"
    issues = analyze_field_usage(frontend_dir)
