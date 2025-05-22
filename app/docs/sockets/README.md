# Socket Communication Documentation

This directory contains documentation for MathQuest's socket-based communication system.

## Socket.IO Implementation

MathQuest uses Socket.IO for real-time communication between the frontend and backend. This enables features like:

- Real-time quiz updates
- Live tournament leaderboards
- Instant feedback on answers
- User presence and participation tracking

## Event Structure

Socket events follow a consistent naming convention:

- `quiz_*` - Events related to quiz management and participation
- `tournament_*` - Events related to tournament management and participation
- `lobby_*` - Events related to listing and joining quizzes/tournaments

## Key Event Types

- **State Update Events** - Notify clients of state changes
- **Action Events** - Trigger actions on the server
- **Notification Events** - Provide notifications to users
- **Error Events** - Notify clients of errors

## Event Flow

1. Client emits event to server
2. Server validates the event data
3. Server processes the event and updates state
4. Server emits events to relevant clients
5. Clients update their state based on received events

## Redis Data Structures for Participant Management

To manage participant state, connection status, and mappings between `userId` and `socket.id` across different game instances, the backend utilizes several Redis data structures. These structures are crucial for handling joins, disconnections, and reconnections robustly. The `<accessCode>` in the keys refers to the unique code for a game session.

### 1. Participant Data: `mathquest:game:participants:<accessCode>`

*   **Type:** Hash
*   **Key:** `userId` (String) - The unique identifier for the participant.
*   **Value:** JSON String - An object containing participant details.
    *   `userId`: (String) The participant's unique ID.
    *   `username`: (String) The participant's display name.
    *   `type`: (String, e.g., 'student', 'teacher') The type of participant.
    *   `joinedAt`: (ISOString) Timestamp of when the participant joined.
    *   `online`: (Boolean) Current connection status (`true` if connected, `false` if disconnected).
    *   `lastSocketId`: (String) The most recent `socket.id` associated with this user for this game.
    *   `score`: (Number, optional) Current score in the game.
    *   `progress`: (Number, optional) Current progress in the game.
    *   Other game-specific data may be included.
*   **Purpose:** Stores comprehensive information about each participant in a game, keyed by their `userId`. This is the central source of truth for participant state.

### 2. User ID to Socket ID Mapping: `mathquest:game:userIdToSocketId:<accessCode>`

*   **Type:** Hash
*   **Key:** `userId` (String)
*   **Value:** `socket.id` (String) - The current (or last active) socket ID for the given `userId`.
*   **Purpose:** Allows quick lookup of a user's active socket ID. This is updated on join/reconnect and used when a user might have multiple connections over time (e.g., due to browser refresh or network issues), ensuring we can target the latest connection.

### 3. Socket ID to User ID Mapping: `mathquest:game:socketIdToUserId:<accessCode>`

*   **Type:** Hash
*   **Key:** `socket.id` (String)
*   **Value:** `userId` (String) - The `userId` associated with the given socket ID.
*   **Purpose:** Allows quick lookup of a `userId` when only a `socket.id` is available (e.g., during a raw socket disconnection event). This mapping is crucial for identifying which user has disconnected.

### Management and Flow:

*   **On Join/Reconnect (`joinGameHandler.ts`, `sharedLiveHandler.ts`):**
    1.  Participant data is added/updated in `mathquest:game:participants:<accessCode>` with `online: true` and `lastSocketId` set to the new `socket.id`.
    2.  The `mathquest:game:userIdToSocketId:<accessCode>` hash is updated with the `userId` -> new `socket.id` mapping.
    3.  The `mathquest:game:socketIdToUserId:<accessCode>` hash is updated with the new `socket.id` -> `userId` mapping.
*   **On Disconnect (`disconnectHandler.ts`):**
    1.  The `socket.id` is used to look up the `userId` from `mathquest:game:socketIdToUserId:<accessCode>`.
    2.  The participant's entry in `mathquest:game:participants:<accessCode>` is updated to `online: false`.
    3.  The entry for the disconnected `socket.id` is removed from `mathquest:game:socketIdToUserId:<accessCode>`.
    4.  If the disconnected `socket.id` was the one stored in `mathquest:game:userIdToSocketId:<accessCode>` for that `userId` (i.e., it was their last known active socket), that mapping might be cleared or handled based on reconnection policies. Typically, `userIdToSocketId` retains the last active socket ID to facilitate reconnection scenarios where the user might rejoin with the same `userId` but a new `socket.id`. The `lastSocketId` field in the participant data serves a similar purpose.

This unified approach ensures consistent participant tracking across all game modes and simplifies handling user presence and reconnections.

## User Identification Convention

**Unified userId:**

All socket authentication and event payloads use `userId` as the unique identifier for any user (teacher, student, admin, etc.).

- The legacy fields `teacherId` and `studentId` are deprecated and should not be used in new code or documentation.
- If you find any reference to `teacherId` or `studentId` in code, tests, or documentation, update it to use `userId` for consistency.

This ensures a single, unified approach to user identification across the entire MathQuest codebase.

## Related Documentation

- [Socket Event Reference](event-reference.md) — Complete, up-to-date list of all socket events and payloads.
- [Socket Authentication](socket-authentication.md) — How socket authentication and authorization is handled.
- [Socket Testing](socket-testing.md) — How to test socket logic and event flows.
- [Practice Mode Flow](practice-mode-flow.md) — Detailed explanation of the practice/differed mode event flow.
