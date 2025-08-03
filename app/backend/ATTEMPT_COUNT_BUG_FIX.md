# Deferred Tournament Attempt Count Bug Fix

## Problem Summary

The user reported that deferred tournament attempt counts were showing incorrect values:
- **Expected**: First deferred play shows "Attempt 1", second shows "Attempt 2"  
- **Actual**: First deferred play shows "Attempt 3", second shows "Attempt 5"

## Root Cause

The `getDeferredAttemptCount()` function in `deferredTournamentFlow.ts` was returning `participant.nbAttempts` instead of the current deferred session attempt number.

```typescript
// ❌ BUGGY CODE (before fix)
async function getDeferredAttemptCount(accessCode: string, userId: string): Promise<number> {
    const participant = await prisma.gameParticipant.findFirst({
        where: { gameInstanceId: gameInstance.id, userId },
        select: { nbAttempts: true }
    });
    return participant?.nbAttempts || 1; // ← Returns total attempts, not current session
}
```

## The Fix

Fixed `getDeferredAttemptCount()` to read the current session attempt number from Redis session state:

```typescript
// ✅ FIXED CODE (after fix)
export async function getDeferredAttemptCount(accessCode: string, userId: string): Promise<number> {
    // Look for existing deferred session state keys to determine the current attempt number
    const pattern = `deferred_session:${accessCode}:${userId}:*`;
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
        // Extract attempt numbers from the keys and find the highest one
        const attemptNumbers = keys.map(key => {
            const parts = key.split(':');
            return parseInt(parts[parts.length - 1], 10);
        }).filter(num => !isNaN(num));
        
        if (attemptNumbers.length > 0) {
            return Math.max(...attemptNumbers);
        }
    }
    
    // If no active session, return 1 for the first attempt
    return 1;
}
```

## Additional Fix

Also fixed the fallback logic in `joinGame.ts` to not use `nbAttempts` as fallback:

```typescript
// ❌ BUGGY CODE (before fix)
const currentAttemptNumber = (joinResult.participant as any).currentDeferredAttemptNumber || joinResult.participant.nbAttempts;

// ✅ FIXED CODE (after fix)  
let currentAttemptNumber = (joinResult.participant as any).currentDeferredAttemptNumber;
if (!currentAttemptNumber) {
    // Let startDeferredTournamentSession figure it out via getDeferredAttemptCount
    currentAttemptNumber = undefined;
}
```

## Verification

Created comprehensive tests that verify:
1. `getDeferredAttemptCount()` returns correct session attempt numbers from Redis
2. Multiple deferred sessions show sequential attempt numbers (1, 2, 3...)
3. Function returns 1 when no active session exists
4. Function finds highest attempt number when multiple sessions exist

## Files Modified

1. **`/app/backend/src/sockets/handlers/deferredTournamentFlow.ts`**
   - Fixed `getDeferredAttemptCount()` function
   - Made function exported for testing

2. **`/app/backend/src/sockets/handlers/game/joinGame.ts`**
   - Fixed fallback logic to not use `nbAttempts`

3. **`/app/backend/tests/integration/attempt-count-fix-verification.test.ts`**
   - Added comprehensive tests for the fix

## Result

✅ **Users now see correct deferred tournament attempt counts:**
- First deferred session: "Attempt 1" 
- Second deferred session: "Attempt 2"
- Third deferred session: "Attempt 3"
- etc.

❌ **No longer showing total attempt counts:**
- ~~First deferred session: "Attempt 3"~~
- ~~Second deferred session: "Attempt 5"~~
- ~~Third deferred session: "Attempt 7"~~

The fix ensures that deferred tournament sessions display the correct attempt number based on the actual session count, not the total participant attempt count across all game modes.
