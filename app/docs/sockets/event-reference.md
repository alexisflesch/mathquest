# Socket Event Reference

This document lists all Socket.IO events used in MathQuest, their payloads, and which handler emits/receives them.

## Quiz Events (`quiz_*`)

| Event Name             | Direction      | Payload Example                | Description                                 |
|------------------------|---------------|-------------------------------|---------------------------------------------|
| `quiz_start`           | server → all  | `{ quizId }`                  | Notifies clients that a quiz has started    |
| `quiz_question`        | server → all  | `{ question, index }`         | Sends a new quiz question                   |
| `quiz_answer`          | client → server| `{ answer, userId }`          | Student submits an answer                   |
| `quiz_results`         | server → all  | `{ results, leaderboard }`     | Broadcasts results after a question         |
| `quiz_end`             | server → all  | `{ finalLeaderboard }`         | Notifies clients that the quiz has ended    |
| `quiz_error`           | server → client| `{ error }`                   | Sends error messages                        |

## Tournament Events (`tournament_*`)

| Event Name                 | Direction      | Payload Example                | Description                                 |
|----------------------------|---------------|-------------------------------|---------------------------------------------|
| `tournament_join`          | client → server| `{ tournamentId, userId }`    | Join a tournament lobby                     |
| `tournament_start`         | server → all  | `{ tournamentId }`             | Tournament begins                           |
| `tournament_question`      | server → all  | `{ question, index }`          | Sends a tournament question                 |
| `tournament_answer`        | client → server| `{ answer, userId }`          | Student submits an answer                   |
| `tournament_results`       | server → all  | `{ results, leaderboard }`     | Broadcasts results after a question         |
| `tournament_end`           | server → all  | `{ finalLeaderboard }`         | Tournament ends, send final results         |
| `tournament_error`         | server → client| `{ error }`                   | Sends error messages                        |

## Lobby Events (`lobby_*`)

| Event Name             | Direction      | Payload Example                | Description                                 |
|------------------------|---------------|-------------------------------|---------------------------------------------|
| `lobby_join`           | client → server| `{ lobbyId, userId }`         | Join a lobby                                |
| `lobby_leave`          | client → server| `{ lobbyId, userId }`         | Leave a lobby                               |
| `lobby_update`         | server → all  | `{ participants }`             | Updates participant list                     |
| `lobby_status`         | server → all  | `{ status }`                   | Sends lobby/game status                      |

## General/Error Events

| Event Name             | Direction      | Payload Example                | Description                                 |
|------------------------|---------------|-------------------------------|---------------------------------------------|
| `disconnect`           | server → client| `{ reason }`                  | Notifies client of disconnection            |
| `error`                | server → client| `{ error }`                   | General error event                         |

> **Note:** For detailed payload schemas, see the backend TypeScript types in the corresponding handler files.
