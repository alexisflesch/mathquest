
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
- [ ] 13. Test all updated endpoints in the browser and via curl
- [ ] 14. Document all changes and update this checklist

---


## Outstanding Issues (2025-07-01)

- [x] **Logout route returns 404:**
    - Fixed: Implemented `/api/v1/auth/logout` POST route in the backend (`backend/src/api/v1/auth.ts`) to clear cookies and return a success message. Now matches frontend expectations and resolves the 404 issue.

- [x] **Frontend still missing `/v1` in some backend API calls:**
    - Fixed: All frontend calls now use `/api/v1/auth/...` (including `AuthProvider.tsx` for teacher login/register).
    - Action: All `makeApiRequest` calls and constants have been updated to use `/api/v1/auth/...` everywhere. Verified by code search and patch.

---


**Phase exit criteria:**
- All backend API calls use the correct helper and env variable.
- No frontend code uses `/api/` for backend calls.
- All endpoints work as expected in dev and production.
