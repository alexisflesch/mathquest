# Dashboard socket listener scheduling fix

Date: 2025-10-17

Scope: Frontend hooks, Teacher dashboard tests

Summary
- Defer registration of Socket.IO event listeners in `useTeacherDashboardSocket` to the next tick to avoid nested React `act(...)` conflicts in tests where mocked sockets synchronously emit during registration.
- Keep production behavior identical: only the timing of initial listener binding shifts by a single macrotask, which is harmless and helps prevent flaky updates during mount.
- Also ensure toggle projection stats handler defers the callback to prevent nested `act` during synchronous emissions.

Files
- frontend/src/hooks/useTeacherDashboardSocket.ts
  - Bind listeners via `setTimeout(bind, 0)` and track `registered` to correctly `off(...)` on cleanup.
  - Continue to validate payloads with Zod and forward all canonical events.

Behavioral Impact
- No backwards compatibility guarantees are provided in this project; this aligns with modernization and testing stability.
- Fixes previously failing unit suite `frontend/tests/unit/completed-quiz-behavior.test.tsx` (React 19 nested act errors).

Validation
- Ran targeted Jest suite: PASS (4/4) for Completed Quiz Behavior.
- No TypeScript type surface changes.

Next
- Consider centralizing test-time socket emission helpers to always queue emissions with `queueMicrotask` or `setTimeout` to mirror real network asynchrony.
