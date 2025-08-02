# Test Plan: Participant Preservation & Snapshot Anti-Cheating Fix

## Summary of Fixes Applied

### Issue 1: Participant Preservation ✅ FIXED
**Problem**: Users with join-order bonus scores were disappearing from leaderboard when they disconnected
**Root Cause**: `disconnect.ts` was removing PENDING participants without checking if they had leaderboard scores
**Fix**: Added leaderboard score check before removing any participant - users with ANY score are preserved regardless of PENDING/ACTIVE status

### Issue 2: Live Score Leakage ✅ FIXED  
**Problem**: Students were receiving live scores instead of snapshots during active gameplay
**Root Cause**: `projectionLeaderboardBroadcast.ts` was emitting live Redis data to game room
**Fix**: Modified to use snapshot data for students (game room) while keeping live data for teachers (projection/dashboard rooms)

## Test Scenarios

### Test 1: Join-Order Bonus Preservation
1. **Setup**: Create quiz with join-order bonus enabled
2. **Action**: User joins (gets bonus), game hasn't started (PENDING status), user disconnects
3. **Expected**: User remains in leaderboard with their bonus score
4. **Verification**: Check Redis leaderboard has user, participant data preserved but marked offline

### Test 2: Live Score Anti-Cheating
1. **Setup**: Active quiz with multiple students answering questions  
2. **Action**: Students submit answers during active gameplay
3. **Expected**: Students see snapshot leaderboard (not live scores), teachers see live data
4. **Verification**: Check that `leaderboard_update` events to `game_${accessCode}` use snapshot data

### Test 3: Reconnection Recovery
1. **Setup**: User with score disconnects and reconnects
2. **Expected**: User recovers their score and position in leaderboard
3. **Verification**: Reconnected user sees their preserved score

## Technical Verification Points

### Disconnect Handler (`game/disconnect.ts`)
- ✅ Line 96: Added leaderboard score check with `zscore`
- ✅ Line 101: Preserves users with ANY score regardless of status
- ✅ Line 135: Only removes PENDING users with NO score
- ✅ Line 171: ACTIVE users always preserved (marked offline)

### Projection Broadcast (`utils/projectionLeaderboardBroadcast.ts`)
- ✅ Line 148: Added security fix comment
- ✅ Line 155: Students get snapshot data via `getLeaderboardSnapshot`
- ✅ Line 175: Teachers get live data via `calculateLeaderboard`
- ✅ Line 160: Game room emission uses snapshot data with security logging

## Expected Behavior Changes

### Before Fixes
- ❌ Clémence joins, gets bonus, disconnects → disappears from leaderboard
- ❌ Students see live scores during gameplay → cheating possible
- ❌ Join-order bonus users lost when disconnecting before game start

### After Fixes  
- ✅ Clémence joins, gets bonus, disconnects → stays in leaderboard marked offline
- ✅ Students see snapshot scores during gameplay → cheating prevented
- ✅ All users with ANY score preserved across disconnections
- ✅ Teachers still see live data for classroom management

## Security Benefits
- **Anti-Cheating**: Students can't see live scores of other players during active gameplay
- **Data Integrity**: No score loss due to network issues or accidental disconnections
- **UX Improvement**: Consistent leaderboard experience for both students and teachers

## Files Modified
1. `/backend/src/sockets/handlers/game/disconnect.ts` - Participant preservation logic
2. `/backend/src/utils/projectionLeaderboardBroadcast.ts` - Snapshot vs live data routing

Both fixes are backward compatible and don't affect existing functionality for users without scores.
