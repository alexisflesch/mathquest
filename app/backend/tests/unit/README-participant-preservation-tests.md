# Unit Tests: Participant Preservation & Snapshot Security

## Overview
This test suite verifies the fixes for two critical leaderboard issues:

1. **Issue 1**: Users with join-order bonus scores disappearing from leaderboard on disconnect
2. **Issue 2**: Live score leakage to students during active gameplay (anti-cheating vulnerability)

## Test File Location
`/home/aflesch/mathquest/app/backend/tests/unit/participant-preservation-and-snapshot-security.test.ts`

## Running the Tests

```bash
# Run just these tests (recommended)
cd /home/aflesch/mathquest/app/backend
npx jest tests/unit/participant-preservation-and-snapshot-security.test.ts --no-coverage --globalSetup="" --globalTeardown=""
```

## Test Coverage

### Issue 1: Participant Preservation Logic
- ✅ **Preserve participants with any leaderboard score**: Tests that users with any score (including tiny join-order bonus) are preserved on disconnect
- ✅ **Handle PENDING vs ACTIVE status**: Tests that ACTIVE users are always preserved, PENDING users only if they have scores
- ✅ **Regression test for Clémence scenario**: Specifically tests the real-world case where Clémence disappeared

### Issue 2: Snapshot vs Live Data Logic  
- ✅ **Correct data source for different audiences**: Tests that students get snapshot data, teachers get live data
- ✅ **Snapshot sync before student emissions**: Tests that snapshots are synced before broadcasting to students
- ✅ **Regression test for Joséphine score leak**: Specifically tests the projection room showing live scores instead of snapshots

### Integration & Security Scenarios
- ✅ **Complete user lifecycle security**: Tests join → bonus → answer → disconnect → rejoin flow
- ✅ **Trophy click behavior**: Tests that live scores are only revealed when teacher explicitly clicks trophy
- ✅ **Security maintenance**: Tests that anti-cheating measures work throughout the game flow

## Test Results
```
✓ should preserve participants with any leaderboard score
✓ should handle PENDING vs ACTIVE status correctly  
✓ should use correct data source for different audiences
✓ should sync snapshot before emitting to students
✓ should maintain security during complete user lifecycle
✓ should only reveal live scores when teacher clicks trophy
✓ should not lose participants with join-order bonus (Issue 1)
✓ should not leak live scores to projection during join (Issue 2)

Test Suites: 1 passed, 1 total
Tests: 8 passed, 8 total
```

## What These Tests Verify

### Fixed Participant Preservation Logic
- Users with ANY leaderboard score (including 0.009 join-order bonus) are preserved on disconnect
- PENDING users without scores are properly removed
- ACTIVE users are always preserved regardless of score

### Fixed Snapshot Anti-Cheating System  
- Students receive snapshot data during gameplay (can't see live scores)
- Projection room receives snapshot data (no more live score leakage)
- Teachers receive live data for classroom management
- Trophy click properly syncs live data to snapshot for final reveal

### Regression Prevention
- Prevents return of "Clémence disappearing" issue
- Prevents return of "Joséphine live score leak" issue
- Maintains security throughout complete user lifecycle

## Implementation Notes
These are **logic-only tests** that verify the core algorithms without complex mocking. They test the essential business logic that was fixed in:
- `/backend/src/sockets/handlers/game/disconnect.ts` (line 96-101)
- `/backend/src/utils/projectionLeaderboardBroadcast.ts` 
- `/backend/src/api/v1/gameControl.ts`

The tests focus on the critical decision logic rather than infrastructure mocking, making them robust and maintainable.
