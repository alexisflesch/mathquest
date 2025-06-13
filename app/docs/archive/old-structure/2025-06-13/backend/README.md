# MathQuest Backend - AI Agent Reference

This document is the canonical reference for the MathQuest backend, designed for AI agents and developers. It covers architecture, real-time logic, state models, event flow, and best practices for automated reasoning, debugging, and extension.

---

## 1. Overview & Main Concepts

- **Node.js + TypeScript**: Type-safe, event-driven backend.
- **Prisma ORM**: PostgreSQL database access.
- **Socket.IO**: Real-time communication for quizzes, tournaments, dashboards, and projectors.
- **Redis**: Fast in-memory store for state, horizontal scaling, and failover.
- **Express**: REST API (see `/docs/api/`).

---

## 2. Architecture & Real-Time Engine

- **Socket.IO** is the backbone for all real-time events.
- **Handler Domains**:
  - **Quiz**: Teacher dashboard, quiz control, projector view.
  - **Tournament**: Student gameplay, scoring, answer submission.
  - **Lobby**: Waiting room before tournaments start.
- **In-Memory State**: All critical state is mirrored in Redis for recovery and multi-instance support.
- **Event-Driven**: Each handler registers listeners for specific socket events, updates state, interacts with the DB, and emits events to clients/rooms.

---

## 3. State Models

- **quizState**: Per-quiz, in-memory + Redis. Tracks quiz sessions, participants, questions, answers, leaderboard, status.
- **tournamentState**: Per-tournament, in-memory + Redis. Tracks tournament sessions, participants, rounds, leaderboard, status.
- **lobbyParticipants**: Per-lobby, in-memory only. Tracks participants in each lobby room.

See [`state-models.md`](./state-models.md) for full structure diagrams and field lists.

---

## 4. Socket Event Flow

1. **Client emits event** (e.g., `join_game`, `game_answer`, `join_dashboard`)
2. **Socket.IO handler** validates/processes the event
3. **State is updated** in Redis and/or DB
4. **Server emits events** to relevant clients/rooms (e.g., game state, leaderboard, question, results)
5. **Clients update UI** based on received events

See `/docs/sockets/event-reference.md` for a full event list and payloads.

---

## 5. File & Folder Structure

- `/sockets/quizHandler.js` - Registers all quiz events, manages quizState.
- `/sockets/quizEventHandlers/` - Individual files for each quiz event (setQuestion, timerAction, lock, unlock, etc).
- `/sockets/tournamentHandler.js` - Registers all tournament events, manages tournamentState.
- `/sockets/tournamentEventHandlers/` - Individual files for each tournament event (join, answer, pause, resume, etc).
- `/sockets/lobbyHandler.js` - Handles lobby join/leave, participant tracking, and lobby events.
- `/sockets/sharedLiveLogic/` - Logic shared between quiz and tournament modes (e.g., emitQuestionResults, sendQuestion).
- `/core/services/` - Business logic for users, questions, game templates, game instances, and participants (all DB access via Prisma).
- `/db/prisma.ts` - Prisma client setup.
- `/utils/logger.ts` - Centralized logging utility.

---

## 6. Best Practices for AI Agents

- **Type Safety**: Use shared TypeScript types for all state and event payloads.
- **Event Constants**: Use shared event constants from `/shared/types/socket/events.ts` for all socket event names.
- **State Consistency**: Always update both in-memory and Redis state for critical game/session data.
- **Room Naming**: Follow the naming conventions: `dashboard_${gameId}`, `game_${accessCode}`, `projection_${gameId}`, `lobby_${code}`.
- **Error Handling**: Use structured error objects (`{ error, message }`).
- **Timer Management**: Backend is the single source of truth for all timer values and status.
- **Self-Paced Modes**: Practice mode uses `isDiffered: true` and manual progression.

---

## 7. Historical Notes

- **Socket Event Alignment (2025-05-27)**: All hardcoded socket event strings replaced with shared constants. See `backend-socket-alignment-completion.md` (archived).

---

*For detailed type definitions, see `/shared/types/`. For API details, see `/docs/api/`. For event flows, see `/docs/sockets/`.*
