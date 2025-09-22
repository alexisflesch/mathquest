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

test.describe('Game Joining Bug Reproduction', () => {
    test('API properly handles join requests with valid userId', async ({ page }) => {
        // Authenticate as guest user
        await authenticateGuestUser(page);

        // Test the join API directly with a valid userId for non-existent game
        const joinResponse = await page.request.post('/api/games/NONEXISTENT123/join', {
            data: {
                userId: '8e3b48be-6d25-42cf-bfbe-8c025d8ca402' // Valid UUID
            }
        });

        // Should return 400 with "Game not found" (not validation error)
        expect(joinResponse.status()).toBe(400);

        const responseData = await joinResponse.json();
        log('Join API response for valid userId, invalid game:', {
            status: joinResponse.status(),
            data: responseData
        });

        // Should get game not found error, not validation error
        expect(responseData.error).toBe('Game not found');

        log('✅ Join API properly handles valid userId format');
    });

    test('reproduces user reported issue - join with invalid userId', async ({ page }) => {
        // Authenticate as guest user
        await authenticateGuestUser(page);

        // Try to join with an invalid userId (not a UUID)
        const joinResponse = await page.request.post('/api/games/3167/join', {
            data: {
                userId: 'invalid-user-id' // Invalid UUID format
            }
        });

        // Should return 400 with validation error
        expect(joinResponse.status()).toBe(400);

        const responseData = await joinResponse.json();
        log('Join API response with invalid userId:', {
            status: joinResponse.status(),
            data: responseData
        });

        // The API should validate the userId format
        expect(responseData.error).toBe('Invalid request data');
        expect(responseData.details).toBeDefined();
        expect(responseData.details[0].field).toBe('userId');
        expect(responseData.details[0].message).toContain('Invalid user ID');

        log('✅ Reproduced user issue: invalid userId causes 400 validation error');
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