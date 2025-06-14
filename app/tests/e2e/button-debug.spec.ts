import { test, expect } from '@playwright/test';

test.describe('Button Detection Debug', () => {
    test('should debug button detection timing', async ({ page }) => {
        console.log('🔍 Starting button detection debug...');

        // Navigate to login page
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        console.log('✅ Page loaded');

        // Check immediately
        const compteButton = page.locator('button:has-text("Compte")');
        const compteCount = await compteButton.count();
        console.log(`🔍 Immediate check - "Compte" buttons found: ${compteCount}`);

        // Check with different selectors
        const allButtons = await page.locator('button').all();
        console.log(`🔍 Total buttons on page: ${allButtons.length}`);

        // Check visible buttons
        const visibleButtons = await page.locator('button:visible').all();
        console.log(`🔍 Visible buttons: ${visibleButtons.length}`);

        // Check for exact text match
        for (let i = 0; i < Math.min(10, allButtons.length); i++) {
            const button = allButtons[i];
            const text = await button.textContent();
            const isVisible = await button.isVisible();
            console.log(`Button ${i}: "${text}" - Visible: ${isVisible}`);
        }

        // Try different ways to find Compte
        const selectors = [
            'button:has-text("Compte")',
            'button:text("Compte")',
            'button >> text="Compte"',
            '[role="button"]:has-text("Compte")',
            '*:has-text("Compte")'
        ];

        for (const selector of selectors) {
            try {
                const element = page.locator(selector);
                const count = await element.count();
                console.log(`Selector "${selector}": ${count} elements found`);
            } catch (error) {
                console.log(`Selector "${selector}": ERROR - ${error.message}`);
            }
        }

        // Wait and check again
        await page.waitForTimeout(2000);
        const compteCount2 = await compteButton.count();
        console.log(`🔍 After 2s wait - "Compte" buttons found: ${compteCount2}`);

        // Take screenshot
        await page.screenshot({ path: 'debug-button-detection.png', fullPage: true });
        console.log('📸 Screenshot saved: debug-button-detection.png');
    });
});
