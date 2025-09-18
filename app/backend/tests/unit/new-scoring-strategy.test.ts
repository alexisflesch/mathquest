// Set Redis URL before importing modules that depend on it
process.env.REDIS_URL = "redis://localhost:6379";
process.env.DATABASE_URL = "postgresql://postgres:password@localhost:5432/mathquest_test";

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { redisClient } from '../../src/config/redis';
import { ScoringService } from '../../src/core/services/scoringService';

// Unit tests for the new scoring calculation logic
describe('New Scoring Strategy - Unit Tests', () => {
    beforeAll(async () => {
        await redisClient.flushall();
    });

    afterAll(async () => {
        await redisClient.flushall();
    });

    describe('calculateAnswerScore', () => {
        it('should calculate correct score for multiple choice with perfect answer', async () => {
            // Set up Redis with game data and timer
            const accessCode = 'TEST123';
            const questionUid = 'test-question-1';

            // Game data with 2 questions (500 points each)
            await redisClient.set(`mathquest:game:${accessCode}`, JSON.stringify({
                questionUids: [questionUid, 'question-2']
            }));

            // Timer data with 30 second duration
            await redisClient.set(`mathquest:timer:${accessCode}:${questionUid}`, JSON.stringify({
                durationMs: 30000,
                status: 'active'
            }));

            const question = {
                uid: questionUid,
                questionType: 'multiple_choice',
                multipleChoiceQuestion: {
                    correctAnswers: [true, false, true] // A and C are correct
                }
            };

            // Perfect answer with minimal time
            const { score, timePenalty } = await ScoringService.calculateAnswerScore(
                question,
                [0, 2], // Select A and C (both correct)
                1000, // 1 second
                1000, // total presentation time (same as time spent for this test)
                accessCode
            );

            // Should get close to 500 points (1000/2 questions) with some penalty for 1s on 30s limit
            expect(score).toBeGreaterThan(450);
            expect(score).toBeLessThanOrEqual(500);
            expect(timePenalty).toBeGreaterThan(0);
            expect(timePenalty).toBeLessThan(50);
        });

        it('should calculate partial score for multiple choice with partial correct answer', async () => {
            const accessCode = 'TEST124';
            const questionUid = 'test-question-2';

            await redisClient.set(`mathquest:game:${accessCode}`, JSON.stringify({
                questionUids: [questionUid, 'question-2', 'question-3'] // 3 questions = 333.33 points each
            }));

            await redisClient.set(`mathquest:timer:${accessCode}:${questionUid}`, JSON.stringify({
                durationMs: 45000
            }));

            const question = {
                uid: questionUid,
                questionType: 'multiple_choice',
                multipleChoiceQuestion: {
                    correctAnswers: [true, false, true, false] // A and C are correct, B and D are wrong
                }
            };

            // Select only one correct answer (A) and no wrong answers
            // Expected: C_B=1, B=2, C_M=0, M=2 -> raw_score = (1/2) - (0/2) = 0.5
            const { score } = await ScoringService.calculateAnswerScore(
                question,
                [0], // Select only A (correct)
                2000, // 2 seconds
                2000, // total presentation time (same as time spent for this test)
                accessCode
            );

            const baseScorePerQuestion = 1000 / 3;
            const expectedScore = baseScorePerQuestion * 0.5; // 50% correctness

            // Should get approximately half the base score
            expect(score).toBeGreaterThan(expectedScore * 0.8); // Allow for time penalty
            expect(score).toBeLessThan(expectedScore);
        });

        it('should give zero score for multiple choice with net negative', async () => {
            const accessCode = 'TEST125';
            const questionUid = 'test-question-3';

            await redisClient.set(`mathquest:game:${accessCode}`, JSON.stringify({
                questionUids: [questionUid]
            }));

            await redisClient.set(`mathquest:timer:${accessCode}:${questionUid}`, JSON.stringify({
                durationMs: 30000
            }));

            const question = {
                uid: questionUid,
                questionType: 'multiple_choice',
                multipleChoiceQuestion: {
                    correctAnswers: [true, false, true] // A and C are correct, B is wrong
                }
            };

            // Select one correct (A) and one wrong (B)
            // Expected: C_B=1, B=2, C_M=1, M=1 -> raw_score = (1/2) - (1/1) = -0.5 -> 0
            const { score } = await ScoringService.calculateAnswerScore(
                question,
                [0, 1], // A (correct) and B (wrong)
                1000,
                1000, // total presentation time (same as time spent for this test)
                accessCode
            );

            expect(score).toBe(0);
        });

        it('should calculate score for numeric question', async () => {
            const accessCode = 'TEST126';
            const questionUid = 'test-question-4';

            await redisClient.set(`mathquest:game:${accessCode}`, JSON.stringify({
                questionUids: [questionUid]
            }));

            await redisClient.set(`mathquest:timer:${accessCode}:${questionUid}`, JSON.stringify({
                durationMs: 20000
            }));

            const question = {
                uid: questionUid,
                questionType: 'numeric',
                numericQuestion: {
                    correctAnswer: 42,
                    tolerance: 0.1
                }
            };

            // Correct answer
            const { score } = await ScoringService.calculateAnswerScore(
                question,
                42,
                1000,
                1000, // total presentation time (same as time spent for this test)
                accessCode
            );

            // Should get close to 1000 points (single question game) with some penalty for 1s on 20s limit
            expect(score).toBeGreaterThan(900);
            expect(score).toBeLessThanOrEqual(1000);
        });

        it('should apply logarithmic time penalty correctly', async () => {
            const accessCode = 'TEST127';
            const questionUid = 'test-question-5';

            await redisClient.set(`mathquest:game:${accessCode}`, JSON.stringify({
                questionUids: [questionUid]
            }));

            await redisClient.set(`mathquest:timer:${accessCode}:${questionUid}`, JSON.stringify({
                durationMs: 30000 // 30 seconds
            }));

            const question = {
                uid: questionUid,
                questionType: 'numeric',
                numericQuestion: {
                    correctAnswer: 10,
                    tolerance: 0
                }
            };

            // Test different time penalties
            const fastAnswer = await ScoringService.calculateAnswerScore(question, 10, 500, 500, accessCode); // 0.5s
            const mediumAnswer = await ScoringService.calculateAnswerScore(question, 10, 15000, 15000, accessCode); // 15s
            const slowAnswer = await ScoringService.calculateAnswerScore(question, 10, 30000, 30000, accessCode); // 30s (max)

            // Fast answer should have higher score than medium, medium higher than slow
            expect(fastAnswer.score).toBeGreaterThan(mediumAnswer.score);
            expect(mediumAnswer.score).toBeGreaterThan(slowAnswer.score);

            // Slow answer should be around 70% of base score (30% max penalty)
            expect(slowAnswer.score).toBeGreaterThan(650);
            expect(slowAnswer.score).toBeLessThan(750);
        });

        it('should handle missing Redis data gracefully', async () => {
            const accessCode = 'NONEXISTENT';
            const questionUid = 'test-question-6';

            const question = {
                uid: questionUid,
                questionType: 'numeric',
                numericQuestion: {
                    correctAnswer: 5,
                    tolerance: 0
                }
            };

            // Should use defaults when Redis data is missing
            const { score } = await ScoringService.calculateAnswerScore(
                question,
                5,
                1000,
                1000, // total presentation time (same as time spent for this test)
                accessCode
            );

            // Should still calculate a score using defaults (10 questions, 60s duration)
            expect(score).toBeGreaterThan(90); // 1000/10 = 100 points per question, minus small penalty
            expect(score).toBeLessThanOrEqual(100);
        });
    });
});
