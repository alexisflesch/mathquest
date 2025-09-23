import { test, expect } from '@playwright/test';

test.describe('Debug Login Page', () => {
    test('inspect login page structure', async ({ page }) => {
        await page.goto('http://localhost:3008/login');
        await page.waitForLoadState('networkidle');

        // Wait a bit for dynamic content
        await page.waitForTimeout(2000);

        // Get all buttons on the page
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        console.log(`Found ${buttonCount} buttons:`);

        for (let i = 0; i < buttonCount; i++) {
            const button = buttons.nth(i);
            const text = await button.textContent();
            const className = await button.getAttribute('class') || '';
            console.log(`Button ${i}: "${text}" (class: ${className})`);
        }

        // Check for specific button texts
        const compteButton = page.locator('button:has-text("Compte")');
        const compteCount = await compteButton.count();
        console.log(`Found ${compteCount} buttons with text "Compte"`);

        // Check for guest button
        const guestButton = page.locator('button:has-text("Invité")');
        const guestCount = await guestButton.count();
        console.log(`Found ${guestCount} buttons with text "Invité"`);

        // Check for input fields
        const inputs = page.locator('input');
        const inputCount = await inputs.count();
        console.log(`Found ${inputCount} input fields:`);

        for (let i = 0; i < inputCount; i++) {
            const input = inputs.nth(i);
            const placeholder = await input.getAttribute('placeholder') || '';
            const name = await input.getAttribute('name') || '';
            const type = await input.getAttribute('type') || '';
            console.log(`Input ${i}: placeholder="${placeholder}", name="${name}", type="${type}"`);
        }
    });
});