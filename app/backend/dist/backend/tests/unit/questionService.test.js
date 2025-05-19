"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const questionService_1 = require("@/core/services/questionService");
const prisma_1 = require("@/db/prisma");
const globals_1 = require("@jest/globals");
// Mock the prisma client
globals_1.jest.mock('@/db/prisma', () => ({
    prisma: {
        question: {
            create: globals_1.jest.fn(),
            findUnique: globals_1.jest.fn(),
            findMany: globals_1.jest.fn(),
            count: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
            delete: globals_1.jest.fn()
        }
    }
}));
// Type the mocked prisma.question methods for TypeScript compatibility
prisma_1.prisma.question.create = prisma_1.prisma.question.create;
prisma_1.prisma.question.findUnique = prisma_1.prisma.question.findUnique;
prisma_1.prisma.question.findMany = prisma_1.prisma.question.findMany;
prisma_1.prisma.question.count = prisma_1.prisma.question.count;
prisma_1.prisma.question.update = prisma_1.prisma.question.update;
prisma_1.prisma.question.delete = prisma_1.prisma.question.delete;
// Mock the logger
globals_1.jest.mock('@/utils/logger', () => {
    return globals_1.jest.fn().mockImplementation(() => ({
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        debug: globals_1.jest.fn()
    }));
});
describe('QuestionService', () => {
    globals_1.jest.setTimeout(3000);
    let questionService;
    const mockTeacherId = 'teacher-123';
    beforeEach(() => {
        questionService = new questionService_1.QuestionService();
        globals_1.jest.clearAllMocks();
    });
    describe('createQuestion', () => {
        it('should create a question successfully', async () => {
            const mockQuestionData = {
                title: 'Test Question',
                text: 'What is 2+2?',
                answerOptions: ['4', '5'],
                correctAnswers: [true, false],
                questionType: 'multiple_choice_single_answer',
                discipline: 'math',
                themes: ['arithmetic', 'addition'],
                difficulty: 1
            };
            const mockCreatedQuestion = {
                uid: 'question-123',
                ...mockQuestionData,
                author: mockTeacherId,
                tags: [],
                isHidden: undefined,
                timeLimit: undefined,
                gradeLevel: undefined,
                explanation: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            prisma_1.prisma.question.create.mockResolvedValue(mockCreatedQuestion);
            const result = await questionService.createQuestion(mockTeacherId, mockQuestionData);
            expect(prisma_1.prisma.question.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    title: mockQuestionData.title,
                    text: mockQuestionData.text,
                    answerOptions: mockQuestionData.answerOptions,
                    correctAnswers: mockQuestionData.correctAnswers,
                    questionType: mockQuestionData.questionType,
                    discipline: mockQuestionData.discipline,
                    themes: mockQuestionData.themes,
                    difficulty: mockQuestionData.difficulty,
                    author: mockTeacherId
                })
            });
            expect(result).toEqual(mockCreatedQuestion);
        });
        it('should handle errors during question creation', async () => {
            const mockQuestionData = {
                text: 'What is 2+2?',
                answerOptions: ['4', '5'],
                correctAnswers: [true, false],
                questionType: 'multiple_choice_single_answer',
                discipline: 'math',
                themes: ['arithmetic']
            };
            const mockError = new Error('Database error');
            prisma_1.prisma.question.create.mockRejectedValue(mockError);
            await expect(questionService.createQuestion(mockTeacherId, mockQuestionData))
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
                questionType: 'multiple_choice_single_answer',
                discipline: 'math',
                themes: ['arithmetic'],
                createdAt: new Date(),
                updatedAt: new Date()
            };
            prisma_1.prisma.question.findUnique.mockResolvedValue(mockQuestion);
            const result = await questionService.getQuestionById('question-123');
            expect(prisma_1.prisma.question.findUnique).toHaveBeenCalledWith({
                where: { uid: 'question-123' }
            });
            expect(result).toEqual(mockQuestion);
        });
        it('should return null if question is not found', async () => {
            prisma_1.prisma.question.findUnique.mockResolvedValue(null);
            const result = await questionService.getQuestionById('nonexistent-id');
            expect(result).toBeNull();
        });
        it('should throw an error if the database query fails', async () => {
            const mockError = new Error('Database error');
            prisma_1.prisma.question.findUnique.mockRejectedValue(mockError);
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
                    questionType: 'multiple_choice_single_answer',
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
            prisma_1.prisma.question.findMany.mockResolvedValue(mockQuestions);
            prisma_1.prisma.question.count.mockResolvedValue(mockTotal);
            const result = await questionService.getQuestions({ discipline: 'math', includeHidden: false }, { skip: 0, take: 10 });
            expect(prisma_1.prisma.question.findMany).toHaveBeenCalledWith(expect.objectContaining({
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
            expect(prisma_1.prisma.question.count).toHaveBeenCalledWith({
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
                    questionType: 'multiple_choice_single_answer',
                    themes: ['calculus'],
                    difficulty: 3,
                    gradeLevel: '12th Grade'
                }
            ];
            prisma_1.prisma.question.findMany.mockResolvedValue(mockQuestions);
            prisma_1.prisma.question.count.mockResolvedValue(1);
            await questionService.getQuestions({
                discipline: 'math',
                themes: ['calculus'],
                difficulty: 3,
                gradeLevel: '12th Grade',
                tags: ['advanced'],
                questionType: 'multiple_choice_single_answer'
            });
            expect(prisma_1.prisma.question.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    discipline: 'math',
                    themes: { hasSome: ['calculus'] },
                    difficulty: 3,
                    gradeLevel: '12th Grade',
                    tags: { hasSome: ['advanced'] },
                    questionType: 'multiple_choice_single_answer',
                    isHidden: false
                })
            }));
        });
        it('should handle errors when fetching questions', async () => {
            const mockError = new Error('Database error');
            prisma_1.prisma.question.findMany.mockRejectedValue(mockError);
            await expect(questionService.getQuestions())
                .rejects.toThrow(mockError);
        });
    });
    describe('updateQuestion', () => {
        it('should update a question successfully', async () => {
            const mockUpdateData = {
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
                questionType: 'multiple_choice_single_answer',
                discipline: 'math',
                themes: ['arithmetic']
            };
            const mockUpdatedQuestion = {
                ...mockExistingQuestion,
                ...mockUpdateData
            };
            prisma_1.prisma.question.findUnique.mockResolvedValue(mockExistingQuestion);
            prisma_1.prisma.question.update.mockResolvedValue(mockUpdatedQuestion);
            const result = await questionService.updateQuestion(mockUpdateData);
            expect(prisma_1.prisma.question.findUnique).toHaveBeenCalledWith({
                where: { uid: 'question-123' }
            });
            expect(prisma_1.prisma.question.update).toHaveBeenCalledWith({
                where: { uid: 'question-123' },
                data: { title: 'Updated Question', difficulty: 2 }
            });
            expect(result).toEqual(mockUpdatedQuestion);
        });
        it('should throw an error if the question does not exist', async () => {
            prisma_1.prisma.question.findUnique.mockResolvedValue(null);
            const mockUpdateData = {
                uid: 'nonexistent-id',
                title: 'Updated Question'
            };
            await expect(questionService.updateQuestion(mockUpdateData))
                .rejects.toThrow('Question with ID nonexistent-id not found');
        });
        it('should handle errors during question update', async () => {
            const mockUpdateData = {
                uid: 'question-123',
                title: 'Updated Question'
            };
            const mockExistingQuestion = {
                uid: 'question-123',
                title: 'Old Title'
            };
            prisma_1.prisma.question.findUnique.mockResolvedValue(mockExistingQuestion);
            const mockError = new Error('Database error');
            prisma_1.prisma.question.update.mockRejectedValue(mockError);
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
            prisma_1.prisma.question.findUnique.mockResolvedValue(mockExistingQuestion);
            prisma_1.prisma.question.delete.mockResolvedValue({});
            const result = await questionService.deleteQuestion('question-123');
            expect(prisma_1.prisma.question.findUnique).toHaveBeenCalledWith({
                where: { uid: 'question-123' }
            });
            expect(prisma_1.prisma.question.delete).toHaveBeenCalledWith({
                where: { uid: 'question-123' }
            });
            expect(result).toEqual({ success: true });
        });
        it('should throw an error if the question does not exist', async () => {
            prisma_1.prisma.question.findUnique.mockResolvedValue(null);
            await expect(questionService.deleteQuestion('nonexistent-id'))
                .rejects.toThrow('Question with ID nonexistent-id not found');
        });
        it('should handle errors during question deletion', async () => {
            const mockExistingQuestion = {
                uid: 'question-123',
                title: 'Test Question'
            };
            prisma_1.prisma.question.findUnique.mockResolvedValue(mockExistingQuestion);
            const mockError = new Error('Database error');
            prisma_1.prisma.question.delete.mockRejectedValue(mockError);
            await expect(questionService.deleteQuestion('question-123'))
                .rejects.toThrow(mockError);
        });
    });
});
