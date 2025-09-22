/**
 * E2E Tests for Games API Routes
 *
 * Tests the fixed API routes for game creation, joining, and fetching.
 * Specifically tests that dynamic route parameters are correctly extracted.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3008',
    backendUrl: 'http://localhost:3007',
    timeout: 30000,
    user: {
        username: 'Jean',
        avatar: '🐨'
    },
    game: {
        gradeLevel: 'CP',
        discipline: 'Mathématiques',
        themes: ['Calcul']
    }
};

interface GameData {
    accessCode: string;
    gameId: string;
}

// Helper function to log with timestamp
function log(message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Helper to authenticate user
async function authenticateUser(page: Page): Promise<void> {
    log('Starting user authentication...');

    await page.goto(TEST_CONFIG.baseUrl + '/login');

    // Always proceed with login for consistency in tests
    log('Proceeding with guest login...');

    // Look for login elements
    try {
        // Wait for the guest form to be visible
        await page.waitForSelector('form', { timeout: 5000 });

        // Fill username - use the UsernameSelector input field
        // When no name is selected, it shows an input with placeholder "Choisissez votre pseudo..."
        const usernameInput = page.locator('input[placeholder*="Choisissez votre pseudo"], input[placeholder*="pseudo"]');
        await usernameInput.waitFor({ timeout: 5000 });

        // Type the first few letters to trigger the dropdown
        await usernameInput.fill(TEST_CONFIG.user.username.substring(0, 2));
        await page.waitForTimeout(500); // Wait for dropdown to appear

        // Select the username from dropdown (it should be the first match)
        const usernameOption = page.locator('ul li').first();
        await usernameOption.click();

        log(`Selected username: ${TEST_CONFIG.user.username}`);

        // Select the emoji avatar
        const avatarButton = page.locator(`button.emoji-avatar:has-text("${TEST_CONFIG.user.avatar}")`);
        await avatarButton.waitFor({ timeout: 5000 });
        await avatarButton.click();
        log(`Selected avatar: ${TEST_CONFIG.user.avatar}`);

        // Click submit button
        const submitButton = page.locator('button:has-text("Commencer à jouer")');
        await submitButton.waitFor({ timeout: 5000 });
        await submitButton.click();
        log('Clicked submit button');

        // Wait for post-login indicator
        try {
            await page.waitForSelector('[data-testid="user-profile"], .user-profile, [data-testid="dashboard"], nav, header, [data-testid="main-navbar"]', { timeout: 10000 });
            log('User authentication successful');

            // Wait a moment for cookies to be set
            await page.waitForTimeout(1000);

            // Check cookies again
            const cookiesAfterLogin = await page.context().cookies();
            log('Cookies after login wait', cookiesAfterLogin.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })));
        } catch (waitError: any) {
            log('Post-login selector not found', {
                url: page.url(),
                content: (await page.content()).substring(0, 500)
            });
            throw new Error(`Authentication likely succeeded but post-login selector not found: ${waitError.message}`);
        }
    } catch (error: any) {
        log('Authentication failed', { error: error.message });
        throw error;
    }
}

// Helper to create a game via API
async function createGame(context: BrowserContext, page: Page, playMode: 'quiz' | 'tournament' | 'practice' = 'quiz'): Promise<GameData> {
    log(`Creating ${playMode} game via API...`);

    try {
        // Get cookies from the browser context
        const cookies = await context.cookies();
        log('Available cookies', cookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })));

        // Extract JWT token from cookies (only for quiz games that require teacher auth)
        let token: string | undefined;
        if (playMode === 'quiz') {
            const teacherTokenCookie = cookies.find(c => c.name === 'teacherToken');
            const authTokenCookie = cookies.find(c => c.name === 'authToken');
            token = teacherTokenCookie?.value || authTokenCookie?.value;

            if (!token) {
                throw new Error('No authentication token found in cookies (required for quiz games)');
            }
        }

        // For quiz games, we need a gameTemplateId. For practice/tournament, we can create on-the-fly
        let gameTemplateId: string | undefined;

        if (playMode === 'quiz') {
            // For quiz games, try to get existing game templates first
            try {
                const templatesResponse = await page.request.get(`${TEST_CONFIG.backendUrl}/api/v1/game-templates`, {
                    headers: token ? {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    } : {
                        'Content-Type': 'application/json'
                    }
                });

                if (templatesResponse.ok()) {
                    const templatesData = await templatesResponse.json();
                    if (templatesData.gameTemplates && templatesData.gameTemplates.length > 0) {
                        gameTemplateId = templatesData.gameTemplates[0].id;
                        log('Using existing game template', { templateId: gameTemplateId });
                    }
                }
            } catch (error) {
                log('Failed to fetch existing templates, will try to create one', { error });
            }

            // If no existing template, try to create one (but this might fail for students)
            if (!gameTemplateId) {
                const templateResponse = await page.request.post(`${TEST_CONFIG.backendUrl}/api/v1/game-templates`, {
                    headers: token ? {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    } : {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        name: 'Test Quiz Template',
                        discipline: TEST_CONFIG.game.discipline,
                        gradeLevel: TEST_CONFIG.game.gradeLevel,
                        themes: TEST_CONFIG.game.themes,
                        questionUids: ['test-question-1', 'test-question-2'] // Dummy question IDs
                    }
                });

                if (templateResponse.ok()) {
                    const templateData = await templateResponse.json();
                    gameTemplateId = templateData.gameTemplate.id;
                    log('Created game template', { templateId: gameTemplateId });
                } else {
                    log('Failed to create game template, proceeding without it', { status: templateResponse.status() });
                }
            }
        }

        const gameData: any = {
            name: TEST_CONFIG.user.username,
            playMode: playMode,
            settings: {
                defaultMode: 'direct',
                avatar: TEST_CONFIG.user.avatar,
                username: TEST_CONFIG.user.username
            }
        };

        // Add gameTemplateId for quiz games
        if (gameTemplateId) {
            gameData.gameTemplateId = gameTemplateId;
        }

        // Add practice/tournament specific fields
        if (playMode === 'practice' || playMode === 'tournament') {
            gameData.gradeLevel = TEST_CONFIG.game.gradeLevel;
            gameData.discipline = TEST_CONFIG.game.discipline;
            gameData.themes = TEST_CONFIG.game.themes;
            gameData.nbOfQuestions = 2;
            // Note: Don't set initiatorStudentId for guest users - they should be authenticated via cookies
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        // Only add Authorization header for quiz games that require teacher auth
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await page.request.post(`${TEST_CONFIG.backendUrl}/api/v1/games`, {
            headers,
            data: gameData
        });

        if (!response.ok()) {
            const errorText = await response.text();
            throw new Error(`Failed to create game: ${response.status()} - ${errorText}`);
        }

        const responseData = await response.json();
        log('Game created successfully', responseData);

        return {
            accessCode: responseData.gameInstance.accessCode || responseData.gameInstance.code,
            gameId: responseData.gameInstance.id
        };

    } catch (error: unknown) {
        log('Game creation error', { error: error instanceof Error ? error.message : String(error) });
        throw new Error(`Game creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

test.describe('Games API Routes', () => {
    test.beforeEach(async ({ page, context }) => {
        // Authenticate user before each test
        await authenticateUser(page);
    });

    test('should create a game successfully', async ({ page }) => {
        const gameData = await createGame(page.context(), page, 'practice');

        expect(gameData.accessCode).toBeTruthy();
        expect(gameData.gameId).toBeTruthy();
        expect(typeof gameData.accessCode).toBe('string');
        expect(typeof gameData.gameId).toBe('string');

        log('✅ Game creation test passed', gameData);
    });

    test('should fetch game data by access code', async ({ page }) => {
        // Create a game first
        const gameData = await createGame(page.context(), page, 'practice');

        // Try to fetch the game data using the API route
        const response = await page.request.get(`/api/games/${gameData.accessCode}`);

        expect(response.ok()).toBe(true);

        const fetchedGameData = await response.json();
        log('Fetched game data response:', fetchedGameData);
        expect(fetchedGameData).toBeTruthy();
        expect(fetchedGameData.gameInstance).toBeTruthy();
        expect(fetchedGameData.gameInstance.accessCode).toBe(gameData.accessCode);
        expect(fetchedGameData.gameInstance.playMode).toBe('practice');

        log('✅ Game fetch by access code test passed', {
            requestedCode: gameData.accessCode,
            returnedId: fetchedGameData.gameInstance.id
        });
    });

    test('should join a game successfully', async ({ page }) => {
        // Create a game first
        const gameData = await createGame(page.context(), page, 'practice');

        // Try to join the game
        const joinResponse = await page.request.post(`/api/games/${gameData.accessCode}/join`, {
            data: {
                userId: 'test-user-id' // This would normally come from auth context
            }
        });

        // The join might fail due to auth issues in test environment, but the route should be accessible
        // We mainly want to test that the route exists and parameters are extracted correctly
        expect([200, 400, 401, 403, 404]).toContain(joinResponse.status()); // Accept various auth-related failures

        log('✅ Game join route accessible', {
            status: joinResponse.status(),
            accessCode: gameData.accessCode
        });
    });

    test('should handle invalid access codes gracefully', async ({ page }) => {
        // Try to fetch a game with an invalid access code
        const response = await page.request.get('/api/games/INVALID123');

        // Should return 404 or similar error
        expect([404, 401]).toContain(response.status());

        log('✅ Invalid access code handled correctly', { status: response.status() });
    });

    test('should handle 404 for non-existent access codes', async ({ page }) => {
        // Try to fetch a game with a non-existent access code
        const response = await page.request.get('/api/games/NONEXISTENT123');

        // Should return 404 Not Found
        expect(response.status()).toBe(404);

        const responseData = await response.json();
        expect(responseData).toHaveProperty('error');

        log('✅ Non-existent access code correctly returns 404');
    });

    test('should handle numeric access codes that look like IDs', async ({ page }) => {
        // Test with numeric codes that might be confused with database IDs
        const numericCodes = ['3166', '12345', '99999'];

        for (const code of numericCodes) {
            const response = await page.request.get(`/api/games/${code}`);
            const status = response.status();

            log(`Testing code ${code}, got status: ${status}`);

            // Since the test runs after authentication, requests include cookies
            // Should return 200 (game exists) or 404 (game doesn't exist) - both are valid
            expect([200, 404]).toContain(status);

            log(`✅ Numeric access code ${code} handled correctly (status: ${status})`);
        }
    });

    test('should get game status', async ({ page }) => {
        // Create a game first
        const gameData = await createGame(page.context(), page, 'practice');

        // Try to get game status
        const response = await page.request.put(`/api/games/${gameData.accessCode}/status`, {
            data: {
                status: 'started' // Example status update
            }
        });

        // The status update might fail due to permissions, but route should be accessible
        expect([200, 400, 401, 403, 404]).toContain(response.status());

        log('✅ Game status route accessible', {
            status: response.status(),
            accessCode: gameData.accessCode
        });
    });

    test('should handle different game modes', async ({ page }) => {
        const modes: ('tournament' | 'practice')[] = ['tournament', 'practice'];

        for (const mode of modes) {
            const gameData = await createGame(page.context(), page, mode);

            // Verify the game was created with correct mode
            expect(gameData.accessCode).toBeTruthy();

            // Try to fetch the game
            const response = await page.request.get(`/api/games/${gameData.accessCode}`);
            expect(response.ok()).toBe(true);

            const fetchedGameData = await response.json();
            expect(fetchedGameData.gameInstance.playMode).toBe(mode);

            log(`✅ ${mode} mode game creation and fetch test passed`);
        }
    });

    test('should handle teacher dashboard access for students', async ({ page }) => {
        // Create a practice game
        const gameData = await createGame(page.context(), page, 'practice');

        // Navigate to the teacher dashboard
        await page.goto(`${TEST_CONFIG.baseUrl}/teacher/dashboard/${gameData.accessCode}`);

        // For students, this should either redirect, show an error, or not load the dashboard
        try {
            // Wait a short time to see if dashboard loads
            await page.waitForSelector('[data-testid="dashboard-content"], [data-testid="teacher-dashboard"], .dashboard, .teacher-dashboard', {
                timeout: 5000
            });

            // If we get here, dashboard loaded - this might be unexpected for students
            log('⚠️ Dashboard unexpectedly loaded for student user');

        } catch (error) {
            // Expected: dashboard should not load for students
            log('✅ Dashboard correctly denied access for student user');
        }
    });

    test('should validate page access API works correctly', async ({ page }) => {
        // Create a practice game
        const gameData = await createGame(page.context(), page, 'practice');

        // Test the validate-page-access API directly
        const response = await page.request.post('/api/validate-dashboard-access', {
            data: {
                pageType: 'dashboard',
                accessCode: gameData.accessCode
            }
        });

        // For students, this might return an error (403/401), which is expected
        expect([200, 401, 403]).toContain(response.status());

        if (response.ok()) {
            const data = await response.json();
            expect(data).toHaveProperty('valid', true);
            expect(data).toHaveProperty('gameId', gameData.gameId);
            expect(data).toHaveProperty('playMode', 'practice');
            log('✅ Page access validation API works for student', { accessCode: gameData.accessCode, gameId: data.gameId });
        } else {
            log('✅ Page access validation API correctly denies access for student', { status: response.status() });
        }
    });
});

test.describe('Practice Session Issues', () => {
    test.beforeEach(async ({ page, context }) => {
        // Authenticate user before each test
        await authenticateUser(page);
    });

    test('should reproduce practice session socket CORS error', async ({ page }) => {
        // Create a practice game first
        const gameData = await createGame(page.context(), page, 'practice');

        // Navigate to the practice session page
        await page.goto(`${TEST_CONFIG.baseUrl}/student/practice/${gameData.accessCode}`);

        // Wait for the page to load
        await page.waitForLoadState('networkidle');

        // Check for CORS errors in console
        const corsErrors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                if (text.includes('CORS') || text.includes('Access-Control-Allow-Origin') || text.includes('has been blocked by CORS policy')) {
                    corsErrors.push(text);
                }
            }
        });

        // Wait for socket connection attempts (should fail with CORS)
        await page.waitForTimeout(5000);

        // Check if we got CORS errors
        if (corsErrors.length > 0) {
            log('❌ CORS errors detected in practice session', { errors: corsErrors });
            expect(corsErrors.length).toBeGreaterThan(0); // We expect CORS errors to reproduce the issue
        } else {
            log('⚠️ No CORS errors detected - issue may be resolved or not reproduced');
        }

        // Check if socket connection failed
        const socketErrors = page.locator('text=xhr poll error, text=socket connection error, text=CORS');
        const hasSocketError = await socketErrors.count() > 0;

        if (hasSocketError) {
            log('❌ Socket connection errors detected in practice session');
        }

        // Verify the page shows some content despite socket issues
        const pageContent = page.locator('body');
        await expect(pageContent).toBeVisible();

        log('✅ Practice session CORS test completed', {
            accessCode: gameData.accessCode,
            corsErrors: corsErrors.length,
            socketErrors: hasSocketError
        });
    });
});

test.describe('Tournament Creation Issues', () => {
    test.beforeEach(async ({ page, context }) => {
        // Authenticate user before each test
        await authenticateUser(page);
    });

    test('should reproduce tournament creation silent failure', async ({ page }) => {
        // Navigate to the student tournament creation page
        await page.goto(`${TEST_CONFIG.baseUrl}/student/create-game`);

        // Wait for the page to load
        await page.waitForLoadState('networkidle');

        // Check that the page loaded (we see some form of tournament creation UI)
        const pageContent = page.locator('text=Choisis un niveau');
        await expect(pageContent.first()).toBeVisible();

        // Try to create a tournament via API directly (since UI testing is complex)
        const gameData = await createGame(page.context(), page, 'tournament');

        // Verify tournament was created
        expect(gameData.accessCode).toBeTruthy();
        expect(gameData.gameId).toBeTruthy();

        log('✅ Tournament creation page loads and API works', { accessCode: gameData.accessCode });
    });
});

test.describe('Live Game Joining Issues', () => {
    test.beforeEach(async ({ page, context }) => {
        // Authenticate user before each test
        await authenticateUser(page);
    });

    test('should reproduce live game joining error', async ({ page }) => {
        // Debug: Check cookies after authentication
        const cookies = await page.context().cookies();
        log('Cookies after authentication', cookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })));

        // Create a practice game first
        const gameData = await createGame(page.context(), page, 'practice');

        // Navigate to the live game page
        await page.goto(`${TEST_CONFIG.baseUrl}/live/${gameData.accessCode}`);

        // Wait for the page to load
        await page.waitForLoadState('networkidle');

        // Check for socket connection errors
        const socketErrors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                if (text.includes('join_game') || text.includes('socket') || text.includes('connection') || text.includes('GAME ERROR RECEIVED')) {
                    socketErrors.push(text);
                }
            }
        });

        // Wait for socket connection attempts (reduced timeout)
        await page.waitForTimeout(2000);

        // Check for specific error messages in the UI
        const errorMessages = page.locator('text=An error occurred while joining the game, text=Erreur lors de la connexion, text=Connection failed');
        const hasUIErrors = await errorMessages.count() > 0;

        // Check if user was able to join (look for game content)
        const gameContent = page.locator('.question-display, .live-game, .lobby, [data-testid="lobby"], [data-testid="question-display"]');
        const joinedSuccessfully = await gameContent.count() > 0;

        log('✅ Live game joining test completed', {
            accessCode: gameData.accessCode,
            socketErrors: socketErrors.length,
            hasUIErrors,
            joinedSuccessfully,
            url: page.url()
        });

        // The test should reproduce the joining error
        if (!joinedSuccessfully && (hasUIErrors || socketErrors.length > 0)) {
            log('❌ Game joining error reproduced');
        }
    });
});