# Test info

- Name: Game Joining Bug Reproduction >> API properly handles join requests with valid userId
- Location: /home/aflesch/mathquest/app/tests/e2e/game-joining-bug.spec.ts:81:9

# Error details

```
TimeoutError: locator.waitFor: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('input[placeholder*="pseudo"]') to be visible

    at authenticateGuestUser (/home/aflesch/mathquest/app/tests/e2e/game-joining-bug.spec.ts:43:25)
    at /home/aflesch/mathquest/app/tests/e2e/game-joining-bug.spec.ts:83:9
```

# Page snapshot

```yaml
- img
- heading "🧮 MathQuest" [level=2]
- paragraph: Chargement...
- text: +×÷−
```

# Test source

```ts
   1 | /**
   2 |  * E2E Test for Game Joining Bug
   3 |  *
   4 |  * Reproduces the issue where guest users cannot join games due to
   5 |  * 400 Bad Request errors from the join API.
   6 |  */
   7 |
   8 | import { test, expect, Page } from '@playwright/test';
   9 |
   10 | // Test configuration
   11 | const TEST_CONFIG = {
   12 |     baseUrl: 'http://localhost:3008',
   13 |     backendUrl: 'http://localhost:3007',
   14 |     timeout: 30000,
   15 |     user: {
   16 |         username: 'TestGuest',
   17 |         avatar: '🐨'
   18 |     },
   19 |     game: {
   20 |         gradeLevel: 'CP',
   21 |         discipline: 'Mathématiques',
   22 |         themes: ['addition']
   23 |     }
   24 | };
   25 |
   26 | // Helper function to log with timestamp
   27 | function log(message: string, data?: unknown) {
   28 |     const timestamp = new Date().toISOString();
   29 |     console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
   30 | }
   31 |
   32 | // Helper to authenticate user as guest
   33 | async function authenticateGuestUser(page: Page): Promise<void> {
   34 |     log('Starting guest user authentication...');
   35 |
   36 |     await page.goto(TEST_CONFIG.baseUrl + '/login');
   37 |
   38 |     // Generate a unique username for this test
   39 |     const testUsername = `TestGuest${Date.now()}`;
   40 |
   41 |     // Fill in guest login form
   42 |     const usernameInput = page.locator('input[placeholder*="pseudo"]');
>  43 |     await usernameInput.waitFor({ timeout: 5000 });
      |                         ^ TimeoutError: locator.waitFor: Timeout 5000ms exceeded.
   44 |     await usernameInput.fill(testUsername);
   45 |
   46 |     // Wait for dropdown and click outside to close it
   47 |     await page.waitForTimeout(1000);
   48 |     await page.locator('body').click({ position: { x: 10, y: 10 } });
   49 |     await page.waitForTimeout(500);
   50 |
   51 |     // Select first available avatar
   52 |     const avatarButtons = page.locator('button.emoji-avatar');
   53 |     await avatarButtons.first().waitFor({ timeout: 5000 });
   54 |     await avatarButtons.first().click();
   55 |
   56 |     // Wait for avatar to be selected
   57 |     await page.waitForTimeout(500);
   58 |
   59 |     // Try to click submit button regardless of enabled state
   60 |     const submitButton = page.locator('button:has-text("Commencer à jouer")');
   61 |     await submitButton.waitFor({ timeout: 5000 });
   62 |
   63 |     // Force click even if disabled (to see what happens)
   64 |     await submitButton.click({ force: true });
   65 |
   66 |     // Wait for authentication to complete or error
   67 |     try {
   68 |         await page.waitForSelector('[data-testid="user-profile"], .user-profile, nav, header', { timeout: 15000 });
   69 |         log('✅ Guest authentication successful');
   70 |     } catch (e) {
   71 |         // Check if there's an error message
   72 |         const errorElement = page.locator('text=Erreur, text=Error, text=Required');
   73 |         if (await errorElement.count() > 0) {
   74 |             log('❌ Authentication failed with error:', await errorElement.first().textContent());
   75 |         }
   76 |         throw e;
   77 |     }
   78 | }
   79 |
   80 | test.describe('Game Joining Bug Reproduction', () => {
   81 |     test('API properly handles join requests with valid userId', async ({ page }) => {
   82 |         // Authenticate as guest user
   83 |         await authenticateGuestUser(page);
   84 |
   85 |         // Test the join API directly with a valid userId for non-existent game
   86 |         const joinResponse = await page.request.post('/api/games/NONEXISTENT123/join', {
   87 |             data: {
   88 |                 userId: '8e3b48be-6d25-42cf-bfbe-8c025d8ca402' // Valid UUID
   89 |             }
   90 |         });
   91 |
   92 |         // Should return 400 with "Game not found" (not validation error)
   93 |         expect(joinResponse.status()).toBe(400);
   94 |
   95 |         const responseData = await joinResponse.json();
   96 |         log('Join API response for valid userId, invalid game:', {
   97 |             status: joinResponse.status(),
   98 |             data: responseData
   99 |         });
  100 |
  101 |         // Should get game not found error, not validation error
  102 |         expect(responseData.error).toBe('Game not found');
  103 |
  104 |         log('✅ Join API properly handles valid userId format');
  105 |     });
  106 |
  107 |     test('reproduces user reported issue - join with invalid userId', async ({ page }) => {
  108 |         // Authenticate as guest user
  109 |         await authenticateGuestUser(page);
  110 |
  111 |         // Try to join with an invalid userId (not a UUID)
  112 |         const joinResponse = await page.request.post('/api/games/3167/join', {
  113 |             data: {
  114 |                 userId: 'invalid-user-id' // Invalid UUID format
  115 |             }
  116 |         });
  117 |
  118 |         // Should return 400 with validation error
  119 |         expect(joinResponse.status()).toBe(400);
  120 |
  121 |         const responseData = await joinResponse.json();
  122 |         log('Join API response with invalid userId:', {
  123 |             status: joinResponse.status(),
  124 |             data: responseData
  125 |         });
  126 |
  127 |         // The API should validate the userId format
  128 |         expect(responseData.error).toBe('Invalid request data');
  129 |         expect(responseData.details).toBeDefined();
  130 |         expect(responseData.details[0].field).toBe('userId');
  131 |         expect(responseData.details[0].message).toContain('Invalid user ID');
  132 |
  133 |         log('✅ Reproduced user issue: invalid userId causes 400 validation error');
  134 |     });
  135 |
  136 |     test('join page shows appropriate error for invalid game codes', async ({ page }) => {
  137 |         // Authenticate as guest user
  138 |         await authenticateGuestUser(page);
  139 |
  140 |         // After authentication, we might be redirected to login with returnTo param
  141 |         // Navigate directly to join page to ensure we're there
  142 |         await page.goto(`${TEST_CONFIG.baseUrl}/student/join`);
  143 |
```