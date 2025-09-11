# Quiz Leaderboard Update Issue Analysis

## Issue Summary
In quiz mode, the leaderboard was updating prematurely in two scenarios:
1. **At countdown end**: Leaderboard updated when timer expired (like tournament mode)
2. **On student answers**: Leaderboard updated immediately when students submitted answers

## Expected Behavior
- **Quiz Mode**: Leaderboard should only update when teacher explicitly requests results (trophy button)
- **Tournament Mode**: Leaderboard should update automatically after each question ends

## Root Cause Analysis

### Code Architecture
The system has multiple components handling leaderboard updates:

1. **Timer Actions** (`timerAction.ts`): Handles timer start/stop/pause
2. **Game Answer Handler** (`gameAnswer.ts`): Processes student answers
3. **Shared Game Flow** (`sharedGameFlow.ts`): Orchestrates question progression
4. **Reveal Leaderboard Handler** (`revealLeaderboardHandler.ts`): Teacher-requested updates
5. **Leaderboard Snapshot Service** (`leaderboardSnapshotService.ts`): Manages leaderboard data

### Key Findings

#### 1. Intended Logic is Correct
The code correctly distinguishes between quiz and tournament modes:

```typescript
// sharedGameFlow.ts lines 307-337
if (options.playMode === 'tournament') {
    // Emit leaderboard automatically after question ends
    await emitLeaderboardFromSnapshot(io, accessCode, [`game_${accessCode}`], 'after_question_end');
} else {
    // Quiz mode: skip automatic leaderboard update
    logger.info('[QUIZ_MODE] Skipping automatic leaderboard update after question end - waiting for teacher request');
}
```

#### 2. Security Fix in Game Answer Handler
The game answer handler explicitly removed immediate leaderboard updates:

```typescript
// gameAnswer.ts comment
// 🔒 SECURITY FIX: Removed immediate leaderboard emission to prevent cheating
// Students were able to determine answer correctness by observing leaderboard changes
// Leaderboards are now only emitted after question timer expires (see sharedGameFlow.ts)
```

#### 3. Timer Expiry Logic
Timer expiry in `timerAction.ts` only emits timer events, not leaderboard updates.

### Log Evidence
- Game was correctly identified as `"playMode": "quiz"`
- Timer events were emitted correctly when timer stopped
- No `leaderboard_update` events found in logs during quiz session
- ZOD validation errors present but not related to leaderboard updates

## Possible Root Causes

### 1. Frontend State Management Issue
The frontend might be receiving leaderboard updates from cached state or previous sessions.

### 2. WebSocket Event Leakage
Leaderboard events from previous tournament sessions might be persisting.

### 3. Race Condition in Timer Expiry
The automatic timer expiry logic might be triggering leaderboard updates despite mode checks.

### 4. Alternative Update Path
There might be another code path (not found in analysis) that bypasses the mode checks.

## Investigation Results
- ✅ Game mode correctly identified as "quiz"
- ✅ Timer events emitted correctly
- ✅ No leaderboard_update events found in logs
- ✅ Code logic appears correct for mode differentiation
- ❌ User reported issue suggests frontend is receiving updates despite backend logic

## Next Steps
1. Create backend test to verify leaderboard update logic
2. Investigate frontend leaderboard state management
3. Check for WebSocket event persistence issues
4. Verify timer expiry doesn't trigger unintended updates</content>
<parameter name="filePath">/home/aflesch/mathquest/app/QUIZ_LEADERBOARD_ISSUE_ANALYSIS.md
