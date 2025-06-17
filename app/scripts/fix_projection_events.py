#!/usr/bin/env python3
"""
Fix hardcoded projection events in backend to use shared constants.
Replace all hardcoded projection event names with SOCKET_EVENTS.PROJECTOR.* constants.
"""

import os
import re

def update_backend_projection_events():
    """Update all backend files to use shared projection event constants."""
    
    # Map of hardcoded events to shared constants
    event_mappings = {
        "'projection_question_changed'": "SOCKET_EVENTS.PROJECTOR.PROJECTION_QUESTION_CHANGED",
        "'projection_timer_updated'": "SOCKET_EVENTS.PROJECTOR.PROJECTION_TIMER_UPDATED", 
        "'projection_game_ended'": "SOCKET_EVENTS.PROJECTOR.PROJECTION_STATE",  # Using generic state event
        "'projection_answers_lock_changed'": "SOCKET_EVENTS.PROJECTOR.PROJECTION_STATE",  # Using generic state event
        "'projection_connected_count'": "SOCKET_EVENTS.PROJECTOR.PROJECTION_CONNECTED_COUNT"
    }
    
    # Files that need updating (found from grep search)
    backend_files = [
        "/home/aflesch/mathquest/app/backend/src/sockets/handlers/teacherControl/setQuestion.ts",
        "/home/aflesch/mathquest/app/backend/src/sockets/handlers/teacherControl/endGame.ts",
        "/home/aflesch/mathquest/app/backend/src/sockets/handlers/teacherControl/lockAnswers.ts",
        "/home/aflesch/mathquest/app/backend/src/sockets/handlers/teacherControl/pauseTimer.ts",
        "/home/aflesch/mathquest/app/backend/src/sockets/handlers/teacherControl/startTimer.ts",
        "/home/aflesch/mathquest/app/backend/src/sockets/handlers/teacherControl/timerAction.ts"
    ]
    
    for file_path in backend_files:
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            continue
            
        print(f"Processing: {file_path}")
        
        # Read file content
        with open(file_path, 'r') as f:
            content = f.read()
            
        # Check if file needs SOCKET_EVENTS import
        needs_socket_events = False
        for hardcoded_event in event_mappings.keys():
            if hardcoded_event in content:
                needs_socket_events = True
                break
                
        if not needs_socket_events:
            print(f"  No projection events found in {file_path}")
            continue
            
        # Add SOCKET_EVENTS import if needed
        import_pattern = r"import.*from '@shared/types/socket/events';"
        if not re.search(import_pattern, content):
            # Find existing imports and add SOCKET_EVENTS
            if "TEACHER_EVENTS" in content:
                content = re.sub(
                    r"import\s*\{\s*TEACHER_EVENTS\s*\}\s*from\s*'@shared/types/socket/events';",
                    "import { SOCKET_EVENTS, TEACHER_EVENTS } from '@shared/types/socket/events';",
                    content
                )
            else:
                # Add new import at top
                import_position = content.find("import")
                if import_position != -1:
                    content = content[:import_position] + "import { SOCKET_EVENTS } from '@shared/types/socket/events';\n" + content[import_position:]
        elif "SOCKET_EVENTS" not in content:
            # Add SOCKET_EVENTS to existing import
            content = re.sub(
                r"import\s*\{\s*([^}]+)\s*\}\s*from\s*'@shared/types/socket/events';",
                r"import { SOCKET_EVENTS, \1 } from '@shared/types/socket/events';",
                content
            )
            
        # Replace hardcoded events with shared constants
        changes_made = 0
        for hardcoded_event, shared_constant in event_mappings.items():
            if hardcoded_event in content:
                content = content.replace(hardcoded_event, shared_constant)
                changes_made += 1
                print(f"  Replaced {hardcoded_event} -> {shared_constant}")
                
        if changes_made > 0:
            # Write updated content
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"  ✅ Updated {file_path} ({changes_made} changes)")
        else:
            print(f"  No changes needed in {file_path}")

if __name__ == "__main__":
    print("🔧 Fixing hardcoded projection events in backend...")
    update_backend_projection_events()
    print("✅ Backend projection event fixes completed")
