"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const quizTemplateService_1 = require("@/core/services/quizTemplateService");
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
    globals_1.jest.setTimeout(3000);
    let service;
    const mockuserId = 'teacher-123';
    beforeEach(() => {
        service = new quizTemplateService_1.gameTemplateService();
        globals_1.jest.clearAllMocks();
        prisma_1.prisma.gameTemplate.findFirst.mockReset && prisma_1.prisma.gameTemplate.findFirst.mockReset();
        prisma_1.prisma.gameTemplate.update.mockReset && prisma_1.prisma.gameTemplate.update.mockReset();
        prisma_1.prisma.gameTemplate.delete.mockReset && prisma_1.prisma.gameTemplate.delete.mockReset();
        prisma_1.prisma.question.findUnique.mockReset && prisma_1.prisma.question.findUnique.mockReset();
        prisma_1.prisma.questionsInGameTemplate.create.mockReset && prisma_1.prisma.questionsInGameTemplate.create.mockReset();
    });
    describe('creategameTemplate', () => {
        it('should create a quiz template successfully', async () => {
            const mockQuizData = {
                name: 'Test Quiz',
                themes: ['algebra', 'geometry'],
                discipline: 'math',
                gradeLevel: '9'
            };
            const mockCreatedQuiz = {
                id: 'quiz-123',
                creatorId: mockuserId,
                ...mockQuizData,
                createdAt: new Date(),
                updatedAt: new Date(),
                questions: []
            };
            prisma_1.prisma.gameTemplate.create.mockResolvedValue(mockCreatedQuiz);
            const result = await service.creategameTemplate(mockuserId, mockQuizData);
            expect(prisma_1.prisma.gameTemplate.create).toHaveBeenCalledWith({
                data: {
                    name: mockQuizData.name,
                    creatorId: mockuserId,
                    gradeLevel: mockQuizData.gradeLevel,
                    themes: mockQuizData.themes,
                    discipline: mockQuizData.discipline,
                    description: undefined,
                    defaultMode: "quiz",
                    questions: undefined
                },
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
                themes: ['algebra'],
                discipline: 'math',
                gradeLevel: '9'
            };
            const mockError = new Error('Database error');
            prisma_1.prisma.gameTemplate.create.mockRejectedValue(mockError);
            await expect(service.creategameTemplate(mockuserId, mockQuizData))
                .rejects.toThrow(mockError);
        });
    });
    describe('getgameTemplateById', () => {
        it('should return a quiz template by ID', async () => {
            const mockgameTemplate = {
                id: 'quiz-123',
                name: 'Test Quiz',
                creatorId: mockuserId,
                themes: ['algebra'],
                createdAt: new Date(),
                updatedAt: new Date(),
                questions: []
            };
            prisma_1.prisma.gameTemplate.findUnique.mockResolvedValue(mockgameTemplate);
            const result = await service.getgameTemplateById('quiz-123');
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
                creatorId: mockuserId,
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
            const result = await service.getgameTemplateById('quiz-123', true);
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
            const result = await service.getgameTemplates(mockuserId, { discipline: 'math' }, { skip: 0, take: 10 });
            expect(prisma_1.prisma.gameTemplate.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    creatorId: mockuserId,
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
            globals_1.jest.clearAllMocks();
            const mockUpdateData = {
                id: 'quiz-123',
                name: 'Updated Quiz',
                description: 'Updated description'
            };
            const mockExistingQuiz = {
                id: 'quiz-123',
                name: 'Old Name',
                description: 'Old description',
                creatorId: mockuserId,
                themes: ['algebra'],
                questions: [
                    { sequence: 2, questionUid: 'question-123' }
                ]
            };
            const mockUpdatedQuiz = {
                id: 'quiz-123',
                name: 'Updated Quiz',
                description: 'Updated description',
                creatorId: mockuserId,
                themes: ['algebra'],
                questions: []
            };
            prisma_1.prisma.gameTemplate.findFirst
                .mockResolvedValueOnce(mockExistingQuiz)
                .mockResolvedValueOnce(mockUpdatedQuiz);
            prisma_1.prisma.gameTemplate.update.mockResolvedValue(mockUpdatedQuiz);
            globals_1.jest.spyOn(service, 'getgameTemplateById').mockResolvedValueOnce(mockUpdatedQuiz);
            const result = await service.updategameTemplate(mockuserId, mockUpdateData);
            expect(prisma_1.prisma.gameTemplate.findFirst).toHaveBeenCalledWith({
                where: {
                    id: 'quiz-123',
                    creatorId: mockuserId
                }
            });
            expect(prisma_1.prisma.gameTemplate.update).toHaveBeenCalledWith({
                where: { id: 'quiz-123' },
                data: {
                    name: 'Updated Quiz',
                    description: 'Updated description'
                }
            });
            expect(result).toEqual(mockUpdatedQuiz);
        });
        it('should throw an error if the quiz template does not exist', async () => {
            globals_1.jest.clearAllMocks();
            prisma_1.prisma.gameTemplate.findFirst.mockResolvedValueOnce(null);
            const mockUpdateData = {
                id: 'nonexistent-id',
                name: 'Updated Quiz'
            };
            await expect(service.updategameTemplate(mockuserId, mockUpdateData))
                .rejects.toThrow('Quiz template with ID nonexistent-id not found or you don\'t have permission to update it');
        });
    });
    describe('deletegameTemplate', () => {
        it('should delete a quiz template successfully', async () => {
            globals_1.jest.clearAllMocks();
            const mockExistingQuiz = {
                id: 'quiz-123',
                name: 'Test Quiz',
                creatorId: mockuserId
            };
            prisma_1.prisma.gameTemplate.findFirst.mockResolvedValueOnce(mockExistingQuiz);
            prisma_1.prisma.gameTemplate.delete.mockResolvedValue({});
            const result = await service.deletegameTemplate(mockuserId, 'quiz-123');
            expect(prisma_1.prisma.gameTemplate.findFirst).toHaveBeenCalledWith({
                where: {
                    id: 'quiz-123',
                    creatorId: mockuserId
                }
            });
            expect(prisma_1.prisma.gameTemplate.delete).toHaveBeenCalledWith({
                where: { id: 'quiz-123' }
            });
            expect(result).toEqual({ success: true });
        });
        it('should throw an error if the quiz template does not exist', async () => {
            globals_1.jest.clearAllMocks();
            prisma_1.prisma.gameTemplate.findFirst.mockResolvedValueOnce(null);
            await expect(service.deletegameTemplate(mockuserId, 'nonexistent-id'))
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
                creatorId: mockuserId,
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
            prisma_1.prisma.gameTemplate.findFirst.mockResolvedValueOnce(mockgameTemplate).mockResolvedValueOnce(mockUpdatedgameTemplate);
            prisma_1.prisma.question.findUnique.mockResolvedValue(mockQuestion);
            prisma_1.prisma.questionsInGameTemplate.create.mockResolvedValue({ gameTemplateId, questionUid, sequence });
            globals_1.jest.spyOn(service, 'getgameTemplateById').mockResolvedValue(mockUpdatedgameTemplate);
            const result = await service.addQuestionTogameTemplate(mockuserId, gameTemplateId, questionUid, sequence);
            expect(prisma_1.prisma.gameTemplate.findFirst).toHaveBeenCalledWith({
                where: {
                    id: gameTemplateId,
                    creatorId: mockuserId
                },
                include: {
                    questions: {
                        orderBy: { sequence: 'desc' },
                        take: 1
                    }
                }
            });
            expect(prisma_1.prisma.question.findUnique).toHaveBeenCalledWith({ where: { uid: questionUid } });
            expect(prisma_1.prisma.questionsInGameTemplate.create).toHaveBeenCalledWith({
                data: { gameTemplateId, questionUid, sequence }
            });
            expect(result).toEqual(mockUpdatedgameTemplate);
        });
    });
});
