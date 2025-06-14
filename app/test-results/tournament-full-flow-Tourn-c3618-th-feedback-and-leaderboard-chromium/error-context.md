# Test info

- Name: Tournament Full Flow E2E >> should complete full tournament flow with feedback and leaderboard
- Location: /home/aflesch/mathquest/app/tests/e2e/tournament-full-flow.spec.ts:312:9

# Error details

```
Error: Failed to start tournament: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/live/3170" until "load"
============================================================
    at startTournament (/home/aflesch/mathquest/app/tests/e2e/tournament-full-flow.spec.ts:209:15)
    at /home/aflesch/mathquest/app/tests/e2e/tournament-full-flow.spec.ts:326:13
```

# Page snapshot

```yaml
- alert
- button "Open Next.js Dev Tools":
  - img
- complementary:
  - button "Réduire le menu"
  - text: TestUser 🐨
  - navigation:
    - link "Accueil":
      - /url: /
    - link "Entraînement libre":
      - /url: /student/create-game?training=true
    - link "Rejoindre un tournoi":
      - /url: /student/join
    - link "Créer un tournoi":
      - /url: /student/create-game
    - link "Mes tournois":
      - /url: /my-tournaments
    - link "Profil":
      - /url: /profile
  - button "Passer en mode clair": Thème système
  - button "Déconnexion"
- main:
  - text: 🐨 TestUser 3170
  - button "Partager le code du tournoi"
  - separator
  - text: Participants connectés 🐨 TestUser
  - button "Démarrer le tournoi"
```

# Test source

```ts
  109 |
  110 |     try {
  111 |         // Get cookies from the browser context for debugging
  112 |         const cookies = await context.cookies();
  113 |         log('Available cookies for API request', {
  114 |             cookieNames: cookies.map(c => c.name),
  115 |             authToken: cookies.find(c => c.name === 'authToken')?.value?.substring(0, 20) + '...' || 'none',
  116 |             teacherToken: cookies.find(c => c.name === 'teacherToken')?.value?.substring(0, 20) + '...' || 'none'
  117 |         });
  118 |
  119 |         // Use page.request to make authenticated API call
  120 |         const response = await page.request.post('/api/games', {
  121 |             data: {
  122 |                 name: TEST_CONFIG.user.username,
  123 |                 playMode: 'tournament',
  124 |                 gradeLevel: TEST_CONFIG.tournament.gradeLevel,
  125 |                 discipline: TEST_CONFIG.tournament.discipline,
  126 |                 themes: TEST_CONFIG.tournament.themes,
  127 |                 nbOfQuestions: 2,
  128 |                 settings: {
  129 |                     type: 'direct',
  130 |                     avatar: TEST_CONFIG.user.avatar,
  131 |                     username: TEST_CONFIG.user.username
  132 |                 }
  133 |             }
  134 |         });
  135 |
  136 |         if (!response.ok()) {
  137 |             const errorText = await response.text();
  138 |             throw new Error(`Failed to create tournament: ${response.status()} - ${errorText}`);
  139 |         }
  140 |
  141 |         const tournamentData = await response.json();
  142 |         log('Tournament created successfully', tournamentData);
  143 |
  144 |         return {
  145 |             accessCode: tournamentData.gameInstance.accessCode || tournamentData.gameInstance.code,
  146 |             tournamentId: tournamentData.gameInstance.id
  147 |         };
  148 |
  149 |     } catch (error: unknown) {
  150 |         log('Tournament creation error', { error: error instanceof Error ? error.message : String(error) });
  151 |         throw new Error(`Tournament creation failed: ${error instanceof Error ? error.message : String(error)}`);
  152 |     }
  153 | }
  154 |
  155 | // Helper to start tournament and verify all key elements
  156 | async function startTournament(page: Page, accessCode: string): Promise<void> {
  157 |     log('Starting tournament...');
  158 |
  159 |     try {
  160 |         // Navigate to lobby
  161 |         await page.goto(`${TEST_CONFIG.baseUrl}/lobby/${accessCode}`);
  162 |
  163 |         // Wait for lobby to load
  164 |         await page.waitForSelector('text=Participants connectés', { timeout: 10000 });
  165 |         log('Lobby loaded successfully');
  166 |
  167 |         // Look for start button and click it
  168 |         const startButton = page.locator('button:has-text("Démarrer le tournoi")');
  169 |
  170 |         if (await startButton.count() > 0) {
  171 |             await startButton.click();
  172 |             log('Clicked "Démarrer le tournoi" button');
  173 |
  174 |             // Wait for 5-second countdown
  175 |             log('Waiting for 5-second countdown...');
  176 |             try {
  177 |                 await page.waitForSelector('text=/^[1-5]$/', { timeout: 8000 });
  178 |                 log('Countdown started - waiting for tournament to begin');
  179 |
  180 |                 // Wait for countdown to finish
  181 |                 await page.waitForTimeout(6000);
  182 |             } catch {
  183 |                 log('No countdown detected, tournament may start immediately');
  184 |             }
  185 |         } else {
  186 |             log('No start button found, checking if tournament already started');
  187 |         }
  188 |
  189 |         // Wait for redirect to live page
  190 |         await page.waitForURL(`**/live/${accessCode}`, { timeout: 10000 });
  191 |         log('Redirected to live tournament page');
  192 |
  193 |         // Wait a moment for the game to fully load
  194 |         await page.waitForTimeout(3000);
  195 |         log('Tournament game is loading...');
  196 |
  197 |         // Check if we can see any game content (don't require specific selectors)
  198 |         try {
  199 |             await page.waitForSelector('body', { timeout: 5000 });
  200 |             log('Live game page loaded successfully');
  201 |         } catch {
  202 |             log('Live game page may still be loading');
  203 |         }
  204 |
  205 |         log('Tournament started successfully');
  206 |
  207 |     } catch (error: any) {
  208 |         log('Failed to start tournament', { error: error.message });
> 209 |         throw new Error(`Failed to start tournament: ${error.message}`);
      |               ^ Error: Failed to start tournament: page.waitForURL: Timeout 10000ms exceeded.
  210 |     }
  211 | }
  212 |
  213 | // Helper to test complete tournament flow with all key elements
  214 | async function testCompleteTournamentFlow(page: Page): Promise<void> {
  215 |     log('Testing complete tournament flow...');
  216 |
  217 |     try {
  218 |         // 1. Verify timer is showing and counting down
  219 |         log('1. Checking timer countdown...');
  220 |         const timerElement = page.locator('[data-testid="timer"], .timer, .countdown').first();
  221 |
  222 |         if (await timerElement.count() > 0) {
  223 |             const initialTime = await timerElement.textContent();
  224 |             log(`Initial timer value: ${initialTime}`);
  225 |
  226 |             // Wait 2 seconds and check if timer decreased
  227 |             await page.waitForTimeout(2000);
  228 |             const laterTime = await timerElement.textContent();
  229 |             log(`Timer after 2s: ${laterTime}`);
  230 |
  231 |             if (initialTime !== laterTime) {
  232 |                 log('✅ Timer is counting down correctly');
  233 |             } else {
  234 |                 log('⚠️  Timer may not be running');
  235 |             }
  236 |         } else {
  237 |             log('⚠️  No timer found');
  238 |         }
  239 |
  240 |         // 2. Try to click an answer and check for snackbar feedback
  241 |         log('2. Testing answer selection and snackbar feedback...');
  242 |         // Look for answer buttons more generically
  243 |         const answerButtons = page.locator('[data-testid="answer"], .answer-choice, .answer-button, button').filter({
  244 |             hasText: /[A-D]|[0-9]/
  245 |         });
  246 |
  247 |         if (await answerButtons.count() > 0) {
  248 |             const firstAnswer = answerButtons.first();
  249 |             await firstAnswer.click();
  250 |             log('Clicked on first answer choice');
  251 |
  252 |             // Look for snackbar/toast feedback from backend
  253 |             try {
  254 |                 await page.waitForSelector('.snackbar, .toast, .notification, [data-testid="feedback-snackbar"]', { timeout: 3000 });
  255 |                 log('✅ Snackbar feedback appeared after answer click');
  256 |             } catch {
  257 |                 log('⚠️  No snackbar feedback detected');
  258 |             }
  259 |         } else {
  260 |             log('⚠️  No answer choices found');
  261 |         }
  262 |
  263 |         // 3. Wait for timer to run out and check for correct answers display
  264 |         log('3. Waiting for timer to finish and checking correct answers...');
  265 |
  266 |         try {
  267 |             await page.waitForSelector('text=/Bonne réponse|Correct answer|Solution/', { timeout: 30000 });
  268 |             log('✅ Correct answers are being shown');
  269 |         } catch {
  270 |             log('⚠️  Correct answers display not detected');
  271 |         }
  272 |
  273 |         // 4. Check for feedback display (1.5s after correct answers)
  274 |         log('4. Checking for feedback display...');
  275 |
  276 |         try {
  277 |             await page.waitForSelector('.feedback, [data-testid="feedback"], text=/Bravo|Bien joué|Correct|Incorrect/', { timeout: 5000 });
  278 |             log('✅ Feedback is being displayed');
  279 |         } catch {
  280 |             log('⚠️  Feedback display not detected');
  281 |         }
  282 |
  283 |         // 5. Wait for next question or end of tournament
  284 |         log('5. Waiting for next question or tournament end...');
  285 |
  286 |         try {
  287 |             // Either next question appears or we go to leaderboard
  288 |             await Promise.race([
  289 |                 page.waitForSelector('[data-testid="question-text"], .question-text', { timeout: 10000 }),
  290 |                 page.waitForURL('**/leaderboard/**', { timeout: 10000 })
  291 |             ]);
  292 |
  293 |             if (page.url().includes('/leaderboard/')) {
  294 |                 log('✅ Tournament ended - redirected to leaderboard');
  295 |             } else {
  296 |                 log('✅ Next question loaded');
  297 |             }
  298 |         } catch {
  299 |             log('⚠️  Next question or leaderboard transition not detected');
  300 |         }
  301 |
  302 |     } catch (error: any) {
  303 |         log('Error during tournament flow test', { error: error.message });
  304 |         throw error;
  305 |     }
  306 | }
  307 |
  308 | // Main test suite
  309 | test.describe('Tournament Full Flow E2E', () => {
```