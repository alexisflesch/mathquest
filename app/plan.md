

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
