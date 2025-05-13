# MathQuest API - Technical Reference

This document provides a comprehensive, route-by-route reference for all API endpoints in `/src/app/api`. Each section documents the endpoint's purpose, HTTP methods, request/response formats, authentication, and business logic.

---

## Table of Contents
- [Tournament API](#tournament-api)
- [Quiz API](#quiz-api)
- [Tournament Leaderboard API](#tournament-leaderboard-api)
- [Questions API](#questions-api)
- [My Tournaments API](#my-tournaments-api)
- [Auth API](#auth-api)
- [Other Endpoints](#other-endpoints)
- [Can Play Differed API](#can-play-differed-api)
- [Socket Events](#socket-events)

---

## Tournament API
**Route:** `/api/tournament`

- **POST**
  - `action: 'create'`: Creates a new tournament (teacher or student creator). Generates a unique 6-digit code. Requires quiz info and creator identity.
  - `action: 'start'`: Starts a tournament (sets status to 'en cours'). Requires `tournoiId`.
  - `action: 'end'`: Ends a tournament (sets status to 'terminé'). Requires `tournoiId`.
  - Returns status, message, and tournament info.
- **GET**
  - By `code`: Returns tournament by code.
  - By `id`: Returns tournament by ID.
  - By `enseignant_id` and `questions_ids`: Returns tournament for a teacher and exact questions set.
  - No params: Returns all tournaments.

---

## Quiz API
**Route:** `/api/quiz`

- **GET**
  - Requires `enseignant_id` (teacher ID).
  - Returns all quizzes for the teacher, with metadata.
- **POST**
  - Creates a new quiz. Requires `nom`, `enseignant_id`, and `questions_ids`.
  - Optional: `type`, `niveaux`, `categories`, `themes`.
  - Returns the created quiz object.

---

## Tournament Leaderboard API
**Route:** `/api/tournament-leaderboard`

- **GET**
  - Requires `code` (tournament code).
  - Returns the leaderboard array for the tournament (from DB), or empty if not found.

---

## Questions API
**Route:** `/api/questions`

- **GET**
  - Supports filters: `discipline`, `niveau`, `theme`, `themes` (comma-separated), `limit`, `offset`, `shuffle`.
  - Returns a (possibly shuffled) list of questions matching filters, paginated.

---

## My Tournaments API
**Route:** `/api/my-tournaments`

- **GET**
  - Requires `cookie_id` (student identity).
  - Returns:
    - `created`: Tournaments created by the student (not yet started)
    - `played`: Tournaments the student has played, with score and ranking

---

## Auth API
**Route:** `/api/auth`

- **POST**
  - `action: 'teacher_signup'`: Registers a new teacher. Requires admin password, teacher info, and avatar.
  - `action: 'teacher_login'`: Authenticates a teacher. Requires email and password. Sets a cookie and upserts a Joueur record for the teacher.
  - Returns status, message, and teacher info.

---

## Other Endpoints
- `/api/teacher/quiz/[quizId]/questions`: Get all questions for a quiz (by quizId).
- `/api/quiz/[quizId]/tournament-code`: Get the tournament code linked to a quiz.
- `/api/tournament-status`: Get the status of a tournament by code.
- `/api/enseignant`: Teacher info and management.
- `/api/joueur`: Student info and management.
- `/api/questions/filters`: Get available filters (niveaux, disciplines, themes) for questions.
- `/api/tournaments`: List all tournaments (admin/teacher view).
- `/api/auth/logout`, `/api/auth/status`, `/api/auth/reset-password`: Auth/session management.
- `/api/logger`: Logging endpoint for client logs.

---

## Can Play Differed API
**Route:** `/api/can-play-differed`

- **GET**
  - Requires `code` (tournament code) and `userId` (joueur_id, usually from `mathquest_cookie_id`).
  - Returns `{ canPlay: true }` if the user has not already played (live or differed) in this tournament.
  - Returns `{ canPlay: false, reason: 'Already played' }` if the user has already played.
  - Returns `{ error: 'Tournament not found' }` with 404 if the tournament does not exist.
  - Business logic: Differed mode is always open for tournaments. The only restriction is whether the user has already played in this tournament.

---

## Socket Events

### join_quiz
**Event Name:** `join_quiz`

**Description:**
Allows a user to join a quiz session. This initializes the quiz state for the user and sets up the necessary socket connections.

**Payload:**
```json
{
  "quizId": "string", // The unique identifier for the quiz
  "userId": "string"  // The unique identifier for the user
}
```

**Response:**
- Emits `quiz_state` event with the current state of the quiz.
- Example response:
```json
{
  "quizId": "string",
  "state": { ... } // The current state of the quiz
}
```

**Notes:**
- This event requires the `quizId` to be valid and the user to have appropriate permissions.
- Logs are generated for debugging purposes.

### quiz_set_question
**Event Name:** `quiz_set_question`

**Description:**
Sets the current question for a quiz session. Updates the quiz state and tracks the question as asked.

**Payload:**
```json
{
  "quizId": "string", // The unique identifier for the quiz
  "questionUid": "string", // The unique identifier for the question
  "questionIdx": "number", // The index of the question in the quiz
  "tournamentCode": "string", // Optional tournament code
  "teacherId": "string" // The teacher's unique identifier
}
```

**Response:**
- No direct response. Updates the quiz state and emits relevant events.

**Notes:**
- Requires valid `quizId` and `questionUid`.
- Logs are generated for debugging purposes.

### quiz_timer_action
**Event Name:** `quiz_timer_action`

**Description:**
Controls the timer for a quiz question (e.g., play, pause, stop).

**Payload:**
```json
{
  "status": "play | pause | stop", // Timer action
  "questionId": "string", // The unique identifier for the question
  "timeLeft": "number", // Remaining time in seconds
  "quizId": "string", // The unique identifier for the quiz
  "tournamentCode": "string" // Optional tournament code
}
```

**Response:**
- No direct response. Updates the timer state and emits relevant events.

**Notes:**
- Requires valid `quizId` and `questionId`.
- Logs are generated for debugging purposes.

### quiz_set_timer
**Event Name:** `quiz_set_timer`

**Description:**
Sets the timer for a quiz question.

**Payload:**
```json
{
  "quizId": "string", // The unique identifier for the quiz
  "timeLeft": "number" // Remaining time in seconds
}
```

**Response:**
- No direct response. Updates the timer state and emits relevant events.

**Notes:**
- Requires valid `quizId`.
- Logs are generated for debugging purposes.

### quiz_lock
**Event Name:** `quiz_lock`

**Description:**
Locks the current quiz question, preventing further answers.

**Payload:**
```json
{
  "quizId": "string" // The unique identifier for the quiz
}
```

**Response:**
- No direct response. Updates the quiz state and emits relevant events.

**Notes:**
- Requires valid `quizId`.
- Logs are generated for debugging purposes.

### quiz_unlock
**Event Name:** `quiz_unlock`

**Description:**
Unlocks the current quiz question, allowing answers to be submitted again.

**Payload:**
```json
{
  "quizId": "string" // The unique identifier for the quiz
}
```

**Response:**
- No direct response. Updates the quiz state and emits relevant events.

**Notes:**
- Requires valid `quizId`.
- Logs are generated for debugging purposes.

### quiz_end
**Event Name:** `quiz_end`

**Description:**
Ends the quiz session and finalizes the state.

**Payload:**
```json
{
  "quizId": "string" // The unique identifier for the quiz
}
```

**Response:**
- No direct response. Updates the quiz state and emits relevant events.

**Notes:**
- Requires valid `quizId`.
- Logs are generated for debugging purposes.

### quiz_pause
**Event Name:** `quiz_pause`

**Description:**
Pauses the quiz session.

**Payload:**
```json
{
  "quizId": "string" // The unique identifier for the quiz
}
```

**Response:**
- No direct response. Updates the quiz state and emits relevant events.

**Notes:**
- Requires valid `quizId`.
- Logs are generated for debugging purposes.

### quiz_resume
**Event Name:** `quiz_resume`

**Description:**
Resumes the quiz session after a pause.

**Payload:**
```json
{
  "quizId": "string" // The unique identifier for the quiz
}
```

**Response:**
- No direct response. Updates the quiz state and emits relevant events.

**Notes:**
- Requires valid `quizId`.
- Logs are generated for debugging purposes.

### quiz_close_question
**Event Name:** `quiz_close_question`

**Description:**
Closes the current quiz question, preventing further answers and finalizing the state for that question.

**Payload:**
```json
{
  "quizId": "string", // The unique identifier for the quiz
  "questionUid": "string" // The unique identifier for the question
}
```

**Response:**
- No direct response. Updates the quiz state and emits relevant events.

**Notes:**
- Requires valid `quizId` and `questionUid`.
- Logs are generated for debugging purposes.

### get_quiz_state
**Event Name:** `get_quiz_state`

**Description:**
Retrieves the current state of the quiz.

**Payload:**
```json
{
  "quizId": "string" // The unique identifier for the quiz
}
```

**Response:**
- Emits `quiz_state` event with the current state of the quiz.
- Example response:
```json
{
  "quizId": "string",
  "state": { ... } // The current state of the quiz
}
```

**Notes:**
- Requires valid `quizId`.
- Logs are generated for debugging purposes.

---

## General Notes
- All endpoints use JSON for request and response bodies.
- Most endpoints use Prisma ORM for DB access.
- Error handling is consistent: returns `{ message | error }` and appropriate HTTP status.
- Authentication for teacher actions is enforced via cookies or explicit teacher ID.
- All endpoints are logged using the centralized logger utility.

---

*This document is auto-generated for AI agent use. For further details, see code comments in `/src/app/api/` and usage in frontend/backend logic.*
