# Timer Synchronization Modernization Plan

## Phase 1: Canonical Payload Update

- [ ] Update all timer-related backend payloads to include:
    - [ ] `serverTime: Date.now()` (backend timestamp at emission)
    - [ ] Use a shared canonical type for the payload, defined in `shared/types/core/timer.ts` and validated with Zod

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
