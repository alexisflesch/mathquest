import { test, expect } from '@playwright/test';

test.describe('Basic Connectivity', () => {
  test('Analyze available selectors on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take a screenshot
    await page.screenshot({ path: 'test-results/homepage-analysis.png', fullPage: true });

    console.log('\n=== HOMEPAGE ANALYSIS ===');

    // List all buttons and their text to understand available selectors
    const buttons = await page.locator('button').all();
    console.log(`\nFound ${buttons.length} buttons:`);
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const classes = await button.getAttribute('class');
      console.log(`Button ${i + 1}: "${text?.trim()}" | Classes: ${classes}`);
    }

    console.log(`\nTesting navigation...`);

    expect(page.url()).toContain('localhost:3008');
  });

  test('Test login flow navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for login/connection related elements
    const connectButton = page.getByText('Se connecter');
    console.log(`Se connecter button visible: ${await connectButton.isVisible()}`);

    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForLoadState('networkidle');
      console.log(`After clicking Se connecter: ${page.url()}`);
      await page.screenshot({ path: 'test-results/login-page.png' });

      // Check what form elements are available on login page
      const inputs = await page.locator('input').all();
      console.log(`\nLogin page has ${inputs.length} input fields:`);
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const defaultMode = await input.getAttribute('defaultMode');
        const placeholder = await input.getAttribute('placeholder');
        const name = await input.getAttribute('name');
        console.log(`Input ${i + 1}: type="${defaultMode", placeholder="${placeholder}", name="${name}"`);
      }
    }

    expect(page.url()).toContain('localhost:3008');
  });

  test('Backend health check', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:3007/health');
      console.log('Backend health status:', response.status());

      if (response.status() === 200) {
        const responseText = await response.text();
        console.log('Backend health response:', responseText);
        expect(response.status()).toBe(200);
      } else {
        expect(response.status()).toBeLessThan(500);
      }
    } catch (error) {
      console.log('Backend health check failed:', error);
      expect(false).toBe(true); // Fail the test if backend is not accessible
    }
  });
});
