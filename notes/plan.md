# MathQuest Stability Plan (v1)

This plan focuses on stabilizing the existing app (no major new features). Work proceeds in narrow phases with explicit exit criteria. Each phase is safe to merge independently and increases reliability.

Owner: AI agent (automated). Human input: minimal, for approvals and environment toggles.

---

## Goals
- Eliminate classes of crashes (renderer/page crash, stack overflow, memory churn).
- Prevent event storms (duplicate socket emits, repeated payload processing).
- Improve long-idle and backgrounding resilience.
- Add lightweight observability to catch issues early (without heavy infra).

Success criteria (global):
- 0 page crashes during a 30‑minute soak across iPhone 12, Pixel 5, and desktop.
- No duplicate join_game or repeated GAME_QUESTION storms in logs across reconnects.
- Playwright “chaos” suite passes twice consecutively on main.

---

## Phase 1: Quick wins (client dedupe & recovery hygiene)

Work items:
- Cancel late‑join recovery timers when GAME_QUESTION arrives.
- Drop duplicate GAME_QUESTION payloads (same uid/index/total) to avoid re-render/typeset storms.
- Add diagnostics buffer persistence + auto-download after crash (complete).

Exit criteria:
- Backend logs show no repeated join_game from same socket without disconnect.
- E2E long-idle/background test passes 2× without crash.

Status: DONE (first two changes landed; verify with new logs).

---

## Phase 2: Backend idempotency and log control

Work items:
- Add JOIN_GAME idempotency window (3–5s) keyed by socketId+accessCode (Redis or in-memory TTL).
- Gate io.onAny debug behind env flag (off by default), keep route-level targeted logs.

Exit criteria:
- Contract test: 3 JOIN_GAME in <2s → only one full join flow executes.
- Production logs: join/broadcast fan-out reduced >80% during reconnects.

---

## Phase 3: Stability harness (E2E chaos + counters)

Work items:
- Playwright chaos flows:
  - Offline/online flap with jitter; background/resume (5–10 minutes).
  - Duplicate question flips from teacher; ensure student drops dupes.
- In-browser counters (window.__mqCounters) for critical events; fail test if budget exceeded.
- Crash sentinels: fail on window.error/unhandledrejection, or ws.close 1006 without recovery.

Exit criteria:
- Nightly chaos suite green across 3 device profiles, twice in a row.
- No counter budget violations under chaos scenarios.

---

## Phase 4: Guardrails (lint + runtime invariants)

Work items:
- ESLint rules: forbid effects without cleanup; disallow socket.on in render; enforce deps; ban unguarded emits.
- Runtime invariants: assert join emit only when needed; assert listener counts under threshold; warn & self-heal if exceeded.

Exit criteria:
- Codebase passes new lint rules.
- Unit tests for invariants and listener leak detection.

---

## Phase 5: Observability (lightweight)

Work items:
- Correlation IDs across client/server logs.
- Minimal metrics (dev/staging): joins/min, game_question/min per user.
- VuePress docs for diagnostics & runbooks.

Exit criteria:
- Correlated logs for a full join→question→answer round-trip.
- Visual check dashboards with storm alerts.

---

## Rollout & Risk
- Phases 1–2: low risk, incremental; canary on staging/prod.
- Phases 3–5: test-only or dev/staging gates; production knobs off by default.

Backout: feature flags for idempotency and onAny logging; revert rules if false positives.

---

## Minimal-interaction workflow
- Agent creates PRs per phase with:
  - code changes, tests, docs updates, and short validation notes
  - clear exit criteria checklist
- Human reviews/approves; agent merges and proceeds to next phase.

---

## Appendices
- Diagnostics usage: see `vuepress/docs/dev/diagnostics.md`.
- Test inventory: `app/backend/tests/**`, `app/frontend/src/app/live/**`, `app/tests/e2e/**`.
