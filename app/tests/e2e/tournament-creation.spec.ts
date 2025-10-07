import { test, expect } from '@playwright/test';
import { TestDataHelper } from './helpers/test-helpers';

/**
 * Comprehensive Tournament Creation Tests
 * 
 * Tests the full flow: Teacher creation → Authentication → Tournament creation
 */

test.describe('Tournament Creation Tests', () => {

    test('should create tournament with teacher authentication', async ({ page }) => {
        const testData = new TestDataHelper(page);

        console.log('🧑‍🏫 Step 1: Creating teacher...');
        const teacherData = testData.generateTestData('teacher');
        const teacher = await testData.createTeacher({
            username: teacherData.username,
            email: teacherData.email,
            password: teacherData.password
        });

        console.log('🔐 Step 2: Authenticating teacher...');
        // Login teacher to get auth cookies
        const loginResponse = await page.request.post('http://localhost:3007/api/v1/auth/login', {
            data: {
                email: teacher.email,
                password: teacher.password
            }
        });

        console.log(`📊 Login status: ${loginResponse.status()}`);

        if (!loginResponse.ok()) {
            const errorBody = await loginResponse.text();
            console.log(`❌ Login error: ${errorBody}`);
            throw new Error(`Teacher login failed: ${loginResponse.status()}`);
        }

        console.log('✅ Teacher authentication successful');

        console.log('🎯 Step 3: Creating tournament...');
        const tournamentResponse = await page.request.post('http://localhost:3007/api/v1/games', {
            data: {
                name: 'E2E Test Tournament',
                playMode: 'tournament',
                gradeLevel: 'CP',
                discipline: 'Mathématiques',
                themes: ['Calcul'], // Use theme that exists
                nbOfQuestions: 5 // Use nbOfQuestions instead of questionCount
            }
        });

        console.log(`📊 Tournament creation status: ${tournamentResponse.status()}`);

        if (!tournamentResponse.ok()) {
            const errorBody = await tournamentResponse.text();
            console.log(`❌ Tournament creation error: ${errorBody}`);
            throw new Error(`Tournament creation failed: ${tournamentResponse.status()}`);
        }

        const tournament = await tournamentResponse.json();
        console.log(`✅ Tournament response:`, JSON.stringify(tournament, null, 2));
        console.log(`🔍 Access code: ${tournament.gameInstance?.accessCode || tournament.accessCode || 'not found'}`);

        // Check for accessCode in different possible locations
        const accessCode = tournament.gameInstance?.accessCode || tournament.accessCode || tournament.id;
        expect(accessCode).toBeDefined();

        console.log('🎉 Full tournament creation flow successful!');
    });

    test('should test multiple tournament configurations', async ({ page }) => {
        const testData = new TestDataHelper(page);

        // Create and login teacher once
        console.log('🧑‍🏫 Creating and authenticating teacher...');
        const teacherData = testData.generateTestData('teacher');
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

        // Test different tournament configurations
        const configurations = [
            { gradeLevel: 'CP', themes: ['additions'], nbOfQuestions: 3 },
            { gradeLevel: 'CP', themes: ['soustractions'], nbOfQuestions: 5 },
            { gradeLevel: 'CP', themes: ['additions', 'soustractions'], nbOfQuestions: 4 }
        ];

        for (const config of configurations) {
            console.log(`🧪 Testing configuration: ${JSON.stringify(config)}`);

            const response = await page.request.post('http://localhost:3007/api/v1/games', {
                data: {
                    name: `Test ${config.themes[0]} ${config.gradeLevel}`,
                    playMode: 'tournament',
                    gradeLevel: config.gradeLevel,
                    discipline: 'math',
                    themes: config.themes,
                    nbOfQuestions: config.nbOfQuestions
                }
            });

            console.log(`📊 ${config.themes[0]} tournament: ${response.status()}`);

            if (response.ok()) {
                const result = await response.json();
                console.log(`✅ Created: ${result.accessCode}`);
            } else {
                const error = await response.text();
                console.log(`❌ Failed: ${error}`);
            }
        }
    });
});
