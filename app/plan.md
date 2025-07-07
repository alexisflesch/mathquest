# 2025-07-07 - Modernize all game_question emissions to canonical Zod schema

## Phase 1: Audit and Refactor All Emissions
- [x] Audit all backend code paths emitting `game_question` (late join, emitQuestionHandler, helpers, start_game)
- [x] Identify legacy/invalid payloads (nested `question`, extra fields, etc.)
- [x] Update `/backend/src/sockets/handlers/game/emitQuestionHandler.ts` to emit canonical, flat payload (Zod-validated)
- [x] Update `/backend/src/sockets/handlers/game/helpers.ts` (`sendFirstQuestionAndStartTimer`) to emit canonical, flat payload (Zod-validated)
- [x] Update `/backend/src/sockets/handlers/game/index.ts` (`start_game` handler) to emit canonical, flat payload (Zod-validated)
- [x] Confirm `/backend/src/sockets/handlers/game/joinGame.ts` already emits canonical payload for late joiners

## Phase 2: Test and Validate
- [x] Patch `sharedGameFlow.ts` to emit only canonical, flat, Zod-validated payloads for `game_question` (no legacy fields, no nested `question`)
- [x] Test all join and question flows (late join, practice, quiz, tournament) and confirm frontend receives only canonical, Zod-compliant payloads
- [x] Add/describe test cases for all code paths
- [x] Log actions in `log.md`

## Phase 3: Documentation and Checklist
- [x] Update this checklist and mark all tasks as complete after validation

### Exit Criteria
- All `game_question` events use canonical, flat payloads matching `questionDataForStudentSchema` (student/projection) or `questionDataForTeacherSchema` (teacher/dashboard)
- No legacy/extra fields or nested objects in any emission
- All payloads are Zod-validated before emit
- All changes logged in `log.md` and checklist updated
- [x] Implement modal for "tournament code n'existe pas" with minimalistic, border-only "Fermer" button (matches teacher modals)
+ [x] Move all modal/dialog button and layout styles to dialogs.css; removed hard-coded values from join modal, using canonical classes
- [x] Implement modal for "tournament code doesn't exist" (French: "Le code que vous avez saisi n'existe pas.") with right-aligned "Fermer" button and left-aligned text
+ [x] Implement modal for "tournament code n'existe pas" with minimalistic, border-only "Fermer" button (matches teacher modals)
- [x] Implement modal for "tournament code doesn't exist" (French: "Le code que vous avez saisi n'existe pas.")
+ [x] Implement modal for "tournament code doesn't exist" (French: "Le code que vous avez saisi n'existe pas.") with right-aligned "Fermer" button and left-aligned text
- [ ] Implement modal for "tournament code doesn't exist"
+ [x] Implement modal for "tournament code doesn't exist" (French: "Le code que vous avez saisi n'existe pas.")
- [x] Update projection socket hook to use canonical QuestionDataForStudent everywhere
- [x] Remove all usage of legacy Question type for projection question payloads
- [x] Update TeacherProjectionClient to use canonical QuestionDataForStudent directly
- [x] Update QuestionCard to use canonical QuestionDataForStudent
- [x] Test projection page: confirm correct rendering, no sensitive data leaks, and no legacy fields
- [x] Repeat for live page and any other consumers (backend: timerAction, deferredTournamentFlow)
- [x] Update plan.md and log.md with all actions and findings
- [x] Clean up any remaining legacy/compatibility code or types
- [ ] Log actions in `log.md`
- [ ] Add/Update Zod validation if any data is passed to the modal
- [ ] Add test/validation steps
## Tournament Rejoin Stuck Bug

### Phase 1: Diagnose and Document
- [x] Review backend join_game handler for finished tournaments
- [x] Confirm backend does not emit GAME_ENDED or differed mode event on join if tournament is over
- [x] Confirm frontend does not handle this case and remains stuck

### Phase 2: Fix Join Logic
- [ ] Patch backend to emit canonical GAME_ENDED (or similar) event if user joins a finished tournament
- [ ] If differed mode is available, emit event/flag to client
- [ ] Patch frontend to handle GAME_ENDED and redirect or offer differed mode
- [ ] Log the change in documentation

### Phase 3: Test and Validate
- [ ] Test: Join a finished tournament, confirm redirect or differed mode prompt
- [ ] Add/describe test cases
- [ ] Update plan.md with results and mark tasks as complete

# Guest User Game Creation Fix
# 2025-07-07 - Canonical Split: Student vs. Teacher Question Payloads

## Phase 1: Planning & Schema Design
- [ ] Document rationale for splitting question payloads (security, type safety, modernization)
- [ ] Define two canonical shared types and Zod schemas in `shared/types/socketEvents.zod.ts`:
    - `QuestionDataForStudent` (no sensitive fields)
    - `QuestionDataForTeacher` (includes sensitive fields like `correctAnswers`)
- [ ] Update this plan and checklist

## Phase 2: Update Shared Types & Zod Schemas
- [ ] Implement `QuestionDataForStudent` and `QuestionDataForTeacher` in shared/types/socketEvents.zod.ts
- [ ] Remove any legacy/optional/compatibility fields from question payload types
- [ ] Ensure all event names and payloads match canonical shared types
- [ ] Log all changes in `log.md`

## Phase 3: Backend Refactor
- [ ] Update all backend emitters to use the correct canonical type:
    - Student/game flows emit `QuestionDataForStudent`
    - Teacher/projection/dashboard flows emit `QuestionDataForTeacher`
- [ ] Add/verify Zod validation for all emissions
- [ ] Ensure no sensitive fields are ever sent to students
- [ ] Log all changes in `log.md`

## Phase 4: Frontend Refactor
- [ ] Update all frontend consumers (socket hooks, pages, components) to use the correct canonical type:
    - Student flows use `QuestionDataForStudent`
    - Teacher/projection/dashboard flows use `QuestionDataForTeacher`
- [ ] Remove all legacy/compatibility type guards and interfaces
- [ ] Ensure all runtime validation uses the correct Zod schema
- [ ] Log all changes in `log.md`

## Phase 5: Test and Validate
- [ ] Test all flows (late join, practice, quiz, tournament, dashboard, projection)
- [ ] Confirm only the correct canonical payload is used and accepted everywhere
- [ ] Add/describe test cases for all code paths
- [ ] Update plan.md and log.md with results and mark tasks as complete

### Exit Criteria
- Two canonical types and Zod schemas exist: one for student, one for teacher/projection
- All backend and frontend code uses the correct type for each flow
- No sensitive fields are ever sent to students
- No legacy/optional/compatibility fields remain
- All changes and rationale are documented in plan.md and log.md

## Phase 1: Diagnose and Document

- [x] Review backend API authentication logic for /api/v1/games and related endpoints
- [x] Identify where "guest" users are being blocked
- [x] Update plan.md with a checklist and findings

## Phase 2: Fix Auth Logic

- [x] Update backend logic to allow "guest" users to create sessions/tournaments and access history
- [ ] Ensure shared types and Zod schemas reflect this change (if needed)
- [x] Log the change in documentation


## Anonymous Access Redirect Bug

### Phase 1: Diagnose and Document
- [x] Review frontend route protection logic and middleware
- [x] Identify that `middleware.ts` is in `frontend/src/` instead of project root (`frontend/`)
- [ ] Update plan.md with findings and checklist

### Phase 2: Fix Middleware Location
- [x] Move `middleware.ts` to `frontend/` root so Next.js picks it up
- [ ] Confirm that anonymous users are redirected to login with `returnTo` param on all protected pages
- [x] Log the change in documentation

### Phase 3: Test and Validate
- [ ] Test as anonymous: try to access any page except `/` or `/login` and confirm redirect
- [ ] Add/describe test cases
- [ ] Update plan.md with results and mark tasks as complete

## Phase 3: Test and Validate


# GameInstance Deletion Modernization

## Phase 1: Redis Cleanup on GameInstance Deletion

### Goal
Ensure all Redis state for a game instance is deleted when the instance is deleted.

### Checklist
- [x] Audit all Redis key patterns related to gameInstance/accessCode
- [x] Confirm all patterns in codebase (including lobby and explanation keys)
- [x] Update API endpoint to delete all Redis keys for a gameInstance
- [x] Factorize Redis cleanup logic for reuse (single util)
- [x] Update game template deletion to clean Redis for all related game instances
- [ ] Log this change in documentation
- [ ] Provide test/validation steps

### Redis Key Patterns to Delete
- mathquest:game:participants:{accessCode}
- mathquest:game:userIdToSocketId:{accessCode}
- mathquest:game:socketIdToUserId:{accessCode}
- mathquest:game:participantCount:{accessCode}
- mathquest:game:terminatedQuestions:{accessCode}
- mathquest:game:question_start:{accessCode}:*
- mathquest:explanation_sent:{accessCode}:*
- mathquest:game:answers:{accessCode}:*
- mathquest:lobby:{accessCode}

### Exit Criteria
- All Redis keys for a deleted gameInstance are removed.
- No legacy or orphaned Redis state remains after deletion.
- Change is documented and testable.
