#!/usr/bin/env python3
"""
Modernize backend timer fields to canonical contract (timerEndDateMs only).
Removes/replaces all legacy timer fields (durationMs, timeLeftMs, targetTimeMs, timestamp) in backend source and test files.
- Only allows durationMs in question definitions (not timer state/actions)
- Updates all timer action/state payloads to use timerEndDateMs
- Logs all changes to log.md
"""
import os
import re
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / 'backend'
LOG_FILE = Path(__file__).resolve().parent.parent / 'log.md'

LEGACY_FIELDS = [
    'timeLeftMs',
    'durationMs',
    'targetTimeMs',
    'timestamp',
]

CANONICAL_FIELDS = ['timerEndDateMs', 'status', 'questionUid']

# Only allow durationMs in question definitions, not in timer state/actions
def is_question_def_context(line):
    # Heuristic: durationMs allowed if line contains 'question' or 'questions' or is in a question array
    return 'question' in line or 'questions' in line

def modernize_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    changed = False
    new_lines = []
    for i, line in enumerate(lines):
        orig = line
        # Remove legacy timer fields from timer state/action payloads
        for field in LEGACY_FIELDS:
            if field == 'durationMs' and is_question_def_context(line):
                continue  # allow in question definitions
            # Remove field from object literals
            line = re.sub(rf'([,{{\s]){field}\s*:\s*[^,}}\n]+,?', r'\1', line)
            # Remove from destructuring
            line = re.sub(rf'\b{field}\b,?\s*', '', line)
            # Remove from function params (except in question context)
            if field == 'durationMs' and is_question_def_context(line):
                continue
            line = re.sub(rf'\b{field}\b', '', line)
        # Replace targetTimeMs/timeLeftMs with timerEndDateMs if context suggests timer action/state
        if 'targetTimeMs' in orig or 'timeLeftMs' in orig:
            if 'timerEndDateMs' not in line:
                line = line.replace('targetTimeMs', 'timerEndDateMs').replace('timeLeftMs', 'timerEndDateMs')
        # Remove empty trailing commas or double commas
        line = re.sub(r',\s*([}\]])', r'\1', line)
        line = re.sub(r',\s*,', ',', line)
        if line != orig:
            changed = True
        new_lines.append(line)
    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        with open(LOG_FILE, 'a', encoding='utf-8') as log:
            log.write(f"- Modernized timer fields in {filepath}\n")
    return changed

def main():
    files_changed = 0
    for root, dirs, files in os.walk(BACKEND_DIR):
        for file in files:
            if file.endswith(('.ts', '.js', '.test.ts', '.test.js')):
                path = os.path.join(root, file)
                if modernize_file(path):
                    files_changed += 1
    print(f"Modernization complete. {files_changed} files updated.")

if __name__ == '__main__':
    main()
