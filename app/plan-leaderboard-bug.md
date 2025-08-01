# Deferred Tournament Leaderboard Issues - Plan

## Leaderboard Occurrences (Codebase Audit)

This section lists all occurrences of the term "leaderboard" in the codebase, including file, line, and context, to support modernization and documentation standards.

### Backend

- `backend/src/sockets/handlers/deferredTournamentFlow.ts` — Handles leaderboard emission in deferred mode (see lines 300-330 for emission logic)
- `backend/src/sockets/handlers/sharedLeaderboard.ts` — Shared leaderboard calculation logic (always uses global Redis key)
- `backend/src/sockets/handlers/game/joinGame.ts` — Join logic, join-order bonus, leaderboard context
- `backend/src/sockets/handlers/game/gameAnswer.ts` — Answer processing, leaderboard emission
- `backend/src/core/services/gameStateService.ts` — Session state, leaderboard formatting

### Frontend

- `frontend/src/app/leaderboard/[code]/page.tsx` — Tournament leaderboard page (UI, fetch, display, highlight logic)
- `frontend/src/app/live/[code]/page.tsx` — LeaderboardFAB component, leaderboard display logic
- `frontend/src/constants/api.ts` — API endpoint for leaderboard fetch
- `frontend/src/hooks/useStudentGameSocket.ts` — Socket event handling for leaderboard updates

### Scripts & Utilities

- `scripts/validate-leaderboard-security.py` — Security validation for leaderboard emission
- `scripts/validate-quiz-leaderboard-fix.py` — Quiz leaderboard validation
- `scripts/validate-join-leaderboard.py` — Join leaderboard validation
- `scripts/validate-leaderboard-security.js` — JS security checks for leaderboard emission

### Shared Types & Schemas

- `shared/types/core/leaderboardEntry.zod.ts` — Canonical leaderboard entry type and Zod schema
- `shared/types/api_schemas.ts` — Leaderboard response schemas

### Miscellaneous

- `plan.md` (this file) — Documentation and checklist for leaderboard issues
- `frontend/src/app/leaderboard/plan.md` — Frontend-specific leaderboard plan and checklist

### Key Redis Patterns

- `mathquest:game:leaderboard:${accessCode}` — Global leaderboard key (live mode)
- `leaderboard:snapshot:${accessCode}` — Leaderboard snapshot key
- `deferred_session:${accessCode}:${userId}:${attemptCount}` — Deferred session state (per-user leaderboard)

---

## Problems Identified

1. **Small issue**: Score showing 0.01 (join-order bonus) on first question instead of 0 
2. **Major issue**: Leaderboard FAB appears during first question even when leaderboard is empty 
3. **Major issue**: Leaderboard doesn't update after subsequent questions (score stays at 0.01)

## Root Cause Analysis

Based on code review, the issues seem to be in the deferred tournament flow:

### Issue 1: Join-order bonus in deferred mode
- **Location**: `backend/src/sockets/handlers/game/joinGame.ts` lines 174-183
- **Problem**: Join-order bonus is applied even in deferred mode, where user should be alone
- **Fix needed**: Skip join-order bonus for deferred tournaments

### Issue 2: Empty leaderboard FAB showing
- **Location**: `frontend/src/app/live/[code]/page.tsx` LeaderboardFAB component
- **Problem**: FAB shows when `leaderboardLength > 0` but leaderboard might contain only zero scores
- **Current logic**: `if (!userId || leaderboardLength === 0 || !userRank) return null;`
- **Fix needed**: Also check if total scores > 0 or if there are meaningful entries

### Issue 3: Score not updating in deferred mode ⭐ **MAJOR ISSUE**
- **Location**: `backend/src/sockets/handlers/deferredTournamentFlow.ts` (lines 300-330)
- **Problem**: Deferred flow never emits leaderboard updates after question timer expires
- **Understanding**: Regular tournaments use `sharedGameFlow.ts` which calls `emitLeaderboardFromSnapshot` after each question
- **Root Cause**: Deferred flow has its own timer logic and doesn't call leaderboard emission
- **Fix needed**: Add leaderboard emission to deferred flow after each question ends

## Investigation Plan

### Phase 1: Understand Deferred Flow ✅
- [x] Read deferred tournament flow code
- [x] Understand how scoring works in deferred mode  
- [x] Identify where leaderboard updates should happen
- [x] Check Redis keys used for deferred sessions
- [x] Verify socket room structure for deferred players

**Key Findings:**
- Deferred players join room: `deferred_${accessCode}_${userId}` (individual rooms)
- Regular tournaments emit to: `game_${accessCode}` (shared room) 
- **ROOT CAUSE**: Deferred flow never emits leaderboard updates after questions end!
- Leaderboard emission happens in `sharedGameFlow.ts` but deferred flow has its own timer logic

### Phase 2: Fix Join-Order Bonus 🔄 **FIXED**
- [x] Modify joinGame.ts to skip join-order bonus for deferred tournaments  
- [x] **ISSUE FOUND**: Used wrong condition - `gameInstance.isDiffered` is about tournament design, not current access mode
- [x] **CORRECTED**: Changed condition to `gameInstance.status === 'completed'` to detect current deferred access
- [x] Line 230 already had the correct check
- [x] **CONFIRMED**: Join bonus logic in `joinService.ts` is working correctly (`joinBonusCondition: false`)
- [ ] Test the corrected fix

### Phase 3: Fix Leaderboard FAB Logic  
- [ ] Update LeaderboardFAB component to check for meaningful scores
- [ ] Test that FAB only shows when there are actual scores > 0

### Phase 4: Fix Score Update Emission ✅ **COMPLETED** 
- [x] Added leaderboard emission to deferred tournament flow after each question ends
- [x] Implementation: Added `emitLeaderboardFromSnapshot` call in `deferredTournamentFlow.ts`
- [x] **CONFIRMED**: Leaderboard updates are now being sent and received by frontend
- [x] **MAJOR ISSUE FOUND**: Deferred sessions are NOT isolated - they use shared Redis keys!
- [x] **FIXED**: Implemented Redis key isolation for deferred sessions
- [x] **FIXED**: Deferred sessions now use session state for score tracking instead of global leaderboard
- [x] **FIXED**: Score updates in deferred mode use `deferred_session:${accessCode}:${userId}:${attemptCount}` Redis key

### Phase 5: Deferred Session Isolation ✅ **COMPLETED**
- [x] **Fixed scoringService.ts**: Updated to store deferred scores in session state instead of global leaderboard
- [x] **Fixed deferredTournamentFlow.ts**: Updated to read scores from session state instead of global Redis leaderboard
- [x] **Fixed Redis cleanup**: Session state keys already included in cleanup utilities
- [x] **Session initialization**: Added score initialization to 0 at session start
- [x] **TypeScript compilation**: All changes compile successfully

### Phase 6: Complete Redis Cleanup ✅ **COMPLETED**

#### Final Status
- ✅ Enhanced comprehensive Redis cleanup with shared utility
- ✅ Added deferred-specific cleanup for proper session isolation
- ✅ Fixed Redis key pattern inconsistencies in deferred sessions
- ✅ Added timing constants and automatic progression  
- ✅ Fixed deferred tournament timing to use 1.5s for correct answers display
- ✅ **UPDATED gameInstance deletion to include deferred session keys**

#### Completed Work
- [x] Create shared Redis cleanup utility (`cleanupGameRedisKeys`)
- [x] Create deferred-specific cleanup utility (`cleanupDeferredSessionRedisKeys`)
- [x] Fix key pattern inconsistencies in deferred sessions (added attempt count to question_start keys)
- [x] Enhanced cleanup covering all Redis key patterns for both live and deferred sessions
- [x] Updated sharedGameFlow.ts to use shared cleanup utility
- [x] Updated endGame.ts to use shared cleanup utility  
- [x] Updated deferredTournamentFlow.ts to use deferred-specific cleanup
- [x] Added manual cleanup scripts for maintenance
- [x] **Updated deleteAllGameInstanceRedisKeys.ts to use comprehensive cleanup utility**
- [x] **Updated gameInstanceService.ts to call Redis cleanup when deleting instances**
- [x] TypeScript compilation validated successfully

#### Key Pattern Fixes
- **Before**: `mathquest:game:question_start:3146:questionUid:userId` (missing attempt count)
- **After**: `mathquest:game:question_start:3146:questionUid:userId:attemptCount` (proper isolation)

#### Implementation Details
- **General cleanup**: `cleanupGameRedisKeys(accessCode, context)` for live games and teacher-initiated cleanup
- **Deferred cleanup**: `cleanupDeferredSessionRedisKeys(accessCode, userId, attemptCount, context)` for individual deferred sessions
- **GameInstance deletion**: `deleteAllGameInstanceRedisKeys(accessCode)` now uses comprehensive cleanup utility
- **Manual cleanup**: `npm run cleanup:redis -- <accessCode>` for maintenance
- **Test utilities**: Test scripts for validating cleanup behavior

#### Key Integration Points
- **gameTemplateService.ts**: Calls `deleteAllGameInstanceRedisKeys` when force-deleting templates
- **gameInstanceService.ts**: Calls `deleteAllGameInstanceRedisKeys` when deleting individual instances
- **deleteAllGameInstanceRedisKeys.ts**: Updated to use `cleanupGameRedisKeys` utility for comprehensive coverage

#### Key Patterns Now Covered
```
// Live game cleanup (general)
mathquest:game:participants:${accessCode}
mathquest:game:leaderboard:${accessCode}
mathquest:game:answers:${accessCode}:*
mathquest:timer:${accessCode}:*
leaderboard:snapshot:${accessCode}
mathquest:projection:display:${accessCode}
...

// Deferred session cleanup (specific to user/attempt)
mathquest:game:question_start:${accessCode}:*:${userId}:${attemptCount}
mathquest:game:deferred_session:${accessCode}:${userId}:${attemptCount}
deferred_session:${accessCode}:${userId}:${attemptCount}
mathquest:deferred:timer:${accessCode}:${userId}:${attemptCount}:*
...
```

## Key Files to Investigate

1. **Backend**:
   - `backend/src/sockets/handlers/deferredTournamentFlow.ts` - Main deferred flow
   - `backend/src/sockets/handlers/game/joinGame.ts` - Join logic and bonus
   - `backend/src/sockets/handlers/sharedLeaderboard.ts` - Leaderboard calculation
   - `backend/src/sockets/handlers/game/gameAnswer.ts` - Answer processing

2. **Frontend**:
   - `frontend/src/app/live/[code]/page.tsx` - LeaderboardFAB component
   - `frontend/src/hooks/useStudentGameSocket.ts` - Socket event handling

## Test Scenarios

1. **Deferred tournament with single player**:
   - Start deferred tournament
   - Join as single player  
   - Answer first question correctly
   - Check score is 0, not 0.01
   - Check FAB doesn't appear
   - Answer second question correctly
   - Check score updates properly
   - Check FAB appears when score > 0

## Summary of Fixes Implemented ✅

### Core Issues Resolved:

1. **❌ Global Leaderboard Pollution**: 
   - **Problem**: Deferred sessions were writing to and reading from the global Redis leaderboard (`mathquest:game:leaderboard:${accessCode}`)
   - **Solution**: Modified `scoringService.ts` to store deferred scores in isolated session state (`deferred_session:${accessCode}:${userId}:${attemptCount}`)

2. **❌ Incorrect Score Source**:
   - **Problem**: Deferred leaderboard emission was reading from global Redis leaderboard
   - **Solution**: Modified `deferredTournamentFlow.ts` to read scores from session state instead

3. **❌ Missing Score Initialization**:
   - **Problem**: Session state score was not initialized at session start
   - **Solution**: Added score initialization to 0 when creating deferred session state

### Technical Implementation:

1. **scoringService.ts Changes**:
   ```typescript
   if (isDeferred) {
       // Store score in isolated session state, not global Redis leaderboard
       const sessionStateKey = `deferred_session:${gameInstance.accessCode}:${userId}:${attemptCount}`;
       await redisClient.hset(sessionStateKey, 'score', currentTotalScore.toString());
   } else {
       // Update Redis leaderboard ZSET with new total score (live mode only)
       const leaderboardKey = `mathquest:game:leaderboard:${gameInstance.accessCode}`;
       await redisClient.zadd(leaderboardKey, currentTotalScore, userId);
   }
   ```

2. **deferredTournamentFlow.ts Changes**:
   ```typescript
   // Get the session state score (isolated from global leaderboard)
   const sessionStateKey = `deferred_session:${accessCode}:${userId}:${attemptCount}`;
   const sessionData = await redisClient.hgetall(sessionStateKey);
   const currentScore = sessionData?.score ? parseFloat(sessionData.score) : 0;
   ```

3. **Session Initialization**:
   ```typescript
   // Initialize session score to 0 (isolated from global leaderboard)
   await redisClient.hset(sessionStateKey, 'score', '0');
   ```

### Benefits:

- ✅ **Complete Isolation**: Deferred sessions no longer pollute or read from live tournament leaderboards
- ✅ **Correct Scoring**: Each deferred session maintains its own score independently
- ✅ **Clean Architecture**: Clear separation between live and deferred scoring logic
- ✅ **Proper Cleanup**: Session state keys are already included in Redis cleanup utilities
- ✅ **Type Safety**: All changes compile successfully with TypeScript

---
