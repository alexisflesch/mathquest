import { ScoringService } from '../../src/core/services/scoringService';
import { CanonicalTimerService } from '../../src/core/services/canonicalTimerService';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';

describe('ScoringService: Question Types', () => {
    const accessCode = `TEST-question-types-${Date.now()}`;
    const questionUidNumeric = `question-numeric-${Date.now()}`;
    const questionUidSingle = `question-single-${Date.now()}`;
    const questionUidMultiple = `question-multiple-${Date.now()}`;
    const userId = `user-question-types-${Date.now()}`;
    const gameInstanceId = `game-question-types-${Date.now()}`;

    let timerService: CanonicalTimerService;
    beforeAll(async () => {
        timerService = new CanonicalTimerService(redisClient);
        // Setup: Insert mock questions into DB if needed
        // ...existing code...
    });

    afterAll(async () => {
        // Cleanup: Remove test data from DB/Redis
        // ...existing code...
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
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: 15, timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBeGreaterThan(0);
            expect(result.scoreUpdated).toBe(true);
        });
        it('wrong answer, but within tolerance', async () => {
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: 16.9, timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBeGreaterThan(0);
            expect(result.scoreUpdated).toBe(true);
        });
        it('wrong answer, outside tolerance', async () => {
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: 18, timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBe(0);
            expect(result.scoreUpdated).toBe(false);
        });
        it('answer exactly at tolerance boundary', async () => {
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: 17, timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBeGreaterThan(0);
            expect(result.scoreUpdated).toBe(true);
        });
        it('non-numeric input', async () => {
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
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: 0, timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBeGreaterThan(0);
            expect(result.scoreUpdated).toBe(true);
        });
        it('incorrect option selected', async () => {
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: 2, timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBe(0);
            expect(result.scoreUpdated).toBe(false);
        });
        it('out-of-range index', async () => {
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: 5, timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBe(0);
            expect(result.scoreUpdated).toBe(false);
        });
        it('non-numeric input', async () => {
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
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: [0, 2], timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBeGreaterThan(0);
            expect(result.scoreUpdated).toBe(true);
        });
        it('some correct options missing', async () => {
            await timerService.startTimer(accessCode, questionUid, 'tournament', false, userId);
            const result = await ScoringService.submitAnswerWithScoring(
                gameInstanceId, userId, { questionUid, answer: [0], timeSpent: 100, accessCode, userId }, false
            );
            expect(result.scoreAdded).toBe(0);
            expect(result.scoreUpdated).toBe(false);
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
