"use strict";
/**
 * Practice Session Service Unit Tests (New Architecture)
 *
 * Tests for the modernized practice session service.
 * Focuses on core functionality with current type definitions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const practiceSessionService_1 = require("@/core/services/practiceSessionService");
const redis_1 = require("@/config/redis");
// Mock Redis
jest.mock('@/config/redis', () => ({
    redisClient: {
        get: jest.fn(),
        setex: jest.fn(),
        del: jest.fn(),
        exists: jest.fn(),
    }
}));
// Mock Prisma
jest.mock('@/db/prisma', () => ({
    prisma: {
        question: {
            findMany: jest.fn().mockResolvedValue([
                { uid: 'q1' },
                { uid: 'q2' },
                { uid: 'q3' },
                { uid: 'q4' },
                { uid: 'q5' }
            ]),
            findUnique: jest.fn().mockResolvedValue({
                uid: 'q1',
                title: 'Test Question',
                text: 'What is 2+2?',
                answerOptions: ['2', '3', '4', '5'],
                questionType: 'MULTIPLE_CHOICE',
                timeLimit: 30000,
                gradeLevel: '6',
                discipline: 'arithmetic',
                themes: ['basic-operations']
            })
        }
    }
}));
const mockRedisClient = redis_1.redisClient;
describe('Practice Session Service - Core Functionality', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default Redis mocks
        mockRedisClient.get.mockResolvedValue(null);
        mockRedisClient.setex.mockResolvedValue('OK');
        mockRedisClient.del.mockResolvedValue(1);
        mockRedisClient.exists.mockResolvedValue(0);
    });
    describe('Session Creation', () => {
        it('should create a practice session with basic settings', async () => {
            const userId = 'test-user-123';
            const settings = {
                gradeLevel: '6',
                discipline: 'arithmetic',
                themes: ['basic-operations'],
                questionCount: 10,
                showImmediateFeedback: true,
                allowRetry: false,
                randomizeQuestions: false
            };
            const session = await practiceSessionService_1.practiceSessionService.createSession(userId, settings);
            // Verify session structure
            expect(session).toBeDefined();
            expect(session.sessionId).toBeDefined();
            expect(session.userId).toBe(userId);
            expect(session.settings).toEqual(settings);
            expect(session.currentQuestionIndex).toBe(0);
            expect(session.answers).toEqual([]);
            expect(session.createdAt).toBeDefined();
            // Verify Redis was called to store session
            expect(mockRedisClient.setex).toHaveBeenCalled();
        });
        it('should generate unique session IDs', async () => {
            const userId = 'test-user';
            const settings = {
                gradeLevel: '7',
                discipline: 'geometry',
                themes: ['shapes'],
                questionCount: 5,
                showImmediateFeedback: true,
                allowRetry: false,
                randomizeQuestions: false
            };
            const session1 = await practiceSessionService_1.practiceSessionService.createSession(userId, settings);
            const session2 = await practiceSessionService_1.practiceSessionService.createSession(userId, settings);
            expect(session1.sessionId).not.toBe(session2.sessionId);
        });
    });
    describe('Session Retrieval', () => {
        it('should retrieve existing session from Redis', async () => {
            const sessionId = 'test-session-123';
            const mockSessionData = {
                sessionId,
                userId: 'test-user',
                status: 'active',
                settings: {
                    gradeLevel: '6',
                    discipline: 'arithmetic',
                    themes: ['basic-math'],
                    questionCount: 10,
                    showImmediateFeedback: true,
                    allowRetry: false,
                    randomizeQuestions: false
                },
                createdAt: new Date().toISOString(),
                currentQuestionIndex: 0,
                answers: [],
                questionPool: [],
                statistics: {
                    questionsAttempted: 0,
                    correctAnswers: 0,
                    incorrectAnswers: 0,
                    accuracyPercentage: 0,
                    averageTimePerQuestion: 0,
                    totalTimeSpent: 0,
                    retriedQuestions: []
                },
                expiresAt: new Date(Date.now() + 3600000).toISOString()
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(mockSessionData));
            const session = await practiceSessionService_1.practiceSessionService.getSession(sessionId);
            expect(session).toBeDefined();
            expect(session?.sessionId).toBe(sessionId);
            expect(mockRedisClient.get).toHaveBeenCalledWith(`practice_session:${sessionId}`);
        });
        it('should return null for non-existent session', async () => {
            const sessionId = 'non-existent';
            mockRedisClient.get.mockResolvedValue(null);
            const session = await practiceSessionService_1.practiceSessionService.getSession(sessionId);
            expect(session).toBeNull();
        });
    });
    describe('Session Deletion', () => {
        it('should delete session from Redis', async () => {
            const sessionId = 'test-session-delete';
            mockRedisClient.del.mockResolvedValue(1);
            await practiceSessionService_1.practiceSessionService.deleteSession(sessionId);
            expect(mockRedisClient.del).toHaveBeenCalledWith(`practice_session:${sessionId}`);
        });
    });
    describe('Session State Management', () => {
        it('should handle session storage correctly', async () => {
            const userId = 'test-user';
            const settings = {
                gradeLevel: '8',
                discipline: 'geometry',
                themes: ['triangles'],
                questionCount: 3,
                showImmediateFeedback: true,
                allowRetry: false,
                randomizeQuestions: false
            };
            await practiceSessionService_1.practiceSessionService.createSession(userId, settings);
            // Verify Redis setex was called with appropriate TTL
            expect(mockRedisClient.setex).toHaveBeenCalled();
            const setexCall = mockRedisClient.setex.mock.calls[0];
            expect(setexCall[1]).toBe(86400); // 24 hour TTL
        });
    });
});
