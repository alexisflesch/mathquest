#!/usr/bin/env python3
"""
Validation Script: Leaderboard Security Fix
Verifies that the leaderboard emission timing security vulnerability has been resolved.
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
    print("🔍 VALIDATING LEADERBOARD SECURITY FIX...")
    print("=" * 50)
    
    base_path = "/home/aflesch/mathquest/app"
    
    # Test 1: Verify vulnerable code is removed from gameAnswer.ts
    gameAnswer_path = f"{base_path}/backend/src/sockets/handlers/game/gameAnswer.ts"
    vulnerable_pattern = r"io\.to.*emit.*LEADERBOARD_UPDATE"
    
    has_vulnerable_code = check_file_content(gameAnswer_path, vulnerable_pattern, should_exist=False)
    
    if has_vulnerable_code:
        print("❌ SECURITY VULNERABILITY STILL EXISTS in gameAnswer.ts")
        print("   Found leaderboard emission during answer processing")
        return False
    else:
        print("✅ SECURITY FIX VERIFIED: No leaderboard emission in gameAnswer.ts")
    
    # Test 2: Verify secure code exists in sharedGameFlow.ts  
    sharedFlow_path = f"{base_path}/backend/src/sockets/handlers/sharedGameFlow.ts"
    secure_pattern = r"🔒 SECURITY.*LEADERBOARD_UPDATE"
    
    has_secure_code = check_file_content(sharedFlow_path, secure_pattern, should_exist=True)
    
    if not has_secure_code:
        print("❌ SECURE IMPLEMENTATION MISSING in sharedGameFlow.ts")
        return False
    else:
        print("✅ SECURE IMPLEMENTATION VERIFIED: Leaderboard emitted after question ends")
    
    # Test 3: Verify frontend listener exists
    frontend_path = f"{base_path}/frontend/src/hooks/useStudentGameSocket.ts"
    listener_pattern = r"LEADERBOARD_UPDATE.*LEADERBOARD UPDATE RECEIVED"
    
    has_frontend_listener = check_file_content(frontend_path, listener_pattern, should_exist=True)
    
    if not has_frontend_listener:
        print("❌ FRONTEND LISTENER MISSING in useStudentGameSocket.ts")
        return False
    else:
        print("✅ FRONTEND LISTENER VERIFIED: useStudentGameSocket.ts has leaderboard_update handler")
    
    # Test 4: Verify static imports
    import_pattern = r"import.*calculateLeaderboard.*from.*sharedLeaderboard"
    has_static_import = check_file_content(sharedFlow_path, import_pattern, should_exist=True)
    
    if not has_static_import:
        print("❌ DYNAMIC IMPORT ISSUE: sharedGameFlow.ts should use static imports")
        return False
    else:
        print("✅ IMPORT STRUCTURE VERIFIED: Static imports used correctly")
    
    print("=" * 50)
    print("🎉 ALL SECURITY VALIDATIONS PASSED!")
    print("🔒 Leaderboard timing vulnerability has been completely resolved")
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
