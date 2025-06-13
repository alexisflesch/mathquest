# Game Control API

This document describes the REST API endpoints for real-time game control in MathQuest (typically used by teachers during live games).

## Base Path
`/api/v1/game-control`

---

## Endpoints

### Get Full Game State
- **GET** `/api/v1/game-control/:accessCode`
- **Auth:** Teacher (required)
- **Response:** `200 OK` with full game state object
- **Errors:** `401`, `403`, `404`, `500`

### Set Current Question
- **POST** `/api/v1/game-control/:accessCode/question`
- **Auth:** Teacher (required)
- **Body:**
  - `questionIndex` (number, required)
- **Response:** `200 OK` with updated state and timer
- **Socket.IO Events:**
  - Emits `game_question` to all players in the game
  - Emits `game_control_question_set` to teacher control room
- **Errors:** `401`, `403`, `404`, `500`

### End Current Question
- **POST** `/api/v1/game-control/:accessCode/end-question`
- **Auth:** Teacher (required)
- **Response:** `200 OK` with updated state and leaderboard
- **Socket.IO Events:**
  - Emits `question_ended` to all players
  - Emits `leaderboard_update` to all players (top 10)
  - Emits `game_control_question_ended` to teacher control room
- **Errors:** `401`, `403`, `404`, `500`

### End Game
- **POST** `/api/v1/game-control/:accessCode/end-game`
- **Auth:** Teacher (required)
- **Response:** `200 OK` with final game state
- **Socket.IO Events:**
  - Emits `game_ended` to all players
- **Errors:** `401`, `403`, `404`, `500`

---

## Notes
- All endpoints require teacher authentication.
- All responses are JSON.
- These endpoints are tightly coupled with real-time Socket.IO events (see Socket.IO API docs for event details).
- See `todo-remove-legacy.md` for any legacy fields or endpoints (none found in this module as of last audit).
