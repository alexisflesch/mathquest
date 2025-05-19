import { gameTemplateService, gameTemplateCreationData, gameTemplateUpdateData } from '@/core/services/quizTemplateService';
import { prisma } from '@/db/prisma';
import { jest } from '@jest/globals';

// Mock the prisma client
jest.mock('@/db/prisma', () => ({
    prisma: {
        gameTemplate: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        },
        question: {
            findUnique: jest.fn()
        },
        questionsInGameTemplate: {
            create: jest.fn(),
            delete: jest.fn(),
            update: jest.fn()
        }
    }
}));

// Mock the logger
jest.mock('@/utils/logger', () => {
    return jest.fn().mockImplementation(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }));
});

describe('gameTemplateService', () => {
    jest.setTimeout(3000);

    let service: gameTemplateService;
    const mockTeacherId = 'teacher-123';

    beforeEach(() => {
        service = new gameTemplateService();
        jest.clearAllMocks();
        (prisma.gameTemplate.findFirst as any).mockReset && (prisma.gameTemplate.findFirst as any).mockReset();
        (prisma.gameTemplate.update as any).mockReset && (prisma.gameTemplate.update as any).mockReset();
        (prisma.gameTemplate.delete as any).mockReset && (prisma.gameTemplate.delete as any).mockReset();
        (prisma.question.findUnique as any).mockReset && (prisma.question.findUnique as any).mockReset();
        (prisma.questionsInGameTemplate.create as any).mockReset && (prisma.questionsInGameTemplate.create as any).mockReset();
    });

    describe('creategameTemplate', () => {
        it('should create a quiz template successfully', async () => {
            const mockQuizData: gameTemplateCreationData = {
                name: 'Test Quiz',
                themes: ['algebra', 'geometry'],
                discipline: 'math',
                gradeLevel: '9'
            };

            const mockCreatedQuiz = {
                id: 'quiz-123',
                creatorId: mockTeacherId,
                ...mockQuizData,
                createdAt: new Date(),
                updatedAt: new Date(),
                questions: []
            };

            (prisma.gameTemplate.create as any).mockResolvedValue(mockCreatedQuiz);

            const result = await service.creategameTemplate(mockTeacherId, mockQuizData);

            expect(prisma.gameTemplate.create).toHaveBeenCalledWith({
                data: {
                    name: mockQuizData.name,
                    creatorId: mockTeacherId,
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
            const mockQuizData: gameTemplateCreationData = {
                name: 'Test Quiz',
                themes: ['algebra'],
                discipline: 'math',
                gradeLevel: '9'
            };

            const mockError = new Error('Database error');
            (prisma.gameTemplate.create as any).mockRejectedValue(mockError);

            await expect(service.creategameTemplate(mockTeacherId, mockQuizData))
                .rejects.toThrow(mockError);
        });
    });

    describe('getgameTemplateById', () => {
        it('should return a quiz template by ID', async () => {
            const mockgameTemplate = {
                id: 'quiz-123',
                name: 'Test Quiz',
                creatorId: mockTeacherId,
                themes: ['algebra'],
                createdAt: new Date(),
                updatedAt: new Date(),
                questions: []
            };

            (prisma.gameTemplate.findUnique as any).mockResolvedValue(mockgameTemplate);

            const result = await service.getgameTemplateById('quiz-123');

            expect(prisma.gameTemplate.findUnique).toHaveBeenCalledWith({
                where: { id: 'quiz-123' },
                include: undefined
            });

            expect(result).toEqual(mockgameTemplate);
        });

        it('should include questions when includeQuestions is true', async () => {
            const mockgameTemplate = {
                id: 'quiz-123',
                name: 'Test Quiz',
                creatorId: mockTeacherId,
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

            (prisma.gameTemplate.findUnique as any).mockResolvedValue(mockgameTemplate);

            const result = await service.getgameTemplateById('quiz-123', true);

            expect(prisma.gameTemplate.findUnique).toHaveBeenCalledWith({
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

            (prisma.gameTemplate.findMany as any).mockResolvedValue(mockgameTemplates);
            (prisma.gameTemplate.count as any).mockResolvedValue(mockTotal);

            const result = await service.getgameTemplates(
                mockTeacherId,
                { discipline: 'math' },
                { skip: 0, take: 10 }
            );

            expect(prisma.gameTemplate.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    creatorId: mockTeacherId,
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
            jest.clearAllMocks();
            const mockUpdateData: gameTemplateUpdateData = {
                id: 'quiz-123',
                name: 'Updated Quiz',
                description: 'Updated description'
            };

            const mockExistingQuiz = {
                id: 'quiz-123',
                name: 'Old Name',
                description: 'Old description',
                creatorId: mockTeacherId,
                themes: ['algebra'],
                questions: [
                    { sequence: 2, questionUid: 'question-123' }
                ]
            };

            const mockUpdatedQuiz = {
                id: 'quiz-123',
                name: 'Updated Quiz',
                description: 'Updated description',
                creatorId: mockTeacherId,
                themes: ['algebra'],
                questions: []
            };

            (prisma.gameTemplate.findFirst as any)
                .mockResolvedValueOnce(mockExistingQuiz)
                .mockResolvedValueOnce(mockUpdatedQuiz);
            (prisma.gameTemplate.update as any).mockResolvedValue(mockUpdatedQuiz);
            jest.spyOn(service, 'getgameTemplateById').mockResolvedValueOnce(mockUpdatedQuiz as any);

            const result = await service.updategameTemplate(mockTeacherId, mockUpdateData);

            expect(prisma.gameTemplate.findFirst).toHaveBeenCalledWith({
                where: {
                    id: 'quiz-123',
                    creatorId: mockTeacherId
                }
            });

            expect(prisma.gameTemplate.update).toHaveBeenCalledWith({
                where: { id: 'quiz-123' },
                data: {
                    name: 'Updated Quiz',
                    description: 'Updated description'
                }
            });

            expect(result).toEqual(mockUpdatedQuiz);
        });

        it('should throw an error if the quiz template does not exist', async () => {
            jest.clearAllMocks();
            (prisma.gameTemplate.findFirst as any).mockResolvedValueOnce(null);

            const mockUpdateData: gameTemplateUpdateData = {
                id: 'nonexistent-id',
                name: 'Updated Quiz'
            };

            await expect(service.updategameTemplate(mockTeacherId, mockUpdateData))
                .rejects.toThrow('Quiz template with ID nonexistent-id not found or you don\'t have permission to update it');
        });
    });

    describe('deletegameTemplate', () => {
        it('should delete a quiz template successfully', async () => {
            jest.clearAllMocks();
            const mockExistingQuiz = {
                id: 'quiz-123',
                name: 'Test Quiz',
                creatorId: mockTeacherId
            };

            (prisma.gameTemplate.findFirst as any).mockResolvedValueOnce(mockExistingQuiz);
            (prisma.gameTemplate.delete as any).mockResolvedValue({});

            const result = await service.deletegameTemplate(mockTeacherId, 'quiz-123');

            expect(prisma.gameTemplate.findFirst).toHaveBeenCalledWith({
                where: {
                    id: 'quiz-123',
                    creatorId: mockTeacherId
                }
            });

            expect(prisma.gameTemplate.delete).toHaveBeenCalledWith({
                where: { id: 'quiz-123' }
            });

            expect(result).toEqual({ success: true });
        });

        it('should throw an error if the quiz template does not exist', async () => {
            jest.clearAllMocks();
            (prisma.gameTemplate.findFirst as any).mockResolvedValueOnce(null);

            await expect(service.deletegameTemplate(mockTeacherId, 'nonexistent-id'))
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
                creatorId: mockTeacherId,
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

            (prisma.gameTemplate.findFirst as any).mockResolvedValueOnce(mockgameTemplate).mockResolvedValueOnce(mockUpdatedgameTemplate);
            (prisma.question.findUnique as any).mockResolvedValue(mockQuestion);
            (prisma.questionsInGameTemplate.create as any).mockResolvedValue({ gameTemplateId, questionUid, sequence });
            jest.spyOn(service, 'getgameTemplateById').mockResolvedValue(mockUpdatedgameTemplate as any);

            const result = await service.addQuestionTogameTemplate(mockTeacherId, gameTemplateId, questionUid, sequence);

            expect(prisma.gameTemplate.findFirst).toHaveBeenCalledWith({
                where: {
                    id: gameTemplateId,
                    creatorId: mockTeacherId
                },
                include: {
                    questions: {
                        orderBy: { sequence: 'desc' },
                        take: 1
                    }
                }
            });
            expect(prisma.question.findUnique).toHaveBeenCalledWith({ where: { uid: questionUid } });
            expect(prisma.questionsInGameTemplate.create).toHaveBeenCalledWith({
                data: { gameTemplateId, questionUid, sequence }
            });
            expect(result).toEqual(mockUpdatedgameTemplate);
        });
    });
});
