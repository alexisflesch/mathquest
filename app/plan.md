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

---

## Phase X: Logger Reliability & Debugging (CONTINUED)
**Goal:** Ensure all backend logging uses the centralized Winston logger and all real-time score/leaderboard updates are correctly propagated to all relevant rooms, including projection.

### Checklist:
- [x] Investigate why projection page scores remain at 0 despite backend score updates
- [x] Identify missing leaderboard_update emission to projection room
- [ ] Update backend to emit leaderboard_update to projection room after every score update
- [ ] Test and validate: projection page receives and displays correct scores in real time
- [ ] Update documentation and log.md with findings and changes

---

# MathQuest Backend Modernization Plan

## 🎯 Main Goal

Modernize backend logging and real-time score/leaderboard propagation, ensuring the projection page displays correct scores only when the teacher requests it (e.g., by clicking the trophy icon). Fix root causes of incorrect/zero scores, duplicate participants, and leaderboard sync issues.

---

## 📋 Global Checklist

- [ ] **Phase 1:** Audit and fix participant creation logic to prevent duplicates.
- [ ] **Phase 2:** Audit and fix scoring logic to ensure scores are written to Redis and leaderboard ZSET is updated.
- [ ] **Phase 3:** Audit and fix projection handler to fetch leaderboard from Redis, not DB.
- [ ] **Phase 4:** Emit leaderboard updates to the projection room only when the teacher requests it (trophy icon).
- [ ] **Phase 5:** Test and validate the full flow, including hard refreshes and teacher-triggered leaderboard display.
- [ ] **Phase 6:** Update documentation (`plan.md`, `log.md`) with findings, root causes, and changes.

---

## 🗂️ Phase-Based Plan

### **Phase 1: Prevent Duplicate Participants**
- [ ] Audit participant creation logic in backend (likely in `src/sockets/handlers/game/gameAnswer.ts` and related services).
- [ ] Ensure only one participant per user/game is created in Redis and DB.
- [ ] Add/adjust logging to confirm no duplicates are created.
- [ ] Mark phase complete when duplicate creation is impossible in all flows.

### **Phase 2: Ensure Correct Score Calculation and Storage**
- [ ] Audit scoring logic for correct score calculation and Redis ZSET update.
- [ ] Ensure scores are always written to Redis (and DB if needed) after each answer.
- [ ] Add/adjust logging to confirm correct score propagation.
- [ ] Mark phase complete when scores are always correct in Redis after answers.

### **Phase 3: Projection Handler Reads Leaderboard from Redis**
- [ ] Audit `projectorHandler.ts` and related code.
- [ ] Refactor to fetch leaderboard from Redis, not DB.
- [ ] Add/adjust logging to confirm correct leaderboard data is sent to projection.
- [ ] Mark phase complete when projection always gets the latest leaderboard from Redis.

### **Phase 4: Emit Leaderboard to Projection Only on Teacher Request**
- [ ] Ensure leaderboard is only emitted to the projection room when the teacher clicks the trophy icon.
- [ ] Refactor event flow so projection does not receive updates after every answer or timer event.
- [ ] Add/adjust logging for teacher-triggered leaderboard emission.
- [ ] Mark phase complete when projection leaderboard only updates on explicit teacher action.

### **Phase 5: Test and Validate End-to-End**
- [ ] Test full flow: join as teacher, students answer, teacher clicks trophy, projection updates.
- [ ] Test hard refreshes and late joiners.
- [ ] Validate logs and DB/Redis state for correctness.
- [ ] Mark phase complete when all scenarios work as expected.

### **Phase 6: Documentation and Root Cause Analysis**
- [ ] Update `plan.md` and `log.md` with:
  - Checklist progress
  - Root causes found and fixed
  - Key code changes and new/removed events
  - Testing steps and results
- [ ] Mark phase complete when documentation is fully up to date.

---

## ✅ Exit Criteria

- No duplicate participants per user/game.
- Scores always correct in Redis and on projection after teacher action.
- Projection leaderboard only updates on explicit teacher request.
- All changes and findings are documented.
- All tests pass and manual validation matches expected behavior.

---

## Phase 2: Canonical Participant List & Logging Modernization
**Goal:** Ensure all UI, API, and socket endpoints use the canonical, deduplicated participant list (`ParticipantData[]`) and that all logging is consistent and centralized.

### Checklist:
- [x] Refactor participant count logic to use unique userIds (not sockets)
- [x] Audit all participant list/count emissions (API, socket, UI)
- [x] Ensure all emissions use deduplicated canonical list (`ParticipantData[]`)
- [x] Confirm all logging uses centralized Winston logger and is consistent
- [x] Update documentation (`plan.md`, `log.md`) with findings and changes
- [ ] Test and validate: joining/leaving with multiple tabs and users, ensure participant count and list are always correct
- [ ] Provide clear test/validation steps and expected vs. actual behavior

#### Test/Validation Steps
- Open multiple tabs as the same user and as different users; verify participant count and list are correct in dashboard/projection
- Disconnect/reconnect; ensure participant is only removed when all sockets for that user disconnect
- Confirm logs show correct unique userIds and counts
- Validate that all UI and API endpoints display the correct, deduplicated participant list

---

# Scoring Logic Modernization (2024-06)

## Problem Statement
- Multiple choice questions are not being scored correctly (no score or incorrect score awarded).
- For single choice questions, time penalties are not being applied (participants always receive full points, e.g., 1000).
- Root cause suspected in `submitAnswerWithScoring` and related logic in `scoringService.ts`.
- All changes must use shared types/Zod validation and be documented per modernization guidelines.

## Phase 1: Multiple Choice Scoring Fix
- [ ] Review and correct answer validation for multiple choice in `scoringService.ts`.
- [ ] Ensure score calculation and DB update are triggered for multiple choice.
- [ ] Add/verify Zod validation and shared type usage for answer payloads.
- [ ] Document findings and changes in `plan.md`.
- [ ] Add/update tests for multiple choice scoring.

## Phase 2: Time Penalty for Single Choice
- [x] Diagnose why time penalty is not being applied for single choice questions (score always 1000).
- [ ] Fix time penalty logic so it is correctly triggered for all question types.
- [ ] Add/update tests for time penalty logic and validate fixes.
- [ ] Document all findings and changes in plan.md.

### 2024-06-22: Investigation Log
- Confirmed via logs and DB that single choice questions always award full points (1000), regardless of answer time.
- Verified Zod schema and answer payload types are correct and unified.
- Next: Review and debug time penalty logic in scoringService.ts, focusing on single choice flow.

---

## Phase 3: Scoring Logic Unification (In Progress)
**Goal:** Eliminate all duplicate scoring logic and enforce a single canonical scoring service for all flows (API, socket, tournament, etc).

### Checklist
- [x] Identify all locations where scoring is calculated (API, socket handlers, etc).
- [x] Remove `sharedScore.ts` and any other duplicate scoring modules.
- [x] Refactor all socket/game handlers to use `core/services/scoringService.ts` exclusively.
- [ ] Ensure all scoring logic uses shared types and Zod validation.
- [ ] Add/verify tests for all scoring flows (single, multiple choice, time penalty, etc).
- [ ] Document all changes and rationale in `plan.md`.

### Technical Debt Log
- 2025-06-22: Discovered duplicate scoring logic in `scoringService.ts` and `sharedScore.ts`. This violates DRY and modernization guidelines. Plan to unify all logic in a single canonical service and update all usages accordingly.
- 2025-06-22: Refactored socket handlers to use canonical scoring service. Removed duplicate code from `sharedScore.ts`.

---

## Phase: Fix Time Penalty in Practice/Game Flow

## Goal
Ensure that time penalties are correctly applied in practice/game mode by tracking question start time for each user when a question is shown.

## Tasks
- [x] Analyze old tournament/timing logic in sharedScore.ts
- [x] Confirm time penalty logic expects serverTimeSpent (ms) on answer
- [x] Identify missing TimingService.trackQuestionStart call in game/practice flow
- [x] Update requestNextQuestionHandler to call TimingService.trackQuestionStart for each user/question
- [ ] Test and validate that time penalties are now applied in practice/game mode
- [ ] Log all actions and update this plan
- [ ] Document testing steps and expected/actual results

## Notes
- Tournament mode worked because it tracked question start time; practice/game did not.
- All scoring logic is now unified in scoringService.ts, so timing must be tracked for all flows.

---

## Phase 2: Scoring Logic Unification & Time Penalty Fix
**Goal:** Ensure all quiz and tournament modes use unified, modern scoring and timing logic, with Zod validation and canonical shared types.

### Findings (as of current analysis):
- **Quiz mode** answer submission and question emission are handled in `sharedLiveHandler.ts` (via `answerHandler` and `joinHandler`).
- **Tournament and practice modes** use canonical handlers in `gameAnswer.ts` and `requestNextQuestion.ts`.
- `registerGameHandlers` in `game/index.ts` registers `gameAnswerHandler` for `GAME_ANSWER` events, but `sharedLiveHandler.ts` does not register a handler for `GAME_ANSWER` (only for `TOURNAMENT_ANSWER`).
- **Quiz mode clients are using the `TOURNAMENT_ANSWER` event**, which is handled by `sharedLiveHandler.ts`, bypassing the canonical timing and scoring logic in `scoringService.ts` and `TimingService.trackQuestionStart`.

### Plan / Next Steps:
1. **Unify answer submission and question emission for quiz mode** so both quiz and tournament modes use the canonical handlers (`gameAnswerHandler` and `requestNextQuestionHandler`).
2. **Update event registration** so quiz mode uses `GAME_ANSWER` and `GAME_QUESTION` events, not `TOURNAMENT_ANSWER`.
3. **Remove or refactor quiz-specific logic in `sharedLiveHandler.ts`** to delegate to canonical handlers.
4. **Test and validate** that time penalties and scoring work for all modes.
5. **Document all changes and findings** in `plan.md` and log actions in `log.md`.

### Checklist:
- [x] Diagnose why time penalties are not applied to quiz questions (root cause: quiz mode uses alternate handler).
- [x] Confirm time penalty logic works for tournaments.
- [x] Add/verify Zod validation for answer payloads.
- [x] Add diagnostic logging to timing and scoring services.
- [x] Document all findings and actions.
- [x] Unify code paths for quiz and tournament answer/question handling.
- [x] Update event registration for quiz mode to use canonical handlers.
- [x] Remove/modernize quiz-specific logic in `sharedLiveHandler.ts`.
- [ ] Test and validate unified logic (time penalties, scoring, etc).
- [ ] Add/verify tests for all scoring flows.

---

## Phase 3: Unified Question Emission & Leaderboard Gating (2025-06-22)

**Goal:**
- Ensure all question emission (practice, quiz, tournament, teacher control) uses the canonical `emitQuestionHandler`.
- Guarantee `TimingService.trackQuestionStart` is always called for every question.
- Leaderboard updates are only broadcast on explicit teacher action (e.g., trophy icon), never automatically after answer submission.
- Remove all legacy/duplicate question emission logic.

### Checklist:
- [ ] Refactor all question emission (including practice/progression) to use `emitQuestionHandler`.
- [ ] Ensure `TimingService.trackQuestionStart` is always called for every question emission.
- [ ] Update answer/score handlers to only emit leaderboard updates on explicit teacher action (e.g., trophy icon).
- [ ] Remove any legacy or duplicate question emission logic.
- [ ] Update `plan.md` and `log.md` with findings, actions, and test steps.
- [ ] Validate with tests and log expected vs. actual behavior.

#### Findings (2025-06-22):
- Leaderboard is broadcast immediately after answer submission, not just on teacher action.
- Time penalty logic is not triggered for quiz mode because question start time is never tracked.
- Question emission for quiz mode is not using the unified handler, so timing and scoring logic are bypassed.

#### Next:
- Refactor `requestNextQuestionHandler` to use `emitQuestionHandler` for all question emission and timing.
- Remove direct socket emission logic from `requestNextQuestionHandler`.
- Proceed to update answer/score handlers after this step.

---

## Phase 2: Canonical Global Timer Logic for Quiz Mode
**Goal:** Ensure all time penalties and scoring in quiz mode are based on a canonical, global timer state per game/question, supporting pause/resume and late joiners, while preserving per-user timing for differed tournaments.

### Checklist:
- [ ] Refactor TimingService to store a global timer object per game/question for quiz mode (start time, total play time, pause/resume state)
- [ ] Update all answer/penalty logic to use this canonical timer
- [ ] Ensure late joiners and reconnects see correct remaining time and receive correct penalty
- [ ] Preserve per-user timing logic for differed tournaments
- [ ] Update emitQuestionHandler and all emission logic to reference the global timer for quiz mode
- [ ] Update or add Zod validation for new timer state if needed
- [ ] Document new timer state and logic here and in log.md
- [ ] Test: Validate correct penalty for late joiners, pause/resume, and differed tournaments
- [ ] Mark all items as [x] when done

---

### Notes:
- The timer state must include: questionUid, status (play/pause), startedAt, totalPlayTimeMs, and a history of pause/resume if needed.
- All answer submissions must compute elapsed time using this canonical timer, not per-user emission time.
- For differed tournaments, keep the current per-user timing logic.
- Document all changes and findings in plan.md and log.md as per modernization guidelines.

---

# Phase: Canonical Timer Rewrite for All Game Modes

## Goals
- Unify timer logic for all game modes (quiz, live tournament, differed, practice).
- Eliminate all legacy/per-user timer code.
- Ensure all time penalties are based on canonical, global timers (except for differed, which uses per-session canonical timer).
- Practice mode: no timer or penalty.
- Use canonical/shared types and Zod validation throughout.
- Document and log all actions.

---

## Checklist

- [ ] 1. Update `plan.md` with this phase and checklist.
- [ ] 2. Update `CanonicalTimerService`:
  - [ ] Support global timer per question for live tournaments and quiz.
  - [ ] Support per-user session timer for differed tournaments.
  - [ ] No timer for practice mode.
- [ ] 3. Refactor all answer/score handlers and emission logic to use new timer logic for all modes.
- [ ] 4. Remove all legacy/per-user timer code.
- [ ] 5. Enforce use of canonical/shared types and Zod validation.
- [ ] 6. Update documentation and checklist in `plan.md` and log all actions in `log.md`.
- [ ] 7. Validate with tests for all modes (quiz, live tournament, differed, practice).

---
