# Socket.IO Teacher Control Events

These events are used by the teacher dashboard/control panel for real-time game management.

## Server-to-Client Events

### `game_control:question_set`
- **Payload:** `{ questionIndex: number, timer: {...} }`
- **Description:** Notifies teacher dashboard when a new question is set.

### `game_control:question_ended`
- **Payload:** `{ questionIndex: number, answers: {...}, leaderboard: [...] }`
- **Description:** Notifies teacher dashboard when a question ends, with answer and leaderboard data.

---

## Notes
- All events are namespaced under `game_control:`.
- See `todo-remove-legacy.md` for any legacy events (none found as of last audit).
