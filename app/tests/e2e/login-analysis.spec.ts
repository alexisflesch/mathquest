import { test } from "@playwright/test";

test("Check login page structure", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  
  // Click Se connecter button
  const loginButton = page.getByText("Se connecter");
  if (await loginButton.isVisible()) {
    await loginButton.click();
    await page.waitForLoadState("networkidle");
    console.log("Navigated to:", page.url());
    
    // Analyze form inputs
    const inputs = await page.locator("input").all();
    console.log(`Found ${inputs.length} inputs:`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const defaultMode = await input.getAttribute("defaultMode");
      const name = await input.getAttribute("name"); 
      const placeholder = await input.getAttribute("placeholder");
      const id = await input.getAttribute("id");
      console.log(`Input ${i+1}: type="${defaultMode", name="${name}", placeholder="${placeholder}", id="${id}"`);
    }
    
    await page.screenshot({ path: "test-results/login-form-analysis.png" });
  }
});
