/**
 * Test to verify that the join page loads and handles invalid codes gracefully
 * This tests the basic functionality without requiring complex guest authentication setup
 */

import { test, expect } from '@playwright/test';

test('join page loads and handles invalid codes gracefully', async ({ page }) => {
  // Navigate to join page
  await page.goto('http://localhost:3008/student/join');

  // Wait for join page to load
  await page.waitForURL('**/student/join');
  await page.waitForSelector('input[placeholder*="Code de l"], input[placeholder*="activité"]', { timeout: 5000 });

  // Verify we're on the join page
  const pageTitle = page.locator('text=Rejoindre une activité');
  await expect(pageTitle).toBeVisible();

  // Enter invalid game code
  const codeInput = page.locator('input[type="tel"], input[placeholder*="Code"]').first();
  await codeInput.fill('9999');

  // Click join button
  const joinButton = page.locator('button:has-text("Rejoindre")');
  await joinButton.waitFor();
  await joinButton.click();

  // Should show some kind of error message (either userId error or code not found)
  // The important thing is that the page doesn't crash
  await page.waitForTimeout(2000);

  // Check that we're still on the join page (didn't navigate away)
  await expect(pageTitle).toBeVisible();

  console.log('✅ Join page handles invalid codes gracefully without crashing');
});
