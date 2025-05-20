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

## Related Documentation

- [Socket Event Reference](event-reference.md) — Complete, up-to-date list of all socket events and payloads.
- [Socket Authentication](socket-authentication.md) — How socket authentication and authorization is handled.
- [Socket Testing](socket-testing.md) — How to test socket logic and event flows.
