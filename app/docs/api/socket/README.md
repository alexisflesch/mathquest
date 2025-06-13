# MathQuest Socket.IO API Overview

This document provides an overview of the real-time Socket.IO API for MathQuest, including event structure, authentication, and navigation to resource-specific event documentation.

## Connection & Authentication
- Socket.IO endpoint: `/api/socket.io`
- Authentication is required for most events (see backend for details).
- On connection, the server emits `connection_established` with user/session info.

## Event Categories
- **Lobby Events**: Joining/leaving lobbies, participant updates.
- **Game Events**: Real-time game state, question/answer flow, leaderboard, etc.
- **Tournament Events**: Tournament-specific actions and updates.
- **Teacher Control Events**: Teacher dashboard and control panel events.
- **Projector Events**: Projector mode for live display.

## Documentation Structure
- [Lobby Events](./lobby.md)
- [Game Events](./game.md)
- [Tournament Events](./tournament.md)
- [Teacher Control Events](./teacher-control.md)
- [Projector Events](./projector.md)

---

See each linked document for detailed event descriptions, payloads, and usage notes.

## Legacy/Deprecated Events
- See `todo-remove-legacy.md` for any legacy or deprecated events (to be updated as audit continues).
