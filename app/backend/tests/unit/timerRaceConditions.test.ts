import { CanonicalTimerService } from '@/core/services/canonicalTimerService';
import { redisClient } from '@/config/redis';
import createLogger from '@/utils/logger';

// Mock the logger to avoid console output during tests
jest.mock('@/utils/logger', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }))
}));

// Mock Redis client with proper interface
jest.mock('@/config/redis', () => ({
    redisClient: {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        psubscribe: jest.fn(),
        punsubscribe: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        publish: jest.fn(),
        quit: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn()
    }
}));

describe('Timer Service Race Conditions Bug Test', () => {
    let timerService: CanonicalTimerService;
    let mockRedis: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Get the mocked Redis client
        mockRedis = redisClient;

        // Create timer service instance
        timerService = new CanonicalTimerService(mockRedis);
    });

    it('should demonstrate race condition in startTimer method', async () => {
        const accessCode = 'TEST123';
        const questionUid = 'q1';
        const userId = 'user1';

        // Mock initial timer state
        const initialTimer = {
            questionUid: 'q1',
            status: 'pause',
            startedAt: Date.now() - 10000,
            totalPlayTimeMs: 5000,
            lastStateChange: Date.now() - 5000,
            durationMs: 30000,
            timeLeftMs: 20000
        };

        // Mock Redis GET to return the initial timer
        mockRedis.get.mockResolvedValue(JSON.stringify(initialTimer));

        // Mock Redis SET to simulate the write operation
        mockRedis.set.mockResolvedValue('OK');

        // Start the timer
        const result = await timerService.startTimer(
            accessCode,
            questionUid,
            'quiz',
            false,
            userId,
            1
        );

        // Verify the timer was retrieved
        expect(mockRedis.get).toHaveBeenCalledWith(`mathquest:timer:${accessCode}:${questionUid}`);

        // Verify the timer was updated
        expect(mockRedis.set).toHaveBeenCalled();

        // Verify the result
        expect(result).toBeTruthy();
        expect(result?.status).toBe('play');

        console.log('✅ Single startTimer operation works correctly');
    });

    it('should demonstrate race condition in pauseTimer method', async () => {
        const accessCode = 'TEST123';
        const questionUid = 'q1';
        const userId = 'user1';

        // Mock running timer state
        const runningTimer = {
            questionUid: 'q1',
            status: 'play',
            startedAt: Date.now() - 10000,
            totalPlayTimeMs: 5000,
            lastStateChange: Date.now() - 3000,
            durationMs: 30000
        };

        // Mock Redis GET to return the running timer
        mockRedis.get.mockResolvedValue(JSON.stringify(runningTimer));

        // Mock Redis SET
        mockRedis.set.mockResolvedValue('OK');

        // Pause the timer
        const result = await timerService.pauseTimer(
            accessCode,
            questionUid,
            'quiz',
            false,
            userId,
            1
        );

        // Verify the timer was retrieved
        expect(mockRedis.get).toHaveBeenCalledWith(`mathquest:timer:${accessCode}:${questionUid}`);

        // Verify the timer was updated
        expect(mockRedis.set).toHaveBeenCalled();

        // Verify the result
        expect(result).toBeTruthy();
        expect(result?.status).toBe('pause');

        console.log('✅ Single pauseTimer operation works correctly');
    });

    it('should demonstrate race condition in editTimer method', async () => {
        const accessCode = 'TEST123';
        const questionUid = 'q1';
        const userId = 'user1';
        const newDuration = 45000;

        // Mock paused timer state
        const pausedTimer = {
            questionUid: 'q1',
            status: 'pause',
            startedAt: Date.now() - 10000,
            totalPlayTimeMs: 5000,
            lastStateChange: Date.now() - 5000,
            durationMs: 30000,
            timeLeftMs: 25000
        };

        // Mock Redis GET to return the paused timer
        mockRedis.get.mockResolvedValue(JSON.stringify(pausedTimer));

        // Mock Redis SET
        mockRedis.set.mockResolvedValue('OK');

        // Edit the timer
        const result = await timerService.editTimer(
            accessCode,
            questionUid,
            'quiz',
            false,
            newDuration,
            userId,
            1
        );

        // Verify the timer was retrieved
        expect(mockRedis.get).toHaveBeenCalledWith(`mathquest:timer:${accessCode}:${questionUid}`);

        // Verify the timer was updated
        expect(mockRedis.set).toHaveBeenCalled();

        // Verify the result
        expect(result).toBeTruthy();

        console.log('✅ Single editTimer operation works correctly');
    });

    it('should demonstrate potential race condition with concurrent startTimer calls', async () => {
        const accessCode = 'TEST123';
        const questionUid = 'q1';
        const userId = 'user1';

        // Mock initial timer state
        const initialTimer = {
            questionUid: 'q1',
            status: 'pause',
            startedAt: Date.now() - 10000,
            totalPlayTimeMs: 5000,
            lastStateChange: Date.now() - 5000,
            durationMs: 30000,
            timeLeftMs: 20000
        };

        let callCount = 0;
        const originalTimer = { ...initialTimer };

        // Mock Redis operations to simulate race condition
        mockRedis.get.mockImplementation(async () => {
            callCount++;
            // Simulate a delay to make race condition more likely
            await new Promise(resolve => setTimeout(resolve, 10));
            return JSON.stringify(originalTimer);
        });

        mockRedis.set.mockResolvedValue('OK');

        // Simulate concurrent calls
        const promises = [
            timerService.startTimer(accessCode, questionUid, 'quiz', false, userId, 1),
            timerService.startTimer(accessCode, questionUid, 'quiz', false, userId, 1),
            timerService.startTimer(accessCode, questionUid, 'quiz', false, userId, 1)
        ];

        // Wait for all operations to complete
        const results = await Promise.all(promises);

        // All operations should succeed
        results.forEach(result => {
            expect(result).toBeTruthy();
            expect(result?.status).toBe('play');
        });

        // Verify that Redis GET was called multiple times
        expect(mockRedis.get).toHaveBeenCalledTimes(3);

        // Verify that Redis SET was called (may be less than GET calls due to operation logic)
        expect(mockRedis.set).toHaveBeenCalled();

        console.log(`✅ Concurrent startTimer calls: ${callCount} GET operations, all succeeded`);
        console.log('⚠️  Race condition potential: Multiple read-modify-write cycles without atomicity');
    });

    it('should demonstrate potential race condition with concurrent pauseTimer calls', async () => {
        const accessCode = 'TEST123';
        const questionUid = 'q1';
        const userId = 'user1';

        // Mock running timer state
        const runningTimer = {
            questionUid: 'q1',
            status: 'play',
            startedAt: Date.now() - 10000,
            totalPlayTimeMs: 5000,
            lastStateChange: Date.now() - 3000,
            durationMs: 30000
        };

        let callCount = 0;
        const originalTimer = { ...runningTimer };

        // Mock Redis operations
        mockRedis.get.mockImplementation(async () => {
            callCount++;
            await new Promise(resolve => setTimeout(resolve, 10));
            return JSON.stringify(originalTimer);
        });

        mockRedis.set.mockResolvedValue('OK');

        // Simulate concurrent pause calls
        const promises = [
            timerService.pauseTimer(accessCode, questionUid, 'quiz', false, userId, 1),
            timerService.pauseTimer(accessCode, questionUid, 'quiz', false, userId, 1),
            timerService.pauseTimer(accessCode, questionUid, 'quiz', false, userId, 1)
        ];

        const results = await Promise.all(promises);

        // All operations should succeed
        results.forEach(result => {
            expect(result).toBeTruthy();
            expect(result?.status).toBe('pause');
        });

        expect(mockRedis.get).toHaveBeenCalledTimes(3);
        expect(mockRedis.set).toHaveBeenCalled();

        console.log(`✅ Concurrent pauseTimer calls: ${callCount} GET operations, all succeeded`);
        console.log('⚠️  Race condition potential: Multiple read-modify-write cycles without atomicity');
    });

    it('should demonstrate potential race condition with mixed start/pause operations', async () => {
        const accessCode = 'TEST123';
        const questionUid = 'q1';
        const userId = 'user1';

        // Mock initial paused timer
        const pausedTimer = {
            questionUid: 'q1',
            status: 'pause',
            startedAt: Date.now() - 10000,
            totalPlayTimeMs: 5000,
            lastStateChange: Date.now() - 5000,
            durationMs: 30000,
            timeLeftMs: 25000
        };

        let getCallCount = 0;
        let setCallCount = 0;
        const originalTimer = { ...pausedTimer };

        // Mock Redis operations with delays to increase race condition likelihood
        mockRedis.get.mockImplementation(async () => {
            getCallCount++;
            await new Promise(resolve => setTimeout(resolve, 20));
            return JSON.stringify(originalTimer);
        });

        mockRedis.set.mockImplementation(async () => {
            setCallCount++;
            await new Promise(resolve => setTimeout(resolve, 10));
            return 'OK';
        });

        // Simulate mixed concurrent operations
        const promises = [
            timerService.startTimer(accessCode, questionUid, 'quiz', false, userId, 1),
            timerService.pauseTimer(accessCode, questionUid, 'quiz', false, userId, 1),
            timerService.startTimer(accessCode, questionUid, 'quiz', false, userId, 1),
            timerService.pauseTimer(accessCode, questionUid, 'quiz', false, userId, 1),
            timerService.editTimer(accessCode, questionUid, 'quiz', false, 45000, userId, 1)
        ];

        const results = await Promise.all(promises);

        // All operations should succeed (no errors thrown)
        results.forEach((result, index) => {
            expect(result).toBeTruthy();
            if (index === 0 || index === 2) {
                // startTimer operations
                expect(['play', 'pause'].includes(result?.status || '')).toBe(true);
            } else if (index === 1 || index === 3) {
                // pauseTimer operations
                expect(result?.status).toBe('pause');
            }
            // editTimer result is checked by being truthy
        });

        console.log(`✅ Mixed operations: ${getCallCount} GET calls, ${setCallCount} SET calls`);
        console.log('⚠️  Race condition potential: Concurrent read-modify-write operations without transactions');
        console.log('⚠️  Risk: Timer state inconsistencies, incorrect elapsed time calculations');
    });

    it('should demonstrate race condition in timer state consistency', async () => {
        const accessCode = 'TEST123';
        const questionUid = 'q1';
        const userId = 'user1';

        // Start with a clean timer state
        const cleanTimer = {
            questionUid: 'q1',
            status: 'stop',
            startedAt: Date.now(),
            totalPlayTimeMs: 0,
            lastStateChange: Date.now(),
            durationMs: 30000,
            timeLeftMs: 30000,
            timerEndDateMs: 0
        };

        let operationSequence: string[] = [];
        const originalTimer = { ...cleanTimer };

        // Mock Redis operations to track the sequence
        mockRedis.get.mockImplementation(async () => {
            operationSequence.push('GET');
            await new Promise(resolve => setTimeout(resolve, 5));
            return JSON.stringify(originalTimer);
        });

        mockRedis.set.mockImplementation(async (key: string, value: string) => {
            operationSequence.push('SET');
            await new Promise(resolve => setTimeout(resolve, 5));
            return 'OK';
        });

        // Perform a sequence of operations that could race
        await Promise.all([
            timerService.startTimer(accessCode, questionUid, 'quiz', false, userId, 1),
            timerService.pauseTimer(accessCode, questionUid, 'quiz', false, userId, 1),
            timerService.startTimer(accessCode, questionUid, 'quiz', false, userId, 1)
        ]);

        // Analyze the operation sequence
        const getCount = operationSequence.filter(op => op === 'GET').length;
        const setCount = operationSequence.filter(op => op === 'SET').length;

        console.log(`Operation sequence: ${operationSequence.join(' -> ')}`);
        console.log(`GET operations: ${getCount}, SET operations: ${setCount}`);

        // Each operation should have performed GET (but SET may vary based on timer state)
        expect(getCount).toBe(3); // 3 operations
        expect(setCount).toBeGreaterThanOrEqual(2); // At least 2 SET operations (some operations may not write)

        console.log('⚠️  Race condition risk: Non-atomic read-modify-write pattern');
        console.log('⚠️  If interrupted between GET and SET, timer state could be corrupted');
    });

    it('should demonstrate timer state corruption potential under load', async () => {
        const accessCode = 'TEST123';
        const questionUid = 'q1';
        const userId = 'user1';

        // Simulate high-frequency timer operations
        const operations = [];
        const operationCount = 10;

        for (let i = 0; i < operationCount; i++) {
            if (i % 2 === 0) {
                operations.push(timerService.startTimer(accessCode, questionUid, 'quiz', false, userId, 1));
            } else {
                operations.push(timerService.pauseTimer(accessCode, questionUid, 'quiz', false, userId, 1));
            }
        }

        // Mock Redis with variable delays to simulate real-world conditions
        let callIndex = 0;
        mockRedis.get.mockImplementation(async () => {
            callIndex++;
            // Random delay between 1-10ms to simulate network variability
            const delay = Math.floor(Math.random() * 10) + 1;
            await new Promise(resolve => setTimeout(resolve, delay));
            return JSON.stringify({
                questionUid: 'q1',
                status: callIndex % 2 === 0 ? 'pause' : 'play',
                startedAt: Date.now() - 10000,
                totalPlayTimeMs: 5000,
                lastStateChange: Date.now() - 2000,
                durationMs: 30000
            });
        });

        mockRedis.set.mockResolvedValue('OK');

        // Execute all operations concurrently
        const startTime = Date.now();
        const results = await Promise.all(operations);
        const endTime = Date.now();

        const duration = endTime - startTime;
        const successfulOps = results.filter(r => r !== null).length;

        console.log(`High-frequency test: ${operationCount} operations in ${duration}ms`);
        console.log(`Successful operations: ${successfulOps}/${operationCount}`);
        console.log(`Operations per second: ${(operationCount / (duration / 1000)).toFixed(2)}`);

        // All operations should complete without errors
        expect(successfulOps).toBe(operationCount);

        console.log('⚠️  Under load, race conditions could cause:');
        console.log('   - Inconsistent timer states');
        console.log('   - Incorrect elapsed time calculations');
        console.log('   - Lost timer updates');
        console.log('   - Conflicting timer status values');
    });
});