// Set up environment variables for testing
process.env.DATABASE_URL = "postgresql://postgre:dev123@localhost:5432/mathquest_test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "your key should be long and secure";
process.env.ADMIN_PASSWORD = "abc";
process.env.PORT = "3007";
process.env.LOG_LEVEL = "info";

import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { redisClient } from '../../src/config/redis';
import { prisma } from '../../src/db/prisma';
import { gameAnswerHandler, GameAnswerContext } from '../../src/sockets/handlers/game/gameAnswer';
import gameStateService from '../../src/core/services/gameStateService';
import { lockAnswersHandler } from '../../src/sockets/handlers/teacherControl/lockAnswers';
import { SOCKET_EVENTS, TEACHER_EVENTS } from '@shared/types/socket/events';
import type { AnswerSubmissionPayload } from '@shared/types/core/answer';

describe('Answer Locking Enforcement', () => {
    let io: SocketIOServer;
    let testGameId: string;
    let testAccessCode: string;
    let testUser: any;

    beforeAll(async () => {
        // Set up Socket.IO server
        const httpServer = createServer();
        io = new SocketIOServer(httpServer);
    });

    afterAll(async () => {
        if (io) {
            io.close();
        }
        await redisClient.quit();
    });

    beforeEach(async () => {
        // Generate unique test data
        const timestamp = Date.now();
        testAccessCode = `LOCK-${timestamp}`;
        testGameId = `game-${timestamp}`;

        // Clean up Redis
        await redisClient.del(`mathquest:game:leaderboard:${testAccessCode}`);
        await redisClient.del(`mathquest:game:participants:${testAccessCode}`);

        // Create a test question
        const question = await prisma.question.create({
            data: {
                uid: `test-question-${timestamp}`,
                title: 'Test Question',
                text: 'Test question?',
                questionType: 'multiple_choice',
                discipline: 'math',
                themes: ['test'],
                difficulty: 1,
                gradeLevel: 'CM1',
                author: 'test',
                explanation: 'Test explanation',
                tags: ['test'],
                timeLimit: 30,
                excludedFrom: [],
                multipleChoiceQuestion: {
                    create: {
                        answerOptions: ['A', 'B', 'C', 'D'],
                        correctAnswers: [true, false, false, false]
                    }
                }
            }
        });

        // Create a test user first
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

        // Create a test game template
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Test Template',
                gradeLevel: 'CM1',
                themes: ['test'],
                discipline: 'math',
                description: 'Test template',
                defaultMode: 'quiz',
                creatorId: testUser.id,
                questions: {
                    create: {
                        questionUid: question.uid,
                        sequence: 0
                    }
                }
            }
        });

        // Create a test game instance
        const gameInstance = await prisma.gameInstance.create({
            data: {
                id: testGameId,
                name: 'Test Game',
                accessCode: testAccessCode,
                gameTemplateId: gameTemplate.id,
                initiatorUserId: testUser.id,
                playMode: 'quiz',
                status: 'active'
            }
        });

        // Create a test participant
        await prisma.gameParticipant.create({
            data: {
                gameInstanceId: testGameId,
                userId: testUser.id,
                status: 'ACTIVE',
                liveScore: 0
            }
        });
    });

    afterEach(async () => {
        // Clean up test data
        await redisClient.del(`mathquest:game:leaderboard:${testAccessCode}`);
        await redisClient.del(`mathquest:game:participants:${testAccessCode}`);
        await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testGameId } });
        await prisma.gameInstance.deleteMany({ where: { id: testGameId } });
    });

    describe('Lock enforcement', () => {
        it('should reject submissions when answersLocked=true', async () => {
            // Set up game state with answers locked
            const gameState = {
                gameId: testGameId,
                accessCode: testAccessCode,
                status: 'active' as const,
                currentQuestionIndex: 0,
                questionUids: ['test-question-uid'],
                answersLocked: true,
                gameMode: 'quiz' as const,
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true
                }
            };
            await gameStateService.updateGameState(testAccessCode, gameState);

            // Create mock socket
            const mockSocket = {
                id: 'test-socket-id',
                emit: jest.fn(),
                data: { userId: testUser.id }
            } as any;

            // Create mock context
            const context: GameAnswerContext = {
                timer: {
                    status: 'run',
                    timerEndDateMs: Date.now() + 30000,
                    questionUid: 'test-question-uid'
                },
                gameState: { gameState },
                participant: {
                    id: 'test-participant-id',
                    userId: testUser.id,
                    liveScore: 0
                } as any,
                gameInstance: {
                    id: testGameId,
                    accessCode: testAccessCode,
                    playMode: 'quiz',
                    status: 'active'
                } as any
            };

            // Create answer payload
            const answerPayload: AnswerSubmissionPayload = {
                accessCode: testAccessCode,
                userId: testUser.id,
                questionUid: 'test-question-uid',
                answer: 'A',
                timeSpent: 5000
            };

            // Call the handler
            const handler = gameAnswerHandler(io, mockSocket, context);
            await handler(answerPayload);

            // Verify submission was rejected
            expect(mockSocket.emit).toHaveBeenCalledWith(
                SOCKET_EVENTS.GAME.GAME_ERROR,
                expect.objectContaining({
                    message: 'Answers are locked for this question.',
                    code: 'ANSWERS_LOCKED'
                })
            );
        });

        it('should accept submissions when answersLocked=false', async () => {
            // Set up game state with answers unlocked
            const gameState = {
                gameState: {
                    gameId: testGameId,
                    accessCode: testAccessCode,
                    status: 'active' as const,
                    currentQuestionIndex: 0,
                    questionUids: ['test-question-uid'],
                    answersLocked: false,
                    gameMode: 'quiz' as const,
                    settings: {
                        timeMultiplier: 1.0,
                        showLeaderboard: true
                    }
                }
            };

            // Create mock socket
            const mockSocket = {
                id: 'test-socket-id',
                emit: jest.fn(),
                data: { userId: testUser.id }
            } as any;

            // Create mock context
            const context: GameAnswerContext = {
                timer: {
                    status: 'run',
                    timerEndDateMs: Date.now() + 30000,
                    questionUid: 'test-question-uid'
                },
                gameState,
                participant: {
                    id: 'test-participant-id',
                    userId: testUser.id,
                    liveScore: 0
                } as any,
                gameInstance: {
                    id: testGameId,
                    accessCode: testAccessCode,
                    playMode: 'quiz',
                    status: 'active'
                } as any
            };

            // Create answer payload
            const answerPayload: AnswerSubmissionPayload = {
                accessCode: testAccessCode,
                userId: testUser.id,
                questionUid: 'test-question-uid',
                answer: 'A',
                timeSpent: 5000
            };

            // Call the handler
            const handler = gameAnswerHandler(io, mockSocket, context);
            await handler(answerPayload);

            // Verify submission was NOT rejected (no error emitted for locking)
            const errorCalls = mockSocket.emit.mock.calls.filter((call: any) =>
                call[0] === SOCKET_EVENTS.GAME.GAME_ERROR &&
                call[1]?.code === 'ANSWERS_LOCKED'
            );
            expect(errorCalls.length).toBe(0);
        });
    });

    describe('Race condition handling', () => {
        it('should block submission in same tick as lock toggle', async () => {
            // Set up game state with answers unlocked initially
            const initialGameState = {
                gameId: testGameId,
                accessCode: testAccessCode,
                status: 'active' as const,
                currentQuestionIndex: 0,
                questionUids: ['test-question-uid'],
                answersLocked: false,
                gameMode: 'quiz' as const,
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true
                }
            };
            await gameStateService.updateGameState(testAccessCode, initialGameState);

            // Set up game state with answers unlocked initially
            const gameState = {
                gameState: initialGameState
            };

            // Create mock socket for answer submission
            const mockSocket = {
                id: 'test-socket-id',
                emit: jest.fn(),
                data: { userId: testUser.id }
            } as any;

            // Create mock context
            const context: GameAnswerContext = {
                timer: {
                    status: 'run',
                    timerEndDateMs: Date.now() + 30000,
                    questionUid: 'test-question-uid'
                },
                gameState,
                participant: {
                    id: 'test-participant-id',
                    userId: testUser.id,
                    liveScore: 0
                } as any,
                gameInstance: {
                    id: testGameId,
                    accessCode: testAccessCode,
                    playMode: 'quiz',
                    status: 'active'
                } as any
            };

            // Create answer payload
            const answerPayload: AnswerSubmissionPayload = {
                accessCode: testAccessCode,
                userId: testUser.id,
                questionUid: 'test-question-uid',
                answer: 'A',
                timeSpent: 5000
            };

            // Simulate race condition: lock answers and submit answer in same event loop tick
            const lockPromise = lockAnswersHandler(io, mockSocket as any)({
                accessCode: testAccessCode,
                lock: true
            } as any);

            // Wait for lock to complete and update context with new state
            await lockPromise;

            // Fetch updated game state from Redis and update context
            const updatedFullState = await gameStateService.getFullGameState(testAccessCode);
            if (updatedFullState && updatedFullState.gameState) {
                context.gameState = updatedFullState;
            }

            const submitPromise = gameAnswerHandler(io, mockSocket, context)(answerPayload);

            // Wait for submission to complete
            await submitPromise;

            // Verify submission was rejected due to race condition
            expect(mockSocket.emit).toHaveBeenCalledWith(
                SOCKET_EVENTS.GAME.GAME_ERROR,
                expect.objectContaining({
                    message: 'Answers are locked for this question.',
                    code: 'ANSWERS_LOCKED'
                })
            );
        });

        it('should handle rapid lock/unlock toggles', async () => {
            // Set up game state with answers unlocked initially
            const initialGameState = {
                gameId: testGameId,
                accessCode: testAccessCode,
                status: 'active' as const,
                currentQuestionIndex: 0,
                questionUids: ['test-question-uid'],
                answersLocked: false,
                gameMode: 'quiz' as const,
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true
                }
            };
            await gameStateService.updateGameState(testAccessCode, initialGameState);

            // Set up game state with answers unlocked initially
            const gameState = {
                gameState: initialGameState
            };

            // Create mock socket for answer submission
            const mockSocket = {
                id: 'test-socket-id',
                emit: jest.fn(),
                data: { userId: testUser.id }
            } as any;

            // Create mock context
            const context: GameAnswerContext = {
                timer: {
                    status: 'run',
                    timerEndDateMs: Date.now() + 30000,
                    questionUid: 'test-question-uid'
                },
                gameState,
                participant: {
                    id: 'test-participant-id',
                    userId: testUser.id,
                    liveScore: 0
                } as any,
                gameInstance: {
                    id: testGameId,
                    accessCode: testAccessCode,
                    playMode: 'quiz',
                    status: 'active'
                } as any
            };

            // Create answer payload
            const answerPayload: AnswerSubmissionPayload = {
                accessCode: testAccessCode,
                userId: testUser.id,
                questionUid: 'test-question-uid',
                answer: 'A',
                timeSpent: 5000
            };

            // Simulate rapid toggles: lock -> unlock -> lock
            await lockAnswersHandler(io, mockSocket as any)({
                accessCode: testAccessCode,
                lock: true
            } as any);

            await lockAnswersHandler(io, mockSocket as any)({
                accessCode: testAccessCode,
                lock: false
            } as any);

            await lockAnswersHandler(io, mockSocket as any)({
                accessCode: testAccessCode,
                lock: true
            } as any);

            // Fetch updated game state from Redis and update context
            const updatedFullState = await gameStateService.getFullGameState(testAccessCode);
            if (updatedFullState && updatedFullState.gameState) {
                context.gameState = updatedFullState;
            }

            // Now submit answer - should be rejected (final state is locked)
            const handler = gameAnswerHandler(io, mockSocket, context);
            await handler(answerPayload);

            // Verify submission was rejected
            expect(mockSocket.emit).toHaveBeenCalledWith(
                SOCKET_EVENTS.GAME.GAME_ERROR,
                expect.objectContaining({
                    message: 'Answers are locked for this question.',
                    code: 'ANSWERS_LOCKED'
                })
            );
        });
    });

    describe('Error messaging', () => {
        it('should return specific error code for locked submissions', async () => {
            // Set up game state with answers locked
            const gameState = {
                gameId: testGameId,
                accessCode: testAccessCode,
                status: 'active' as const,
                currentQuestionIndex: 0,
                questionUids: ['test-question-uid'],
                answersLocked: true,
                gameMode: 'quiz' as const,
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true
                }
            };
            await gameStateService.updateGameState(testAccessCode, gameState);

            // Create mock socket
            const mockSocket = {
                id: 'test-socket-id',
                emit: jest.fn(),
                data: { userId: testUser.id }
            } as any;

            // Create mock context
            const context: GameAnswerContext = {
                timer: {
                    status: 'run',
                    timerEndDateMs: Date.now() + 30000,
                    questionUid: 'test-question-uid'
                },
                gameState: { gameState },
                participant: {
                    id: 'test-participant-id',
                    userId: testUser.id,
                    liveScore: 0
                } as any,
                gameInstance: {
                    id: testGameId,
                    accessCode: testAccessCode,
                    playMode: 'quiz',
                    status: 'active'
                } as any
            };

            // Create answer payload
            const answerPayload: AnswerSubmissionPayload = {
                accessCode: testAccessCode,
                userId: testUser.id,
                questionUid: 'test-question-uid',
                answer: 'A',
                timeSpent: 5000
            };

            // Call the handler
            const handler = gameAnswerHandler(io, mockSocket, context);
            await handler(answerPayload);

            // Verify specific error code and message
            expect(mockSocket.emit).toHaveBeenCalledWith(
                SOCKET_EVENTS.GAME.GAME_ERROR,
                expect.objectContaining({
                    message: 'Answers are locked for this question.',
                    code: 'ANSWERS_LOCKED'
                })
            );

            // Verify the error payload structure
            const errorCall = mockSocket.emit.mock.calls.find((call: any) =>
                call[0] === SOCKET_EVENTS.GAME.GAME_ERROR
            );
            expect(errorCall).toBeDefined();
            expect(errorCall![1]).toHaveProperty('message');
            expect(errorCall![1]).toHaveProperty('code');
        });

        it('should not leak internal state in lock error responses', async () => {
            // Set up game state with answers locked
            const gameState = {
                gameId: testGameId,
                accessCode: testAccessCode,
                status: 'active' as const,
                currentQuestionIndex: 0,
                questionUids: ['test-question-uid'],
                answersLocked: true,
                gameMode: 'quiz' as const,
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true
                }
            };
            await gameStateService.updateGameState(testAccessCode, gameState);

            // Create mock socket
            const mockSocket = {
                id: 'test-socket-id',
                emit: jest.fn(),
                data: { userId: testUser.id }
            } as any;

            // Create mock context
            const context: GameAnswerContext = {
                timer: {
                    status: 'run',
                    timerEndDateMs: Date.now() + 30000,
                    questionUid: 'test-question-uid'
                },
                gameState: { gameState },
                participant: {
                    id: 'test-participant-id',
                    userId: testUser.id,
                    liveScore: 0
                } as any,
                gameInstance: {
                    id: testGameId,
                    accessCode: testAccessCode,
                    playMode: 'quiz',
                    status: 'active'
                } as any
            };

            // Create answer payload
            const answerPayload: AnswerSubmissionPayload = {
                accessCode: testAccessCode,
                userId: testUser.id,
                questionUid: 'test-question-uid',
                answer: 'A',
                timeSpent: 5000
            };

            // Call the handler
            const handler = gameAnswerHandler(io, mockSocket, context);
            await handler(answerPayload);

            // Verify error response doesn't contain sensitive internal data
            const errorCall = mockSocket.emit.mock.calls.find((call: any) =>
                call[0] === SOCKET_EVENTS.GAME.GAME_ERROR
            );
            expect(errorCall).toBeDefined();

            const errorPayload = errorCall![1];

            // Should not contain internal state information
            expect(errorPayload).not.toHaveProperty('gameState');
            expect(errorPayload).not.toHaveProperty('internalState');
            expect(errorPayload).not.toHaveProperty('redisKey');
            expect(errorPayload).not.toHaveProperty('debugInfo');

            // Should only contain expected error fields
            expect(errorPayload).toHaveProperty('message');
            expect(errorPayload).toHaveProperty('code');
            expect(Object.keys(errorPayload)).toHaveLength(2); // Only message and code
        });
    });
});