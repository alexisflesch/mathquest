# Test info

- Name: Game Creation and Joining Integration >> complete game creation and joining flow
- Location: /home/aflesch/mathquest/app/tests/e2e/game-creation-joining-flow.test.ts:107:9

# Error details

```
Error: locator.click: Test timeout of 10000ms exceeded.
Call log:
  - waiting for locator('button[type="submit"]')
    - locator resolved to <button disabled type="submit" class="btn btn-primary">Commencer à jouer</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    14 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms

    at authenticateUser (/home/aflesch/mathquest/app/tests/e2e/game-creation-joining-flow.test.ts:61:24)
    at /home/aflesch/mathquest/app/tests/e2e/game-creation-joining-flow.test.ts:104:9
```

# Page snapshot

```yaml
- alert
- button "Open Next.js Dev Tools":
  - img
- complementary:
  - button "Réduire le menu"
  - navigation:
    - link "Accueil":
      - /url: /
    - link "Se connecter":
      - /url: /login
    - text: Non connecté Connectez-vous en mode invité ou avec un compte pour accéder à l'appli
  - button "Passer en mode clair": Thème système
- main:
  - button "Invité"
  - button "Compte"
  - paragraph: Commencez rapidement avec un pseudo et un avatar. Vous pourrez créer un compte plus tard pour sauvegarder vos progrès.
  - text: Prénom (et suffixe éventuel)
  - textbox "Prénom (et suffixe éventuel)"
  - text: Suffixe
  - textbox "Suffixe (lettre majuscule ou chiffre)"
  - text: Avatar
  - button "🐶"
  - button "🐕"
  - button "🦮"
  - button "🐕‍🦺"
  - button "🐩"
  - button "🐺"
  - button "🦊"
  - button "🐱"
  - button "🐈"
  - button "🐈‍⬛"
  - button "🐅"
  - button "🐆"
  - button "🐯"
  - button "🦁"
  - button "🐴"
  - button "🐎"
  - button "🦄"
  - button "🦓"
  - button "🐮"
  - button "🐂"
  - button "🐃"
  - button "🐄"
  - button "🐷"
  - button "🐖"
  - button "🐗"
  - button "🐏"
  - button "🐑"
  - button "🐐"
  - button "🦬"
  - button "🐻"
  - button "🐻‍❄️"
  - button "🐼"
  - button "🐨"
  - button "🐹"
  - button "🐭"
  - button "🐁"
  - button "🐀"
  - button "🐇"
  - button "🐰"
  - button "🦇"
  - button "🦡"
  - button "🦨"
  - button "🦦"
  - button "🦥"
  - button "🦘"
  - button "🦙"
  - button "🦒"
  - button "🦏"
  - button "🦛"
  - button "🐘"
  - button "🦣"
  - button "🦫"
  - button "🦝"
  - button "🦌"
  - button "🐔"
  - button "🐓"
  - button "🐥"
  - button "🐤"
  - button "🐣"
  - button "🐦"
  - button "🐧"
  - button "🕊️"
  - button "🦅"
  - button "🦆"
  - button "🦉"
  - button "🦚"
  - button "🦜"
  - button "🦢"
  - button "🦤"
  - button "🦩"
  - button "🦃"
  - button "🐬"
  - button "🐋"
  - button "🐳"
  - button "🐟"
  - button "🐠"
  - button "🐡"
  - button "🦈"
  - button "🦭"
  - button "🐙"
  - button "🦑"
  - button "🦐"
  - button "🦞"
  - button "🦀"
  - button "🦪"
  - button "🐚"
  - button "🪼"
  - button "🐢"
  - button "🐊"
  - button "🐍"
  - button "🦎"
  - button "🐉"
  - button "🐲"
  - button "🦕"
  - button "🦖"
  - button "🐸"
  - button "🐝"
  - button "🪲"
  - button "🐞"
  - button "🐜"
  - button "🪳"
  - button "🪰"
  - button "🦟"
  - button "🐛"
  - button "🦋"
  - button "🐌"
  - button "🦗"
  - button "🕷️"
  - button "🕸️"
  - button "🦂"
  - button "🧑‍🌾"
  - button "🤖"
  - button "👽"
  - button "👾"
  - button "🧸"
  - button "🐾"
  - button "🍉"
  - button "🍎"
  - button "🍇"
  - button "⭐"
  - button "🌟"
  - button "⚡"
  - button "🌈"
  - button "👑"
  - button "🎩"
  - button "🕶️"
  - button "Commencer à jouer" [disabled]
```

# Test source

```ts
   1 | /**
   2 |  * Integration Tests for Game Creation and Joining Flow
   3 |  *
   4 |  * Tests the complete flow from game creation to joining,
   5 |  * ensuring that API routes work correctly together.
   6 |  */
   7 |
   8 | import { test, expect, Page } from '@playwright/test';
   9 |
   10 | // Test configuration
   11 | const TEST_CONFIG = {
   12 |     baseUrl: 'http://localhost:3008',
   13 |     user: {
   14 |         username: 'IntegrationTestUser',
   15 |         avatar: '🤖'
   16 |     },
   17 |     game: {
   18 |         gradeLevel: 'CP',
   19 |         discipline: 'Mathématiques',
   20 |         themes: ['addition']
   21 |     }
   22 | };
   23 |
   24 | interface GameData {
   25 |     accessCode: string;
   26 |     gameId: string;
   27 | }
   28 |
   29 | // Helper function to log with timestamp
   30 | function log(message: string, data?: unknown) {
   31 |     const timestamp = new Date().toISOString();
   32 |     console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
   33 | }
   34 |
   35 | // Helper to authenticate user
   36 | async function authenticateUser(page: Page): Promise<void> {
   37 |     log('Starting user authentication...');
   38 |
   39 |     await page.goto(TEST_CONFIG.baseUrl + '/login');
   40 |
   41 |     // Check if we're already logged in
   42 |     try {
   43 |         await page.waitForSelector('[data-testid="user-profile"]', { timeout: 2000 });
   44 |         log('User already authenticated');
   45 |         return;
   46 |     } catch {
   47 |         log('User not authenticated, proceeding with login...');
   48 |     }
   49 |
   50 |     // Fill username
   51 |     const usernameInput = page.locator('input[placeholder*="name"], input[name="username"]');
   52 |     await usernameInput.waitFor({ timeout: 5000 });
   53 |     await usernameInput.fill(TEST_CONFIG.user.username);
   54 |
   55 |     // Select avatar
   56 |     const avatarButton = page.locator('button.emoji-avatar', { hasText: TEST_CONFIG.user.avatar });
   57 |     await avatarButton.first().click();
   58 |
   59 |     // Submit login
   60 |     const submitButton = page.locator('button[type="submit"]');
>  61 |     await submitButton.click();
      |                        ^ Error: locator.click: Test timeout of 10000ms exceeded.
   62 |
   63 |     // Wait for successful login
   64 |     await page.waitForSelector('[data-testid="user-profile"], nav, header', { timeout: 10000 });
   65 |     log('User authentication successful');
   66 | }
   67 |
   68 | // Helper to create a game
   69 | async function createGame(page: Page, playMode: 'quiz' | 'tournament' | 'practice' = 'quiz'): Promise<GameData> {
   70 |     log(`Creating ${playMode} game...`);
   71 |
   72 |     const response = await page.request.post('/api/games', {
   73 |         data: {
   74 |             name: `${TEST_CONFIG.user.username} ${playMode}`,
   75 |             playMode: playMode,
   76 |             gradeLevel: TEST_CONFIG.game.gradeLevel,
   77 |             discipline: TEST_CONFIG.game.discipline,
   78 |             themes: TEST_CONFIG.game.themes,
   79 |             nbOfQuestions: 2,
   80 |             settings: {
   81 |                 defaultMode: 'direct',
   82 |                 avatar: TEST_CONFIG.user.avatar,
   83 |                 username: TEST_CONFIG.user.username
   84 |             }
   85 |         }
   86 |     });
   87 |
   88 |     if (!response.ok()) {
   89 |         const errorText = await response.text();
   90 |         throw new Error(`Failed to create game: ${response.status()} - ${errorText}`);
   91 |     }
   92 |
   93 |     const gameData = await response.json();
   94 |     log('Game created successfully', gameData);
   95 |
   96 |     return {
   97 |         accessCode: gameData.gameInstance.accessCode || gameData.gameInstance.code,
   98 |         gameId: gameData.gameInstance.id
   99 |     };
  100 | }
  101 |
  102 | test.describe('Game Creation and Joining Integration', () => {
  103 |     test.beforeEach(async ({ page }) => {
  104 |         await authenticateUser(page);
  105 |     });
  106 |
  107 |     test('complete game creation and joining flow', async ({ page }) => {
  108 |         // Step 1: Create a game
  109 |         const gameData = await createGame(page, 'quiz');
  110 |         expect(gameData.accessCode).toBeTruthy();
  111 |         expect(gameData.gameId).toBeTruthy();
  112 |
  113 |         // Step 2: Fetch game data by access code
  114 |         const fetchResponse = await page.request.get(`/api/games/${gameData.accessCode}`);
  115 |         expect(fetchResponse.ok()).toBe(true);
  116 |
  117 |         const fetchedGameData = await fetchResponse.json();
  118 |         expect(fetchedGameData.gameInstance).toBeTruthy();
  119 |         expect(fetchedGameData.gameInstance.id).toBe(gameData.gameId);
  120 |         expect(fetchedGameData.gameInstance.accessCode || fetchedGameData.gameInstance.code).toBe(gameData.accessCode);
  121 |
  122 |         // Step 3: Navigate to student join page
  123 |         await page.goto('/student/join');
  124 |
  125 |         // Step 4: Enter the access code
  126 |         const codeInput = page.locator('input[placeholder*="code"]');
  127 |         await codeInput.waitFor({ timeout: 5000 });
  128 |         await codeInput.fill(gameData.accessCode);
  129 |
  130 |         // Step 5: Submit the form
  131 |         const submitButton = page.locator('button[type="submit"]');
  132 |         await submitButton.click();
  133 |
  134 |         // Step 6: Verify we're redirected to the practice page (since it's a quiz)
  135 |         await page.waitForURL(`**/student/practice/${gameData.accessCode}`, { timeout: 10000 });
  136 |
  137 |         const currentUrl = page.url();
  138 |         expect(currentUrl).toContain(`/student/practice/${gameData.accessCode}`);
  139 |
  140 |         log('✅ Complete game creation and joining flow successful', {
  141 |             gameId: gameData.gameId,
  142 |             accessCode: gameData.accessCode,
  143 |             finalUrl: currentUrl
  144 |         });
  145 |     });
  146 |
  147 |     test('game creation with different modes', async ({ page }) => {
  148 |         const modes: ('quiz' | 'tournament' | 'practice')[] = ['quiz', 'tournament', 'practice'];
  149 |
  150 |         for (const mode of modes) {
  151 |             log(`Testing ${mode} mode...`);
  152 |
  153 |             // Create game
  154 |             const gameData = await createGame(page, mode);
  155 |
  156 |             // Verify game data
  157 |             expect(gameData.accessCode).toBeTruthy();
  158 |             expect(gameData.gameId).toBeTruthy();
  159 |
  160 |             // Fetch game data
  161 |             const fetchResponse = await page.request.get(`/api/games/${gameData.accessCode}`);
```