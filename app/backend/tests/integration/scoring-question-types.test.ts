import { ScoringService } from '../../src/core/services/scoringService';
import { CanonicalTimerService } from '../../src/core/services/canonicalTimerService';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';
import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from '@jest/globals';

async function cleanupRedisFor(accessCode: string, questionUid: string) {
    try {
        const answerKeys = await redisClient.keys(`mathquest:game:answers:${accessCode}:${questionUid}*`);
        if (Array.isArray(answerKeys) && answerKeys.length) await Promise.all(answerKeys.map(k => redisClient.del(k)));
    } catch (e) { }
    try {
        const timerKeys = await redisClient.keys(`mathquest:timer:${accessCode}:${questionUid}*`);
        if (Array.isArray(timerKeys) && timerKeys.length) await Promise.all(timerKeys.map(k => redisClient.del(k)));
    } catch (e) { }
}

describe('ScoringService: Question Types', () => {
    let accessCode!: string;
    let userId!: string;
    let gameInstanceId!: string;
    let creatorId!: string;
    let templateId!: string;

    let timerService: CanonicalTimerService;
    beforeAll(async () => {
        timerService = new CanonicalTimerService(redisClient);
    });

    // Create fresh fixtures per test to avoid Redis/DB state leakage
    beforeEach(async () => {
        accessCode = `TEST-question-types-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        userId = `user-question-types-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        gameInstanceId = `game-question-types-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        creatorId = `creator-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        templateId = `template-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        // create users and template
        await prisma.user.upsert({ where: { id: creatorId }, create: { id: creatorId, username: creatorId, role: 'TEACHER' }, update: {} });
        await prisma.user.upsert({ where: { id: userId }, create: { id: userId, username: userId, role: 'STUDENT' }, update: {} });
        await prisma.gameTemplate.create({ data: { id: templateId, name: 'Test Template', themes: [], creatorId, discipline: 'Mathematics' } });

        // create game instance and participant
        await prisma.gameInstance.create({ data: { id: gameInstanceId, name: 'Test Game Instance', accessCode, playMode: 'tournament', status: 'ongoing', gameTemplateId: templateId } });
        await prisma.gameParticipant.create({ data: { id: `${userId}-participant`, gameInstanceId, userId, nbAttempts: 1 } });

        // ensure Redis is clean for this accessCode
        try {
            const keys = await redisClient.keys(`mathquest:*${accessCode}*`);
            if (Array.isArray(keys) && keys.length) await Promise.all(keys.map(k => redisClient.del(k)));
        } catch (e) {
            console.error('redis cleanup error', e);
        }
    });

    afterEach(async () => {
        try { await prisma.gameParticipant.deleteMany({ where: { gameInstanceId } }); } catch (e) { }
        try { await prisma.gameInstance.deleteMany({ where: { id: gameInstanceId } }); } catch (e) { }
        try { await prisma.gameTemplate.deleteMany({ where: { id: templateId } }); } catch (e) { }
        try { await prisma.user.deleteMany({ where: { id: creatorId } }); } catch (e) { }
        try { await prisma.user.deleteMany({ where: { id: userId } }); } catch (e) { }
        try { const keys = await redisClient.keys(`mathquest:*${accessCode}*`); if (Array.isArray(keys) && keys.length) await Promise.all(keys.map(k => redisClient.del(k))); } catch (e) { }
    });

    afterAll(async () => {
        // Cleanup: Remove test data from DB/Redis
        await prisma.gameParticipant.deleteMany({ where: { gameInstanceId } }).catch(() => null);
        await prisma.gameInstance.deleteMany({ where: { id: gameInstanceId } }).catch(() => null);
        await prisma.question.deleteMany({ where: { uid: { contains: 'question-' } } }).catch(() => null);
        await prisma.gameTemplate.deleteMany({ where: { id: templateId } }).catch(() => null);
        await prisma.user.deleteMany({ where: { id: creatorId } }).catch(() => null);
        await prisma.user.deleteMany({ where: { id: userId } }).catch(() => null);
        // remove Redis keys related to this accessCode
        try { await redisClient.del(`mathquest:game:${accessCode}`); } catch (e) { }
    });

    describe('Numeric Question', () => {
        const questionUid = `question-numeric-${Date.now()}`;
        beforeAll(async () => {
            await prisma.question.create({
                data: {
                    uid: questionUid,
                    text: 'What is 10 + 5?',
                    questionType: 'numeric',
                    discipline: 'Mathematics',
                    gradeLevel: 'CE1',
                    author: 'test',
                    timeLimit: 30,
                    numericQuestion: { create: { correctAnswer: 15, tolerance: 2 } }
                }
            });
        });
        it('correct answer, within tolerance', async () => {
            await cleanupRedisFor(accessCode, questionUid);
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: 15, timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBeGreaterThan(0);
            expect(result.scoreUpdated).toBe(true);
        });
        it('wrong answer, but within tolerance', async () => {
            await cleanupRedisFor(accessCode, questionUid);
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: 16.9, timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBeGreaterThan(0);
            expect(result.scoreUpdated).toBe(true);
        });
        it('wrong answer, outside tolerance', async () => {
            await cleanupRedisFor(accessCode, questionUid);
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: 18, timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBe(0);
            expect(result.scoreUpdated).toBe(false);
        });
        it('answer exactly at tolerance boundary', async () => {
            await cleanupRedisFor(accessCode, questionUid);
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: 17, timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBeGreaterThan(0);
            expect(result.scoreUpdated).toBe(true);
        });
        it('non-numeric input', async () => {
            await cleanupRedisFor(accessCode, questionUid);
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: 'not-a-number', timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBe(0);
            expect(result.scoreUpdated).toBe(false);
        });
    });

    describe('Single Choice Question', () => {
        const questionUid = `question-single-${Date.now()}`;
        beforeEach(async () => {
            try {
                const keys = await redisClient.keys(`mathquest:game:answers:${accessCode}:${questionUid}*`);
                if (Array.isArray(keys) && keys.length) await Promise.all(keys.map(k => redisClient.del(k)));
            } catch (e) { }
            try {
                const keys = await redisClient.keys(`mathquest:timer:${accessCode}:${questionUid}*`);
                if (Array.isArray(keys) && keys.length) await Promise.all(keys.map(k => redisClient.del(k)));
            } catch (e) { }
        });
        beforeAll(async () => {
            await prisma.question.create({
                data: {
                    uid: questionUid,
                    text: 'Pick the correct option',
                    questionType: 'multiple-choice',
                    discipline: 'Mathematics',
                    gradeLevel: 'CE1',
                    author: 'test',
                    timeLimit: 30,
                    multipleChoiceQuestion: { create: { answerOptions: ['A', 'B', 'C'], correctAnswers: [true, false, false] } }
                }
            });
        });
        it('correct option selected', async () => {
            await cleanupRedisFor(accessCode, questionUid);
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: 0, timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBeGreaterThan(0);
            expect(result.scoreUpdated).toBe(true);
        });
        it('incorrect option selected', async () => {
            await cleanupRedisFor(accessCode, questionUid);
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: 2, timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBe(0);
            expect(result.scoreUpdated).toBe(false);
        });
        it('out-of-range index', async () => {
            await cleanupRedisFor(accessCode, questionUid);
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: 5, timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBe(0);
            expect(result.scoreUpdated).toBe(false);
        });
        it('non-numeric input', async () => {
            await cleanupRedisFor(accessCode, questionUid);
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: 'A', timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBe(0);
            expect(result.scoreUpdated).toBe(false);
        });
    });

    describe('Multiple Choice Question', () => {
        const questionUid = `question-multiple-${Date.now()}`;
        beforeAll(async () => {
            await prisma.question.create({
                data: {
                    uid: questionUid,
                    text: 'Select all correct options',
                    questionType: 'multiple-choice',
                    discipline: 'Mathematics',
                    gradeLevel: 'CE1',
                    author: 'test',
                    timeLimit: 30,
                    multipleChoiceQuestion: { create: { answerOptions: ['A', 'B', 'C'], correctAnswers: [true, false, true] } }
                }
            });
        });
        it('all correct options, no extras', async () => {
            await cleanupRedisFor(accessCode, questionUid);
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: [0, 2], timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBeGreaterThan(0);
            expect(result.scoreUpdated).toBe(true);
        });
        it('some correct options missing', async () => {
            await cleanupRedisFor(accessCode, questionUid);
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: [0], timeSpent: 100, accessCode, userId }, false
            );
            // Original scoring grants partial credit when some correct options are selected
            expect(result.scoreAdded).toBeGreaterThan(0);
            expect(result.scoreUpdated).toBe(true);
        });
        it('extra incorrect options selected', async () => {
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: [0, 1, 2], timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBe(0);
            expect(result.scoreUpdated).toBe(false);
        });
        it('correct options, order shuffled', async () => {
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: [2, 0], timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBeGreaterThan(0);
            expect(result.scoreUpdated).toBe(true);
        });
        it('no options selected', async () => {
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: [], timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBe(0);
            expect(result.scoreUpdated).toBe(false);
        });
    });
});
