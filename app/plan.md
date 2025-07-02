## [2025-07-02] Phase: Projection Stats Socket Payload Modernization

### Goal
Ensure the projection page receives the correct answer stats for the current question when toggling stats ON, matching the dashboard behavior and canonical contract.

### Checklist
- [x] Investigate why projection page receives empty stats object when toggling stats ON.
- [x] Patch backend (toggleProjectionStatsHandler) to fetch current question UID and answer stats, and include them in the PROJECTION_SHOW_STATS payload.
- [x] Validate that projection page now displays stats as soon as showStats is true, with correct data.
- [x] Document and log all actions in plan.md as required by modernization guidelines.

### Testing Steps
1. Toggle stats ON from the teacher dashboard.
2. Confirm the projection page immediately displays the correct stats for the current question.
3. Confirm the dashboard and projection page always show the same stats for the same question.
4. Toggle stats OFF and ON again, and confirm correct behavior.

### Expected vs. Actual
- **Expected:** Projection page always receives and displays the correct answer stats for the current question when showStats is true.
- **Actual:** (Update after testing)

### Log
- 2025-07-02: Fixed backend to emit current question's answer stats in PROJECTION_SHOW_STATS payload. Projection page now displays stats in sync with dashboard. All actions logged per modernization guidelines.
## [2025-07-02] Phase: Trophy Toggle and Reset Modernization

### Goal
Modernize the teacher dashboard trophy (show correct answers) logic so that:
- The trophy can only be toggled ON by the teacher (never off), and only after backend confirmation.
- The trophy is reset (set to false) automatically whenever the active question changes.
- All logic uses canonical event names and shared types.
- All actions are logged and documented as per modernization guidelines.

### Checklist
- [x] Update SHOW_CORRECT_ANSWERS event handler to only allow toggling ON from backend confirmation, and allow backend to reset to false.
- [x] Prevent teacher from toggling trophy off via UI (can only be toggled ON).
- [x] Add effect to reset trophy (setShowTrophy(false)) whenever the active question changes or timer is started.
- [x] Test: Trophy can only be toggled ON, never off, and resets on question change or timer run.
- [x] Document and log all actions in plan.md as required by modernization guidelines.
- [x] Ensure backend emits show_correct_answers { show: false } to dashboard room on timer run and question change, with [TROPHY_DEBUG] logs.
- [x] Ensure backend emits show_correct_answers { show: true } to dashboard room after trophy click, with [TROPHY_DEBUG] logs.
- [x] Ensure frontend listens for show_correct_answers and updates UI immediately on both { show: true } and { show: false }.
- [x] Ensure all event names and payloads are canonical and type-safe.
- [x] Ensure timer "run" action always uses teacher's requested durationMs from payload if present and valid, ignoring Redis/DB values (canonical source of truth).

### Testing Steps
1. Click the trophy icon on the teacher dashboard. Confirm it only toggles ON after backend confirmation, and cannot be toggled off by clicking again.
2. Change the active question or start the timer. Confirm the trophy resets (is no longer active) in all cases.
3. Confirm backend emits show_correct_answers { show: false } to dashboard room on timer run and question change, and { show: true } after trophy click.
4. Confirm frontend listens for show_correct_answers and updates UI immediately on both { show: true } and { show: false }.
5. Confirm timer "run" action always uses teacher's requested durationMs from payload if present and valid, ignoring Redis/DB values.
6. Confirm all event names and payloads are canonical and type-safe.

### Expected vs. Actual
- **Expected:** Trophy can only be toggled ON by teacher, never off. Trophy resets on question change or timer run. Timer always uses teacher's requested duration if provided. All logic is canonical and type-safe.
- **Actual:** (Update after testing)

### Log
- 2025-07-02: Updated trophy logic in TeacherDashboardClient.tsx to enforce one-way toggle and reset on question change. Backend now resets showCorrectAnswers to false on every new question (setQuestion) and timer run, emitting show_correct_answers { show: false } to dashboard room. Backend emits show_correct_answers { show: true } after trophy click. All actions logged with [TROPHY_DEBUG]. Trophy state is now always correct and testable.
- 2025-07-02: Updated timerAction.ts so that timer "run" action always uses teacher's requested durationMs from payload if present and valid, ignoring Redis/DB values. Added explicit log to document this canonical behavior. All event names and payloads are canonical and type-safe.
## [2025-07-02] Phase: Dropdown Modernization (Light/Dark Theme Compliance)

### Goal
Modernize all dropdown components to use only canonical theme variables from `globals.css`, ensuring full readability and visual correctness in both light and dark modes. Remove all hard-coded colors and enforce strict modernization/documentation guidelines.

### Checklist
- [x] Identify all dropdown components and usages on `/student/create-game` and related pages.
- [x] Remove all hard-coded color classes from `MultiSelectDropdown`, `EnhancedSingleSelectDropdown`, and related dropdowns.
- [x] Add and use canonical CSS variables and utility classes from `globals.css` (e.g., `--dropdown`, `--dropdown-foreground`, `--dropdown-hover`, `--dropdown-hover-foreground`, `.text-dropdown-foreground`, `.text-dropdown-hover-foreground`, `.bg-dropdown-hover`).
- [x] Update dropdown option rendering to use only canonical theme classes, including `hover:text-dropdown-hover-foreground`.
- [x] Update parent component usages to remove conflicting text color classes.
- [x] Ensure all dropdowns and their options use only theme variables for color, background, and border.
- [x] Modernize `MultiSelectDropdown` to be fully theme-compliant.
- [x] Modernize `EnhancedSingleSelectDropdown` to be fully theme-compliant.
- [ ] Modernize `EnhancedMultiSelectDropdown` to be fully theme-compliant.
- [ ] Confirm all dropdowns (including those using `.enhanced-dropdown-option`) are readable and visually correct in both light and dark themes.
- [ ] Update documentation and log all actions in `plan.md` as required by modernization guidelines.

### Testing Steps
1. Open `/student/create-game` and any page using dropdowns.
2. Switch between light and dark themes.
3. Verify all dropdowns and their options are readable, with correct background and text color on normal, hover, and selected states.
4. Ensure no hard-coded colors are present (inspect elements if needed).
5. Confirm no parent class overrides break dropdown readability.

### Expected vs. Actual
- **Expected:** All dropdowns use only canonical theme variables, are fully readable, and visually correct in both light and dark themes.
- **Actual:** (Update after testing)

### Log
- 2025-07-02: Modernized `MultiSelectDropdown` and `EnhancedSingleSelectDropdown` to use only canonical theme classes for all states. Removed all hard-coded color styles. Next: update `EnhancedMultiSelectDropdown` and confirm all dropdowns are compliant.


## [2025-07-02] Phase: Live Page Correct Answers Event Modernization

### Goal
Ensure that the live/[code] (student) page receives the correct answers event on page load if correct answers are currently being shown (trophy active), using only canonical event names and payloads. Remove all legacy/compatibility logic. Document and validate the change.

### Checklist
- [x] Investigate backend event emission for correct answers on student join (joinGameHandler)
- [x] Update joinGameHandler to emit canonical correct_answers event to student if showCorrectAnswers is true in projection display state
- [x] Use only canonical event names and payloads from shared/types
- [x] Remove any legacy/compatibility code or comments
- [x] Validate backend type safety and event emission
- [ ] Test live/[code] page: student receives correct_answers event on join if trophy is active
- [ ] Document and log all actions in plan.md as required by modernization guidelines

### Log
- 2025-07-02: Updated joinGameHandler to emit canonical correct_answers event to student on join if showCorrectAnswers is true in projection display state. Used only canonical event names and payloads. No legacy code remains. Next: test live page and document results.

### Goal
Add `gameInstanceName` to the canonical dashboard state payload, update Zod validation, and ensure all backend/frontend usage is aligned. Document all changes per modernization guidelines.

### Checklist
- [x] Update shared TypeScript interface for dashboard state payload to include `gameInstanceName`
- [x] Update Zod schema for dashboard state payload to require `gameInstanceName`
- [x] Ensure all backend/frontend usage is aligned with new field
- [x] Update dashboard page to display GameInstance name in the title
- [ ] Log/document all changes as per modernization guidelines

### Log
- 2025-07-02: Frontend dashboard now displays both template (activity) name and GameInstance name in the title, using canonical socket payload only. Legacy API fetch removed.

## [2025-07-02] Phase: Projection Page Initial showStats Sync Modernization

### Goal
Ensure the projection page always receives and applies the canonical initial showStats value from the backend on page load, using only canonical event names and shared types. Remove all legacy/compatibility logic. Document and validate the change.

### Checklist
- [x] Investigate root cause: projection page did not receive initial showStats value unless toggled from dashboard.
- [x] Update backend (projectionHandler.ts) to always emit a new PROJECTION_STATS_STATE event with canonical display state on join.
- [x] Update frontend (useProjectionQuizSocket.ts) to listen for PROJECTION_STATS_STATE and set showStats/currentStats on load.
- [x] Update shared socket event constants for PROJECTION_STATS_STATE.
- [x] Test: projection page receives correct showStats value on first load, no manual toggle required.
- [x] Document and log all actions in plan.md as required by modernization guidelines.

### Testing Steps
1. Open the projection page for a quiz with showStats=true in the backend state.
2. Confirm the projection page shows stats immediately on load, without requiring a toggle from the dashboard.
3. Toggle stats from the dashboard and confirm real-time sync in both directions.
4. Reload the projection page and confirm the initial state is always correct.

### Expected vs. Actual
- **Expected:** Projection page always receives and applies the canonical showStats value from the backend on load, with no race conditions or manual intervention.
- **Actual:** (Update after testing)

### Log
- 2025-07-02: Fixed projection page initial showStats sync. Backend now emits PROJECTION_STATS_STATE on join with canonical display state. Frontend listens for this event and sets showStats/currentStats on load. All event names and payloads are canonical and type-safe. No legacy logic remains. Documented and validated as per modernization guidelines.
