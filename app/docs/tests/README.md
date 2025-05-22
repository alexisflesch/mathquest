# MathQuest Backend & Socket Testing Guide

This document explains the testing strategy, structure, and conventions for the MathQuest backend and real-time logic.

---

## Overview

MathQuest uses a comprehensive automated testing approach for backend and real-time (Socket.IO) logic. Tests are written in TypeScript and run with Jest. There are three main categories:

- **Unit tests**: Test individual services, utilities, and pure functions in isolation.
- **Integration tests**: Test API endpoints, socket event flows, and multi-component interactions (including Redis, database, and real-time events).
- **Helpers & Support**: Utilities, mocks, and setup/teardown scripts to support tests.

---

## Directory Structure

- `unit/` — Unit tests for core services and utilities (e.g., `gameInstanceService.test.ts`, `questionService.test.ts`)
- `integration/` — Integration tests for API endpoints and socket event flows (e.g., `gameHandler.test.ts`, `lobbyHandler.test.ts`, `gamesApi.test.ts`)
- `helpers/` — Test utility files and mocks (e.g., `jwt.ts`, `mockUtils.ts`)
- `support/` — Test setup/teardown scripts (e.g., `testSetup.ts`, `databaseCleaner.ts`)
- `setupTests.test.ts` — Global test setup
- `socketDisconnectTest.ts` — Specialized socket disconnect scenario

---

## Running Tests

From the `backend/` directory:

- **All tests:**
  ```bash
  npm run test
  ```
- **Unit tests only:**
  ```bash
  npx jest unit
  ```
- **Integration tests only:**
  ```bash
  npx jest integration
  ```

---

## Test Conventions

- **TypeScript-first:** All tests are written in TypeScript for type safety.
- **Isolated state:** Each test suite uses setup/teardown to ensure a clean database and Redis state.
- **Socket.IO tests:** Use `socket.io-client` to simulate real clients and test real-time event flows.
- **Mocks:** Use helpers in `helpers/` for mocking services, JWT, and other dependencies.
- **Test data:** Use support scripts and fixtures for consistent test data (e.g., `mockQuizAndTournament.ts`).

---

## Example Test Files

- `integration/gameHandler.test.ts`: Tests live game event flows via Socket.IO.
- `integration/lobbyHandler.test.ts`: Tests lobby join/leave and participant list events.
- `integration/gamesApi.test.ts`: Tests REST API endpoints for game management.
- `unit/gameInstanceService.test.ts`: Unit tests for the game instance service logic.

---

## Adding New Tests

1. Place new unit tests in `unit/`, integration tests in `integration/`.
2. Use helpers and support scripts for setup/teardown and mocks.
3. Follow existing naming and structure conventions.
4. Run all tests before submitting changes.

---

# JWT Authentication in Integration Tests

**Important:** When writing integration tests for endpoints that require authentication (such as quiz template APIs), you must generate JWT tokens that exactly match backend expectations.

- The backend expects the JWT payload to include `userId`, `username`, and `role` fields.
- The `role` value must be uppercase (e.g., `'TEACHER'`, not `'teacher'`).
- The JWT must be signed with the secret in `process.env.JWT_SECRET` (set in test setup to `'test-secret-key-for-tests'`).
- Use the provided helper (`generateTeacherToken`) and always pass the correct role casing:

```typescript
// Correct usage in tests:
const token = generateTeacherToken('teacher-1', 'teacher-1', 'TEACHER');
```

If you use a lowercase role (e.g., `'teacher'`), the backend will reject the token as malformed or unauthorized.

See also: `backend/tests/helpers/generateTeacherToken.ts` and `src/middleware/auth.ts` for backend verification logic.

---

**Troubleshooting:**
- If you see 401 errors or `jwt malformed` in test output, check the role casing and secret used to sign the JWT.
- The backend will only accept tokens with the correct structure and secret.

---

_Last updated: 2025-05-22_
