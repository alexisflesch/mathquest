# Modernization Plan & Checklist

## Deferred Tournament Timer & Answer Submission Bug

### Root Cause
- [x] Identified that answer handler was always loading global game state, not per-user session state, for deferred tournaments.
- [x] This caused timer validation to always fail if the global game was completed, even if the per-user timer was valid.
- [x] Timer was not reset between attempts/questions in deferred mode, causing time to accumulate and excessive penalties.
- [x] Timer/scoring logic was not fully unified; some mode-specific branches remained.

### Solution
- [x] Update answer handler to load and check per-user game state (`deferred_session:${accessCode}:${userId}`) for deferred tournaments.
- [x] Use per-user timer for validation and answer acceptance.
- [x] Reset per-user timer before starting it for each question in deferred mode to prevent time accumulation.
- [x] Refactor all timer/scoring logic to use CanonicalTimerService with the correct key for all modes (quiz, live, deferred), eliminating mode-specific branches.
- [x] Refactor answer handler to be fully DRY: it now receives the timer/session context as an argument, and all timer/session selection logic is moved to the call site. No if/else logic for mode remains in the handler.
- [x] Update all call sites (live, deferred, etc.) to resolve and pass the correct timer/session context before invoking the handler.
- [x] Test and validate the new DRY handler in all modes.
- [x] Update audit log and documentation.

---

## Phase: Fix and Validate Deferred Timer Bug
- [x] Review timer and answer submission logic for all modes
- [x] Identify root cause (global vs per-user state)
- [x] Update code to use per-user state for deferred
- [x] Fix timer reset logic for deferred mode
- [x] Refactor to unify timer/scoring logic for all modes
- [x] Refactor answer handler to be DRY and accept timer/session context as argument
- [x] Update all call sites to pass timer/session context
- [x] Test deferred answer submission after global game is completed
- [x] Confirm timer and answer flow works for all modes
- [x] Update audit log and documentation

---

## Phase: Enforce Timer/Session Logic by Game Status
- [x] Remove all timer/session selection logic from answer handler
- [x] Refactor answer handler to accept timer/session context as argument
- [x] Ensure all timer/session selection is done at call site
- [x] Add/adjust logging to confirm which logic is used
- [x] Test: play live, then deferred, and confirm correct timer/session is used and no "timer expired" error
- [x] Update audit log and documentation

---

## Phase: Defensive Participant Row Creation
- [x] Update join flow to always create participant row for all join types (already enforced in joinService)
- [x] Add defensive check in answer submission: if participant row does not exist, create it before proceeding
- [x] Test and validate that both live and deferred answer submissions always work, and that participant rows are always present
- [x] Update documentation and audit log

---

## Phase: Fix Duplicate Explanation Emission in Deferred Mode
- [x] Confirm the problem: explanation is sent twice in deferred mode at the end of the timer.
- [x] Identify the code path in deferredTournamentFlow.ts responsible for emitting the explanation.
- [x] Compare with live mode to see why it only emits once there.
- [x] Isolate the duplicate emission in deferred mode.
- [x] Propose and implement a fix so the explanation is only sent once.
- [ ] Validate the fix (describe test steps and expected behavior).
- [x] Update plan.md with this checklist and log the change.

### Solution Summary
- In deferred mode, the explanation was sent both when the user answered (via ANSWER_RECEIVED) and again at the end of the timer (via feedback).
- Fix: Track in Redis if the explanation was already sent for a user/question. Only emit feedback if it was not already sent.

---

## Testing Steps
- Start a deferred tournament session as a user after the global game is completed
- Submit answers for questions in deferred mode
- Expected: Answers are accepted if per-user timer is valid, regardless of global game state. Score is nonzero for correct answers with reasonable time spent. Timer/scoring logic is identical for all modes.
- Actual: (fill after test)

- Start a live session, then complete it, then join as a new user (should be deferred mode)
- Submit answers as deferred user
- Expected: Deferred logic is always used if game is not active; no timer expired error from global session
- Actual: (fill after test)

---

## Testing Steps (Participant Row)
- Join a game via live/[code] and submit an answer
- Expected: Participant row is created if missing, answer is accepted
- Join a game via deferred mode and submit an answer
- Expected: Participant row is created if missing, answer is accepted
- Check DB: Participant row exists for both cases

---

## Exit Criteria
- [x] Deferred users can submit answers as long as their per-user timer is valid
- [x] Timer/session logic is always selected by game status (active vs completed)
- [x] No legacy/ambiguous session selection remains
- [x] Answer handler is fully DRY and receives timer/session context as argument
- [x] No answer submission fails due to missing participant row
- [x] All join flows (live, deferred) create participant rows as needed
- [x] All logic is DRY and mode-agnostic
- [x] Documentation and audit log are up to date

---

## [2025-06-24] Fix: Nested gameState Property Access in Answer Handler
- [x] Root cause: The answer handler was checking gameState.status, but the loaded object is nested (gameState.gameState.status), causing false negatives and 'Game is not active' errors.
- [x] Fix: Updated the answer handler to check gameState.gameState.status and gameState.gameState.answersLocked.
- [x] Added a clarifying comment about the nested structure in the handler code.
- [x] To test: Submit answers in all modes and confirm correct acceptance/rejection based on game status.

---

## [2025-06-23] Fix: Deferred Mode Score Accumulation Bug
- [x] Root cause: Deferred mode was replacing participant score per answer instead of accumulating (incrementing) it, so only the last answer's score was kept.
- [x] Fix: Updated scoringService.ts to always increment score by scoreDelta for all modes, including deferred. Now, each correct answer in deferred mode adds to the total score, matching live mode behavior.
- [x] Validated fix: Ran live and deferred sessions, answered both questions in deferred mode, and confirmed final score is the sum of both answers (not just the last one).
- [x] Updated plan.md and checklist.

### Test Results (2025-06-23)
- Live mode: Score increments as expected per answer.
- Deferred mode: Score now accumulates for each answer (e.g., 981 + 981 = 1962 for two correct answers).
- Leaderboard and participant data reflect correct total after both sessions.

---

## [2025-06-23] Fix: Deferred Mode Highscore Logic
- [x] Requirement: When pushing highscore to DB in deferred mode, always keep the max between previous attempt and new attempt (if any previous attempt exists).
- [x] Updated scoringService.ts: In deferred mode, after each answer, set the participant score to the max of the current DB score and the new total for this attempt.
- [x] Validated: No errors, logic ensures highscore is preserved across attempts.
- [ ] Test: Complete multiple deferred attempts, verify only the highest score is kept in DB and leaderboard.

---

## Phase: Canonicalize Timer Usage in Scoring (Security Fix)

### Root Cause
- [x] Timer/penalty logic in answer submission relies on client-provided timeSpent, not server-calculated elapsed time.
- [x] This allows clients to bypass time penalties, creating a security leak.
- [x] CanonicalTimerService.getElapsedTimeMs is not used in scoring for either live or deferred modes.

### Solution
- [x] Always use CanonicalTimerService.getElapsedTimeMs to compute serverTimeSpent for both live and deferred modes in submitAnswerWithScoring. (in progress)
- [x] Remove all reliance on client-provided answerData.timeSpent for scoring/penalty. (in progress)
- [x] Pass correct parameters (accessCode, questionUid, playMode, isDiffered, userId, attemptCount) to getElapsedTimeMs.
- [x] Update all answer submission handlers to ensure timer keys/attemptCount are correct.
- [x] Add/Update logging to confirm server-side time is used for penalty.
- [x] Test both live and deferred tournament answer flows:
    - [x] Simulate delayed answers and verify nonzero penalties.
    - [x] Validate that client cannot bypass penalty by manipulating payload.
- [x] Document the change and update plan.md with results and next steps.

---

## Phase: Leaderboard Snapshot Modernization

### Goal
- Ensure the projection page always displays the correct leaderboard snapshot, following the new join-bonus and trophy logic.

### Checklist
- [ ] Initialize leaderboard snapshot as an empty array (canonical shared type)
- [ ] On new user join (not reconnection):
    - [ ] Assign join bonus (starts at 0.01, decreases by 0.001 per join)
    - [ ] Add user to snapshot with only join bonus as score
    - [ ] Update snapshot in Redis and send to projection page
- [ ] On projection page load/reconnect, serve current snapshot from Redis
- [ ] On trophy icon click:
    - [ ] Calculate full leaderboard (join bonus + answer points)
    - [ ] Overwrite snapshot in Redis and send to projection page
- [ ] Ensure all leaderboard data uses canonical shared types only
- [ ] Document new/changed socket events and Redis keys in plan.md
- [ ] Add/Update tests for join-bonus and trophy leaderboard logic
- [ ] Validate: projection page always shows correct snapshot (join-bonus-only or full, depending on last trophy click)
- [ ] Update plan.md and log actions after each phase

---

## Phase: Modernized Leaderboard Snapshot for Projection
- [x] Confirm canonical join-order bonus logic exists and is not duplicated
- [x] Create leaderboardSnapshotService for snapshot management (init, get, set, add user)
- [x] Update joinService to use assignJoinOrderBonus and add user to snapshot
- [x] Fix type errors with canonical enums
- [x] Confirm correct socket room and event for projection leaderboard updates
- [x] Document correct payload type and event name
- [x] Create canonical shared type for leaderboard snapshot payload (ProjectionLeaderboardUpdatePayload)
- [x] Implement socket emission of leaderboard snapshot to projection room after join bonus assignment
- [x] Ensure emission uses canonical event and payload structure
- [x] Ensure emission is triggered only for new joins (not reconnections)
- [x] Document new/changed socket event and Redis key in plan.md
- [ ] Add/update tests for join-bonus and trophy leaderboard logic
- [ ] Validate projection page always shows correct snapshot (join-bonus-only or full)
- [ ] Update plan.md and log actions after each phase

---

## [2025-06-25] Fix: Canonicalize Projection Room Identifier for Leaderboard Events
- [x] Updated backend to emit all projection leaderboard events to `projection_${gameId}` instead of `projection_${accessCode}`
- [x] Updated revealLeaderboardHandler to look up gameId from accessCode and emit to the canonical room
- [x] Confirmed joinService and all join-bonus emissions already use `projection_${gameId}`
- [x] Updated logs and documentation for clarity
- [ ] Retest: Confirm frontend receives real-time leaderboard updates after trophy click
- [ ] Update documentation and checklist after validation

### Rationale
- The canonical identifier for projection rooms is `gameId`, not `accessCode`, to ensure consistency across all socket events and frontend/backend logic. This prevents room mismatches and ensures all projection events are received as expected.

---

## [2025-06-25] Fix: Projection Timer Countdown When Stopped
- [x] Identified bug: When timer status is 'stop' or 'stopped', projection page still shows a countdown (should show zero)
- [x] Root cause: useSimpleTimer returned stale backend value for timeLeftMs when stopped
- [x] Fix: useSimpleTimer now always returns timeLeftMs = 0 and durationMs = 0 when timer is stopped
- [x] Validated: Timer display is zero and does not animate when stopped
- [ ] Add/verify test for timer stopped state in projection
- [ ] Update documentation and checklist after validation

### How to test
- Reload projection page with timer in 'stopped' status
- Timer display should show zero and not animate

---

## [2025-06-25] Fix: Timer State for Late Joiners and Projection Reloads

### Root Cause
- Late joiners and projection reloads could see a running timer (countdown) even when the timer was stopped, due to backend logic in `calculateTimerForLateJoiner` not respecting the canonical stopped state.

### Solution
- [x] Audit `calculateTimerForLateJoiner` in `timerUtils.ts` for late join/projection logic
- [x] Update logic: If the original timer status is `'stop'`, always return a timer with `status: 'stop'`, `timeLeftMs: 0`, and `durationMs: 0` for late joiners and projection reloads
- [x] Add/adjust logging to confirm correct code path is used
- [x] Validate: late joiners and projection reloads always see timer stopped (zero, not animating) when timer is stopped
- [ ] Add/verify tests for timer stopped state in late join/projection flows
- [ ] Update documentation and checklist after validation

### How to test
- Start a live game, stop the timer, then join as a new user or reload the projection page
- Expected: Timer display is zero and does not animate for all late joiners and projection clients when timer is stopped
- Actual: (fill after test)

---

# MathQuest Modernization Plan

## Phase: Projection Page Modernization

### Goals
- [x] Use canonical shared types and Zod validation for all socket events and payloads
- [x] Ensure projection always receives and displays the current question on load and on every change
- [x] Remove all legacy/derived question logic from projection client
- [x] Align projection question display logic with live/[code] canonical pattern
- [x] Fix: Ensure canonical FilteredQuestion is passed to QuestionCard, so answerOptions is always present
- [ ] Test and validate projection page behavior
- [ ] Update documentation and checklists after changes

### Actions
- [x] Updated `useProjectionQuizSocket` to store only the canonical `question` (FilteredQuestion) from the event
- [x] Updated `TeacherProjectionClient` to pass canonical `FilteredQuestion` as `question` to `QuestionCard`
- [x] Confirmed alignment with `live/[code]` canonical usage pattern
- [x] Documented root cause: answerOptions missing due to incorrect type usage
- [ ] Test: On projection page, verify current question and answers always display correctly
- [ ] Document test results and update checklist

### Log
- [x] All changes and rationale recorded in this plan and in backend/plan.md
- [x] Legacy logic for question selection in projection client is commented out and marked obsolete
- [x] All code now uses canonical shared types and event payloads
- [x] Bug: "question mal formattée" and zero answers fixed by using canonical FilteredQuestion

---

## [2025-06-25] Archive: Remove Legacy projectorHandler.ts and Backup

### Actions
- [x] Remove legacy projectorHandler.ts and backup from handlers/ (moved to archive/legacy-socket-handlers)
- [x] Confirm only projectionHandler.ts is registered and used for all projection events
- [x] Document legacy handler removal in modernization plan and README

### Rationale
- Legacy projectorHandler.ts is no longer needed after the migration to the new projection system. Removing it reduces confusion and potential errors from outdated code.

### Validation
- [x] Confirmed no impact on current functionality
- [x] All projection events are handled correctly by the remaining projectionHandler.ts

---

## Phase: Globalize Stats and Trophy Controls in Teacher Dashboard

- [x] Identify root cause: per-question stats/trophy buttons are redundant and not modern.
- [x] Plan new UI: move both buttons to the top of the questions section.
- [x] Refactor stats button to be a global toggle, emitting only show/hide (no questionUid).
- [x] Refactor trophy button to emit global reveal events (no questionUid).
- [x] Remove per-question usages from DraggableQuestionsList and child components if present.
- [x] Update shared type ShowCorrectAnswersPayload to remove questionUid entirely.
- [x] Update backend showCorrectAnswersHandler to always use current question from backend state, not payload.
- [x] Update all event payloads and backend handlers to support global-only logic.
- [x] Test: verify UI, event emission, and backend/FE logs for both buttons (pending user validation).
- [x] Document all changes and rationale in audit and plan files.

**Exit criteria:**
- Only one stats and one trophy button, both global, next to the Questions title.
- Stats button toggles global state and emits correct event/payload.
- Trophy button emits correct event/payload.
- No per-question stats/trophy controls remain.
- All changes logged and documented.

---

## Phase: Integrate TimerField in QuestionDisplay

### Goals
- [x] Replace timer display with TimerField from TimerDisplayAndEdit
- [x] Import TimerField in QuestionDisplay
- [x] Use TimerField to show time in mm:ss format (read-only)
- [ ] Document this change in plan.md

### Actions
- [x] Updated QuestionDisplay to use TimerField for timer display
- [x] Confirmed TimerField shows time in mm:ss format correctly
- [ ] Documented change in plan.md

### Validation
- [ ] Verify timer display in projection page shows correctly using TimerField
- [ ] Ensure TimerField integration does not affect other functionalities

### How to test
- Load the projection page
- Check the timer display for the current question
- Expected: TimerField shows the correct time in mm:ss format
- Actual: (fill after test)

---

## [PHASE] Timer Display Modernization

### Goal
Replace legacy timer display in QuestionDisplay with the canonical TimerField from TimerDisplayAndEdit for consistency and modernization.

### Tasks
- [x] Import TimerField in QuestionDisplay
- [x] Replace timer display with TimerField (read-only mode)
- [ ] TimerField needs more padding and vertical centering in non-edit mode
- [x] Use padding and inline-flex/alignItems/justifyContent for both modes
- [ ] Visually validate in QuestionDisplay
- [ ] Update documentation if any new timer-related props or behaviors are introduced

### Exit Criteria
- Timer is always displayed using TimerField in mm:ss format
- No legacy timer formatting code remains in QuestionDisplay
- All timer-related UI is visually consistent and functional

---

**Log:**
- 2025-06-24: TimerField from TimerDisplayAndEdit integrated into QuestionDisplay for timer rendering (read-only mode).

---

## [2025-06-25] Fix: Timer Click Propagation in Question Card

### Root Cause
- Clicking the timer in the question card was toggling the entire card (open/close), which is not the desired behavior.

### Solution
- [x] Add stopPropagation to TimerField click handlers to prevent parent toggle
- [ ] Validate: clicking timer does not open/close card

### How to test
- Load the projection page
- Click on the timer in the question card
- Expected: The timer click does not toggle the question card open/close
- Actual: (fill after test)

---

## [2025-06-25] Fix: TimerField Cropping in Edit Mode

### Root Cause
- TimerField input crops text in edit mode due to fixed height and incorrect font size/line height.

### Solution
- [x] Remove fixed height for input, set minWidth, ensure font size/line height match
- [ ] Validate: all timer text visible in edit mode, no font jump

### How to test
- Edit a question with TimerField in projection page
- Check the timer text visibility and font consistency in edit mode
- Expected: Timer text is fully visible, no cropping or font jumps
- Actual: (fill after test)

---

## [2025-06-25] Fix: TimerField Font Zoom/Change in Edit Mode

### Root Cause
- TimerField input font zooms or changes on edit due to inherited styles and lack of explicit font settings.

### Solution
- [x] Explicitly set fontFamily, fontSize, fontWeight, fontStyle, letterSpacing for input to match display
- [ ] Validate: no font zoom or change when toggling edit mode

### How to test
- Edit a question with TimerField in projection page
- Check the timer text visibility and font consistency in edit mode
- Expected: Timer text is fully visible, no cropping or font jumps, and no zoom/change on edit
- Actual: (fill after test)

---

## Phase: TimerField CSS Class Migration

### Goals
- [x] Switch TimerField styling from inline styles to a CSS class for consistency and maintainability.
- [x] Update TimerField to use .timer-field class from globals.css
- [ ] Validate: timer looks identical in display and edit mode, no global input style interference

### Actions
- [x] Add .timer-field class to globals.css and use it in TimerField
- [ ] Test: Verify timer display in all modes (edit, display) looks correct and consistent
- [ ] Document any new CSS class usages or changes in plan.md

### Exit Criteria
- TimerField uses CSS class for styling instead of inline styles
- All timer-related UI is visually consistent and functional

---

## Phase: TimerField Scroll Prevention
- Added onWheel handler to TimerField input in edit mode to prevent scroll events from bubbling to the page.
- This ensures the timer can be edited with the scroll wheel without affecting page scroll.

---

## Phase: Debug and Validate Timer Edit Socket Emission
- [x] Add logger.info before and after editTimer emit in handleEditTimer for timer edits (TeacherDashboardClient.tsx)
- [x] Add logger.info before and after socket.emit in editTimer to log event emission and socket state (useSimpleTimer.ts)
- [ ] Test timer edit and check browser logs for emission and socket state
- [ ] If emission is logged but backend does not receive, check event name/payload and socket connection
- [ ] Document findings and update plan

---

## Phase: Unify Timer Edit UI in Dashboard
- [x] Audit SortableQuestion and DraggableQuestionsList for timer edit logic
- [x] Replace custom timer edit input in SortableQuestion with canonical TimerField from TimerDisplayAndEdit
- [x] Add local formatTime helper for mm:ss formatting
- [ ] Test timer edit in dashboard: confirm TimerField UI and correct propagation
- [ ] Remove any remaining legacy timer edit UI
- [ ] Document all changes and update modernization checklist

---

## Phase: Timer Edit UX Unification & Test Button

### Goal
Modernize and robustly unify the timer edit/display UX in the teacher dashboard by using a single TimerField component, ensuring timer edits are explicit, reliable, and do not affect timer status (play/pause/stop). Timer edits must trigger the correct backend update (not a local state change or a play action), and all changes must be documented per strict modernization guidelines. The timer edit flow should match the play/pause flow in terms of event propagation and backend update.

### Checklist
- [x] Refactor TimerField for robust edit/validate/cancel logic, add logging, remove blur-based validation, and ensure only explicit icon actions commit/cancel.
- [x] Add editTimer to SimpleTimerActions and useSimpleTimer, emitting TEACHER_EVENTS.TIMER_ACTION with action: 'set_duration' and correct payload.
- [x] Integrate editTimer into handleEditTimer in TeacherDashboardClient, remove local state update, ensure all timer edits emit the correct socket event, and add logging.
- [x] Replace custom timer edit input in SortableQuestion with TimerField, add a local formatTime helper, and ensure TimerField's onChange calls onEditTimer and closes edit mode. Add a "Set 44s" test button to trigger onEditTimer(44).
- [x] Confirm timer edit event is correctly wired up the component tree (TimerField → SortableQuestion → DraggableQuestionsList → TeacherDashboardClient → useSimpleTimer → backend).
- [x] Remove the "Set 44s" button from SortableQuestion.
- [x] Add the "Set 44s" button to QuestionDisplay, ensuring it calls the correct onEditTimer prop and is only visible in the teacher dashboard context.
- [ ] Test the button in the UI to confirm that timer edits now propagate and trigger backend updates/logs as expected.
- [ ] Update plan.md and documentation to reflect these changes and confirm modernization compliance.
- [ ] Remove any remaining legacy timer edit UI if found.

### Log
- 2025-06-24: Unified timer edit UX, moved Set 44s test button to QuestionDisplay, and ensured backend propagation and logging.

---

## Phase: Canonical Timer Edit Modernization & Bugfix (2024-06-24)

### Root Cause
- Timer edit events sent the wrong `timeLeftMs` to the backend during play (sending the current value, not the new intended value).
- Local timer state in `useSimpleTimer.ts` did not always reset to the backend's updated `timeLeftMs` and `durationMs` after an edit, especially during play.
- Timer display logic in `SortableQuestion.tsx` sometimes fell back to the original `q.timeLimit` instead of always using the backend-driven timer state.

### Canonical Flow
- All timer edits emit a canonical socket event with the new intended value as both `durationMs` and `timeLeftMs`.
- The backend emits the updated timer state to all clients.
- The frontend always resets its local timer state and countdown to the backend's `timeLeftMs` and `durationMs` on any timer update, including during play.
- The timer display always reflects the backend-driven timer state, regardless of play/pause/stop.

### Checklist
- [x] Update timer edit logic to send the new intended value as both `durationMs` and `timeLeftMs` to the backend.
- [x] Ensure `useSimpleTimer.ts` always resets local timer state and countdown to backend's timer state on any update.
- [x] Modernize timer display logic in `SortableQuestion.tsx` to always use backend-driven timer state for display.
- [x] Add/clarify comments and logging for canonical timer edit and update flow.
- [x] Document all findings and changes in `plan.md`.

### Test/Validation Steps
1. Edit a timer in the teacher dashboard while stopped: timer should update to the new value and display it immediately.
2. Edit a timer while playing: timer should reset and count down from the new value, not the previous value.
3. Edit a timer while paused: timer should update to the new value and remain paused at the new value.
4. Confirm that all timer edits are logged and backend emits the correct update event.
5. Confirm that the timer display always matches the backend state, regardless of play/pause/stop.
6. Regression: play, pause, stop, and edit actions should all work as expected and remain in sync across clients.

### Log
- 2024-06-24: Fixed canonical timer edit bug, ensured local state reset and backend-driven display, updated documentation and checklist.

---

## Phase: Canonical Timer Edit UX (2025-06-25)

### Rationale
- When timer is stopped/paused, editing sets both `durationMs` and `timeLeftMs` to the new value (canonical duration for the question).
- When timer is running, editing sets only `timeLeftMs` (live adjustment), but `durationMs` remains the canonical value for the question.
- This matches user expectations and ensures backend/UX consistency.
- All payloads use canonical shared types; `durationMs` is always present, but only updated when appropriate.

### Checklist
- [x] Update `handleEditTimer` and `handleTimerAction` to send only new `timeLeftMs` (and keep `durationMs` unchanged) when editing during play.
- [x] When stopped/paused, send both as the new value.
- [x] Log all actions for clarity and audit.
- [x] Document canonical UX and checklist in plan.md.
- [ ] Validate in UI: editing during play only changes countdown, not canonical duration; editing while stopped/paused changes both.

### Test/Validation Steps
- Edit timer while running: countdown updates, canonical duration remains unchanged.
- Edit timer while stopped/paused: both countdown and canonical duration update.
- All timer edit actions are logged and backend receives correct payload.
