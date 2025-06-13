# MathQuest Backend Socket Handlers

This document catalogs the main Socket.IO event handler modules in the MathQuest backend (`backend/src/sockets/handlers/`).

## Overview
Socket handlers manage real-time events for gameplay, tournaments, lobbies, teacher dashboards, and more. They are modular and grouped by feature.

## Main Handler Modules

- **connectionHandlers.ts**: Registers all connection and disconnection handlers, and delegates to feature-specific handlers (lobby, game, teacher control, tournament, etc.).
- **lobbyHandler.ts**: Manages lobby join/leave, participant updates, and lobby state.
- **gameHandler.ts**: Handles core game events for students, including joining games and answering questions.
- **teacherControlHandler.ts**: Handles teacher dashboard events for live game control.
- **tournamentHandler.ts**: Manages tournament-specific events, including starting tournaments and handling tournament game flow.
- **projectorHandler.ts**: Handles projector mode events for live display of game state.
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

---

For detailed event lists and logic, see the source files in `backend/src/sockets/handlers/`.
