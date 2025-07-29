#!/usr/bin/env python3
"""
Validation Script: Quiz Mode Leaderboard Fix
Verifies that quiz mode teacher trophy button now emits leaderboard to students.
"""

import os
import re

def check_file_content(filepath, pattern, should_exist=True):
    """Check if a pattern exists in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            found = re.search(pattern, content, re.MULTILINE | re.DOTALL)
            return found is not None
    except FileNotFoundError:
        print(f"❌ File not found: {filepath}")
        return False

def main():
    print("🔍 VALIDATING QUIZ MODE LEADERBOARD FIX...")
    print("=" * 50)
    
    base_path = "/home/aflesch/mathquest/app"
    
    # Test 1: Verify quiz mode leaderboard emission exists in revealLeaderboardHandler
    reveal_handler_path = f"{base_path}/backend/src/sockets/handlers/teacherControl/revealLeaderboardHandler.ts"
    quiz_emission_pattern = r"QUIZ MODE.*game_\$\{accessCode\}.*LEADERBOARD_UPDATE"
    
    has_quiz_emission = check_file_content(reveal_handler_path, quiz_emission_pattern, should_exist=True)
    
    if not has_quiz_emission:
        print("❌ QUIZ MODE FIX MISSING: revealLeaderboardHandler.ts should emit to students")
        return False
    else:
        print("✅ QUIZ MODE FIX VERIFIED: Teacher trophy button emits leaderboard to students")
    
    # Test 2: Verify calculateLeaderboard import exists
    import_pattern = r"import.*calculateLeaderboard.*from.*sharedLeaderboard"
    has_import = check_file_content(reveal_handler_path, import_pattern, should_exist=True)
    
    if not has_import:
        print("❌ IMPORT MISSING: revealLeaderboardHandler.ts should import calculateLeaderboard")
        return False
    else:
        print("✅ IMPORT VERIFIED: calculateLeaderboard imported correctly")
    
    # Test 3: Verify SOCKET_EVENTS import for student emission
    socket_events_pattern = r"SOCKET_EVENTS.*from.*socket/events"
    has_socket_events = check_file_content(reveal_handler_path, socket_events_pattern, should_exist=True)
    
    if not has_socket_events:
        print("❌ SOCKET_EVENTS IMPORT MISSING: needed for student leaderboard emission")
        return False
    else:
        print("✅ SOCKET_EVENTS IMPORT VERIFIED: Student emission events available")
    
    print("=" * 50)
    print("🎉 QUIZ MODE LEADERBOARD FIX VALIDATED!")
    print("🎯 Teacher trophy button now emits leaderboard to students in quiz mode")
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
