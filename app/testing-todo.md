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

## Frontend Unit Test Ideas

### Components
- Render main screens: dashboard, game board, quiz/tournament, practice
- State transitions: loading, error, success, empty states
- User input: forms (login, registration, question creation), validation, error display
- Socket events: join/leave, answer submission, real-time updates
- Leaderboard: correct display, updates, edge cases
- Responsive design: mobile/tablet/desktop layouts

### Hooks
- Data fetching: API calls, error handling, loading states
- State management: context/provider logic, edge cases
- Custom hooks: correct return values, side effects

### Integration
- Auth flow: login, logout, session persistence, cookie handling
- Navigation: route changes, protected routes, redirects
- API contract: correct request/response formats, error handling

### E2E (Playwright)
- Full user journey: login → join game → answer questions → see leaderboard → logout
- Teacher dashboard: create quiz/tournament, control session, view stats
- Practice mode: start session, answer questions, receive feedback
- Tournament: join, play, see results/history
- Error scenarios: invalid access code, network failure, expired session

---

## Test Data & Edge Cases
- Use fixtures for users, questions, games, sessions
- Test with minimum/maximum allowed values
- Simulate network errors, server downtime, invalid payloads
- Test with/without authentication, different roles

---

## If any expected behavior is unclear, ASK the project owner for clarification before writing tests.
