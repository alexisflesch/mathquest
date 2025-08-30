import { beforeAll, afterAll, beforeEach, describe, it, expect } from '@jest/globals';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';
import { ScoringService } from '../../src/core/services/scoringService';
import { CanonicalTimerService } from '../../src/core/services/canonicalTimerService';

// Test the new scoring strategy implementation
describe('New Scoring Strategy', () => {
    let timerService: CanonicalTimerService;
    let testData: any;

    beforeAll(async () => {
        timerService = new CanonicalTimerService(redisClient);
        await redisClient.flushall();
    });

    afterAll(async () => {
        await redisClient.flushall();
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        const timestamp = Date.now();
        const uniqueId = `new-scoring-${timestamp}`;
        testData = {
            accessCode: `TEST-${uniqueId}`,
            gameId: `game-${uniqueId}`,
            questionUids: [
                `question-mc-${uniqueId}`,
                `question-numeric-${uniqueId}`,
                `question-mc-partial-${uniqueId}`
            ],
            users: [
                { id: `user-${uniqueId}-1`, username: 'TestUser1', socketId: `socket-${uniqueId}-1` }
            ]
        };

        // Clean up existing data
        await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testData.gameId } });
        await prisma.gameInstance.deleteMany({ where: { id: testData.gameId } });
        await prisma.gameTemplate.deleteMany({ where: { creatorId: testData.users[0].id } });
        await prisma.user.deleteMany({ where: { id: { in: testData.users.map((u: any) => u.id) } } });
        await prisma.multipleChoiceQuestion.deleteMany({ where: { questionUid: { in: testData.questionUids } } });
        await prisma.numericQuestion.deleteMany({ where: { questionUid: { in: testData.questionUids } } });
        await prisma.question.deleteMany({ where: { uid: { in: testData.questionUids } } });

        // Create user
        for (const user of testData.users) {
            await prisma.user.create({
                data: {
                    id: user.id,
                    username: user.username,
                    email: `${user.id}@test.com`,
                    role: 'STUDENT'
                }
            });
        }

        // Create questions for testing different scoring scenarios

        // Multiple choice question with 3 options, 2 correct
        await prisma.question.create({
            data: {
                uid: testData.questionUids[0],
                title: 'Multiple Choice Test Question',
                text: 'Select all correct answers (A and C are correct)',
                questionType: 'multiple_choice',
                timeLimit: 30, // 30 seconds
                discipline: 'Math',
                themes: ['Test'],
                difficulty: 1,
                multipleChoiceQuestion: {
                    create: {
                        answerOptions: ['Option A (Correct)', 'Option B (Wrong)', 'Option C (Correct)'],
                        correctAnswers: [true, false, true]
                    }
                }
            }
        });

        // Numeric question
        await prisma.question.create({
            data: {
                uid: testData.questionUids[1],
                title: 'Numeric Test Question',
                text: 'What is 2 + 2?',
                questionType: 'numeric',
                timeLimit: 15, // 15 seconds
                discipline: 'Math',
                themes: ['Test'],
                difficulty: 1,
                numericQuestion: {
                    create: {
                        correctAnswer: 4,
                        tolerance: 0.1
                    }
                }
            }
        });

        // Another multiple choice with partial scoring test
        await prisma.question.create({
            data: {
                uid: testData.questionUids[2],
                title: 'Partial Scoring Test',
                text: 'Select the two correct answers out of four options',
                questionType: 'multiple_choice',
                timeLimit: 45, // 45 seconds
                discipline: 'Math',
                themes: ['Test'],
                difficulty: 2,
                multipleChoiceQuestion: {
                    create: {
                        answerOptions: ['A (Correct)', 'B (Wrong)', 'C (Correct)', 'D (Wrong)'],
                        correctAnswers: [true, false, true, false]
                    }
                }
            }
        });

        // Create game template and instance
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'New Scoring Test Template',
                description: 'Test new scoring strategy',
                creator: { connect: { id: testData.users[0].id } }
            }
        });

        await prisma.gameInstance.create({
            data: {
                id: testData.gameId,
                accessCode: testData.accessCode,
                name: 'New Scoring Test Game',
                status: 'active',
                playMode: 'quiz',
                gameTemplateId: gameTemplate.id
            }
        });

        // Create participant
        await prisma.gameParticipant.create({
            data: {
                id: testData.users[0].id,
                gameInstanceId: testData.gameId,
                userId: testData.users[0].id,
                status: 'ACTIVE',
                liveScore: 0,
                deferredScore: 0,
                nbAttempts: 0,
                joinedAt: new Date(),
                lastActiveAt: new Date()
            }
        });

        // Set up Redis game data with question list for scaling
        const gameDataKey = `mathquest:game:${testData.accessCode}`;
        await redisClient.set(gameDataKey, JSON.stringify({
            questionUids: testData.questionUids,
            totalQuestions: testData.questionUids.length
        }));
    });

    describe('Game Scaling to 1000 Points', () => {
        it('should scale total game to 1000 points across all questions', async () => {
            const user = testData.users[0];
            const totalQuestions = testData.questionUids.length; // 3 questions
            const expectedScorePerQuestion = 1000 / totalQuestions; // ~333.33 points per question

            // Answer all questions perfectly with no time penalty
            for (const questionUid of testData.questionUids) {
                await timerService.startTimer(testData.accessCode, questionUid, 'quiz', false, user.id);

                let answer: any;
                if (questionUid === testData.questionUids[0]) {
                    // Multiple choice: select both correct answers
                    answer = [0, 2]; // A and C are correct
                } else if (questionUid === testData.questionUids[1]) {
                    // Numeric: correct answer
                    answer = 4;
                } else {
                    // Another multiple choice: select both correct answers
                    answer = [0, 2]; // A and C are correct
                }

                // Submit answer immediately (minimal time penalty)
                await ScoringService.submitAnswerWithScoring(
                    testData.gameId,
                    user.id,
                    {
                        questionUid,
                        answer,
                        timeSpent: 100, // 100ms - very fast
                        accessCode: testData.accessCode,
                        userId: user.id
                    }
                );
            }

            // Get final score from Redis
            const participantKey = `mathquest:game:participants:${testData.accessCode}`;
            const participantData = await redisClient.hget(participantKey, user.id);
            const finalScore = participantData ? JSON.parse(participantData).score : 0;

            // Score should be close to 1000 (allowing for small time penalties)
            expect(finalScore).toBeGreaterThan(990);
            expect(finalScore).toBeLessThanOrEqual(1000);
        });
    });

    describe('Multiple Choice Balanced Scoring', () => {
        it('should reward partial correct answers in multiple choice', async () => {
            const user = testData.users[0];
            const questionUid = testData.questionUids[2]; // 4 options, 2 correct (A and C)

            await timerService.startTimer(testData.accessCode, questionUid, 'quiz', false, user.id);

            // Select only one correct answer (A) and no incorrect answers
            // Expected: C_B = 1, B = 2, C_M = 0, M = 2
            // raw_score = max(0, (1/2) - (0/2)) = 0.5
            const result = await ScoringService.submitAnswerWithScoring(
                testData.gameId,
                user.id,
                {
                    questionUid,
                    answer: [0], // Only A (correct)
                    timeSpent: 1000,
                    accessCode: testData.accessCode,
                    userId: user.id
                }
            );

            // Should get partial credit (around 50% of the base score per question)
            const baseScorePerQuestion = 1000 / testData.questionUids.length;
            const expectedPartialScore = baseScorePerQuestion * 0.5; // 50% correctness

            expect(result.scoreAdded).toBeGreaterThan(expectedPartialScore * 0.8); // Allow for time penalty
            expect(result.scoreAdded).toBeLessThan(expectedPartialScore);
        });

        it('should penalize incorrect selections', async () => {
            const user = testData.users[0];
            const questionUid = testData.questionUids[0]; // 3 options, 2 correct (A and C)

            await timerService.startTimer(testData.accessCode, questionUid, 'quiz', false, user.id);

            // Select one correct (A) and one incorrect (B)
            // Expected: C_B = 1, B = 2, C_M = 1, M = 1
            // raw_score = max(0, (1/2) - (1/1)) = max(0, 0.5 - 1) = 0
            const result = await ScoringService.submitAnswerWithScoring(
                testData.gameId,
                user.id,
                {
                    questionUid,
                    answer: [0, 1], // A (correct) and B (incorrect)
                    timeSpent: 1000,
                    accessCode: testData.accessCode,
                    userId: user.id
                }
            );

            // Should get zero points due to penalty
            expect(result.scoreAdded).toBe(0);
        });

        it('should give full credit for perfect multiple choice answer', async () => {
            const user = testData.users[0];
            const questionUid = testData.questionUids[0]; // 3 options, 2 correct (A and C)

            await timerService.startTimer(testData.accessCode, questionUid, 'quiz', false, user.id);

            // Select both correct answers and no incorrect ones
            const result = await ScoringService.submitAnswerWithScoring(
                testData.gameId,
                user.id,
                {
                    questionUid,
                    answer: [0, 2], // A and C (both correct)
                    timeSpent: 1000,
                    accessCode: testData.accessCode,
                    userId: user.id
                }
            );

            const baseScorePerQuestion = 1000 / testData.questionUids.length;

            // Should get close to full score (minus small time penalty)
            expect(result.scoreAdded).toBeGreaterThan(baseScorePerQuestion * 0.9);
            expect(result.scoreAdded).toBeLessThanOrEqual(baseScorePerQuestion);
        });
    });

    describe('Logarithmic Time Penalty', () => {
        it('should apply minimal penalty for quick answers', async () => {
            const user = testData.users[0];
            const questionUid = testData.questionUids[1]; // Numeric question with 15s time limit

            await timerService.startTimer(testData.accessCode, questionUid, 'quiz', false, user.id);

            // Answer very quickly (100ms)
            await new Promise(resolve => setTimeout(resolve, 100));

            const result = await ScoringService.submitAnswerWithScoring(
                testData.gameId,
                user.id,
                {
                    questionUid,
                    answer: 4, // Correct answer
                    timeSpent: 100,
                    accessCode: testData.accessCode,
                    userId: user.id
                }
            );

            const baseScorePerQuestion = 1000 / testData.questionUids.length;

            // Quick answer should have minimal penalty (> 95% of base score)
            expect(result.scoreAdded).toBeGreaterThan(baseScorePerQuestion * 0.95);
        });

        it('should apply moderate penalty for medium-speed answers', async () => {
            const user = testData.users[0];
            const questionUid = testData.questionUids[1]; // Numeric question with 15s time limit

            await timerService.startTimer(testData.accessCode, questionUid, 'quiz', false, user.id);

            // Answer at medium speed (7.5s = half the time limit)
            await new Promise(resolve => setTimeout(resolve, 7500));

            const result = await ScoringService.submitAnswerWithScoring(
                testData.gameId,
                user.id,
                {
                    questionUid,
                    answer: 4, // Correct answer
                    timeSpent: 7500,
                    accessCode: testData.accessCode,
                    userId: user.id
                }
            );

            const baseScorePerQuestion = 1000 / testData.questionUids.length;

            // Medium speed should have moderate penalty (70-95% of base score)
            expect(result.scoreAdded).toBeGreaterThan(baseScorePerQuestion * 0.7);
            expect(result.scoreAdded).toBeLessThan(baseScorePerQuestion * 0.95);
        });

        it('should apply maximum penalty for slow answers', async () => {
            const user = testData.users[0];
            const questionUid = testData.questionUids[1]; // Numeric question with 15s time limit

            await timerService.startTimer(testData.accessCode, questionUid, 'quiz', false, user.id);

            // Answer at maximum time (15s)
            await new Promise(resolve => setTimeout(resolve, 15000));

            const result = await ScoringService.submitAnswerWithScoring(
                testData.gameId,
                user.id,
                {
                    questionUid,
                    answer: 4, // Correct answer
                    timeSpent: 15000,
                    accessCode: testData.accessCode,
                    userId: user.id
                }
            );

            const baseScorePerQuestion = 1000 / testData.questionUids.length;

            // Slow answer should have maximum penalty (70% of base score with α=0.3)
            expect(result.scoreAdded).toBeGreaterThan(baseScorePerQuestion * 0.65);
            expect(result.scoreAdded).toBeLessThan(baseScorePerQuestion * 0.75);
        });
    });

    describe('Numeric Question Scoring', () => {
        it('should give full credit for correct numeric answer', async () => {
            const user = testData.users[0];
            const questionUid = testData.questionUids[1]; // Numeric question: 2+2=4

            await timerService.startTimer(testData.accessCode, questionUid, 'quiz', false, user.id);

            const result = await ScoringService.submitAnswerWithScoring(
                testData.gameId,
                user.id,
                {
                    questionUid,
                    answer: 4, // Correct answer
                    timeSpent: 1000,
                    accessCode: testData.accessCode,
                    userId: user.id
                }
            );

            const baseScorePerQuestion = 1000 / testData.questionUids.length;

            // Should get close to full score (minus small time penalty)
            expect(result.scoreAdded).toBeGreaterThan(baseScorePerQuestion * 0.9);
            expect(result.scoreAdded).toBeLessThanOrEqual(baseScorePerQuestion);
        });

        it('should give zero credit for incorrect numeric answer', async () => {
            const user = testData.users[0];
            const questionUid = testData.questionUids[1]; // Numeric question: 2+2=4

            await timerService.startTimer(testData.accessCode, questionUid, 'quiz', false, user.id);

            const result = await ScoringService.submitAnswerWithScoring(
                testData.gameId,
                user.id,
                {
                    questionUid,
                    answer: 5, // Incorrect answer
                    timeSpent: 1000,
                    accessCode: testData.accessCode,
                    userId: user.id
                }
            );

            // Should get zero points for wrong answer
            expect(result.scoreAdded).toBe(0);
        });

        it('should handle tolerance correctly', async () => {
            const user = testData.users[0];
            const questionUid = testData.questionUids[1]; // Numeric question with tolerance 0.1

            await timerService.startTimer(testData.accessCode, questionUid, 'quiz', false, user.id);

            const result = await ScoringService.submitAnswerWithScoring(
                testData.gameId,
                user.id,
                {
                    questionUid,
                    answer: 4.05, // Within tolerance (4 ± 0.1)
                    timeSpent: 1000,
                    accessCode: testData.accessCode,
                    userId: user.id
                }
            );

            const baseScorePerQuestion = 1000 / testData.questionUids.length;

            // Should get credit for answer within tolerance
            expect(result.scoreAdded).toBeGreaterThan(baseScorePerQuestion * 0.9);
        });
    });
});
