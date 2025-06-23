# Modernization Plan & Checklist

## Deferred Tournament Timer & Answer Submission Bug

### Root Cause
- [x] Identified that answer handler was always loading global game state, not per-user session state, for deferred tournaments.
- [x] This caused timer validation to always fail if the global game was completed, even if the per-user timer was valid.
- [x] Timer was not reset between attempts/questions in deferred mode, causing time to accumulate and excessive penalties.
- [x] Timer/scoring logic was not fully unified; some mode-specific branches remained.

### Solution
- [x] Update answer handler to load and check per-user game state (`deferred_session:${accessCode}:${userId}`) for deferred tournaments.
- [x] Use per-user timer for validation and answer acceptance.
- [x] Reset per-user timer before starting it for each question in deferred mode to prevent time accumulation.
- [x] Refactor all timer/scoring logic to use CanonicalTimerService with the correct key for all modes (quiz, live, deferred), eliminating mode-specific branches.

---

## Phase: Fix and Validate Deferred Timer Bug
- [x] Review timer and answer submission logic for all modes
- [x] Identify root cause (global vs per-user state)
- [x] Update code to use per-user state for deferred
- [x] Fix timer reset logic for deferred mode
- [x] Refactor to unify timer/scoring logic for all modes
- [ ] Test deferred answer submission after global game is completed
- [ ] Confirm timer and answer flow works for all modes
- [ ] Update audit log and documentation

---

## Phase: Enforce Timer/Session Logic by Game Status
- [ ] Update answer handler to check `gameState.status` at timer/session selection point
- [ ] If `status === 'active'`, use live/global timer/session
- [ ] If `status !== 'active'` (e.g. 'completed'), use deferred/per-user timer/session
- [ ] Add/adjust logging to confirm which logic is used
- [ ] Test: play live, then deferred, and confirm correct timer/session is used and no "timer expired" error
- [ ] Update audit log and documentation

---

## Testing Steps
- Start a deferred tournament session as a user after the global game is completed
- Submit answers for questions in deferred mode
- Expected: Answers are accepted if per-user timer is valid, regardless of global game state. Score is nonzero for correct answers with reasonable time spent. Timer/scoring logic is identical for all modes.
- Actual: (fill after test)

- Start a live session, then complete it, then join as a new user (should be deferred mode)
- Submit answers as deferred user
- Expected: Deferred logic is always used if game is not active; no timer expired error from global session
- Actual: (fill after test)

---

## Exit Criteria
- [ ] Deferred users can submit answers as long as their per-user timer is valid
- [ ] Timer/session logic is always selected by game status (active vs completed)
- [ ] No legacy/ambiguous session selection remains
