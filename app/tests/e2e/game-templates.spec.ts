import { test, expect } from '@playwright/test';
import { TestDataHelper } from './helpers/test-helpers';

/**
 * Game Template Investigation
 * 
 * Understand how game templates work and what's available
 */

test.describe('Game Template Tests', () => {

    test('should check available game templates', async ({ page }) => {
        const testData = new TestDataHelper(page);

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

        console.log('🔍 Checking game templates...');
        const templatesResponse = await page.request.get('http://localhost:3007/api/v1/game-templates');
        console.log(`📊 Game templates status: ${templatesResponse.status()}`);

        if (templatesResponse.ok()) {
            const templates = await templatesResponse.json();
            console.log(`📝 Found ${templates.length || 0} game templates`);

            if (templates.length > 0) {
                console.log('✅ Available templates:');
                templates.slice(0, 3).forEach((template: any, index: number) => {
                    console.log(`  ${index + 1}. ID: ${template.id}, Name: ${template.name}`);
                    console.log(`     Filters: gradeLevel=${template.gradeLevel}, theme=${template.theme}`);
                });
            }
        } else {
            const errorBody = await templatesResponse.text();
            console.log(`❌ Templates error: ${errorBody}`);
        }
    });

    test('should create game template and then tournament', async ({ page }) => {
        const testData = new TestDataHelper(page);

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

        console.log('🎯 Creating game template...');
        const templateResponse = await page.request.post('http://localhost:3007/api/v1/game-templates', {
            data: {
                name: 'E2E Test Template',
                gradeLevel: 'CP', // Use gradeLevel instead of niveau
                discipline: 'Mathématiques',
                themes: ['addition'], // Use themes array instead of single theme
                questionCount: 5
            }
        });

        console.log(`📊 Template creation status: ${templateResponse.status()}`);

        if (!templateResponse.ok()) {
            const errorBody = await templateResponse.text();
            console.log(`❌ Template creation error: ${errorBody}`);
            return;
        }

        const template = await templateResponse.json();
        console.log(`✅ Template created. Response:`, template);

        const templateId = template.id || template.gameTemplateId || template.templateId;
        console.log(`📝 Using template ID: ${templateId}`);

        if (!templateId) {
            console.log('❌ No template ID found in response');
            return;
        }

        console.log('🏆 Creating tournament with template...');
        const tournamentResponse = await page.request.post('http://localhost:3007/api/v1/games', {
            data: {
                name: 'E2E Test Tournament',
                gameTemplateId: templateId,
                playMode: 'tournament'
            }
        });

        console.log(`📊 Tournament creation status: ${tournamentResponse.status()}`);

        if (tournamentResponse.ok()) {
            const tournament = await tournamentResponse.json();
            console.log(`🎉 Tournament created successfully! Access code: ${tournament.accessCode}`);
        } else {
            const errorBody = await tournamentResponse.text();
            console.log(`❌ Tournament creation error: ${errorBody}`);
        }
    });
});
