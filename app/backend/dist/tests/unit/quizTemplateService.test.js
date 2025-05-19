"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gameTemplateService_1 = require("@/core/services/gameTemplateService");
const prisma_1 = require("@/db/prisma");
const globals_1 = require("@jest/globals");
// Mock the prisma client
globals_1.jest.mock('@/db/prisma', () => ({
    prisma: {
        gameTemplate: {
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
        questionsInGameTemplate: {
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
describe('gameTemplateService', () => {
    let gameTemplateService;
    const mockTeacherId = 'teacher-123';
    beforeEach(() => {
        gameTemplateService = new gameTemplateService_1.gameTemplateService();
        globals_1.jest.clearAllMocks();
    });
    describe('creategameTemplate', () => {
        it('should create a quiz template successfully', async () => {
            const mockQuizData = {
                name: 'Test Quiz',
                themes: ['algebra', 'geometry'],
                discipline: 'math',
                gradeLevel: '9',
                description: 'A test quiz',
                defaultMode: 'quiz'
            };
            const mockCreatedQuiz = {
                id: 'quiz-123',
                creatorTeacherId: mockTeacherId,
                ...mockQuizData,
                createdAt: new Date(),
                updatedAt: new Date(),
                questions: []
            };
            prisma_1.prisma.gameTemplate.create.mockResolvedValue(mockCreatedQuiz);
            const result = await gameTemplateService.creategameTemplate(mockTeacherId, mockQuizData);
            expect(prisma_1.prisma.gameTemplate.create).toHaveBeenCalledWith({
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
            prisma_1.prisma.gameTemplate.create.mockRejectedValue(mockError);
            await expect(gameTemplateService.creategameTemplate(mockTeacherId, mockQuizData))
                .rejects.toThrow(mockError);
        });
    });
    describe('getgameTemplateById', () => {
        it('should return a quiz template by ID', async () => {
            const mockgameTemplate = {
                id: 'quiz-123',
                name: 'Test Quiz',
                creatorTeacherId: mockTeacherId,
                themes: ['algebra'],
                createdAt: new Date(),
                updatedAt: new Date(),
                questions: []
            };
            prisma_1.prisma.gameTemplate.findUnique.mockResolvedValue(mockgameTemplate);
            const result = await gameTemplateService.getgameTemplateById('quiz-123');
            expect(prisma_1.prisma.gameTemplate.findUnique).toHaveBeenCalledWith({
                where: { id: 'quiz-123' },
                include: undefined
            });
            expect(result).toEqual(mockgameTemplate);
        });
        it('should include questions when includeQuestions is true', async () => {
            const mockgameTemplate = {
                id: 'quiz-123',
                name: 'Test Quiz',
                creatorTeacherId: mockTeacherId,
                themes: ['algebra'],
                questions: [
                    {
                        gameTemplateId: 'quiz-123',
                        questionUid: 'question-1',
                        sequence: 1,
                        question: { uid: 'question-1', text: 'Question 1' }
                    }
                ]
            };
            prisma_1.prisma.gameTemplate.findUnique.mockResolvedValue(mockgameTemplate);
            const result = await gameTemplateService.getgameTemplateById('quiz-123', true);
            expect(prisma_1.prisma.gameTemplate.findUnique).toHaveBeenCalledWith({
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
            expect(result).toEqual(mockgameTemplate);
        });
    });
    describe('getgameTemplates', () => {
        it('should get quiz templates with filters', async () => {
            const mockgameTemplates = [
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
            prisma_1.prisma.gameTemplate.findMany.mockResolvedValue(mockgameTemplates);
            prisma_1.prisma.gameTemplate.count.mockResolvedValue(mockTotal);
            const result = await gameTemplateService.getgameTemplates(mockTeacherId, { discipline: 'math' }, { skip: 0, take: 10 });
            expect(prisma_1.prisma.gameTemplate.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    creatorTeacherId: mockTeacherId,
                    discipline: 'math'
                }),
                skip: 0,
                take: 10
            }));
            expect(result).toEqual({
                gameTemplates: mockgameTemplates,
                total: mockTotal,
                page: 1,
                pageSize: 10,
                totalPages: 1
            });
        });
    });
    describe('updategameTemplate', () => {
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
            prisma_1.prisma.gameTemplate.findFirst.mockResolvedValue(mockExistingQuiz);
            prisma_1.prisma.gameTemplate.update.mockResolvedValue(mockUpdatedQuiz);
            const result = await gameTemplateService.updategameTemplate(mockTeacherId, mockUpdateData);
            expect(prisma_1.prisma.gameTemplate.findFirst).toHaveBeenCalledWith({
                where: {
                    id: 'quiz-123',
                    creatorTeacherId: mockTeacherId
                }
            });
            expect(prisma_1.prisma.gameTemplate.update).toHaveBeenCalledWith({
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
            prisma_1.prisma.gameTemplate.findFirst.mockResolvedValue(null);
            const mockUpdateData = {
                id: 'nonexistent-id',
                name: 'Updated Quiz'
            };
            await expect(gameTemplateService.updategameTemplate(mockTeacherId, mockUpdateData))
                .rejects.toThrow('Quiz template with ID nonexistent-id not found or you don\'t have permission to update it');
        });
    });
    describe('deletegameTemplate', () => {
        it('should delete a quiz template successfully', async () => {
            const mockExistingQuiz = {
                id: 'quiz-123',
                name: 'Test Quiz',
                creatorTeacherId: mockTeacherId
            };
            prisma_1.prisma.gameTemplate.findFirst.mockResolvedValue(mockExistingQuiz);
            prisma_1.prisma.gameTemplate.delete.mockResolvedValue({});
            const result = await gameTemplateService.deletegameTemplate(mockTeacherId, 'quiz-123');
            expect(prisma_1.prisma.gameTemplate.findFirst).toHaveBeenCalledWith({
                where: {
                    id: 'quiz-123',
                    creatorTeacherId: mockTeacherId
                }
            });
            expect(prisma_1.prisma.gameTemplate.delete).toHaveBeenCalledWith({
                where: { id: 'quiz-123' }
            });
            expect(result).toEqual({ success: true });
        });
        it('should throw an error if the quiz template does not exist', async () => {
            prisma_1.prisma.gameTemplate.findFirst.mockResolvedValue(null);
            await expect(gameTemplateService.deletegameTemplate(mockTeacherId, 'nonexistent-id'))
                .rejects.toThrow('Quiz template with ID nonexistent-id not found or you don\'t have permission to delete it');
        });
    });
    describe('addQuestionTogameTemplate', () => {
        it('should add a question to a quiz template', async () => {
            const gameTemplateId = 'quiz-123';
            const questionUid = 'question-456';
            const sequence = 3;
            const mockgameTemplate = {
                id: gameTemplateId,
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
            const mockUpdatedgameTemplate = {
                ...mockgameTemplate,
                questions: [
                    ...mockgameTemplate.questions,
                    {
                        gameTemplateId,
                        questionUid,
                        sequence,
                        question: mockQuestion
                    }
                ]
            };
            prisma_1.prisma.gameTemplate.findFirst.mockResolvedValue(mockgameTemplate);
            prisma_1.prisma.question.findUnique.mockResolvedValue(mockQuestion);
            prisma_1.prisma.questionsInGameTemplate.create.mockResolvedValue({
                gameTemplateId,
                questionUid,
                sequence
            });
            // Mock the getgameTemplateById call
            globals_1.jest.spyOn(gameTemplateService, 'getgameTemplateById').mockResolvedValue(mockUpdatedgameTemplate);
            const result = await gameTemplateService.addQuestionTogameTemplate(mockTeacherId, gameTemplateId, questionUid, sequence);
            expect(prisma_1.prisma.gameTemplate.findFirst).toHaveBeenCalledWith({
                where: {
                    id: gameTemplateId,
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
            expect(prisma_1.prisma.questionsInGameTemplate.create).toHaveBeenCalledWith({
                data: {
                    gameTemplateId,
                    questionUid,
                    sequence
                }
            });
            expect(gameTemplateService.getgameTemplateById).toHaveBeenCalledWith(gameTemplateId, true);
            expect(result).toEqual(mockUpdatedgameTemplate);
        });
    });
});
