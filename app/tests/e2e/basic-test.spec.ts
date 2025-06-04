import { test, expect } from '@playwright/test';

test('basic test to verify setup', async ({ page }) => {
    await page.goto('http://localhost:3008');
    // Just check if the page loads
    expect(page).toBeTruthy();
});
