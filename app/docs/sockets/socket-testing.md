# Socket Testing

MathQuest tests its socket logic using a combination of unit and integration tests.

## Testing Tools

- **Jest**: Main test runner for backend tests.
- **socket.io-client**: Used to simulate client connections in tests.
- **Supertest**: For HTTP + socket integration tests.

## What Is Tested

- **Connection/Disconnection:**  
  Ensure clients can connect/disconnect and are authenticated correctly.

- **Event Emission:**  
  Test that events are emitted and received as expected for all handlers (quiz, tournament, lobby).

- **State Updates:**  
  Verify that state changes (e.g., score updates, participant lists) are reflected in emitted events.

- **Error Handling:**  
  Simulate invalid actions and ensure proper error events are sent.

## Example Test

```typescript
import { io as ClientIO } from "socket.io-client";
import { startTestServer } from "../testUtils";

test("student can join quiz and receive questions", async () => {
  const server = await startTestServer();
  const client = ClientIO(server.url, { auth: { token: "valid-token" } });

  client.emit("quiz_join", { quizId: "abc" });
  client.on("quiz_question", (payload) => {
    expect(payload).toHaveProperty("question");
    client.disconnect();
    server.close();
  });
});
```

## Running Tests

```sh
npm run test
```

> See `/backend/tests/sockets/` for full test suite.
