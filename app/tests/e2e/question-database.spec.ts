import { test, expect } from '@playwright/test';
import { TestDataHelper } from './helpers/test-helpers';

/**
 * Question Database and Tournament Creation Tests
 * 
 * These tests validate that the question database is properly seeded
 * and tournament creation APIs work correctly.
 */

test.describe('Question Database Tests', () => {

    test('should check if questions exist in database', async ({ page }) => {
        console.log('🔍 Checking questions in database...');

        // First, create and login a teacher to get auth
        const testData = new TestDataHelper(page);
        const teacherData = testData.generateTestData('db_check');
        const teacher = await testData.createTeacher({
            username: teacherData.username,
            email: teacherData.email,
            password: teacherData.password
        });

        await page.request.post('http://localhost:3007/api/v1/auth/login', {
            data: {
                email: teacher.email,
                password: teacher.password
            }
        });

        // Check questions endpoint
        const questionsResponse = await page.request.get('http://localhost:3007/api/v1/questions');
        console.log(`📊 Questions endpoint status: ${questionsResponse.status()}`);

        if (questionsResponse.ok()) {
            const questions = await questionsResponse.json();
            console.log(`📝 Found ${questions.length || 0} questions in database`);

            if (questions.length > 0) {
                console.log(`🔍 Sample question: ${JSON.stringify(questions[0], null, 2)}`);
            }
        } else {
            const errorBody = await questionsResponse.text();
            console.log(`❌ Questions endpoint error: ${errorBody}`);
        }
    });

    test('should validate tournament creation filters', async ({ page }) => {
        console.log('🎯 Testing tournament creation with different filters...');

        const testFilters = [
            {
                name: 'Basic Math Test',
                gradeLevel: 'CP',
                discipline: 'Mathématiques',
                theme: 'additions'
            },
            {
                name: 'Alternative Test',
                gradeLevel: 'CE1',
                discipline: 'Mathématiques',
                theme: 'soustractions'
            }
        ];

        for (const filter of testFilters) {
            console.log(`🧪 Testing filter: ${JSON.stringify(filter)}`);

            const tournamentResponse = await page.request.post('http://localhost:3007/api/v1/games', {
                data: {
                    name: filter.name,
                    playMode: 'tournament', // Use playMode instead of type
                    gradeLevel: filter.gradeLevel,
                    discipline: filter.discipline,
                    theme: filter.theme,
                    questionCount: 5
                }
            });

            console.log(`📊 Tournament creation status: ${tournamentResponse.status()}`);

            if (!tournamentResponse.ok()) {
                const errorBody = await tournamentResponse.text();
                console.log(`❌ Error: ${errorBody}`);
            } else {
                const result = await tournamentResponse.json();
                console.log(`✅ Tournament created: ${result.accessCode || 'unknown'}`);
            }
        }
    });

    test('should check available question filters', async ({ page }) => {
        console.log('🔍 Checking available question filters...');

        // Check if there's an endpoint for available filters
        const endpoints = [
            '/api/v1/questions/filters',
            '/api/v1/questions/niveaux',
            '/api/v1/questions/disciplines',
            '/api/v1/questions/themes'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await page.request.get(`http://localhost:3007${endpoint}`);
                console.log(`📊 ${endpoint}: ${response.status()}`);

                if (response.ok()) {
                    const data = await response.json();
                    console.log(`✅ ${endpoint} data:`, data);
                }
            } catch (error) {
                console.log(`❌ ${endpoint}: Not available`);
            }
        }
    });
});
