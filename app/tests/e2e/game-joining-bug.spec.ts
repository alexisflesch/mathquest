/**
 * E2E Test for Game Joining Bug
 *
 * Reproduces the issue where guest users cannot join games due to
 * 400 Bad Request errors from the join API.
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3008',
    backendUrl: 'http://localhost:3007',
    timeout: 30000,
    user: {
        username: 'TestGuest',
        avatar: '🐨'
    },
    game: {
        gradeLevel: 'CP',
        discipline: 'Mathématiques',
        themes: ['addition']
    }
};

interface GameData {
    accessCode: string;
    gameId: string;
}

// Helper function to log with timestamp
function log(message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Helper to authenticate user as guest
async function authenticateGuestUser(page: Page): Promise<void> {
    log('Starting guest user authentication...');

    await page.goto(TEST_CONFIG.baseUrl + '/login');

    // Generate a unique username for this test
    const testUsername = `TestGuest${Date.now()}`;

    // Fill in guest login form
    const usernameInput = page.locator('input[placeholder*="pseudo"]');
    await usernameInput.waitFor({ timeout: 5000 });
    await usernameInput.fill(testUsername);

    // Wait for dropdown and click outside to close it
    await page.waitForTimeout(1000);
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // Select first available avatar
    const avatarButtons = page.locator('button.emoji-avatar');
    await avatarButtons.first().waitFor({ timeout: 5000 });
    await avatarButtons.first().click();

    // Wait for avatar to be selected
    await page.waitForTimeout(500);

    // Try to click submit button regardless of enabled state
    const submitButton = page.locator('button:has-text("Commencer à jouer")');
    await submitButton.waitFor({ timeout: 5000 });

    // Force click even if disabled (to see what happens)
    await submitButton.click({ force: true });

    // Wait for authentication to complete or error
    try {
        await page.waitForSelector('[data-testid="user-profile"], .user-profile, nav, header', { timeout: 15000 });
        log('✅ Guest authentication successful');
    } catch (e) {
        // Check if there's an error message
        const errorElement = page.locator('text=Erreur, text=Error, text=Required');
        if (await errorElement.count() > 0) {
            log('❌ Authentication failed with error:', await errorElement.first().textContent());
        }
        throw e;
    }
}

// Helper to create a practice game via API
async function createPracticeGame(page: Page): Promise<GameData> {
    log('Creating practice game via API...');

    // For guest users, we need to provide initiatorStudentId
    // Let's try with a dummy ID first to see if it works
    const response = await page.request.post('/api/games', {
        data: {
            name: TEST_CONFIG.user.username,
            playMode: 'practice',
            gradeLevel: TEST_CONFIG.game.gradeLevel,
            discipline: TEST_CONFIG.game.discipline,
            themes: TEST_CONFIG.game.themes,
            nbOfQuestions: 2,
            initiatorStudentId: 'guest-test-user-id', // Dummy ID for testing
            settings: {
                defaultMode: 'direct',
                avatar: TEST_CONFIG.user.avatar,
                username: TEST_CONFIG.user.username
            }
        }
    });

    if (!response.ok()) {
        const errorText = await response.text();
        log('Game creation failed, trying without initiatorStudentId...');

        // Try without initiatorStudentId
        const response2 = await page.request.post('/api/games', {
            data: {
                name: TEST_CONFIG.user.username,
                playMode: 'practice',
                gradeLevel: TEST_CONFIG.game.gradeLevel,
                discipline: TEST_CONFIG.game.discipline,
                themes: TEST_CONFIG.game.themes,
                nbOfQuestions: 2,
                settings: {
                    defaultMode: 'direct',
                    avatar: TEST_CONFIG.user.avatar,
                    username: TEST_CONFIG.user.username
                }
            }
        });

        if (!response2.ok()) {
            const errorText2 = await response2.text();
            throw new Error(`Failed to create practice game: ${response2.status()} - ${errorText2}`);
        }

        const gameData = await response2.json();
        log('Practice game created successfully', gameData);

        return {
            accessCode: gameData.gameInstance.accessCode || gameData.gameInstance.code,
            gameId: gameData.gameInstance.id
        };
    }

    const gameData = await response.json();
    log('Practice game created successfully', gameData);

    return {
        accessCode: gameData.gameInstance.accessCode || gameData.gameInstance.code,
        gameId: gameData.gameInstance.id
    };
}

test.describe('Game Joining Bug Reproduction', () => {
    test('API properly handles join requests with userId', async ({ page }) => {
        // Authenticate as guest user
        await authenticateGuestUser(page);

        // Test the join API directly with a non-existent game code
        // This should return a proper error response, not a 400 due to missing userId
        const joinResponse = await page.request.post('/api/games/NONEXISTENT123/join', {
            data: {
                userId: 'test-guest-user-id'
            }
        });

        // Should return 400 with validation error (not "Player ID is required")
        // This proves the API is now properly parsing the request body
        expect(joinResponse.status()).toBe(400);

        const responseData = await joinResponse.json();
        log('Join API response for invalid userId:', {
            status: joinResponse.status(),
            data: responseData
        });

        // The API should validate the userId format, not complain about missing userId
        expect(responseData.error).toBe('Invalid request data');
        expect(responseData.details).toBeDefined();
        expect(responseData.details[0].field).toBe('userId');

        log('✅ Join API properly validates userId in request body');
    });

    test('join page shows appropriate error for invalid game codes', async ({ page }) => {
        // Authenticate as guest user
        await authenticateGuestUser(page);

        // After authentication, we might be redirected to login with returnTo param
        // Navigate directly to join page to ensure we're there
        await page.goto(`${TEST_CONFIG.baseUrl}/student/join`);

        // Wait for join page to load completely
        await page.waitForURL('**/student/join');
        await page.waitForSelector('input[placeholder*="Code de l"], input[placeholder*="activité"]', { timeout: 5000 });

        // Verify we're on the join page
        const pageTitle = page.locator('text=Rejoindre une activité');
        await expect(pageTitle).toBeVisible();

        // Enter invalid game code (at least 4 characters to enable button)
        const codeInput = page.locator('input[type="tel"], input[placeholder*="Code"]').first();
        await codeInput.fill('1234'); // Invalid but long enough to enable button

        // Wait for button to be enabled
        const joinButton = page.locator('button:has-text("Rejoindre")');
        await joinButton.waitFor({ timeout: 5000 });

        // Verify button is enabled
        await expect(joinButton).toBeEnabled();

        // Click join button
        await joinButton.click();

        // Wait for response
        await page.waitForTimeout(2000);

        // For guest users, should show userId error first
        const userIdError = page.locator('text=Impossible de récupérer l\'identifiant utilisateur');
        await expect(userIdError).toBeVisible({ timeout: 5000 });

        log('✅ Join page properly validates user authentication before game code');
    });
});