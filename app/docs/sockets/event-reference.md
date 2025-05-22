# Socket Event Reference

This document lists all Socket.IO events used in MathQuest, their payloads, and which handler emits/receives them.

## Self-Paced (Practice/Differed) Mode

In self-paced (practice/differed) mode:
- The player is responsible for advancing the quiz; there is **no real timer** managed by the backend.
- Practice mode follows this event flow:
  1. Player joins game with `join_game` event including `isDiffered: true`.
  2. Player receives `game_question` with first question.
  3. Player answers with `game_answer` event.
  4. Backend immediately responds with `answer_received` containing correctness feedback.
  5. **Note**: Player must explicitly request the next question with `request_next_question` event.
  6. Backend sends next question with `game_question` event.
  7. For the last question, after reviewing feedback, player must request the next question.
  8. Since there are no more questions, backend responds with `game_ended` with final score.
- All events are sent only to the individual player (never to a shared room).
- The event flow and payloads differ from tournament mode in these ways:
  - No timer events are sent.
  - No leaderboard is calculated or sent.
  - Only the player receives their results and feedback.
  - Players must explicitly request to proceed after each question, including the last one.

---

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

## Practice/Differed Mode Events

| Event Name                   | Direction         | Payload Example                                                                 | Description                                                      |
|------------------------------|-------------------|-------------------------------------------------------------------------------|------------------------------------------------------------------|
| `join_game`                  | client → server   | `{ accessCode, userId, username, avatarUrl?, isDiffered: true }`              | Player joins a practice/differed mode game                       |
| `game_answer`                | client → server   | `{ accessCode, userId, questionId, answer, timeSpent }`                       | Player submits an answer to a question                           |
| `answer_received`            | server → player   | `{ questionId, timeSpent, correct, correctAnswers?, explanation? }`           | Confirms answer receipt and provides correctness feedback        |
| `request_next_question`      | client → server   | `{ accessCode, userId, currentQuestionId }`                                   | Player explicitly requests the next question after feedback      |
| `game_question`              | server → player   | QuestionData object with fields like `uid`, `text`, `answerOptions`, `currentQuestionIndex`, `totalQuestions` | Sent in response to request_next_question with question data     |
| `game_ended`                 | server → player   | `{ accessCode, score, totalQuestions, correct, total }`                       | Sent when all questions are answered with final score            |
| `game_error`                 | server → player   | `{ message, code? }`                                                          | Sent when an error occurs during practice mode flow              |

## Dashboard & Live Quiz Events

| Event Name                   | Direction         | Payload Example                                                                 | Description                                                      |
|------------------------------|-------------------|-------------------------------------------------------------------------------|------------------------------------------------------------------|
| `game_control_state`         | server → teacher  | `{ ...fullDashboardState }`                                                   | Sent to dashboard on join; comprehensive game state for teacher   |
| `dashboard_question_changed` | server → teacher  | `{ questionUid, oldQuestionUid, timer }`                                      | Notifies dashboard of question change                            |
| `game_question`              | server → player   | QuestionData object with fields like `uid`, `text`, `answerOptions`, etc      | Sent to player with question data; in practice mode sent after request_next_question |
| `projection_question_changed`| server → projector| `{ questionUid, questionIndex, totalQuestions, timer }`                       | Sent to projection room on question change                       |
| `quiz_timer_action`         | client → server   | `{ gameId, action, duration? }`                                              | Teacher controls the quiz timer (start, pause, resume, stop, set_duration). Payload: `action` is one of `'start'`, `'pause'`, `'resume'`, `'stop'`, `'set_duration'`; `duration` is in seconds (optional). |

> **Note:** Events like `quiz_state` and `game_state` are not used in the current backend. Use the above events for dashboard and live quiz flows.

## General/Error Events

| Event Name             | Direction      | Payload Example                | Description                                 |
|------------------------|---------------|-------------------------------|---------------------------------------------|
| `disconnect`           | server → client| `{ reason }`                  | Notifies client of disconnection            |
| `error`                | server → client| `{ error }`                   | General error event                         |

> **Note:** For detailed payload schemas, see the backend TypeScript types in the corresponding handler files.
