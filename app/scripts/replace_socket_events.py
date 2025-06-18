#!/usr/bin/env python3
"""
replace_socket_events.py

Replaces hardcoded socket event strings with shared constants in all .ts/.tsx files in frontend/, backend/, and shared/.
Adds import if needed. Makes a backup of each file before modifying.

Usage: python3 scripts/replace_socket_events.py
"""
import os
import re
import shutil
from pathlib import Path

# Map of event string to constant name (must match socketEvents.ts)
SOCKET_EVENTS = {
    "dashboard_joined": "SOCKET_EVENT_DASHBOARD_JOINED",
    "dashboard_timer_updated": "SOCKET_EVENT_DASHBOARD_TIMER_UPDATED",
    "end_game": "SOCKET_EVENT_END_GAME",
    "game_control_state": "SOCKET_EVENT_GAME_CONTROL_STATE",
    "join_dashboard": "SOCKET_EVENT_JOIN_DASHBOARD",
    "offline": "SOCKET_EVENT_OFFLINE",
    "pause": "SOCKET_EVENT_PAUSE",
    "play": "SOCKET_EVENT_PLAY",
    "projector": "SOCKET_EVENT_PROJECTOR",
    "q_stop_test": "SOCKET_EVENT_Q_STOP_TEST",
    "quiz_connected_count": "SOCKET_EVENT_QUIZ_CONNECTED_COUNT",
    "quiz_timer_action": "SOCKET_EVENT_QUIZ_TIMER_ACTION",
    "quiz_timer_update": "SOCKET_EVENT_QUIZ_TIMER_UPDATE",
    "resume": "SOCKET_EVENT_RESUME",
    "set_duration": "SOCKET_EVENT_SET_DURATION",
    "set_question": "SOCKET_EVENT_SET_QUESTION",
    "start": "SOCKET_EVENT_START",
    "stop": "SOCKET_EVENT_STOP",
    "student": "SOCKET_EVENT_STUDENT",
    "teacher": "SOCKET_EVENT_TEACHER",
    "tournament": "SOCKET_EVENT_TOURNAMENT",
    "update": "SOCKET_EVENT_UPDATE",
}

IMPORT_LINE = "import { " + ", ".join(SOCKET_EVENTS.values()) + " } from 'shared/constants/socketEvents';"

ROOT = Path(__file__).parent.parent
TARGET_DIRS = [ROOT / "frontend", ROOT / "backend", ROOT / "shared"]
EXTENSIONS = (".ts", ".tsx")

# Regex to match event string literals (not in import/require)
EVENT_PATTERN = re.compile(r'(["\'])(%s)\1' % "|".join(re.escape(e) for e in SOCKET_EVENTS), re.MULTILINE)

# Regex to check for import
IMPORT_PATTERN = re.compile(r"import\s+\{[^}]*\\bSOCKET_EVENT_\\w+\\b[^}]*\}\s+from\s+['\"]shared/constants/socketEvents['\"];?")

# Regex to match type-only lines
TYPE_LINE_PATTERN = re.compile(r"^(\s*(export\s+)?(type|interface)\s|import\s+type\s)")

def process_file(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Skip if no event string present
    if not any(f'"{e}"' in content or f"'{e}'" in content for e in SOCKET_EVENTS):
        return False

    lines = content.splitlines()
    # Skip if all event usages are in type/interface/type import lines
    if all(TYPE_LINE_PATTERN.match(line) for line in lines if any(e in line for e in SOCKET_EVENTS)):
        return False

    orig_content = content
    # Replace event strings with constants, but skip type/interface/type import lines
    new_lines = []
    for line in lines:
        if TYPE_LINE_PATTERN.match(line):
            new_lines.append(line)
        else:
            new_lines.append(EVENT_PATTERN.sub(lambda m: SOCKET_EVENTS[m.group(2)], line))
    content = "\n".join(new_lines)

    # Add import if not present, after last regular import and before any type/interface block
    if not IMPORT_PATTERN.search(content):
        insert_at = 0
        for i, line in enumerate(lines):
            if line.strip().startswith("import ") and not line.strip().startswith("import type"):
                insert_at = i + 1
        # Avoid inserting inside type/interface block
        lines2 = content.splitlines()
        lines2.insert(insert_at, IMPORT_LINE)
        content = "\n".join(lines2)

    # Only write if changed
    if content != orig_content:
        shutil.copy2(path, str(path) + ".bak")
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {path}")
        return True
    return False

def main():
    changed = 0
    for target_dir in TARGET_DIRS:
        for root, _, files in os.walk(target_dir):
            for file in files:
                if file.endswith(EXTENSIONS):
                    path = Path(root) / file
                    if process_file(path):
                        changed += 1
    print(f"Done. {changed} files updated.")

if __name__ == "__main__":
    main()
