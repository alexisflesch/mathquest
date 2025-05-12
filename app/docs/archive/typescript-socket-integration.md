# Socket.IO TypeScript Integration Guide

*Last updated: May 12, 2025*

## Introduction

This guide documents best practices for implementing and maintaining Socket.IO connections in a TypeScript environment within the MathQuest project. Socket.IO provides real-time, bidirectional communication between the frontend and backend components.

## Configuration

### Backend Socket Configuration

In the backend server (`server.ts`), Socket.IO is configured with the following settings:

```typescript
const io = new SocketIOServer(httpServer, {
    path: '/api/socket/io',
    cors: {
        origin: '*', // Configure as needed for production
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: false,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Version', 'X-Client-Source']
    },
    // Configure socket.io for better reliability
    connectTimeout: 30000, // 30 seconds
    pingTimeout: 25000,    // 25 seconds
    pingInterval: 10000,   // 10 seconds
    transports: ['websocket', 'polling']
});
```

### Frontend Socket Configuration

The frontend uses a centralized configuration object located at `frontend/src/config.ts`:

```typescript
export const SOCKET_CONFIG = {
    url: API_URL,
    path: '/api/socket/io',
    transports: ['websocket', 'polling'] as string[],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 30000,
    forceNew: true,
    autoConnect: true,
    withCredentials: false,
    extraHeaders: {
        "X-Client-Version": "1.0.0",
        "X-Client-Source": "frontend"
    }
};
```

## TypeScript Types for Socket Events

### Event Type Definitions

Create shared type definitions for socket events to ensure consistency between frontend and backend:

```typescript
// types/socketEvents.ts
export interface JoinQuizEvent {
  quizId: string;
  userId: string;
  role: 'student' | 'teacher' | 'projection';
}

export interface QuizAnswerEvent {
  questionId: string;
  answerId: string;
  userId: string;
  timestamp: number;
}
```

### Socket Server Type Safety

For the backend event handlers, use typed event parameters:

```typescript
// Using TypeScript interfaces for Socket.IO events
socket.on('join_quiz', (data: JoinQuizEvent) => {
  // The data object is now typed
  const { quizId, userId, role } = data;
  // ...
});
```

### Socket Client Type Safety

For frontend hooks, use TypeScript generics with Socket.IO client:

```typescript
// hooks/useQuizSocket.ts
import { Socket } from 'socket.io-client';
import { JoinQuizEvent, QuizAnswerEvent } from '@shared/types/socketEvents';

interface QuizSocket extends Socket {
  emit(event: 'join_quiz', data: JoinQuizEvent): boolean;
  emit(event: 'submit_answer', data: QuizAnswerEvent): boolean;
  
  on(event: 'quiz_started', callback: () => void): this;
  on(event: 'question_revealed', callback: (data: { questionId: string }) => void): this;
}
```

## Best Practices

1. **Centralized Configuration**: Always use the centralized `SOCKET_CONFIG` from `frontend/src/config.ts` for all socket connections.

2. **Consistent Imports**: Use ES module imports throughout the codebase:
   ```typescript
   import { io } from 'socket.io-client';
   // Not: const io = require('socket.io-client');
   ```

3. **Connection Error Handling**: Always implement error handlers and reconnection logic:
   ```typescript
   socket.on('connect_error', (err) => {
     console.error('Socket connection error:', err.message);
     // Handle graceful fallback
   });
   ```

4. **Resource Cleanup**: Disconnect sockets when components unmount:
   ```typescript
   useEffect(() => {
     // Socket connection logic
     return () => {
       socket.disconnect();
     };
   }, []);
   ```

5. **Room Management**: Use consistent room naming conventions as documented in the README.md.

## Testing Socket Connections

1. **Command-line Testing**:
   ```bash
   # From project root
   cd /home/aflesch/mathquest/app
   node socket-test.js
   ```

2. **React Component Testing**:
   - Mock Socket.IO in tests
   - Test socket connection lifecycle (connect, emit, receive, disconnect)
   - Verify event handlers get called with proper data

3. **End-to-End Testing**:
   - Test actual connections between frontend and backend
   - Verify event flow through the entire system

## Troubleshooting

### Common Issues and Solutions

1. **Connection Fails to Establish**:
   - Check that backend server is running
   - Verify URL and path configurations match
   - Ensure CORS is properly configured

2. **Events Not Being Received**:
   - Check that the client is joining the correct rooms
   - Verify the event names match exactly between client and server
   - Add debug logging to trace event flow

3. **TypeScript Errors**:
   - Ensure event type definitions are imported and used correctly
   - Check for mismatches between emitted data and typed interfaces
   - Verify socket.io-client version compatibility with TypeScript

For more detailed troubleshooting information, see the [Socket Connection Test Report](./socket-connection-test-report.md).
