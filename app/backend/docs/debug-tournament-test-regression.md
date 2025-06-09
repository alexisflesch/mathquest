# Debugging Tournament Test Regression: Step-by-Step Guide

## 1. **Understand the Symptom**
- The test `tournament.test.ts` used to pass, but now fails with a timeout waiting for the `tournament_starting` event.
- The test code itself has not changed.
- There are no error logs, unlike other tests.

## 2. **Identify What Could Have Changed**
- Test setup/teardown code (server, socket, or DB initialization)
- Socket event handler registration
- Middleware or authentication logic
- Room naming or event emission logic
- Global configuration or environment

## 3. **Use Git to Find the Change**
- Use `git diff d8739dc -- app/backend/` to compare the current backend with the last known good commit.
- Focus on these files:
  - `tests/testSetup.ts` (or any global test setup)
  - `src/server.ts` (server/socket initialization)
  - `src/sockets/index.ts` and `src/sockets/handlers/tournamentHandler.ts`
  - Any middleware (e.g., `socketAuth.ts`)
  - Any shared test utility

## 4. **Check for These Common Breaking Changes**
- **Test server setup changed:**
  - If the server or socket setup changed, handlers might not be registered, or sockets might not be authenticated, so events never fire.
- **Handler registration changed:**
  - If the tournament handler is not registered, the event will never be emitted.
- **Middleware changed:**
  - If authentication is stricter, test sockets might not be allowed to join rooms or receive events.
- **Room naming changed:**
  - If the room name for tournament events changed, the test may be listening on the wrong room/event.

## 5. **How to Fix**
- Revert or fix the change in test setup, server, or handler registration so that handlers are registered and events are emitted as before.
- If middleware is blocking test sockets, add a test bypass or fix the test auth logic.
- If room naming changed, update the test to listen to the correct event/room.

## 6. **Next Steps**
- Run the test with verbose output and debug logs enabled.
- If the event is not emitted, add debug logs to the handler registration and event emission points.
- Once the root cause is found, fix it and re-run the tests.

---

## Example Debug Commands

```bash
# Show changes since last good commit
git diff d8739dc -- app/backend/ | less

# Run the test with verbose output
npm test -- tests/integration/tournament.test.ts --verbose --detectOpenHandles
```

---

## Summary
The test fails because a backend change (likely in test setup, server, or handler registration) prevents the `tournament_starting` event from being emitted. Use git to find the change, then fix or revert it so the test passes again.
