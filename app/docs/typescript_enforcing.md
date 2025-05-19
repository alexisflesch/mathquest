# Enforcing Stricter TypeScript for Socket.IO Events

This document outlines the steps to implement and enforce stricter TypeScript typing for Socket.IO events across the MathQuest application (backend, frontend, and tests). The goal is to improve code robustness, catch errors at compile time, and make the event-driven architecture easier to understand and maintain.

## Key Steps:

1.  **Centralize Event Definitions (`shared/types/socketEvents.ts`):**
    *   Create (or ensure it exists) `/home/aflesch/mathquest/app/shared/types/socketEvents.ts`.
    *   This file will be the single source of truth for all Socket.IO event names and their payload structures.
    *   Define the core Socket.IO typing interfaces:
        *   `ClientToServerEvents`: Maps event names emitted by the client to their payload types.
        *   `ServerToClientEvents`: Maps event names emitted by the server to their payload types.
        *   `InterServerEvents`: For server-to-server event typing (if applicable).
        *   `SocketData`: Defines the structure of `socket.data` on the server, allowing type-safe custom properties on socket instances.

2.  **Define Specific Event Payloads:**
    *   Within `/home/aflesch/mathquest/app/shared/types/socketEvents.ts`, define interfaces for each specific event payload. Examples:
        *   `JoinGamePayload`
        *   `GameAnswerPayload`
        *   `ParticipantData` (for representing a game participant)
        *   `QuestionData` (for representing a question sent to the client)
        *   `LeaderboardEntry`
        *   `ErrorPayload`
        *   `NotificationPayload`
        *   Any other custom event payloads.
    *   Ensure all properties within these payloads are accurately typed (e.g., `string`, `number`, `boolean`, other interfaces, or `any` only when truly unavoidable and clearly justified).

3.  **Update Backend (Server-Side):**
    *   **Server Initialization**:
        *   In `/home/aflesch/mathquest/app/backend/src/server.ts` (or where `new Server()` is called), type the Socket.IO server instance:
            ```typescript
            import { Server } from 'socket.io';
            import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '@/shared/types/socketEvents'; // Adjust path as needed

            const io = new Server<
                ClientToServerEvents,
                ServerToClientEvents,
                InterServerEvents,
                SocketData
            >(httpServer, { /* options */ });
            ```
    *   **Event Handlers**:
        *   In all backend socket event handlers (e.g., `/home/aflesch/mathquest/app/backend/src/sockets/handlers/**/*.ts`):
            *   Import the specific payload types from the shared `socketEvents.ts` file.
            *   Type the `payload` parameter of handler functions.
            *   Type the `socket` parameter: `socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>`.
            *   Example:
                ```typescript
                // In gameAnswerHandler.ts
                import { GameAnswerPayload } from '@/shared/types/socketEvents'; // Adjust path
                import { Socket } from 'socket.io';
                import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '@/shared/types/socketEvents';


                export function gameAnswerHandler(io: Server<...>, socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
                    return async (payload: GameAnswerPayload) => {
                        // ...
                    };
                }
                ```
    *   **Emitting Events**:
        *   Ensure all `io.emit(...)`, `socket.emit(...)`, `socket.to(...).emit(...)` calls use event names and payload structures that conform to `ServerToClientEvents`. TypeScript should enforce this if the `io` and `socket` instances are correctly typed.
    *   **Cleanup Old Types**: Remove any redundant or local type definitions for socket events/payloads from backend-specific files (e.g., `/home/aflesch/mathquest/app/backend/src/sockets/handlers/game/types.ts` should be deleted after its contents are migrated).

4.  **Update Frontend (Client-Side):**
    *   **Client Initialization**:
        *   When creating the Socket.IO client instance:
            ```typescript
            import { io, Socket } from 'socket.io-client';
            import { ServerToClientEvents, ClientToServerEvents } from '@/shared/types/socketEvents'; // Adjust path as needed

            const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io("http://localhost:3001", { /* options */ }); // Or your server URL
            ```
    *   **Event Listeners (`socket.on`)**:
        *   Ensure that the callback functions for `socket.on('eventName', callback)` use the correct payload type from `ServerToClientEvents`.
            ```typescript
            socket.on('game_joined', (data) => {
                // 'data' will be typed according to ServerToClientEvents.game_joined
                console.log('Game joined:', data.accessCode);
            });
            ```
    *   **Emitting Events (`socket.emit`)**:
        *   Ensure all `socket.emit('eventName', payload)` calls use event names and payload structures that conform to `ClientToServerEvents`. TypeScript will enforce this.
            ```typescript
            // Assuming GameAnswerPayload is defined in ClientToServerEvents
            socket.emit('game_answer', {
                accessCode: 'ABCDE',
                userId: 'player123',
                questionId: 'q1',
                answer: 'A',
                timeSpent: 5000
            });
            ```

5.  **Update Tests:**
    *   **Test Setup**:
        *   When creating client sockets for testing (e.g., in `socket.io-client` instances within integration tests like `/home/aflesch/mathquest/app/backend/tests/integration/gameHandler.test.ts`):
            *   Type the client sockets similarly to the frontend client:
                ```typescript
                import ClientIO, { Socket as ClientSocket } from 'socket.io-client';
                import { ServerToClientEvents, ClientToServerEvents } from '@/shared/types/socketEvents'; // Adjust path

                let clientSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
                // ...
                clientSocket = ClientIO(`http://localhost:${port}`, { /* ... */ });
                ```
    *   **Emitting and Asserting Events**:
        *   Ensure test code that emits events or sets up listeners uses the shared types. This will help catch type mismatches in test scenarios.

6.  **Review and Refine:**
    *   Iteratively review all socket event touchpoints.
    *   Fill in any `TODO`s or `any` types in `socketEvents.ts` with more specific types as their structures become clear.
    *   Ensure consistency in naming and structure.

7.  **(Optional) ESLint for Advanced Checks:**
    *   While TypeScript handles type correctness, ESLint can be configured with plugins like `eslint-plugin-i18next` (if you were doing internationalization and wanted to check keys) or custom rules if there are patterns specific to your event handling you want to enforce beyond basic type safety. For now, focusing on TypeScript typing is the priority.

By following these steps, the application will benefit from significantly improved type safety for its real-time communication layer.
