# MathQuest Backend Documentation

This document provides a comprehensive overview of the MathQuest backend, including all REST API endpoints, real-time socket features, and key architectural and development practices.

---

## Table of Contents
- [Overview](#overview)
- [Core Technologies](#core-technologies)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Teacher Management](#teacher-management)
  - [Player Management](#player-management)
  - [Quiz Management](#quiz-management)
  - [Tournament Management](#tournament-management)
  - [Game Instances](#game-instances)
  - [Questions](#questions)
  - [Other Endpoints](#other-endpoints)
- [Socket.IO Real-Time API](#socketio-real-time-api)
- [Development Practices](#development-practices)
- [Testing](#testing)
- [Naming Conventions & Type Safety](#naming-conventions--type-safety)
- [Related Documentation](#related-documentation)

---

## Overview
The MathQuest backend is a modern, robust Node.js server built with TypeScript, Express, Prisma (PostgreSQL), and Socket.IO (with Redis adapter for scaling). It provides both RESTful and real-time APIs for quiz, tournament, and classroom game management.

## Core Technologies
- **Language:** TypeScript (strict mode)
- **Framework:** Node.js + Express
- **Database ORM:** Prisma
- **Database:** PostgreSQL
- **Real-time:** Socket.IO (with Redis adapter)
- **Validation:** Zod (for runtime validation)
- **Testing:** Jest (unit, integration, and socket tests)
- **In-memory Store:** Redis

## API Endpoints
All endpoints are prefixed with `/api/v1/` unless otherwise noted. Authentication is required for most teacher endpoints (JWT via `Authorization: Bearer <token>`).

### Authentication
- **Register Teacher**
  - `POST /api/v1/auth/register`
  - Body: `{ username, email, password }`
  - Responses: `201 Created`, `400 Bad Request`, `409 Conflict`
- **Login Teacher**
  - `POST /api/v1/auth/login`
  - Body: `{ email, password }`
  - Response: `{ token, teacher }`
  - Responses: `200 OK`, `401 Unauthorized`
- **Logout / Status / Reset Password**
  - `POST /api/v1/auth/logout`, `POST /api/v1/auth/status`, `POST /api/v1/auth/reset-password`

### Teacher Management
- **Get Profile**
  - `GET /api/v1/teachers/me`
  - Auth required
- **Update Profile**
  - `PUT /api/v1/teachers/me`
  - Auth required
- **Teacher Info**
  - `GET /api/enseignant`

### Player Management
- **Register/Identify Player**
  - `POST /api/v1/players/register`
  - Body: `{ username, [email], [password] }`
  - Supports anonymous and registered players
- **Get Player by Cookie ID**
  - `GET /api/v1/players/cookie/:cookieId`
- **Player Info**
  - `GET /api/joueur?id=...`

### Quiz Management
- **List Quizzes**
  - `GET /api/quiz?enseignant_id=...`
- **Create Quiz**
  - `POST /api/quiz`
  - Body: `{ nom, enseignant_id, questions_ids, ... }`
- **Get Quiz Questions**
  - `GET /api/teacher/quiz/[quizId]/questions`
- **Get Code for Quiz**
  - `GET /api/quiz/[quizId]/code`

### Tournament Management
- **[Not implemented in backend]**
  - Tournament creation, management, and status endpoints are not currently provided by the backend Express API. These features are not available in this backend rewrite.

> Note: Tournament endpoints are not implemented in the backend. All tournament-related API routes must be implemented in the backend if required.

### Game Instances
- **Create Game Instance**
  - `POST /api/v1/games`
  - Launches a game from a quiz template
- **Get Game Instance by Access Code**
  - `GET /api/v1/games/:accessCode`
- **Join Game**
  - `POST /api/v1/games/join`
- **Game Participation/Status**
  - `GET /api/v1/games/participation?playerId=...`

### Questions
- **List Questions**
  - `GET /api/questions?discipline=...&gradeLevel=...&themes=...&limit=...&offset=...&shuffle=...`
- **Get Available Filters**
  - `GET /api/questions/filters`
- **CRUD for Teachers**
  - `POST /api/v1/questions`, `PUT /api/v1/questions/:id`, `DELETE /api/v1/questions/:id`

### Other Endpoints
- **Logger**
  - `POST /api/logger` (client logs)
- **Health Check**
  - `GET /health`

---

## Socket.IO Real-Time API
- Real-time events for quizzes, tournaments, games, and lobbies
- Namespaced and versioned event structure
- See `/docs/sockets/socket-guide.md` and `/docs/sockets/event-reference.md` for full event list and payloads
- All socket events are fully typed and validated

---

## Development Practices
- **Strict Naming Conventions:** All endpoints, models, and types follow strict, consistent naming (snake_case for DB, camelCase for API/TS)
- **TypeScript Everywhere:** All backend code is written in strict TypeScript
- **Validation:** All API input is validated with Zod schemas
- **Testing:** Comprehensive unit, integration, and socket tests (Jest)
- **Error Handling:** Centralized error middleware and consistent error responses
- **Code Quality:** ESLint, Prettier, and strict CI checks
- **Documentation:** All changes must be reflected in `/docs/` (see [Documentation Standards](../documentation-standards.md))

---

## Testing
- **Unit Tests:** `npm run test`
- **Integration Tests:** `npm run test:integration`
- **Socket Tests:** `npm run test:socket`
- **Coverage Reports:** See `/backend/coverage/`

---

## Naming Conventions & Type Safety
- **TypeScript strict mode** is enforced
- **Zod** is used for runtime validation of all API payloads
- **Prisma** models use snake_case for DB, camelCase for API
- **All API endpoints and socket events are fully typed**

---

## Related Documentation
- [API Reference](../api/api-reference.md)
- [REST API Details](../api/rest-api.md)
- [Socket Guide](../sockets/socket-guide.md)
- [Backend Architecture](./backend-architecture.md)
- [Type System](../types/typescript-guide.md)
- [Testing](../test-fixes-summary.md)
- [Documentation Standards](../documentation-standards.md)

---

For any changes to backend logic, endpoints, or types, **update this file and the API reference docs.**

---

## Tournament Socket Event Flow (Real-Time API)

The tournament flow in MathQuest is orchestrated via Socket.IO events. Below is a summary of the main events, their payloads, and backend logic:

### Main Tournament Events
- **join_tournament**
  - Payload: `{ accessCode, userId, username }`
  - Description: Player joins the tournament lobby. The backend registers the player in the game instance and adds their socket to the appropriate room.

- **start_tournament**
  - Payload: `{ accessCode }`
  - Description: Only the student-creator (initiator) of the tournament can emit this event. The backend verifies the sender's identity and, if authorized, updates the game status to `active`, emits `redirect_to_game` to the lobby, and starts the tournament game flow.
  - Authorization: The backend checks that `socket.data.userId` matches the `initiatorUserId` of the game instance.

- **game_question**
  - Payload: `{ index, question, ... }`
  - Description: Sent by the backend to all active players when a new question is available.

- **feedback**
  - Payload: `{ questionId, correct, ... }`
  - Description: Sent by the backend to all players after each question, indicating correctness and providing feedback.

- **game_end**
  - Payload: `{}`
  - Description: Sent by the backend when the tournament is over. Triggers leaderboard display and cleanup.

- **answer**
  - Payload: `{ accessCode, userId, questionId, answer, timeSpent }`
  - Description: Player submits an answer to the current question. The backend records the answer and, after all answers or a timeout, emits feedback. (Check backend for exact event name; if it is 'tournament_answer', use that.)

### Backend Logic
- The backend uses strict authentication and authorization for all tournament events. JWTs are required for REST endpoints, and socket connections must provide a valid user context.
- Only the tournament creator (student-initiator) can start the tournament via `start_tournament`.
- The backend emits `game_question` events to all sockets in the `live_<accessCode>` room as the tournament progresses.
- All socket events and payloads are fully typed and validated.

### Relationship to REST Endpoints
- Tournament creation and joining are handled via REST endpoints (`/api/v1/games`, `/api/v1/games/:accessCode/join`).
- Real-time orchestration (starting, answering, feedback) is handled via Socket.IO events as described above.

### Example Flow
1. Player-1 (student) creates a tournament via REST API.
2. Other players join via REST API and then connect sockets, emitting `join_tournament`.
3. The creator emits `start_tournament` via socket. Backend verifies and starts the game.
4. Backend emits `game_question` events as the game progresses.
5. Players answer via the correct answer event (see above).
6. Backend emits `feedback` and, at the end, `game_end`.

---
