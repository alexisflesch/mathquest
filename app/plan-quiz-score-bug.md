# Quiz Score Registration Bug - Fix Plan

## Problem Identified

When a teacher clicks "Clôturer" to manually end a quiz, the scores are not properly persisted to the database. The issue is in the `endGame.ts` handler which:

1. ✅ Updates game status to 'completed' in DB and Redis
2. ❌ **Missing**: Persists leaderboard from Redis to database  
3. ❌ Cleans up Redis data (destroying the leaderboard data!)
4. ✅ Emits completion events

## Root Cause

The manual endGame handler (`backend/src/sockets/handlers/teacherControl/endGame.ts`) is missing the critical step that `sharedGameFlow.ts` has:

```typescript
// Game completed - persist final leaderboard to database
try {
    const finalLeaderboard = await calculateLeaderboard(accessCode);
    await persistLeaderboardToGameInstance(accessCode, finalLeaderboard);
    // THEN clean up Redis
} catch (error) {
    // handle error
}
```

## Evidence from Logs

1. **Score was correctly recorded in Redis during play**: 
   - `"score": 955` was properly stored and visible in leaderboard
2. **Redis cleanup happened without persistence**: 
   - `"cleanedKeys": "mathquest:game:leaderboard:3141"` - leaderboard deleted!
3. **No persistence logs**: 
   - Missing `[ANTI-CHEATING] Starting final score persistence` logs

## Fix Required

Add leaderboard persistence to `endGame.ts` handler BEFORE Redis cleanup.

## Phase 1: Fix the endGame Handler

- [ ] Import required functions from sharedLeaderboard.ts
- [ ] Add leaderboard persistence logic before Redis cleanup  
- [ ] Add proper error handling for persistence failures
- [ ] Add logging for debugging
- [ ] Test the fix with a quiz session

## Files to Modify

1. `backend/src/sockets/handlers/teacherControl/endGame.ts` - Add persistence logic

## Testing Strategy

1. Create a quiz session
2. Have a student join and answer questions (get a non-zero score)
3. Teacher clicks "Clôturer" 
4. Verify score is properly saved in database (`GameParticipant.liveScore`)
5. Check leaderboard display shows correct scores

## Success Criteria

- [ ] Scores persist correctly when teacher manually ends quiz
- [ ] No regression in automatic completion via sharedGameFlow
- [ ] Proper error handling if persistence fails
- [ ] Clear logging for debugging

---

## Technical Details

The `persistLeaderboardToGameInstance()` function:
- Reads scores from Redis leaderboard 
- Updates `GameParticipant.liveScore` for quiz mode
- Updates `GameParticipant.deferredScore` for tournament mode
- Handles both live and deferred modes correctly

The fix preserves the existing behavior but adds the missing persistence step.
