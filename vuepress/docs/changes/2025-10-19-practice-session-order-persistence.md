---
title: Practice — Persist question order across recovery
date: 2025-10-19
tags:
  - backend
  - sockets
  - redis
  - tests
---

# Practice — Persist question order across recovery

Adds an integration-style backend test to ensure the `questionPool` order and `currentQuestionIndex` are persisted in Redis and recovered correctly by `GET_PRACTICE_SESSION_STATE` consumers.

Files:
- `app/backend/tests/integration/practice-session-order-persistence.test.ts`

What it verifies:
- Creating a session without randomization uses deterministic order (first N from DB query).
- After submitting the first answer, `currentQuestionIndex` advances.
- Fetching the session from Redis returns the same `questionPool` and the advanced index; `currentQuestion.uid` points to the expected next question.

Notes:
- The test uses in-memory mocks for Redis and Prisma. It doesn’t hit a real DB.
- This guards against regressions where recovery would rebuild a new pool or reset the index.

Related code:
- `app/backend/src/core/services/practiceSessionService.ts`
