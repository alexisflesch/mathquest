# Live page auth redirect hardening (client-side)

Date: 2025-10-23
Scope: Frontend (App Router) – live/[code] page and global guard in ClientLayout

Summary
- Problem: After deployments or when cookies expire, middleware may still allow /live/[code] due to presence-only cookie check. Client auth then resolves to anonymous and the page previously rendered nothing, causing users to see an infinite "Chargement..." or blank screen.
- Change: live/[code] now performs a client-side logout and then redirects to `/login?returnTo=/live/{code}` when auth finishes and the user is anonymous or has an incomplete profile (missing username/avatar).

Details
- Files:
  - `app/frontend/src/app/live/[code]/page.tsx`
  - `app/frontend/src/app/ClientLayout.tsx` (global guard)
- Behavior:
  - On mount and whenever auth resolves (isLoading=false), if `userState === 'anonymous'` OR `!userProfile.username` OR `!userProfile.avatar`, we first call `logout()` to clear any stale cookies, then call `router.replace('/login?returnTo=...')`.
  - The same rule now applies globally for protected routes via `ClientLayout`’s `AppContent`. Public routes allowed: `/`, `/login`, `/verify-email*`, `/reset-password*`, `/student/join`.
  - We keep the existing null render in that branch to avoid flicker; the redirect happens immediately.
- Rationale: Middleware purposely defers token validity. This client-side guard ensures users are gracefully redirected even if a stale/invalid cookie slipped past the edge check.

Tests
- Added: `app/frontend/tests/unit/live-page-anonymous-redirect.test.tsx`
  - Verifies that anonymous users on `live/[code]` trigger a logout and then a redirect to login with a properly URL-encoded `returnTo`.
- Added: `app/frontend/tests/unit/global-auth-redirect.test.tsx`
  - Verifies global guard logs out and redirects on protected routes (e.g., `/profile`) and does not redirect on public routes (e.g., `/login`).
- Existing comprehensive suite for live page confirmed green.

Quality gates
- Type-check: PASS (frontend)
- Unit tests: PASS (focused suites)

Notes
- No shared types or schemas changed.
- No socket event contracts changed.
- Consider a future UX improvement to surface a small ephemeral notice ("Session expirée, redirection vers la connexion…") before redirect. Currently omitted to keep flow simple and fast.
