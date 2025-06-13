# Socket.IO Tournament Events

These events manage real-time tournament flow, including starting tournaments and handling tournament-specific updates.

## Client-to-Server Events

### `tournament:start_tournament`
- **Payload:** `{ accessCode: string }`
- **Description:** Start a tournament (student-creator only). Server validates and begins the tournament game flow.

## Server-to-Client Events

### `tournament:started`
- **Payload:** `{ accessCode: string, ... }`
- **Description:** Tournament has started. Sent to all participants.

### `tournament:error`
- **Payload:** `{ message: string }`
- **Description:** Error notification for tournament actions.

---

## Notes
- Tournament events often overlap with game events (question, leaderboard, etc.).
- All events are namespaced under `tournament:`.
- See `todo-remove-legacy.md` for any legacy events (none found as of last audit).
