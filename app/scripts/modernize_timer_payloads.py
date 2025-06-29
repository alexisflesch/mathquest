#!/usr/bin/env python3
"""
Modernize all timer action payload usages in the codebase to enforce canonical structure:
- Only allow action: 'run' | 'pause' | 'stop'
- Use durationMs (not duration)
- Remove any status, play, start, resume, set_duration, or legacy fields
- Update test and debug code to use canonical payloads

Usage:
    python scripts/modernize_timer_payloads.py

This script is idempotent and safe to run multiple times.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET_DIRS = [
    'frontend/src',
    'frontend/tests',
    'frontend/__tests__',
    'src',
    'tests',
]

# Patterns to replace
LEGACY_ACTIONS = [
    "'play'", '"play"', "'start'", '"start"', "'resume'", '"resume"', "'set_duration'", '"set_duration"'
]
CANONICAL_ACTIONS = {
    'play': 'run',
    'start': 'run',
    'resume': 'run',
    'set_duration': 'run',
}

# Regex for object fields
STATUS_FIELD_RE = re.compile(r"(status\s*:\s*['\"]?(play|start|resume|set_duration|pause|stop)['\"]?)")
DURATION_FIELD_RE = re.compile(r"duration(?!Ms)(\s*:)\s*([0-9]+|[a-zA-Z_][a-zA-Z0-9_]*|\{[^}]*\})")

# Regex for action fields
ACTION_FIELD_RE = re.compile(r"action\s*:\s*['\"]?(play|start|resume|set_duration)['\"]?")

# Only allow canonical fields in TimerActionPayload objects
TIMER_ACTION_PAYLOAD_RE = re.compile(r"\{([^{}]*?(status|action|duration|durationMs|questionUid|accessCode)[^{}]*?)+\}", re.DOTALL)

# File extensions to process
EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

def canonicalize_action(val):
    return CANONICAL_ACTIONS.get(val, val)

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    orig = content

    # Remove status fields and replace with canonical action
    def status_repl(match):
        val = match.group(2)
        if val in CANONICAL_ACTIONS:
            return f"action: '{CANONICAL_ACTIONS[val]}'"
        elif val in ['pause', 'stop', 'run']:
            return f"action: '{val}'"
        else:
            return ''
    content = STATUS_FIELD_RE.sub(status_repl, content)

    # Replace legacy action values
    def action_repl(match):
        val = match.group(1)
        return f"action: '{CANONICAL_ACTIONS.get(val, val)}'"
    content = ACTION_FIELD_RE.sub(action_repl, content)

    # Replace duration: with durationMs:
    content = DURATION_FIELD_RE.sub(r'durationMs\1 \2', content)

    # Remove any lingering status fields (if not handled above)
    content = re.sub(r"\bstatus\s*:\s*['\"]?(play|start|resume|set_duration)['\"]?,?", '', content)

    # Remove any lingering duration fields (not durationMs)
    content = re.sub(r"\bduration\s*:\s*[^,}]+,?", '', content)

    # Remove any trailing commas in object literals
    content = re.sub(r",\s*([}\]])", r"\1", content)

    if content != orig:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[modernize_timer_payloads] Updated: {path}")


def walk_and_process():
    for target in TARGET_DIRS:
        absdir = os.path.join(ROOT, target)
        if not os.path.exists(absdir):
            continue
        for dirpath, _, filenames in os.walk(absdir):
            for fname in filenames:
                if any(fname.endswith(ext) for ext in EXTENSIONS):
                    process_file(os.path.join(dirpath, fname))

if __name__ == '__main__':
    walk_and_process()
    print("[modernize_timer_payloads] All timer action payloads have been modernized.")
