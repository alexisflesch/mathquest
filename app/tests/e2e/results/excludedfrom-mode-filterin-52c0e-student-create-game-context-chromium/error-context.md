# Test info

- Name: ExcludedFrom Mode Filtering >> should work correctly in student create game context
- Location: /home/aflesch/mathquest/app/tests/e2e/excludedfrom-mode-filtering.spec.ts:128:9

# Error details

```
Error: page.click: Test timeout of 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="grade-level-dropdown"]')

    at /home/aflesch/mathquest/app/tests/e2e/excludedfrom-mode-filtering.spec.ts:145:20
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
   45 |         console.log('All compatible themes for L2 (no mode):', allCompatibleThemes);
   46 |
   47 |         // Practice mode should have fewer themes than no mode
   48 |         expect(practiceCompatibleThemes.length).toBeLessThan(allCompatibleThemes.length);
   49 |
   50 |         // All themes should include the excluded ones
   51 |         expect(allCompatibleThemes).toContain('Déterminant');
   52 |         expect(allCompatibleThemes).toContain('Espaces préhilbertiens');
   53 |         expect(allCompatibleThemes).toContain('Réduction d\'endomorphismes');
   54 |         expect(allCompatibleThemes).toContain('Séries numériques');
   55 |     });
   56 |
   57 |     test('should filter out questions excluded from tournament mode', async ({ request }) => {
   58 |         // Test with L2 grade level and tournament mode
   59 |         const tournamentResponse = await request.get('/api/questions/filters?gradeLevel=L2&mode=tournament');
   60 |         expect(tournamentResponse.ok()).toBeTruthy();
   61 |
   62 |         const tournamentData = await tournamentResponse.json();
   63 |
   64 |         // Extract compatible themes for tournament mode
   65 |         const tournamentCompatibleThemes = tournamentData.themes
   66 |             .filter(theme => theme.isCompatible)
   67 |             .map(theme => theme.value);
   68 |
   69 |         console.log('Compatible themes for L2 + tournament:', tournamentCompatibleThemes);
   70 |
   71 |         // Should only have "Intégrales généralisées" for L2 tournament mode
   72 |         expect(tournamentCompatibleThemes).toContain('Intégrales généralisées');
   73 |
   74 |         // Should NOT have themes that are excluded from tournament
   75 |         expect(tournamentCompatibleThemes).not.toContain('Déterminant');
   76 |         expect(tournamentCompatibleThemes).not.toContain('Espaces préhilbertiens');
   77 |         expect(tournamentCompatibleThemes).not.toContain('Réduction d\'endomorphismes');
   78 |         expect(tournamentCompatibleThemes).not.toContain('Séries numériques');
   79 |     });
   80 |
   81 |     test('should show all questions when no mode is specified', async ({ request }) => {
   82 |         // Test with L2 grade level and no mode
   83 |         const allResponse = await request.get('/api/questions/filters?gradeLevel=L2');
   84 |         expect(allResponse.ok()).toBeTruthy();
   85 |
   86 |         const allData = await allResponse.json();
   87 |
   88 |         // Extract compatible themes with no mode filtering
   89 |         const allCompatibleThemes = allData.themes
   90 |             .filter(theme => theme.isCompatible)
   91 |             .map(theme => theme.value);
   92 |
   93 |         console.log('All compatible themes for L2 (no mode filtering):', allCompatibleThemes);
   94 |
   95 |         // Should include ALL themes for L2, including those excluded from practice/tournament
   96 |         expect(allCompatibleThemes).toContain('Intégrales généralisées');
   97 |         expect(allCompatibleThemes).toContain('Déterminant');
   98 |         expect(allCompatibleThemes).toContain('Espaces préhilbertiens');
   99 |         expect(allCompatibleThemes).toContain('Réduction d\'endomorphismes');
  100 |         expect(allCompatibleThemes).toContain('Séries numériques');
  101 |
  102 |         // Should have at least 5 themes for L2
  103 |         expect(allCompatibleThemes.length).toBeGreaterThanOrEqual(5);
  104 |     });
  105 |
  106 |     test('should pass mode parameter to backend correctly', async ({ request }) => {
  107 |         // Test that mode parameter is properly forwarded to backend
  108 |
  109 |         // Test practice mode with specific grade level
  110 |         const practiceL2Response = await request.get('/api/questions/filters?gradeLevel=L2&mode=practice');
  111 |         const practiceL2Data = await practiceL2Response.json();
  112 |
  113 |         // Test tournament mode with specific grade level  
  114 |         const tournamentL2Response = await request.get('/api/questions/filters?gradeLevel=L2&mode=tournament');
  115 |         const tournamentL2Data = await tournamentL2Response.json();
  116 |
  117 |         // Both should filter the same way for L2 (since questions are excluded from both modes)
  118 |         const practiceThemes = practiceL2Data.themes.filter(t => t.isCompatible).map(t => t.value);
  119 |         const tournamentThemes = tournamentL2Data.themes.filter(t => t.isCompatible).map(t => t.value);
  120 |
  121 |         // Should be the same themes for both modes in this case
  122 |         expect(practiceThemes.sort()).toEqual(tournamentThemes.sort());
  123 |
  124 |         console.log('Practice themes:', practiceThemes);
  125 |         console.log('Tournament themes:', tournamentThemes);
  126 |     });
  127 |
  128 |     test('should work correctly in student create game context', async ({ page }) => {
  129 |         // Test the actual user workflow that was broken
  130 |
  131 |         // Navigate to student create game with training mode
  132 |         await page.goto('/student/create-game?training=true');
  133 |         await page.waitForLoadState('networkidle');
  134 |
  135 |         // Intercept API calls to verify mode parameter is passed
  136 |         let apiCallMade = false;
  137 |         page.on('request', request => {
  138 |             if (request.url().includes('/api/questions/filters') && request.url().includes('mode=practice')) {
  139 |                 apiCallMade = true;
  140 |                 console.log('✅ API call with practice mode detected:', request.url());
  141 |             }
  142 |         });
  143 |
  144 |         // Select L2 grade level (this should trigger API call with mode=practice)
> 145 |         await page.click('[data-testid="grade-level-dropdown"]');
      |                    ^ Error: page.click: Test timeout of 10000ms exceeded.
  146 |         await page.click('text=L2');
  147 |
  148 |         // Wait for API call
  149 |         await page.waitForTimeout(2000);
  150 |
  151 |         // Verify API call was made with mode parameter
  152 |         expect(apiCallMade).toBe(true);
  153 |
  154 |         // Check that only compatible disciplines are shown
  155 |         await page.click('[data-testid="discipline-dropdown"]');
  156 |
  157 |         // Should only show Mathématiques for L2
  158 |         const disciplineOptions = await page.locator('[data-testid="discipline-dropdown"] option, [data-testid="discipline-dropdown"] [role="option"]').allTextContents();
  159 |
  160 |         expect(disciplineOptions).toContain('Mathématiques');
  161 |         expect(disciplineOptions).not.toContain('Anglais');
  162 |
  163 |         console.log('Available disciplines for L2 practice mode:', disciplineOptions);
  164 |     });
  165 | });
  166 |
  167 | // Backend Integration Test
  168 | test.describe('Backend API Mode Filtering', () => {
  169 |
  170 |     test('should verify backend directly filters by excludedFrom', async ({ request }) => {
  171 |         // Test backend API directly to ensure it handles mode parameter
  172 |         const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3007/api/v1';
  173 |
  174 |         // Test backend with L2 and practice mode
  175 |         const backendResponse = await request.get(`${backendUrl}/questions/filters?gradeLevel=L2&mode=practice`);
  176 |         expect(backendResponse.ok()).toBeTruthy();
  177 |
  178 |         const backendData = await backendResponse.json();
  179 |         console.log('Backend response for L2 + practice:', backendData);
  180 |
  181 |         // Backend should return only themes that are not excluded from practice
  182 |         expect(backendData.themes).toContain('Intégrales généralisées');
  183 |         expect(backendData.themes).not.toContain('Déterminant');
  184 |
  185 |         // Compare with no mode
  186 |         const backendNoModeResponse = await request.get(`${backendUrl}/questions/filters?gradeLevel=L2`);
  187 |         const backendNoModeData = await backendNoModeResponse.json();
  188 |
  189 |         // No mode should have more themes
  190 |         expect(backendNoModeData.themes.length).toBeGreaterThan(backendData.themes.length);
  191 |         expect(backendNoModeData.themes).toContain('Déterminant');
  192 |     });
  193 | });
  194 |
```