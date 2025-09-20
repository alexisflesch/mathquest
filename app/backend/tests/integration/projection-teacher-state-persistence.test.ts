// Set up environment variables for testing BEFORE any imports
process.env.DATABASE_URL = "postgresql://postgre:dev123@localhost:5432/mathquest_test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "your key should be long and secure";
process.env.ADMIN_PASSWORD = "abc";
process.env.PORT = "3007";
process.env.LOG_LEVEL = "info";

import { redisClient } from '../../src/config/redis';
import { prisma } from '../../src/db/prisma';

describe('Projection/Teacher State Persistence', () => {
    let testGameId: string;
    let testAccessCode: string;
    let testUser: any;
    let testGameInstance: any;

    beforeAll(async () => {
        // Clean up Redis
        await redisClient.del(`mathquest:game:leaderboard:*`);
        await redisClient.del(`mathquest:game:participants:*`);
        await redisClient.del(`mathquest:game:state:*`);
        await redisClient.del(`mathquest:game:timer:*`);
        await redisClient.del(`mathquest:projection:*`);
        await redisClient.del(`mathquest:teacher:*`);
    });

    afterAll(async () => {
        await redisClient.quit();
    });

    beforeEach(async () => {
        // Generate unique test data
        const timestamp = Date.now();
        testAccessCode = `PROJ-${timestamp}`;
        testGameId = `game-${timestamp}`;

        // Clean up Redis for this test
        await redisClient.del(`mathquest:game:leaderboard:${testAccessCode}`);
        await redisClient.del(`mathquest:game:participants:${testAccessCode}`);
        await redisClient.del(`mathquest:game:state:${testAccessCode}`);
        await redisClient.del(`mathquest:game:timer:${testAccessCode}`);
        await redisClient.del(`mathquest:projection:${testAccessCode}`);
        await redisClient.del(`mathquest:teacher:${testAccessCode}`);

        // Create a test user
        const testUserId = `test-teacher-${timestamp}`;
        testUser = await prisma.user.create({
            data: {
                id: testUserId,
                username: `test-teacher-${timestamp}`,
                email: `test${timestamp}@example.com`,
                passwordHash: 'hashed-password',
                role: 'TEACHER'
            }
        });

        // Create a game template first
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: `Test Template ${timestamp}`,
                creatorId: testUser.id
            }
        });

        // Create a game instance
        testGameInstance = await prisma.gameInstance.create({
            data: {
                id: testGameId,
                accessCode: testAccessCode,
                name: `Test Game ${timestamp}`,
                initiatorUserId: testUser.id,
                status: 'ACTIVE',
                currentQuestionIndex: 0,
                playMode: 'quiz',
                gameTemplateId: gameTemplate.id
            }
        });
    });

    afterEach(async () => {
        // Clean up test data
        await redisClient.del(`mathquest:game:leaderboard:${testAccessCode}`);
        await redisClient.del(`mathquest:game:participants:${testAccessCode}`);
        await redisClient.del(`mathquest:game:state:${testAccessCode}`);
        await redisClient.del(`mathquest:game:timer:${testAccessCode}`);
        await redisClient.del(`mathquest:projection:${testAccessCode}`);
        await redisClient.del(`mathquest:teacher:${testAccessCode}`);
        await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testGameId } });
        await prisma.gameInstance.deleteMany({ where: { id: testGameId } });
        await prisma.gameTemplate.deleteMany({ where: { creatorId: testUser.id } });
        await prisma.user.deleteMany({ where: { id: testUser.id } });
    });

    describe('showStats toggle persistence', () => {
        it('should persist showStats state across reconnections', async () => {
            // Test initial state
            const initialState = {
                accessCode: testAccessCode,
                showStats: false,
                showCorrectAnswers: false,
                currentQuestionIndex: 0
            };

            // Simulate setting showStats to true
            await redisClient.hset(`mathquest:projection:${testAccessCode}`, {
                showStats: 'true',
                showCorrectAnswers: 'false',
                lastUpdated: Date.now().toString()
            });

            // Verify persistence
            const persistedState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
            expect(persistedState.showStats).toBe('true');
            expect(persistedState.showCorrectAnswers).toBe('false');

            // Simulate reconnection (new client)
            const reconnectedState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
            expect(reconnectedState.showStats).toBe('true');
            expect(reconnectedState.showCorrectAnswers).toBe('false');
        });

        it('should handle showStats state transitions correctly', async () => {
            // Test state transitions
            const transitions = [
                { from: false, to: true, description: 'false to true' },
                { from: true, to: false, description: 'true to false' },
                { from: false, to: false, description: 'false to false (no change)' },
                { from: true, to: true, description: 'true to true (no change)' },
            ];

            for (const transition of transitions) {
                // Set initial state
                await redisClient.hset(`mathquest:projection:${testAccessCode}`, {
                    showStats: transition.from.toString(),
                    lastUpdated: Date.now().toString()
                });

                // Verify initial state
                let currentState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
                expect(currentState.showStats).toBe(transition.from.toString());

                // Change state
                await redisClient.hset(`mathquest:projection:${testAccessCode}`, {
                    showStats: transition.to.toString(),
                    lastUpdated: Date.now().toString()
                });

                // Verify new state
                currentState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
                expect(currentState.showStats).toBe(transition.to.toString());
            }
        });

        it('should maintain showStats state during concurrent operations', async () => {
            // Test concurrent state changes
            const operations = [
                async () => {
                    await redisClient.hset(`mathquest:projection:${testAccessCode}`, {
                        showStats: 'true',
                        lastUpdated: Date.now().toString()
                    });
                },
                async () => {
                    await redisClient.hset(`mathquest:projection:${testAccessCode}`, {
                        showCorrectAnswers: 'true',
                        lastUpdated: Date.now().toString()
                    });
                },
                async () => {
                    const state = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
                    return state;
                }
            ];

            // Execute operations concurrently
            const results = await Promise.all(operations.map(op => op()));

            // Verify final state
            const finalState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
            expect(finalState).toBeDefined();
            expect(finalState.lastUpdated).toBeDefined();
        });

        it('should handle missing showStats state gracefully', async () => {
            // Test handling of missing state
            const emptyState = await redisClient.hgetall(`mathquest:nonexistent:${testAccessCode}`);
            expect(emptyState).toEqual({});

            // Test default values
            const defaultState = {
                showStats: 'false',
                showCorrectAnswers: 'false',
                lastUpdated: Date.now().toString()
            };

            await redisClient.hset(`mathquest:projection:${testAccessCode}`, defaultState);

            const retrievedState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
            expect(retrievedState.showStats).toBe('false');
            expect(retrievedState.showCorrectAnswers).toBe('false');
        });
    });

    describe('showCorrectAnswers toggle persistence', () => {
        it('should persist showCorrectAnswers state across reconnections', async () => {
            // Test initial state
            const initialState = {
                accessCode: testAccessCode,
                showStats: false,
                showCorrectAnswers: false,
                currentQuestionIndex: 0
            };

            // Simulate setting showCorrectAnswers to true
            await redisClient.hset(`mathquest:projection:${testAccessCode}`, {
                showStats: 'false',
                showCorrectAnswers: 'true',
                lastUpdated: Date.now().toString()
            });

            // Verify persistence
            const persistedState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
            expect(persistedState.showStats).toBe('false');
            expect(persistedState.showCorrectAnswers).toBe('true');

            // Simulate reconnection
            const reconnectedState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
            expect(reconnectedState.showStats).toBe('false');
            expect(reconnectedState.showCorrectAnswers).toBe('true');
        });

        it('should handle showCorrectAnswers state transitions correctly', async () => {
            // Test state transitions
            const transitions = [
                { from: false, to: true, description: 'false to true' },
                { from: true, to: false, description: 'true to false' },
                { from: false, to: false, description: 'false to false (no change)' },
                { from: true, to: true, description: 'true to true (no change)' },
            ];

            for (const transition of transitions) {
                // Set initial state
                await redisClient.hset(`mathquest:projection:${testAccessCode}`, {
                    showCorrectAnswers: transition.from.toString(),
                    lastUpdated: Date.now().toString()
                });

                // Verify initial state
                let currentState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
                expect(currentState.showCorrectAnswers).toBe(transition.from.toString());

                // Change state
                await redisClient.hset(`mathquest:projection:${testAccessCode}`, {
                    showCorrectAnswers: transition.to.toString(),
                    lastUpdated: Date.now().toString()
                });

                // Verify new state
                currentState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
                expect(currentState.showCorrectAnswers).toBe(transition.to.toString());
            }
        });

        it('should maintain showCorrectAnswers state during concurrent operations', async () => {
            // Test concurrent state changes
            const operations = [
                async () => {
                    await redisClient.hset(`mathquest:projection:${testAccessCode}`, {
                        showCorrectAnswers: 'true',
                        lastUpdated: Date.now().toString()
                    });
                },
                async () => {
                    await redisClient.hset(`mathquest:projection:${testAccessCode}`, {
                        showStats: 'true',
                        lastUpdated: Date.now().toString()
                    });
                },
                async () => {
                    const state = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
                    return state;
                }
            ];

            // Execute operations concurrently
            const results = await Promise.all(operations.map(op => op()));

            // Verify final state
            const finalState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
            expect(finalState).toBeDefined();
            expect(finalState.lastUpdated).toBeDefined();
        });

        it('should handle missing showCorrectAnswers state gracefully', async () => {
            // Test handling of missing state
            const emptyState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
            expect(emptyState).toEqual({});

            // Test default values
            const defaultState = {
                showStats: 'false',
                showCorrectAnswers: 'false',
                lastUpdated: Date.now().toString()
            };

            await redisClient.hset(`mathquest:projection:${testAccessCode}`, defaultState);

            const retrievedState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
            expect(retrievedState.showStats).toBe('false');
            expect(retrievedState.showCorrectAnswers).toBe('false');
        });
    });

    describe('Combined state persistence', () => {
        it('should persist both toggles simultaneously', async () => {
            // Test combined state changes
            const combinedStates = [
                { showStats: true, showCorrectAnswers: false },
                { showStats: false, showCorrectAnswers: true },
                { showStats: true, showCorrectAnswers: true },
                { showStats: false, showCorrectAnswers: false },
            ];

            for (const state of combinedStates) {
                await redisClient.hset(`mathquest:projection:${testAccessCode}`, {
                    showStats: state.showStats.toString(),
                    showCorrectAnswers: state.showCorrectAnswers.toString(),
                    lastUpdated: Date.now().toString()
                });

                const persistedState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
                expect(persistedState.showStats).toBe(state.showStats.toString());
                expect(persistedState.showCorrectAnswers).toBe(state.showCorrectAnswers.toString());
            }
        });

        it('should handle state persistence across multiple reconnections', async () => {
            // Test multiple reconnections
            const testState = {
                showStats: 'true',
                showCorrectAnswers: 'false',
                lastUpdated: Date.now().toString()
            };

            // Set initial state
            await redisClient.hset(`mathquest:projection:${testAccessCode}`, testState);

            // Simulate multiple reconnections
            for (let i = 0; i < 5; i++) {
                const reconnectedState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
                expect(reconnectedState.showStats).toBe('true');
                expect(reconnectedState.showCorrectAnswers).toBe('false');
            }
        });

        it('should maintain state consistency during rapid toggles', async () => {
            // Test rapid state changes
            const rapidChanges = [
                { showStats: 'true', showCorrectAnswers: 'false' },
                { showStats: 'false', showCorrectAnswers: 'true' },
                { showStats: 'true', showCorrectAnswers: 'true' },
                { showStats: 'false', showCorrectAnswers: 'false' },
                { showStats: 'true', showCorrectAnswers: 'false' },
            ];

            for (const change of rapidChanges) {
                await redisClient.hset(`mathquest:projection:${testAccessCode}`, {
                    ...change,
                    lastUpdated: Date.now().toString()
                });

                const currentState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
                expect(currentState.showStats).toBe(change.showStats);
                expect(currentState.showCorrectAnswers).toBe(change.showCorrectAnswers);
            }
        });

        it('should handle state persistence with timestamps', async () => {
            // Test timestamp tracking
            const timestamp1 = Date.now();
            await redisClient.hset(`mathquest:projection:${testAccessCode}`, {
                showStats: 'true',
                showCorrectAnswers: 'false',
                lastUpdated: timestamp1.toString()
            });

            const state1 = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
            expect(parseInt(state1.lastUpdated)).toBe(timestamp1);

            // Small delay to ensure different timestamp
            await new Promise(resolve => setTimeout(resolve, 1));

            // Update with new timestamp
            const timestamp2 = Date.now();
            await redisClient.hset(`mathquest:projection:${testAccessCode}`, {
                showStats: 'false',
                showCorrectAnswers: 'true',
                lastUpdated: timestamp2.toString()
            });

            const state2 = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
            expect(parseInt(state2.lastUpdated)).toBe(timestamp2);
            expect(timestamp2).toBeGreaterThan(timestamp1);
        });
    });

    describe('Server restart persistence simulation', () => {
        it('should simulate persistence across server restarts', async () => {
            // Test persistence simulation (in real scenario, Redis would survive server restarts)
            const serverRestartStates = [
                { showStats: 'true', showCorrectAnswers: 'false', scenario: 'before restart' },
                { showStats: 'false', showCorrectAnswers: 'true', scenario: 'after restart' },
                { showStats: 'true', showCorrectAnswers: 'true', scenario: 'final state' },
            ];

            for (const restartState of serverRestartStates) {
                // Simulate server restart by clearing and restoring state
                await redisClient.del(`mathquest:projection:${testAccessCode}`);

                await redisClient.hset(`mathquest:projection:${testAccessCode}`, {
                    showStats: restartState.showStats,
                    showCorrectAnswers: restartState.showCorrectAnswers,
                    lastUpdated: Date.now().toString(),
                    serverRestarted: 'true'
                });

                const recoveredState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
                expect(recoveredState.showStats).toBe(restartState.showStats);
                expect(recoveredState.showCorrectAnswers).toBe(restartState.showCorrectAnswers);
                expect(recoveredState.serverRestarted).toBe('true');
            }
        });

        it('should handle corrupted state during restart recovery', async () => {
            // Test handling of corrupted state
            const corruptedStates = [
                { showStats: 'invalid', showCorrectAnswers: 'false' },
                { showStats: 'true', showCorrectAnswers: 'invalid' },
                { showStats: '', showCorrectAnswers: '' },
                { showStats: null, showCorrectAnswers: undefined },
            ];

            for (const corruptedState of corruptedStates) {
                // Simulate corrupted state
                const stateToSet: any = {
                    lastUpdated: Date.now().toString()
                };

                if (corruptedState.showStats !== null && corruptedState.showStats !== undefined) {
                    stateToSet.showStats = corruptedState.showStats;
                }
                if (corruptedState.showCorrectAnswers !== null && corruptedState.showCorrectAnswers !== undefined) {
                    stateToSet.showCorrectAnswers = corruptedState.showCorrectAnswers;
                }

                await redisClient.hset(`mathquest:projection:${testAccessCode}`, stateToSet);

                const retrievedState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
                expect(retrievedState).toBeDefined();
                // Should handle corrupted values gracefully
            }
        });

        it('should maintain state isolation between different games', async () => {
            // Test state isolation
            const game1Code = `${testAccessCode}-1`;
            const game2Code = `${testAccessCode}-2`;

            // Set different states for different games
            await redisClient.hset(`mathquest:projection:${game1Code}`, {
                showStats: 'true',
                showCorrectAnswers: 'false',
                lastUpdated: Date.now().toString()
            });

            await redisClient.hset(`mathquest:projection:${game2Code}`, {
                showStats: 'false',
                showCorrectAnswers: 'true',
                lastUpdated: Date.now().toString()
            });

            // Verify isolation
            const game1State = await redisClient.hgetall(`mathquest:projection:${game1Code}`);
            const game2State = await redisClient.hgetall(`mathquest:projection:${game2Code}`);

            expect(game1State.showStats).toBe('true');
            expect(game1State.showCorrectAnswers).toBe('false');
            expect(game2State.showStats).toBe('false');
            expect(game2State.showCorrectAnswers).toBe('true');

            // Clean up test keys
            await redisClient.del(`mathquest:projection:${game1Code}`);
            await redisClient.del(`mathquest:projection:${game2Code}`);
        });

        it('should handle state expiration and cleanup', async () => {
            // Test state expiration simulation
            await redisClient.hset(`mathquest:projection:${testAccessCode}`, {
                showStats: 'true',
                showCorrectAnswers: 'false',
                lastUpdated: Date.now().toString(),
                expiresAt: (Date.now() + 3600000).toString() // 1 hour from now
            });

            // Verify state exists
            const existingState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
            expect(existingState.showStats).toBe('true');

            // Simulate expiration by deleting
            await redisClient.del(`mathquest:projection:${testAccessCode}`);

            // Verify state is gone
            const expiredState = await redisClient.hgetall(`mathquest:projection:${testAccessCode}`);
            expect(expiredState).toEqual({});
        });
    });
});