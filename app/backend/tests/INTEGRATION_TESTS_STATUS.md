# Integration Tests Status

This file lists all backend integration tests and their current run status.

Format:
- Path — Status — Notes

---

- tests/integration/verify-bug-fix.test.ts — passed — validated (deferred attempt progression bug fix verified; live regression checked)
- tests/integration/user-reported-attempt-count-bug.test.ts — removed — legacy empty test (deleted)
- tests/integration/comprehensive-tournament.test.ts — removed — legacy empty test (deleted)
- tests/integration/database-reality-check.test.ts — passed — validated (participant/db lookups; game/user not found scenarios exercised)
- tests/integration/attempt-count-fix-verification.test.ts — removed — legacy empty test (deleted)
- tests/integration/participant-preservation-real-redis.test.ts — passed — validated (real Redis participant preservation; projection broadcast adapter missing in test environment caused non-fatal errors logged)
- tests/integration/attempt-count-bug-reproduction.test.ts — removed — legacy empty test (deleted)
- tests/integration/deferred-leaderboard-emission.test.ts — passed — validated (session-only leaderboard emission)
- tests/integration/scoring-all-modes.test.ts — passed — validated (quiz/live/deferred consistency)
- tests/integration/late-joiner-leaderboard.test.ts — passed — validated
- tests/integration/leaderboard-payload.test.ts — passed — validated (live + deferred payloads)
- tests/integration/new-scoring-strategy.test.ts — passed — validated (scaling/MC/penalty)
- tests/integration/e2e-bug-reproduction.test.ts — removed — legacy empty test (deleted)
- tests/integration/scoring-question-types.test.ts — passed — validated (numeric/MC/single)
- tests/integration/check-db-values-only.test.ts — passed — validated (DB snapshot introspection; found high-attempt users listed)
- tests/integration/focused-live-to-deferred-bug.test.ts — passed — validated (test harness fix: delete gameTemplate before user to avoid FK)
- tests/integration/tournament-mode-logic.test.ts — passed — validated (mode detection, keys, attempt logic, scoring formula consistency)
- tests/integration/deferred-tournament-fixes.test.ts — passed — validated (deferred attempt/time-penalty/session isolation fixes)
- tests/integration/score-time-penalty-tiebreaker.test.ts — passed — validated (time penalty & tie-breaker behavior)
- tests/integration/real-api-test.test.ts — passed — validated (joinGame + DB + API simulation)

---

Notes:
- I will run the remaining tests one-by-one and update the status above after each run with a short note (pass/fail and key logs).
- Tests already run this session are marked "passed" above.

 
---

Final sweep (2025-09-09): All files in `backend/tests/integration` were inspected and either run or removed during this session.

- Summary: All non-legacy integration tests in `backend/tests/integration` are marked "passed" above; legacy/empty tests were deleted and are marked "removed".

If you'd like, I will now (A) continue scanning other test folders (for example `tests/integration` at the repo root) and run any remaining integration tests there, or (B) produce a consolidated report listing each test file, its latest run log excerpt, and recommended next steps. Reply with "continue" to keep running tests, or "report" to produce the consolidated report.

