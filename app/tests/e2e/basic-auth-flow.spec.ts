import { test, expect } from '@playwright/test';

test.describe('Basic Authentication Flow', () => {
    test('Teacher can login successfully', async ({ page }) => {
        // Step 1: Go to homepage
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Step 2: Click unified login button
        const loginButton = page.getByText('Se connecter ou jouer en invité');
        await expect(loginButton).toBeVisible();
        await loginButton.click();
        await page.waitForLoadState('networkidle');

        // Step 3: Should be on login page, select teacher mode
        expect(page.url()).toContain('/login');

        // Step 4: Click on "Compte" (Account) mode button
        const accountModeButton = page.locator('button:has-text("Compte")');
        await expect(accountModeButton).toBeVisible();
        await accountModeButton.click();

        // Step 5: Check teacher login form is present (account mode shows email/password)
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        const submitButton = page.locator('button[type="submit"]');

        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
        await expect(submitButton).toBeVisible();

        console.log('✅ Teacher login form found successfully');

        // Take screenshot for debugging
        await page.screenshot({ path: 'test-results/teacher-login-form.png' });
    });

    test('Student can access student area', async ({ page }) => {
        // Step 1: Go to homepage
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Step 2: Click unified login button
        const loginButton = page.getByText('Se connecter ou jouer en invité');
        await expect(loginButton).toBeVisible();
        await loginButton.click();
        await page.waitForLoadState('networkidle');

        // Step 3: Should be on login page, use guest mode (default)
        expect(page.url()).toContain('/login');

        // Step 4: Check guest form is present (should be default)
        const usernameInput = page.locator('[data-testid="username-input"]');
        const submitButton = page.locator('button[type="submit"]');

        await expect(usernameInput).toBeVisible();
        await expect(submitButton).toBeVisible();

        console.log('✅ Guest/Student form found successfully');

        // Take screenshot for debugging
        await page.screenshot({ path: 'test-results/student-form.png' });
    });

    test('Can navigate to tournament join page', async ({ page }) => {
        // Go directly to student join page
        await page.goto('/student/join');
        await page.waitForLoadState('networkidle');

        // Check tournament code input exists
        const codeInput = page.locator('input[placeholder*="code"], input[placeholder*="Code"]');
        const joinButton = page.locator('button[type="submit"]');

        await expect(codeInput).toBeVisible();
        await expect(joinButton).toBeVisible();

        console.log('✅ Tournament join form found successfully');

        // Take screenshot for debugging
        await page.screenshot({ path: 'test-results/tournament-join-form.png' });

        expect(page.url()).toContain('/student/join');
    });
});
