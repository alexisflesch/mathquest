# MathQuest Backend - AI Agent Technical Guide

## Overview
This document provides a comprehensive technical reference for MathQuest's backend, focusing on the real-time game logic, state management, and event-driven architecture. It is intended for AI agents and developers who need to understand, debug, or extend the backend logic.

---

## 1. Architecture & Main Concepts

### 1.1. Real-Time Engine
- **Socket.IO** is used for all real-time communication between clients (students, teachers, projector) and the server.
- The backend is split into three main handler domains:
  - **Quiz Handlers**: Teacher dashboard, quiz control, projector view.
  - **Tournament Handlers**: Student gameplay, scoring, answer submission.
  - **Lobby Handlers**: Waiting room before tournaments start.

### 1.2. In-Memory State
- **quizState**: Tracks all active quizzes (teacher dashboards), keyed by quizId.
- **tournamentState**: Tracks all active tournaments (live and differed), keyed by code (or code+joueurId for differed).
- **lobbyParticipants**: Tracks participants in each lobby room.

### 1.3. Event-Driven Design
- Each handler registers event listeners for specific socket events (e.g., `quiz_set_question`, `tournament_answer`).
- Event handlers update in-memory state, interact with the database (via Prisma), and emit events to relevant rooms.

---

## 2. File & Folder Structure

- `/sockets/quizHandler.js` - Registers all quiz-related events and manages quizState.
- `/sockets/quizEvents.js` - Imports and registers all quiz event handlers.
- `/sockets/quizEventHandlers/` - Individual files for each quiz event (setQuestion, timerAction, lock, unlock, etc).
- `/sockets/quizState.js` - Central in-memory state for quizzes.
- `/sockets/quizUtils.js` - Utilities for quiz state patching, connected count, etc.

- `/sockets/tournamentHandler.js` - Registers all tournament-related events and manages tournamentState.
- `/sockets/tournamentEvents.js` - Imports and registers all tournament event handlers.
- `/sockets/tournamentEventHandlers/` - Individual files for each tournament event (join, answer, pause, resume, etc).
- `/sockets/tournamentUtils/` - Helpers for scoring, state, and stats.
- `/sockets/tournamentUtils/tournamentState.js` - Central in-memory state for tournaments.

- `/sockets/lobbyHandler.js` - Handles lobby join/leave, participant tracking, and lobby events.

- `/sockets/sharedLiveLogic/` - Directory for logic shared between quiz and tournament modes.
  - `emitQuestionResults.ts` - Shared function to emit standardized `question_results` events.
  - `sendQuestion.ts` - Shared function to emit standardized `live_question` events to clients.
  - `emitParticipantScoreUpdate.ts` - Shared function to emit `participant_score_update` events with detailed scoring information to individual participants.

---

## 3. In-Memory State Models

### 3.1. quizState (per quizId)
- `currentQuestionIdx`: Index of the active question.
- `questions`: Array of question objects.
- `chrono`: `{ timeLeft, running }` - Timer state.
- `locked`: Boolean, whether answers are locked.
- `ended`: Boolean, whether the quiz is finished.
- `profSocketId`: Socket ID of the teacher.
- `profTeacherId`: Teacher's DB ID.
- `timerStatus`, `timerQuestionId`, `timerTimeLeft`, `timerTimestamp`: Timer tracking for real-time sync.
- `tournament_code`: Linked tournament code (if any).
- `connectedSockets`: Set of connected socket IDs.

### 3.2. tournamentState (per code or code+joueurId)
- `participants`: Map of joueurId to participant info (username, avatar, score, etc).
- `questions`: Array of question objects.
- `currentIndex`: Index of the current question.
- `answers`: Map of joueurId to their answers per question.
- `timer`: Node.js timer for question expiration.
- `questionStart`: Timestamp when the current question started.
- `paused`, `pausedRemainingTime`, `stopped`: Timer control flags.
- `linkedQuizId`: If quiz-linked, the quizId.
- `currentQuestionDuration`: Duration for the current question.
- `socketToJoueur`: Map of socketId to joueurId.
- `isDiffered`: Boolean, for differed tournaments.
- `statut`: Tournament status (en préparation, en cours, terminé).

---

## 4. Event Handler Breakdown

### 4.1. Quiz Event Handlers (`/sockets/quizEventHandlers/`)
- **joinQuizHandler.js**: Handles teacher/projector/student joining a quiz room. Initializes quizState if needed.
- **setQuestionHandler.js**: Sets the active question, updates quizState, triggers tournament question if linked, emits state to dashboard/projector.
- **timerActionHandler.js**: Handles play/pause/stop actions from the teacher. Updates quizState, triggers tournament timer if linked.
- **setTimerHandler.js**: Edits the timer for the current question. Updates quizState and tournamentState if linked.
- **lockHandler.js / unlockHandler.js**: Locks/unlocks answer submission for the current question.
- **endHandler.js**: Ends the quiz, updates state, and (if linked) forces tournament end.
- **pauseHandler.js / resumeHandler.js**: Pauses/resumes the quiz and linked tournament.
- **closeQuestionHandler.js**: Closes a question, computes correct answers using `scoreUtils.ts`, updates participant total scores, calculates ranks, emits `participant_score_update` to individual participants, and `question_results` (including correct answers and leaderboard) to projector/teacher.
- **disconnectingHandler.js**: Cleans up quizState and emits updated connected count.

### 4.2. Tournament Event Handlers (`/sockets/tournamentEventHandlers/`)
- **startHandler.js**: Starts a tournament, fetches questions, initializes tournamentState, emits `tournament_started` to lobby.
- **joinHandler.js**: Handles student joining a tournament. Finds/creates Joueur, initializes state, sends current question, manages live/differed logic.
- **answerHandler.js**: Handles answer submission, validates timing, updates answers, computes score, emits result.
- **pauseHandler.js / resumeHandler.js**: Pauses/resumes the tournament timer, updates state, emits state updates.
- **disconnectionHandler.js**: Cleans up socket-to-joueur mapping, emits participant updates.

### 4.3. Tournament Triggers & Helpers (`/sockets/tournamentUtils/`)
- **tournamentHelpers.js**: Core logic for timer expiration (which now calculates scores using `scoreUtils.ts`, updates participant total scores, calculates ranks, and emits `participant_score_update` and `question_results`), sending questions, and explication overlays.
- **tournamentState.js**: Central state object for all tournaments.
- **computeStats.js**: Computes answer stats for histograms.
- **scoreUtils.ts**: Contains the `calculateScore` function for detailed scoring logic.

---

## 5. Socket Event Flows

### 5.1. Quiz (Teacher Dashboard)
- `join_quiz` → Initializes quizState, joins `dashboard_${quizId}` room.
- `quiz_set_question` → Sets active question, updates state, triggers tournament question if linked.
- `quiz_timer_action` → Play/pause/stop, updates state, triggers tournament timer if linked.
- `quiz_set_timer` → Edits timer, updates state, triggers tournament timer if linked.
- `quiz_lock` / `quiz_unlock` → Locks/unlocks answers.
- `quiz_end` → Ends quiz, triggers tournament end if linked.
- `quiz_pause` / `quiz_resume` → Pauses/resumes quiz and linked tournament.
- `quiz_close_question` → Closes question, emits results.

### 5.2. Tournament (Student Gameplay)
- `start_tournament` → Initializes tournamentState, emits `tournament_started` to lobby.
- `join_tournament` → Finds/creates Joueur, joins `live_${code}` room, sends current question.
- `tournament_answer` → Validates and records answer, computes score, emits result.
- `tournament_pause` / `tournament_resume` → Pauses/resumes timer.
- `disconnecting` → Cleans up socket-to-joueur mapping.

### 5.3. Lobby
- `join_lobby` → Adds participant to lobbyParticipants, emits participant list.
- `leave_lobby` → Removes participant, emits updated list.
- `get_participants` → Emits current participant list.
- `redirect_to_tournament` / `tournament_started` → Triggers client redirect/countdown.

---

## 6. Tournament & Quiz Lifecycle

### 6.1. Classic Tournament
1. Teacher starts tournament (`start_tournament`).
2. Students join lobby, then tournament room.
3. Questions are sent in order, timer managed by backend.
4. Answers are scored, leaderboard updated.
5. At end, leaderboard is emitted, scores saved to DB.

### 6.2. Quiz-Linked Tournament
1. Teacher controls quiz via dashboard (`quiz_set_question`, `quiz_timer_action`).
2. Tournament state is updated in sync with quizState.
3. Students receive questions/timers as teacher advances.
4. At end, leaderboard is emitted, scores saved.

### 6.3. Differed Tournament
- Each student gets their own state (keyed by code+joueurId).
- Questions are served sequentially, timer per user.
- Scores are saved at the end, leaderboard updated.

---

## 7. Scoring, Stats, and Leaderboard
- **Scoring**: `calculateScore` in `scoreUtils.ts` computes the score for a given question. The logic includes:
  - A time penalty: linear, ranging from 0 for an immediate answer to 500 points for a last-second answer.
  - Question Correct Unique (QCU): 1000 points if the unique correct answer is chosen, 0 otherwise.
  - Question Correct Multiple (QCM): 1000 points divided by the number of correct answers for each correctly chosen option. Incorrectly chosen options result in a negative score for that option, but the total score for a QCM question cannot go below 0. If a QCM question has only one correct answer, it is treated as a QCU.
  - Normalization: The final score for a question is divided by the total number of questions in the event (quiz or tournament) to get the points added to the participant's total score.
- **Stats**: `computeStats.js` aggregates answer stats for histograms.
- **Leaderboard**: Built from participants' scores, emitted at end or on demand (typically as part of the `question_results` event).

---

## 8. UI-to-Backend Mapping
- UI emits socket events (see above) with payloads (quizId, code, questionUid, etc).
- Backend handlers update state, emit events to rooms (dashboard, projector, students).
- All state changes are reflected in real-time to all relevant clients.

---

## 9. Best Practices & Extension Points
- **Always use the logger** for debug/info/warn/error.
- **Never mutate state directly** outside handlers/utilities.
- **Add new events** by creating a handler in the appropriate folder and registering it.
- **Keep state shape consistent**; always check for undefined/null before accessing nested fields.
- **For new features**, follow the modular event-driven pattern.

---

## 10. References
- See `/prisma/schema.prisma` for DB schema.
- See `/README.md` for high-level project overview.
- See `/src/clientLogger.ts` for client-side logging.

---

## Differed Tournament Error Handling

- When a user attempts to play a tournament in differed mode, the backend (in `/sockets/tournamentEventHandlers/joinHandler.js`) must emit a `tournament_error` event with a clear error message if initialization fails (e.g., missing tournament, missing questions, or user already played).
- All `tournament_error` emissions should include a descriptive `message` property in the payload for frontend debugging.
- Example:
  ```js
  socket.emit("tournament_error", { message: "Tournament not found or already played." });
  ```
- The frontend should log and display this message for user feedback and debugging.

---

## Differed Mode Isolation & DRY Event Emission

- In differed mode, each student must receive tournament events (question, explication, end, etc.) only on their own socket (or a unique room), never in the shared `live_${code}` room.
- All backend emit logic (question, explication, etc.) is DRY: the same handler functions accept a `targetSocket` parameter. In live mode, events are sent to the shared room; in differed mode, they are sent only to the individual socket.
- This ensures:
  - No cross-talk between students playing the same tournament asynchronously
  - The frontend logic remains identical for live and differed modes
- See `handleTimerExpiration` and `sendQuestionWithState` in `tournamentHelpers.js` for the DRY implementation.
- All new event logic must follow this pattern for both modes.

---

## Differed Mode Room Isolation (Robust to Reconnection)

- In differed mode, each student joins a dedicated room: `live_${code}_${joueurId}`.
- All emits for that session (questions, explication, etc.) use this room, not the shared `live_${code}` room.
- On reconnection, the backend ensures the socket rejoins the same room, so the user continues their session seamlessly.
- The same DRY handler functions are used for both live and differed modes, with a `targetRoom` parameter.
- See `handleTimerExpiration` and `sendQuestionWithState` in `tournamentHelpers.js` for implementation details.

---

## 11. Timer Management & Synchronization

### 11.1. Single Source of Truth
- The backend is the single source of truth for all timer values.
- Timer values are always stored with 1 decimal place precision.
- Frontend never determines timer values; it only displays and sends control actions.

### 11.2. Backend Timer Sources (in order of precedence)
- When starting a question: Value comes from the question object's `temps` field
- When pausing: Backend calculates and stores the precise remaining time
- When resuming: Backend uses its stored `pausedRemainingTime` value
- When editing: Frontend sends an explicit update via `quiz_set_timer`

### 11.3. Key Timer State Fields
- In quizState:
  - `chrono.timeLeft`: Timer value in seconds (with 1 decimal precision)
  - `timerTimeLeft`: Duplicate of chrono.timeLeft for compatibility
  - `timerInitialValue`: Original timer value for the current question
  - `timerTimestamp`: When the timer was last started
  - `timerStatus`: Current status ('play', 'pause', 'stop')

- In tournamentState:
  - `currentQuestionDuration`: Total time for the question
  - `pausedRemainingTime`: Stored time when paused
  - `paused`, `stopped`: Boolean flags for timer state
  - `questionStart`: Timestamp when question timer started

### 11.4. Timer Synchronization Logic
- `synchronizeTimerValues()` in `quizUtils.js` ensures consistent timer values between quiz and tournament states
- `triggerTournamentPause()`, `triggerTournamentTimerSet()` in `tournamentTriggers.js` manage timer state transitions
- `updateChrono()` in `quizUtils.js` maintains synchronized timer properties

### 11.5. Frontend Timer Handling
- Frontend uses `quiz_timer_update` events to synchronize its local timer
- Frontend maintains a local timer only for smooth UI countdown between updates
- For pause/resume actions, frontend never sends timeLeft values to backend
- Only explicit timer edits (`emitSetTimer`) send time values to the backend
- Frontend relies on socket events rather than polling for timer updates (fix: removed polling mechanism)

---

## 12. Known Issues & Solutions

### 12.1. Quiz State Synchronization Bug

#### Issue: 
A critical bug was identified where `currentQuestionUid` in the `quizState` was not being properly synchronized across different components of the application. This manifested as the dashboard/projection views showing "question A" as active, while the backend was processing "question B" during timer actions.

#### Root Cause:
1. **Inconsistent Import Pattern**: In `quizEvents.js` and certain other files, `quizState` was imported directly as:
   ```javascript
   const quizState = require('./quizState');
   ```
   But the correct export from `quizState.js` had it as a property:
   ```javascript
   module.exports = { quizState: _quizState, createDefaultQuestionTimer, getQuestionTimer };
   ```

   This created separate, disconnected copies of the state object, where:
   - Some files accessed the correct shared state via proper destructuring: `const { quizState } = require('./quizState');`
   - Other files created local copies that didn't reflect updates made elsewhere

2. **Timer vs. currentQuestionUid Desynchronization**: When a timer action occurred, `timerQuestionId` would be updated correctly, but the `currentQuestionUid` property, accessed through the incorrect import, wasn't being synchronized.

#### Solution:
1. **Consistent Import Pattern**: Updated all imports in `quizEvents.js` and other affected files to properly destructure the quizState object:
   ```javascript
   const { quizState } = require('./quizState');
   ```

2. **Explicit Synchronization**: Added checks to synchronize `currentQuestionUid` with `timerQuestionId` when:
   - A state object is first accessed/initialized (`ensureQuizStateInitialized`)
   - Timer actions occur (`timerActionHandler.js`)
   - Quiz state is requested (`get_quiz_state` handler)
   - State is patched for broadcast (`patchQuizStateForBroadcast`)

3. **Property Redundancy**: Ensured both `id` and `quizId` properties are set on state objects to prevent "UNKNOWN_QUIZ_ID" issues in logs and to ensure consistent identification.

#### Prevention:
- Added extensive logging around state synchronization points
- Implemented destructuring imports consistently across all files
- Added explicit property validation in state access functions

---
