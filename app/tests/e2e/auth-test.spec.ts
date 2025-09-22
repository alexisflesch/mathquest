import { test, expect } from "@playwright/test";
import { LoginHelper, TestDataHelper } from "./helpers/test-helpers";

test("Test teacher login flow", async ({ page }) => {
  const testData = new TestDataHelper(page);
  const loginHelper = new LoginHelper(page);

  // Generate test data
  const userData = testData.generateTestData("auth_test");

  // Create teacher account
  console.log("Creating teacher account...");
  const registerResponse = await page.request.post('http://localhost:3007/api/v1/auth/register', {
    data: {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: 'TEACHER',
      adminPassword: 'abc' // Use the actual admin password from backend .env
    }
  });

  if (!registerResponse.ok()) {
    const errorText = await registerResponse.text();
    throw new Error(`Registration failed: ${registerResponse.status()} - ${errorText}`);
  }

  const registerResult = await registerResponse.json();
  console.log('Registration result:', registerResult);

  // Test login via frontend form
  console.log("Testing login via frontend...");
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Click on account mode button
  await page.click('button:has-text("Compte")');
  await page.waitForLoadState('networkidle');

  // Fill in login form
  await page.fill('input[type="email"]', userData.email);
  await page.fill('input[type="password"]', userData.password);

  // Submit login form
  await page.click('button[type="submit"]:has-text("Se connecter")');

  // Wait for navigation or success
  await page.waitForLoadState('networkidle');

  // Wait a bit more for auth state to update
  await page.waitForTimeout(2000);

  // Check current URL
  const currentUrl = page.url();
  console.log('Current URL after login:', currentUrl);

  // Check if we're on the homepage
  if (currentUrl.includes('/login')) {
    throw new Error('Still on login page - login failed');
  }

  // Verify we are logged in by checking for logout button
  const isLoggedIn = await page.isVisible('button:has-text("Déconnexion")');
  expect(isLoggedIn, "Login failed - logout button not visible").toBeTruthy();

  // Also verify no error messages are shown
  const hasLoginError = await page.isVisible('text=Email ou mot de passe incorrect');
  expect(hasLoginError, "Login error message is visible").toBeFalsy();

  console.log("✅ Teacher login successful!");
});
