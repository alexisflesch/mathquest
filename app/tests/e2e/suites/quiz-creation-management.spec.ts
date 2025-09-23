/**
 * Quiz Creation & Management Test Suite
 *
 * Tests quiz template creation and game instantiation
 */

import { test, expect, Page } from '@playwright/test';

const TEST_CONFIG = {
    baseUrl: 'http://localhost:3008',
    backendUrl: 'http://localhost:3007',
    timeout: 30000,
    teacher: {
        username: 'Pierre',
        avatar: '👨‍🏫'
    },
    student: {
        username: 'TestStudent',
        avatar: '🎓'
    },
    guest: {
        username: 'TestGuest',
        avatar: '🐨'
    },
    game: {
        gradeLevel: 'CP',
        discipline: 'Mathématiques',
        themes: ['Calcul']
    }
};

interface GameData {
    accessCode: string;
    gameId: string;
}

interface TemplateData {
    templateId: string;
    name: string;
}

// Logging helper
function log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    if (data) {
        console.log(`[${timestamp}] ${message}`, data);
    } else {
        console.log(`[${timestamp}] ${message}`);
    }
}

// Helper to authenticate as teacher user
async function authenticateTeacherUser(page: Page): Promise<void> {
    log('Starting teacher guest authentication');

    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.waitForLoadState('networkidle');

    // Use guest login instead of account login
    const usernameInput = page.locator('input[placeholder*="name"], input[name="username"], input[id="username"]');
    await usernameInput.waitFor({ timeout: 5000 });

    await usernameInput.fill('Pierre');
    log('Filled username: Pierre');

    // Wait for dropdown and click outside to close it
    await page.waitForTimeout(1000);
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // Select avatar
    const avatarButton = page.locator('button.emoji-avatar').first();
    await avatarButton.click();

    // Click submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter"), button:has-text("Login"), button:has-text("Commencer")');
    await submitButton.click();

    // Wait for authentication to complete
    await page.waitForSelector('[data-testid="user-profile"], .user-profile, nav, header', { timeout: 15000 });
    log('✅ Teacher guest authentication successful');
}

// Helper to create a quiz template (teacher functionality)
async function createQuizTemplate(page: Page): Promise<TemplateData> {
    log('Creating quiz template...');

    // First, get some question UIDs using browser fetch
    log('Fetching questions from API...');
    const questionsResponse = await page.evaluate(async (params) => {
        try {
            const result = await fetch('/api/questions/list?' + new URLSearchParams(params), {
                method: 'GET',
                credentials: 'include'
            });
            if (!result.ok) {
                throw new Error(`${result.status} - ${await result.text()}`);
            }
            const jsonData = await result.json();
            return { success: true, data: jsonData };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, {
        gradeLevel: TEST_CONFIG.game.gradeLevel,
        discipline: TEST_CONFIG.game.discipline,
        themes: TEST_CONFIG.game.themes.join(','),
        limit: '5'
    });

    log(`Questions API response: ${JSON.stringify(questionsResponse)}`);

    if (!questionsResponse.success) {
        throw new Error(`Failed to get questions: ${questionsResponse.error}`);
    }

    const questionsData = questionsResponse.data;
    const questionUids = Array.isArray(questionsData) ? questionsData.slice(0, 5) : [];

    if (questionUids.length === 0) {
        throw new Error('No questions found for template creation');
    }

    log(`Got ${questionUids.length} question UIDs for template: ${questionUids.join(', ')}`);

    // Create template via API using browser fetch (like practice game)
    log('Creating template via API...');
    const response = await page.evaluate(async (data) => {
        try {
            const result = await fetch('/api/game-templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });
            if (!result.ok) {
                const errorText = await result.text();
                throw new Error(`${result.status} - ${errorText}`);
            }
            const jsonData = await result.json();
            return { success: true, data: jsonData };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, {
        name: `Test Quiz Template ${Date.now()}`,
        gradeLevel: TEST_CONFIG.game.gradeLevel,
        discipline: TEST_CONFIG.game.discipline,
        themes: TEST_CONFIG.game.themes,
        questionUids: questionUids,
        description: 'Test template created by e2e test',
        defaultMode: 'quiz'
    });

    log(`Template creation API response: ${JSON.stringify(response)}`);

    if (!response.success) {
        log(`Template creation failed: ${response.error}`);
        throw new Error(`Failed to create quiz template: ${response.error}`);
    }

    const templateData = response.data;
    log('Quiz template created successfully', templateData);

    return {
        templateId: templateData.gameTemplate.id,
        name: templateData.gameTemplate.name
    };
}

// Helper to create a game instance from template
async function createGameFromTemplate(page: Page, templateId: string, playMode: 'quiz' | 'tournament' | 'practice' = 'quiz'): Promise<GameData> {
    log(`Creating ${playMode} game from template using browser fetch...`);

    const response = await page.evaluate(async (data) => {
        try {
            const result = await fetch('/api/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });
            if (!result.ok) {
                const errorText = await result.text();
                throw new Error(`${result.status} - ${errorText}`);
            }
            const jsonData = await result.json();
            return { success: true, data: jsonData };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, {
        name: `Test ${playMode} Game ${Date.now()}`,
        playMode: playMode,
        gameTemplateId: templateId,
        gradeLevel: TEST_CONFIG.game.gradeLevel,
        discipline: TEST_CONFIG.game.discipline,
        themes: TEST_CONFIG.game.themes,
        nbOfQuestions: 3,
        settings: {
            defaultMode: 'direct',
            avatar: TEST_CONFIG.teacher.avatar,
            username: TEST_CONFIG.teacher.username
        }
    });

    if (!response.success) {
        throw new Error(`Failed to create game from template: ${response.error}`);
    }

    const gameData = response.data;
    log(`${playMode} game created successfully`, gameData);

    return {
        accessCode: gameData.gameInstance.accessCode || gameData.gameInstance.code,
        gameId: gameData.gameInstance.id
    };
}

test.describe('Quiz Creation & Management', () => {
    test('teacher can create quiz template', async ({ page }) => {
        await authenticateTeacherUser(page);

        // Create quiz template
        const templateData = await createQuizTemplate(page);

        // Verify template was created
        expect(templateData.templateId).toBeTruthy();
        expect(templateData.name).toContain('Test Quiz Template');

        log('✅ Quiz template creation works');
    });

    test('teacher can instantiate quiz from template', async ({ page }) => {
        await authenticateTeacherUser(page);

        // First create a template
        const templateData = await createQuizTemplate(page);

        // Then create a game instance from it
        const gameData = await createGameFromTemplate(page, templateData.templateId, 'quiz');

        // Verify game was created
        expect(gameData.accessCode).toBeTruthy();
        expect(gameData.gameId).toBeTruthy();

        log('✅ Quiz instantiation from template works');
    });
});