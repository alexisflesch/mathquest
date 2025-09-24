/**
 * Authentication & Basic Navigation Test Suite
 *
 * Tests guest authentication and basic navigation functionality
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

test.describe('Authentication & Basic Navigation', () => {
    test('guest user can authenticate and access main features', async ({ page }) => {
        await authenticateGuestUser(page);

        // Verify we can access main navigation
        await expect(page.locator('nav, header, [data-testid="main-navbar"]')).toBeVisible();

        // Check that we can navigate to different sections
        const joinLink = page.locator('a:has-text("Rejoindre"), [href*="join"]');
        if (await joinLink.count() > 0) {
            await joinLink.first().click();
            await expect(page).toHaveURL(/.*join/);
        }

        log('✅ Guest user navigation works');
    });
});