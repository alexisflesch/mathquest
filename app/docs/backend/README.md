# MathQuest Backend Overview

This document provides a comprehensive technical reference for the MathQuest backend, focusing on real-time game logic, state management, and event-driven architecture. It is intended for developers and agents who need to understand, debug, or extend the backend logic.

---

## 1. Architecture & Main Concepts

- **Node.js + TypeScript**: The backend is built with Node.js and TypeScript for type safety and maintainability.
- **Prisma ORM**: Used for all database access (PostgreSQL).
- **Socket.IO**: Handles all real-time communication (quizzes, tournaments, dashboards, projectors).
- **Redis**: Used for horizontal scaling and as a fast in-memory store for game state, participants, answers, and leaderboards.
- **Express**: Serves the REST API (see `/docs/api/` for details).

---

## 2. Key Backend Components

- **server.ts**: Main entry point. Sets up Express, loads environment, mounts API, and initializes Socket.IO with Redis adapter.
- **sockets/**: All real-time logic, event handlers, and state management for quizzes, tournaments, lobbies, and teacher dashboards.
- **core/services/**: Business logic for users, questions, game templates, game instances, and participants. All DB access is via Prisma.
- **db/prisma.ts**: Prisma client setup.
- **utils/logger.ts**: Centralized logging utility.

---

## 3. Real-Time State & Event Flow

### State Management
- **Redis** is used to store transient game state (active games, participants, answers, leaderboards) for fast access and multi-server support.
- **In-memory state** is used for per-process logic, but all critical state is mirrored in Redis.

### Event Flow
1. **Client emits event** (e.g., join_game, game_answer, join_dashboard)
2. **Socket.IO handler** validates and processes the event
3. **State is updated** in Redis and/or the database
4. **Server emits events** to relevant clients/rooms (e.g., game state, leaderboard, question, results)
5. **Clients update UI** based on received events

---

## 4. Main Socket Domains & Handlers

- **Lobby**: Handles joining/leaving game lobbies, tracks participants in Redis, emits participant lists.
- **Game**: Handles joining games, submitting answers, requesting participants, and disconnects. Manages per-game state, answer collection, and scoring.
- **Teacher Control**: Handles teacher dashboard events (set question, timer actions, lock/unlock answers, end game). Controls game flow and emits state to students/projectors.
- **Tournament**: Handles tournament-specific events, including differed (asynchronous) mode.
- **Projector**: Handles real-time display for classroom projectors (read-only view of game state, leaderboard, etc).

---

## 5. Core Services (Business Logic)

- **UserService**: Registration, authentication (JWT), and user management.
- **QuestionService**: CRUD for questions, filtering, and search.
- **GameTemplateService / QuizTemplateService**: Creation, update, and management of game/quiz templates (ordered questions, metadata, etc).
- **GameInstanceService**: Creation and management of game instances (live or differed), access code generation, status updates.
- **GameParticipantService**: Handles joining games, answer submission, and participant state.
- **GameStateService**: Manages per-game state in Redis (current question, timer, participants, answers, leaderboard).

---

## 6. Game State & Flow

- **Game Lifecycle**: Teacher creates a game template → launches a game instance → students join via access code → teacher controls flow (questions, timer, lock/unlock) → answers are collected and scored → leaderboard is updated in real time.
- **Differed Mode**: Games can be set as self-paced (differed), allowing students to join and complete at their own pace within a time window.
- **Leaderboard**: Calculated in real time using Redis sorted sets, updated after each question.
- **Timer**: Per-question timers managed in Redis, with support for pause/resume and per-question time limits.

---

## 7. Error Handling & Logging

- All errors are logged with context using the logger utility.
- Socket events and REST endpoints validate payloads (Zod schemas for socket events).
- Global error handler for Express ensures consistent error responses.

---

## 8. Extensibility & Best Practices

- All business logic is in service classes for testability and separation of concerns.
- Socket event handlers are modular and grouped by domain.
- Shared types are imported from `@shared/types` for consistency across backend and frontend.
- All real-time state is mirrored in Redis for reliability and scaling.

---

## 9. Related Documentation
- [Backend Architecture](backend-architecture.md)
- [State Models](state-models.md)

This directory contains documentation for the MathQuest backend, including architecture, state management, and real-time logic.

---

_Last updated: 2025-05-20_
