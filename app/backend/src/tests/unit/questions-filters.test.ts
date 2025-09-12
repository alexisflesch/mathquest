require('../../../tests/setupTestEnv');

import { jest } from '@jest/globals';
import { describe, it, expect, beforeAll, afterAll, beforeEach, test } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Import types
import { QuestionService } from '../../core/services/questionService';

// Import the testing utility
import { __setQuestionServiceForTesting } from '../../api/v1/questions';

// Import setupServer after mocks
const { setupServer } = require('../../server');

describe('Questions API - Filters Endpoint', () => {
    let app: express.Application;
    let httpServer: any;
    let mockQuestionService: jest.Mocked<QuestionService>;

    beforeAll(async () => {
        // Setup test server
        const serverSetup = setupServer(0);
        app = serverSetup.httpServer;
        httpServer = serverSetup.httpServer;

        // Create a mock QuestionService
        mockQuestionService = {
            createQuestion: jest.fn(),
            getQuestionById: jest.fn(),
            getQuestions: jest.fn(),
            updateQuestion: jest.fn(),
            deleteQuestion: jest.fn(),
            getAvailableFilters: jest.fn(),
            normalizeQuestion: jest.fn()
        } as any;

        // Inject the mock service for testing
        __setQuestionServiceForTesting(mockQuestionService);

        // Wait for server to be ready
        await new Promise((resolve) => {
            httpServer.listen(0, () => resolve(null));
        });
    });

    afterAll(async () => {
        if (httpServer) {
            httpServer.close();
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the mock to return default data
        mockQuestionService.getAvailableFilters.mockResolvedValue({
            gradeLevel: [],
            disciplines: [],
            themes: [],
            authors: [],
            tags: []
        });
    });

    test('should return available filters without query parameters', async () => {
        const mockFilters = {
            gradeLevel: ['CP', 'CE1', 'CE2'],
            disciplines: ['Mathématiques', 'Français'],
            themes: ['Addition', 'Soustraction'],
            authors: ['Auteur1', 'Auteur2'],
            tags: ['tag1', 'tag2']
        };

        mockQuestionService.getAvailableFilters.mockResolvedValue(mockFilters);

        const response = await request(app)
            .get('/api/v1/questions/filters')
            .expect(200);

        expect(mockQuestionService.getAvailableFilters).toHaveBeenCalledWith({});
        expect(response.body).toEqual({
            gradeLevel: ['CP', 'CE1', 'CE2'],
            disciplines: ['Mathématiques', 'Français'],
            themes: ['Addition', 'Soustraction'],
            tags: ['tag1', 'tag2']
        });
    });

    test('should return filtered results with query parameters', async () => {
        const filteredMockFilters = {
            gradeLevel: ['CP'],
            disciplines: ['Mathématiques'],
            themes: ['Addition'],
            authors: ['Auteur1'],
            tags: ['tag1']
        };

        mockQuestionService.getAvailableFilters.mockResolvedValue(filteredMockFilters);

        const response = await request(app)
            .get('/api/v1/questions/filters?gradeLevel=CP&discipline=Mathématiques')
            .expect(200);

        expect(mockQuestionService.getAvailableFilters).toHaveBeenCalledWith({
            gradeLevel: ['CP'],
            discipline: ['Mathématiques']
        });
        expect(response.body).toEqual({
            gradeLevel: ['CP'],
            disciplines: ['Mathématiques'],
            themes: ['Addition'],
            tags: ['tag1']
        });
    });

    test('should handle array query parameters', async () => {
        const arrayMockFilters = {
            gradeLevel: ['CP', 'CE1'],
            disciplines: ['Mathématiques'],
            themes: ['Addition'],
            authors: ['Auteur1'],
            tags: ['tag1']
        };

        mockQuestionService.getAvailableFilters.mockResolvedValue(arrayMockFilters);

        const response = await request(app)
            .get('/api/v1/questions/filters?gradeLevel=CP&gradeLevel=CE1')
            .expect(200);

        expect(mockQuestionService.getAvailableFilters).toHaveBeenCalledWith({
            gradeLevel: ['CP', 'CE1']
        });
    });

    test('should handle service errors gracefully', async () => {
        mockQuestionService.getAvailableFilters.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .get('/api/v1/questions/filters')
            .expect(500);

        expect(response.body).toEqual({ error: 'An error occurred while fetching filters' });
    });
});
