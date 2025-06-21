# MathQuest App Security & UX Modernization

### Implementation Tasks:
- [x] **Frontend error handling**: Listen for backend authorization errors and redirect appropriately (Dashboard & Projection completed via shared hook)
- [x] **DRY Refactoring**: Created shared `useSocketAuthHandler` hook to eliminate code duplication between dashboard and projection pages
- [x] **Access code validation**: Enforce: Only QUIZ mode access codes are valid for dashboard and projection (NO tournament, NO practice)
- [x] **Projection page validation**: Apply same ownership checks as dashboard - COMPLETED via shared `validateGameAccess` helper
- [x] **Redirect logic**: Implement proper redirects to home page for unauthorized access (server-side, instant)
- [x] **Error messaging**: Add user-friendly error states for access violations (server-side, branded error page)
- [x] **Server-side access validation**: Move dashboard/projection access validation to server side (no client-side flash)
- [x] **Instant error/redirect**: Ensure unauthorized users are redirected or shown error before any client-side code or socket connection
- [x] **Update documentation**: Update checklist and log.md to reflect server-side validation
- [x] **Test and validate**: Test server-side access control and error UX
- [x] **Projection page error handling**: Top-level projection page now matches dashboard, showing branded AccessErrorPage for all error cases (not a quiz, not creator, not authenticated, etc).

---

## Phase 1A: Backend Access Helper Refactor (Options Object, Type Safety, Logging)
**Goal:** Refactor all backend access helpers to require a single options object for type safety, enforce quiz-only access, and robust logging.

### Checklist:
- [x] Refactor `validateGameAccessByCode` and related helpers in `/backend/src/utils/gameAuthorization.ts` to require a single options object (no default/optional params).
- [x] Update all usages in `/backend/src/sockets/handlers/projectionHandler.ts` and `/backend/src/sockets/handlers/teacherControl/joinDashboard.ts` to use the new signature.
- [x] Update or add Zod validation for the options object.
- [x] Update shared types in `shared/` if used for access validation payloads.
- [x] Update documentation in `plan.md` and `log.md` to reflect the refactor and checklist progress.
- [x] Test and validate: Only quiz codes work for dashboard/projection, all denied attempts are logged and handled with clear errors.

#### Troubleshooting & Root Cause Analysis
- [x] **Backend code changes not taking effect:**
    - Root cause: Stale backend process due to nodemon/ts-node not picking up file changes.
    - Solution: Full backend rebuild and restart resolved the issue. Confirmed new access control and logging logic is now active.
    - **Action:** Ensure nodemon/ts-node is configured to watch all backend source files. If changes are not picked up, stop all backend processes, run a clean build, and restart the backend.
    - **Note:** Documented in `plan.md` and `log.md` as required by modernization guidelines.

---

## Phase 1: 🔒 Dashboard & Projection Access Control
**Goal**: Ensure only GameInstance creators can access dashboard and projection views, and ONLY for QUIZ mode (not tournament, not practice), with proper redirects for invalid access codes.

### Security Requirements:
- [x] **Creator-only access**: Backend already validates ownership in socket handlers
- [x] **Quiz-only validation**: Access codes must correspond to actual quiz games (NO tournament, NO practice)
- [x] **Invalid access redirect**: Non-creators and invalid access codes redirect to home page
- [x] **Proper error handling**: Frontend must handle backend authorization errors
- [x] **Server-side access validation**: Validate dashboard/projection access on the server before rendering page (no client-side flash, no socket connection if unauthorized)

### Implementation Tasks:
- [x] **Backend quiz-only enforcement**: Update shared helper and handlers to block non-quiz modes
- [x] **Frontend error handling**: Show clear error for non-quiz access code
- [x] **Server-side validation**: Move dashboard/projection access validation to server-side (Next.js server component or getServerSideProps)
- [x] **Testing**: Validate that only quiz codes work for dashboard/projection, and that unauthorized users are redirected or shown error page instantly

### Files to Modify:
- [x] `/frontend/src/app/teacher/dashboard/[code]/page.tsx`
- [x] `/frontend/src/app/teacher/projection/[code]/page.tsx`
- [x] Backend socket handlers for dashboard/projection access
- [x] Shared types for access validation payloads

---

## Phase 1B: Server-Side Access Validation for Dashboard/Projection
**Goal:** Move access validation for dashboard/projection to the server side (Next.js server components/loaders) to prevent any client-side flash and ensure instant redirect or error display.

### Checklist:
- [x] Refactor `/frontend/src/app/teacher/dashboard/[code]/page.tsx` to perform server-side access validation.
- [x] Refactor `/frontend/src/app/teacher/projection/[gameCode]/page.tsx` for server-side access validation.
- [x] Ensure instant redirect or error display for unauthorized access (no loading flash).
- [x] Update documentation and checklist in `plan.md` and `log.md`.
- [x] Test and validate server-side access control and error UX.

---

## Phase 2: 🗂️ Tournament List Filtering (My Tournaments Page)

**2025-06-21**

### Goal**: Remove pending quiz items from the my-tournaments page listing.

### Current Issues:
- [x] **Analyze tournament listing logic**: Check what items are currently shown
- [x] **Identify quiz vs tournament distinction**: Understand how quiz and tournaments are differentiated
- [x] **Document filtering criteria**: Map out what should and shouldn't be shown

### Filtering Criteria (documented 2025-06-21):
- Only show items with `playMode: 'tournament'` in the tournament list.
- Exclude any item with `playMode: 'quiz'` or `playMode: 'practice'`.
- Status-based filtering: Only show tournaments with valid statuses (`pending`, `active`, `ended`).
- If possible, expose `playMode` in the backend API response for clarity and type safety.

### Requirements:
- [x] **Quiz exclusion**: Pending quiz instances should not appear in tournament lists
- [x] **Tournament-only display**: Only actual tournament instances should be shown
- [x] **Status-based filtering**: Consider game status in filtering logic
- [x] **Maintain functionality**: Ensure valid tournaments still appear correctly

### Implementation Tasks:
- [x] **Backend filtering**: Update API endpoints to exclude quiz instances from tournament lists
- [x] **Frontend validation**: Add client-side filtering as backup
- [x] **Type safety**: Ensure proper typing for tournament vs quiz distinction
- [x] **UI consistency**: Verify tournament list displays correctly after filtering

### Files to Modify:
- [x] `/frontend/src/app/my-tournaments/page.tsx`
- [x] Backend API endpoints for tournament listing
- [x] Database queries for tournament retrieval
- [x] Shared types for tournament/quiz distinction

---

## Phase 3: 🔐 Anonymous User Authentication Redirects
**Goal**: Redirect anonymous users to login with return URL parameter for all protected pages.

### Current Issues:
- [ ] **Audit current authentication flow**: Check which pages require authentication
- [ ] **Analyze redirect behavior**: Document current anonymous user handling
- [ ] **Identify protected routes**: Map out pages that should require authentication

### Requirements:
- [ ] **Anonymous detection**: Identify when users are not authenticated
- [ ] **Protected route enforcement**: All pages except login and home require authentication
- [ ] **Return URL preservation**: Store intended destination for post-login redirect
- [ ] **Seamless UX**: Smooth flow from login back to intended page

### Implementation Tasks:
- [ ] **Authentication middleware**: Create or enhance auth guards for protected routes
- [x] **URL parameter handling**: Implement returnTo parameter in login flow
- [x] **Post-login redirect**: Redirect users to intended destination after successful login
- [ ] **Route protection**: Apply authentication requirements to all protected pages
- [ ] **Error handling**: Handle edge cases in redirect flow

### Files to Modify:
- [ ] `/frontend/src/hooks/useAuthState.ts` or authentication logic
- [ ] `/frontend/src/app/login/page.tsx`
- [ ] Protected page components (dashboard, projection, my-tournaments, etc.)
- [ ] Route guards or middleware components
- [ ] Navigation components that might need auth awareness

---

## Phase 2: Dashboard UI Restoration & Testing
**Goal:** Restore the full teacher dashboard UI and logic, replacing the placeholder client component, and ensure all features work as expected.

### Checklist:
- [x] Locate and review backup of full dashboard logic (`page.backup.tsx`).
- [x] Restore full dashboard UI and logic into `TeacherDashboardClient.tsx` using the backup.
- [ ] Test the restored dashboard UI in the browser to ensure all features work as expected.
- [ ] Update documentation (`plan.md`, `log.md`) to record restoration and testing.
- [ ] (Optional) Refactor or further modernize dashboard code for maintainability or new requirements.

### Testing Instructions:
1. Open the teacher dashboard page in the browser with a valid quiz access code.
2. Confirm that all dashboard features (game controls, participant list, question display, etc.) are present and functional.
3. Attempt access with an invalid or non-quiz code; confirm error page or redirect is shown instantly.
4. Check for any UI/UX regressions or errors.
5. Record results and any issues in `log.md`.

---

## 🧪 Testing & Validation Plan

### Phase 1 Testing:
- [ ] **Creator access**: Verify game creators can access their dashboard/projection
- [ ] **Non-creator blocking**: Verify non-creators are redirected appropriately
- [ ] **Invalid access codes**: Test with non-existent or non-quiz access codes
- [ ] **Error messaging**: Verify clear error states for unauthorized access

### Phase 2 Testing:
- [ ] **Tournament list filtering**: Verify only tournaments appear in my-tournaments
- [ ] **Quiz exclusion**: Confirm pending quizzes are filtered out
- [ ] **Edge cases**: Test with various game statuses and types

### Phase 3 Testing:
- [ ] **Anonymous redirect**: Test anonymous access to protected pages
- [ ] **Return URL flow**: Verify login redirects to intended destination
- [ ] **Edge cases**: Test with invalid return URLs and malformed parameters

---

## 🎯 Success Criteria

### Security:
- [ ] Only game creators can access dashboard/projection views
- [ ] Invalid access codes properly redirect to home page
- [ ] No unauthorized access to game management features

### UX:
- [ ] Tournament list shows only relevant items (no pending quizzes)
- [ ] Anonymous users smoothly redirected through login flow
- [ ] Users land on intended pages after authentication

### Technical:
- [ ] All access control uses shared types and proper validation
- [ ] No hardcoded strings or magic numbers in access control logic
- [ ] Consistent error handling across all protected routes

---

## 📝 Notes
- All changes follow .instructions.md guidelines strictly
- Zero backward compatibility maintained as per requirements
- Each phase builds upon security and UX best practices
- Focus on root cause fixes rather than patches
- **Troubleshooting:** If backend code changes are not reflected, check nodemon/ts-node config and ensure all relevant files are watched. Manual restart may be required after config or new file changes.

---

## Phase 4: Centralized Route Protection & Middleware Modernization (2025-06-21)
**Goal:** Enforce all route access rules via Next.js middleware, remove legacy per-page guards, and ensure all redirects are modern and consistent.

### Access Rules:
- `/` and `/login` are public (anyone can access)
- `/teacher/*` is restricted to teachers only (non-teachers are redirected to `/`)
- All other routes are protected (must be authenticated: guest, anonymous, or teacher)
- Guests/anonymous can access non-teacher routes
- Teachers can access everything

### Checklist:
- [ ] Implement/Update `middleware.ts` to enforce all access rules:
    - [ ] Allow `/` and `/login` for everyone
    - [ ] Redirect non-teachers from `/teacher/*` to `/`
    - [ ] Redirect unauthenticated users from other protected routes to `/login?returnTo=...`
    - [ ] Allow teachers everywhere
- [x] Remove all `useAccessGuard` and per-page redirect logic from frontend pages
- [ ] Test all protected routes for correct redirect and access behavior
- [ ] Update `plan.md` and `log.md` to document all changes
- [ ] Ensure no legacy `/teacher/login` or hardcoded login redirects remain

### Files to Modify:
- [ ] `/frontend/src/middleware.ts`
- [ ] All frontend pages using `useAccessGuard`
- [ ] Documentation: `plan.md`, `log.md`

---

## Phase X: Logger Reliability & Debugging

- [x] Diagnose why Winston logs are not appearing in stdout/console during development
- [x] Refactor logger: console transport only in development (pretty/colorized), file transport always present (all levels in dev, only errors in prod)
- [x] Improve log formatting for human readability in development (colorized, pretty, no double-escaped newlines)
- [x] Ensure logger outputs to both file and console as appropriate
- [ ] Test logger in both dev and prod modes, confirm correct output
- [ ] Document root cause and solution in log.md
- [ ] Remove any temporary debug logs after verification
- [ ] Confirm logger configuration is correct and consistent in all environments

# Modernization Plan

## Phase X: Logger Reliability & Debugging

- [x] Investigate why logs are badly formatted (JSON with escaped newlines)
- [x] Investigate why logs are not appearing in stdout/console during development
- [ ] Refactor logger: in development, log to both console (pretty/colorized) and file (JSON)
- [ ] Refactor logger: in production, log only errors to file (JSON), no console output
- [ ] Test logger in development: verify pretty/colorized logs in console and JSON logs in file
- [ ] Test logger in production: verify only error logs in file, no console output
- [ ] Document root cause and solution in log.md
- [ ] Remove any temporary debug logs after verification
- [ ] Confirm logger config is correct and consistent in all environments
