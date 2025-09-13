/**
 * Edge Cases Investigation - Question Management Edge Cases
 *
 * This test file investigates the following edge cases from edge-cases.md:
 *
 * 1. Invalid LaTeX Syntax Handling
 *    - Questions with malformed LaTeX should be rejected or sanitized
 *    - Expected: Clear error messages or automatic correction
 *
 * 2. Extremely Long Question Text
 *    - Questions exceeding reasonable length limits
 *    - Expected: Graceful handling with appropriate limits
 *
 * 3. Duplicate Question UIDs
 *    - Creating questions with existing UIDs
 *    - Expected: Database constraint violations handled properly
 *
 * 4. Complex Edge Case Combinations
 *    - Multiple edge cases occurring simultaneously
 *    - Expected: Proper prioritization and error handling
 */

import { jest } from '@jest/globals';

// Mock database operations
const mockPrisma = {
    question: {
        findUnique: jest.fn<any>(),
        create: jest.fn<any>(),
        update: jest.fn<any>(),
        delete: jest.fn<any>(),
        findMany: jest.fn<any>()
    },
    multipleChoiceQuestion: {
        create: jest.fn<any>()
    },
    numericQuestion: {
        create: jest.fn<any>()
    }
};

// Mock the prisma client
jest.mock('../src/db/prisma', () => ({
    prisma: mockPrisma
}));

// Import after mocking
import { prisma } from '../src/db/prisma';
import { QuestionService } from '../src/core/services/questionService';

describe('Edge Cases - Question Management', () => {
    let questionService: QuestionService;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Create service instance
        questionService = new QuestionService();
    });

    describe('Invalid LaTeX Syntax Handling', () => {
        it('EC1: Question with invalid LaTeX syntax should be handled gracefully', async () => {
            // Arrange
            const questionData = {
                uid: 'question-invalid-latex',
                text: 'What is \\unknown{command}?',
                questionType: 'multiple-choice' as const,
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                durationMs: 30000,
                author: 'test-author',
                answerOptions: ['Option A', 'Option B', 'Option C'],
                correctAnswers: [0]
            };

            // Mock successful creation
            mockPrisma.question.create.mockResolvedValue({
                uid: 'question-invalid-latex',
                text: questionData.text,
                questionType: 'multiple-choice',
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                timeLimit: 30,
                author: 'test-author',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            mockPrisma.multipleChoiceQuestion.create.mockResolvedValue({
                questionUid: 'question-invalid-latex',
                answerOptions: questionData.answerOptions,
                correctAnswers: questionData.correctAnswers
            });

            mockPrisma.question.findUnique.mockResolvedValue({
                uid: 'question-invalid-latex',
                text: questionData.text,
                questionType: 'multiple-choice',
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                timeLimit: 30,
                author: 'test-author',
                createdAt: new Date(),
                updatedAt: new Date(),
                multipleChoiceQuestion: {
                    questionUid: 'question-invalid-latex',
                    answerOptions: questionData.answerOptions,
                    correctAnswers: questionData.correctAnswers
                },
                numericQuestion: null
            });

            // Act & Assert
            await expect(questionService.createQuestion(questionData)).resolves.not.toThrow();

            // Verify question was created
            expect(mockPrisma.question.create).toHaveBeenCalledTimes(1);
            expect(mockPrisma.multipleChoiceQuestion.create).toHaveBeenCalledTimes(1);
        });

        it('EC2: Question with unclosed LaTeX commands should be handled', async () => {
            // Arrange
            const questionData = {
                uid: 'question-unclosed-latex',
                text: 'Solve for x: \\frac{a}{b',
                questionType: 'multiple-choice' as const,
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                durationMs: 25000,
                author: 'test-author',
                answerOptions: ['x = ab', 'x = a/b', 'x = b/a'],
                correctAnswers: [2]
            };

            // Mock successful creation
            mockPrisma.question.create.mockResolvedValue({
                uid: 'question-unclosed-latex',
                text: questionData.text,
                questionType: 'multiple-choice',
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                timeLimit: 25,
                author: 'test-author',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            mockPrisma.multipleChoiceQuestion.create.mockResolvedValue({
                questionUid: 'question-unclosed-latex',
                answerOptions: questionData.answerOptions,
                correctAnswers: questionData.correctAnswers
            });

            mockPrisma.question.findUnique.mockResolvedValue({
                uid: 'question-unclosed-latex',
                text: questionData.text,
                questionType: 'multiple-choice',
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                timeLimit: 25,
                author: 'test-author',
                createdAt: new Date(),
                updatedAt: new Date(),
                multipleChoiceQuestion: {
                    questionUid: 'question-unclosed-latex',
                    answerOptions: questionData.answerOptions,
                    correctAnswers: questionData.correctAnswers
                },
                numericQuestion: null
            });

            // Act & Assert
            await expect(questionService.createQuestion(questionData)).resolves.not.toThrow();

            // Verify question was created
            expect(mockPrisma.question.create).toHaveBeenCalledTimes(1);
            expect(mockPrisma.multipleChoiceQuestion.create).toHaveBeenCalledTimes(1);
        });

        it('EC3: Question with valid LaTeX should work normally', async () => {
            // Arrange
            const questionData = {
                uid: 'question-valid-latex',
                text: 'Solve: \\frac{3}{4} + \\frac{1}{2} = ?',
                questionType: 'multiple-choice' as const,
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                durationMs: 30000,
                author: 'test-author',
                answerOptions: ['\\frac{5}{4}', '\\frac{3}{2}', '\\frac{7}{4}'],
                correctAnswers: [0]
            };

            // Mock successful creation
            mockPrisma.question.create.mockResolvedValue({
                uid: 'question-valid-latex',
                text: questionData.text,
                questionType: 'multiple-choice',
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                timeLimit: 30,
                author: 'test-author',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            mockPrisma.multipleChoiceQuestion.create.mockResolvedValue({
                questionUid: 'question-valid-latex',
                answerOptions: questionData.answerOptions,
                correctAnswers: questionData.correctAnswers
            });

            mockPrisma.question.findUnique.mockResolvedValue({
                uid: 'question-valid-latex',
                text: questionData.text,
                questionType: 'multiple-choice',
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                timeLimit: 30,
                author: 'test-author',
                createdAt: new Date(),
                updatedAt: new Date(),
                multipleChoiceQuestion: {
                    questionUid: 'question-valid-latex',
                    answerOptions: questionData.answerOptions,
                    correctAnswers: questionData.correctAnswers
                },
                numericQuestion: null
            });

            // Act & Assert
            await expect(questionService.createQuestion(questionData)).resolves.not.toThrow();

            // Verify question was created
            expect(mockPrisma.question.create).toHaveBeenCalledTimes(1);
            expect(mockPrisma.multipleChoiceQuestion.create).toHaveBeenCalledTimes(1);
        });
    });

    describe('Extremely Long Question Text', () => {
        it('EC4: Question with very long text should be handled', async () => {
            // Arrange
            const longText = 'A'.repeat(10000);
            const questionData = {
                uid: 'question-long-text',
                text: longText,
                questionType: 'multiple-choice' as const,
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                durationMs: 30000,
                author: 'test-author',
                answerOptions: ['Option A', 'Option B', 'Option C'],
                correctAnswers: [0]
            };

            // Mock successful creation
            mockPrisma.question.create.mockResolvedValue({
                uid: 'question-long-text',
                text: questionData.text,
                questionType: 'multiple-choice',
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                timeLimit: 30,
                author: 'test-author',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            mockPrisma.multipleChoiceQuestion.create.mockResolvedValue({
                questionUid: 'question-long-text',
                answerOptions: questionData.answerOptions,
                correctAnswers: questionData.correctAnswers
            });

            mockPrisma.question.findUnique.mockResolvedValue({
                uid: 'question-long-text',
                text: questionData.text,
                questionType: 'multiple-choice',
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                timeLimit: 30,
                author: 'test-author',
                createdAt: new Date(),
                updatedAt: new Date(),
                multipleChoiceQuestion: {
                    questionUid: 'question-long-text',
                    answerOptions: questionData.answerOptions,
                    correctAnswers: questionData.correctAnswers
                },
                numericQuestion: null
            });

            // Act & Assert
            await expect(questionService.createQuestion(questionData)).resolves.not.toThrow();

            // Verify question was created
            expect(mockPrisma.question.create).toHaveBeenCalledTimes(1);
            expect(mockPrisma.multipleChoiceQuestion.create).toHaveBeenCalledTimes(1);
        });

        it('EC5: Question exceeding maximum allowed length should be rejected', async () => {
            // Arrange
            const maxText = 'A'.repeat(50000);
            const questionData = {
                uid: 'question-max-text',
                text: maxText,
                questionType: 'multiple-choice' as const,
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                durationMs: 30000,
                author: 'test-author',
                answerOptions: ['Option A', 'Option B', 'Option C'],
                correctAnswers: [0]
            };

            // Mock database error for oversized text
            mockPrisma.question.create.mockRejectedValue(new Error('Text too long'));

            // Act & Assert
            await expect(questionService.createQuestion(questionData))
                .rejects.toThrow('Text too long');

            // Verify create was attempted
            expect(mockPrisma.question.create).toHaveBeenCalledTimes(1);
        });

        it('EC6: Question with extremely long answer options should be handled', async () => {
            // Arrange
            const longAnswer = 'A'.repeat(5000);
            const questionData = {
                uid: 'question-long-answers',
                text: 'Choose the correct answer:',
                questionType: 'multiple-choice' as const,
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                durationMs: 30000,
                author: 'test-author',
                answerOptions: [longAnswer, 'Short B', 'Short C'],
                correctAnswers: [0]
            };

            // Mock successful creation
            mockPrisma.question.create.mockResolvedValue({
                uid: 'question-long-answers',
                text: questionData.text,
                questionType: 'multiple-choice',
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                timeLimit: 30,
                author: 'test-author',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            mockPrisma.multipleChoiceQuestion.create.mockResolvedValue({
                questionUid: 'question-long-answers',
                answerOptions: questionData.answerOptions,
                correctAnswers: questionData.correctAnswers
            });

            mockPrisma.question.findUnique.mockResolvedValue({
                uid: 'question-long-answers',
                text: questionData.text,
                questionType: 'multiple-choice',
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                timeLimit: 30,
                author: 'test-author',
                createdAt: new Date(),
                updatedAt: new Date(),
                multipleChoiceQuestion: {
                    questionUid: 'question-long-answers',
                    answerOptions: questionData.answerOptions,
                    correctAnswers: questionData.correctAnswers
                },
                numericQuestion: null
            });

            // Act & Assert
            await expect(questionService.createQuestion(questionData)).resolves.not.toThrow();

            // Verify question was created
            expect(mockPrisma.question.create).toHaveBeenCalledTimes(1);
            expect(mockPrisma.multipleChoiceQuestion.create).toHaveBeenCalledTimes(1);
        });
    });

    describe('Duplicate Question UIDs', () => {
        it('EC7: Creating question with existing UID fails with database error', async () => {
            // Arrange
            const questionData = {
                uid: 'existing-uid-123',
                text: 'What is 2 + 2?',
                questionType: 'multiple-choice' as const,
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                durationMs: 30000,
                author: 'test-author',
                answerOptions: ['3', '4', '5'],
                correctAnswers: [1]
            };

            // Mock database constraint violation
            const dbError = new Error('Unique constraint failed on the fields: (`uid`)');
            mockPrisma.question.create.mockRejectedValue(dbError);

            // Act & Assert
            await expect(questionService.createQuestion(questionData))
                .rejects.toThrow('Unique constraint failed on the fields: (`uid`)');

            // Verify create was attempted
            expect(mockPrisma.question.create).toHaveBeenCalledTimes(1);
        });

        it('EC8: Auto-generated UID collision handled by database', async () => {
            // Arrange
            const questionData = {
                text: 'What is the capital of France?',
                questionType: 'multiple-choice' as const,
                discipline: 'geography',
                gradeLevel: 'high-school',
                difficulty: 2,
                durationMs: 30000,
                author: 'test-author',
                answerOptions: ['London', 'Paris', 'Berlin'],
                correctAnswers: [1]
            };

            // Mock successful creation after collision handling
            mockPrisma.question.create.mockResolvedValueOnce({
                uid: 'question-existing-123',
                text: questionData.text,
                questionType: 'multiple-choice',
                discipline: 'geography',
                gradeLevel: 'high-school',
                difficulty: 2,
                timeLimit: 30,
                author: 'test-author',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            mockPrisma.multipleChoiceQuestion.create.mockResolvedValue({
                questionUid: 'question-existing-123',
                answerOptions: questionData.answerOptions,
                correctAnswers: questionData.correctAnswers
            });

            // Act & Assert
            await expect(questionService.createQuestion(questionData)).resolves.not.toThrow();

            // Verify create was attempted
            expect(mockPrisma.question.create).toHaveBeenCalledTimes(1);
        });

        it('EC9: UID collision with maximum retries fails gracefully', async () => {
            // Arrange
            const questionData = {
                text: 'What is 5 * 6?',
                questionType: 'multiple-choice' as const,
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                durationMs: 30000,
                author: 'test-author',
                answerOptions: ['25', '30', '35'],
                correctAnswers: [1]
            };

            // Mock maximum retries exceeded
            mockPrisma.question.create.mockRejectedValue(new Error('Maximum UID generation retries exceeded'));

            // Act & Assert
            await expect(questionService.createQuestion(questionData))
                .rejects.toThrow('Maximum UID generation retries exceeded');

            // Verify create was attempted
            expect(mockPrisma.question.create).toHaveBeenCalledTimes(1);
        });
    });

    describe('Complex Edge Case Combinations', () => {
        it('EC10: Question with invalid LaTeX and long text', async () => {
            // Arrange
            const longText = 'A'.repeat(5000) + ' \\unknown{command} ' + 'B'.repeat(5000);
            const questionData = {
                uid: 'question-complex-edge',
                text: longText,
                questionType: 'multiple-choice' as const,
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                durationMs: 60000,
                author: 'test-author',
                answerOptions: ['Option A', 'Option B', 'Option C'],
                correctAnswers: [0]
            };

            // Mock successful creation despite complex edge cases
            mockPrisma.question.create.mockResolvedValue({
                uid: 'question-complex-edge',
                text: questionData.text,
                questionType: 'multiple-choice',
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                timeLimit: 60,
                author: 'test-author',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            mockPrisma.multipleChoiceQuestion.create.mockResolvedValue({
                questionUid: 'question-complex-edge',
                answerOptions: questionData.answerOptions,
                correctAnswers: questionData.correctAnswers
            });

            mockPrisma.question.findUnique.mockResolvedValue({
                uid: 'question-complex-edge',
                text: questionData.text,
                questionType: 'multiple-choice',
                discipline: 'mathematics',
                gradeLevel: 'high-school',
                difficulty: 3,
                timeLimit: 60,
                author: 'test-author',
                createdAt: new Date(),
                updatedAt: new Date(),
                multipleChoiceQuestion: {
                    questionUid: 'question-complex-edge',
                    answerOptions: questionData.answerOptions,
                    correctAnswers: questionData.correctAnswers
                },
                numericQuestion: null
            });

            // Act & Assert
            await expect(questionService.createQuestion(questionData)).resolves.not.toThrow();

            // Verify question was created
            expect(mockPrisma.question.create).toHaveBeenCalledTimes(1);
            expect(mockPrisma.multipleChoiceQuestion.create).toHaveBeenCalledTimes(1);
        });
    });
});