# Socket.IO Events

This document outlines the Socket.IO events used for real-time communication in MathQuest.

## Conventions

-   **Namespaces**: Events may be organized under specific namespaces (e.g., `/game`, `/lobby`). If no namespace is specified, the default namespace (`/`) is used.
-   **Payloads**: Event payloads are typically JSON objects. Refer to [Data Contracts](data-contracts.md) for schema definitions.
-   **Acknowledgments**: Some events may expect an acknowledgment callback from the server or client.

---

## Events

_This section will be populated with details for each event, including: Event Name, Namespace, Direction (Client-to-Server, Server-to-Client, Bidirectional), Description, Payload, and Acknowledgment (if any)._

### Connection Events

-   **Event Name**: `connect`
    -   **Direction**: Server-to-Client
    -   **Description**: Emitted when a client successfully connects to the Socket.IO server.
-   **Event Name**: `disconnect`
    -   **Direction**: Server-to-Client
    -   **Description**: Emitted when a client disconnects from the server.

### Lobby Events (Namespace: `/lobby` - Example)

_Details for events like `joinLobby`, `lobbyUpdate`, `createGame`, etc._

### Game Events (Namespace: `/game` - Example)

_Details for events like `joinGame`, `playerJoined`, `gameStateUpdate`, `submitAnswer`, `questionResult`, `timerUpdate`, `gameOver`, etc._

### Chat Events

_Details for events like `sendMessage`, `newMessage`, etc._

---

_More events will be added here as they are documented._
