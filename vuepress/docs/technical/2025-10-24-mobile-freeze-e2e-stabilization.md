# Mobile Live Freeze E2E Stabilization (Multiple Choice)

Date: 2025-10-24

Scope: Stabilize the mobile E2E repro for the intermittent freeze on `live/[code]` by reusing known-good flows and minimizing auth/creation flakiness.

What changed
- Reused the exact, passing flow from existing suites:
  - Create teacher via backend API using the canonical helper (`TestDataHelper.createTeacher`) with `ADMIN_PASSWORD=whatever`.
  - Login via UI using `LoginHelper.loginAsTeacher` to ensure proper frontend cookies.
  - Create quiz/template/game via frontend proxies with `page.request` to relative routes: `/api/questions/list`, `/api/game-templates`, `/api/games`.
- Added a database cleanup at the start of each mobile test (`TestDataHelper.cleanDatabase`) to avoid uniqueness conflicts and stale state causing timeouts.
- Kept crash diagnostics and socket-capture in the student mobile context for better visibility.
- Preserved the "question switch" stress to validate late-join and update resilience.

Files touched
- `app/tests/e2e/mobile-mc-live-freeze-repro.spec.ts`
  - Added `await dataHelper.cleanDatabase()` at the start of each test before teacher registration.

Why this aligns with modernization goals
- Zero legacy compat: uses canonical shared helpers and frontend proxy routes instead of ad-hoc flows.
- Deterministic E2E setup: DB cleanup ensures isolation and fast feedback.
- Observability: Maintains diagnostics for sockets and runtime errors without changing app code.

Run notes (local)
- Prereqs: backend on :3007, frontend on :3008; `ADMIN_PASSWORD=whatever`.
- Global setup already pings `/health` (backend) and `/` (frontend) before tests.
- Suggested targeted run for the mobile spec:
  - iPhone: `npx playwright test app/tests/e2e/mobile-mc-live-freeze-repro.spec.ts -g "mobile multiple-choice live"`
  - Android: `npx playwright test app/tests/e2e/mobile-mc-live-freeze-repro.spec.ts -g "android (Pixel 5)"`

Expected outcomes
- Teacher creation and login complete reliably.
- Quiz creation via frontend API succeeds.
- Student mobile page receives `GAME_QUESTION`, answers render, taps are accepted.
- On question switch, student receives a new `[QUESTION UPDATE]` without needing manual recovery.

Next candidates (if flake persists)
- Add a tiny backend health retry inside the spec before registration.
- Capture backend `/api/v1/auth/register` timing via `Date.now()` around `page.request.post` to detect outliers.
- If auth still intermittently stalls, swap to `/api/v1/auth` with `action: 'teacher_register'` to compare path behavior (no compat layer retained).
