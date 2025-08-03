# Integration Tests Documentation

This directory contains integration tests that verify the complete functionality of the MathQuest backend system with real Redis and database connections.

## Working Tests (as of August 3, 2025)

The following integration tests are fully functional and validated:

### ✅ Deferred Tournament Fixes
- **File**: `/home/aflesch/mathquest/app/backend/tests/integration/deferred-tournament-fixes.test.ts`
- **Coverage**: Tests all fixes for deferred tournament issues including attempt count handling, time penalty calculations, and score isolation
- **Test Count**: 9 tests (all passing)

### ✅ Participant Preservation & Redis Tests  
- **File**: `/home/aflesch/mathquest/app/backend/tests/integration/participant-preservation-real-redis.test.ts`
- **Coverage**: Tests real Redis operations, socket handlers, participant preservation, and projection security
- **Test Count**: Real Redis integration with socket handlers

## Prerequisites

### Database Setup
The tests require a PostgreSQL database connection. Environment variables are set programmatically in the test files:

```typescript
// Database configuration
process.env.DATABASE_URL = "postgresql://postgre:dev123@localhost:5432/mathquest";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "your key should be long and secure";
```

### Redis Setup
Tests use real Redis connections to verify:
- Participant preservation logic
- Score isolation between live and deferred sessions
- Snapshot security for projections
- Timer key management

### Required Services
Before running integration tests, ensure these services are running:
1. **PostgreSQL** on `localhost:5432`
2. **Redis** on `localhost:6379`

## Running Tests

### Individual Test Files
```bash
# Run deferred tournament fixes tests
npm test -- tests/integration/deferred-tournament-fixes.test.ts --no-coverage --detectOpenHandles --forceExit

# Run participant preservation tests  
npm test -- tests/integration/participant-preservation-real-redis.test.ts --no-coverage --detectOpenHandles --forceExit
```

### All Integration Tests
```bash
# Run all integration tests
npm test -- tests/integration/ --no-coverage --detectOpenHandles --forceExit
```

### Test Flags Explained
- `--no-coverage`: Skip coverage collection for faster execution
- `--detectOpenHandles`: Help identify connection leaks
- `--forceExit`: Force Jest to exit after tests complete

## Test Architecture

### Environment Configuration
Each test file sets up its environment variables at the top:

```typescript
// Set up environment variables for testing
process.env.DATABASE_URL = "postgresql://postgre:dev123@localhost:5432/mathquest";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "your key should be long and secure";
process.env.ADMIN_PASSWORD = "abc";
process.env.PORT = "3007";
process.env.LOG_LEVEL = "info";
```

### Database Operations
Tests create and clean up their own test data:

```typescript
// Create test entities with unique IDs
const testUserId = 'user-test-' + Date.now();
const testGameId = 'game-test-' + Date.now();

// Clean up in afterAll
await prisma.gameParticipant.delete({ where: { id: testParticipant.id } });
await prisma.gameInstance.delete({ where: { id: testGameId } });
```

### Redis Operations
Direct Redis operations for testing state:

```typescript
import { redisClient } from '@/config/redis';

// Set up test data
await redisClient.zadd(leaderboardKey, score, userId);
await redisClient.hset(participantsKey, userId, JSON.stringify(data));

// Clean up
await redisClient.del(`mathquest:game:leaderboard:${testAccessCode}`);
```

## Key Test Categories

### 1. Deferred Tournament Tests
- **Attempt Count Fixes**: Verifies `currentDeferredAttemptNumber` vs `nbAttempts` usage
- **Time Penalty Calculations**: Tests timer key generation and penalty calculations  
- **Score Isolation**: Ensures deferred sessions don't interfere with live scores
- **Real-World Scenarios**: End-to-end user journey validation

### 2. Participant Preservation Tests
- **Join-Order Bonus Preservation**: Users with only join bonuses are preserved on disconnect
- **Score-based Removal**: Users without scores are properly removed
- **Snapshot Security**: Projections use snapshot data, not live scores
- **Socket Handler Integration**: Real socket disconnect handling

## Debugging Failed Tests

### Common Issues

1. **Database Connection Errors**
   ```
   REDIS_URL is not defined in environment variables.
   ```
   **Solution**: Ensure Redis is running on localhost:6379

2. **Foreign Key Constraint Violations**
   ```
   Foreign key constraint violated on the constraint: `game_templates_creator_id_fkey`
   ```
   **Solution**: Tests create required entities (User, GameTemplate) before dependent entities

3. **Unique Constraint Violations**
   ```
   Unique constraint failed on the fields: (`email`)
   ```
   **Solution**: Tests use unique emails with timestamps to avoid conflicts

### Test Data Isolation
Each test creates unique data using timestamps:
```typescript
const testAccessCode = 'DEFERRED-TEST-' + Date.now();
const testGameId = 'game-deferred-' + Date.now();
const testUserId = 'user-deferred-' + Date.now();
```

## Log Analysis

Tests produce detailed logs showing:
- Timer key generation and usage
- Score calculations with time penalties
- Attempt count override logic
- Redis operations and state changes

Key log patterns to look for:
- `[TIMER_DEBUG]`: Timer operations and key generation
- `[DIAGNOSTIC]`: Scoring service entry points and parameters
- `[DEFERRED_FIX]`: Attempt count determination logic
- `[TIME_PENALTY]`: Score calculations and penalties

## Expected Test Results

### Deferred Tournament Fixes
```
Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
```

Key validations:
- Timer keys use attempt count 1 instead of 3
- Time penalties calculated correctly (e.g., `timePenalty: 15`, `finalScore: 985`)
- Scores isolated in deferred sessions
- Complete user journey works end-to-end

### Participant Preservation Tests
- Users with join-order bonuses are preserved on disconnect
- Users without scores are properly removed
- Projection broadcasts use snapshot data, not live scores
- Socket handlers work with real Redis operations

## Connection Management

### Redis Connection Cleanup
To prevent "open handle" warnings, tests properly close Redis connections:

```typescript
afterAll(async () => {
    // Clean up test data
    await redisClient.del(`mathquest:game:leaderboard:${testAccessCode}`);
    
    if (io) {
        io.close();
    }

    // Close Redis connection to prevent open handles
    await redisClient.quit();
});
```

This ensures Jest exits cleanly without connection warnings.

## Troubleshooting

### Redis Connection Issues
If you see connection-related errors, verify Redis is accessible:
```bash
redis-cli ping
# Should return: PONG
```

### Database Schema Issues
Ensure the database schema is up to date:
```bash
npx prisma migrate dev
npx prisma generate
```

### Port Conflicts
If tests fail due to port conflicts, check that ports 5432 (PostgreSQL) and 6379 (Redis) are available.

## Contributing

When adding new integration tests:

1. **Follow naming convention**: `feature-name.test.ts`
2. **Set environment variables** at the top of the file
3. **Use unique test data** with timestamps to avoid conflicts
4. **Clean up resources** in `afterAll` hooks
5. **Test real scenarios** that match production usage
6. **Document expected behavior** in test descriptions

## Architecture Notes

These integration tests verify the complete stack:
- **Database Layer**: Prisma ORM with PostgreSQL
- **Cache Layer**: Redis for real-time data
- **Business Logic**: Scoring, timer, and session management
- **Socket Layer**: Real-time communications
- **Service Integration**: End-to-end workflows

The tests ensure that fixes work not just in isolation, but in the complete production-like environment with real database and Redis connections.
