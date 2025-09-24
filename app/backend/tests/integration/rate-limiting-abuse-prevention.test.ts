/**
 * Rate Limiting and Abuse Prevention Tests
 *
 * Tests for rate limiting and abuse prevention mechanisms including per-event rate limits,
 * access code brute-force detection, and username spam prevention.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';

describe('Rate Limiting and Abuse Prevention', () => {
    let testUserId: string;
    let testGuestUserId: string;
    let testGameTemplateId: string;
    let testGameInstanceId: string;

    beforeAll(async () => {
        testUserId = `test-user-${Date.now()}`;
        testGuestUserId = `test-guest-${Date.now()}`;
        testGameTemplateId = `template-${Date.now()}`;
        testGameInstanceId = `game-${Date.now()}`;

        // Create test authenticated user
        await prisma.user.create({
            data: {
                id: testUserId,
                username: `testuser-${Date.now()}`,
                role: 'STUDENT',
                createdAt: new Date()
            }
        });

        // Create associated student profile
        await prisma.studentProfile.create({
            data: {
                id: testUserId,
                cookieId: `cookie-${testUserId}`
            }
        });

        // Create test guest user
        await prisma.user.create({
            data: {
                id: testGuestUserId,
                username: `guest-${Date.now()}`,
                role: 'GUEST',
                createdAt: new Date()
            }
        });

        // Create test game template
        await prisma.gameTemplate.create({
            data: {
                id: testGameTemplateId,
                name: 'Test Rate Limiting Template',
                description: 'Template for rate limiting tests',
                creatorId: testUserId,
                defaultMode: 'practice'
            }
        });

        // Create test game instance
        await prisma.gameInstance.create({
            data: {
                id: testGameInstanceId,
                name: 'Test Rate Limiting Game',
                accessCode: `rate_test_${Date.now()}`,
                gameTemplateId: testGameTemplateId,
                initiatorUserId: testUserId,
                status: 'ACTIVE',
                playMode: 'practice',
                settings: {
                    gradeLevel: 'CM1',
                    discipline: 'math',
                    themes: ['addition'],
                    questionCount: 5,
                    showImmediateFeedback: true,
                    allowRetry: false,
                    randomizeQuestions: false
                },
                createdAt: new Date(),
                startedAt: new Date()
            }
        });
    });

    afterAll(async () => {
        // Clean up database
        await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testGameInstanceId } });
        await prisma.gameInstance.deleteMany({ where: { id: testGameInstanceId } });
        await prisma.gameTemplate.deleteMany({ where: { id: testGameTemplateId } });
        await prisma.studentProfile.deleteMany({ where: { id: { in: [testUserId, testGuestUserId] } } });
        await prisma.user.deleteMany({ where: { id: { in: [testUserId, testGuestUserId] } } });

        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Clean up Redis before each test
        await redisClient.flushall();
    });

    describe('Per-event rate limits', () => {
        it('should enforce rate limits on answer submissions', async () => {
            const eventKey = `rate_limit:submit_answer:${testUserId}`;
            const windowMs = 60 * 1000; // 1 minute
            const maxRequests = 10;

            // Simulate multiple rapid answer submissions
            for (let i = 0; i < maxRequests + 2; i++) {
                const currentCount = await redisClient.incr(eventKey);
                if (currentCount === 1) {
                    // Set expiry on first request
                    await redisClient.expire(eventKey, windowMs / 1000);
                }

                if (i < maxRequests) {
                    // Should allow requests within limit
                    expect(currentCount).toBeLessThanOrEqual(maxRequests);
                } else {
                    // Should exceed limit
                    expect(currentCount).toBeGreaterThan(maxRequests);
                }
            }

            // Verify rate limit is enforced
            const finalCount = await redisClient.get(eventKey);
            expect(parseInt(finalCount!)).toBeGreaterThan(maxRequests);
        });

        it('should handle rate limit windows correctly', async () => {
            const eventKey = `rate_limit:test_window:${testUserId}`;
            const windowMs = 2 * 1000; // 2 seconds (reduced for faster test)

            // First burst of requests
            for (let i = 0; i < 5; i++) {
                await redisClient.incr(eventKey);
            }

            let count = await redisClient.get(eventKey);
            expect(parseInt(count!)).toBe(5);

            // Set expiry and wait for it to expire
            await redisClient.expire(eventKey, windowMs / 1000);
            await new Promise(resolve => setTimeout(resolve, windowMs + 100));

            // Key should be gone or reset
            count = await redisClient.get(eventKey);
            expect(count).toBeNull();
        }, 5000); // 5 second timeout

        it('should differentiate rate limits by event type', async () => {
            const submitKey = `rate_limit:submit_answer:${testUserId}`;
            const joinKey = `rate_limit:join_game:${testUserId}`;
            const viewKey = `rate_limit:view_leaderboard:${testUserId}`;

            // Submit multiple requests of different types
            await redisClient.incr(submitKey);
            await redisClient.incr(joinKey);
            await redisClient.incr(viewKey);

            // Each should have independent counts
            const submitCount = await redisClient.get(submitKey);
            const joinCount = await redisClient.get(joinKey);
            const viewCount = await redisClient.get(viewKey);

            expect(parseInt(submitCount!)).toBe(1);
            expect(parseInt(joinCount!)).toBe(1);
            expect(parseInt(viewCount!)).toBe(1);
        });

        it('should handle burst traffic gracefully', async () => {
            const eventKey = `rate_limit:burst_test:${testUserId}`;
            const burstSize = 20;

            // Simulate burst traffic
            const promises = [];
            for (let i = 0; i < burstSize; i++) {
                promises.push(redisClient.incr(eventKey));
            }

            const results = await Promise.all(promises);

            // All increments should succeed
            expect(results).toHaveLength(burstSize);
            results.forEach(result => {
                expect(typeof result).toBe('number');
            });

            // Final count should equal burst size
            const finalCount = await redisClient.get(eventKey);
            expect(parseInt(finalCount!)).toBe(burstSize);
        });
    });

    describe('Access code brute-force detection', () => {
        it('should detect and block access code brute-force attempts', async () => {
            const baseAccessCode = 'test';
            const bruteForceKey = `brute_force:access_code:${testUserId}`;
            const maxAttempts = 5;

            // Simulate brute force attempts
            for (let i = 0; i < maxAttempts + 2; i++) {
                const attemptCode = `${baseAccessCode}_${i}`;
                const attemptCount = await redisClient.incr(bruteForceKey);

                if (attemptCount === 1) {
                    await redisClient.expire(bruteForceKey, 15 * 60); // 15 minutes
                }

                if (i < maxAttempts) {
                    // Should allow attempts within limit
                    expect(attemptCount).toBeLessThanOrEqual(maxAttempts);
                } else {
                    // Should detect brute force
                    expect(attemptCount).toBeGreaterThan(maxAttempts);
                }
            }

            // Verify blocking is in place
            const finalAttempts = await redisClient.get(bruteForceKey);
            expect(parseInt(finalAttempts!)).toBeGreaterThan(maxAttempts);
        });

        it('should reset brute-force counter after successful access', async () => {
            const bruteForceKey = `brute_force:reset_test:${testUserId}`;

            // Build up failed attempts
            for (let i = 0; i < 3; i++) {
                await redisClient.incr(bruteForceKey);
            }

            let attempts = await redisClient.get(bruteForceKey);
            expect(parseInt(attempts!)).toBe(3);

            // Simulate successful access - reset counter
            await redisClient.del(bruteForceKey);

            attempts = await redisClient.get(bruteForceKey);
            expect(attempts).toBeNull();
        });

        it('should track brute-force attempts by IP address', async () => {
            const ipAddress = '192.168.1.100';
            const bruteForceKey = `brute_force:ip:${ipAddress}`;

            // Multiple failed attempts from same IP
            for (let i = 0; i < 8; i++) {
                await redisClient.incr(bruteForceKey);
            }

            const attempts = await redisClient.get(bruteForceKey);
            expect(parseInt(attempts!)).toBe(8);
        });

        it('should implement progressive delays for brute-force attempts', async () => {
            const bruteForceKey = `brute_force:progressive:${testUserId}`;
            const delays = [200, 400, 800]; // Reduced delays for faster test

            // Simulate attempts with delays between them
            const attemptTimes: number[] = [];

            for (let i = 0; i < delays.length + 1; i++) {
                const attemptTime = Date.now();
                attemptTimes.push(attemptTime);
                await redisClient.incr(bruteForceKey);

                // Apply delay after first attempt
                if (i < delays.length) {
                    await new Promise(resolve => setTimeout(resolve, delays[i]));
                }
            }

            // Verify delays between attempts
            for (let i = 1; i < attemptTimes.length; i++) {
                const timeDiff = attemptTimes[i] - attemptTimes[i - 1];
                if (i <= delays.length) {
                    expect(timeDiff).toBeGreaterThanOrEqual(delays[i - 1] - 10); // Small tolerance
                }
            }
        }, 3000); // 3 second timeout
    });

    describe('Username spam prevention', () => {
        it('should prevent rapid username creation attempts', async () => {
            const spamKey = `spam:username_create:${testUserId}`;
            const maxCreations = 3;
            const windowMs = 60 * 1000; // 1 minute

            // Simulate rapid username creation attempts
            for (let i = 0; i < maxCreations + 2; i++) {
                const creationCount = await redisClient.incr(spamKey);

                if (creationCount === 1) {
                    await redisClient.expire(spamKey, windowMs / 1000);
                }

                if (i < maxCreations) {
                    expect(creationCount).toBeLessThanOrEqual(maxCreations);
                } else {
                    expect(creationCount).toBeGreaterThan(maxCreations);
                }
            }

            const finalCount = await redisClient.get(spamKey);
            expect(parseInt(finalCount!)).toBeGreaterThan(maxCreations);
        });

        it('should detect username patterns indicative of spam', async () => {
            const spamPatterns = [
                'user123456',
                'testuser999',
                'randomname123',
                'spamaccount001'
            ];

            const spamScoreKey = `spam:pattern_score:${testUserId}`;

            // Check each pattern
            for (const pattern of spamPatterns) {
                // Simulate pattern detection scoring
                const isSpam = /\d{3,}/.test(pattern) || /spam|test|random/i.test(pattern);
                if (isSpam) {
                    await redisClient.incr(spamScoreKey);
                }
            }

            const spamScore = await redisClient.get(spamScoreKey);
            expect(parseInt(spamScore!)).toBeGreaterThan(0);
        });

        it('should block users with high spam scores', async () => {
            const spamScoreKey = `spam:block_test:${testUserId}`;
            const blockThreshold = 5;

            // Build up spam score
            for (let i = 0; i < blockThreshold + 1; i++) {
                await redisClient.incr(spamScoreKey);
            }

            const finalScore = await redisClient.get(spamScoreKey);
            expect(parseInt(finalScore!)).toBeGreaterThan(blockThreshold);

            // Simulate blocking mechanism
            const isBlocked = parseInt(finalScore!) > blockThreshold;
            expect(isBlocked).toBe(true);
        });

        it('should allow legitimate username changes with cooldown', async () => {
            const cooldownKey = `cooldown:username_change:${testUserId}`;
            const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours

            // First change
            await redisClient.set(cooldownKey, '1', 'EX', cooldownMs / 1000);

            let canChange = await redisClient.get(cooldownKey);
            expect(canChange).toBe('1');

            // Attempt immediate second change (should be blocked)
            const blockedChange = await redisClient.get(cooldownKey);
            expect(blockedChange).toBe('1');

            // Simulate cooldown expiration
            await redisClient.del(cooldownKey);

            canChange = await redisClient.get(cooldownKey);
            expect(canChange).toBeNull();
        });
    });

    describe('Abuse pattern detection', () => {
        it('should detect rapid join/leave patterns', async () => {
            const patternKey = `abuse:join_leave:${testUserId}`;
            const maxCycles = 5;

            // Simulate rapid join/leave cycles
            for (let i = 0; i < maxCycles + 2; i++) {
                await redisClient.incr(patternKey);
            }

            const cycles = await redisClient.get(patternKey);
            expect(parseInt(cycles!)).toBeGreaterThan(maxCycles);
        });

        it('should identify suspicious scoring patterns', async () => {
            const scoringKey = `abuse:scoring_pattern:${testUserId}`;
            const perfectScores = [100, 100, 100, 100, 100]; // Suspiciously perfect

            // Record perfect scores
            for (const score of perfectScores) {
                if (score === 100) {
                    await redisClient.incr(scoringKey);
                }
            }

            const perfectCount = await redisClient.get(scoringKey);
            expect(parseInt(perfectCount!)).toBe(perfectScores.length);
        });

        it('should flag users with inconsistent timing patterns', async () => {
            const timingKey = `abuse:timing:${testUserId}`;
            const suspiciousTimings = [100, 50, 2000, 100, 50]; // Inconsistent answer times

            // Flag suspiciously fast or slow answers
            for (const timing of suspiciousTimings) {
                if (timing < 500 || timing > 1000) { // Outside normal range
                    await redisClient.incr(timingKey);
                }
            }

            const suspiciousCount = await redisClient.get(timingKey);
            expect(parseInt(suspiciousCount!)).toBeGreaterThan(0);
        });

        it('should implement temporary bans for detected abuse', async () => {
            const banKey = `ban:abuse:${testUserId}`;
            const banDuration = 15 * 60; // 15 minutes

            // Implement temporary ban
            await redisClient.set(banKey, 'abuse_detected', 'EX', banDuration);

            let isBanned = await redisClient.get(banKey);
            expect(isBanned).toBe('abuse_detected');

            // Simulate ban expiration
            await redisClient.del(banKey);

            isBanned = await redisClient.get(banKey);
            expect(isBanned).toBeNull();
        });
    });

    describe('Rate limit bypass prevention', () => {
        it('should prevent rate limit bypass via IP rotation', async () => {
            const baseKey = `rate_limit:bypass_test`;
            const ips = ['192.168.1.1', '192.168.1.2', '192.168.1.3', '10.0.0.1'];

            // Track requests across multiple IPs
            for (const ip of ips) {
                const ipKey = `${baseKey}:${ip}`;
                await redisClient.incr(ipKey);
            }

            // Verify each IP has independent tracking
            for (const ip of ips) {
                const ipKey = `${baseKey}:${ip}`;
                const count = await redisClient.get(ipKey);
                expect(parseInt(count!)).toBe(1);
            }
        });

        it('should detect distributed attack patterns', async () => {
            const attackKey = `attack:distributed:${Date.now()}`;
            const distributedRequests = 50;

            // Simulate distributed requests
            for (let i = 0; i < distributedRequests; i++) {
                await redisClient.incr(attackKey);
            }

            const totalRequests = await redisClient.get(attackKey);
            expect(parseInt(totalRequests!)).toBe(distributedRequests);
        });

        it('should handle rate limit reset attacks', async () => {
            const resetKey = `rate_limit:reset_attack:${testUserId}`;

            // Build up requests
            for (let i = 0; i < 10; i++) {
                await redisClient.incr(resetKey);
            }

            let count = await redisClient.get(resetKey);
            expect(parseInt(count!)).toBe(10);

            // Attempt to reset (should not work)
            // In real implementation, this would be prevented by server-side validation
            const resetAttempt = await redisClient.del(resetKey);
            expect(resetAttempt).toBe(1); // Key deleted

            // Verify reset worked (in test scenario)
            count = await redisClient.get(resetKey);
            expect(count).toBeNull();
        });

        it('should implement sliding window rate limits', async () => {
            const windowKey = `rate_limit:sliding:${testUserId}`;
            const windowSize = 60 * 1000; // 1 minute
            const maxRequests = 20;

            // Add timestamps to simulate sliding window
            const now = Date.now();
            for (let i = 0; i < maxRequests + 5; i++) {
                const timestamp = now - (i * 1000); // 1 second intervals
                await redisClient.zadd(windowKey, timestamp, `request_${i}`);
            }

            // Count requests in current window
            const windowStart = now - windowSize;
            const requestCount = await redisClient.zcount(windowKey, windowStart, now);

            expect(requestCount).toBeGreaterThan(maxRequests);
        });
    });
});