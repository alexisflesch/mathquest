import { jest } from '@jest/globals';

// In-memory Redis mock
const redisStore = new Map<string, string>();
jest.mock('@/config/redis', () => ({
    redisClient: {
        async get(key: string) {
            return redisStore.get(key) ?? null;
        },
        async setex(key: string, _ttl: number, value: string) {
            redisStore.set(key, value);
            return 'OK';
        },
        async del(key: string) {
            redisStore.delete(key);
            return 1 as any;
        }
    }
}));

// Prisma mock: deterministic question data
const QUESTIONS = [
    { uid: 'Q1', gradeLevel: 'L2', discipline: 'Mathématiques', themes: ['A'] },
    { uid: 'Q2', gradeLevel: 'L2', discipline: 'Mathématiques', themes: ['A'] },
    { uid: 'Q3', gradeLevel: 'L2', discipline: 'Mathématiques', themes: ['A'] },
    { uid: 'Q4', gradeLevel: 'L2', discipline: 'Mathématiques', themes: ['A'] },
];

jest.mock('@/db/prisma', () => ({
    prisma: {
        question: {
            async findMany() {
                return QUESTIONS;
            },
            async findUnique({ where: { uid } }: any) {
                const q = QUESTIONS.find(q => q.uid === uid);
                if (!q) return null;
                return {
                    ...q,
                    title: `Title ${uid}`,
                    text: `Text for ${uid}`,
                    questionType: 'multipleChoice',
                    timeLimit: null,
                    multipleChoiceQuestion: {
                        answerOptions: ['A', 'B', 'C', 'D'],
                        correctAnswers: [true, false, false, false]
                    },
                    numericQuestion: null,
                    excludedFrom: []
                };
            }
        },
        gameTemplate: {
            // Not used in this test
            async findUnique() { return null; }
        },
        // Used when ending a session; we won't trigger completion in this test, but mock to be safe
        gameInstance: { async create() { return { id: 'gi1' }; } },
        gameParticipant: { async create() { return { id: 'gp1' }; } }
    }
}));

import { practiceSessionService } from '@/core/services/practiceSessionService';

describe('Practice session — question order persistence', () => {
    beforeEach(() => {
        redisStore.clear();
    });

    it('persists questionPool order across recovery and maintains currentQuestionIndex', async () => {
        // Stabilize randomness in case shuffle is used (not used here, but safe)
        const originalRandom = Math.random;
        (Math as any).random = () => 0.42;

        try {
            const settings = {
                gradeLevel: 'L2',
                discipline: 'Mathématiques',
                themes: ['A'],
                questionCount: 3,
                showImmediateFeedback: true,
                allowRetry: false,
                randomizeQuestions: false
            } as any;

            const userId = 'user-abc';
            const session = await practiceSessionService.createSession(userId, settings);

            expect(session.questionPool.length).toBe(3);
            // Capture initial pool and verify it is stable across recovery
            const initialPool = [...session.questionPool];
            expect(new Set(initialPool).size).toBe(3);
            expect(session.currentQuestionIndex).toBe(0);
            expect(session.currentQuestion?.uid).toBe(initialPool[0]);

            // Simulate answering first question to advance index
            await practiceSessionService.submitAnswer(session.sessionId, {
                sessionId: session.sessionId,
                questionUid: 'Q1',
                selectedAnswers: [0],
                timeSpentMs: 1000
            } as any);

            // "Recover" the session by fetching it (like GET_PRACTICE_SESSION_STATE)
            const recovered = await practiceSessionService.getSession(session.sessionId);
            expect(recovered).not.toBeNull();
            expect(recovered!.questionPool).toEqual(initialPool);
            expect(recovered!.currentQuestionIndex).toBe(1);
            expect(recovered!.currentQuestion?.uid).toBe(initialPool[1]);
        } finally {
            (Math as any).random = originalRandom;
        }
    });
});
