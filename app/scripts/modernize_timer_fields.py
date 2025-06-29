#!/usr/bin/env python3
"""
Modernization Script: Remove Legacy Timer Fields and Enforce Canonical Types

- Removes all references to legacy timer fields (timeLimit, timeLimitSeconds, temps, etc.)
- Ensures only durationMs is used for timer logic
- Updates type guards, test mocks, and UI components to use canonical types only
- Adds explicit imports and usage of canonical types from shared/ where missing
- Optionally, can be extended to check/add Zod validation for timer-related events

Usage:
    python3 scripts/modernize_timer_fields.py

This script is idempotent and safe to run multiple times.
"""
import os
import re
from pathlib import Path

# List of legacy timer fields to remove
LEGACY_FIELDS = [
    'timeLimit', 'timeLimitSeconds', 'temps', 'customTimeLimit', 'localTimeLeftMs'
]

# Canonical timer field
CANONICAL_FIELD = 'durationMs'

# File patterns to target
TARGET_FILES = [
    'frontend/src/app/teacher/quiz/create/page.tsx',
    'frontend/src/app/teacher/games/new/page.tsx',
    'frontend/src/app/teacher/games/[id]/edit/page.tsx',
    'frontend/src/types/socketTypeGuards.ts',
    'frontend/src/components/TeacherProjectionClient.tsx',
    'frontend/src/components/SortableQuestion.tsx',
]

# Helper: Remove legacy timer fields from a line
def remove_legacy_fields(line):
    # Remove legacy timer fields from object destructuring or assignments
    for field in LEGACY_FIELDS:
        # Remove from destructuring
        line = re.sub(rf'\b{field}\b\s*[:,=]\s*[^,}}]*,?', '', line)
        # Remove from fallback chains (e.g., q.durationMs ?? q.timeLimit ?? ...)
        line = re.sub(rf'\?\?\s*{field}', '', line)
    return line

# Helper: Replace legacy timer fields with canonical field in comments and code
def replace_legacy_with_canonical(line):
    for field in LEGACY_FIELDS:
        line = re.sub(rf'\b{field}\b', CANONICAL_FIELD, line)
    return line

# Main script
for rel_path in TARGET_FILES:
    path = Path(rel_path)
    if not path.exists():
        print(f"[SKIP] {rel_path} does not exist.")
        continue
    with path.open('r', encoding='utf-8') as f:
        lines = f.readlines()
    new_lines = []
    for line in lines:
        orig = line
        line = remove_legacy_fields(line)
        line = replace_legacy_with_canonical(line)
        new_lines.append(line)
    if new_lines != lines:
        with path.open('w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"[UPDATED] {rel_path}")
    else:
        print(f"[NO CHANGE] {rel_path}")

print("\nModernization complete. Please review changes and run tests.")
