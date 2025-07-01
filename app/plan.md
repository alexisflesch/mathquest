
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
- [ ] 7. Test all updated endpoints in the browser and via curl
- [ ] 8. Document all changes and update this checklist


**Phase exit criteria:**
- All backend API calls use the correct helper and env variable.
- No frontend code uses `/api/` for backend calls.
- All endpoints work as expected in dev and production.
