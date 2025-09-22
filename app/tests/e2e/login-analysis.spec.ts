import { test } from "@playwright/test";

test("Check login page structure", async ({ page }) => {
  // Navigate directly to /login
  console.log("Navigating directly to /login...");
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  console.log("Navigated to:", page.url());

  // Check initial state - should be guest mode
  const inputsBefore = await page.locator("input").all();
  console.log(`Initial state: Found ${inputsBefore.length} inputs (should be guest form)`);

  // Click "Compte" tab
  console.log("Clicking Compte tab...");
  const compteButton = page.locator('button:has-text("Compte")').first();
  if (await compteButton.isVisible()) {
    await compteButton.click();
    await page.waitForTimeout(1000); // Wait for state change

    // Check after clicking Compte
    const inputsAfter = await page.locator("input").all();
    console.log(`After clicking Compte: Found ${inputsAfter.length} inputs`);

    for (let i = 0; i < inputsAfter.length; i++) {
      const input = inputsAfter[i];
      const name = await input.getAttribute("name");
      const type = await input.getAttribute("type");
      const placeholder = await input.getAttribute("placeholder");
      const id = await input.getAttribute("id");
      console.log(`Input ${i + 1}: name="${name}", type="${type}", placeholder="${placeholder}", id="${id}"`);
    }

    // Check for form submission elements
    const buttons = await page.locator("button").all();
    console.log(`Found ${buttons.length} buttons:`);
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const type = await button.getAttribute("type");
      console.log(`Button ${i + 1}: text="${text}", type="${type}"`);
    }
  } else {
    console.log("Compte button not found!");
  }

  await page.screenshot({ path: "test-results/login-form-analysis.png" });
});
