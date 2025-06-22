# Phase: Timer Logic Unification for All Game Modes

## Goal
Unify timer reset/start logic for quiz, live tournament, and differed tournament modes so that:
- Timer is always reset at the start of each attempt/question for the relevant scope (global or per-user).
- Time penalty is always calculated for the current attempt only.
- No code duplication or legacy logic remains.

## Checklist

- [x] Analyze current timer reset/start logic in emitQuestionHandler and related services
- [x] Refactor to ensure timer is always reset at the start of each attempt/question for all modes
- [x] Remove any conditional logic that prevents timer reset in differed mode (done by unifying logic)
- [ ] Add/verify tests for all modes (quiz, live, differed)
- [x] Document the change and rationale in this plan
- [x] Log the change in the codebase as required
- [x] Investigate persistent time penalty bug for deferred/tournament games (e.g., game 3195, 3196)
- [x] Review backend code for edge cases or missed logic in timer/penalty application
- [ ] Validate with additional test cases or logs if required
- [x] Enhance diagnostics and test coverage for timer creation/reset in deferred mode
- [ ] Investigate race conditions or event ordering between timer creation and answer submission in deferred mode
- [ ] Audit and test attemptCount logic for deferred participants (timer creation, answer submission, scoring)
- [ ] Add/verify logs to compare attemptCount used for timer creation vs. answer submission for the same user/question
- [ ] Investigate missing timer creation/lookup logs for Claudia in game 3196 (userId: 4658e2e2-968f-4018-9aa1-cb641aef467e)
    - [x] Confirm timer creation and lookup are always triggered for deferred participants on join and answer submission (Claudia: timer logic missing)
    - [x] Add/verify catch-all logging in timer creation/lookup code paths for deferred mode
    - [x] Reproduce and validate the issue with Claudia/game 3196
    - [x] Document findings and update checklist
- [ ] Investigate missing timer creation/lookup logs for Marie in game 3196 (userId: <insert Marie's userId>)
    - [x] Review all join, answer, and scoring logs for Marie in game 3196
    - [x] Confirm timer creation/lookup/penalty logs are missing for Marie in 3196 (matches Claudia's issue)
    - [ ] Compare log sequence and attemptCount handling for Marie and Claudia in game 3196
        - [x] Extract and review join, answer, and scoring events for both users
        - [x] Confirm absence of timer creation/lookup/penalty logs for both users
        - [x] Check for differences in attemptCount or event ordering
        - [x] Document findings and update checklist
    - [ ] Refactor join handler to invoke per-user deferred session logic (`startDeferredTournamentSession` or `runDeferredQuestionSequence`) for deferred tournaments
        - [ ] Replace call to `runGameFlow` with correct per-user deferred session logic in deferred mode
        - [ ] Validate with tests and logs that timer logic is triggered for all deferred participants
        - [ ] Document the change and rationale in this plan
- [x] Verify logging immediately before timer creation in all relevant code paths (especially deferred/tournament mode)
    - [x] Review code to confirm presence of pre-timer-creation logs with full context (userId, accessCode, questionUid, attemptCount, etc.)
    - [ ] If missing or insufficient, add catch-all log statement just before timer creation call
    - [x] Document findings and update checklist
- [ ] Refactor for DRY question/timer/scoring logic across live and deferred tournaments
    - [ ] Extract shared logic into a single service or utility if not already
    - [ ] Refactor join handler for deferred tournaments to call `startDeferredTournamentSession` (from `deferredTournamentFlow.ts`) instead of `runGameFlow`
    - [ ] Ensure both orchestrators use the same shared logic for question emission, timer creation, and scoring (differ only in emission context and timer keying)
    - [ ] Add/verify tests for both modes to ensure timer and question logic is robust and DRY
    - [ ] Document the change and rationale in this plan

## Exit Criteria
- Timer logic is DRY and robust for all modes
- No time accumulation bug in differed mode
- All tests pass
- Documentation and logs are up to date

## Findings (as of 2025-06-22)
- Log analysis for games 3195 and 3196 shows the time penalty bug is still present for deferred/tournament games.
- Canonical elapsed time and penalty logic appear correct in logs for some games, but the bug persists in others (e.g., 3195, 3196).
- Timer state is sometimes null for deferred logic, but time penalties may still be applied incorrectly in certain scenarios.
- [2025-06-22] Defensive check added: if timer is missing/null for deferred mode, serverTimeSpent is forced to 0 to prevent incorrect penalty. All actions logged for diagnostics.
- [2025-06-22] Issue persists for game 3196, indicating a deeper or intermittent bug in timer creation/reset for deferred mode.
- No legacy or bypass logic found for tournament creator or first-time users; all users are handled identically in participant/session and timer logic.
- Timers and answers are always namespaced by user and attempt, and timer creation is logged and checked for reuse.
- Possible root cause: race condition or event ordering issue where the timer is not set in Redis before the answer is submitted (especially for very fast answers).
- Client or test automation may submit answers before timer is set, causing timer to be missing/null and triggering defensive logic.
- [2025-06-22] Log review for user Marie in game 3196: [TODO: Summarize whether timer creation/lookup and answer submission logs are present and consistent. Note any differences with Claudia.]
- [2025-06-22] For user Marie in game 3196, join, answer, and scoring events are present, but timer creation/lookup/penalty logs are missing, matching the issue seen with Claudia. This confirms the timer logic is not triggered for some deferred participants, not just a logging omission. Further investigation needed to compare log sequence and attemptCount handling for both users.
- [2025-06-22] Log sequence for Marie and Claudia in game 3196:
    - Both users have join, answer, and scoring events present in the logs.
    - For both, timer creation/lookup/penalty logs are missing for all questions/attempts.
    - No evidence of attemptCount mismatch or event ordering difference between the two users; both follow the same sequence.
    - This strongly suggests a systemic bug where timer logic is not triggered for some deferred participants, not a user-specific or attemptCount issue.
- [2025-06-22] Next diagnostic step: Confirm that logging exists immediately before every timer creation attempt in all relevant code paths (especially deferred/tournament mode). If missing, add a catch-all log with full context just before timer creation. This will help determine if the timer creation logic is being skipped or not reached for affected users.
- [2025-06-22] Logging is present immediately before timer creation in emitQuestionHandler.ts for both live and deferred tournament modes, with all relevant context. If this log is missing for affected users, the code path is not being reached at all for those users. Next step: investigate why emitQuestionHandler is not called for some deferred participants.
- [2025-06-22] Root cause identified: For deferred tournaments, the join handler currently invokes `runGameFlow` (shared for quiz/live), which emits questions to all sockets in a room and is not designed for per-user deferred sessions. The correct per-user deferred session logic (`startDeferredTournamentSession` or `runDeferredQuestionSequence`) in `deferredTournamentFlow.ts` is not invoked, so timer creation and question emission for deferred participants is skipped. This explains the missing timer logs and logic for some users.

## Next Steps
- Add/verify tests for all relevant scenarios (deferred, quiz, live).
- Enhance diagnostics and test coverage for timer creation/reset in deferred mode.
- Validate fix with additional test cases or logs.
- Update documentation and log all changes.
- Investigate race conditions or event ordering between timer creation and answer submission in deferred mode.
- Audit and test attemptCount logic for deferred participants to ensure consistency between timer creation and answer submission.
- Add/verify logs to compare attemptCount for timer and answer for the same user/question.
- Investigate missing timer creation/lookup logs for Claudia in game 3196 (userId: 4658e2e2-968f-4018-9aa1-cb641aef467e)
    - Confirm timer creation and lookup are always triggered for deferred participants on join and answer submission
    - Add/verify catch-all logging in timer creation/lookup code paths for deferred mode
    - Reproduce and validate the issue with Claudia/game 3196
    - Document findings and update checklist
- Investigate missing timer creation/lookup logs for Marie in game 3196 (userId: <insert Marie's userId>)
    - Review all join, answer, and scoring logs for Marie in game 3196
    - Confirm timer creation/lookup/penalty logs are missing for Marie in 3196 (matches Claudia's issue)
    - Compare log sequence and attemptCount handling for Marie and Claudia in game 3196
    - Document findings and update checklist
- Verify logging immediately before timer creation in all relevant code paths (especially deferred/tournament mode)
    - Review code to confirm presence of pre-timer-creation logs with full context (userId, accessCode, questionUid, attemptCount, etc.)
    - If missing or insufficient, add catch-all log statement just before timer creation call
    - Document findings and update checklist
- Refactor for DRY question/timer/scoring logic across live and deferred tournaments
    - Extract shared logic into a single service or utility if not already
    - Refactor join handler for deferred tournaments to call `startDeferredTournamentSession` (from `deferredTournamentFlow.ts`) instead of `runGameFlow`
    - Ensure both orchestrators use the same shared logic for question emission, timer creation, and scoring (differ only in emission context and timer keying)
    - Add/verify tests for both modes to ensure timer and question logic is robust and DRY
    - Document the change and rationale in this plan
- [x] User confirmed early answer was still rejected as "timer expired"; timestamps prove no user delay (see latest test/logs)
- [ ] Add/verify logging for timer lookup in deferred mode to confirm lookup path is executed and actual elapsed time at answer submission
- [ ] Review and validate timer duration and lookup logic for deferred mode, focusing on race conditions or event ordering issues
- [ ] Update plan and checklist to reflect new evidence and next diagnostic steps
- [ ] Add/verify detailed log statement immediately before timer lookup and elapsed time calculation in answer submission handler for deferred/tournament mode (userId, accessCode, questionUid, attemptCount, timerKey, server timestamp, logPoint)
- [ ] Validate that this log appears for all answer submissions in deferred/tournament mode, especially for early answers
- [ ] Analyze logs for affected users (e.g., Marie, Claudia in game 3196) to confirm whether timer lookup is triggered and elapsed time is correct
- [x] Analyze logs for Thomas in game 3196: timer creation and lookup logs are present, but timer is expired at answer submission even for immediate answers
- [x] Document findings for Thomas: all code paths are executed, timer is created, but lookup returns expired immediately (race condition or logic error suspected)
- [x] Analyze logs for Marc in game 3196: timer creation and lookup logs are present, but timer is expired at answer submission even for immediate answers
- [x] Document findings for Marc: timer logic is triggered, but timer is expired immediately at answer submission (possible race condition or timer set/lookup mismatch)
- [ ] Add/verify even more granular logging for Marc's scenario:
    - Log exact server time at timer creation and at answer submission
    - Log timer object (all fields) at both creation and lookup
    - Log Redis set/get results and any errors
    - Log all variables used in expiry calculation
- [ ] Validate that timer's start time and duration are correct and consistent for Marc
- [ ] If a race condition is confirmed, refactor to ensure timer is always set before answer submission is processed (e.g., by awaiting timer set or blocking answer handler until timer is confirmed)
- [ ] Update checklist and findings after new logs are added and analyzed for Marc
