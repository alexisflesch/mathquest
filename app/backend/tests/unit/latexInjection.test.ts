import { jest } from '@jest/globals';

// Mock the QuestionService
const mockQuestionService = {
    createQuestion: jest.fn(),
    getQuestionById: jest.fn(),
    getQuestions: jest.fn(),
    updateQuestion: jest.fn(),
    deleteQuestion: jest.fn(),
    getAvailableFilters: jest.fn()
};

// Mock the question service module
jest.mock('../../src/core/services/questionService', () => ({
    QuestionService: jest.fn().mockImplementation(() => mockQuestionService)
}));

// Mock the auth middleware
jest.mock('../../src/middleware/auth', () => ({
    teacherAuth: jest.fn((req: any, res: any, next: any) => {
        req.user = { userId: 'test-teacher-id', role: 'TEACHER' };
        next();
    }),
    optionalAuth: jest.fn((req: any, res: any, next: any) => {
        req.user = { userId: 'test-teacher-id', role: 'TEACHER' };
        next();
    })
}));

// Mock the validation middleware
jest.mock('../../src/middleware/validation', () => ({
    validateRequestBody: jest.fn(() => (req: any, res: any, next: any) => next())
}));

// Mock the logger
jest.mock('../../src/utils/logger', () => jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
})));

import express from 'express';
import request from 'supertest';
import { QuestionService } from '../../src/core/services/questionService';
import { __setQuestionServiceForTesting } from '../../src/api/v1/questions';

describe('LaTeX Injection Vulnerability Tests', () => {
    let app: express.Application;
    let questionService: jest.Mocked<QuestionService>;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create Express app for testing
        app = express();
        app.use(express.json());

        // Import and use the questions router
        const questionsRouter = require('../../src/api/v1/questions').default;
        app.use('/api/v1/questions', questionsRouter);

        // Set up mock service for testing
        questionService = mockQuestionService as unknown as jest.Mocked<QuestionService>;
        __setQuestionServiceForTesting(questionService);
    });

    describe('LaTeX XSS Injection Tests', () => {
        const maliciousLatexPayloads = [
            {
                name: 'Script tag injection',
                payload: '\\(\\script{alert("XSS")}\\)',
                description: 'Attempts to inject script tag through LaTeX'
            },
            {
                name: 'HTML injection',
                payload: '\\(\\html{<img src=x onerror=alert("XSS")>\\)',
                description: 'Attempts to inject HTML through LaTeX'
            },
            {
                name: 'JavaScript URL injection',
                payload: '\\(\\href{javascript:alert("XSS")}{Click me}\\)',
                description: 'Attempts to inject JavaScript URL through LaTeX'
            },
            {
                name: 'SVG injection',
                payload: '\\(\\svg{<svg onload=alert("XSS")>\\)',
                description: 'Attempts to inject SVG with onload through LaTeX'
            },
            {
                name: 'CSS injection',
                payload: '\\(\\style{body{background:url("javascript:alert(\'XSS\')")}\\)',
                description: 'Attempts to inject CSS with JavaScript through LaTeX'
            },
            {
                name: 'Iframe injection',
                payload: '\\(\\iframe{<iframe src="javascript:alert(\'XSS\')">\}\)',
                description: 'Attempts to inject iframe with JavaScript through LaTeX'
            },
            {
                name: 'Event handler injection',
                payload: '\\(\\div{<div onclick="alert(\'XSS\')">Click me</div>\\)',
                description: 'Attempts to inject HTML with event handlers through LaTeX'
            },
            {
                name: 'Data URL injection',
                payload: '\\(\\img{<img src="data:text/html,<script>alert(\'XSS\')</script>">\}\)',
                description: 'Attempts to inject data URL with script through LaTeX'
            }
        ];

        test.each(maliciousLatexPayloads)('should detect $name vulnerability', async ({ payload, description }) => {
            // Arrange
            const maliciousQuestion = {
                title: 'Test Question',
                text: `Solve this equation: ${payload}`,
                questionType: 'multipleChoice',
                discipline: 'Mathematics',
                themes: ['Algebra'],
                difficulty: 3,
                gradeLevel: 'L2',
                durationMs: 30000,
                multipleChoiceQuestion: {
                    answerOptions: ['Option A', 'Option B', 'Option C'],
                    correctAnswers: [true, false, false]
                }
            };

            questionService.createQuestion.mockResolvedValue({
                uid: 'test-uid',
                ...maliciousQuestion
            });

            // Act
            const response = await request(app)
                .post('/api/v1/questions')
                .set('Authorization', 'Bearer mock-token')
                .send(maliciousQuestion);

            // Assert
            expect(response.status).toBe(201); // Currently passes without sanitization
            expect(questionService.createQuestion).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining(payload) // Malicious content is passed through
                })
            );
        });
    });

    describe('LaTeX Parsing Error Injection Tests', () => {
        const malformedLatexPayloads = [
            {
                name: 'Unclosed delimiter',
                payload: '\\(\\(alert("XSS")',
                description: 'Unclosed LaTeX delimiter that could cause parsing errors'
            },
            {
                name: 'Nested delimiters',
                payload: '\\(\\(\\href{javascript:alert("XSS")}{\\(\\text{Click}\\)\\)}\\)',
                description: 'Nested LaTeX delimiters that could confuse parsers'
            },
            {
                name: 'Mixed delimiters',
                payload: '\\[\\(\\alert{"XSS"}\\)\\]',
                description: 'Mixed inline and display delimiters'
            },
            {
                name: 'Escaped delimiter abuse',
                payload: '\\\\(\\\\alert{\\\\"XSS\\\\"}\\\\)',
                description: 'Abusing escaped delimiters'
            }
        ];

        test.each(malformedLatexPayloads)('should detect $name vulnerability', async ({ payload, description }) => {
            // Arrange
            const maliciousQuestion = {
                title: 'Test Question',
                text: `Solve: ${payload}`,
                questionType: 'multipleChoice',
                discipline: 'Mathematics',
                themes: ['Algebra'],
                difficulty: 3,
                gradeLevel: 'L2',
                durationMs: 30000,
                multipleChoiceQuestion: {
                    answerOptions: ['Option A', 'Option B', 'Option C'],
                    correctAnswers: [true, false, false]
                }
            };

            questionService.createQuestion.mockResolvedValue({
                uid: 'test-uid',
                ...maliciousQuestion
            });

            // Act
            const response = await request(app)
                .post('/api/v1/questions')
                .set('Authorization', 'Bearer mock-token')
                .send(maliciousQuestion);

            // Assert
            expect(response.status).toBe(201); // Currently passes without validation
            expect(questionService.createQuestion).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining(payload)
                })
            );
        });
    });

    describe('LaTeX Command Injection Tests', () => {
        const commandInjectionPayloads = [
            {
                name: 'LaTeX command injection',
                payload: '\\(\\def\\x{\\alert{XSS}}\\x\\)',
                description: 'Attempts to define and execute custom LaTeX commands'
            },
            {
                name: 'Macro expansion abuse',
                payload: '\\(\\csname alert\\endcsname{XSS}\\)',
                description: 'Attempts to abuse LaTeX macro expansion'
            },
            {
                name: 'Input command abuse',
                payload: '\\(\\input{/etc/passwd}\\)',
                description: 'Attempts to use LaTeX input command for file inclusion'
            },
            {
                name: 'Write command abuse',
                payload: '\\(\\write18{cat /etc/passwd}\\)',
                description: 'Attempts to use LaTeX write18 for shell execution'
            }
        ];

        test.each(commandInjectionPayloads)('should detect $name vulnerability', async ({ payload, description }) => {
            // Arrange
            const maliciousQuestion = {
                title: 'Test Question',
                text: `Calculate: ${payload}`,
                questionType: 'numeric',
                discipline: 'Mathematics',
                themes: ['Calculus'],
                difficulty: 4,
                gradeLevel: 'L3',
                durationMs: 45000,
                numericQuestion: {
                    correctAnswer: 42,
                    tolerance: 0.1,
                    unit: 'units'
                }
            };

            questionService.createQuestion.mockResolvedValue({
                uid: 'test-uid',
                ...maliciousQuestion
            });

            // Act
            const response = await request(app)
                .post('/api/v1/questions')
                .set('Authorization', 'Bearer mock-token')
                .send(maliciousQuestion);

            // Assert
            expect(response.status).toBe(201); // Currently passes without command filtering
            expect(questionService.createQuestion).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining(payload)
                })
            );
        });
    });

    describe('LaTeX Update Endpoint Tests', () => {
        test('should allow LaTeX injection through question updates', async () => {
            // Arrange
            const maliciousUpdate = {
                text: 'Updated question with \\(\\script{alert("XSS")}\\) injection'
            };

            questionService.updateQuestion.mockResolvedValue({
                uid: 'test-uid',
                title: 'Updated Question',
                text: maliciousUpdate.text,
                questionType: 'multipleChoice',
                discipline: 'Mathematics',
                themes: ['Algebra'],
                difficulty: 3,
                gradeLevel: 'L2',
                durationMs: 30000
            });

            // Act
            const response = await request(app)
                .put('/api/v1/questions/test-uid')
                .set('Authorization', 'Bearer mock-token')
                .send(maliciousUpdate);

            // Assert
            expect(response.status).toBe(200); // Currently passes without sanitization
            expect(questionService.updateQuestion).toHaveBeenCalledWith(
                expect.objectContaining({
                    uid: 'test-uid',
                    text: expect.stringContaining('\\script{alert("XSS")}')
                })
            );
        });
    });

    describe('Bulk LaTeX Injection Tests', () => {
        test('should handle multiple LaTeX injections in single request', async () => {
            // Arrange
            const maliciousQuestion = {
                title: 'Test Question',
                text: `Question with multiple injections:
                    \\(\\script{alert("XSS1")}\\)
                    \\[\\html{<img src=x onerror=alert("XSS2")>\\]\\]
                    \\(\\href{javascript:alert("XSS3")}{Link}\\)`,
                questionType: 'multipleChoice',
                discipline: 'Mathematics',
                themes: ['Algebra'],
                difficulty: 3,
                gradeLevel: 'L2',
                durationMs: 30000,
                multipleChoiceQuestion: {
                    answerOptions: ['Option A', 'Option B', 'Option C'],
                    correctAnswers: [true, false, false]
                }
            };

            questionService.createQuestion.mockResolvedValue({
                uid: 'test-uid',
                ...maliciousQuestion
            });

            // Act
            const response = await request(app)
                .post('/api/v1/questions')
                .set('Authorization', 'Bearer mock-token')
                .send(maliciousQuestion);

            // Assert
            expect(response.status).toBe(201); // Currently passes without sanitization
            const createQuestionCall = questionService.createQuestion.mock.calls[0][0];
            expect(createQuestionCall.text).toContain('\\script{alert("XSS1")}');
            expect(createQuestionCall.text).toContain('<img src=x onerror=alert("XSS2")>');
            expect(createQuestionCall.text).toContain('javascript:alert("XSS3")');
        });
    });
});