# Socket.IO Lobby Events

These events manage lobby participation and updates for MathQuest games.

## Client-to-Server Events

### `lobby:join`
- **Payload:** `{ accessCode: string, userId: string, username: string, avatarEmoji?: string }`
- **Description:** Join a game lobby. Server adds the user to the lobby room and updates participant list.

### `lobby:leave`
- **Payload:** `{ accessCode: string }`
- **Description:** Leave a game lobby. Server removes the user from the lobby room.

### `lobby:get_participants`
- **Payload:** `{ accessCode: string }`
- **Description:** Request the current list of lobby participants.

## Server-to-Client Events

### `lobby:participant_joined`
- **Payload:** `{ userId: string, username: string, avatarEmoji?: string, joinedAt: number }`
- **Description:** Notifies all lobby members when a participant joins.

### `lobby:participant_left`
- **Payload:** `{ userId: string }`
- **Description:** Notifies all lobby members when a participant leaves.

### `lobby:participants`
- **Payload:** `{ participants: Array<{ userId: string, username: string, avatarEmoji?: string, joinedAt: number }> }`
- **Description:** Full participant list (sent on join or on request).

---

## Notes
- All events are namespaced under `lobby:`.
- See `todo-remove-legacy.md` for any legacy events (none found as of last audit).
