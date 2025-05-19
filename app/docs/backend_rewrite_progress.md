# MathQuest Backend Rewrite Progress

This document tracks the progress of rewriting the MathQuest backend from scratch using TypeScript, Express.js, Prisma, Socket.I## Phase 5: Real-time Core Logic (Socket.IO Setup)

*   [x] **Socket.IO Integration:**
    *   [x] Integrate Socket.IO with the Express server.
    *   [x] Configure CORS and transport settings.
    *   [x] Define main Socket.IO connection endpoint (`/api/socket.io` or integrate with Express server).
*   [x] **Redis Adapter for Socket.IO:**
    *   [x] Install `@socket.io/redis-adapter` for integration with ioredis.
    *   [x] Configure Socket.IO to use the Redis adapter.
*   [x] **Basic Connection Handling:**
    *   [x] Implement connection/disconnection event handlers.
    *   [x] Basic authentication/identification for socket connections (pass JWT or player ID).
*   [x] **Room Management Utilities:**
    *   [x] Develop helper functions for joining/leaving Socket.IO rooms.
    *   [x] Create utilities for room state persistence in Redis.
    *   [x] Implement room-based broadcasting with exclusion options.
*   [x] **Testing:**
    *   [x] Basic integration tests for Socket.IO connection with authentication.
    *   [x] Unit tests for room joining/leaving logic and utilities.

- **Phase 5 completed on May 14, 2025!** The real-time infrastructure for Socket.IO has been successfully integrated with Redis adapter for horizontal scaling. Basic connection handlers and room management utilities are now in place.s.

**VERY IMPORTANT/MANDATORY - Overall Goals:**
*   Develop a robust, maintainable, and scalable backend in TypeScript.
*   Ensure code is DRY (Don't Repeat Yourself) and well-organized.
*   Prioritize fixing underlying issues over temporary patches.
*   Maintain consistency in coding style, architecture, and API design.
*   Implement comprehensive unit and integration tests using Jest.
*   Adhere to the project's existing logging and documentation standards.
*   Use Redis for Socket.IO state persistence and scalability.
*   Avoid creating big files; instead, break down code into smaller, manageable modules.
*   Don't use relative paths in imports; use @aliasing for cleaner imports.
*   Don't "patch", FIX.

**Core Technologies:**
*   **Language:** TypeScript
*   **Framework:** Node.js with Express.js
*   **Real-time:** Socket.IO with Redis Adapter
*   **Database ORM:** Prisma
*   **Database:** PostgreSQL
*   **Testing:** Jest
*   **In-memory Store:** Redis

---

## Phase 1: Project Setup & Core Infrastructure

*   [x] **Initialize New Backend Project:**
    *   [x] Create a new directory (`/home/aflesch/mathquest/app/backend`).
    *   [x] Initialize a Node.js project (`npm init -y`).
    *   [x] Install TypeScript, `ts-node`, `nodemon`, and necessary type definitions (`@types/node`, `@types/express`).
    *   [x] Set up `tsconfig.json` with strict settings.
    *   [x] Install Express.js.
    *   [x] Set up ESLint and Prettier for code quality and consistency, configured for TypeScript.
*   [x] **Basic Server Setup:**
    *   [x] Create an entry point (e.g., `src/server.ts`).
    *   [x] Set up a basic Express server.
    *   [x] Implement health check endpoint (e.g., `/health`).
*   [x] **Prisma Setup:**
    *   [x] Install Prisma CLI (`prisma`) and Prisma Client (`@prisma/client`).
    *   [x] Copy `schema.prisma` from `/home/aflesch/mathquest/app/backend-backup/prisma/schema.prisma` to `/home/aflesch/mathquest/app/backend/prisma/schema.prisma`.
    *   [x] Update `DATABASE_URL` in the root `.env` file.
    *   [x] Generate initial migration (`npx prisma migrate dev --name init_from_backup_schema`).
    *   [x] Generate Prisma Client (`npx prisma generate`).
*   [x] **Redis Setup:**
    *   [x] Install Redis client library (e.g., `ioredis`).
    *   [x] Install type definitions for the Redis client (`@types/ioredis`).
    *   [x] Set up basic Redis connection logic (e.g., in `src/config/redis.ts`).
    *   [x] Add Redis connection details to `.env` file.
    *   [ ] (Consider Docker setup for local Redis development if not already available).
*   [x] **Logging Utility:**
    *   [x] Re-implement the server-side logger utility (e.g., `src/utils/logger.ts`) based on the existing `backend-backup/logger.ts`, ensuring it's TypeScript-native.
*   [x] **Jest Setup:**
    *   [x] Install Jest, `ts-jest`, and `@types/jest`.
    *   [x] Configure Jest (`jest.config.js`).
    *   [x] Write an initial test for the health check endpoint.
*   [x] **Folder Structure:**
    *   [x] Implement the defined folder structure:
        ```
        backend/
        ├── src/
        │   ├── api/
        │   │   ├── v1/
        │   │   └── index.ts
        │   ├── config/          # (e.g., env, redis, prisma client instance)
        │   ├── core/            # Business logic, services
        │   ├── db/              # Prisma client wrapper/instance, seed scripts
        │   ├── middleware/
        │   ├── models/          # DTOs, interfaces (if not using Prisma types directly)
        │   ├── sockets/
        │   │   ├── handlers/
        │   │   ├── adapters/    # Redis adapter setup
        │   │   └── index.ts
        │   ├── types/
        │   ├── utils/           # (e.g., logger)
        │   └── server.ts
        ├── prisma/
        │   └── schema.prisma
        ├── tests/
        │   ├── integration/
        │   └── unit/
        ├── .env
        ├── .env.example
        ├── .eslint.json
        ├── .prettierrc.json
        ├── jest.config.js
        ├── package.json
        └── tsconfig.json
        ```
*   [x] **Environment Variables:**
    *   [x] Configure `dotenv` to load root `.env` file.
    *   [x] Remove local `backend/.env` and `backend/.env.example`.
    *   [x] Resolve Prisma migration failure (likely by using correct `DATABASE_URL` from root `.env`).
    *   [x] Finalize environment variable setup (using root `.env`).
    - All sub-tasks for Phase 1 are now complete.

## Phase 2: User Management & Authentication

*   [x] **Teacher Model & API:**
    *   [x] Implement API for `Teacher` registration (username, email, password).
    *   [x] Secure password storage (hashing with bcrypt).
*   [x] **Teacher Authentication:**
    *   [x] Implement login endpoint for teachers (email/password), returning JWT.
    *   [x] Create authentication middleware (`src/middleware/auth.ts`) to protect teacher-specific routes using JWT.
*   [x] **Player Model & Identification:**
    *   [x] Logic for anonymous `Player` identification (e.g., generate and use a `cookieId` or similar unique ID).
    *   [x] API endpoint for player "registration" (anonymous or with optional account creation: username, optional email/password).
    *   [x] If accounts: secure password storage and JWT logic similar to teachers.
*   [x] **Testing:**
    *   [x] Unit tests for user model logic (password hashing, validation).
    *   [x] Integration tests for registration, login endpoints, and auth middleware.

- All sub-tasks for Phase 2 are now complete.

---

## Phase 3: Game & Question Management (Teacher-Focused)

*   [x] **Question Model & API:**
    *   [x] Implement CRUD API endpoints for `Question`s (e.g., `/api/v1/questions`), accessible by authenticated teachers.
    *   [x] Ensure `teacherId` is associated with created questions.
    *   [x] Validate question data.
*   [x] **QuizTemplate Model & API:**
    *   [x] Implement CRUD API endpoints for `QuizTemplate`s (e.g., `/api/v1/quiz-templates`), accessible by authenticated teachers.
    *   [x] Handle association of `Question`s to `QuizTemplate`s, including order (via `QuestionsInQuizTemplate`).
    *   [x] Validate `QuizTemplate` data.
*   [x] **Testing:**
    *   [x] Unit tests for validation logic.
    *   [x] Integration tests for all CRUD endpoints for `Question`s and `QuizTemplate`s, including authorization.
    *   [x] Fixed TypeScript errors in test files related to mock objects and type declarations.
    *   [x] Fixed date format comparison issues in test assertions.
    *   [x] Added setupServer function to server.ts for integration tests.
    *   [x] Fixed PlayMode enum type issues by defining the appropriate string literal type.

- All sub-tasks for Phase 3 are now complete.

---

## Phase 4: Game Instance Management

*   [x] **GameInstance Model & API:**
    *   [x] API endpoint for teachers to launch a `GameInstance` from a `QuizTemplate` (e.g., `/api/v1/games`).
    *   [x] Generate a unique `accessCode`.
    *   [x] Store `GameInstance` details.
*   [x] **GameParticipant Model & Logic:**
    *   [x] Logic for `Player`s to join a `GameInstance` using the `accessCode`.
    *   [x] Create `GameParticipant` records.
    *   [x] Implement answer submission and scoring.
*   [x] **API Endpoints:**
    *   [x] Endpoint to fetch `GameInstance` details by `accessCode`.
    *   [x] Endpoints to manage `GameInstance` status (start, end by teacher).
    *   [x] Endpoint for players to join games with access codes.
    *   [x] Endpoint for teachers to view their active games.
*   [x] **Testing:**
    *   [x] Unit tests for `GameInstanceService` methods.
    *   [x] Unit tests for `GameParticipantService` methods.
    *   [x] Unit tests for `accessCode` generation.
    *   [x] Integration tests for launching games, player joining, status updates.

- **Phase 4 completed on May 14, 2025!** All required services, endpoints, and tests have been implemented for game instance management. 
  - Note: Some tests still require TypeScript fixes, especially in the GameParticipantService related to JSON type handling.

---

## Phase 5: Real-time Core Logic (Socket.IO Setup)

*   [x] **Socket.IO Integration:**
    *   [x] Integrate Socket.IO with the Express server.
    *   [x] Configure CORS and transport settings.
    *   [x] Define main Socket.IO connection endpoint (`/api/socket.io` or integrate with Express server).
*   [x] **Redis Adapter for Socket.IO:**
    *   [x] Install `@socket.io/redis-adapter` for integration with ioredis.
    *   [x] Configure Socket.IO to use the Redis adapter.
*   [x] **Basic Connection Handling:**
    *   [x] Implement connection/disconnection event handlers.
    *   [x] Basic authentication/identification for socket connections (pass JWT or player ID).
*   [x] **Room Management Utilities:**
    *   [x] Develop helper functions for joining/leaving Socket.IO rooms.
    *   [x] Create utilities for room state persistence in Redis.
    *   [x] Implement room-based broadcasting with exclusion options.
*   [x] **Testing:**
    *   [x] Basic integration tests for Socket.IO connection with authentication.
    *   [x] Unit tests for room joining/leaving logic and utilities.

- **Phase 5 completed on May 14, 2025!** The real-time infrastructure for Socket.IO has been successfully integrated with Redis adapter for horizontal scaling. Basic connection handlers and room management utilities are now in place.

---

## Phase 6: Lobby Implementation (Socket.IO)

*   [x] **Lobby Handler (`src/sockets/handlers/lobbyHandler.ts`):
    *   [x] Manage players waiting for a game using `accessCode`.
    *   [x] Socket events: `join_lobby`, `leave_lobby`, `get_participants`, `participants_list`, `participant_joined`, `participant_left`, `redirect_to_game`, `game_started`.
    *   [x] Use rooms like `lobby_${accessCode}`.
    *   [x] Implement proper room management with Socket.IO.
*   [x] **State Management (Redis-backed):**
    *   [x] Store lobby participant lists/info in Redis for persistence and multi-instance support.
    *   [x] Implement cleanup of Redis data when players leave or disconnect.
*   [x] **Testing:**
    *   [x] Integration test structure for lobby joining, participant updates, and game status checks.
    *   [x] Basic tests for Socket.IO communication within lobbies.
    *   [x] Fixed TypeScript errors in socket.io-client tests
    *   [x] Fixed Redis connection issues in tests
    *   [x] Fixed database setup for the PostgreSQL test database

- **Phase 6 completed on May 15, 2025!** The lobby implementation with Socket.IO now supports players joining game lobbies with real-time updates and proper Redis-based state management for horizontal scaling. All tests are now passing with proper database, Redis, and Socket.IO integration. Initial temporary safeguards (try/catch blocks) in test files have been removed while maintaining 100% test pass rate.

---

## Phase 7: Game Logic (Socket.IO)

*   [x] **Game Handler (`src/sockets/handlers/gameHandler.ts`):
    *   [x] Manage live game play for students.
    *   [x] Socket events: `join_game`, `game_answer`, `game_question`, `game_timer_update`, `teacher_update`, `game_end`, `explanation`.
    *   [x] Use `game_${accessCode}` room.
*   [x] **Game Logic:**
    *   [x] Serving questions.
    *   [x] Timer management (synchronized with teacher dashboard).
    *   [x] Answer processing and scoring (refer to `backend-backup` for existing scoring logic if needed, adapt to TS).
    *   [x] Leaderboard updates.
    *   [x] `explanation` event emission.
*   [x] **State Management (`gameState` in Redis):**
    *   [x] Store active game states (participants, questions, current question, answers, timer, paused status) in Redis.
*   [x] **Testing:**
    *   [x] Unit tests for scoring logic, timer logic.
    *   [x] Integration tests for the full game flow with Redis state.

---

## Phase 8: Teacher Dashboard & Game Control (Socket.IO)

*   [x] **Teacher Control Handler (`src/sockets/handlers/teacherControlHandler.ts`):
    *   [x] Manage teacher dashboard interactions for controlling a game.
    *   [x] Socket events: `join_teacher_control`, `set_question`, `timer_action`, `lock_answers`.
    *   [x] Server to Client: `game_control_state`, `timer_update_control`.
    *   [x] Use `teacher_control_${gameId}` room. (Note: `gameId` here is the DB ID of the GameInstance).
*   [x] **Game Control Logic:**
    *   [x] Advancing questions.
    *   [x] Starting/pausing/stopping timers.
    *   [x] Locking/unlocking answer submissions.
    *   [x] Synchronizing state with `gameState` in Redis and broadcasting updates to `game_${accessCode}` room.
*   [x] **State Management (`gameControlState` in Redis):**
    *   [x] Store teacher dashboard specific state in Redis.
*   [x] **Testing:**
    *   [x] Integration tests for teacher actions and their effect on game state and player views, with Redis state.

---

## Phase 9: Special Modes & Additional Features

*   [x] **Projector Mode:**
    *   [x] Socket handler and logic for `projector_${gameId}` room.
    *   [x] Serve relevant game state for classroom display (read from Redis).
    *   [x] Integration tests and build passing for Projector Mode.
*   [ ] **Game Modes (Live, Differed, Self-paced):**
    *   [ ] **Live Mode:** Synchronous, real-time play. All players start and progress together, with timers and scoring.
    *   [ ] **Differed (Asynchronous) Mode:** Same as live in terms of question order, timer, and scoring, but players can join and start after the scheduled time within a defined participation window. Each player's timer starts when they begin. Requires adapting game logic, API endpoints, and database models (set `isDiffered`, `differedAvailableFrom`, `differedAvailableTo`).
    *   [ ] **Self-paced Mode:** Same questions as live/differed, but there is no timer and no score. Players can complete at their own pace, and results are not ranked. Requires adapting game logic, API endpoints, and database models (set `isSelfPaced`).
    *   [ ] Update participation and leaderboard logic for differed and self-paced play (per-user timing, no score for self-paced).
    *   [ ] Implement and test the full differed and self-paced mode flows (timing, participation window, per-user timing, no score for self-paced).
    *   [ ] Add/expand tests for differed and self-paced mode functionality.
*   [ ] **API Endpoints Review:**
    *   [ ] Ensure all necessary API endpoints from `docs/README.md` and `docs/backend.md` are implemented and documented, including for all game modes.
*   [ ] **Testing:**
    *   [x] Tests for projector mode updates.
    *   [ ] Tests for differed and self-paced mode functionality.

---

## Phase 9: Tournament Creation and Real-Time Orchestration (Student Perspective)

### Current State and Gaps

1. **Student Tournament Creation**
   - The backend now allows a student to create a game instance with `playMode: "tournament"` via `POST /api/v1/games`.
   - However, the endpoint requires a `quizTemplateId`. There is no backend logic to generate a quiz template on-the-fly from gradeLevel, discipline, themes, and number of questions. This must be implemented for a true student-driven flow.

2. **Starting a Tournament as a Student**
   - There is no explicit endpoint for a student to start their tournament (change status to "active").
   - Existing status update endpoints are teacher-protected. Logic must be added to allow the student-creator to start their own tournament.

3. **Real-Time Tournament Orchestration (Socket.IO)**
   - The backend currently implements real-time events (lobby, live, timer, feedback, leaderboard, etc.) for teacher/classroom games only.
   - For student-created tournaments, none of the following are implemented:
     - Sending payloads to a lobby room when a tournament starts
     - Sending questions to a live room for a tournament
     - Sending timer events (start, stop) to a live room for a tournament
     - Sending correct answers and feedback at the end of each question for a tournament
     - Closing the tournament and sending a final event to the live room
     - Computing scores and leaderboard for a tournament
   - All of these must be implemented for full student tournament support.

4. **Authorization**
   - The backend must ensure that only the student who created the tournament can start and control it.

### Next Steps (for implementation and testing)
- Implement quiz template generation for students (from gradeLevel, discipline, themes, nb of questions).
- Add/adjust endpoint to allow student-initiated tournament start (status change, event emission).
- Implement/extend Socket.IO logic for tournaments (lobby, live, timer, feedback, leaderboard, etc.).
- Add/adjust authorization logic for student tournament control.
- Write and run tests for all new endpoints and real-time flows.

---

**This phase is required for full support of student-driven tournaments and real-time orchestration.**

---

## Phase 10: Testing, Refinement & Documentation (Ongoing)

*   [ ] **Comprehensive Testing:**
    *   [ ] Increase test coverage.
    *   [ ] Edge cases and error handling.
*   [ ] **Refactoring & Optimization:**
    *   [ ] Code review for DRYness, clarity, performance.
    *   [ ] Optimize Redis usage and database queries.
*   [ ] **Error Handling & Resilience:**
    *   [ ] Robust global error handling middleware.
    *   [ ] Graceful error handling in socket events.
*   [ ] **Security:**
    *   [ ] Review for OWASP Top 10.
    *   [ ] Input validation.
    *   [ ] Authorization checks.
*   [ ] **Documentation:**
    *   [ ] API documentation (Swagger/OpenAPI or Markdown).
    *   [ ] Code comments.
    *   [ ] Update `docs/backend/backend-architecture.md` and other relevant docs.
*   [ ] **Deployment Considerations:**
    *   [ ] Build scripts.
    *   [ ] Configuration for production environment (Redis connection, etc.).
