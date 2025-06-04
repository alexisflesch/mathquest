import { test, expect } from "@playwright/test";
import { LoginHelper, TestDataHelper } from "./helpers/test-helpers";

test("Test teacher login flow", async ({ page }) => {
  const testData = new TestDataHelper(page);
  const loginHelper = new LoginHelper(page);

  // Generate test data
  const userData = testData.generateTestData("auth_test");

  // Create teacher account
  console.log("Creating teacher account...");
  await testData.createTeacher({
    username: userData.username,
    email: userData.email,
    password: userData.password
  });

  // Test login
  console.log("Testing login...");
  await loginHelper.loginAsTeacher({
    email: userData.email,
    password: userData.password
  });

  // Verify we are logged in by checking for logout button
  const isLoggedIn = await page.isVisible('button:has-text("Déconnexion")');
  expect(isLoggedIn, "Login failed - logout button not visible").toBeTruthy();

  // Also verify no error messages are shown
  const hasLoginError = await page.isVisible('text=Email ou mot de passe incorrect');
  expect(hasLoginError, "Login error message is visible").toBeFalsy();

  console.log("✅ Teacher login successful!");
});
