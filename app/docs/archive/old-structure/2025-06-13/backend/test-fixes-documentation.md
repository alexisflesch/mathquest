# Backend Test Fixes Documentation

## Summary of Issues and Fixes Applied

This document outlines the common issues found in failing backend tests and the systematic fixes applied to resolve them.

## 🔧 Core Issues Identified

### 1. Missing API Routes in Test Setup
**Problem**: Tests using `startTestServer()` were failing with 404 errors because the test server setup was only configuring Socket.IO but not mounting the Express API routes.

**Files Affected**: 
- `backend/tests/testSetup.ts`
- `backend/tests/integration/tournament.test.ts` 
- `backend/tests/integration/teacherQuiz.test.ts`

**Fix Applied**:
```typescript
// Added to startTestServer() in testSetup.ts
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3008'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());
app.use('/api', apiRouter); // This was missing!
```

### 2. Socket Authentication Issues
**Problem**: Tests were passing authentication tokens in the `auth` object instead of query parameters, causing authentication failures.

**Fix Applied**:
```typescript
// OLD (Wrong):
socket = ClientIO(address, { 
    auth: { token: userToken }, 
    path: '/api/socket.io' 
});

// NEW (Correct):
socket = ClientIO(address, { 
    query: { token: userToken, role: userRole }, 
    path: '/api/socket.io' 
});
```

### 3. Redis Connection Cleanup Issues
**Problem**: During test teardown, Redis connections were being closed before socket disconnect handlers finished, causing "Connection is closed" errors.

**Files Fixed**:
- `backend/src/sockets/handlers/disconnectHandler.ts`
- `backend/src/sockets/handlers/teacherControl/disconnect.ts`

**Fix Applied**:
```typescript
// Added Redis connection status checks
if (redisClient.status === 'end' || redisClient.status === 'close') {
    logger.warn({ socketId: socket.id, redisStatus: redisClient.status }, 
                'Redis connection is closed, skipping disconnect cleanup');
    return;
}

// Enhanced error handling for Redis connection errors
catch (err) {
    if (err instanceof Error && (err.message.includes('Connection is closed') || 
                                err.message.includes('Connection is already closed'))) {
        logger.warn({ socketId: socket.id }, 
                    'Redis connection closed during disconnect handling, skipping cleanup');
        return;
    }
    // ... existing error handling
}
```

### 4. Inconsistent Test Server Setup
**Problem**: Some tests were using `setupServer()` from production code instead of `startTestServer()` from test utilities, leading to inconsistent behavior.

**Fix Applied**: Standardized all tests to use `startTestServer()` from `backend/tests/testSetup.ts`

## 🛠️ Standard Fix Pattern for Future Tests

When fixing failing backend tests, apply this pattern:

### Step 1: Check Test Setup
```typescript
// Ensure test uses startTestServer, not setupServer
import { startTestServer } from '../testSetup';

const setup = await startTestServer();
const { app, server, io, port } = setup;
const address = `http://localhost:${port}`;
```

### Step 2: Fix Socket Authentication
```typescript
// Always use query parameters for auth
const socket = ClientIO(address, {
    query: { token: userToken, role: userRole },
    path: '/api/socket.io',
    transports: ['websocket'],
    forceNew: true
});
```

### Step 3: Add Redis Connection Guards
For any handler that accesses Redis:
```typescript
// Check Redis status before operations
if (redisClient.status === 'end' || redisClient.status === 'close') {
    logger.warn('Redis connection closed, skipping operation');
    return;
}

// Handle Redis connection errors gracefully
catch (err) {
    if (err instanceof Error && err.message.includes('Connection is closed')) {
        logger.warn('Redis connection closed during operation');
        return;
    }
    // Re-throw other errors
    throw err;
}
```

### Step 4: Proper Test Cleanup
```typescript
afterAll(async () => {
    // 1. Disconnect sockets first
    if (socket1?.connected) socket1.disconnect();
    if (socket2?.connected) socket2.disconnect();
    
    // 2. Close server
    if (httpServer?.listening) {
        await new Promise<void>(resolve => httpServer.close(() => resolve()));
    }
    
    // 3. Clean database
    await prisma.user.deleteMany();
    await prisma.gameInstance.deleteMany();
    // ... other cleanup
}, 60000);
```

## 🔍 Common Test Failure Patterns

### Pattern 1: API 404 Errors
**Symptom**: `expected 201 to be 201` but getting 404
**Cause**: Missing API routes in test server
**Fix**: Ensure `startTestServer()` includes `app.use('/api', apiRouter)`

### Pattern 2: Socket Authentication Failures  
**Symptom**: `Authentication failed in testSetup.ts: Missing token or role`
**Cause**: Using `auth` object instead of query parameters
**Fix**: Use `query: { token, role }` in socket connection

### Pattern 3: Redis Connection Errors
**Symptom**: `Connection is closed` errors during teardown
**Cause**: Redis cleanup happening after connections closed
**Fix**: Add Redis status checks and graceful error handling

### Pattern 4: Test Hanging/Timeout
**Symptom**: Tests timeout waiting for socket events
**Cause**: Usually authentication or missing event handlers
**Fix**: Check socket auth pattern and verify event names match backend

## 📝 Tests Fixed Using This Pattern

1. ✅ `tournament.test.ts` - Fixed API routes + socket auth
2. ✅ `teacherQuiz.test.ts` - Fixed test setup + Redis cleanup
3. 🔄 `tournament2.test.ts` - Ready for same fixes
4. 🔄 Additional tests - Apply same pattern

## 🚀 Quick Fix Script

For future test fixes, this bash command can help identify similar issues:

```bash
# Find tests using old setupServer pattern
grep -r "setupServer" tests/integration/

# Find tests using auth object instead of query
grep -r "auth.*token" tests/integration/

# Find Redis operations without connection checks
grep -r "redisClient\." src/sockets/handlers/ | grep -v "status.*end\|status.*close"
```

## ✅ Verification Steps

After applying fixes:

1. **Test API routes**: `curl http://localhost:PORT/api/health` should return 200
2. **Test socket auth**: Check for successful socket connections in logs
3. **Test Redis**: Verify no "Connection is closed" errors during teardown
4. **Run test**: `npm run test filename.test.ts` should pass

---

*Last updated: 2025-06-09*
*Related: [Backend Testing Guide](./test-integration-guide.md)*
