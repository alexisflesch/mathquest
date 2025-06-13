# Game Endpoints

## POST /api/v1/games
- **Description**: Create a new game instance (quiz, tournament, or practice). Allows teacher or student authentication.
- **Authentication**: Optional (teacher or student). If not authenticated, must provide `initiatorStudentId`.
- **Request Body**:
  - `name`: string (required)
  - `gameTemplateId`: string (optional, required for most modes)
  - `playMode`: string (required, one of `quiz`, `tournament`, `practice`)
  - `settings`: object (optional)
  - `gradeLevel`, `discipline`, `themes`, `nbOfQuestions`: required for student-created tournaments if no `gameTemplateId`
  - `initiatorStudentId`: string (optional, for unauthenticated student creation)
- **Response**:
  - `gameInstance`: object (details of the created game)
- **Status Codes**:
  - `201 Created` on success
  - `400 Bad Request` for validation errors
  - `401 Unauthorized` if authentication/initiatorStudentId missing
  - `500 Internal Server Error` on failure

#### Example Request
```json
{
  "name": "Math Battle",
  "playMode": "tournament",
  "gradeLevel": "6",
  "discipline": "algebra",
  "themes": ["fractions", "equations"],
  "nbOfQuestions": 10,
  "initiatorStudentId": "student_abc123"
}
```

---

## GET /api/v1/games/:accessCode
- **Description**: Retrieve a game instance by its access code.
- **Authentication**: None (public)
- **Query Parameters**:
  - `includeParticipants`: boolean (optional, if `true` includes participant details)
- **Response**:
  - `gameInstance`: object (details of the game)
- **Status Codes**:
  - `200 OK` on success
  - `400 Bad Request` for invalid access code
  - `404 Not Found` if game does not exist
  - `500 Internal Server Error` on failure

#### Example Request
`GET /api/v1/games/3141?includeParticipants=true`

---

## GET /api/v1/games/id/:id
- **Description**: Retrieve a game instance by its unique ID. Requires teacher authentication and ownership.
- **Authentication**: Teacher (JWT required)
- **Path Parameters**:
  - `id`: string (required, game instance ID)
- **Response**:
  - `gameInstance`: object (details of the game)
- **Status Codes**:
  - `200 OK` on success
  - `400 Bad Request` if ID missing
  - `403 Forbidden` if not the creator
  - `404 Not Found` if game does not exist
  - `500 Internal Server Error` on failure

#### Example Request
`GET /api/v1/games/id/123456`

---

## POST /api/v1/games/:accessCode/join
- **Description**: Join a game as a player using the access code.
- **Authentication**: None (player ID required in body)
- **Path Parameters**:
  - `accessCode`: string (required, game access code)
- **Request Body**:
  - `userId`: string (required, player ID)
- **Response**:
  - `success`: boolean
  - `gameInstance`: object (game details)
  - `participant`: object (participant details)
- **Status Codes**:
  - `200 OK` on success
  - `400 Bad Request` if player ID missing or join fails
  - `500 Internal Server Error` on failure

#### Example Request
```json
{
  "userId": "student_abc123"
}
```

---

## PUT /api/v1/games/:id/status
## PATCH /api/v1/games/:id/status
- **Description**: Update the status of a game instance (e.g., pending, active, paused, completed, archived). Only the creator (teacher or student) can update.
- **Authentication**: Optional (teacher or student, or x-student-id header)
- **Path Parameters**:
  - `id`: string (required, game instance ID)
- **Request Body**:
  - `status`: string (required, one of `pending`, `active`, `paused`, `completed`, `archived`)
  - `currentQuestionIndex`: number (optional)
- **Response**:
  - `gameInstance`: object (updated game details)
- **Status Codes**:
  - `200 OK` on success
  - `400 Bad Request` if status missing/invalid
  - `401 Unauthorized` if not authenticated
  - `403 Forbidden` if not the creator
  - `404 Not Found` if game does not exist
  - `500 Internal Server Error` on failure

#### Example Request
```json
{
  "status": "active",
  "currentQuestionIndex": 2
}
```

---

## GET /api/v1/games/:code/leaderboard
- **Description**: Get the leaderboard for a given game instance by access code.
- **Authentication**: None (public)
- **Path Parameters**:
  - `code`: string (required, game access code)
- **Response**:
  - Leaderboard data (array/object, see implementation)
- **Status Codes**:
  - `200 OK` on success
  - `404 Not Found` if game does not exist
  - `500 Internal Server Error` on failure

#### Example Request
`GET /api/v1/games/3141/leaderboard`

---

## GET /api/v1/games/:code/state
- **Description**: Get comprehensive game state for a given game instance by access code. Returns both DB and live (Redis) state if available.
- **Authentication**: None (public)
- **Path Parameters**:
  - `code`: string (required, game access code)
- **Response**:
  - `status`: string (game status)
  - `currentQuestionIndex`: number
  - `accessCode`: string
  - `name`: string
  - `gameState`: object (if live, includes current question, timer, etc.)
  - `isLive`: boolean
- **Status Codes**:
  - `200 OK` on success
  - `400 Bad Request` for invalid code
  - `404 Not Found` if game does not exist
  - `500 Internal Server Error` on failure

#### Example Request
`GET /api/v1/games/3141/state`

---

## GET /api/v1/games/teacher/active
- **Description**: Get all active games for the authenticated teacher.
- **Authentication**: Teacher (JWT required)
- **Response**:
  - `games`: array (list of active games)
- **Status Codes**:
  - `200 OK` on success
  - `401 Unauthorized` if not a teacher
  - `500 Internal Server Error` on failure

#### Example Request
`GET /api/v1/games/teacher/active`

---

## POST /api/v1/games/tournament
- **Description**: Create a tournament using the legacy frontend format. Supports both teacher and student creation.
- **Authentication**: Optional (teacher or student, or cree_par_id in body)
- **Request Body**:
  - `action`: string (must be `create`)
  - `nom`: string (required, tournament name)
  - `questions_ids`: array (required, question IDs)
  - `type`, `niveau`, `categorie`, `themes`, `cree_par_id`, `username`, `avatar`: various (legacy support)
- **Response**:
  - `code`: string (access code for the created tournament)
  - `message`: string
- **Status Codes**:
  - `201 Created` on success
  - `400 Bad Request` for validation errors
  - `401 Unauthorized` if user identification missing
  - `500 Internal Server Error` on failure

#### Example Request
```json
{
  "action": "create",
  "nom": "Spring Tournament",
  "questions_ids": ["q1", "q2", "q3"],
  "niveau": "6",
  "categorie": "algebra",
  "themes": ["fractions"],
  "cree_par_id": "student_abc123"
}
```

---

## GET /api/v1/games/instance/:id/edit
- **Description**: Retrieve a game instance by ID with full template data for editing. Only the creator (teacher) can access.
- **Authentication**: Teacher (JWT required)
- **Path Parameters**:
  - `id`: string (required, game instance ID)
- **Response**:
  - `gameInstance`: object (game and template details)
- **Status Codes**:
  - `200 OK` on success
  - `400 Bad Request` if ID missing
  - `403 Forbidden` if not the creator
  - `404 Not Found` if game does not exist
  - `500 Internal Server Error` on failure

#### Example Request
`GET /api/v1/games/instance/123456/edit`

---

## PUT /api/v1/games/instance/:id
- **Description**: Update a game instance (name, playMode, settings). Only the creator (teacher) can update, and only if the game is pending.
- **Authentication**: Teacher (JWT required)
- **Path Parameters**:
  - `id`: string (required, game instance ID)
- **Request Body**:
  - `name`: string (optional)
  - `playMode`: string (optional)
  - `settings`: object (optional)
- **Response**:
  - `gameInstance`: object (updated game details)
- **Status Codes**:
  - `200 OK` on success
  - `400 Bad Request` if ID missing or game not pending
  - `403 Forbidden` if not the creator
  - `404 Not Found` if game does not exist
  - `500 Internal Server Error` on failure

#### Example Request
```json
{
  "name": "Updated Game Name",
  "playMode": "quiz",
  "settings": { "difficulty": "hard" }
}
```

---

## GET /api/v1/games/template/:templateId/instances
- **Description**: Get all game instances for a teacher filtered by template ID.
- **Authentication**: Teacher (JWT required)
- **Path Parameters**:
  - `templateId`: string (required, game template ID)
- **Response**:
  - `gameInstances`: array (list of game instances)
- **Status Codes**:
  - `200 OK` on success
  - `400 Bad Request` if templateId missing
  - `401 Unauthorized` if not a teacher
  - `500 Internal Server Error` on failure

#### Example Request
`GET /api/v1/games/template/abc123/instances`

---

## DELETE /api/v1/games/:id
- **Description**: Delete a game instance. Only the creator (teacher) can delete.
- **Authentication**: Teacher (JWT required)
- **Path Parameters**:
  - `id`: string (required, game instance ID)
- **Response**:
  - No content (204 on success)
- **Status Codes**:
  - `204 No Content` on success
  - `400 Bad Request` if ID missing
  - `401 Unauthorized` if not a teacher
  - `403 Forbidden` if not the creator
  - `404 Not Found` if game does not exist
  - `500 Internal Server Error` on failure

#### Example Request
`DELETE /api/v1/games/123456`
