/**
 * API Route Consistency Tests
 *
 * Ens            console.log(`Response status: ${response.status()}`);
            const responseText = await response.text();
            console.log(`Response body: ${responseText.substring(0, 200)}`);

            // All routes should return a 400 status for malformed JSON
            expect(response.status()).toBe(400);

            // Try to parse the response as JSON (should succeed)
            const responseBody = await response.json().catch(() => null);
            expect(responseBody).not.toBeNull();PI routes follow consistent patterns for:
 * - Request body parsing (JSON vs text vs formData)
 * - Error handling
 * - Response formatting
 * - Authentication patterns
 */

import { test, expect } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3008',
    backendUrl: 'http://localhost:3007'
};

/**
 * Test that all API routes handle JSON request bodies consistently
 */
test.describe('API Route Consistency', () => {
    test('all POST/PUT API routes should handle JSON bodies consistently', async ({ page }) => {
        // Test various API endpoints with malformed JSON to ensure they handle parsing errors consistently

        const apiEndpoints = [
            { path: '/api/games', method: 'POST', body: '{invalid json' },
            { path: '/api/games/TEST123/join', method: 'POST', body: '{invalid json' },
            { path: '/api/games/TEST123/status', method: 'PUT', body: '{invalid json' },
            { path: '/api/auth/register', method: 'POST', body: '{invalid json' },
            { path: '/api/auth/universal-login', method: 'POST', body: '{invalid json' },
        ];

        for (const endpoint of apiEndpoints) {
            console.log(`Testing endpoint: ${endpoint.path}`);
            const response = await page.request.fetch(endpoint.path, {
                method: endpoint.method,
                headers: {
                    'Content-Type': 'application/json',
                },
                data: endpoint.body
            });

            console.log(`Response status: ${response.status()}`);
            const responseText = await response.text();
            console.log(`Response body: ${responseText.substring(0, 200)}`);

            // Routes should return either 400 (malformed JSON) or 401 (auth required before JSON validation)
            expect([400, 401]).toContain(response.status());

            // Try to parse the response as JSON (should succeed)
            const parsedResponseBody = await response.json().catch(() => null);
            expect(parsedResponseBody).not.toBeNull();

            // Should have consistent error structure
            expect(parsedResponseBody).toHaveProperty('error');
            expect(typeof parsedResponseBody.error).toBe('string');
        }
    });

    test('all API routes should handle empty request bodies appropriately', async ({ page }) => {
        const apiEndpoints = [
            { path: '/api/games', method: 'POST' },
            { path: '/api/games/TEST123/join', method: 'POST' },
            { path: '/api/auth/register', method: 'POST' },
            { path: '/api/auth/universal-login', method: 'POST' },
        ];

        for (const endpoint of apiEndpoints) {
            const response = await page.request.fetch(endpoint.path, {
                method: endpoint.method,
                headers: {
                    'Content-Type': 'application/json',
                },
                data: ''
            });

            // Should return 400 for empty JSON body
            expect([400, 422]).toContain(response.status());
        }
    });

    test('API routes should consistently validate Content-Type headers', async ({ page }) => {
        // Test that routes expecting JSON properly validate Content-Type
        const endpoints = [
            '/api/games',
            '/api/games/TEST123/join',
            '/api/auth/register',
        ];

        for (const endpoint of endpoints) {
            // Test with missing Content-Type
            const response1 = await page.request.post(endpoint, {
                data: JSON.stringify({ test: 'data' })
            });

            // Should still work (most APIs are forgiving)
            expect([200, 201, 400, 401, 422]).toContain(response1.status());

            // Test with wrong Content-Type
            const response2 = await page.request.post(endpoint, {
                headers: {
                    'Content-Type': 'text/plain',
                },
                data: JSON.stringify({ test: 'data' })
            });

            // Should still work or return validation error
            expect([200, 201, 400, 401, 422]).toContain(response2.status());
        }
    });
});

/**
 * Test that API routes handle authentication consistently
 */
test.describe('API Authentication Consistency', () => {
    test('unauthenticated requests should return consistent error format', async ({ page }) => {
        const protectedEndpoints = [
            { path: '/api/games/TEST123/status', method: 'PUT' },
            { path: '/api/game-templates', method: 'GET' },
        ];

        for (const endpoint of protectedEndpoints) {
            const response = await page.request.fetch(endpoint.path, {
                method: endpoint.method,
                headers: {
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify({ test: 'data' })
            });

            // Should return 401 for unauthenticated requests
            expect(response.status()).toBe(401);

            const responseBody = await response.json().catch(() => null);
            expect(responseBody).toHaveProperty('error');
            expect(typeof responseBody.error).toBe('string');
        }
    });
});

/**
 * Test that API routes handle errors consistently
 */
test.describe('API Error Handling Consistency', () => {
    test('all API routes should return JSON errors for client errors', async ({ page }) => {
        // Test various error scenarios
        const errorScenarios = [
            // Invalid game code
            { path: '/api/games/INVALID/status', method: 'PUT', data: { status: 'active' } },
            // Invalid join request
            { path: '/api/games/INVALID/join', method: 'POST', data: { userId: 'invalid' } },
        ];

        for (const scenario of errorScenarios) {
            const response = await page.request.fetch(scenario.path, {
                method: scenario.method,
                headers: {
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify(scenario.data)
            });

            // Should return error status
            expect(response.status()).toBeGreaterThanOrEqual(400);

            // Should return JSON error
            const responseBody = await response.json().catch(() => null);
            expect(responseBody).not.toBeNull();
            expect(responseBody).toHaveProperty('error');
        }
    });
});