# Socket.IO Testing Approach for MathQuest Backend

This document outlines the approach used for testing Socket.IO handlers in the MathQuest backend, particularly for the game functionality implemented in Phase 7.

## Overview

Testing Socket.IO applications presents unique challenges because of their real-time, event-driven nature. Instead of relying on actual Socket.IO connections (which can lead to flaky tests), we've implemented a mocked Socket.IO approach that:

1. Provides reliable, deterministic tests
2. Eliminates test flakiness from network conditions
3. Allows complete control over the event flow
4. Enables accurate simulation of client-server interactions
5. Ensures proper cleanup of resources between tests

## Mocking Approach

The mocking approach consists of creating mock implementations of Socket.IO's `Socket` and `Server` objects with the following characteristics:

### Mock Socket Implementation

```typescript
interface MockSocket {
    id: string;
    rooms: Set<string>;
    emit: jest.Mock;
    on: jest.Mock;
    once: jest.Mock;
    join: jest.Mock;
    to: jest.Mock;
    triggerEvent: (event: string, payload?: any) => Promise<void>;
}
```

Key features:
- **Custom Event Handling**: The `on()` method stores event handlers in a private map
- **Event Triggering**: A custom `triggerEvent()` method allows tests to simulate client events
- **Room Management**: Simulated room functionality using a Set to track joined rooms
- **Mocked Socket Methods**: All key Socket methods are Jest mocks for verification

### Mock IO Server Implementation

```typescript
interface MockIO {
    to: jest.Mock;
    sockets: {
        adapter: {
            rooms: Map<string, any>;
        };
    };
}
```

The IO server mock provides the minimum functionality needed to support handler registration and room-based broadcasts.

## Test Structure

Each Socket.IO test follows a consistent pattern:

1. **Setup**: Create mock Socket/IO instances and register handlers
2. **Test Data Preparation**: Set up Redis with required test data
3. **Event Triggering**: Use `socket.triggerEvent()` to simulate client events
4. **Verification**:
   - Check Redis state changes
   - Verify socket emissions using Jest's mock functions
   - Validate handler behavior

## Example Test Case

```typescript
test('Player can join a game', async () => {
    // Create a mock socket
    const socket: MockSocket = createMockSocket();

    // Register game handlers
    registerGameHandlers(io as any, socket as any);

    // Set up room to simulate socket.io room functionality
    socket.rooms.add(`game_${TEST_ACCESS_CODE}`);

    // Trigger the join_game event with our payload
    await socket.triggerEvent('join_game', {
        accessCode: TEST_ACCESS_CODE,
        playerId: 'player-1',
        username: 'Player One',
        avatarUrl: 'avatar1.jpg'
    });

    // Verify Redis state changes
    const participantsHash = await redisClient.hgetall(`${PARTICIPANTS_KEY_PREFIX}${TEST_ACCESS_CODE}`);
    expect(Object.keys(participantsHash).length).toBe(1);

    // Verify socket emissions
    expect(socket.emit).toHaveBeenCalledWith('game_joined', expect.objectContaining({
        accessCode: TEST_ACCESS_CODE
    }));
});
```

## Resource Cleanup

A critical aspect of the testing approach is proper resource cleanup:

1. **Redis Data Cleanup**:
   - Test-specific keys are deleted between tests
   - All test-related keys are removed in `afterAll()`

2. **Redis Connection Cleanup**:
   - Redis client connection is properly closed using `redisClient.quit()`
   - This prevents the "open handle" warnings in Jest

```typescript
afterAll(async () => {
    // Clean up test data...
    
    // Close Redis connection to prevent open handles
    await redisClient.quit();
});
```

## Testing Best Practices

1. **Isolation**: Each test operates on isolated data with unique identifiers
2. **Verification**: Always verify both the event emissions and the underlying data storage
3. **Asynchronous Handling**: Use `async/await` for all asynchronous operations
4. **Timeouts**: Add small delays when needed for Redis operations to complete
5. **Mocking Over Stubbing**: Prefer full mocks over partial stubs for consistency

## Common Test Scenarios

1. **Client Connection**: Test joining rooms and initial state
2. **State Changes**: Test updates to game state in Redis
3. **Event Broadcasting**: Test messages broadcast to rooms
4. **Disconnection**: Test proper cleanup on socket disconnect

## Extending the Testing Framework

To add tests for new Socket.IO handlers:

1. Use the existing `createMockSocket()` and `createMockIO()` functions
2. Register your new handlers with these mock objects
3. Trigger events using `socket.triggerEvent()`
4. Verify behavior through both socket emissions and data store changes
