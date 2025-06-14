import { test, expect } from '@playwright/test';

test.describe('Login Page Analysis', () => {
    test('should analyze login page structure', async ({ page }) => {
        // Go to login page
        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        console.log('=== LOGIN PAGE ANALYSIS ===');
        console.log(`Current URL: ${page.url()}`);

        // Find all buttons
        const buttons = await page.locator('button').all();
        console.log(`\nFound ${buttons.length} buttons:`);

        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            const text = await button.textContent();
            const classes = await button.getAttribute('class');
            console.log(`Button ${i + 1}: "${text}" | Classes: ${classes}`);
        }

        // Find all inputs
        const inputs = await page.locator('input').all();
        console.log(`\nFound ${inputs.length} inputs:`);

        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const defaultMode = await input.getAttribute('defaultMode');
            const placeholder = await input.getAttribute('placeholder');
            const testId = await input.getAttribute('data-testid');
            console.log(`Input ${i + 1}: type="${defaultMode", placeholder="${placeholder}", testId="${testId}"`);
        }

        // Find all links
        const links = await page.locator('a').all();
        console.log(`\nFound ${links.length} links:`);

        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            const text = await link.textContent();
            const href = await link.getAttribute('href');
            console.log(`Link ${i + 1}: "${text}" -> ${href}`);
        }

        // Check for common login elements
        const loginModes = [
            'Compte', 'Teacher', 'Enseignant', 'Professeur',
            'Student', 'Étudiant', 'Élève', 'Invité', 'Guest'
        ];

        console.log('\n=== LOGIN MODE DETECTION ===');
        for (const mode of loginModes) {
            const element = page.locator(`text=${mode}`);
            const exists = await element.count() > 0;
            console.log(`"${mode}": ${exists ? '✅ Found' : '❌ Not found'}`);
        }

        // Take a screenshot for visual debugging
        await page.screenshot({ path: 'debug-login-page.png', fullPage: true });
        console.log('\n📸 Screenshot saved: debug-login-page.png');
    });
});
