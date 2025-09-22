# Modernization Plan — Missing Features Inventory

Purpose: Track what the docs promise vs. what exists in code. This file is the single source of truth during this investigation. Check items as they’re validated or implemented.

## Phase 1 — Inventory from Docs vs Code

- [x] Read feature promises in VuePress docs
	- Docs references:
		- Projection + QR + stats: `vuepress/docs/utilisation/quiz.md` (Vue vidéoprojecteur, QR code, statistiques)
		- Tournament flow + history/replay: `vuepress/docs/utilisation/tournoi.md`
		- Overview promises: `vuepress/docs/utilisation/README.md`
- [x] Verify implementation for each promise in the app codebase
	- QR code on projection/lobby/leaderboard
		- Code evidence:
			- `app/frontend/src/components/QrCodeWithLogo.tsx`
			- `app/frontend/src/components/TeacherProjectionClient.tsx`
			- `app/frontend/src/app/live/components/LobbyDisplay.tsx` (QR modal)
			- `app/frontend/src/app/leaderboard/[code]/page.tsx` (QR modal)
		- Status: Implemented
	- Projection shows live stats (teacher-controlled)
		- Code evidence:
			- `app/frontend/src/hooks/useProjectionQuizSocket.ts` (listens to show/hide stats, correct answers)
			- `app/frontend/src/components/TeacherDashboardClient.tsx` (toggle projection stats)
			- `app/frontend/src/components/QuestionDisplay.tsx` (stats toggle UI)
			- `app/frontend/src/components/StatisticsChartImpl.tsx` (chart math)
			- Backend events: `app/backend/src/sockets/handlers/teacherControl/toggleProjectionStats.ts`
		- Status: Implemented
	- Projection layout and z-ordering controls
		- Code evidence: `app/frontend/src/components/TeacherProjectionClient.tsx`
		- Status: Implemented
	- Tournament history (“Historique”) and replay (différé)
		- Code evidence:
			- Nav: `app/frontend/src/components/AppNav.tsx` (Historique → `/my-tournaments`)
			- Page: `app/frontend/src/app/my-tournaments/page.tsx` (pending/active/ended; replay button)
			- Leaderboard page: `app/frontend/src/app/leaderboard/[code]/page.tsx` (deferred section, replay CTA)
			- Join flow: `app/frontend/src/app/student/join/page.tsx` (deferred availability/expiry)
			- Backend: `app/backend/src/core/services/gameParticipant/deferredTimerUtils.ts`, `utils/deferredUtils.ts`
		- Status: Implemented

## Phase 2 — Gaps and Partial Implementations

- [ ] Detailed archives/analytics pages beyond list and leaderboard
	- What docs promise: “consulter le tournoi dans la section historique” and general analytics tone; no explicit per-question review page documented, but typical expectation is a detailed post-session view.
	- Observed implementation:
		- Exists: listing in `/my-tournaments`, leaderboard view with deferred scores, replay entry points.
		- Not found (search): dedicated “tournament details” page with per-question distribution, per-user breakdown, or exportable analytics.
	- Status: Partial
	- Acceptance criteria to consider:
		- A details route (e.g., `/tournaments/[code]`) with:
			- Per-question stats snapshot (counts, percentages)
			- Correct answers and explanations
			- Participant list with per-question correctness
		- Links from `/my-tournaments` and leaderboard to this details page

- [ ] Data exports for reports (CSV/PDF/XLSX)
	- Docs mention exports only for YAML to LaTeX (scripts/yaml2latex.py), not app analytics exports. No app CSV/PDF export endpoints/buttons were found via search.
	- Observed implementation: None for tournament results export.
	- Status: Missing (unless out-of-scope)
	- Acceptance criteria to consider:
		- Backend endpoint: `GET /api/v1/games/:code/report.csv` (Zod-validated)
		- Frontend button on leaderboard/details to download CSV
		- Optional PDF via server-side render or client print stylesheet

- [ ] Session summary for teachers (consolidated recap)
	- Docs tone suggests “feedback détaillé” and projection stats, but no explicit teacher recap page was found.
	- Observed implementation: Dashboard controls exist; no separate “session summary” page detected.
	- Status: Missing/Partial
	- Acceptance criteria to consider:
		- Summary view after completion: key metrics, top performers, tough questions, participation count, duration

- [ ] Password reset UX on login (Forgot password?)
	- Expected: A visible link on the login page to initiate password reset.
	- Observed implementation:
		- Frontend pages exist for reset flow under teacher namespace:
			- Request: `app/frontend/src/app/teacher/reset-password/page.tsx`
			- Confirm: `app/frontend/src/app/teacher/reset-password/[token]/page.tsx`
		- Backend endpoints exist and are tested:
			- `POST /api/v1/auth/reset-password` and `POST /api/v1/auth/reset-password/confirm` in `app/backend/src/api/v1/auth.ts`
			- Email template/link generated in `app/backend/src/core/services/emailService.ts`
		- Gap A: Login page (`app/frontend/src/app/login/page.tsx`) has no “Mot de passe oublié ?” link to `/teacher/reset-password`.
		- Gap B: Route mismatch risk — emailService builds `${frontendUrl}/reset-password/confirm/${token}`, while frontend confirm page is `/teacher/reset-password/[token]`.
	- Status: Missing/Inconsistent
	- Acceptance criteria:
		- Add “Mot de passe oublié ?” on login linking to `/teacher/reset-password`.
		- Align reset confirm URL between email template and frontend route (either move page to `/reset-password/confirm/[token]` or update email template to link to `/teacher/reset-password/${token}`).
		- Zod-validate forms; show success/failure states; rate-limit requests.
	- Tests:
		- Frontend: render login page → click link → see reset request form; submit and expect success banner.
		- Backend: existing unit tests cover endpoints; add integration test for email link URL format if applicable.

## Phase 3 — Next Steps (scoped proposals)

- [ ] Design tournament details page (read-only analytics)
	- Uses existing shared types; no legacy mappings
	- Reuses chart components; respects globals.css
	- Zod-validated API payloads

- [ ] Add CSV export of leaderboard and per-question stats
	- Backend route + Zod schema + tests
	- Frontend button on leaderboard/details

- [ ] Optional: Teacher session summary screen
	- Link from leaderboard and `/my-tournaments`

## Evidence Log (for traceability)

- Docs excerpts
	- Projection with QR + stats: `vuepress/docs/utilisation/quiz.md` (sections: “Vue vidéoprojecteur”, “Statistiques de réponses”)
	- Tournament history + replay: `vuepress/docs/utilisation/tournoi.md` (sections: “Tableau des scores et historique”, “Mode différé”)
- Key code references
	- QR: `QrCodeWithLogo.tsx`, `TeacherProjectionClient.tsx`, lobby/leaderboard pages
	- Stats: `useProjectionQuizSocket.ts`, `TeacherDashboardClient.tsx`, `QuestionDisplay.tsx`, `StatisticsChartImpl.tsx`, backend toggle handler
	- History/Replay: `AppNav.tsx`, `my-tournaments/page.tsx`, `leaderboard/[code]/page.tsx`, `student/join/page.tsx`

## How to test quickly

1) QR + Projection
	 - Start a live quiz/tournament, open projection view; verify QR renders and updates; toggle stats from teacher dashboard.
2) Replay/Deferred
	 - Finish a tournament; visit leaderboard; confirm “Scores différés” section and replay CTA appear per availability; attempt replay via join page.
3) Archives
	 - Navigate to “Historique” → “Mes tournois”; ensure sections populate for pending/active/ended.
4) Exports (when implemented)
	 - Click “Exporter CSV” on leaderboard/details; confirm file downloads and columns are correct.

## Definition of Done for this investigation

- [x] Documented existing features vs. docs promises with code evidence
- [ ] Identified and prioritized gaps with concrete acceptance criteria
- [ ] Added lightweight test steps; wire into future tasks when implementing

---

## Phase 4 — PWA stability and SW reintroduction

Goal: Restore service worker safely without breaking navigation or API calls; ensure static assets and Workbox bundles are always accessible and not cached incorrectly.

- [x] Add no-cache headers for service worker and Workbox bundles in Next headers config
	- File: `app/frontend/next.config.ts` → headers for `/sw.js`, `/sw-v2.js`, `/workbox-:hash.js`
- [x] Trim Workbox runtimeCaching to navigations only (NetworkOnly)
	- File: `app/frontend/next.config.ts` → remove broad rules; keep navigate handler NetworkOnly
- [x] Ensure middleware excludes static/PWA assets and icons/screenshots
	- File: `app/frontend/middleware.ts` → matcher excludes `_next|api|static|favicon|manifest.json|sw.js|workbox-*.js|icon-*.png`
- [x] Ignore generated PWA artifacts in git
	- File: `app/frontend/.gitignore` → `public/sw*.js`, `public/workbox-*.js` (+ maps)
- [x] Re-enable SW auto-registration for production only
	- File: `app/frontend/next.config.ts` → `register: process.env.NODE_ENV !== 'development'`
- [x] Build frontend to generate `public/sw-v2.js` and `public/workbox-*.js`
	- Command: `npm run build` in `app/frontend` (Completed; warnings only)
- [x] Fix service worker _ref bug causing runtime errors
	- Issue: `cacheWillUpdate` function referenced undefined `_ref` variable
	- Solution: Created `scripts/fix-sw.js` to automatically remove broken NetworkFirst route
	- Status: Fixed with automated postbuild script
- [x] Fix bad-precaching-response for Next.js manifest files
	- Issue: `_buildManifest.js`, `_ssgManifest.js`, `_middlewareManifest.js` were being precached despite changing hashes
	- Solution: Added exclude patterns in `workboxOptions.exclude` and no-cache headers
	- Status: Fixed - manifest files no longer precached

Validation checklist
- [ ] In production, open devtools → Application → Service Workers: confirm `sw-v2.js` active with scope `/`
- [ ] In a private window, verify no `importScripts` 404 for `workbox-*.js`
- [ ] Navigate across pages; confirm no “no internet/Failed to fetch” and that navigations are not intercepted (NetworkOnly)
- [ ] Run guest practice flow end-to-end; confirm no 401/500 from auth endpoints and no SW-related errors
- [ ] Load icons and `screenshot-wide.png` anonymously (middleware exclusions working)

Notes
- If any regressions appear, unregister SW and hard refresh, then re-evaluate runtimeCaching rules before reintroducing caching of specific assets.

