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

- **State Update Events** - Events that notify clients of state changes
- **Action Events** - Events that trigger actions on the server
- **Notification Events** - Events that provide notifications to users
- **Error Events** - Events that notify clients of errors

## Event Flow

1. Client emits event to server
2. Server validates the event data
3. Server processes the event and updates state
4. Server emits events to relevant clients
5. Clients update their state based on received events

## Related Documentation

- [Socket Event Reference](event-reference.md) - Complete list of socket events
- [Socket Authentication](socket-authentication.md) - How socket authentication works
- [Socket Testing](socket-testing.md) - Guide to testing socket communications
