"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../../src/server");
const quizTemplates_1 = require("@/api/v1/quizTemplates");
const globals_1 = require("@jest/globals");
// Mock authentication middleware
globals_1.jest.mock('@/middleware/auth', () => ({
    teacherAuth: (req, res, next) => {
        req.user = {
            userId: 'teacher-123',
            teacherId: 'teacher-123',
            role: 'TEACHER',
            username: 'testteacher'
        };
        next();
    },
    optionalAuth: (req, res, next) => {
        req.user = {
            userId: 'teacher-123',
            teacherId: 'teacher-123',
            role: 'TEACHER',
            username: 'testteacher'
        };
        next();
    }
}));
describe('gameTemplate API Integration Tests', () => {
    globals_1.jest.setTimeout(3000);
    let server;
    let mockGameTemplateService;
    beforeAll(async () => {
        server = (0, server_1.setupServer)(4000).httpServer; // Use test port 4000
        mockGameTemplateService = {
            creategameTemplate: globals_1.jest.fn(),
            getgameTemplateById: globals_1.jest.fn(),
            getgameTemplates: globals_1.jest.fn(),
            updategameTemplate: globals_1.jest.fn(),
            deletegameTemplate: globals_1.jest.fn(),
            addQuestionTogameTemplate: globals_1.jest.fn(),
            removeQuestionFromgameTemplate: globals_1.jest.fn(),
            updateQuestionSequence: globals_1.jest.fn()
        };
        (0, quizTemplates_1.__setGameTemplateServiceForTesting)(mockGameTemplateService);
    });
    beforeEach(() => {
        globals_1.jest.clearAllMocks();
    });
    afterAll(() => {
        server.close();
    });
    describe('POST /api/v1/game-templates', () => {
        it('should create a quiz template successfully', async () => {
            const quizData = {
                name: 'Test Quiz',
                themes: ['algebra', 'geometry'],
                discipline: 'math',
                gradeLevel: '9',
                description: 'A test quiz'
            };
            const createdQuiz = {
                id: 'quiz-123',
                creatorId: 'teacher-123',
                ...quizData,
                createdAt: new Date().toISOString(),
                questions: []
            };
            mockGameTemplateService.creategameTemplate.mockResolvedValue(createdQuiz);
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/game-templates')
                .send(quizData)
                .expect('Content-Type', /json/)
                .expect(201);
            expect(mockGameTemplateService.creategameTemplate).toHaveBeenCalledWith('teacher-123', expect.objectContaining(quizData));
            expect(response.body).toEqual({ gameTemplate: createdQuiz });
        });
        it('should return 400 if required fields are missing', async () => {
            const incompleteData = {
                description: 'Missing required fields'
                // Missing name and themes
            };
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/game-templates')
                .send(incompleteData)
                .expect('Content-Type', /json/)
                .expect(400);
            expect(response.body.error).toBe('Required fields missing');
            expect(mockGameTemplateService.creategameTemplate).not.toHaveBeenCalled();
        });
    });
    describe('GET /api/v1/game-templates/:id', () => {
        it('should return a quiz template by ID', async () => {
            const mockQuiz = {
                id: 'quiz-123',
                name: 'Test Quiz',
                creatorId: 'teacher-123',
                themes: ['algebra'],
                questions: []
            };
            mockGameTemplateService.getgameTemplateById.mockResolvedValue(mockQuiz);
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/v1/game-templates/quiz-123')
                .expect('Content-Type', /json/)
                .expect(200);
            expect(mockGameTemplateService.getgameTemplateById).toHaveBeenCalledWith('quiz-123', false);
            expect(response.body).toEqual({ gameTemplate: mockQuiz });
        });
        it('should return 404 if quiz template is not found', async () => {
            mockGameTemplateService.getgameTemplateById.mockResolvedValue(null);
            await (0, supertest_1.default)(server_1.app)
                .get('/api/v1/game-templates/nonexistent-id')
                .expect('Content-Type', /json/)
                .expect(404);
            expect(mockGameTemplateService.getgameTemplateById).toHaveBeenCalledWith('nonexistent-id', false);
        });
        it('should return 403 if quiz template belongs to a different teacher', async () => {
            const mockQuiz = {
                id: 'quiz-123',
                name: 'Test Quiz',
                creatorId: 'different-teacher',
                themes: ['algebra'],
                questions: []
            };
            mockGameTemplateService.getgameTemplateById.mockResolvedValue(mockQuiz);
            await (0, supertest_1.default)(server_1.app)
                .get('/api/v1/game-templates/quiz-123')
                .expect('Content-Type', /json/)
                .expect(403);
        });
    });
    describe('GET /api/v1/game-templates', () => {
        it('should get quiz templates with filters and pagination', async () => {
            const mockResult = {
                gameTemplates: [
                    { id: 'quiz-1', name: 'Quiz 1', creatorId: 'teacher-123' },
                    { id: 'quiz-2', name: 'Quiz 2', creatorId: 'teacher-123' }
                ],
                total: 2,
                page: 1,
                pageSize: 20,
                totalPages: 1
            };
            mockGameTemplateService.getgameTemplates.mockResolvedValue(mockResult);
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/v1/game-templates?discipline=math&page=1&pageSize=20')
                .expect('Content-Type', /json/)
                .expect(200);
            expect(mockGameTemplateService.getgameTemplates).toHaveBeenCalledWith('teacher-123', { discipline: 'math' }, { skip: 0, take: 20 });
            expect(response.body).toEqual(mockResult);
        });
    });
    describe('PUT /api/v1/game-templates/:id', () => {
        it('should update a quiz template successfully', async () => {
            const updateData = {
                name: 'Updated Quiz',
                description: 'Updated description'
            };
            const updatedQuiz = {
                id: 'quiz-123',
                creatorId: 'teacher-123',
                ...updateData,
                questions: []
            };
            mockGameTemplateService.updategameTemplate.mockResolvedValue(updatedQuiz);
            const response = await (0, supertest_1.default)(server_1.app)
                .put('/api/v1/game-templates/quiz-123')
                .send(updateData)
                .expect('Content-Type', /json/)
                .expect(200);
            expect(mockGameTemplateService.updategameTemplate).toHaveBeenCalledWith('teacher-123', {
                id: 'quiz-123',
                ...updateData
            });
            expect(response.body).toEqual({ gameTemplate: updatedQuiz });
        });
        it('should return 404 if quiz template to update is not found', async () => {
            const error = new Error('Quiz template with ID nonexistent-id not found or you don\'t have permission to update it');
            mockGameTemplateService.updategameTemplate.mockRejectedValue(error);
            await (0, supertest_1.default)(server_1.app)
                .put('/api/v1/game-templates/nonexistent-id')
                .send({ name: 'Updated Name' })
                .expect('Content-Type', /json/)
                .expect(404);
        });
    });
    describe('DELETE /api/v1/game-templates/:id', () => {
        it('should delete a quiz template successfully', async () => {
            mockGameTemplateService.deletegameTemplate.mockResolvedValue(undefined);
            const response = await (0, supertest_1.default)(server_1.app)
                .delete('/api/v1/game-templates/quiz-123')
                .expect('Content-Type', /json/)
                .expect(200);
            expect(mockGameTemplateService.deletegameTemplate).toHaveBeenCalledWith('teacher-123', 'quiz-123');
            expect(response.body).toEqual({ success: true });
        });
        it('should return 404 if quiz template to delete is not found', async () => {
            const error = new Error('Quiz template with ID nonexistent-id not found or you don\'t have permission to delete it');
            mockGameTemplateService.deletegameTemplate.mockRejectedValue(error);
            await (0, supertest_1.default)(server_1.app)
                .delete('/api/v1/game-templates/nonexistent-id')
                .expect('Content-Type', /json/)
                .expect(404);
        });
    });
    describe('POST /api/v1/game-templates/:id/questions', () => {
        it('should add a question to a quiz template', async () => {
            const questionData = {
                questionUid: 'question-456',
                sequence: 1
            };
            const updatedQuiz = {
                id: 'quiz-123',
                name: 'Test Quiz',
                creatorId: 'teacher-123',
                questions: [
                    {
                        gameTemplateId: 'quiz-123',
                        questionUid: 'question-456',
                        sequence: 1,
                        question: { uid: 'question-456', text: 'What is 2+2?' }
                    }
                ]
            };
            mockGameTemplateService.addQuestionTogameTemplate.mockResolvedValue(updatedQuiz);
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/game-templates/quiz-123/questions')
                .send(questionData)
                .expect('Content-Type', /json/)
                .expect(200);
            expect(mockGameTemplateService.addQuestionTogameTemplate).toHaveBeenCalledWith('teacher-123', 'quiz-123', 'question-456', 1);
            expect(response.body).toEqual({ gameTemplate: updatedQuiz });
        });
        it('should return 400 if question ID is missing', async () => {
            await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/game-templates/quiz-123/questions')
                .send({})
                .expect('Content-Type', /json/)
                .expect(400);
            expect(mockGameTemplateService.addQuestionTogameTemplate).not.toHaveBeenCalled();
        });
    });
    describe('DELETE /api/v1/game-templates/:id/questions/:questionUid', () => {
        it('should remove a question from a quiz template', async () => {
            const updatedQuiz = {
                id: 'quiz-123',
                name: 'Test Quiz',
                creatorId: 'teacher-123',
                questions: [] // Question removed
            };
            mockGameTemplateService.removeQuestionFromgameTemplate.mockResolvedValue(updatedQuiz);
            const response = await (0, supertest_1.default)(server_1.app)
                .delete('/api/v1/game-templates/quiz-123/questions/question-456')
                .expect('Content-Type', /json/)
                .expect(200);
            expect(mockGameTemplateService.removeQuestionFromgameTemplate).toHaveBeenCalledWith('teacher-123', 'quiz-123', 'question-456');
            expect(response.body).toEqual({ gameTemplate: updatedQuiz });
        });
    });
    describe('PUT /api/v1/game-templates/:id/questions-sequence', () => {
        it('should update question sequence in a quiz template', async () => {
            const updates = [
                { questionUid: 'question-1', sequence: 2 },
                { questionUid: 'question-2', sequence: 1 }
            ];
            const updatedQuiz = {
                id: 'quiz-123',
                name: 'Test Quiz',
                creatorId: 'teacher-123',
                questions: [
                    {
                        gameTemplateId: 'quiz-123',
                        questionUid: 'question-2',
                        sequence: 1,
                        question: { uid: 'question-2', text: 'Question 2' }
                    },
                    {
                        gameTemplateId: 'quiz-123',
                        questionUid: 'question-1',
                        sequence: 2,
                        question: { uid: 'question-1', text: 'Question 1' }
                    }
                ]
            };
            mockGameTemplateService.updateQuestionSequence.mockResolvedValue(updatedQuiz);
            const response = await (0, supertest_1.default)(server_1.app)
                .put('/api/v1/game-templates/quiz-123/questions-sequence')
                .send({ updates })
                .expect('Content-Type', /json/)
                .expect(200);
            expect(mockGameTemplateService.updateQuestionSequence).toHaveBeenCalledWith('teacher-123', 'quiz-123', updates);
            expect(response.body).toEqual({ gameTemplate: updatedQuiz });
        });
        it('should return 400 if updates array is missing or empty', async () => {
            await (0, supertest_1.default)(server_1.app)
                .put('/api/v1/game-templates/quiz-123/questions-sequence')
                .send({})
                .expect('Content-Type', /json/)
                .expect(400);
            expect(mockGameTemplateService.updateQuestionSequence).not.toHaveBeenCalled();
        });
    });
});
