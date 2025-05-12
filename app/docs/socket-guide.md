# Socket.IO Integration and Testing Guide

*Last updated: May 12, 2025*

This document provides comprehensive information on Socket.IO implementation, TypeScript integration, and connection testing in the MathQuest application.

## Table of Contents
1. [Overview](#overview)
2. [Connection Fixes](#connection-fixes)
3. [Configuration](#configuration)
4. [TypeScript Integration](#typescript-integration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Overview

MathQuest uses Socket.IO for real-time, bidirectional communication between the frontend and backend. Socket.IO provides the foundation for features like:

- Live quiz updates between teacher dashboard and student clients
- Real-time tournament updates and leaderboards
- Lobby management for students waiting to join tournaments
- Projector view synchronization with quiz state

## Connection Fixes

After restructuring the MathQuest application into separate `/backend`, `/frontend`, and `/shared` directories, the following issues were addressed to ensure stable Socket.IO connections:

1. **TypeScript Import/Export Inconsistencies**
   - Fixed mixed use of CommonJS `require()` and ES `import` statements
   - Updated event handler imports in `quizEvents.ts` and `tournamentEvents.ts`
   - Standardized on ES module syntax across the codebase

2. **Socket.IO Configuration**
   - Created centralized configuration in `frontend/src/config.ts`
   - Enhanced server configuration in `backend/server.ts`
   - Added proper timeout and reconnection parameters
   - Configured consistent transport options

3. **Socket Testing Infrastructure**
   - Created `socket-test.js` for command-line testing
   - Created UI test page (`frontend/src/app/socket-test/page.tsx`)
   - Added ping-pong mechanism to verify two-way communication
   - Implemented connection diagnostics and error handling
   - Added visual indicators for connection status

4. **TypeScript Integration**
   - Created proper type definitions for socket events
   - Updated socket hooks to use TypeScript interfaces
   - Documented best practices

5. **Environment Variables**
   - Fixed loading of environment variables with dotenv
   - Ensured DATABASE_URL is properly loaded for Prisma client

## Configuration

### Frontend Socket Configuration

```typescript
// frontend/src/config.ts
export const SOCKET_CONFIG = {
    url: API_URL,
    path: '/api/socket/io',
    transports: ['websocket', 'polling'],
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

### Backend Socket Configuration

```typescript
// backend/server.ts
const io = new SocketIOServer(httpServer, {
    path: '/api/socket/io',
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: false,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Version', 'X-Client-Source']
    },
    connectTimeout: 30000,
    pingTimeout: 25000,
    pingInterval: 10000,
    transports: ['websocket', 'polling']
});
```

## TypeScript Integration

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

## Testing

### Command Line Testing

```bash
# From project root
cd /home/aflesch/mathquest/app
node socket-test.js
```

The script tests:
- Socket connection establishment
- Two-way communication via ping-pong events
- API health via stats endpoint
- Connection stability and parameters
- Reconnection capabilities

The socket-test.js script will display detailed connection information including:
- Socket ID
- Connection status
- Server response times
- Connection parameters
- Any connection errors encountered

### UI Testing

1. Start both backend and frontend servers:
```bash
# Terminal 1
cd /home/aflesch/mathquest/app/backend
npm run dev

# Terminal 2
cd /home/aflesch/mathquest/app/frontend
npm run dev
```

2. Navigate to http://localhost:3008/socket-test in your browser
3. Click "Connect" to establish a socket connection
4. Test "Send Ping" to verify two-way communication
5. Test "Fetch Stats" to verify API connectivity

The UI test page (`frontend/src/app/socket-test/page.tsx`) provides:
- Visual connection status indicators
- Real-time log display
- Connection controls (connect/disconnect buttons)
- Ping functionality to test two-way communication
- API stats retrieval
- Configuration display

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

## Real-Time Room Naming Conventions

MathQuest uses Socket.IO rooms to organize real-time communication between different roles (students, teachers, projector, lobby). The naming conventions are as follows:

| Room Name                | Used For                        | Example                | Who Joins/Sends?         |
|--------------------------|----------------------------------|------------------------|--------------------------|
| `live_${code}`     | Live tournament participants     | tournament_123456      | Students (live), server  |
| `dashboard_${quizId}`         | Teacher dashboard (quiz control) | quiz_abc123            | Teacher dashboard, server|
| `projection_${quizId}`   | Projector/classroom display      | projection_abc123      | Projector view, server   |
| `${code}`                | Lobby waiting room               | 123456                 | Students (lobby), server |
| `lobby_${code}`          | Quiz-linked tournament lobby     | lobby_123456           | Students (lobby), server |

**Guidelines:**
- All live gameplay events for students (questions, timer, results, etc.) are sent to `live_${code}`.
- Teacher dashboard events (state, timer, lock/unlock, etc.) are sent to `dashboard_${quizId}`.
- Projector events are sent to `projection_${quizId}`.
- Lobby events are sent to `${code}` or `lobby_${code}` depending on context.
