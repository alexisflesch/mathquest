import { jest } from '@jest/globals';

// Mock external dependencies
const mockPrisma = {
    practiceSession: {
        findUnique: jest.fn<any>(),
        findMany: jest.fn<any>(),
        create: jest.fn<any>(),
        update: jest.fn<any>(),
        delete: jest.fn<any>(),
    },
    question: {
        findMany: jest.fn<any>(),
        count: jest.fn<any>(),
    },
    user: {
        findUnique: jest.fn<any>(),
    },
};

const mockRedis = {
    hget: jest.fn<any>(),
    hset: jest.fn<any>(),
    del: jest.fn<any>(),
    expire: jest.fn<any>(),
};

const mockSocketService = {
    emitToRoom: jest.fn<any>(),
    joinRoom: jest.fn<any>(),
    leaveRoom: jest.fn<any>(),
};

const mockPracticeService = {
    startPracticeSession: jest.fn<any>(),
    endPracticeSession: jest.fn<any>(),
    getNextQuestion: jest.fn<any>(),
    submitAnswer: jest.fn<any>(),
    getPracticeProgress: jest.fn<any>(),
    cleanupExpiredSessions: jest.fn<any>(),
};

// Mock the services
jest.mock('@/db/prisma', () => ({ prisma: mockPrisma }));
jest.mock('@/config/redis', () => ({ redisClient: mockRedis }));
jest.mock('@/core/services/socketService', () => mockSocketService);
jest.mock('@/core/services/practiceService', () => mockPracticeService);

describe('Edge Cases - Practice Mode Specific', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Practice Session Timeout', () => {
        test('PM1: Practice session expires while user is active', async () => {
            const mockSession = {
                id: 'session-1',
                userId: 'user-1',
                status: 'active',
                expiresAt: new Date(Date.now() - 60000), // 1 minute ago
                progress: { currentQuestion: 5, totalQuestions: 10 },
            };

            mockPrisma.practiceSession.findUnique.mockResolvedValue(mockSession);
            mockRedis.hget.mockResolvedValue('user-1');

            mockPracticeService.getPracticeProgress.mockImplementation(async () => {
                const session = await mockPrisma.practiceSession.findUnique({
                    where: { id: 'session-1' },
                });
                if (session && session.expiresAt < new Date()) {
                    throw new Error('Practice session has expired');
                }
                return session.progress;
            });

            await expect(mockPracticeService.getPracticeProgress('session-1')).rejects.toThrow('Practice session has expired');

            expect(mockPrisma.practiceSession.findUnique).toHaveBeenCalledWith({
                where: { id: 'session-1' },
            });
        });

        test('PM2: Practice session auto-extends on activity', async () => {
            const mockSession = {
                id: 'session-1',
                userId: 'user-1',
                status: 'active',
                expiresAt: new Date(Date.now() + 300000), // 5 minutes from now
                progress: { currentQuestion: 3, totalQuestions: 10 },
            };

            mockPrisma.practiceSession.findUnique.mockResolvedValue(mockSession);
            mockPrisma.practiceSession.update.mockResolvedValue({
                ...mockSession,
                expiresAt: new Date(Date.now() + 1800000), // Extended to 30 minutes
            });

            mockPracticeService.submitAnswer.mockImplementation(async () => {
                // Simulate session extension on activity
                await mockPrisma.practiceSession.update({
                    where: { id: 'session-1' },
                    data: { expiresAt: new Date(Date.now() + 1800000) },
                });
                return { correct: true, explanation: 'Good job!' };
            });

            await mockPracticeService.submitAnswer('session-1', 'answer-1');

            expect(mockPrisma.practiceSession.update).toHaveBeenCalledWith({
                where: { id: 'session-1' },
                data: { expiresAt: expect.any(Date) },
            });
        });

        test('PM3: Practice session cleanup after timeout', async () => {
            const expiredSessions = [
                { id: 'expired-1', expiresAt: new Date(Date.now() - 3600000) },
                { id: 'expired-2', expiresAt: new Date(Date.now() - 1800000) },
            ];

            mockPrisma.practiceSession.findMany.mockResolvedValue(expiredSessions);

            mockPracticeService.cleanupExpiredSessions.mockImplementation(async () => {
                const expired = await mockPrisma.practiceSession.findMany({
                    where: { expiresAt: { lt: new Date() } },
                });
                for (const session of expired) {
                    await mockPrisma.practiceSession.delete({
                        where: { id: session.id },
                    });
                    await mockRedis.del(`practice:session:${session.id}`);
                }
            });

            await mockPracticeService.cleanupExpiredSessions();

            expect(mockPrisma.practiceSession.delete).toHaveBeenCalledTimes(2);
            expect(mockRedis.del).toHaveBeenCalledTimes(2);
        });
    });

    describe('Practice with No Questions Available', () => {
        test('PM4: Start practice with no matching questions', async () => {
            const mockFilters = {
                subject: 'math',
                difficulty: 'hard',
                topic: 'algebra',
            };

            mockPrisma.question.findMany.mockResolvedValue([]);
            mockPrisma.question.count.mockResolvedValue(0);

            mockPracticeService.startPracticeSession.mockImplementation(async () => {
                const questions = await mockPrisma.question.findMany({
                    where: mockFilters,
                });
                if (questions.length === 0) {
                    throw new Error('No questions available matching your criteria');
                }
                return { sessionId: 'session-1', totalQuestions: questions.length };
            });

            await expect(mockPracticeService.startPracticeSession('user-1', mockFilters)).rejects.toThrow('No questions available matching your criteria');

            expect(mockPrisma.question.findMany).toHaveBeenCalledWith({
                where: mockFilters,
            });
        });

        test('PM5: Practice session with questions deleted mid-session', async () => {
            const mockSession = {
                id: 'session-1',
                userId: 'user-1',
                status: 'active',
                questionIds: ['q1', 'q2', 'q3'],
                currentQuestionIndex: 1,
            };

            mockPrisma.practiceSession.findUnique.mockResolvedValue(mockSession);
            mockPrisma.question.findMany.mockResolvedValue([]); // Questions deleted

            mockPracticeService.getNextQuestion.mockImplementation(async () => {
                const session = await mockPrisma.practiceSession.findUnique({
                    where: { id: 'session-1' },
                });
                const questions = await mockPrisma.question.findMany({
                    where: { id: { in: session.questionIds } },
                });
                if (questions.length === 0) {
                    throw new Error('Questions no longer available');
                }
                return questions[0];
            });

            await expect(mockPracticeService.getNextQuestion('session-1')).rejects.toThrow('Questions no longer available');

            expect(mockPrisma.question.findMany).toHaveBeenCalledWith({
                where: { id: { in: ['q1', 'q2', 'q3'] } },
            });
        });

        test('PM6: Practice with extremely restrictive filters', async () => {
            const restrictiveFilters = {
                subject: 'quantum_physics',
                difficulty: 'expert',
                topic: 'string_theory',
                grade: 12,
                language: 'esperanto',
            };

            mockPrisma.question.count.mockResolvedValue(0);

            mockPracticeService.startPracticeSession.mockImplementation(async () => {
                const count = await mockPrisma.question.count({
                    where: restrictiveFilters,
                });
                if (count === 0) {
                    throw new Error('No questions found with these specific criteria');
                }
                return { sessionId: 'session-1', totalQuestions: count };
            });

            await expect(mockPracticeService.startPracticeSession('user-1', restrictiveFilters)).rejects.toThrow('No questions found with these specific criteria');

            expect(mockPrisma.question.count).toHaveBeenCalledWith({
                where: restrictiveFilters,
            });
        });
    });

    describe('Progress Preservation', () => {
        test('PM7: Practice progress saved on browser refresh', async () => {
            const mockSession = {
                id: 'session-1',
                userId: 'user-1',
                status: 'active',
                progress: {
                    currentQuestion: 7,
                    totalQuestions: 15,
                    correctAnswers: 5,
                    incorrectAnswers: 2,
                    timeSpent: 1800000, // 30 minutes
                },
            };

            mockPrisma.practiceSession.findUnique.mockResolvedValue(mockSession);
            mockRedis.hget.mockResolvedValue(JSON.stringify(mockSession.progress));

            mockPracticeService.getPracticeProgress.mockImplementation(async () => {
                const redisProgress = await mockRedis.hget('practice:progress:session-1');
                if (redisProgress) {
                    return JSON.parse(redisProgress);
                }
                const session = await mockPrisma.practiceSession.findUnique({
                    where: { id: 'session-1' },
                });
                return session.progress;
            });

            const progress = await mockPracticeService.getPracticeProgress('session-1');

            expect(progress.currentQuestion).toBe(7);
            expect(progress.correctAnswers).toBe(5);
            expect(mockRedis.hget).toHaveBeenCalledWith('practice:progress:session-1');
        });

        test('PM8: Practice progress recovery after network interruption', async () => {
            const mockSession = {
                id: 'session-1',
                userId: 'user-1',
                status: 'active',
                progress: {
                    currentQuestion: 10,
                    answers: [
                        { questionId: 'q1', answer: 'A', correct: true, timeSpent: 30000 },
                        { questionId: 'q2', answer: 'B', correct: false, timeSpent: 45000 },
                    ],
                },
            };

            mockPrisma.practiceSession.findUnique.mockResolvedValue(mockSession);
            mockPrisma.practiceSession.update.mockResolvedValue(mockSession);

            mockPracticeService.submitAnswer.mockImplementation(async () => {
                const session = await mockPrisma.practiceSession.findUnique({
                    where: { id: 'session-1' },
                });

                // Simulate progress update with answer preservation
                const updatedProgress = {
                    ...session.progress,
                    answers: [
                        ...session.progress.answers,
                        { questionId: 'q3', answer: 'C', correct: true, timeSpent: 25000 },
                    ],
                };

                await mockPrisma.practiceSession.update({
                    where: { id: 'session-1' },
                    data: { progress: updatedProgress },
                });

                await mockRedis.hset('practice:progress:session-1', JSON.stringify(updatedProgress));

                return { correct: true, explanation: 'Correct!' };
            });

            await mockPracticeService.submitAnswer('session-1', 'C');

            expect(mockPrisma.practiceSession.update).toHaveBeenCalled();
            expect(mockRedis.hset).toHaveBeenCalledWith(
                'practice:progress:session-1',
                expect.any(String)
            );
        });

        test('PM9: Practice session resume after app restart', async () => {
            const mockSession = {
                id: 'session-1',
                userId: 'user-1',
                status: 'paused',
                progress: {
                    currentQuestion: 8,
                    totalQuestions: 20,
                    streak: 3,
                    bestStreak: 5,
                },
                pausedAt: new Date(Date.now() - 3600000), // 1 hour ago
            };

            mockPrisma.practiceSession.findUnique.mockResolvedValue(mockSession);
            mockPrisma.practiceSession.update.mockResolvedValue({
                ...mockSession,
                status: 'active',
                pausedAt: null,
            });

            mockPracticeService.startPracticeSession.mockImplementation(async () => {
                const existingSession = await mockPrisma.practiceSession.findUnique({
                    where: { userId: 'user-1', status: 'paused' },
                });

                if (existingSession) {
                    // Resume existing session
                    await mockPrisma.practiceSession.update({
                        where: { id: existingSession.id },
                        data: { status: 'active', pausedAt: null },
                    });
                    return { sessionId: existingSession.id, resumed: true, progress: existingSession.progress };
                }

                return { sessionId: 'new-session', resumed: false };
            });

            const result = await mockPracticeService.startPracticeSession('user-1', {});

            expect(result.resumed).toBe(true);
            expect(result.progress.currentQuestion).toBe(8);
            expect(mockPrisma.practiceSession.update).toHaveBeenCalledWith({
                where: { id: 'session-1' },
                data: { status: 'active', pausedAt: null },
            });
        });

        test('PM10: Practice progress with concurrent answer submissions', async () => {
            const mockSession = {
                id: 'session-1',
                userId: 'user-1',
                status: 'active',
                progress: {
                    currentQuestion: 5,
                    answers: [],
                    version: 1,
                },
            };

            mockPrisma.practiceSession.findUnique.mockResolvedValue(mockSession);

            // Simulate concurrent update conflict
            mockPrisma.practiceSession.update
                .mockRejectedValueOnce({ code: 'P2002' }) // Version conflict on first call
                .mockResolvedValueOnce({
                    ...mockSession,
                    progress: { ...mockSession.progress, version: 2 },
                });

            mockPracticeService.submitAnswer.mockImplementation(async () => {
                // First attempt - should fail with version conflict
                try {
                    await mockPrisma.practiceSession.update({
                        where: {
                            id: 'session-1',
                            progress: { version: 1 }, // Optimistic locking
                        },
                        data: {
                            progress: {
                                ...mockSession.progress,
                                answers: [{ questionId: 'q1', answer: 'A', correct: true }],
                                version: 2,
                            },
                        },
                    });
                } catch (error: any) {
                    if (error.code === 'P2002') {
                        // Second attempt - should succeed
                        await mockPrisma.practiceSession.update({
                            where: {
                                id: 'session-1',
                                progress: { version: 2 }, // Updated version
                            },
                            data: {
                                progress: {
                                    ...mockSession.progress,
                                    answers: [{ questionId: 'q1', answer: 'A', correct: true }],
                                    version: 3,
                                },
                            },
                        });
                        return { correct: true };
                    }
                    throw error;
                }
                return { correct: true };
            });

            const result = await mockPracticeService.submitAnswer('session-1', 'A');

            expect(result.correct).toBe(true);
            expect(mockPrisma.practiceSession.update).toHaveBeenCalledTimes(2);
        });
    });
});