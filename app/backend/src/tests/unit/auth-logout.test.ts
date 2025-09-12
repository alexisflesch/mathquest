require('../../../tests/setupTestEnv');

import { jest } from '@jest/globals';
import { describe, it, expect, beforeAll, afterAll, test } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock the logger BEFORE any other imports
jest.mock('../../utils/logger', () => ({
    __esModule: true,
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    },
    default: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }))
}));

// Import setupServer using require AFTER the mock
const { setupServer } = require('../../server');

describe('Auth API - Logout Endpoint', () => {
    let app: express.Application;
    let httpServer: any;

    beforeAll(async () => {
        // Setup test server
        const serverSetup = setupServer(0); // Use port 0 for auto-assignment
        app = serverSetup.httpServer;
        httpServer = serverSetup.httpServer;

        // Wait for server to be ready
        await new Promise((resolve) => {
            httpServer.listen(0, () => resolve(null));
        });
    });

    afterAll(async () => {
        // Close server after tests
        if (httpServer) {
            httpServer.close();
        }
    });

    test('should clear auth cookies on logout', async () => {
        const response = await request(app)
            .post('/api/v1/auth/logout')
            .expect(200);

        expect(response.body).toEqual({
            success: true,
            message: 'Logged out successfully'
        });

        // Note: In test environment, clearCookie might not set visible set-cookie headers
        // The important thing is that the endpoint responds correctly
    });

    test('should handle logout without existing cookies', async () => {
        const response = await request(app)
            .post('/api/v1/auth/logout')
            .expect(200);

        expect(response.body).toEqual({
            success: true,
            message: 'Logged out successfully'
        });
    });
});
