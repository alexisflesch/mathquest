# Test Fixes Documentation

## Overview
This document tracks the fixes applied to failing backend integration tests and the common patterns that need to be applied to other tests.

## Common Issues Found

### 1. Missing API Routes in Test Setup
**Problem**: The `startTestServer` function in `tests/testSetup.ts` was only setting up Socket.IO but not mounting the API routes, causing all HTTP API calls to return 404.

**Solution**: Added the following to `startTestServer()`:
```typescript
// Import required middleware
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from '@/api';

// Configure CORS for API requests
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3008'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

// Mount API routes
app.use('/api', apiRouter);
```

### 2. Socket Authentication Token Format
**Problem**: Tests were passing JWT tokens in the `auth` property but the server expects them as query parameters.

**Solution**: Change socket connection from:
```typescript
// Wrong format
socket1 = ioc(address, { 
    auth: { token: player1.token }, 
    path: '/api/socket.io', 
    transports: ['websocket'], 
    forceNew: true 
});
```

To:
```typescript
// Correct format
socket1 = ioc(address, { 
    query: { token: player1.token }, 
    path: '/api/socket.io', 
    transports: ['websocket'], 
    forceNew: true 
});
```

## Tests Fixed

### tournament.test.ts
- **Status**: ✅ Fixed
- **Issues**: Missing API routes, incorrect socket auth token format
- **Applied Fixes**: Both common fixes above

## Pattern for Fixing Other Tests

For any failing integration test that makes HTTP API calls and uses socket connections:

1. **Check if API routes are working**: If getting 404 errors on API calls, the test setup needs the API routes fix
2. **Check socket authentication**: If socket connections are failing auth, check if tokens are passed as query parameters
3. **Verify test environment**: Ensure the test is using `startTestServer()` from the correct testSetup file

## Next Tests to Fix

The following tests likely need the same fixes:
- `tournament2.test.ts` - Next target
- Any other integration tests making API calls
- Any tests using socket connections with JWT authentication

## Implementation Notes

- The `testSetup.ts` fix is a one-time change that benefits all tests
- Socket authentication fixes need to be applied per test file
- All fixes maintain backward compatibility with existing working tests
