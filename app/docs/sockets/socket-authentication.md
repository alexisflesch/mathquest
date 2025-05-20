# Socket Authentication

MathQuest uses middleware to authenticate all incoming Socket.IO connections.

## How It Works

1. **Client Connection:**  
   The client includes a JWT (JSON Web Token) or session token in the connection handshake (usually as a query param or in headers).

2. **Authentication Middleware:**  
   - The backend uses a Socket.IO middleware to intercept all connections.
   - The token is verified using the same logic as HTTP API authentication.
   - If valid, the user’s identity and role are attached to the socket object (`socket.data.user`).

3. **Authorization:**  
   - Handlers check `socket.data.user` to authorize actions (e.g., only teachers can start quizzes).
   - Unauthorized or invalid tokens result in the connection being rejected or specific events being denied.

4. **Error Handling:**  
   - If authentication fails, the server emits an `error` event and disconnects the socket.

## Example (Backend)

```typescript
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const user = await verifyJwt(token);
    socket.data.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});
```

## Reconnection

- On reconnect, the client must resend a valid token.
- If the token is expired or invalid, the connection is denied.

> **See also:** Backend `middleware/socketAuth.ts` for implementation details.
