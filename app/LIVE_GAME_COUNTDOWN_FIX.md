# Live Game Page Countdown Transition Bug Fix

## Issue Description
In tournament mode, when the creator clicks "start", the countdown is shown correctly, but when it reaches 0, nothing happens - the lobby remains visible instead of transitioning to show the first question.

## Root Cause Analysis
The bug was in the lobby display condition in `/live/[code]/page.tsx`:

**BROKEN CONDITION:**
```tsx
if (gameState.gameStatus === 'waiting' && gameState.connectedToRoom) {
    return <LobbyDisplay ... />;
}
```

This condition only checked the `gameStatus`, but the frontend should transition from lobby to game when the **first question arrives**, not when some status changes.

## Correct Solution
Updated the condition to also check for the presence of a current question:

**FIXED CONDITION:**
```tsx
if (gameState.gameStatus === 'waiting' && gameState.connectedToRoom && !gameState.currentQuestion) {
    return <LobbyDisplay ... />;
}
```

## How It Works

### Tournament Mode Flow:
1. **Lobby Phase**: `gameStatus: 'waiting'`, `connectedToRoom: true`, `currentQuestion: undefined`
   - **Show**: Lobby with participant list
   - **User Action**: Creator clicks "Démarrer" → sends `start_tournament` event

2. **Countdown Phase**: `gameStatus: 'waiting'`, `connectedToRoom: true`, `currentQuestion: undefined`
   - **Show**: Lobby with countdown display (handled within LobbyDisplay component)
   - **Backend**: Emits `countdown_tick` events for 5-4-3-2-1

3. **Game Starts**: Backend sends first question via `game_question` event
   - **State Change**: `currentQuestion` becomes defined
   - **Show**: Game interface (lobby condition now false)

### Quiz Mode Flow:
1. **Immediate Start**: `gameStatus: 'active'`, first question sent immediately
   - **Show**: Game interface (lobby condition false due to gameStatus)

## Files Changed

### `/frontend/src/app/live/[code]/page.tsx`
- **Line ~326**: Updated lobby display condition to check `!gameState.currentQuestion`

### **No changes needed to `/frontend/src/hooks/useStudentGameSocket.ts`**
- The socket hook already correctly handles `game_question` events
- No need to listen for `countdown_complete` - that's just a countdown display signal

## Why This Is The Correct Approach

1. **Question Arrival = Game Start**: The presence of a question is the definitive signal that the game has begun
2. **Mode Agnostic**: Works for both tournament (with countdown) and quiz (immediate) modes
3. **Backend Compatibility**: No backend changes needed - it already sends questions correctly
4. **Robust**: Even if gameStatus updates are delayed/missing, the game will transition when questions arrive

## Test Cases

### Tournament Mode:
```
Initial: gameStatus='waiting', connectedToRoom=true, currentQuestion=undefined → Show Lobby
Countdown: gameStatus='waiting', connectedToRoom=true, currentQuestion=undefined → Show Lobby (with countdown)
Question Arrives: gameStatus='waiting', connectedToRoom=true, currentQuestion=QuestionData → Show Game
```

### Quiz Mode:
```
Initial: gameStatus='active', connectedToRoom=true, currentQuestion=QuestionData → Show Game
```

## Previous Incorrect Attempts

❌ **Attempted Fix 1**: Listen for `countdown_complete` event to change gameStatus
- **Problem**: Added unnecessary complexity and event handling
- **Issue**: gameStatus changes don't necessarily mean questions are ready

✅ **Correct Fix**: Check for question presence in display condition
- **Benefit**: Simple, direct, and follows the actual game flow
- **Robustness**: Works regardless of gameStatus timing issues

## Verification
After this fix:
- Tournament countdown works correctly and transitions to first question
- Quiz mode immediate start continues to work  
- Lobby shows participant list and countdown during waiting
- Game interface appears immediately when first question arrives
