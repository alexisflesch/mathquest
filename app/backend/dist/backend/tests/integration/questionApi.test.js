"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Mock authentication middleware
globals_1.jest.mock('@/middleware/auth', () => ({
    teacherAuth: (req, res, next) => {
        req.user = {
            userId: 'teacher-123',
            username: 'testteacher',
            role: 'TEACHER'
        };
        next();
    },
    optionalAuth: (req, res, next) => {
        next();
    }
}));
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../../src/server");
const questions_1 = require("@/api/v1/questions");
const globals_1 = require("@jest/globals");
describe('Question API Integration Tests', () => {
    globals_1.jest.setTimeout(3000);
    let server;
    let mockQuestionService;
    beforeAll(async () => {
        // Use the imported app from server.ts and create a test server
        server = (0, server_1.setupServer)(3999).httpServer; // Use test port 3999
        mockQuestionService = {
            createQuestion: globals_1.jest.fn(),
            getQuestionById: globals_1.jest.fn(),
            getQuestions: globals_1.jest.fn(),
            updateQuestion: globals_1.jest.fn(),
            deleteQuestion: globals_1.jest.fn()
        };
        (0, questions_1.__setQuestionServiceForTesting)(mockQuestionService);
    });
    beforeEach(() => {
        globals_1.jest.clearAllMocks();
    });
    afterAll(() => {
        server.close();
    });
    describe('POST /api/v1/questions', () => {
        it('should create a question successfully', async () => {
            const questionData = {
                title: 'Test Question',
                text: 'What is 2+2?',
                answerOptions: ['4'],
                correctAnswers: [true],
                questionType: 'multiple_choice_single_answer',
                discipline: 'math',
                themes: ['arithmetic']
            };
            const createdQuestion = {
                uid: 'question-123',
                ...questionData,
                createdAt: new Date(),
                updatedAt: new Date(),
                gradeLevel: '6th Grade',
                difficulty: 1,
                author: 'Test Author',
                sourceName: 'Test Source',
                sourceUrl: null,
                associatedImageUrl: null,
                isHidden: false
            };
            mockQuestionService.createQuestion.mockResolvedValue(createdQuestion);
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/questions')
                .send(questionData)
                .expect('Content-Type', /json/)
                .expect(201);
            expect(mockQuestionService.createQuestion).toHaveBeenCalledWith('teacher-123', expect.objectContaining(questionData));
            // Convert dates to strings for comparison with JSON response
            const expectedQuestion = {
                ...createdQuestion,
                createdAt: createdQuestion.createdAt.toISOString(),
                updatedAt: createdQuestion.updatedAt.toISOString()
            };
            expect(response.body).toEqual({ question: expectedQuestion });
        });
        it('should return 400 if required fields are missing', async () => {
            const incompleteData = {
                title: 'Test Question'
                // Missing required fields
            };
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/questions')
                .send(incompleteData)
                .expect('Content-Type', /json/)
                .expect(400);
            expect(response.body.error).toBe('Required fields missing');
            expect(mockQuestionService.createQuestion).not.toHaveBeenCalled();
        });
    });
    describe('GET /api/v1/questions/:uid', () => {
        it('should return a question by ID', async () => {
            const mockQuestion = {
                uid: 'question-123',
                title: 'Test Question',
                text: 'What is 2+2?',
                answerOptions: [],
                correctAnswers: [],
                questionType: 'multiple_choice_single_answer',
                discipline: 'math',
                themes: ['arithmetic'],
                isHidden: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                gradeLevel: '6th Grade',
                difficulty: 1,
                author: 'Test Author',
                sourceName: 'Test Source',
                sourceUrl: null,
                associatedImageUrl: null
            };
            mockQuestionService.getQuestionById.mockResolvedValue(mockQuestion);
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/v1/questions/question-123')
                .expect('Content-Type', /json/)
                .expect(200);
            expect(mockQuestionService.getQuestionById).toHaveBeenCalledWith('question-123');
            // Convert dates to strings for comparison with JSON response
            const expectedQuestion = {
                ...mockQuestion,
                createdAt: mockQuestion.createdAt.toISOString(),
                updatedAt: mockQuestion.updatedAt.toISOString()
            };
            expect(response.body).toEqual({ question: expectedQuestion });
        });
        it('should return 404 if question is not found', async () => {
            mockQuestionService.getQuestionById.mockResolvedValue(null);
            await (0, supertest_1.default)(server_1.app)
                .get('/api/v1/questions/nonexistent-id')
                .expect('Content-Type', /json/)
                .expect(404);
            expect(mockQuestionService.getQuestionById).toHaveBeenCalledWith('nonexistent-id');
        });
        it('should return 404 if question is hidden and user is not a teacher', async () => {
            const mockQuestion = {
                uid: 'question-123',
                isHidden: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                title: 'Hidden Question',
                text: 'This is a hidden question',
                answerOptions: [],
                correctAnswers: [],
                questionType: 'multiple_choice_single_answer',
                discipline: 'math',
                themes: ['arithmetic'],
                gradeLevel: '6th Grade',
                difficulty: 1,
                author: 'Test Author',
                sourceName: 'Test Source',
                sourceUrl: null,
                associatedImageUrl: null,
                explanation: 'This is an explanation',
                tags: [],
                timeLimit: 60
            };
            mockQuestionService.getQuestionById.mockResolvedValue(mockQuestion);
            // Override auth middleware just for this test
            globals_1.jest.mock('@/middleware/auth', () => ({
                teacherAuth: (req, res, next) => {
                    // No teacherId in req.user
                    req.user = { userId: 'player-123' };
                    next();
                }
            }));
            await (0, supertest_1.default)(server_1.app)
                .get('/api/v1/questions/question-123')
                .expect('Content-Type', /json/)
                .expect(404);
        });
    });
    describe('GET /api/v1/questions', () => {
        it('should get questions with filters and pagination', async () => {
            const mockResult = {
                questions: [
                    {
                        uid: 'question-1',
                        title: 'Question 1',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        text: 'What is 1+1?',
                        answerOptions: [],
                        correctAnswers: [],
                        questionType: 'multiple_choice_single_answer',
                        discipline: 'math',
                        themes: ['arithmetic'],
                        gradeLevel: '6th Grade',
                        difficulty: 1,
                        author: 'Test Author',
                        sourceName: 'Test Source',
                        sourceUrl: null,
                        associatedImageUrl: null,
                        isHidden: false,
                        explanation: 'This is an explanation',
                        tags: [],
                        timeLimit: 60
                    },
                    {
                        uid: 'question-2',
                        title: 'Question 2',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        text: 'What is 2+2?',
                        answerOptions: [],
                        correctAnswers: [],
                        questionType: 'multiple_choice_single_answer',
                        discipline: 'math',
                        themes: ['arithmetic'],
                        gradeLevel: '6th Grade',
                        difficulty: 1,
                        author: 'Test Author',
                        sourceName: 'Test Source',
                        sourceUrl: null,
                        associatedImageUrl: null,
                        isHidden: false,
                        explanation: 'This is an explanation',
                        tags: [],
                        timeLimit: 60
                    }
                ],
                total: 2,
                page: 1,
                pageSize: 20,
                totalPages: 1
            };
            mockQuestionService.getQuestions.mockResolvedValue(mockResult);
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/v1/questions?discipline=math&page=1&pageSize=20')
                .expect('Content-Type', /json/)
                .expect(200);
            // Update the expectation to match how the API handles includeHidden
            // The API defaults to false when the query param is not explicitly set to 'true'
            expect(mockQuestionService.getQuestions).toHaveBeenCalledWith({ discipline: 'math', includeHidden: undefined }, { skip: 0, take: 20 });
            // Convert dates to strings for comparison with JSON response
            const expectedResult = {
                ...mockResult,
                questions: mockResult.questions.map(q => ({
                    ...q,
                    createdAt: q.createdAt.toISOString(),
                    updatedAt: q.updatedAt.toISOString()
                }))
            };
            expect(response.body).toEqual(expectedResult);
        });
    });
    describe('PUT /api/v1/questions/:uid', () => {
        it('should update a question successfully', async () => {
            const updateData = {
                title: 'Updated Question',
                difficulty: 2
            };
            const updatedQuestion = {
                uid: 'question-123',
                ...updateData,
                createdAt: new Date(),
                updatedAt: new Date(),
                text: 'What is 2+2?',
                answerOptions: [],
                correctAnswers: [],
                questionType: 'multiple_choice_single_answer',
                discipline: 'math',
                themes: ['arithmetic'],
                gradeLevel: '6th Grade',
                author: 'Test Author',
                sourceName: 'Test Source',
                sourceUrl: null,
                associatedImageUrl: null,
                isHidden: false,
                explanation: 'This is an explanation',
                tags: [],
                timeLimit: 60
            };
            mockQuestionService.updateQuestion.mockResolvedValue(updatedQuestion);
            const response = await (0, supertest_1.default)(server_1.app)
                .put('/api/v1/questions/question-123')
                .send(updateData)
                .expect('Content-Type', /json/)
                .expect(200);
            expect(mockQuestionService.updateQuestion).toHaveBeenCalledWith({
                uid: 'question-123',
                ...updateData
            });
            // Convert dates to strings for comparison with JSON response
            const expectedQuestion = {
                ...updatedQuestion,
                createdAt: updatedQuestion.createdAt.toISOString(),
                updatedAt: updatedQuestion.updatedAt.toISOString()
            };
            expect(response.body).toEqual({ question: expectedQuestion });
        });
        it('should return 404 if question to update is not found', async () => {
            const error = new Error('Question with ID nonexistent-id not found');
            mockQuestionService.updateQuestion.mockRejectedValue(error);
            await (0, supertest_1.default)(server_1.app)
                .put('/api/v1/questions/nonexistent-id')
                .send({ title: 'Updated Title' })
                .expect('Content-Type', /json/)
                .expect(404);
        });
    });
    describe('DELETE /api/v1/questions/:uid', () => {
        it('should delete a question successfully', async () => {
            mockQuestionService.deleteQuestion.mockResolvedValue({ success: true });
            const response = await (0, supertest_1.default)(server_1.app)
                .delete('/api/v1/questions/question-123')
                .expect('Content-Type', /json/)
                .expect(200);
            expect(mockQuestionService.deleteQuestion).toHaveBeenCalledWith('question-123');
            expect(response.body).toEqual({ success: true });
        });
        it('should return 404 if question to delete is not found', async () => {
            const error = new Error('Question with ID nonexistent-id not found');
            mockQuestionService.deleteQuestion.mockRejectedValue(error);
            await (0, supertest_1.default)(server_1.app)
                .delete('/api/v1/questions/nonexistent-id')
                .expect('Content-Type', /json/)
                .expect(404);
        });
    });
});
