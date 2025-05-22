# Integration Test Socket Connection Best Practices

This guide documents the correct way to connect to the backend server and emit socket events in MathQuest integration tests, ensuring reliable event flow and avoiding common connection issues.

## Key Steps

1. **Start the Test Server and Retrieve the Address**
   - Use your test server setup utility (e.g., `startTestServer()`) to start the backend and retrieve the actual port.
   - Construct the full address (e.g., `http://localhost:${port}`) for all HTTP and socket connections.

2. **Join the Game via HTTP (if required)**
   - Before connecting via socket, join the game using the HTTP endpoint:
     ```typescript
     await request(address)
       .post(`/api/v1/games/${accessCode}/join`)
       .send({ userId })
       .expect(200);
     ```
   - This step ensures the backend registers the participant before socket events are emitted.

3. **Connect the Socket Client with the Correct Path**
   - Use the same address for the socket connection.
   - If your backend uses a custom socket path (e.g., `/api/socket.io`), specify it:
     ```typescript
     const socket = ClientIO(address, { path: '/api/socket.io', transports: ['websocket'], forceNew: true });
     ```

4. **Wait for the Socket to Connect**
   - Ensure the socket is fully connected before emitting events:
     ```typescript
     await new Promise<void>(res => socket.on('connect', () => res()));
     ```

5. **Emit Join and Start Events**
   - After connecting, emit the appropriate join and start events (e.g., `join_game`, `start_game`).
   - Optionally, add a short delay after join to avoid race conditions:
     ```typescript
     socket.emit('join_game', { accessCode, userId });
     await new Promise(res => setTimeout(res, 200));
     socket.emit('start_game', { accessCode, userId });
     ```

6. **Listen for and Assert on Events**
   - Use a helper like `waitForEvent(socket, eventName)` to await backend events and assert on their payloads.

## Example Snippet

```typescript
const address = `http://localhost:${port}`;
await request(address)
  .post(`/api/v1/games/${accessCode}/join`)
  .send({ userId })
  .expect(200);
const socket = ClientIO(address, { path: '/api/socket.io', transports: ['websocket'], forceNew: true });
await new Promise<void>(res => socket.on('connect', () => res()));
socket.emit('join_game', { accessCode, userId });
await new Promise(res => setTimeout(res, 200));
socket.emit('start_game', { accessCode, userId });
// ...
```

## Troubleshooting

- **Connection Refused/ECONNRESET**: Ensure the test uses the actual port the backend is listening on.
- **No Events Received**: Confirm the HTTP join step is performed before socket events, and the correct socket path is used.
- **Race Conditions**: Add a short delay after join before emitting start events.

## References
- See `tournament.test.ts` and `practiceMode.test.ts` for working examples.
- For more, see `/docs/socket-testing.md` and `/docs/test-integration-guide.md`.
