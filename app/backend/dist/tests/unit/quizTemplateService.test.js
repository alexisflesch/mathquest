"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const quizTemplateService_1 = require("@/core/services/quizTemplateService");
const prisma_1 = require("@/db/prisma");
const globals_1 = require("@jest/globals");
// Mock the prisma client
globals_1.jest.mock('@/db/prisma', () => ({
    prisma: {
        quizTemplate: {
            create: globals_1.jest.fn(),
            findUnique: globals_1.jest.fn(),
            findFirst: globals_1.jest.fn(),
            findMany: globals_1.jest.fn(),
            count: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
            delete: globals_1.jest.fn()
        },
        question: {
            findUnique: globals_1.jest.fn()
        },
        questionsInQuizTemplate: {
            create: globals_1.jest.fn(),
            delete: globals_1.jest.fn(),
            update: globals_1.jest.fn()
        }
    }
}));
// Mock the logger
globals_1.jest.mock('@/utils/logger', () => {
    return globals_1.jest.fn().mockImplementation(() => ({
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        debug: globals_1.jest.fn()
    }));
});
describe('QuizTemplateService', () => {
    let quizTemplateService;
    const mockTeacherId = 'teacher-123';
    beforeEach(() => {
        quizTemplateService = new quizTemplateService_1.QuizTemplateService();
        globals_1.jest.clearAllMocks();
    });
    describe('createQuizTemplate', () => {
        it('should create a quiz template successfully', async () => {
            const mockQuizData = {
                name: 'Test Quiz',
                themes: ['algebra', 'geometry'],
                discipline: 'math',
                gradeLevel: '9',
                description: 'A test quiz',
                defaultMode: 'class'
            };
            const mockCreatedQuiz = {
                id: 'quiz-123',
                creatorTeacherId: mockTeacherId,
                ...mockQuizData,
                createdAt: new Date(),
                updatedAt: new Date(),
                questions: []
            };
            prisma_1.prisma.quizTemplate.create.mockResolvedValue(mockCreatedQuiz);
            const result = await quizTemplateService.createQuizTemplate(mockTeacherId, mockQuizData);
            expect(prisma_1.prisma.quizTemplate.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: mockQuizData.name,
                    creatorTeacherId: mockTeacherId,
                    themes: mockQuizData.themes,
                    discipline: mockQuizData.discipline,
                    gradeLevel: mockQuizData.gradeLevel,
                    description: mockQuizData.description,
                    defaultMode: mockQuizData.defaultMode
                }),
                include: {
                    questions: {
                        include: {
                            question: true
                        }
                    }
                }
            });
            expect(result).toEqual(mockCreatedQuiz);
        });
        it('should handle errors during quiz template creation', async () => {
            const mockQuizData = {
                name: 'Test Quiz',
                themes: ['algebra']
            };
            const mockError = new Error('Database error');
            prisma_1.prisma.quizTemplate.create.mockRejectedValue(mockError);
            await expect(quizTemplateService.createQuizTemplate(mockTeacherId, mockQuizData))
                .rejects.toThrow(mockError);
        });
    });
    describe('getQuizTemplateById', () => {
        it('should return a quiz template by ID', async () => {
            const mockQuizTemplate = {
                id: 'quiz-123',
                name: 'Test Quiz',
                creatorTeacherId: mockTeacherId,
                themes: ['algebra'],
                createdAt: new Date(),
                updatedAt: new Date(),
                questions: []
            };
            prisma_1.prisma.quizTemplate.findUnique.mockResolvedValue(mockQuizTemplate);
            const result = await quizTemplateService.getQuizTemplateById('quiz-123');
            expect(prisma_1.prisma.quizTemplate.findUnique).toHaveBeenCalledWith({
                where: { id: 'quiz-123' },
                include: undefined
            });
            expect(result).toEqual(mockQuizTemplate);
        });
        it('should include questions when includeQuestions is true', async () => {
            const mockQuizTemplate = {
                id: 'quiz-123',
                name: 'Test Quiz',
                creatorTeacherId: mockTeacherId,
                themes: ['algebra'],
                questions: [
                    {
                        quizTemplateId: 'quiz-123',
                        questionUid: 'question-1',
                        sequence: 1,
                        question: { uid: 'question-1', text: 'Question 1' }
                    }
                ]
            };
            prisma_1.prisma.quizTemplate.findUnique.mockResolvedValue(mockQuizTemplate);
            const result = await quizTemplateService.getQuizTemplateById('quiz-123', true);
            expect(prisma_1.prisma.quizTemplate.findUnique).toHaveBeenCalledWith({
                where: { id: 'quiz-123' },
                include: {
                    questions: {
                        include: {
                            question: true
                        },
                        orderBy: {
                            sequence: 'asc'
                        }
                    }
                }
            });
            expect(result).toEqual(mockQuizTemplate);
        });
    });
    describe('getQuizTemplates', () => {
        it('should get quiz templates with filters', async () => {
            const mockQuizTemplates = [
                {
                    id: 'quiz-1',
                    name: 'Math Quiz',
                    discipline: 'math',
                    questions: []
                },
                {
                    id: 'quiz-2',
                    name: 'Science Quiz',
                    discipline: 'science',
                    questions: []
                }
            ];
            const mockTotal = 2;
            prisma_1.prisma.quizTemplate.findMany.mockResolvedValue(mockQuizTemplates);
            prisma_1.prisma.quizTemplate.count.mockResolvedValue(mockTotal);
            const result = await quizTemplateService.getQuizTemplates(mockTeacherId, { discipline: 'math' }, { skip: 0, take: 10 });
            expect(prisma_1.prisma.quizTemplate.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    creatorTeacherId: mockTeacherId,
                    discipline: 'math'
                }),
                skip: 0,
                take: 10
            }));
            expect(result).toEqual({
                quizTemplates: mockQuizTemplates,
                total: mockTotal,
                page: 1,
                pageSize: 10,
                totalPages: 1
            });
        });
    });
    describe('updateQuizTemplate', () => {
        it('should update a quiz template successfully', async () => {
            const mockUpdateData = {
                id: 'quiz-123',
                name: 'Updated Quiz',
                description: 'Updated description'
            };
            const mockExistingQuiz = {
                id: 'quiz-123',
                name: 'Old Name',
                description: 'Old description',
                creatorTeacherId: mockTeacherId
            };
            const mockUpdatedQuiz = {
                ...mockExistingQuiz,
                ...mockUpdateData,
                questions: []
            };
            prisma_1.prisma.quizTemplate.findFirst.mockResolvedValue(mockExistingQuiz);
            prisma_1.prisma.quizTemplate.update.mockResolvedValue(mockUpdatedQuiz);
            const result = await quizTemplateService.updateQuizTemplate(mockTeacherId, mockUpdateData);
            expect(prisma_1.prisma.quizTemplate.findFirst).toHaveBeenCalledWith({
                where: {
                    id: 'quiz-123',
                    creatorTeacherId: mockTeacherId
                }
            });
            expect(prisma_1.prisma.quizTemplate.update).toHaveBeenCalledWith({
                where: { id: 'quiz-123' },
                data: {
                    name: 'Updated Quiz',
                    description: 'Updated description'
                },
                include: {
                    questions: {
                        include: {
                            question: true
                        },
                        orderBy: {
                            sequence: 'asc'
                        }
                    }
                }
            });
            expect(result).toEqual(mockUpdatedQuiz);
        });
        it('should throw an error if the quiz template does not exist', async () => {
            prisma_1.prisma.quizTemplate.findFirst.mockResolvedValue(null);
            const mockUpdateData = {
                id: 'nonexistent-id',
                name: 'Updated Quiz'
            };
            await expect(quizTemplateService.updateQuizTemplate(mockTeacherId, mockUpdateData))
                .rejects.toThrow('Quiz template with ID nonexistent-id not found or you don\'t have permission to update it');
        });
    });
    describe('deleteQuizTemplate', () => {
        it('should delete a quiz template successfully', async () => {
            const mockExistingQuiz = {
                id: 'quiz-123',
                name: 'Test Quiz',
                creatorTeacherId: mockTeacherId
            };
            prisma_1.prisma.quizTemplate.findFirst.mockResolvedValue(mockExistingQuiz);
            prisma_1.prisma.quizTemplate.delete.mockResolvedValue({});
            const result = await quizTemplateService.deleteQuizTemplate(mockTeacherId, 'quiz-123');
            expect(prisma_1.prisma.quizTemplate.findFirst).toHaveBeenCalledWith({
                where: {
                    id: 'quiz-123',
                    creatorTeacherId: mockTeacherId
                }
            });
            expect(prisma_1.prisma.quizTemplate.delete).toHaveBeenCalledWith({
                where: { id: 'quiz-123' }
            });
            expect(result).toEqual({ success: true });
        });
        it('should throw an error if the quiz template does not exist', async () => {
            prisma_1.prisma.quizTemplate.findFirst.mockResolvedValue(null);
            await expect(quizTemplateService.deleteQuizTemplate(mockTeacherId, 'nonexistent-id'))
                .rejects.toThrow('Quiz template with ID nonexistent-id not found or you don\'t have permission to delete it');
        });
    });
    describe('addQuestionToQuizTemplate', () => {
        it('should add a question to a quiz template', async () => {
            const quizTemplateId = 'quiz-123';
            const questionUid = 'question-456';
            const sequence = 3;
            const mockQuizTemplate = {
                id: quizTemplateId,
                name: 'Test Quiz',
                creatorTeacherId: mockTeacherId,
                questions: [
                    { sequence: 2, questionUid: 'question-123' }
                ]
            };
            const mockQuestion = {
                uid: questionUid,
                text: 'Test Question'
            };
            const mockUpdatedQuizTemplate = {
                ...mockQuizTemplate,
                questions: [
                    ...mockQuizTemplate.questions,
                    {
                        quizTemplateId,
                        questionUid,
                        sequence,
                        question: mockQuestion
                    }
                ]
            };
            prisma_1.prisma.quizTemplate.findFirst.mockResolvedValue(mockQuizTemplate);
            prisma_1.prisma.question.findUnique.mockResolvedValue(mockQuestion);
            prisma_1.prisma.questionsInQuizTemplate.create.mockResolvedValue({
                quizTemplateId,
                questionUid,
                sequence
            });
            // Mock the getQuizTemplateById call
            globals_1.jest.spyOn(quizTemplateService, 'getQuizTemplateById').mockResolvedValue(mockUpdatedQuizTemplate);
            const result = await quizTemplateService.addQuestionToQuizTemplate(mockTeacherId, quizTemplateId, questionUid, sequence);
            expect(prisma_1.prisma.quizTemplate.findFirst).toHaveBeenCalledWith({
                where: {
                    id: quizTemplateId,
                    creatorTeacherId: mockTeacherId
                },
                include: {
                    questions: {
                        orderBy: {
                            sequence: 'desc'
                        },
                        take: 1
                    }
                }
            });
            expect(prisma_1.prisma.question.findUnique).toHaveBeenCalledWith({
                where: { uid: questionUid }
            });
            expect(prisma_1.prisma.questionsInQuizTemplate.create).toHaveBeenCalledWith({
                data: {
                    quizTemplateId,
                    questionUid,
                    sequence
                }
            });
            expect(quizTemplateService.getQuizTemplateById).toHaveBeenCalledWith(quizTemplateId, true);
            expect(result).toEqual(mockUpdatedQuizTemplate);
        });
    });
});
