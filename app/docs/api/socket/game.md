# Socket.IO Game Events

These events manage real-time game state, question/answer flow, and leaderboard updates.

## Client-to-Server Events

### `game:join`
- **Payload:** `{ accessCode: string, userId: string, username: string, avatarEmoji?: string, playMode: 'quiz' | 'tournament' | 'practice' }`
- **Description:** Join a live game room. Server adds the user and emits initial state.

### `game:answer`
- **Payload:** `{ accessCode: string, userId: string, questionUid: string, answer: any, timeSpent: number, playMode?: 'quiz' | 'tournament' | 'practice' }`
- **Description:** Submit an answer to the current question.

## Server-to-Client Events

### `game:question`
- **Payload:** `{ question: {...}, timer: number, questionIndex: number, totalQuestions: number, questionState: string }`
- **Description:** New question is active. Sent to all players.

### `game:question_ended`
- **Payload:** `{ questionIndex: number }`
- **Description:** Current question ended. Sent to all players.

### `game:leaderboard_update`
- **Payload:** `{ leaderboard: Array<{ userId: string, score: number, ... }> }`
- **Description:** Updated leaderboard (top 10).

### `game:ended`
- **Payload:** `{ accessCode: string }`
- **Description:** Game has ended.

### `game:error`
- **Payload:** `{ message: string }`
- **Description:** Error notification.

---

## Notes
- All events are namespaced under `game:`.
- See `todo-remove-legacy.md` for any legacy events (none found as of last audit).
