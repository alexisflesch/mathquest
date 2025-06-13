# Socket.IO Projector Events

These events are used for projector mode, allowing a live display of game state for an audience.

## Client-to-Server Events

### `projector:join_projector`
- **Payload:** `gameId: string`
- **Description:** Join the projector room for a specific game instance.

### `projector:leave_projector`
- **Payload:** `gameId: string`
- **Description:** Leave the projector room.

## Server-to-Client Events

### `projector:projector_state`
- **Payload:** `{ accessCode: string, ...gameState }`
- **Description:** Full game state for projector display.

### `game:error`
- **Payload:** `{ message: string }`
- **Description:** Error notification.

---

## Notes
- All events are namespaced under `projector:`.
- See `todo-remove-legacy.md` for any legacy events (none found as of last audit).
