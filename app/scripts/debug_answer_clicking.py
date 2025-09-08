#!/usr/bin/env python3
"""
Debug Live Page Answer Clicking Issues
Adds comprehensive logging to identify why answers aren't clickable
"""

import sys
from pathlib import Path

def add_debug_logging():
    """Add debug logging to the live page to track answer clicking issues"""
    
    live_page_path = Path("/home/aflesch/mathquest/app/frontend/src/app/live/[code]/page.tsx")
    
    # Read the current file
    with open(live_page_path, 'r') as f:
        content = f.read()
    
    # Add debug logging after the isReadonly calculation
    debug_code = '''    
    // 🐛 DEBUG: Log readonly state and game state for answer clicking investigation
    useEffect(() => {
        if (gameState.currentQuestion) {
            console.log('🐛 [DEBUG] Answer Clicking State:', {
                isReadonly,
                phase: gameState.phase,
                gameStatus: gameState.gameStatus,
                answered: gameState.answered,
                gameMode,
                currentQuestion: !!gameState.currentQuestion,
                questionUid: gameState.currentQuestion?.uid
            });
        }
    }, [isReadonly, gameState.phase, gameState.gameStatus, gameState.answered, gameMode, gameState.currentQuestion]);
'''
    
    # Find where to insert the debug code (after isReadonly calculation)
    readonly_line = "    const isReadonly = useMemo(() => {"
    if readonly_line in content:
        # Find the end of the useMemo for isReadonly
        readonly_start = content.find(readonly_line)
        # Find the closing of this useMemo
        readonly_section = content[readonly_start:]
        readonly_end_relative = readonly_section.find("}, [gameState.phase, gameState.gameStatus, gameState.answered, gameMode]);")
        readonly_end = readonly_start + readonly_end_relative + len("}, [gameState.phase, gameState.gameStatus, gameState.answered, gameMode]);")
        
        # Insert debug code after the readonly calculation
        new_content = content[:readonly_end] + debug_code + content[readonly_end:]
        
        # Write back to file
        with open(live_page_path, 'w') as f:
            f.write(new_content)
        
        print("✅ Added debug logging to live page")
        return True
    else:
        print("❌ Could not find isReadonly calculation in live page")
        return False

def add_questioncard_debug():
    """Add debug logging to QuestionCard component"""
    
    questioncard_path = Path("/home/aflesch/mathquest/app/frontend/src/components/QuestionCard.tsx")
    
    with open(questioncard_path, 'r') as f:
        content = f.read()
    
    # Find the onClick handler for answer buttons
    onclick_pattern = '''                        onClick={() => {
                            if (readonly) return;
                            if (effectiveIsMultipleChoice) {
                                setSelectedAnswers((prev) =>
                                    prev.includes(idx)
                                        ? prev.filter((i) => i !== idx)
                                        : [...prev, idx]
                                );
                            } else {
                                handleSingleChoice(idx);
                            }
                        }}'''
    
    new_onclick = '''                        onClick={() => {
                            console.log('🐛 [DEBUG] Answer button clicked:', {
                                readonly,
                                idx,
                                effectiveIsMultipleChoice,
                                selectedAnswer: idx
                            });
                            if (readonly) {
                                console.log('🐛 [DEBUG] Click blocked by readonly=true');
                                return;
                            }
                            if (effectiveIsMultipleChoice) {
                                console.log('🐛 [DEBUG] Multiple choice answer selection');
                                setSelectedAnswers((prev) =>
                                    prev.includes(idx)
                                        ? prev.filter((i) => i !== idx)
                                        : [...prev, idx]
                                );
                            } else {
                                console.log('🐛 [DEBUG] Single choice answer selection, calling handleSingleChoice');
                                handleSingleChoice(idx);
                            }
                        }}'''
    
    if onclick_pattern in content:
        new_content = content.replace(onclick_pattern, new_onclick)
        
        with open(questioncard_path, 'w') as f:
            f.write(new_content)
        
        print("✅ Added debug logging to QuestionCard onClick handler")
        return True
    else:
        print("❌ Could not find onClick pattern in QuestionCard")
        return False

def add_socket_debug():
    """Add debug logging to socket hook"""
    
    socket_hook_path = Path("/home/aflesch/mathquest/app/frontend/src/hooks/useStudentGameSocket.ts")
    
    with open(socket_hook_path, 'r') as f:
        content = f.read()
    
    # Find the submitAnswer function
    submit_pattern = "    const submitAnswer = useCallback("
    
    if submit_pattern in content:
        # Add debug logging at the beginning of submitAnswer
        debug_submit = '''    const submitAnswer = useCallback((questionUid: string, answer: any, timestamp: number) => {
        console.log('🐛 [DEBUG] submitAnswer called:', {
            questionUid,
            answer,
            timestamp,
            socketConnected: socket?.connected,
            gameStatus: gameState.gameStatus
        });'''
        
        # Find the original function content after the callback opening
        submit_start = content.find(submit_pattern)
        submit_line_end = content.find('\n', submit_start)
        original_line = content[submit_start:submit_line_end + 1]
        
        # Replace the original line with debug version
        new_content = content.replace(original_line, debug_submit + '\n')
        
        with open(socket_hook_path, 'w') as f:
            f.write(new_content)
        
        print("✅ Added debug logging to submitAnswer function")
        return True
    else:
        print("❌ Could not find submitAnswer function in socket hook")
        return False

def main():
    """Add comprehensive debug logging to identify answer clicking issues"""
    print("🐛 Adding Debug Logging for Answer Clicking Issues")
    print("="*50)
    
    success = True
    
    # Add debug logging to live page
    if not add_debug_logging():
        success = False
    
    # Add debug logging to QuestionCard
    if not add_questioncard_debug():
        success = False
    
    # Add debug logging to socket hook
    if not add_socket_debug():
        success = False
    
    if success:
        print("\n✅ All debug logging added successfully!")
        print("\nNext steps:")
        print("1. Start the frontend: npm run dev")
        print("2. Navigate to a live game page")
        print("3. Try clicking answers and check browser console")
        print("4. Look for debug messages starting with 🐛 [DEBUG]")
        print("5. Check if readonly=true is blocking clicks")
    else:
        print("\n❌ Some debug logging failed to add")
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
