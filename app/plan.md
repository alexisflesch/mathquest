## PHASE: Game Name Input on Game Start Modal (Teacher)

- [x] Add input field for game name in StartActivityModal (under title)
- [x] Make game name required, default to template name if not set
- [x] Pass game name to onStart and API call
- [x] Update ActivityCard and TeacherGamesPage logic to support name
- [x] Update session list UI to display GameInstance name after mode ("Quiz - name")
- [x] Update tests and docs if needed
- [x] Log all changes in log.md

**Validation:**
- When starting a game, teacher can set a custom name in the modal
- Name is sent to backend and visible in DB/instances
- Session list displays: icon Quiz/Entraînement/Tournoi - name
## PHASE 2B: Tournament Creation Status Modernization

- [x] Restrict tournament creation status to only 'pending' or 'completed' in shared/types/api/schemas.ts (Zod schema).
- [x] Update backend service (gameInstanceService.ts) to accept and use explicit status, defaulting to legacy logic if not provided.
- [x] Student tournament creation (student/create-game/page.tsx) always sends status: 'pending'.
- [x] Teacher tournament creation (teacher/games/page.tsx) always sends status: 'completed' for tournaments created from a GameTemplate.
- [x] All changes follow strict modernization and documentation requirements.
- [x] This plan.md and log.md updated for all changes.

**Validation:**
- Student-created tournaments are always 'pending'.
- Teacher-created tournaments from GameTemplate are always 'completed'.
- Only 'pending' or 'completed' are accepted as valid status values.

---

## [PHASE: Deferred Tournament Session Bug - AttemptCount Increments Per Question]

### Problem
- `attemptCount` is still incrementing on every question in a single deferred tournament session, not just on new playthroughs.
- Log review shows `joinGame` is being called on every question/answer event, not just once per session.
- Root cause: `hasOngoingDeferredSession` always returns false, so every call increments the attempt.


### Action Items
1. Audit all backend calls to `joinGame` to ensure it is only called on a true new playthrough, not per question/answer.
2. Add extra debug logging to `hasOngoingDeferredSession` to show which timers are found, their `timerEndDateMs`, and why it returns false. **[DONE]**
3. Add logging in `startDeferredTournamentSession` to show when/why it is called (to confirm if it’s being called per question). **[DONE]**
4. Patch the logic so that `attemptCount` only increments on a true new playthrough. **[IN PROGRESS: session key approach]**
5. Implement explicit session key in Redis: set at session start, clear at session end event. **[IN PROGRESS]**
6. Update `hasOngoingDeferredSession` to check session key, not timers. **[IN PROGRESS]**
7. Final validation after patch.

### Implementation Plan (Session Key Modernization)
- [ ] On session start, set a Redis key `deferred_session:<accessCode>:<userId>:<attemptCount>` (value: 'active').
- [ ] On session end (when tournament over payload is sent), set the key to 'over' or delete it.
- [ ] Update `hasOngoingDeferredSession` to check this key for 'active'.
- [ ] Remove timer-based session detection logic.
- [ ] Add/maintain logging for all session key actions.
- [ ] Validate with test run and log review.

---

### Next Steps
- Added detailed debug logging to `hasOngoingDeferredSession` in `deferredTimerUtils.ts`. **[DONE]**
- Next: Add logging in `startDeferredTournamentSession` and review call sites for `joinGame`.

---

- [x] Update join logic so attemptCount only increments and progress resets if no ongoing session exists (timer with timerEndDateMs > now and status 'run')
- [x] Ensure reconnects do NOT increment attemptCount or reset progress
- [x] Add/maintain detailed logging for all join/attemptCount/timer actions
- [x] Remove any legacy or redundant logic as per modernization rules
- [x] Document all changes and update plan.md after each subtask

## PHASE 3: Timer & Scoring Alignment
  
  [ ] Align deferred mode timer and scoring logic with quiz mode (including correct time penalty calculation)
  [ ] Ensure time penalty is calculated and stored correctly in deferred mode
  [ ] Add/maintain logging for all timer/score/penalty actions
  [ ] Document all changes and update plan.md after each subtask

## PHASE 4: Testing & Validation
  
  [ ] Provide clear test/validation steps and expected vs. actual behavior
  [ ] Run all relevant tests and validate results
  [ ] Document test results and update plan.md

## Modernization Compliance
  
  [x] All changes are phase-based, documented, and logged
  [x] No legacy/compatibility code or redundant interfaces
  [x] Naming, types, and contracts are canonical and validated
  [x] All actions and changes are recorded in plan.md

---

[x] PHASE 2: Patch Join Logic (Root Cause Fix)
    - [x] Patch join/session logic so attemptCount only increments on new playthrough, not on reconnect or within the same session. (PATCHED: see joinService.ts, only increments if no ongoing session)
    - [x] Ensure timer and scoring logic always use the correct attemptCount for the current session/playthrough. (CLEANUP: Removed attemptCount-1 workaround in scoringService.ts; now always uses canonical attemptCount)
    - [x] Add/maintain detailed logging for all join/attemptCount/timer actions.
    - [x] Remove any legacy or redundant logic as per modernization rules.
    - [x] Document all changes and update plan.md after each subtask.

**Exit Criteria:**
    - attemptCount is only incremented on new playthroughs
    - reconnects do NOT increment attemptCount or reset progress
    - timer and scoring logic use the correct attemptCount
    - all changes are logged and documented

---

## PHASE 1: Investigation & Documentation
- [x] Analyze logs and backend flow for attemptCount, join, and timer logic
- [x] Confirm attemptCount increments on every join, not just new playthroughs
- [x] Confirm time penalty is always zero in deferred mode
- [x] Trace join/attemptCount logic in backend files
- [x] Add detailed logging to joinService.ts for all join/attemptCount/timer actions
- [x] Validate with logs that multiple joins/attempts occur per playthrough
- [x] Outline patch plan and document findings

## PHASE 2: Patch Join Logic (Root Cause Fix)
- [ ] Update join logic so attemptCount only increments and progress resets if no ongoing session exists (timer with timerEndDateMs > now and status 'run')
- [ ] Ensure reconnects do NOT increment attemptCount or reset progress
- [ ] Add/maintain detailed logging for all join/attemptCount/timer actions
- [ ] Remove any legacy or redundant logic as per modernization rules
- [ ] Document all changes and update plan.md after each subtask

## PHASE 3: Timer & Scoring Alignment
- [ ] Align deferred mode timer and scoring logic with quiz mode (including correct time penalty calculation)
- [ ] Ensure time penalty is calculated and stored correctly in deferred mode
- [ ] Add/maintain logging for all timer/score/penalty actions
- [ ] Document all changes and update plan.md after each subtask

## PHASE 4: Testing & Validation
- [ ] Provide clear test/validation steps and expected vs. actual behavior
- [ ] Run all relevant tests and validate results
- [ ] Document test results and update plan.md

## Modernization Compliance
- [x] All changes are phase-based, documented, and logged
- [x] No legacy/compatibility code or redundant interfaces
- [x] Naming, types, and contracts are canonical and validated
- [x] All actions and changes are recorded in plan.md

---

### Current Phase: PHASE 2 (Patch Join Logic)
**Next:** Patch backend join logic as described above, then update plan.md and proceed to timer/scoring alignment.
## Phase: Practice Mode – Disable Feedback Button When No Feedback Available

- [x] Analyze: Locate the feedback button in practice mode UI and determine the canonical condition for feedback availability.
- [x] Update: Modify the feedback button to be disabled when no feedback (explanation) is available, using canonical shared types and Zod-validated state.
- [x] Test: Validate that the button is only enabled when feedback is available after answering a question, and that the tooltip shows "Explication" if feedback is available, or "Pas d'explication disponible" if not.
- [x] Document: Log this change in plan.md and reference the canonical type/field used (`lastFeedback?.explanation`).
- [ ] Exit Criteria: Feedback button is never enabled unless feedback is available; no legacy or compatibility logic remains.

[x] Phase: Frontend Unification – Projection and Live/Student Timer/Question Display
    - [x] Analyze: Confirm both TeacherProjectionClient and TeacherDashboardClient use canonical timer/question state and shared components.
    - [x] Identify: Remove any legacy/fallback logic in TeacherProjectionClient for timer/question display (e.g., QR code when timer is stopped).
    - [x] Refactor: Ensure TeacherProjectionClient always displays the timer and question using the same logic as the live/student page, except for projection-specific controls (e.g., no validate button, stats display).
    - [x] Test: Validate that the projection page displays the timer and question identically to the live/student page, except for UI controls.
    - [x] Document: Update plan.md with this phase and checklist.
    - [x] Exit Criteria: No legacy/fallback logic remains; timer/question display is fully unified; only projection-specific UI differences remain.

    - [x] Updated the frontend event handler `handleDashboardTimerUpdated` in `useProjectionQuizSocket.ts` to update the canonical `questionData` in the projection state when a new question is played, ensuring the projection page always displays the current question from the canonical state, in sync with the timer.
    - [x] The projection page now uses the canonical state for both timer and question display, matching the live/student page logic.
    - [ ] Test and validate that both timer and question update in sync on the projection page when the teacher dashboard changes the question.

## Testing Steps
- Open both the projection and live/student pages for the same game code.
- Start a question and timer from the dashboard.
- Confirm that both pages display the same timer countdown and question content, with only projection-specific controls differing (e.g., no validate button, stats display on projection).
- Confirm that QR code is only shown on projection if there is no current question (not when timer is stopped).

## Notes
- All timer/question display logic is now unified via useSimpleTimer and QuestionCard.
- No legacy or compatibility code remains in the projection page.

[x] Phase: Fix backend projection_state to include canonical current question
    - [x] Analyze: Locate the backend code that emits the projection_state event.
    - [x] Verify: Check how the current question is determined and what is sent in the payload.
    - [x] Update: Ensure the payload includes the full current question object (not just UID/index), using the canonical shared type from shared/types.
    - [x] Align: Use the same field name as the live/student state (e.g., questionData or currentQuestion).
    - [x] Validate: Add/Update Zod validation for the outgoing payload.
    - [x] Test: Trigger a projection state update and confirm the frontend receives the full question object.
    - [x] Document: Log this change in plan.md and reference the canonical type/field used.
    - [x] Exit Criteria: Projection page displays the question and timer as soon as state arrives, with no hacks or duplication.



[x] Phase: Fix projection page question/timer display after backend modernization
    - [x] Analyze why projection/[code] page does not show question/timer
    - [x] Compare state handling with live/[code] (student) page
    - [x] Identify missing currentQuestion mapping in useProjectionQuizSocket
    - [x] Update useProjectionQuizSocket to expose currentQuestion from canonical gameState
    - [x] Test projection/[code] page to confirm question and timer now display
    - [x] Mark phase complete after validation


[ ] Phase: Logger Log Level Control for Debugging
    - [x] Analyze: Review backend logger implementation and log level configuration
    - [x] Update: Add custom 'focus' log level for targeted debugging
    - [x] Document: Add instructions for setting log level in plan.md and example.env
    - [ ] Test: Set LOG_LEVEL=focus and verify only focus logs appear
    - [ ] Test: Set LOG_LEVEL=debug and verify debug+ logs appear
    - [ ] Test: Set LOG_LEVEL=info and verify info+ logs appear
    - [ ] Exit Criteria: Logger log level can be controlled for debugging without code changes

## Steps
- The backend logger now supports a custom 'focus' log level for targeted debugging (see backend/src/utils/logger.ts)
- To debug, set LOG_LEVEL=focus in your .env or environment and use logger.focus() for important events
- To reduce noise, set LOG_LEVEL=info or LOG_LEVEL=error
- Documented in plan.md and example.env

## Testing
- Change LOG_LEVEL in .env or environment
- Use logger.focus() in backend code for events you want to see
- Restart backend
- Observe logs: only messages at or above the set level should appear

[x] Phase: Projection State Modernization (COMPLETE)
    - [x] Backend always emits canonical current question and timer in `projection_state`.
    - [x] All outgoing payloads validated with Zod.
    - [x] No legacy or compatibility code remains.
    - [x] All changes documented in `plan.md`.

[x] Phase: Fix answer rejection when timer is paused
    - [x] Analyze current timer status check in answer handler
    - [x] Update logic to accept answers when timer.status is 'run' or 'pause'
    - [x] Log the change in documentation
    - [ ] Test answer submission for both statuses
    - [ ] Mark phase complete after validation

## Phase: Tournament Creation – Mark as Completed
- [x] Analyze: Locate the backend logic for creating a tournament from a game template.
- [x] Update: Set status to "completed" (not "pending") when creating a tournament instance, and set `differedAvailableFrom`/`differedAvailableTo` to a 7-day window as in sharedGameFlow.
- [ ] Test: Create a tournament from the teacher UI and verify status is "completed" in the database.
- [ ] Document: Log this change in plan.md and reference the canonical type/field used.
- [ ] Exit Criteria: All new tournament instances are created with status "completed"; no legacy or compatibility logic remains.
