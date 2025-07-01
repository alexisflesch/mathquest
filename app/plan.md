
# API Modernization Checklist: Remove Legacy `/api/` Backend Calls

## Goal
Replace all legacy or relative `/api/` backend API calls in the frontend with modern, environment-variable-based calls using the `makeApiRequest` helper and `NEXT_PUBLIC_BACKEND_API_URL`.




## Checklist

- [x] 1. Update `/api/auth/status` usage in `src/components/AuthProvider.tsx` (lines 164, 591)
- [x] 2. Update `/api/games` usage in `src/app/student/create-game/page.tsx` (lines 236, 278)
- [x] 3. Update `/api/game-templates` usage in `src/app/teacher/games/page.tsx` (line 547)
- [x] 4. Update `/api/auth/status` usage in `src/app/debug/page.tsx` (line 235)
- [x] 5. Update `/api/debug-cookies` usage in `src/app/debug-cookies/page.tsx` (line 26)
- [x] 6. Update `STATUS` constant in `src/constants/api.ts` (line 16)
- [x] 7. Audit all frontend API route handlers and direct fetches for `/api/games`, `/api/game-templates`, etc. and ensure they use canonical Next.js API route pattern (never direct backend URLs)
- [x] 8. Ensure all API route handlers use `BACKEND_API_BASE_URL` for backend calls
- [x] 9. Remove any hardcoded backend URLs in frontend code
- [x] 10. Create and run `scripts/modernize_api_routes.py` to automate and document the above changes
- [x] 11. Use the script to find all problematic API calls (not modify), and list all locations for manual review:
-    - `/components/TeacherDashboardClient.tsx` (line 450): fetch(`/api/games/access-code/${code}`) **[MODERNIZED]**
    - `/app/teacher/projection/[gameCode]/page.backup.tsx` (line 90): fetch(`/api/games/access-code/${gameCode}`) **[MODERNIZED]**
    - `/app/student/join/page.tsx` (lines 49, 60): makeApiRequest to `/api/games/${code}` and `/api/games/${code}/join` **[MODERNIZED]**
    - `/app/student/practice/[accessCode]/page.tsx` (line 91): makeApiRequest to `/api/games/${accessCode}` **[MODERNIZED]**
    - `/app/teacher/games/page.tsx` (lines 427, 470, 510, 582, 583, 638): usages of `/api/game-templates` and `/api/games` **[MODERNIZED]**
    - `/app/teacher/games/new/page.tsx` (line 393): makeApiRequest to `/api/game-templates` **[MODERNIZED]**
    - `/app/api/games/[gameId]/join/route.ts` (line 5): comment reference
    - `/app/api/quiz/[quizId]/tournament-code/route.ts` (line 28): comment reference
- [x] 12. Manually update all problematic API calls to use canonical Next.js API route pattern and `BACKEND_API_BASE_URL` in API route handlers
- [x] 13. Test all updated endpoints in the browser and via curl
- [x] 14. Document all changes and update this checklist

---

## 2025-07-01: Production Login 404 Root Cause & Fix

- [x] Investigated production login 404 error for `/api/v1/auth/universal-login`
- [x] Root cause: Frontend was calling backend endpoint that does not exist in production; should use Next.js API route `/api/auth/universal-login` as proxy
- [x] Updated `FRONTEND_AUTH_ENDPOINTS.LOGIN` to `/api/auth/universal-login` in `src/constants/api.ts`
- [ ] Confirm all login flows use this constant (no hardcoded `/api/v1/auth/universal-login` remains)
- [ ] Test login in production and verify correct behavior
- [ ] Log this change in documentation and communicate to team

---


## Outstanding Issues (2025-07-01)

- [x] **Logout route returns 404:**
    - Fixed: Implemented `/api/v1/auth/logout` POST route in the backend (`backend/src/api/v1/auth.ts`) to clear cookies and return a success message. Now matches frontend expectations and resolves the 404 issue.


- [x] **Frontend still missing `/v1` in some backend API calls:**
    - Fixed: All frontend calls now use canonical backend endpoint names (e.g., `auth/register`, `auth/upgrade`, `auth/profile`, `auth/logout`, etc.) instead of `/api/v1/auth/...` or `/api/...`.
    - Action: All `makeApiRequest` calls and constants have been updated to use canonical backend endpoint names everywhere. Verified by code search and patch.

## [2024-06-09] API Route Modernization: AuthProvider.tsx

**Root Cause:**
- Several API calls in `AuthProvider.tsx` were using legacy paths like `/api/v1/auth/register`, `/api/v1/auth/upgrade`, etc. This caused requests to be routed incorrectly (to the Next.js API layer or to non-existent endpoints), resulting in 404 or 500 errors.

**Fix:**
- Updated all API calls in `AuthProvider.tsx` to use canonical backend endpoint names (e.g., `auth/register`, `auth/upgrade`, `auth/profile`, `auth/logout`, etc.).
- Ensured all usages of `makeApiRequest` in this file now use the correct canonical path, so the backend API base URL is prepended and requests are routed to the backend server as intended.

**Validation:**
- All authentication and profile flows in the frontend should now correctly reach the backend endpoints in both development and production, provided the backend is reachable and the proxy/nginx config is correct.

**Checklist:**
- [x] All legacy `/api/v1/auth/...` and `/api/auth/...` usages removed from `AuthProvider.tsx`.
- [x] All API calls use canonical backend endpoint names.
- [x] Documented in `plan.md`.

---


**Phase exit criteria:**
- All backend API calls use the correct helper and env variable.
- No frontend code uses `/api/` for backend calls.
- All endpoints work as expected in dev and production.
