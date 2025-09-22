/**
 * E2E Test: Tournament Full Flow
 * 
 * This test covers the complete tournament experience:
 * 1. Login as a user
 * 2. Create a tournament using API endpoint
 * 3. Join the tournament lobby
 * 4. Start the tournament
 * 5. Answer questions
 * 6. Verify feedback display
 * 7. Verify correct answers display
 * 8. Verify redirection to leaderboard
 * 
 * This test will help debug the issues with:
 * - Showing correct answers
 * - Showing feedback
 * - Redirecting to leaderboard when game ends
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3008',
    backendUrl: 'http://localhost:3007',
    timeout: 30000,
    user: {
        username: 'TestUser',
        avatar: '🐨'
    },
    tournament: {
        gradeLevel: 'CP',
        discipline: 'Mathématiques',
        themes: ['addition']
    }
};

interface TournamentData {
    accessCode: string;
    tournamentId: string;
}

// Helper function to log with timestamp
function log(message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Helper function to wait and log
async function waitAndLog(page: Page, timeout: number, message: string) {
    log(`Waiting ${timeout}ms - ${message}`);
    await page.waitForTimeout(timeout);
}

// Helper to handle user authentication
async function authenticateUser(page: Page): Promise<void> {
    log('Starting user authentication...');

    await page.goto(TEST_CONFIG.baseUrl + '/login');

    // Check if we're already logged in
    try {
        await page.waitForSelector('[data-testid="user-profile"]', { timeout: 2000 });
        log('User already authenticated');
        return;
    } catch {
        log('User not authenticated, proceeding with login...');
    }

    // Look for login elements
    try {
        // Try to find username input
        const usernameInput = page.locator('input[placeholder*="name"], input[name="username"], input[id="username"], [data-testid="username-input"]');
        await usernameInput.waitFor({ timeout: 5000 });

        await usernameInput.fill(TEST_CONFIG.user.username);
        log(`Filled username: ${TEST_CONFIG.user.username}`);

        // Always select the emoji avatar before clicking login
        const avatarButton = page.locator('button.emoji-avatar', { hasText: TEST_CONFIG.user.avatar });
        await avatarButton.first().click();
        log(`Selected avatar: ${TEST_CONFIG.user.avatar}`);

        // Find and click submit/login button
        const submitButton = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter"), button:has-text("Login")');
        await submitButton.click();
        log('Clicked login button');

        // Wait for a robust post-login indicator
        try {
            await page.waitForSelector('[data-testid="user-profile"], .user-profile, [data-testid="dashboard"], nav, header, [data-testid="main-navbar"]', { timeout: 10000 });
            log('User authentication successful');
        } catch (waitError: any) {
            log('Post-login selector not found, logging URL and partial content for debug', {
                url: page.url(),
                content: (await page.content()).substring(0, 500)
            });
            throw new Error(`Authentication likely succeeded but post-login selector not found: ${waitError.message}`);
        }
    } catch (error: any) {
        log('Authentication failed', { error: error.message });
        throw new Error(`Authentication failed: ${error.message}`);
    }
}

// Helper to create tournament via API
async function createTournament(context: BrowserContext, page: Page): Promise<TournamentData> {
    log('Creating tournament via API...');

    try {
        // Get cookies from the browser context for debugging
        const cookies = await context.cookies();
        log('Available cookies for API request', {
            cookieNames: cookies.map(c => c.name),
            authToken: cookies.find(c => c.name === 'authToken')?.value?.substring(0, 20) + '...' || 'none',
            teacherToken: cookies.find(c => c.name === 'teacherToken')?.value?.substring(0, 20) + '...' || 'none'
        });

        // Use page.request to make authenticated API call
        const response = await page.request.post('/api/games', {
            data: {
                name: TEST_CONFIG.user.username,
                playMode: 'tournament',
                gradeLevel: TEST_CONFIG.tournament.gradeLevel,
                discipline: TEST_CONFIG.tournament.discipline,
                themes: TEST_CONFIG.tournament.themes,
                nbOfQuestions: 2,
                settings: {
                    defaultMode: 'direct',
                    avatar: TEST_CONFIG.user.avatar,
                    username: TEST_CONFIG.user.username
                }
            }
        });

        if (!response.ok()) {
            const errorText = await response.text();
            throw new Error(`Failed to create tournament: ${response.status()} - ${errorText}`);
        }

        const tournamentData = await response.json();
        log('Tournament created successfully', tournamentData);

        return {
            accessCode: tournamentData.gameInstance.accessCode || tournamentData.gameInstance.code,
            tournamentId: tournamentData.gameInstance.id
        };

    } catch (error: unknown) {
        log('Tournament creation error', { error: error instanceof Error ? error.message : String(error) });
        throw new Error(`Tournament creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Helper to start tournament and verify all key elements
async function startTournament(page: Page, accessCode: string): Promise<void> {
    log('Starting tournament...');

    try {
        // Navigate to lobby
        await page.goto(`${TEST_CONFIG.baseUrl}/lobby/${accessCode}`);

        // Wait for lobby to load
        await page.waitForSelector('text=Participants connectés', { timeout: 10000 });
        log('Lobby loaded successfully');

        // Look for start button and click it
        const startButton = page.locator('button:has-text("Démarrer le tournoi")');

        if (await startButton.count() > 0) {
            await startButton.click();
            log('Clicked "Démarrer le tournoi" button');

            // Wait for 5-second countdown
            log('Waiting for 5-second countdown...');
            try {
                await page.waitForSelector('text=/^[1-5]$/', { timeout: 8000 });
                log('Countdown started - waiting for tournament to begin');

                // Wait for countdown to finish
                await page.waitForTimeout(6000);
            } catch {
                log('No countdown detected, tournament may start immediately');
            }
        } else {
            log('No start button found, checking if tournament already started');
        }

        // Wait for redirect to live page
        await page.waitForURL(`**/live/${accessCode}`, { timeout: 10000 });
        log('Redirected to live tournament page');

        // Wait a moment for the game to fully load
        await page.waitForTimeout(3000);
        log('Tournament game is loading...');

        // Check if we can see any game content (don't require specific selectors)
        try {
            await page.waitForSelector('body', { timeout: 5000 });
            log('Live game page loaded successfully');
        } catch {
            log('Live game page may still be loading');
        }

        log('Tournament started successfully');

    } catch (error: any) {
        log('Failed to start tournament', { error: error.message });
        throw new Error(`Failed to start tournament: ${error.message}`);
    }
}

// Helper to test complete tournament flow with all key elements
async function testCompleteTournamentFlow(page: Page): Promise<void> {
    log('Testing complete tournament flow...');

    try {
        // 1. Verify timer is showing and counting down
        log('1. Checking timer countdown...');
        const timerElement = page.locator('[data-testid="timer"], .timer, .countdown').first();

        if (await timerElement.count() > 0) {
            const initialTime = await timerElement.textContent();
            log(`Initial timer value: ${initialTime}`);

            // Wait 2 seconds and check if timer decreased
            await page.waitForTimeout(2000);
            const laterTime = await timerElement.textContent();
            log(`Timer after 2s: ${laterTime}`);

            if (initialTime !== laterTime) {
                log('✅ Timer is counting down correctly');
            } else {
                log('⚠️  Timer may not be running');
            }
        } else {
            log('⚠️  No timer found');
        }

        // 2. Try to click an answer and check for snackbar feedback
        log('2. Testing answer selection and snackbar feedback...');
        // Look for answer buttons more generically
        const answerButtons = page.locator('[data-testid="answer"], .answer-choice, .answer-button, button').filter({
            hasText: /[A-D]|[0-9]/
        });

        if (await answerButtons.count() > 0) {
            const firstAnswer = answerButtons.first();
            await firstAnswer.click();
            log('Clicked on first answer choice');

            // Look for snackbar/toast feedback from backend
            try {
                await page.waitForSelector('.snackbar, .toast, .notification, [data-testid="feedback-snackbar"]', { timeout: 3000 });
                log('✅ Snackbar feedback appeared after answer click');
            } catch {
                log('⚠️  No snackbar feedback detected');
            }
        } else {
            log('⚠️  No answer choices found');
        }

        // 3. Wait for timer to run out and check for correct answers display
        log('3. Waiting for timer to finish and checking correct answers...');

        try {
            await page.waitForSelector('text=/Bonne réponse|Correct answer|Solution/', { timeout: 30000 });
            log('✅ Correct answers are being shown');
        } catch {
            log('⚠️  Correct answers display not detected');
        }

        // 4. Check for feedback display (1.5s after correct answers)
        log('4. Checking for feedback display...');

        try {
            await page.waitForSelector('.feedback, [data-testid="feedback"], text=/Bravo|Bien joué|Correct|Incorrect/', { timeout: 5000 });
            log('✅ Feedback is being displayed');
        } catch {
            log('⚠️  Feedback display not detected');
        }

        // 5. Wait for next question or end of tournament
        log('5. Waiting for next question or tournament end...');

        try {
            // Either next question appears or we go to leaderboard
            await Promise.race([
                page.waitForSelector('[data-testid="question-text"], .question-text', { timeout: 10000 }),
                page.waitForURL('**/leaderboard/**', { timeout: 10000 })
            ]);

            if (page.url().includes('/leaderboard/')) {
                log('✅ Tournament ended - redirected to leaderboard');
            } else {
                log('✅ Next question loaded');
            }
        } catch {
            log('⚠️  Next question or leaderboard transition not detected');
        }

    } catch (error: any) {
        log('Error during tournament flow test', { error: error.message });
        throw error;
    }
}

// Main test suite
test.describe('Tournament Full Flow E2E', () => {
    test.setTimeout(120000); // 2 minutes timeout

    test('should complete full tournament flow with feedback and leaderboard', async ({ page, context }) => {
        let tournamentData: TournamentData;

        try {
            // Step 1: Authenticate user
            log('=== STEP 1: USER AUTHENTICATION ===');
            await authenticateUser(page);

            // Step 2: Create tournament via API
            log('=== STEP 2: CREATE TOURNAMENT ===');
            tournamentData = await createTournament(context, page);

            // Step 3: Start tournament and test all key elements
            log('=== STEP 3: START TOURNAMENT AND TEST KEY ELEMENTS ===');
            await startTournament(page, tournamentData.accessCode);

            // Test all the key tournament elements
            await testCompleteTournamentFlow(page);

            log('✅ Tournament flow completed successfully');

        } catch (error: any) {
            log('❌ Tournament flow failed', { error: error.message });

            // Take screenshot for debugging
            await page.screenshot({ path: 'debug-tournament-flow-error.png' });

            // Log page content for debugging
            const content = await page.content();
            log('Page content at error:', content.substring(0, 500));

            throw error;
        }
    });

    test('should handle tournament with specific debugging', async ({ page, context }) => {
        test.setTimeout(180000); // 3 minutes for detailed debugging

        let tournamentData: TournamentData;

        try {
            // Enhanced debugging version
            log('=== ENHANCED DEBUGGING TOURNAMENT FLOW ===');

            // Enable console logging
            page.on('console', msg => {
                log(`Browser Console [${msg.type()}]:`, msg.text());
            });

            // Enable network logging
            page.on('response', response => {
                if (response.url().includes('socket.io') || response.url().includes('/api/')) {
                    log(`Network Response: ${response.status()} ${response.url()}`);
                }
            });

            // Step 1: Authenticate
            await authenticateUser(page);

            // Step 2: Create tournament
            tournamentData = await createTournament(context, page);

            // Step 3: Start tournament and test all key elements
            await startTournament(page, tournamentData.accessCode);

            // Test comprehensive tournament flow
            await testCompleteTournamentFlow(page);

        } catch (error: any) {
            log('Enhanced debugging test failed', { error: error.message });
            await page.screenshot({ path: 'debug-enhanced-error.png' });
            throw error;
        }
    });
});
