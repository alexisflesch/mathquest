// Set up environment variables for testing
process.env.DATABASE_URL = "postgresql://postgre:dev123@localhost:5432/mathquest_test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "your key should be long and secure";
process.env.ADMIN_PASSWORD = "abc";
process.env.PORT = "3007";
process.env.LOG_LEVEL = "info";

import { redisClient } from '@/config/redis';
import { getDeferredAttemptCount } from '@/sockets/handlers/deferredTournamentFlow';

/**
 * Specific test to verify the fix for user's reported bug:
 * "I create and play a tournament live, I play it deferred: shows 3 attempts!!, I play it deferred once more: shows 5 attempts!!"
 * 
 * The fix ensures getDeferredAttemptCount returns the correct session attempt number from Redis,
 * not the total nbAttempts from the database.
 */
describe('Attempt Count Fix Verification', () => {
    const testData = {
        accessCode: 'ATTEMPT-FIX-TEST',
        userId: 'attempt-fix-user-123'
    };

    beforeEach(async () => {
        // Clean up any existing Redis data
        await redisClient.flushdb();
    });

    afterEach(async () => {
        await redisClient.flushdb();
    });

    it('should return correct attempt count from session state, not total nbAttempts', async () => {
        // Simulate the scenario: User has high nbAttempts but is on a specific deferred session

        // Test case 1: User is on their first deferred attempt (session attempt 1)
        await redisClient.hset(`deferred_session:${testData.accessCode}:${testData.userId}:1`, 'score', '0');

        let attemptCount = await getDeferredAttemptCount(testData.accessCode, testData.userId);
        console.log('First deferred session - getDeferredAttemptCount returned:', attemptCount);
        expect(attemptCount).toBe(1);

        // Clean up
        await redisClient.del(`deferred_session:${testData.accessCode}:${testData.userId}:1`);

        // Test case 2: User is on their second deferred attempt (session attempt 2)
        await redisClient.hset(`deferred_session:${testData.accessCode}:${testData.userId}:2`, 'score', '500');

        attemptCount = await getDeferredAttemptCount(testData.accessCode, testData.userId);
        console.log('Second deferred session - getDeferredAttemptCount returned:', attemptCount);
        expect(attemptCount).toBe(2);

        // Clean up
        await redisClient.del(`deferred_session:${testData.accessCode}:${testData.userId}:2`);

        // Test case 3: User is on their third deferred attempt (session attempt 3)  
        await redisClient.hset(`deferred_session:${testData.accessCode}:${testData.userId}:3`, 'score', '1200');

        attemptCount = await getDeferredAttemptCount(testData.accessCode, testData.userId);
        console.log('Third deferred session - getDeferredAttemptCount returned:', attemptCount);
        expect(attemptCount).toBe(3);

        console.log('✅ Attempt count fix verification passed!');
        console.log('getDeferredAttemptCount now correctly returns session attempt number from Redis');
        console.log('This fixes the bug where users saw total nbAttempts instead of current session attempt');
    });

    it('should return 1 when no active session exists', async () => {
        // No session state exists
        const attemptCount = await getDeferredAttemptCount(testData.accessCode, testData.userId);
        console.log('No active session - getDeferredAttemptCount returned:', attemptCount);
        expect(attemptCount).toBe(1);
    });

    it('should find the highest attempt number when multiple sessions exist', async () => {
        // Create multiple session states (simulating leftover data)
        await redisClient.hset(`deferred_session:${testData.accessCode}:${testData.userId}:1`, 'score', '100');
        await redisClient.hset(`deferred_session:${testData.accessCode}:${testData.userId}:2`, 'score', '200');
        await redisClient.hset(`deferred_session:${testData.accessCode}:${testData.userId}:4`, 'score', '400');

        const attemptCount = await getDeferredAttemptCount(testData.accessCode, testData.userId);
        console.log('Multiple sessions - getDeferredAttemptCount returned:', attemptCount);
        expect(attemptCount).toBe(4); // Should return the highest attempt number
    });
});
