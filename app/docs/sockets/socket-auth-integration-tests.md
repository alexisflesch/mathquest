# Socket.IO Authentication for Integration Tests

## MathQuest Backend Socket Authentication

The backend uses a Socket.IO authentication middleware that accepts authentication data in the socket handshake. For integration tests and real clients, the following field is required for player authentication:

- `token`: A JWT token (required for all authenticated users)

**Best Practice:**
For player authentication, always send only the following in the `auth` object when connecting a test socket client:

```typescript
const socket = ClientIO(address, {
  path: '/api/socket.io',
  transports: ['websocket'],
  forceNew: true,
  auth: {
    token: playerToken // JWT
  }
});
```

This matches the backend authentication middleware logic for players. For teacher/dev test mode, see the backend source for additional options.

## Why?
- The backend expects a valid JWT in `token` for player/teacher identification.
- Omitting this field may result in `Authentication failed: Missing token or role` errors.
- Sending `userId`, `role`, or `userType` is only needed for direct teacher test/dev mode, not for normal player authentication.

## Debugging
- If you still see authentication errors, log the handshake payload and check backend logs for how the token is being processed.
- Ensure the JWT is valid and matches the user in the database.

## References
- See `/backend/src/sockets/middleware/socketAuth.ts` for the backend implementation.
- See `/docs/sockets/socket-authentication.md` for the general authentication flow.
- See `/docs/tests/integration-socket-best-practices.md` for integration test setup.

---

**Note:** If you update the backend to require additional fields, update this documentation and all test code accordingly.
