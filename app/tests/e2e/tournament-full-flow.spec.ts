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
        niveau: 'elementary',
        discipline: 'math',
        themes: ['arithmetic', 'multipliaction']
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
        const usernameInput = page.locator('input[placeholder*="nom"], input[name="username"], input[id="username"], [data-testid="username-input"]');
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

        // Use page.evaluate() to make the request from within the browser context
        // This ensures cookies are sent exactly as a browser would send them
        const tournamentData = await page.evaluate(async (config) => {
            const response = await fetch('/api/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Essential: This ensures cookies are included
                body: JSON.stringify({
                    name: config.username,
                    playMode: 'tournament',
                    gradeLevel: 'elementary',
                    discipline: 'math',
                    themes: ['arithmetic'], // Use only arithmetic since we know it exists
                    nbOfQuestions: 2, // Reduced to match available questions
                    settings: {
                        type: 'direct',
                        avatar: config.avatar,
                        username: config.username
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create tournament: ${response.status} - ${errorText}`);
            }

            return await response.json();
        }, TEST_CONFIG.user);

        log('Tournament created successfully', tournamentData);

        return {
            accessCode: tournamentData.accessCode || tournamentData.code,
            tournamentId: tournamentData.id
        };

    } catch (error: unknown) {
        log('Tournament creation error', { error: error instanceof Error ? error.message : String(error) });
        throw new Error(`Tournament creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Helper to join tournament lobby
async function joinTournamentLobby(page: Page, accessCode: string): Promise<void> {
    log(`Joining tournament lobby with code: ${accessCode}`);

    // Navigate to lobby page (not live yet)
    await page.goto(`${TEST_CONFIG.baseUrl}/lobby/${accessCode}`);

    // Wait for lobby to load
    await page.waitForSelector('[data-testid="lobby"], .lobby', { timeout: 10000 });
    log('Successfully joined tournament lobby');
}

// Helper to start tournament
async function startTournament(page: Page, accessCode: string): Promise<void> {
    log('Starting tournament...');

    try {
        // Look for start button in lobby
        const startButton = page.locator('button:has-text("Démarrer"), button:has-text("Start"), [data-testid="start-tournament"]');

        if (await startButton.count() > 0) {
            await startButton.click();
            log('Clicked start tournament button');
        } else {
            log('No start button found, tournament may already be started');
        }

        // Wait for frontend to redirect from /lobby/[code] to /live/[code]
        await page.waitForURL(`**/live/${accessCode}`, { timeout: 10000 });
        log('Detected frontend redirect to live game page');

        // Wait for first question to appear
        await page.waitForSelector('[data-testid="question-text"], .question-text, .question', { timeout: 15000 });
        log('Tournament started successfully - first question loaded');

    } catch (error) {
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

            // Step 4: Start tournament (then go to /live/[code])
            log('=== STEP 4: START TOURNAMENT ===');
            await startTournament(page, tournamentData.accessCode);

            // Step 5: Play questions and verify feedback/correct answers
            log('=== STEP 5: PLAY QUESTIONS ===');
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
                log(`Browser Console [${msg.type()}]:`, msg.text());
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

            // Step 3: Join with detailed logging
            await page.goto(`${TEST_CONFIG.baseUrl}/live/${tournamentData.accessCode}`);

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

            // Start tournament
            await startTournament(page, tournamentData.accessCode);

            // Enhanced question playing with detailed logging
            await playTournamentWithDetailedLogging(page);

            // Enhanced leaderboard verification
            await verifyLeaderboardRedirection(page, tournamentData.accessCode);

        } catch (error) {
            log('Enhanced debugging test failed', { error: error.message });
            await page.screenshot({ path: 'debug-enhanced-error.png' });
            throw error;
        }
    });
});

// Enhanced question playing function with detailed logging
async function playTournamentWithDetailedLogging(page: Page): Promise<void> {
    log('=== ENHANCED QUESTION PLAYING WITH DETAILED LOGGING ===');

    let questionCount = 0;

    while (questionCount < 3) { // Limited to 3 questions for debugging
        questionCount++;
        log(`=== QUESTION ${questionCount} ===`);

        // Wait for question with detailed timeout
        try {
            await page.waitForSelector('[data-testid="question-text"]', { timeout: 10000 });
        } catch {
            log('Question text not found with data-testid, trying alternative selectors...');
            await page.waitForSelector('.question-text, .question, h2, h3', { timeout: 5000 });
        }

        // Take screenshot before interaction
        await page.screenshot({ path: `debug-question-${questionCount}-before.png` });

        // Log page state
        const gameState = await page.evaluate(() => {
            // @ts-ignore
            return window.gameStateDebug || 'Game state not available';
        });
        log(`Game state for question ${questionCount}:`, gameState);

        // Get question text
        const questionElement = page.locator('[data-testid="question-text"], .question-text, .question').first();
        const questionText = await questionElement.textContent();
        log(`Question text: ${questionText}`);

        // Get and log answer options
        const answerOptions = page.locator('[data-testid*="answer-option"], .answer-option, button[class*="answer"]');
        const answerCount = await answerOptions.count();
        log(`Answer options count: ${answerCount}`);

        for (let i = 0; i < answerCount; i++) {
            const answerText = await answerOptions.nth(i).textContent();
            log(`Answer ${i}: ${answerText}`);
        }

        // Click first answer
        if (answerCount > 0) {
            await answerOptions.first().click();
            log('Clicked first answer option');

            // Take screenshot after click
            await page.screenshot({ path: `debug-question-${questionCount}-after-click.png` });

            // Wait and check for feedback
            await waitAndLog(page, 2000, 'Waiting for feedback...');

            // Check multiple feedback selectors
            const feedbackSelectors = [
                '[data-testid="feedback-overlay"]',
                '.feedback-overlay',
                '.answer-feedback',
                '.feedback',
                '[class*="feedback"]'
            ];

            let feedbackFound = false;
            for (const selector of feedbackSelectors) {
                const feedbackElement = page.locator(selector);
                const count = await feedbackElement.count();
                if (count > 0) {
                    const feedbackText = await feedbackElement.textContent();
                    log(`✅ Feedback found with selector "${selector}": ${feedbackText}`);
                    feedbackFound = true;
                    break;
                }
            }

            if (!feedbackFound) {
                log('❌ No feedback found with any selector');

                // Log all elements that might be feedback
                const allElements = await page.evaluate(() => {
                    const elements = document.querySelectorAll('*');
                    const result = [];
                    elements.forEach(el => {
                        if (el.textContent && (
                            el.textContent.includes('correct') ||
                            el.textContent.includes('incorrect') ||
                            el.textContent.includes('Correct') ||
                            el.textContent.includes('Incorrect') ||
                            el.className.includes('feedback') ||
                            el.className.includes('overlay')
                        )) {
                            result.push({
                                tag: el.tagName,
                                className: el.className,
                                text: el.textContent.substring(0, 100)
                            });
                        }
                    });
                    return result;
                });
                log('Potential feedback elements:', allElements);
            }

            // Wait for correct answers
            await waitAndLog(page, 3000, 'Waiting for correct answers...');

            // Check for correct answer highlighting
            const correctSelectors = [
                '.answer-option.correct',
                '[class*="correct"]',
                '.correct-answer',
                '.correct',
                '[data-correct="true"]'
            ];

            let correctAnswersFound = false;
            for (const selector of correctSelectors) {
                const correctElement = page.locator(selector);
                const count = await correctElement.count();
                if (count > 0) {
                    log(`✅ Correct answers found with selector "${selector}": ${count} elements`);
                    correctAnswersFound = true;
                    break;
                }
            }

            if (!correctAnswersFound) {
                log('❌ No correct answers highlighting found');

                // Log all elements that might show correct answers
                const allElements = await page.evaluate(() => {
                    const elements = document.querySelectorAll('button, .answer-option, [class*="answer"]');
                    const result = [];
                    elements.forEach(el => {
                        result.push({
                            tag: el.tagName,
                            className: el.className,
                            text: el.textContent?.substring(0, 50) || '',
                            style: el.getAttribute('style') || ''
                        });
                    });
                    return result;
                });
                log('All answer elements:', allElements);
            }

            // Take screenshot after feedback/correct answers phase
            await page.screenshot({ path: `debug-question-${questionCount}-after-feedback.png` });

        } else {
            log('No answer options found');
            break;
        }

        // Wait for next question or game end
        await waitAndLog(page, 5000, 'Waiting for next question or game end...');

        // Check for game end
        const gameEndSelectors = [
            '[data-testid="game-finished"]',
            '.game-finished',
            ':has-text("terminé")',
            ':has-text("finished")',
            ':has-text("Jeu terminé")',
            ':has-text("Game finished")'
        ];

        let gameEnded = false;
        for (const selector of gameEndSelectors) {
            const endElement = page.locator(selector);
            const count = await endElement.count();
            if (count > 0) {
                log(`🏁 Game end detected with selector: ${selector}`);
                gameEnded = true;
                break;
            }
        }

        if (gameEnded) {
            break;
        }

        // Check if still have questions
        const stillHasQuestion = await page.locator('[data-testid="question-text"], .question-text').count() > 0;
        if (!stillHasQuestion) {
            log('No more questions detected');
            break;
        }
    }

    log(`Completed ${questionCount} questions with detailed logging`);
}
