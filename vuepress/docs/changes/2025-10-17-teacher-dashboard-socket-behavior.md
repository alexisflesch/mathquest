# 2025-10-17 — Teacher Dashboard Socket Behavior Updates

Scope: Frontend hook `useTeacherDashboardSocket`, backend dashboard confirmation emit

## Summary
- Dashboard socket logic now:
  - Emits `TEACHER.JOIN_DASHBOARD` on every successful connect (including reconnect) to request a replay of the canonical state.
  - Defers event listener binding to the next tick to avoid React 19 nested `act()` warnings in tests while keeping runtime behavior unchanged.
  - Accepts both `TEACHER.TOGGLE_PROJECTION_STATS` and canonical `PROJECTOR.PROJECTION_SHOW_STATS` events to sync the "show stats" UI.

- Backend teacher-control handler confirms the stats toggle to dashboards by emitting `TEACHER.TOGGLE_PROJECTION_STATS { show }` after persisting and projector broadcast.

## Details
- New/clarified socket events
  - TEACHER.JOIN_DASHBOARD (client → server): `{ accessCode: string }`
    - Sent on each connect/reconnect from dashboards.
  - TEACHER.TOGGLE_PROJECTION_STATS (server → dashboards): `{ show: boolean }`
    - Server confirmation after toggle is persisted and projector state is updated.
  - PROJECTOR.PROJECTION_SHOW_STATS (server → dashboards): `{ show: boolean }`
    - Canonical projector event also accepted by dashboard to remain in sync.

- Listener scheduling
  - Dashboard hook binds listeners with `setTimeout(..., 0)` to avoid nested `act()` in tests under React 19. Production behavior (event handling order) remains functionally the same.

## Tests
- Added unit tests to lock behavior:
  - `frontend/tests/unit/teacher-dashboard-reconnect.test.tsx`
    - Verifies reconnect overlay UX and that `JOIN_DASHBOARD` is re-emitted on reconnect.
  - `frontend/tests/unit/teacher-dashboard-join-replay.test.tsx`
    - Verifies `JOIN_DASHBOARD` on initial connect and that `GAME_CONTROL_STATE` and `DASHBOARD_TIMER_UPDATED` are consumed correctly.
  - Existing: `frontend/tests/unit/stats-toggle-behavior.test.tsx`
    - Ensures no optimistic UI; updates only on server confirmation and via projector canonical event.

## Validation
- TypeScript: No public types changed; Zod validators used for dashboard events. Unified TS check configuration currently reports unrelated issues; per package `npx tsc` in frontend/backend/shared passes.
- E2E: Previously failing filters spec adjusted to reflect dataset; entire e2e suite passes per maintainer run.

## Migration
- No migration layers added; behavior is canonical and aligned with shared socket events.

