- [x] Implement modal for "tournament code n'existe pas" with minimalistic, border-only "Fermer" button (matches teacher modals)
+ [x] Move all modal/dialog button and layout styles to dialogs.css; removed hard-coded values from join modal, using canonical classes
- [x] Implement modal for "tournament code doesn't exist" (French: "Le code que vous avez saisi n'existe pas.") with right-aligned "Fermer" button and left-aligned text
+ [x] Implement modal for "tournament code n'existe pas" with minimalistic, border-only "Fermer" button (matches teacher modals)
- [x] Implement modal for "tournament code doesn't exist" (French: "Le code que vous avez saisi n'existe pas.")
+ [x] Implement modal for "tournament code doesn't exist" (French: "Le code que vous avez saisi n'existe pas.") with right-aligned "Fermer" button and left-aligned text
- [ ] Implement modal for "tournament code doesn't exist"
+ [x] Implement modal for "tournament code doesn't exist" (French: "Le code que vous avez saisi n'existe pas.")
# Modal Integration for Student Join Page

### Phase 1: Planning & Checklist
- [x] Review requirements and modal component
- [x] Identify where `/student/join` logic lives (frontend page/component)
- [ ] Implement modal for "tournament code doesn't exist"
- [ ] Implement modal for "tournament in differed mode"
- [ ] Ensure all text, button labels, and event names are canonical/shared
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
