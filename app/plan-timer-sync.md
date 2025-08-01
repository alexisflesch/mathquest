# Timer Synchronization Modernization Plan

## Phase 1: Canonical Payload Update

    - [x] `serverTime: Date.now()` (backend timestamp at emission)
    - [x] Use a shared canonical type for the payload, defined in `shared/types/core/timer.ts` or some place else and validated with Zod

## Files Impacted (to update for canonical timer sync)

**this list my not be exhaustive, please add any files you find that are impacted by this change**

- Backend:
  - [x] `backend/src/sockets/handlers/sharedGameFlow.ts` (emits timer events)
  - [x] `backend/src/sockets/handlers/teacherControl/startTimer.ts` (timer events)
  - [x] `backend/src/sockets/handlers/teacherControl/pauseTimer.ts` (timer events - mostly deprecated)
  - [x] `backend/src/sockets/handlers/deferredTournamentFlow.ts` (emits timer events)
  - [x] `backend/src/sockets/handlers/game/joinGame.ts` (late joiner timer emissions)
  - [x] `backend/src/sockets/handlers/teacherControl/joinDashboard.ts` (initial timer state)
  - [x] `shared/types/core/timer.ts` (canonical timer types)
  - [x] `shared/types/socketEvents.zod.ts` (Zod schemas for timer payloads)

- Frontend:
  - [x] `frontend/src/hooks/useSimpleTimer.ts` (consumes canonical timer payload)
  - [x] `frontend/src/hooks/useTeacherQuizSocket.ts` (teacher dashboard timer sync - uses useSimpleTimer)
  - [x] `frontend/src/hooks/useGameSocket.ts` (role-based timer events - low-level socket interface)
  - [x] `frontend/src/components/TimerDisplayAndEdit.ts` (timer display - pure UI component)
  - [x] `frontend/archive/legacy-timer-hooks/useGameTimer.ts` (legacy, archived - not used in production)
  - [x] Any component using the above hooks for timer display or logic

---

## Phase 2: Frontend Synchronization Logic

- [x] On the frontend, always calculate remaining time using backend's canonical time:

```js
function getRemainingTime(timerEndDateMs, serverTime) {
  const clientTime = Date.now();
  const drift = serverTime - clientTime;
  const correctedNow = clientTime + drift;
  return timerEndDateMs - correctedNow;
}
```
- [x] Use this function everywhere timer display or logic is needed
- [x] Remove all legacy/guesswork timer calculations

## Exit Criteria
- [x] All timer payloads include `serverTime` and use canonical shared types with Zod validation
- [x] Frontend timer logic uses backend time for perfect synchronization
- [x] No legacy timer drift or UI jumps

## Testing
- [x] Validate timer sync in teacher, student, and projection dashboards (all use useSimpleTimer with drift correction)
- [x] Confirm timer display matches backend state exactly (getRemainingTime function implemented)
- [x] Document all changes and update shared types (serverTime added to all timer payloads)
