# Blocked E2E Test: background-resume-dedupe.spec.ts

## Issue Summary
The test `tests/e2e/background-resume-dedupe.spec.ts` is currently blocked due to architectural incompatibilities between the test design and the application's authentication/page rendering system.

## Root Causes

### 1. AuthProvider Hydration Timing
- **Problem**: The `LiveGamePage` returns `null` if `userState === 'anonymous'` OR missing `userProfile.username/avatar`
- **Issue**: After API login (which sets `authToken` cookie), the AuthProvider needs time to:
  1. Call `/api/auth/status` 
  2. Parse the JWT
  3. Update `userState` from `'anonymous'` to `'student'`
  4. Populate `userProfile` with username/avatar
- **Impact**: Even with `?e2e=1` bypass, the page returns `null` during hydration, causing redirect to homepage

### 2. Middleware vs Client-Side Auth
- **Problem**: Middleware sees guest users as `'anonymous'` because it can't access localStorage
- **Issue**: Guest authentication stores username/avatar in localStorage only (no cookie)
- **Impact**: Middleware redirects `/live/*` pages to `/login` for guests
- **Workaround Attempted**: Use student accounts with JWT tokens instead of guests
- **New Issue**: JWT cookies are set but AuthProvider hydration is still too slow

### 3. Cross-Context Auth Persistence  
- **Problem**: Teacher authentication doesn't persist across page navigations
- **Issue**: `extraHTTPHeaders` only apply to fetch requests, not browser navigation
- **Impact**: Teacher gets logged out when navigating to dashboard

## Attempted Solutions

1. ✗ Guest UI login → Blocked by middleware (no cookie for guests)
2. ✗ Student API login + `?e2e=1` → AuthProvider hydration too slow
3. ✗ Extended wait times (3s, 5s) → Still shows homepage after navigation
4. ✗ e2e cookie for middleware bypass → Doesn't help with AuthProvider timing

## Working Test Pattern (teacher-controls.spec.ts)

The `teacher-controls.spec.ts` test works because:
- Uses **full account registration + UI login** (not just API)
- Possibly has longer implicit waits in their flow
- May have different page timing characteristics

## Recommended Path Forward

### Option A: Architectural Changes (Preferred)
1. Add E2E-specific bypass in `LiveGamePage.tsx`:
   ```typescript
   if (searchParams.get('e2e') === '1' && typeof window !== 'undefined') {
     // Skip auth checks in E2E mode
     // Render page regardless of userState
   }
   ```

2. Update `AuthProvider` to recognize e2e mode and skip/accelerate hydration

### Option B: Test Redesign
1. Use **server-side** test helpers to set up auth state
2. OR use **Playwright's `addInitScript`** to inject auth state before page load
3. OR test the dedupe logic at a lower level (integration tests instead of E2E)

### Option C: Copy Working Pattern
1. Study `teacher-controls.spec.ts` line-by-line
2. Extract their EXACT auth flow (including all waits/checks)
3. Replicate in this test

## Current Test Status
- **Student auth**: Partially working (cookie set, but page doesn't render)
- **Teacher auth**: Lost during navigation to dashboard
- **Test progression**: Reaches teacher dashboard attempt, fails to find play button (because not actually on dashboard)

## Files Involved
- `app/tests/e2e/background-resume-dedupe.spec.ts` - The blocked test
- `app/frontend/src/app/live/[code]/page.tsx` - Lines 654-657, 624-652 (early return + redirect logic)
- `app/frontend/src/components/AuthProvider.tsx` - Auth hydration logic
- `app/frontend/src/middleware.ts` - Server-side auth checks

