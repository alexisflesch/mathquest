# TODO: Unit Test Ideas for MathQuest

## General Principles
- All tests should reflect real user flows and edge cases described in documentation.
- Tests must cover both frontend and backend logic, including integration points.
- If any expected behavior is unclear, ASK the project owner for clarification before writing tests.

---


## Backend Unit Test Ideas (Detailed)

### User Management
- Register user (student/teacher):
	- Valid registration
	- Invalid data (missing fields, invalid email, weak password)
	- Duplicate email/username
	- Password rules enforcement
	- Role assignment (student/teacher)
- Login:
	- Valid credentials (JWT issued, correct payload)
	- Invalid credentials (wrong password, unknown user)
	- JWT expiry and refresh
	- Cookie handling (set, clear, invalid)
- Upgrade user:
	- Guest to student/teacher (data migration, role change)
	- Invalid upgrade (already upgraded, missing data)
- Fetch user by ID:
	- Valid/invalid ID
	- Role-based access (student cannot fetch teacher-only data)
	- Nonexistent user

### Question Service
- Create question:
	- Valid YAML (all required fields, correct types)
	- Missing fields (required field omitted)
	- Invalid types (wrong type for answerOptions, etc.)
	- Duplicate UID (conflict detection)
	- Invalid discipline/theme/tag
	- Malformed YAML (parse errors)
- Update question:
	- Valid update (change text, options, etc.)
	- Invalid update (change UID, forbidden fields)
	- Permission checks (only author/teacher can update)
	- Update with invalid data
- List/filter questions:
	- Filter by discipline, theme, grade, tags
	- No results (empty filter)
	- Large result set (pagination)
	- Invalid filter values
- Get question by UID:
	- Valid UID
	- Invalid UID (not found, malformed)
	- Edge cases (question deleted, archived)

### Game Instance Service
- Create game instance:
	- Valid data (template, initiator, settings)
	- Invalid data (missing template, bad settings)
	- Unique access code generation (collision handling)
	- Edge case: max concurrent games per user
- Update game status:
	- All transitions (pending → active → paused → completed → archived)
	- Invalid transition (e.g., completed → active)
	- Status update race conditions (simultaneous updates)
- Fetch by access code:
	- Valid code
	- Invalid code (not found, expired, archived)
	- Edge case: access code reused after game ends

### Game Participant Service
- Join game:
	- Valid access code
	- Invalid access code (not found, expired)
	- Duplicate join (same user joins twice)
	- Avatar assignment (valid/invalid emoji)
	- Max participants reached
	- Edge case: join after game started/ended
- Submit answer:
	- Valid answer (correct/incorrect)
	- Invalid answer (wrong format, out of time)
	- Timing: submit before/after timer expires
	- Scoring logic: correct, partial, time penalty
	- Edge case: answer submitted twice, answer after game ends
- Get participants:
	- Correct list (all joined users)
	- Edge cases: empty list, max participants, participant leaves mid-game

### Quiz/Tournament Logic
- Create/update template:
	- Valid/invalid data
	- Question assignment/removal (order, duplicates)
	- Edge case: template with zero questions, max questions
- Progression:
	- Next/previous question navigation
	- Timer: start, pause, resume, expire
	- Answer reveal: correct/incorrect, feedback timing
	- Edge case: skip question, repeat question, timer manipulation
- Leaderboard:
	- Score calculation (correct, partial, time penalty, bonus)
	- Tie-breakers (same score, fastest answer)
	- Updates after each question (real-time sync)
	- Edge cases: leaderboard with ties, empty leaderboard, late joiners
	- Score with time penalty: verify penalty applied for late answers, bonus for fastest
	- Score manipulation: test for cheating attempts (multiple answers, replay)
- Tournament:
	- Sync mode: all players answer at same time, timer enforcement
	- Différé mode: players answer at own pace, session state
	- Scoring: correct, partial, time-based, bonus
	- Feedback: correct/incorrect, explanation display
	- History: tournament results saved, replay, différé scores added to highscores
	- Edge cases: player disconnect/reconnect, session expiry, tournament restart

### Practice Session
- Create session:
	- Custom settings (discipline, theme, question count)
	- Edge cases: min/max questions, invalid settings
- Question delivery:
	- Progress tracking (current question, total)
	- Immediate feedback (correct/incorrect, explanation)
	- Edge case: feedback unavailable, question skipped
- Answer submission:
	- Correct/incorrect answer
	- Statistics update (answer distribution)
	- Edge case: answer after session ended, multiple answers
- Session completion:
	- Summary (score, feedback, stats)
	- Error handling (session not found, already completed)

### Middleware
- Auth:
	- Valid JWT (access granted)
	- Invalid JWT (access denied)
	- Cookie handling (valid/invalid, missing)
	- Role checks (student/teacher, unauthorized access)
- Optional auth:
	- Correct behavior for logged in/out users
	- Edge case: user switches role mid-session

### Database
- Model relations:
	- User-question-game links (foreign key integrity)
	- Edge case: orphaned records, cascade delete
- Nullable fields:
	- Correct handling of null/undefined in all models
	- Edge case: missing optional fields, null propagation
- Prisma migrations:
	- Schema evolution (add/remove fields)
	- Rollback (restore previous state)
	- Edge case: migration failure, data loss

---

## Frontend Testing Status 

### ✅ Test Infrastructure (COMPLETED)
- [x] Jest setup and configuration (jest.config.js, jest.setup.js)
- [x] React Testing Library integration (@testing-library/react, @testing-library/jest-dom)
- [x] TypeScript testing support with proper module resolution
- [x] Mock setup for Next.js components (next/image, next/link)
- [x] Path alias configuration working for tests (@ imports functional)

### ✅ Hook Testing (COMPLETED)
- [x] useStudentGameSocket comprehensive testing (47 tests across 5 test files):
  - `useStudentGameSocket.initialization.test.ts` - 10 tests for initial state and setup
  - `useStudentGameSocket.connection.test.ts` - 10 tests for socket connection/disconnection
  - `useStudentGameSocket.emitters.test.ts` - 7 tests for event emission functions
  - `useStudentGameSocket.eventListeners.test.ts` - 10 tests for event handlers and state updates
  - `useStudentGameSocket.stateUpdates.test.ts` - 10 tests for state management and edge cases

### ✅ Component Testing (IN PROGRESS - 18 tests added)
- [x] **QuestionDisplay Component** (18 comprehensive tests):
  - ✅ Rendering tests (basic rendering, custom className, disabled state)
  - ✅ Question state tests (open/closed states)
  - ✅ Timer control tests (play/pause/stop buttons, timer display)
  - ✅ Question type tests (numeric questions, multiple choice questions)
  - ✅ Explanation display tests (show/hide explanation)
  - ✅ Statistics tests (statistics chart rendering)
  - ✅ Accessibility tests (ARIA labels, keyboard navigation)
  - ✅ Edge case tests (missing data, empty explanation, zero time)

**Component Testing Gaps (REMAINING):**
- [ ] **Leaderboard Component** - Critical UI component for displaying participant results and rankings
- [ ] **TimerField Component** - Timer editing and display functionality testing
- [ ] **Dashboard Components** - Teacher dashboard interface and controls
- [ ] **Student Game Interface** - Student-facing game components and interactions
- [ ] **Form Components** - Game creation and configuration forms
- [ ] **Navigation Components** - Application routing and navigation elements

---

## Summary

### Current Frontend Test Status: ✅ EXCELLENT (152/152 tests passing - 100% success rate)

**Test Distribution:**
- **Hook Tests:** 47 tests (useStudentGameSocket comprehensive coverage)
- **Component Tests:** 18 tests (QuestionDisplay comprehensive coverage)
- **Integration Tests:** 87 tests (dashboard integration, timer controls, UI interactions)

**Latest Achievements:**
- ✅ Removed legacy timer tests that conflicted with unified timer system
- ✅ Added comprehensive QuestionDisplay component tests (18 tests)
- ✅ Maintained 100% test success rate across all test categories
- ✅ Proper mock setup for complex component dependencies

**Next Priority:** Expand component testing to other critical UI components (Leaderboard, TimerField, Dashboard components)
