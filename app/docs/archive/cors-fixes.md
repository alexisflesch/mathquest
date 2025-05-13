# CORS and WebSocket Connection Fixes

*May 13, 2025*

## Issues Addressed

This document summarizes the fixes implemented to address Cross-Origin Resource Sharing (CORS) issues and WebSocket connection problems between the frontend (port 3008) and backend (port 3007) in the MathQuest application.

## Problems

1. **CORS Errors in HTTP Requests**:
   - Error: `Access to fetch at 'http://localhost:3007/api/stats' from origin 'http://localhost:3008' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
   - HTTP requests from the frontend to the backend API endpoints were being blocked by CORS policy.

2. **WebSocket Connection Failures**:
   - Error: `WebSocket connection to 'ws://localhost:3007/api/socket/io/?EIO=4&transport=websocket' failed`
   - Socket.IO WebSocket connections were failing during the handshake process.

## Implemented Fixes

### 1. Server-Side CORS Configuration Updates

Added proper CORS headers to all HTTP responses in `backend/server.ts`:

```typescript
// Add CORS headers to all responses
const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3008',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Version, X-Client-Source',
    'Access-Control-Allow-Credentials': 'false',
};
```

### 2. Socket.IO CORS Configuration Updates

Updated the Socket.IO server configuration to use a specific origin instead of a wildcard:

```typescript
// Initialize Socket.IO server
const io = new SocketIOServer(httpServer, {
    path: '/api/socket/io',
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3008', // Specific origin instead of wildcard
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: false,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Version', 'X-Client-Source']
    },
    // ...other configuration options
});
```

### 3. Frontend Socket Connection Updates

Ensured all frontend components use the centralized SOCKET_CONFIG consistently:

- Updated `/frontend/src/app/lobby/[code]/page.tsx` to use SOCKET_CONFIG 
- Updated `/frontend/src/app/live/[code]/page.tsx` to use SOCKET_CONFIG without modifications

## Environment Variables

Added support for the following environment variables:

- `FRONTEND_URL`: The URL of the frontend application (defaults to `http://localhost:3008`)

## Testing

After implementing these changes:
1. HTTP requests from frontend to backend work correctly
2. WebSocket connections establish successfully
3. Socket.IO real-time communication works in both polling and WebSocket transport modes

## Recommendations

1. **For Development**:
   - Ensure both frontend and backend servers are running (`npm run dev` in frontend directory and `npm run dev:ts` in backend directory)
   - Check the browser console for any remaining CORS or connection errors

2. **For Production**:
   - Set the `FRONTEND_URL` environment variable to the production frontend URL
   - Consider implementing additional security measures such as rate limiting and request validation
