#!/usr/bin/env python3
"""
Modernize all usages of gameState.timer in backend TypeScript files:
- Replace with canonical timer system (CanonicalTimerService)
- Comment out legacy gameState.timer lines with LEGACY: replaced by canonical timer
- Add TODO for final removal after full migration
- If timer logic depends on deferred mode, treat gameState.status === 'completed' as deferred

Usage: python scripts/modernize_timer_usage.py
"""
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / 'backend'

LEGACY_COMMENT = '// LEGACY: replaced by canonical timer (see CanonicalTimerService usage below)\n// TODO: Remove after full migration\n'

# Patterns to match gameState.timer usage
TIMER_ASSIGN_RE = re.compile(r'^(\s*)(gameState\.timer\s*=\s*\{.*)', re.DOTALL)
TIMER_ACCESS_RE = re.compile(r'(gameState\.timer(\?|\.)[\w]+)')

# Canonical timer fetch (example, may need adjustment per context)
CANONICAL_FETCH = 'await canonicalTimerService.getTimer(accessCode, questionUid, /* add playMode/isDiffered if needed */)'

# For deferred mode logic
DEFERRED_LOGIC = 'const isDeferred = gameState.status === "completed"; // Business rule: treat completed as deferred\n'


def process_file(path: Path):
    changed = False
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    for i, line in enumerate(lines):
        # Replace timer assignment
        if 'gameState.timer =' in line:
            indent = re.match(r'^(\s*)', line).group(1)
            new_lines.append(f'{indent}{LEGACY_COMMENT}')
            new_lines.append(f'{indent}// {line.strip()}\n')
            new_lines.append(f'{indent}{DEFERRED_LOGIC}')
            new_lines.append(f'{indent}const canonicalTimer = {CANONICAL_FETCH}\n')
            changed = True
            continue
        # Replace timer property access
        m = TIMER_ACCESS_RE.search(line)
        if m:
            # Comment out legacy usage, add canonical fetch above if not already
            indent = re.match(r'^(\s*)', line).group(1)
            new_lines.append(f'{indent}// LEGACY: {line.strip()}\n')
            if 'canonicalTimer' not in ''.join(new_lines[-5:]):
                new_lines.append(f'{indent}const canonicalTimer = {CANONICAL_FETCH}\n')
            changed = True
            continue
        new_lines.append(line)

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
    return changed


def main():
    ts_files = list(ROOT.rglob('*.ts'))
    touched = []
    for path in ts_files:
        if process_file(path):
            touched.append(str(path))
    if touched:
        print('Modernized timer usage in:')
        for t in touched:
            print(' -', t)
    else:
        print('No changes made.')

if __name__ == '__main__':
    main()
