/**
 * Practice Mode Test Suite
 *
 * Tests practice game creation and functionality
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

// Logging helper
function log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    if (data) {
        console.log(`[${timestamp}] ${message}`, data);
    } else {
        console.log(`[${timestamp}] ${message}`);
    }
}

// Helper to authenticate as guest user
async function authenticateGuestUser(page: Page, username: string = 'Pierre'): Promise<void> {
    log(`Starting guest user authentication for ${username}`);

    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.waitForLoadState('networkidle');

    // Use guest login instead of account login
    const usernameInput = page.locator('input[placeholder*="name"], input[name="username"], input[id="username"]');
    await usernameInput.waitFor({ timeout: 5000 });

    await usernameInput.fill(username);
    log(`Filled username: ${username}`);

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
    log(`✅ Guest authentication successful for ${username}`);
}

// Helper to create a practice game (using same API as working tournament test)
async function createPracticeGame(page: Page): Promise<GameData> {
    log('Creating practice game...');

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
        name: `Test Practice Game ${Date.now()}`,
        playMode: 'practice',
        gradeLevel: TEST_CONFIG.game.gradeLevel,
        discipline: TEST_CONFIG.game.discipline,
        themes: TEST_CONFIG.game.themes,
        nbOfQuestions: 3,
        settings: {
            defaultMode: 'direct',
            avatar: TEST_CONFIG.guest.avatar,
            username: 'Pierre'
        }
    });

    if (!response.success) {
        throw new Error(`Failed to create practice game: ${response.error}`);
    }

    const gameData = response.data;
    log('Practice game created successfully', gameData);

    return {
        accessCode: gameData.gameInstance.accessCode || gameData.gameInstance.code,
        gameId: gameData.gameInstance.id
    };
}

test.describe('Practice Mode', () => {
    test('student can create practice game', async ({ page }) => {
        // Authenticate as guest student
        await page.goto(`${TEST_CONFIG.baseUrl}/login`);

        const usernameInput = page.locator('input[placeholder*="name"], input[name="username"], input[id="username"]');
        await usernameInput.waitFor({ timeout: 5000 });
        await usernameInput.fill('Pierre');

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

        // Create practice game
        const gameData = await createPracticeGame(page);

        // Verify game was created successfully
        expect(gameData.accessCode).toBeTruthy();
        expect(gameData.gameId).toBeTruthy();

        log('✅ Practice game creation works for authenticated students');
    });
});