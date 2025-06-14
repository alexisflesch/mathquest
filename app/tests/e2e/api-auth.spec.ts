import { test, expect } from '@playwright/test';
import { TestDataHelper } from './helpers/test-helpers';

/**
 * API-Level Authentication Tests
 * 
 * These tests focus on backend API functionality without relying on complex UI interactions.
 * This allows us to validate core authentication flows while UI components are being stabilized.
 */

test.describe('API Authentication Tests', () => {

    test('should create teacher account via API', async ({ page }) => {
        const testData = new TestDataHelper(page);

        const teacherData = testData.generateTestData('teacher');
        const teacher = await testData.createTeacher({
            username: teacherData.username,
            email: teacherData.email,
            password: teacherData.password
        });

        expect(teacher.id).toBeDefined();
        expect(teacher.defaultMode).toBe('teacher');
        expect(teacher.username).toBe(teacherData.username);
        expect(teacher.email).toBe(teacherData.email);

        console.log('✅ Teacher API creation test passed');
    });

    test('should create student account via API', async ({ page }) => {
        const testData = new TestDataHelper(page);

        const studentData = testData.generateTestData('student');
        const student = await testData.createStudent({
            username: studentData.username,
            password: studentData.password,
            firstName: 'Test',
            lastName: 'Student'
        });

        expect(student.id).toBeDefined();
        expect(student.defaultMode).toBe('student');
        expect(student.username).toBe(studentData.username);

        console.log('✅ Student API creation test passed');
    });

    test('should validate auth endpoints are accessible', async ({ page }) => {
        // Test auth status endpoint
        const statusResponse = await page.request.get('http://localhost:3007/api/v1/auth/status');
        expect(statusResponse.ok()).toBeTruthy();

        // Test auth register endpoint exists
        const registerResponse = await page.request.post('http://localhost:3007/api/v1/auth/register', {
            data: {
                username: 'test_validation_user',
                role: 'STUDENT'
            }
        });
        // Should either succeed or fail with validation error (not 404)
        expect(registerResponse.status()).not.toBe(404);

        console.log('✅ Auth endpoints accessibility test passed');
    });

    test('should validate backend health and readiness', async ({ page }) => {
        // Check backend health
        const healthResponse = await page.request.get('http://localhost:3007/health');
        expect(healthResponse.ok()).toBeTruthy();

        const healthData = await healthResponse.text();
        expect(healthData).toBe('OK');

        console.log('✅ Backend health check passed');
    });
});
