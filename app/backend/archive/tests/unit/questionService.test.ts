import { QuestionService, QuestionCreationData, QuestionUpdateData } from '@/core/services/questionService';
import { prisma } from '@/db/prisma';
import { jest } from '@jest/globals';
import { QUESTION_TYPES } from '@shared/constants/questionTypes';

// Mock the prisma client
jest.mock('@/db/prisma', () => ({
    prisma: {
        question: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        }
    }
}));

// Type the mocked prisma.question methods for TypeScript compatibility
(prisma.question.create as jest.Mock) = prisma.question.create as jest.Mock;
(prisma.question.findUnique as jest.Mock) = prisma.question.findUnique as jest.Mock;
(prisma.question.findMany as jest.Mock) = prisma.question.findMany as jest.Mock;
(prisma.question.count as jest.Mock) = prisma.question.count as jest.Mock;
(prisma.question.update as jest.Mock) = prisma.question.update as jest.Mock;
(prisma.question.delete as jest.Mock) = prisma.question.delete as jest.Mock;

// Mock the logger
jest.mock('@/utils/logger', () => {
    return jest.fn().mockImplementation(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }));
});

describe('QuestionService', () => {
    jest.setTimeout(3000);

    let questionService: QuestionService;
    const mockuserId = 'teacher-123';

    beforeEach(() => {
        questionService = new QuestionService();
        jest.clearAllMocks();
    });

    describe('createQuestion', () => {
        it('should create a question successfully', async () => {
            const mockQuestionData: QuestionCreationData = {
                title: 'Test Question',
                text: 'What is 2+2?',
                answerOptions: ['4', '5'],
                correctAnswers: [true, false],
                questionType: QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                discipline: 'math',
                themes: ['arithmetic', 'addition'],
                difficulty: 1,
                durationMs: 30000 // Added canonical timer field
            };
            const mockCreatedQuestion = {
                uid: 'question-123',
                ...mockQuestionData,
                author: mockuserId,
                tags: [],
                isHidden: undefined,
                timeLimit: undefined,
                gradeLevel: undefined,
                explanation: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            (prisma.question.create as any).mockResolvedValue(mockCreatedQuestion);
            const result = await questionService.createQuestion(mockuserId, mockQuestionData);
            expect(prisma.question.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    title: mockQuestionData.title,
                    text: mockQuestionData.text,
                    answerOptions: mockQuestionData.answerOptions,
                    correctAnswers: mockQuestionData.correctAnswers,
                    questionType: mockQuestionData.questionType,
                    discipline: mockQuestionData.discipline,
                    themes: mockQuestionData.themes,
                    difficulty: mockQuestionData.difficulty,
                    author: mockuserId
                })
            });
            expect(result).toEqual(mockCreatedQuestion);
        });
        it('should handle errors during question creation', async () => {
            const mockQuestionData: QuestionCreationData = {
                text: 'What is 2+2?',
                answerOptions: ['4', '5'],
                correctAnswers: [true, false],
                questionType: QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                discipline: 'math',
                themes: ['arithmetic'],
                durationMs: 30000 // Added canonical timer field
            };
            const mockError = new Error('Database error');
            (prisma.question.create as any).mockRejectedValue(mockError);
            await expect(questionService.createQuestion(mockuserId, mockQuestionData))
                .rejects.toThrow(mockError);
        });
    });

    describe('getQuestionById', () => {
        it('should return a question by ID', async () => {
            const mockQuestion = {
                uid: 'question-123',
                title: 'Test Question',
                text: 'What is 2+2?',
                answerOptions: ['4', '5'],
                correctAnswers: [true, false],
                questionType: QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                discipline: 'math',
                themes: ['arithmetic'],
                createdAt: new Date(),
                updatedAt: new Date()
            };
            (prisma.question.findUnique as any).mockResolvedValue(mockQuestion);
            const result = await questionService.getQuestionById('question-123');
            expect(prisma.question.findUnique).toHaveBeenCalledWith({
                where: { uid: 'question-123' }
            });
            expect(result).toEqual(mockQuestion);
        });
        it('should return null if question is not found', async () => {
            (prisma.question.findUnique as any).mockResolvedValue(null);
            const result = await questionService.getQuestionById('nonexistent-id');
            expect(result).toBeNull();
        });
        it('should throw an error if the database query fails', async () => {
            const mockError = new Error('Database error');
            (prisma.question.findUnique as any).mockRejectedValue(mockError);
            await expect(questionService.getQuestionById('question-123'))
                .rejects.toThrow(mockError);
        });
    });

    describe('getQuestions', () => {
        it('should get questions with filters', async () => {
            const mockQuestions = [
                {
                    uid: 'question-1',
                    title: 'Math Question',
                    text: 'What is 2+2?',
                    discipline: 'math',
                    questionType: QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                    themes: ['arithmetic']
                },
                {
                    uid: 'question-2',
                    title: 'Science Question',
                    text: 'What is H2O?',
                    discipline: 'science',
                    questionType: 'multiple_choice_multiple_answers',
                    themes: ['chemistry']
                }
            ];
            const mockTotal = 2;
            (prisma.question.findMany as any).mockResolvedValue(mockQuestions);
            (prisma.question.count as any).mockResolvedValue(mockTotal);
            const result = await questionService.getQuestions(
                { discipline: 'math', includeHidden: false },
                { skip: 0, take: 10 }
            );
            expect(prisma.question.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    discipline: 'math',
                    isHidden: false
                }),
                skip: 0,
                take: 10,
                orderBy: {
                    createdAt: 'desc'
                }
            }));
            expect(prisma.question.count).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    discipline: 'math',
                    isHidden: false
                })
            });
            expect(result).toEqual({
                questions: mockQuestions,
                total: mockTotal,
                page: 1,
                pageSize: 10,
                totalPages: 1
            });
        });
        it('should apply multiple filters correctly', async () => {
            const mockQuestions = [
                {
                    uid: 'question-1',
                    title: 'Advanced Math',
                    discipline: 'math',
                    questionType: QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                    themes: ['calculus'],
                    difficulty: 3,
                    gradeLevel: '12th Grade'
                }
            ];
            (prisma.question.findMany as any).mockResolvedValue(mockQuestions);
            (prisma.question.count as any).mockResolvedValue(1);
            await questionService.getQuestions(
                {
                    discipline: 'math',
                    themes: ['calculus'],
                    difficulty: 3,
                    gradeLevel: '12th Grade',
                    tags: ['advanced'],
                    questionType: QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER
                }
            );
            expect(prisma.question.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    discipline: 'math',
                    themes: { hasSome: ['calculus'] },
                    difficulty: 3,
                    gradeLevel: '12th Grade',
                    tags: { hasSome: ['advanced'] },
                    questionType: QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                    isHidden: false
                })
            }));
        });
        it('should apply multiple values within filter types using OR logic', async () => {
            const mockQuestions = [
                {
                    uid: 'question-1',
                    title: 'Math Question',
                    discipline: 'math',
                    gradeLevel: '10th Grade',
                    themes: ['algebra']
                },
                {
                    uid: 'question-2',
                    title: 'Science Question',
                    discipline: 'science',
                    gradeLevel: '11th Grade',
                    themes: ['chemistry']
                }
            ];
            (prisma.question.findMany as any).mockResolvedValue(mockQuestions);
            (prisma.question.count as any).mockResolvedValue(2);

            // Test multiple disciplines and grade levels (OR within each filter, AND between filters)
            await questionService.getQuestions({
                disciplines: ['math', 'science'],
                gradeLevels: ['10th Grade', '11th Grade'],
                authors: ['teacher1', 'teacher2']
            });

            expect(prisma.question.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    discipline: { in: ['math', 'science'] },
                    gradeLevel: { in: ['10th Grade', '11th Grade'] },
                    author: { in: ['teacher1', 'teacher2'] },
                    isHidden: false
                })
            }));
        });
        it('should handle errors when fetching questions', async () => {
            const mockError = new Error('Database error');
            (prisma.question.findMany as any).mockRejectedValue(mockError);
            await expect(questionService.getQuestions())
                .rejects.toThrow(mockError);
        });
    });

    describe('updateQuestion', () => {
        it('should update a question successfully', async () => {
            const mockUpdateData: QuestionUpdateData = {
                uid: 'question-123',
                title: 'Updated Question',
                difficulty: 2
            };
            const mockExistingQuestion = {
                uid: 'question-123',
                title: 'Old Title',
                difficulty: 1,
                text: 'What is 2+2?',
                answerOptions: ['4', '5'],
                correctAnswers: [true, false],
                questionType: QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                discipline: 'math',
                themes: ['arithmetic']
            };
            const mockUpdatedQuestion = {
                ...mockExistingQuestion,
                ...mockUpdateData
            };
            (prisma.question.findUnique as any).mockResolvedValue(mockExistingQuestion);
            (prisma.question.update as any).mockResolvedValue(mockUpdatedQuestion);
            const result = await questionService.updateQuestion(mockUpdateData);
            expect(prisma.question.findUnique).toHaveBeenCalledWith({
                where: { uid: 'question-123' }
            });
            expect(prisma.question.update).toHaveBeenCalledWith({
                where: { uid: 'question-123' },
                data: { title: 'Updated Question', difficulty: 2 }
            });
            expect(result).toEqual(mockUpdatedQuestion);
        });
        it('should throw an error if the question does not exist', async () => {
            (prisma.question.findUnique as any).mockResolvedValue(null);
            const mockUpdateData: QuestionUpdateData = {
                uid: 'nonexistent-id',
                title: 'Updated Question'
            };
            await expect(questionService.updateQuestion(mockUpdateData))
                .rejects.toThrow('Question with ID nonexistent-id not found');
        });
        it('should handle errors during question update', async () => {
            const mockUpdateData: QuestionUpdateData = {
                uid: 'question-123',
                title: 'Updated Question'
            };
            const mockExistingQuestion = {
                uid: 'question-123',
                title: 'Old Title'
            };
            (prisma.question.findUnique as any).mockResolvedValue(mockExistingQuestion);
            const mockError = new Error('Database error');
            (prisma.question.update as any).mockRejectedValue(mockError);
            await expect(questionService.updateQuestion(mockUpdateData))
                .rejects.toThrow(mockError);
        });
    });

    describe('deleteQuestion', () => {
        it('should delete a question successfully', async () => {
            const mockExistingQuestion = {
                uid: 'question-123',
                title: 'Test Question'
            };
            (prisma.question.findUnique as any).mockResolvedValue(mockExistingQuestion);
            (prisma.question.delete as any).mockResolvedValue({});
            const result = await questionService.deleteQuestion('question-123');
            expect(prisma.question.findUnique).toHaveBeenCalledWith({
                where: { uid: 'question-123' }
            });
            expect(prisma.question.delete).toHaveBeenCalledWith({
                where: { uid: 'question-123' }
            });
            expect(result).toEqual({ success: true });
        });
        it('should throw an error if the question does not exist', async () => {
            (prisma.question.findUnique as any).mockResolvedValue(null);
            await expect(questionService.deleteQuestion('nonexistent-id'))
                .rejects.toThrow('Question with ID nonexistent-id not found');
        });
        it('should handle errors during question deletion', async () => {
            const mockExistingQuestion = {
                uid: 'question-123',
                title: 'Test Question'
            };
            (prisma.question.findUnique as any).mockResolvedValue(mockExistingQuestion);
            const mockError = new Error('Database error');
            (prisma.question.delete as any).mockRejectedValue(mockError);
            await expect(questionService.deleteQuestion('question-123'))
                .rejects.toThrow(mockError);
        });
    });
});
