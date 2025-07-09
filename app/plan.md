# PHASE: Score Reset Logic by Mode (Tournament vs Quiz) (2025-07-09)

## Context

Currently, the score reset logic in `getOrCreateParticipation` always resets the score and increments attempts on replay, regardless of mode. We want to:
- Keep this logic for tournaments.
- Skip it for quizzes (do not reset score or increment attempts on replay).

---

## Phase 1: Planning & Documentation

- [x] Document the requirement and context in `plan.md`.
- [x] Create a checklist for the implementation phase.

---

## Phase 2: Implementation

- [ ] Update `getOrCreateParticipation` to accept a `mode` parameter (e.g., `"tournament"` or `"quiz"`).
- [ ] Branch logic:
  - [ ] If mode is `"tournament"`, keep current behavior (reset score, increment attempts).
  - [ ] If mode is `"quiz"`, do not reset score or increment attempts on replay.
- [ ] Update all usages of `getOrCreateParticipation` to pass the correct mode.
- [ ] Ensure shared types and Zod schemas reflect the canonical mode values.

---

## Phase 3: Testing & Validation

- [ ] Add or update tests to cover both tournament and quiz flows.
- [ ] Document test steps in `plan.md`:
  - [ ] For tournament: replay resets score and increments attempts.
  - [ ] For quiz: replay does not reset score or increment attempts.
- [ ] State expected vs. actual behavior after testing.

---

## Phase 4: Documentation & Logging

- [ ] Log all changes in `plan.md` and `log.md`.
- [ ] Update any relevant documentation or diagrams.
- [ ] Ensure all API boundaries and payloads are validated with Zod.

---

# PHASE: Redis State Modernization – Prevent Participant/Score Loss (2025-07-09)

## Context

When replaying or joining a quiz/tournament game, participants and their scores were disappearing from the Redis-based leaderboard and podium, even though the database was correct. Root cause: Redis state was being cleared at game start (and deferred session start), wiping all participants and scores. Redis must only be cleared at game/session end.

---

## Phase 1: Planning & Documentation

- [x] Investigate and confirm root cause (Redis cleanup at game start/session start)
- [x] Identify all locations where Redis is cleared at the start of a game/session
- [x] Update plan.md with checklist and context

---

## Phase 2: Implementation

- [x] Remove/comment out Redis cleanup at game start in `sharedGameFlow.ts`
- [x] Remove/comment out Redis cleanup at deferred session start in `deferredTournamentFlow.ts`
- [ ] Log all changes in `plan.md` and `log.md`

---

## Phase 3: Testing & Validation

- [ ] Test joining/replaying a game: verify all participants and scores persist in Redis throughout the game
- [ ] Validate leaderboard and podium are correct for all users
- [ ] Ensure Redis is only cleared at game/session end
- [ ] Document test steps and results in plan.md

---

## Phase 4: Documentation & Logging

- [ ] Update `log.md` with summary of changes and validation steps
- [ ] Ensure all modernization guidelines are followed

---
