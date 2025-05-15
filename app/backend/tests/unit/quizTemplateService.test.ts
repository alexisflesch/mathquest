import { QuizTemplateService, QuizTemplateCreationData, QuizTemplateUpdateData } from '@/core/services/quizTemplateService';
import { prisma } from '@/db/prisma';
import { jest } from '@jest/globals';

// Mock the prisma client
jest.mock('@/db/prisma', () => ({
    prisma: {
        quizTemplate: {
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
        questionsInQuizTemplate: {
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

describe('QuizTemplateService', () => {
    let quizTemplateService: QuizTemplateService;
    const mockTeacherId = 'teacher-123';

    beforeEach(() => {
        quizTemplateService = new QuizTemplateService();
        jest.clearAllMocks();
    });

    describe('createQuizTemplate', () => {
        it('should create a quiz template successfully', async () => {
            const mockQuizData: QuizTemplateCreationData = {
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

            (prisma.quizTemplate.create as any).mockResolvedValue(mockCreatedQuiz);

            const result = await quizTemplateService.createQuizTemplate(mockTeacherId, mockQuizData);

            expect(prisma.quizTemplate.create).toHaveBeenCalledWith({
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
            const mockQuizData: QuizTemplateCreationData = {
                name: 'Test Quiz',
                themes: ['algebra']
            };

            const mockError = new Error('Database error');
            (prisma.quizTemplate.create as any).mockRejectedValue(mockError);

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

            (prisma.quizTemplate.findUnique as any).mockResolvedValue(mockQuizTemplate);

            const result = await quizTemplateService.getQuizTemplateById('quiz-123');

            expect(prisma.quizTemplate.findUnique).toHaveBeenCalledWith({
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

            (prisma.quizTemplate.findUnique as any).mockResolvedValue(mockQuizTemplate);

            const result = await quizTemplateService.getQuizTemplateById('quiz-123', true);

            expect(prisma.quizTemplate.findUnique).toHaveBeenCalledWith({
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

            (prisma.quizTemplate.findMany as any).mockResolvedValue(mockQuizTemplates);
            (prisma.quizTemplate.count as any).mockResolvedValue(mockTotal);

            const result = await quizTemplateService.getQuizTemplates(
                mockTeacherId,
                { discipline: 'math' },
                { skip: 0, take: 10 }
            );

            expect(prisma.quizTemplate.findMany).toHaveBeenCalledWith(expect.objectContaining({
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
            const mockUpdateData: QuizTemplateUpdateData = {
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

            (prisma.quizTemplate.findFirst as any).mockResolvedValue(mockExistingQuiz);
            (prisma.quizTemplate.update as any).mockResolvedValue(mockUpdatedQuiz);

            const result = await quizTemplateService.updateQuizTemplate(mockTeacherId, mockUpdateData);

            expect(prisma.quizTemplate.findFirst).toHaveBeenCalledWith({
                where: {
                    id: 'quiz-123',
                    creatorTeacherId: mockTeacherId
                }
            });

            expect(prisma.quizTemplate.update).toHaveBeenCalledWith({
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
            (prisma.quizTemplate.findFirst as any).mockResolvedValue(null);

            const mockUpdateData: QuizTemplateUpdateData = {
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

            (prisma.quizTemplate.findFirst as any).mockResolvedValue(mockExistingQuiz);
            (prisma.quizTemplate.delete as any).mockResolvedValue({});

            const result = await quizTemplateService.deleteQuizTemplate(mockTeacherId, 'quiz-123');

            expect(prisma.quizTemplate.findFirst).toHaveBeenCalledWith({
                where: {
                    id: 'quiz-123',
                    creatorTeacherId: mockTeacherId
                }
            });

            expect(prisma.quizTemplate.delete).toHaveBeenCalledWith({
                where: { id: 'quiz-123' }
            });

            expect(result).toEqual({ success: true });
        });

        it('should throw an error if the quiz template does not exist', async () => {
            (prisma.quizTemplate.findFirst as any).mockResolvedValue(null);

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

            (prisma.quizTemplate.findFirst as any).mockResolvedValue(mockQuizTemplate);
            (prisma.question.findUnique as any).mockResolvedValue(mockQuestion);
            (prisma.questionsInQuizTemplate.create as any).mockResolvedValue({
                quizTemplateId,
                questionUid,
                sequence
            });

            // Mock the getQuizTemplateById call
            jest.spyOn(quizTemplateService, 'getQuizTemplateById').mockResolvedValue(mockUpdatedQuizTemplate as any);

            const result = await quizTemplateService.addQuestionToQuizTemplate(
                mockTeacherId,
                quizTemplateId,
                questionUid,
                sequence
            );

            expect(prisma.quizTemplate.findFirst).toHaveBeenCalledWith({
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

            expect(prisma.question.findUnique).toHaveBeenCalledWith({
                where: { uid: questionUid }
            });

            expect(prisma.questionsInQuizTemplate.create).toHaveBeenCalledWith({
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
