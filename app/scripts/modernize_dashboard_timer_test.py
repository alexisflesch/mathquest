#!/usr/bin/env python3
"""
Modernize Dashboard Timer Integration Test

- Removes all legacy timer fields from timer payloads in the test file.
- Ensures only canonical fields (timerEndDateMs, status, questionUid) are used in all timer objects.
- Updates all timer update helpers and initial state mocks to use timerEndDateMs.

Usage:
  python3 scripts/modernize_dashboard_timer_test.py
"""
import re
from pathlib import Path

TEST_PATH = Path("../frontend/src/app/dashboard/__tests__/DashboardTimer.integration.test.tsx").resolve()

CANONICAL_TIMER_FIELDS = ['status', 'timerEndDateMs', 'questionUid']

# Remove legacy timer fields from timer objects in the test file
def modernize_timer_payloads(text):
    # Remove legacy fields from timer objects in initial state and updates
    # Remove: timeLeftMs, durationMs, timestamp, localTimeLeftMs
    timer_obj_pattern = re.compile(r'(timer\s*:\s*{)([^}]+)(})', re.MULTILINE)
    def timer_repl(match):
        timer_body = match.group(2)
        # Remove legacy fields
        timer_body = re.sub(r'\s*(timeLeftMs|durationMs|timestamp|localTimeLeftMs)\s*:\s*[^,}]+,?', '', timer_body)
        # Remove any trailing commas
        timer_body = re.sub(r',\s*}', '}', timer_body)
        # Remove empty lines
        timer_body = '\n'.join([line for line in timer_body.splitlines() if line.strip()])
        return f'{match.group(1)}{timer_body}{match.group(3)}'
    text = timer_obj_pattern.sub(timer_repl, text)

    # Remove legacy fields from timer update helpers (triggerTimerUpdate)
    trigger_update_pattern = re.compile(r'triggerTimerUpdate\(\{[^}]*\}\)', re.MULTILINE)
    def update_repl(match):
        call = match.group(0)
        # Remove legacy fields from the call
        call = re.sub(r'(timeLeftMs|durationMs|timestamp|localTimeLeftMs)\s*:\s*[^,}]+,?', '', call)
        return call
    text = trigger_update_pattern.sub(update_repl, text)

    return text

def main():
    orig = TEST_PATH.read_text(encoding='utf-8')
    updated = modernize_timer_payloads(orig)
    if orig == updated:
        print("No changes needed. Already canonical.")
        return
    TEST_PATH.write_text(updated, encoding='utf-8')
    print(f"Modernized timer payloads in {TEST_PATH}")

if __name__ == "__main__":
    main()
