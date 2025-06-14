/**
 * E2E Test: Tour// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3008',
    backendUrl: 'http://localhost:3007',
    timeout: 30000,
    user: {
        username: 'TestUser',
        avatar: '🐨'
    },
    teacher: {
        username: 'TestTeacher'             log('Tournament started successfully');

    } catch (error: any) {
        log('Failed to start tournament', { error: error.message });
        throw new Error(`Failed to start tournament: ${error.message}`);
    }
}

// Helper to answer questions and verify feedbackament started successfully');

    } catch (error: any) {
        log('Failed to start tournament', { error: error.message });
        throw new Error(`Failed to start tournament: ${error.message}`);
    }
}mail: 'teacher@test.com',
        password: 'TestPassword123!'
    },
    tournament: {
        gradeLevel: 'CP',
        discipline: 'Mathématiques', 
        themes: ['addition']
    }
};w
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

// Helper to handle user authentication as a student
async function authenticateUser(page: Page): Promise<void> {
    log('Starting user authentication...');

    // First, register as a student via API to ensure proper authentication
    const studentData = {
        username: TEST_CONFIG.user.username,
        avatar: TEST_CONFIG.user.avatar,
        role: 'STUDENT'
    };

    const registerResponse = await page.request.post('http://localhost:3007/api/v1/auth/register', {
        data: studentData
    });

    if (!registerResponse.ok()) {
        const errorText = await registerResponse.text();
        log('Failed to register student via API', { error: errorText });
        throw new Error(`Failed to register student: ${registerResponse.status()} - ${errorText}`);
    }

    log('Student registered successfully via API');

    // Navigate to the home page first 
    await page.goto(TEST_CONFIG.baseUrl + '/');

    // Wait a bit for authentication state to be established
    await waitAndLog(page, 2000, 'Waiting for authentication state to be established');

    // Check if we're already logged in by going to the home page
    try {
        await page.waitForSelector('[data-testid="user-profile"], .user-profile, [data-testid="dashboard"], nav, header, [data-testid="main-navbar"]', { timeout: 5000 });
        log('User already authenticated after API registration');
        return;
    } catch {
        log('User not authenticated via API, proceeding with manual login...');
    }

    // If not authenticated, try manual login
    await page.goto(TEST_CONFIG.baseUrl + '/login');

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
            log('User authentication successful via manual login');
        } catch (waitError: any) {
            log('Post-login selector not found, logging URL and partial content for debug', {
                url: page.url(),
                content: (await page.content()).substring(0, 500)
            });
            throw new Error(`Authentication likely succeeded but post-login selector not found: ${waitError.message}`);
        }
    } catch (error: any) {
        log('Manual authentication failed', { error: error.message });
        throw new Error(`Authentication failed: ${error.message}`);
    }
}

// Helper to create tournament via API
async function createTournament(context: BrowserContext, page: Page): Promise<TournamentData> {
    log('Creating tournament via API...');

    try {
        // Use page.request.post() which properly handles authentication cookies
        const response = await page.request.post('http://localhost:3007/api/v1/games', {
            data: {
                name: TEST_CONFIG.user.username,
                playMode: 'tournament',
                gradeLevel: 'CP',
                discipline: 'Mathématiques',
                themes: ['addition'], // Use correct French theme value
                nbOfQuestions: 2, // Reduced to match available questions
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
            accessCode: tournamentData.gameInstance?.accessCode || tournamentData.accessCode || tournamentData.code,
            tournamentId: tournamentData.gameInstance?.id || tournamentData.id
        };

    } catch (error: unknown) {
        log('Tournament creation error', { error: error instanceof Error ? error.message : String(error) });
        throw new Error(`Tournament creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Helper to join tournament lobby
async function joinTournamentLobby(page: Page, accessCode: string): Promise<void> {
    log(`Joining tournament lobby with code: ${accessCode}`);

    // Navigate to lobby page
    await page.goto(`${TEST_CONFIG.baseUrl}/lobby/${accessCode}`);

    // Wait for either lobby elements OR live game elements (tournament may have auto-started)
    try {
        await Promise.race([
            // Wait for lobby
            page.waitForSelector('text=Participants connectés', { timeout: 5000 }),
            // OR wait for live game (tournament already started)
            page.waitForSelector('[data-testid="question-text"], .question-text, .question, .feedback', { timeout: 5000 }),
            // OR wait for URL redirect to live
            page.waitForURL(`**/live/${accessCode}`, { timeout: 5000 })
        ]);

        const currentUrl = page.url();
        if (currentUrl.includes('/live/')) {
            log('Tournament already started - in live game');
        } else {
            log('Successfully joined tournament lobby');
        }
    } catch (error) {
        log('Error detecting lobby or live game state', { error: error.message, url: page.url() });
        throw error;
    }
}

// Helper to start tournament
async function startTournament(page: Page, accessCode: string): Promise<void> {
    log('Starting tournament...');

    // Helper to start tournament and verify all key elements
    async function startTournament(page: Page, accessCode: string): Promise<void> {
        log('Starting tournament...');

        try {
            // First, make sure we're properly in the lobby and the game is joined via socket
            await page.waitForSelector('text=Participants connectés', { timeout: 5000 });
            log('Lobby loaded successfully');

            // Look for start button and click it
            const startButton = page.locator('button:has-text("Démarrer le tournoi")');

            if (await startButton.count() > 0) {
                await startButton.click();
                log('Clicked "Démarrer le tournoi" button');

                // Wait for 5-second countdown (backend sends countdown events)
                log('Waiting for 5-second countdown...');
                try {
                    await page.waitForSelector('text=/^[1-5]$/', { timeout: 8000 });
                    log('Countdown started - waiting for tournament to begin');

                    // Wait for countdown to finish and tournament to start
                    await page.waitForTimeout(6000); // Give full countdown time
                } catch {
                    log('No countdown detected, tournament may start immediately');
                }
            } else {
                log('No start button found, checking if tournament already started');
            }

            // Wait for redirect to live page
            await page.waitForURL(`**/live/${accessCode}`, { timeout: 10000 });
            log('Redirected to live tournament page');

            // Wait for question to appear
            await page.waitForSelector('[data-testid="question-text"], .question-text, .question, text=/Question/', { timeout: 15000 });
            log('First question loaded');

            // Verify timer is running (should show decreasing numbers)
            log('Checking if timer is running...');
            const timerElement = page.locator('[data-testid="timer"], .timer, .countdown, text=/^[0-9]+$/').first();
            if (await timerElement.count() > 0) {
                const initialTime = await timerElement.textContent();
                await page.waitForTimeout(2000);
                const laterTime = await timerElement.textContent();
                log('Timer check', { initialTime, laterTime });

                if (initialTime !== laterTime) {
                    log('✅ Timer is counting down correctly');
                } else {
                    log('⚠️  Timer may not be running');
                }
            }

            log('Tournament started successfully');

        } catch (error: any) {
            log('Failed to start tournament', { error: error.message });
            throw new Error(`Failed to start tournament: ${error.message}`);
        }
    }

    // Helper to answer questions and verify feedback
    async function playTournamentQuestions(page: Page): Promise<void> {
        log('Starting to play tournament questions...');

        let questionCount = 0;
        const maxQuestions = 5; // Safety limit

        while (questionCount < maxQuestions) {
            questionCount++;
            log(`Playing question ${questionCount}`);

            try {
                // Wait for question to load
                await page.waitForSelector('[data-testid="question-text"], .question-text', { timeout: 10000 });

                // Get question text
                const questionText = await page.locator('[data-testid="question-text"], .question-text').first().textContent();
                log(`Question ${questionCount}: ${questionText}`);

                // Get answer options
                const answerOptions = page.locator('[data-testid*="answer-option"], .answer-option, button[class*="answer"]');
                const answerCount = await answerOptions.count();
                log(`Found ${answerCount} answer options`);

                if (answerCount === 0) {
                    log('No answer options found - this might be an issue');
                    // Take screenshot for debugging
                    await page.screenshot({ path: `debug-no-answers-q${questionCount}.png` });
                    break;
                }

                // Click on the first answer option
                await answerOptions.first().click();
                log(`Clicked on first answer option for question ${questionCount}`);

                // Wait a moment for answer to be submitted
                await waitAndLog(page, 1000, 'Waiting after answer submission');

                // Check for feedback overlay or feedback display
                await page.waitForTimeout(2000); // Give time for feedback to appear

                const feedbackOverlay = page.locator('[data-testid="feedback-overlay"], .feedback-overlay, .answer-feedback');
                const hasFeedback = await feedbackOverlay.count() > 0;

                if (hasFeedback) {
                    log(`✅ Feedback displayed for question ${questionCount}`);
                    const feedbackText = await feedbackOverlay.textContent();
                    log(`Feedback content: ${feedbackText}`);
                } else {
                    log(`❌ No feedback displayed for question ${questionCount}`);
                    await page.screenshot({ path: `debug-no-feedback-q${questionCount}.png` });
                }

                // Wait for correct answers phase
                await waitAndLog(page, 3000, 'Waiting for correct answers phase');

                // Check for correct answers highlighting
                const correctAnswers = page.locator('.answer-option.correct, [class*="correct"], .correct-answer');
                const hasCorrectAnswers = await correctAnswers.count() > 0;

                if (hasCorrectAnswers) {
                    log(`✅ Correct answers displayed for question ${questionCount}`);
                    const correctCount = await correctAnswers.count();
                    log(`Found ${correctCount} correct answers highlighted`);
                } else {
                    log(`❌ No correct answers displayed for question ${questionCount}`);
                    await page.screenshot({ path: `debug-no-correct-answers-q${questionCount}.png` });
                }

                // Wait for next question or game end
                await waitAndLog(page, 5000, 'Waiting for next question or game end');

                // Check if game is finished
                const gameFinished = page.locator('[data-testid="game-finished"], .game-finished, :has-text("terminé"), :has-text("finished")');
                const isFinished = await gameFinished.count() > 0;

                if (isFinished) {
                    log('🏁 Game finished detected');
                    break;
                }

                // Check if we have a next question
                const nextQuestion = page.locator('[data-testid="question-text"], .question-text');
                const hasNextQuestion = await nextQuestion.count() > 0;

                if (!hasNextQuestion) {
                    log('No next question found, game might be finished');
                    break;
                }

            } catch (error) {
                log(`Error during question ${questionCount}`, { error: error.message });
                await page.screenshot({ path: `debug-error-q${questionCount}.png` });
                break;
            }
        }

        log(`Completed playing ${questionCount} questions`);
    }

    // Helper to verify leaderboard redirection
    async function verifyLeaderboardRedirection(page: Page, accessCode: string): Promise<void> {
        log('Verifying leaderboard redirection...');

        try {
            // Wait for redirect to leaderboard
            await page.waitForURL(`**/leaderboard/${accessCode}`, { timeout: 10000 });
            log('✅ Successfully redirected to leaderboard');

            // Verify leaderboard content
            await page.waitForSelector('[data-testid="leaderboard"], .leaderboard, .ranking', { timeout: 5000 });
            log('✅ Leaderboard page loaded successfully');

            // Take screenshot of leaderboard
            await page.screenshot({ path: `debug-leaderboard-${accessCode}.png` });

        } catch (error) {
            log('❌ Leaderboard redirection failed', { error: error.message });

            // Check current URL
            const currentUrl = page.url();
            log(`Current URL: ${currentUrl}`);

            // Take screenshot for debugging
            await page.screenshot({ path: `debug-no-leaderboard-redirect.png` });

            throw new Error(`Leaderboard redirection failed: ${error.message}`);
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
            const answerButtons = page.locator('button:has-text(/[A-D]|[0-9]/), .answer-choice, [data-testid="answer"]');

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

            // Wait for timer to reach 0 or question to change
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
                    page.waitForSelector('[data-testid="question-text"], .question-text, text=/Question/', { timeout: 10000 }),
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

    // Main test
    test.describe('Tournament Full Flow E2E', () => {
        test.setTimeout(120000); // 2 minutes timeout

        test('should complete full tournament flow with feedback and leaderboard', async ({ page, context }) => {
            let tournamentData: TournamentData;

            try {
                // Step 1: Authenticate user
                log('=== STEP 1: USER AUTHENTICATION ===');
                await authenticateUser(page);

                // Step 2: Create tournament
                log('=== STEP 2: CREATE TOURNAMENT ===');
                tournamentData = await createTournament(context, page);

                // Step 3: Join tournament lobby (go to /lobby/[code])
                log('=== STEP 3: JOIN TOURNAMENT LOBBY ===');
                await joinTournamentLobby(page, tournamentData.accessCode);

                // Step 4: Start tournament and test all key elements
                log('=== STEP 4: START TOURNAMENT AND TEST KEY ELEMENTS ===');
                await startTournament(page, tournamentData.accessCode);

                // Test all the key tournament elements you mentioned
                await testCompleteTournamentFlow(page);
                await playTournamentQuestions(page);

                // Step 6: Verify leaderboard redirection
                log('=== STEP 6: VERIFY LEADERBOARD REDIRECTION ===');
                await verifyLeaderboardRedirection(page, tournamentData.accessCode);

                log('🎉 Tournament flow completed successfully!');

            } catch (error) {
                log('❌ Tournament flow failed', { error: error.message });

                // Take final debug screenshot
                await page.screenshot({ path: 'debug-tournament-flow-error.png' });

                // Log current page content for debugging
                const pageContent = await page.content();
                log('Page content at error:', pageContent.substring(0, 1000));

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
                    log(`Browser Console [${msg.defaultMode()}]:`, msg.text());
                });

                // Enable network logging for socket events
                page.on('response', response => {
                    if (response.url().includes('socket.io') || response.url().includes('/api/')) {
                        log(`Network Response: ${response.status()} ${response.url()}`);
                    }
                });

                // Step 1: Authenticate
                await authenticateUser(page);

                // Step 2: Create tournament
                tournamentData = await createTournament(context, page);

                // Step 3: Join tournament lobby first
                await page.goto(`${TEST_CONFIG.baseUrl}/lobby/${tournamentData.accessCode}`);

                // Wait for lobby to load - look for specific lobby elements
                await page.waitForSelector('text=Participants connectés', { timeout: 10000 });
                log('Successfully joined tournament lobby');

                // Wait for socket connection
                await waitAndLog(page, 3000, 'Waiting for socket connection');

                // Check socket connection status
                const socketStatus = await page.evaluate(() => {
                    // @ts-ignore
                    return window.socketDebug || 'Socket debug info not available';
                });
                log('Socket status:', socketStatus);

                // Take screenshot of initial state
                await page.screenshot({ path: 'debug-initial-lobby.png' });

                // Start tournament and test all key elements
                await startTournament(page, tournamentData.accessCode);

                // Test comprehensive tournament flow
                await testCompleteTournamentFlow(page);

                // Enhanced leaderboard verification
                await verifyLeaderboardRedirection(page, tournamentData.accessCode);

            } catch (error: any) {
                log('Enhanced debugging test failed', { error: error.message });
                await page.screenshot({ path: 'debug-enhanced-error.png' });
                throw error;
            }
        });
    });
}
