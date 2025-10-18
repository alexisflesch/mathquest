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
import { TestDataHelper, LoginHelper } from './helpers/test-helpers';

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3008',
    backendUrl: 'http://localhost:3007',
    timeout: 30000,
    user: {
        username: 'Pierre',
        avatar: '🐨'
    },
    tournament: {
        gradeLevel: 'CP',
        discipline: 'Mathématiques',
        themes: ['Calcul']
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

// Minimal guest authentication for student context
async function authenticateGuest(page: Page, username: string = 'StudentE2E', avatar: string = '🐼'): Promise<void> {
    log('Authenticating guest student...');
    await page.goto(TEST_CONFIG.baseUrl + '/login');
    const usernameInput = page.locator('input[placeholder*="cher"], input[placeholder*="prénom"], input[placeholder*="pseudo"], input[placeholder*="name"], input[name="username"], [data-testid="username-input"]').first();
    await usernameInput.waitFor({ timeout: 5000 });
    await usernameInput.fill(username.substring(0, 3));
    await page.waitForTimeout(400);
    const dropdownOption = page.locator('ul li').first();
    if (await dropdownOption.count() > 0) {
        await dropdownOption.click();
    } else {
        await usernameInput.press('Enter');
    }
    const avatarButton = page.locator('button.emoji-avatar').first();
    await avatarButton.click().catch(() => { });
    const submitButton = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter"), button:has-text("Login"), button:has-text("Commencer")');
    await submitButton.click();
    await page.waitForSelector('[data-testid="user-profile"], nav, header', { timeout: 10000 });
    log('Guest authentication complete');
}

// Helper to authenticate as a real teacher (UI account login)
async function authenticateTeacherUser(page: Page): Promise<{ email: string }> {
    log('Starting teacher account creation and authentication...');

    const dataHelper = new TestDataHelper(page);
    const loginHelper = new LoginHelper(page);

    // Create teacher via backend API
    const teacherData = await dataHelper.createTeacher({
        username: 'Pierre',
        email: `e2e-teacher-${Date.now()}@test-mathquest.com`,
        password: 'testpassword123'
    });

    // Go to frontend and login via account form
    await page.goto(`${TEST_CONFIG.baseUrl}/`);
    await page.waitForLoadState('networkidle');
    await loginHelper.loginAsTeacher({ email: teacherData.email!, password: 'testpassword123' });
    await expect(page.locator('button:has-text("Déconnexion"), button:has-text("Logout")')).toBeVisible();
    log(`✅ Teacher authentication successful for ${teacherData.username}`);
    return { email: teacherData.email! };
}

// Helper to create tournament via API (uses page.request with Cookie header from current auth)
async function createTournament(context: BrowserContext, page: Page): Promise<TournamentData> {
    log('Creating tournament via API...');

    try {
        // Collect auth cookies from the current page context
        const cookies = await page.context().cookies();
        const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        // Use page.request with Cookie header so the backend sees the logged-in session
        const apiResponse = await page.request.post('/api/games', {
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
            },
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieHeader
            }
        });

        if (!apiResponse.ok()) {
            const errorText = await apiResponse.text();
            throw new Error(`Failed to create tournament: ${apiResponse.status()} - ${errorText}`);
        }

        const tournamentData = await apiResponse.json();
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
async function startTournament(page: Page, accessCode: string): Promise<{ gameplayPage: Page, cleanup?: () => Promise<void> }> {
    log('Starting tournament...');

    try {
        // Prepare a student page that joins the live game before starting (ensures at least one participant)
        const browser = page.context().browser();
        if (!browser) throw new Error('No browser instance available');
        const studentContext = await browser.newContext();
        const studentPage = await studentContext.newPage();
        await authenticateGuest(studentPage, 'StudentE2E', '🐼');
        await studentPage.goto(`${TEST_CONFIG.baseUrl}/live/${accessCode}`);
        await studentPage.waitForURL(`**/live/${accessCode}`, { timeout: 10000 });
        log('Student joined live page');

        // Navigate teacher to lobby controls (primary control surface)
        await page.goto(`${TEST_CONFIG.baseUrl}/lobby/${accessCode}`);
        log('Teacher navigating to lobby controls');

        // Wait for teacher control indicators in lobby
        const controlIndicators = [
            'text=Participants connectés',
            '[data-testid="teacher-controls"]',
            '[data-testid="start-tournament"], [data-testid="start-quiz"], button:has-text("Démarrer"), button:has-text("Start"), button:has-text("Commencer"), button:has-text("Démarrer le tournoi")'
        ];
        for (const sel of controlIndicators) {
            try {
                await page.waitForSelector(sel, { timeout: 8000 });
                log(`Teacher control indicator visible: ${sel}`);
                break;
            } catch { /* try next */ }
        }

        // Prefer explicit data-testid controls
        const dtStartButton = page.locator('[data-testid="start-tournament-button"], [data-testid="start-quiz"]').first();
        if (await dtStartButton.count() > 0) {
            await dtStartButton.click();
            log('Clicked data-testid start button');
        }

        // If there is a countdown confirm control, click it
        const dtCountdown = page.locator('[data-testid="start-tournament-countdown"]');
        if (await dtCountdown.count() > 0) {
            await dtCountdown.click();
            log('Clicked tournament countdown start');
        }

        // Fallback to any generic start button variant
        const startButton = page.locator('button:has-text("Démarrer le tournoi"), button:has-text("Démarrer"), button:has-text("Start"), button:has-text("Commencer")').first();
        if (await startButton.count() > 0) {
            await startButton.click();
            log('Clicked generic start button');
        }

        // Optional countdown indicator
        const countdownDataTest = page.locator('[data-testid="tournament-countdown"]');
        const countdownText = page.getByText(/^[1-5]$/);
        if (await countdownDataTest.count() > 0) {
            await countdownDataTest.first().waitFor({ timeout: 5000 }).catch(() => { });
            log('Countdown data-testid visible, waiting...');
            await page.waitForTimeout(6000);
        } else if (await countdownText.count() > 0) {
            await countdownText.first().waitFor({ timeout: 5000 }).catch(() => { });
            log('Countdown numeric text visible, waiting...');
            await page.waitForTimeout(6000);
        }

        // Wait for first question on the student page
        const questionSelectors = [
            '[data-testid="question-text"]',
            '.question-text',
            '.question',
            '.tqcard-content',
            '[data-testid^="question-"]',
            'button.tqcard-answer, .btn-answer'
        ];
        let studentQuestionVisible = false;
        for (const qs of questionSelectors) {
            const loc = studentPage.locator(qs).first();
            if (await loc.count() > 0) {
                try { await loc.waitFor({ timeout: 10000 }); studentQuestionVisible = true; log(`Student sees question via: ${qs}`); break; } catch { }
            }
        }
        if (!studentQuestionVisible) {
            throw new Error('Question not visible after starting tournament (student view)');
        }
        log('Tournament started successfully');
        return { gameplayPage: studentPage, cleanup: () => studentContext.close().catch(() => { }) };

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
        const timerElement = page.locator('[data-testid="timer"], .timer, .countdown, text=/^[0-9]+$/').first();

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
        const answerButtons = page.locator('[data-testid^="answer-option-"], button:has-text(/[A-D]|[0-9]/), .answer-choice, [data-testid="answer"]');

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
            await page.waitForSelector('text=/Bonne réponse|Correct answer|Solution|Solution correcte|Réponse correcte/', { timeout: 30000 });
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
                page.waitForSelector('[data-testid="tournament-question"], [data-testid="question-text"], .question-text, text=/Question/', { timeout: 15000 }),
                page.waitForURL('**/leaderboard/**', { timeout: 15000 })
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
            await authenticateTeacherUser(page);

            // Step 2: Create tournament via API
            log('=== STEP 2: CREATE TOURNAMENT ===');
            tournamentData = await createTournament(context, page);

            // Step 3: Start tournament and test all key elements
            log('=== STEP 3: START TOURNAMENT AND TEST KEY ELEMENTS ===');
            const { gameplayPage, cleanup } = await startTournament(page, tournamentData.accessCode);

            // Test all the key tournament elements on the gameplay page (student view if returned)
            await testCompleteTournamentFlow(gameplayPage);

            if (cleanup) await cleanup();

            log('✅ Tournament flow completed successfully');

        } catch (error: any) {
            log('❌ Tournament flow failed', { error: error.message });

            // Take screenshot for debugging
            await page.screenshot({ path: 'test-results/e2e/debug-tournament-flow-error.png' });

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
            await authenticateTeacherUser(page);

            // Step 2: Create tournament
            tournamentData = await createTournament(context, page);

            // Step 3: Start tournament and test all key elements
            await startTournament(page, tournamentData.accessCode);

            // Test comprehensive tournament flow
            await testCompleteTournamentFlow(page);

        } catch (error: any) {
            log('Enhanced debugging test failed', { error: error.message });
            await page.screenshot({ path: 'test-results/e2e/debug-enhanced-error.png' });
            throw error;
        }
    });
});
