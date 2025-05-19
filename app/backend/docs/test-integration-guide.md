# MathQuest Backend Integration Test Guide

## Problem: Socket.IO Not Triggered in Integration Tests

**Symptom:**
- Integration tests using Socket.IO (e.g., tournament/tournament-flow) time out and do not receive real-time events or debug logs.
- No `[DEBUG]` logs or socket event logs appear in test output.

**Root Cause:**
- The test file started only the Express HTTP server (using `createServer(app)`), but did **not** start or attach the Socket.IO server and handlers.
- As a result, test sockets never connect to the backend's real-time logic, and no events or logs are triggered.

## Solution: Use Backend's `setupServer` Helper

- The backend's `src/server.ts` exports a `setupServer(testPort?: number)` function.
- This function creates an HTTP server, attaches the Socket.IO server (with all handlers), and returns the server instance.
- In integration tests, always use `setupServer()` to start the backend server (with Socket.IO) and connect test sockets to its port.

**Example:**
```typescript
import { setupServer } from '@/server';

let httpServer: any;
let address: string;

beforeAll(async () => {
    httpServer = setupServer();
    await new Promise((resolve) => httpServer.listen(0, resolve));
    const port = (httpServer.address() as AddressInfo).port;
    address = `http://localhost:${port}`;
    // ...
});
```

- Use `address` for all REST and socket connections in the test.
- Do **not** create a new Socket.IO server in the test file.

## Production Safety
- This approach is safe for production: the backend always starts both HTTP and Socket.IO servers together.
- The test setup is special and does not affect production code.

## Checklist for Future Integration Tests
- [x] Use `setupServer()` from `src/server.ts` in test setup.
- [x] Connect all test sockets to the returned server's port.
- [x] Do **not** create a separate HTTP or Socket.IO server in the test file.
- [x] Confirm debug logs and real-time events appear in test output.

---

**If you see no debug logs or socket events in test output, check your test server setup first!**
