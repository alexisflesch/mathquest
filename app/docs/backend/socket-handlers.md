# MathQuest Backend Socket Handlers

This document catalogs the main Socket.IO event handler modules in the MathQuest backend (`backend/src/sockets/handlers/`).

## Overview
Socket handlers manage real-time events for gameplay, tournaments, lobbies, teacher dashboards, and more. They are modular and grouped by feature.

## Main Handler Modules

- **connectionHandlers.ts**: Registers all connection and disconnection handlers, and delegates to feature-specific handlers (lobby, game, teacher control, tournament, practice, etc.).
- **lobbyHandler.ts**: Manages lobby join/leave, participant updates, and lobby state.
- **gameHandler.ts**: Handles core game events for students, including joining games and answering questions.
- **teacherControlHandler.ts**: Handles teacher dashboard events for live game control.
- **tournamentHandler.ts**: Manages tournament-specific events, including starting tournaments and handling tournament game flow.
- **projectorHandler.ts**: Handles projector mode events for live display of game state.
- **practiceSessionHandler.ts**: Manages practice session events, including session creation, question delivery, answer submission, and session management. Completely separate from game events.
- **sharedLiveHandler.ts**: Shared logic for joining games and submitting answers (used by both quiz and tournament modes).
- **sharedGameFlow.ts**: Core logic for question progression, timers, answer reveal, feedback, and leaderboard updates.
- **sharedLeaderboard.ts**: Calculates and emits leaderboard updates.
- **sharedAnswers.ts**: Handles answer collection and validation.
- **sharedScore.ts**: Calculates and updates player scores.
- **disconnectHandler.ts**: Handles cleanup and state updates when a socket disconnects.

## Best Practices
- Each handler is responsible for a specific set of events and is registered via `connectionHandlers.ts`.
- Shared logic is factored into `shared*` modules to avoid duplication.
- All handlers use canonical event names and payloads as defined in shared types.

## Practice Session Handler Details

### practiceSessionHandler.ts
**Purpose**: Manages real-time practice session functionality with complete separation from game logic.

**Key Features**:
- Session lifecycle management (create, manage, end)
- Real-time question delivery with progress tracking
- Immediate answer feedback with statistics
- Session state synchronization
- Room-based session management for scalability

**Events Handled**:
- `START_PRACTICE_SESSION`: Creates new practice session with custom settings
- `GET_NEXT_PRACTICE_QUESTION`: Retrieves next question with progress data
- `SUBMIT_PRACTICE_ANSWER`: Processes answer submission with immediate feedback
- `GET_PRACTICE_SESSION_STATE`: Fetches current session state
- `END_PRACTICE_SESSION`: Terminates session and provides final statistics

**Events Emitted**:
- `PRACTICE_SESSION_CREATED`: Session creation confirmation
- `PRACTICE_QUESTION_READY`: Next question with progress information
- `PRACTICE_ANSWER_FEEDBACK`: Answer result with statistics update
- `PRACTICE_SESSION_COMPLETED`: Session completion with final summary
- `PRACTICE_SESSION_STATE`: Current session state data
- `PRACTICE_SESSION_ERROR`: Error handling with specific error types

**Integration**: 
- Registered in `connectionHandlers.ts` for all new connections
- Cleanup handled in disconnect events
- Uses dedicated practice session rooms (`practice:${sessionId}`)
- Stores practice session data in socket.data for session tracking

---

For detailed event lists and logic, see the source files in `backend/src/sockets/handlers/`.
