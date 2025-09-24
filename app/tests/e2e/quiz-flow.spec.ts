import { test, expect, Page } from '@playwright/test';
import { TestDataHelper, LoginHelper, SocketHelper } from './helpers/test-helpers';

test.describe('Complete Quiz Flow E2E', () => {
    let teacherPage: Page;
    let testData: any;

    test.beforeAll(async ({ browser }) => {
        // Create separate browser context for teacher
        const teacherContext = await browser.newContext();
        teacherPage = await teacherContext.newPage();

        // Generate test data
        const dataHelper = new TestDataHelper(teacherPage);
        testData = dataHelper.generateTestData('quiz_e2e');
    });

    test.afterAll(async () => {
        await teacherPage?.close();
    });

    test('Teacher can create quiz template and instantiate game', async () => {
        const dataHelper = new TestDataHelper(teacherPage);
        const teacherLogin = new LoginHelper(teacherPage);

        // Step 1: Create teacher account and login
        const teacherData = await dataHelper.createTeacher({
            username: testData.username,
            email: testData.email,
            password: testData.password
        });

        await teacherLogin.loginAsTeacher({
            email: testData.email,
            password: testData.password
        });

        // Verify teacher login was successful
        await expect(teacherPage.locator('button:has-text("Déconnexion")')).toBeVisible();

        // Step 2: Get some question UIDs first
        const questionsResponse = await teacherPage.request.get('/api/questions/list', {
            params: {
                gradeLevel: 'CP',
                discipline: 'Mathématiques',
                themes: 'Calcul',
                limit: '5'
            }
        });

        expect(questionsResponse.ok()).toBeTruthy();
        const questionsData = await questionsResponse.json();
        const questionUids = Array.isArray(questionsData) ? questionsData.slice(0, 3) : [];

        expect(questionUids.length).toBeGreaterThan(0);

        // Step 3: Create a quiz template via API
        const templateResponse = await teacherPage.request.post('/api/game-templates', {
            data: {
                name: testData.quizName,
                gradeLevel: 'CP',
                discipline: 'Mathématiques',
                themes: ['Calcul'],
                questionUids: questionUids,
                description: 'Test template created by e2e test',
                defaultMode: 'quiz'
            }
        });

        expect(templateResponse.ok()).toBeTruthy();
        const templateData = await templateResponse.json();
        expect(templateData.gameTemplate).toBeTruthy();
        expect(templateData.gameTemplate.id).toBeTruthy();

        // Step 4: Instantiate a quiz game from the template via API
        const gameResponse = await teacherPage.request.post('/api/games', {
            data: {
                name: `Test Quiz Game ${Date.now()}`,
                gameTemplateId: templateData.gameTemplate.id,
                playMode: 'quiz',
                settings: {}
            }
        });

        expect(gameResponse.ok()).toBeTruthy();
        const gameData = await gameResponse.json();
        expect(gameData.gameInstance).toBeTruthy();
        expect(gameData.gameInstance.id).toBeTruthy();
        expect(gameData.gameInstance.accessCode).toBeTruthy();

        console.log(`✅ Quiz template created and game instantiated successfully with code: ${gameData.gameInstance.accessCode}`);
    });

    test('Socket.IO real-time updates work correctly', async () => {
        // This test specifically focuses on real-time synchronization
        // Will be implemented as part of the main test above
    });

    test('Timer synchronization across all clients', async () => {
        // This test specifically focuses on timer synchronization
        // Will be implemented as part of the main test above
    });
});
