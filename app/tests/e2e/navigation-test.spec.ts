import { test, expect } from '@playwright/test';

test.describe('Navigation Analysis', () => {
    test('Understand app navigation flow', async ({ page }) => {
        console.log('\n=== STARTING NAVIGATION ANALYSIS ===');

        // Step 1: Go to homepage
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        console.log(`Homepage URL: ${page.url()}`);

        // Step 2: Try to click Teacher button using text selector
        const teacherButton = page.getByText('Enseignant');
        if (await teacherButton.isVisible()) {
            console.log('✅ Found Teacher button, clicking...');
            await teacherButton.click();
            await page.waitForLoadState('networkidle');
            console.log(`After Teacher click: ${page.url()}`);
        } else {
            console.log('❌ Teacher button not found');
        }

        // Step 3: Look for login elements - use button role to avoid ambiguity
        const loginButton = page.getByRole('button', { name: 'Se connecter' });
        if (await loginButton.isVisible()) {
            console.log('✅ Found Login button, clicking...');
            await loginButton.click();
            await page.waitForLoadState('networkidle');
            console.log(`After Login click: ${page.url()}`);

            // Check for form fields
            const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]');
            const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password"], input[placeholder*="Password"]');

            console.log(`Email input found: ${await emailInput.count()}`);
            console.log(`Password input found: ${await passwordInput.count()}`);

            if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
                console.log('✅ Login form detected - we can proceed with authentication tests');
            }
        } else {
            console.log('❌ Login button not found');
        }

        // Take final screenshot
        await page.screenshot({ path: 'test-results/navigation-final.png' });

        expect(page.url()).toContain('localhost:3008');
    });
});
