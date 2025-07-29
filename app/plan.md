# Timer Synchronization Modernization Plan

## Phase 1: Canonical Payload Update

    - [ ] `serverTime: Date.now()` (backend timestamp at emission)
    - [ ] Use a shared canonical type for the payload, defined in `shared/types/core/timer.ts` or some place else and validated with Zod

## Files Impacted (to update for canonical timer sync)

**this list my not be exhaustive, please add any files you find that are impacted by this change**

- Backend:
  - `backend/src/sockets/handlers/sharedGameFlow.ts` (emits timer events)
  - `backend/src/sockets/handlers/teacherControl/startTimer.ts` (timer events)
  - `backend/src/sockets/handlers/teacherControl/pauseTimer.ts` (timer events)
  - `backend/src/sockets/handlers/deferredTournamentFlow.ts` (emits timer events)
  - `shared/types/core/timer.ts` (canonical timer types)
  - `shared/types/socketEvents.zod.ts` (Zod schemas for timer payloads)

- Frontend:
  - `frontend/src/hooks/useSimpleTimer.ts` (consumes canonical timer payload)
  - `frontend/src/hooks/useTeacherQuizSocket.ts` (teacher dashboard timer sync)
  - `frontend/src/hooks/useGameSocket.ts` (role-based timer events)
  - `frontend/src/components/TimerDisplayAndEdit.ts` (timer display)
  - `frontend/archive/legacy-timer-hooks/useGameTimer.ts` (legacy, to be modernized or removed)
  - Any component using the above hooks for timer display or logic

---

## Phase 2: Frontend Synchronization Logic

- [ ] On the frontend, always calculate remaining time using backend's canonical time:

```js
function getRemainingTime(timerEndDateMs, serverTime) {
  const clientTime = Date.now();
  const drift = serverTime - clientTime;
  const correctedNow = clientTime + drift;
  return timerEndDateMs - correctedNow;
}
```
- [ ] Use this function everywhere timer display or logic is needed
- [ ] Remove all legacy/guesswork timer calculations

## Exit Criteria
- [ ] All timer payloads include `serverTime` and use canonical shared types with Zod validation
- [ ] Frontend timer logic uses backend time for perfect synchronization
- [ ] No legacy timer drift or UI jumps

## Testing
- [ ] Validate timer sync in teacher, student, and projection dashboards
- [ ] Confirm timer display matches backend state exactly
- [ ] Document all changes and update shared types
