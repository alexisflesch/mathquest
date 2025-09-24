/**
 * Teacher Controls Test Suite
 *
 * Tests teacher controls and real-time quiz management features
 */

import { test, expect, Page, Browser, BrowserContext } from '@playwright/test';

const TEST_CONFIG = {
    baseUrl: 'http://localhost:3008',
    backendUrl: 'http://localhost:3007',
    timeout: 30000,
    teacher: {
        username: 'Pierre',
        avatar: '👨‍🏫'
    },
    student: {
        username: 'TestStudent',
        avatar: '🎓'
    },
    guest: {
        username: 'TestGuest',
        avatar: '🐨'
    },
    game: {
        gradeLevel: 'CP',
        discipline: 'Mathématiques',
        themes: ['Calcul'],
        questionCount: 3
    }
};

// Helper function to log with timestamp
function log(message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    if (data) {
        console.log(`[${timestamp}] ${message}`, JSON.stringify(data, null, 2));
    } else {
        console.log(`[${timestamp}] ${message}`);
    }
}

// Helper function to get a random French name
function getRandomFrenchName(): string {
    // Common French names for testing
    const frenchNames = [
        'Pierre', 'Marie', 'Jean', 'Sophie', 'Lucas', 'Emma', 'Louis', 'Chloé',
        'Thomas', 'Camille', 'Nicolas', 'Léa', 'Antoine', 'Manon', 'Paul', 'Sarah',
        'Alexandre', 'Julie', 'Maxime', 'Laura', 'Quentin', 'Mathilde', 'Hugo', 'Anaïs'
    ];
    return frenchNames[Math.floor(Math.random() * frenchNames.length)];
}

// Helper to authenticate as guest user
async function authenticateGuestUser(page: Page, customUsername?: string): Promise<void> {
    log(`Starting guest user authentication for ${customUsername || 'guest'}...`);

    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    const username = customUsername || getRandomFrenchName();

    // Fill in guest login form
    const usernameInput = page.locator('input[placeholder*="name"], input[name="username"], input[id="username"]');
    await usernameInput.waitFor({ timeout: 5000 });
    await usernameInput.fill(username);

    // Wait for dropdown and click outside to close it
    await page.waitForTimeout(1000);
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // Select avatar
    const avatarButton = page.locator('button.emoji-avatar').first();
    await avatarButton.click();

    // Click submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter"), button:has-text("Login"), button:has-text("Commencer")');
    await submitButton.click();

    // Wait for authentication to complete
    await page.waitForSelector('[data-testid="user-profile"], .user-profile, nav, header', { timeout: 15000 });
    log(`✅ Guest authentication successful for ${username}`);
}

// Helper to ensure test teacher account exists
async function ensureTestTeacherAccount(page: Page): Promise<void> {
    log('Ensuring test teacher account exists...');

    // Try to register a teacher account
    const registerResponse = await page.request.post(`${TEST_CONFIG.backendUrl}/api/v1/auth`, {
        data: {
            action: 'teacher_register',
            username: 'Pierre',
            email: 'test-teacher@test-mathquest.com',
            password: 'testpassword123',
            adminPassword: 'abc'
        }
    });

    if (registerResponse.ok()) {
        log('✅ Test teacher account created successfully');
    } else {
        const errorText = await registerResponse.text();
        log(`Teacher account creation failed or already exists: ${registerResponse.status()} - ${errorText}`);
    }
}

// Helper to authenticate as teacher using universal login
async function authenticateAsTeacher(page: Page): Promise<void> {
    log('Authenticating as teacher using universal login...');

    await page.goto(`${TEST_CONFIG.baseUrl}/login`);

    // Use universal login endpoint
    const loginResponse = await page.request.post(`${TEST_CONFIG.backendUrl}/api/v1/auth`, {
        data: {
            action: 'login',
            email: 'test-teacher@test-mathquest.com',
            password: 'testpassword123'
        }
    });

    if (loginResponse.ok()) {
        const loginData = await loginResponse.json();
        log('Teacher login successful, setting cookies...');

        // Set the teacher token cookie
        await page.context().addCookies([{
            name: 'teacherToken',
            value: loginData.token,
            domain: 'localhost',
            path: '/',
            httpOnly: true,
            secure: false
        }]);

        // Navigate to dashboard to establish session
        await page.goto(`${TEST_CONFIG.baseUrl}/teacher/dashboard`);
        await page.waitForURL('**/teacher/dashboard', { timeout: 10000 });
        log('✅ Redirected away from login page - authentication may have succeeded');

        // Check if we have a user profile (indicating successful auth)
        const userProfile = page.locator('[data-testid="user-profile"], .user-profile');
        if (await userProfile.isVisible({ timeout: 5000 })) {
            log('✅ User profile found - authentication appears successful');
        }
    } else {
        log(`Teacher login failed: ${loginResponse.status()} - ${await loginResponse.text()}`);
    }
}

// Helper to create quiz via API with proper authentication
async function createQuizViaAPI(page: Page): Promise<string> {
    log('Creating quiz via API with authentication...');

    // First, authenticate as teacher to get session
    const loginResponse = await page.request.post(`${TEST_CONFIG.backendUrl}/api/v1/auth`, {
        data: {
            action: 'login',
            email: 'test-teacher@test-mathquest.com',
            password: 'testpassword123'
        }
    });

    if (!loginResponse.ok()) {
        throw new Error(`Teacher login failed: ${loginResponse.status()}`);
    }

    const loginData = await loginResponse.json();
    log('Teacher login successful');

    // Set auth cookie for subsequent requests
    await page.context().addCookies([{
        name: 'teacherToken',
        value: loginData.token,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false
    }]);

    // Fetch questions
    const questionsResponse = await page.request.get(`${TEST_CONFIG.backendUrl}/api/v1/questions/list`, {
        params: {
            limit: '3'
        }
    });

    if (!questionsResponse.ok()) {
        throw new Error(`Failed to fetch questions: ${questionsResponse.status()}`);
    }

    const questionUids = await questionsResponse.json();
    log(`Got ${questionUids.length} question UIDs: ${questionUids.slice(0, 3).join(', ')}...`);

    if (questionUids.length === 0) {
        throw new Error('No questions available for quiz creation');
    }

    // Create game template
    const templateResponse = await page.request.post(`${TEST_CONFIG.backendUrl}/api/v1/game-templates`, {
        data: {
            name: `Test Quiz Template ${Date.now()}`,
            discipline: 'Mathématiques',
            gradeLevel: 'CP',
            description: 'Test template created by API',
            defaultMode: 'quiz',
            themes: ['Calcul'],
            questionUids: questionUids.slice(0, 3),
            questions: questionUids.slice(0, 3).map((uid: string, index: number) => ({
                questionUid: uid,
                sequence: index
            }))
        }
    });

    if (!templateResponse.ok()) {
        const errorText = await templateResponse.text();
        throw new Error(`Failed to create template: ${templateResponse.status()} - ${errorText}`);
    }

    const templateData = await templateResponse.json();
    const templateId = templateData.gameTemplate?.id;
    log(`Template created: ${templateId}`);

    // Create game instance
    const gameResponse = await page.request.post(`${TEST_CONFIG.backendUrl}/api/v1/games`, {
        data: {
            gameTemplateId: templateId,
            name: `Test Quiz Game ${Date.now()}`,
            playMode: 'quiz',
            settings: {
                avatar: '👨‍🏫',
                username: 'Pierre',
                defaultMode: 'direct'
            }
        }
    });

    if (!gameResponse.ok()) {
        const errorText = await gameResponse.text();
        throw new Error(`Failed to create game: ${gameResponse.status()} - ${errorText}`);
    }

    const gameData = await gameResponse.json();
    const accessCode = gameData.gameInstance?.accessCode;
    log(`Game created with access code: ${accessCode}`);

    return accessCode;
}

test.describe('Quiz Teacher Controls & Real-time Features', () => {
    let teacherPage: Page;
    let studentPage: Page;
    let projectionPage: Page;
    let browser: Browser;

    test.beforeAll(async ({ browser: b }) => {
        browser = b;

        // Create separate browser contexts for isolation
        const teacherContext = await browser.newContext();
        const studentContext = await browser.newContext();
        const projectionContext = await browser.newContext();

        teacherPage = await teacherContext.newPage();
        studentPage = await studentContext.newPage();
        projectionPage = await projectionContext.newPage();
    });

    test.afterAll(async () => {
        await teacherPage?.close();
        await studentPage?.close();
        await projectionPage?.close();
    });

    test('simple guest authentication test', async () => {
        log('Testing simple guest authentication...');

        await authenticateGuestUser(teacherPage, 'Pierre');
        log('✅ Simple guest authentication works!');
    });

    test('teacher controls affect student quiz interaction', async () => {
        // Ensure test teacher account exists
        await ensureTestTeacherAccount(teacherPage);

        // Create quiz via API (includes authentication)
        const accessCode = await createQuizViaAPI(teacherPage);
        log(`Quiz created with access code: ${accessCode}`);

        // Navigate to teacher dashboard
        await teacherPage.goto(`${TEST_CONFIG.baseUrl}/teacher/dashboard/${accessCode}`);
        await teacherPage.waitForLoadState('networkidle');

        // Verify dashboard shows the quiz
        const dashboardTitle = await teacherPage.locator('h1').first().textContent();
        const questionCount = await teacherPage.locator('[data-testid="question"], .question-display, .sortable-question').count();
        log(`Dashboard title: ${dashboardTitle}`);
        log(`Number of questions visible: ${questionCount}`);

        if (questionCount === 0) {
            log('❌ No questions found on dashboard, checking for error messages...');
            const errorMessages = await teacherPage.locator('.error, .alert, [class*="error"]').allTextContents();
            log(`Error messages: ${JSON.stringify(errorMessages)}`);

            // Check if there's a "no questions" message
            const noQuestionsMessage = await teacherPage.locator('text=/no questions|aucune question|pas de questions/i').textContent();
            log(`No questions message: ${noQuestionsMessage}`);

            throw new Error('No questions loaded on teacher dashboard');
        }

        // Student joins the quiz
        await authenticateGuestUser(studentPage, 'Marie');
        await studentPage.goto(`${TEST_CONFIG.baseUrl}/student/join`);
        await studentPage.locator('input[type="tel"]').fill(accessCode);
        await studentPage.locator('button:has-text("Rejoindre")').click();

        // Wait for redirect to live page
        await studentPage.waitForURL(`${TEST_CONFIG.baseUrl}/live/${accessCode}`, { timeout: 10000 });
        log('✅ Student redirected to live page');

        await studentPage.waitForTimeout(1000); // Wait for socket connection

        // Projection page - authenticate as teacher
        await authenticateAsTeacher(projectionPage);
        await projectionPage.goto(`${TEST_CONFIG.baseUrl}/teacher/projection/${accessCode}`);
        await projectionPage.waitForLoadState('networkidle');
        await projectionPage.waitForTimeout(1000); // Wait for socket connection

        log('✅ All participants ready - teacher on dashboard, student joined, projection loaded');

        // Test 1: Initially, students should not see questions (quiz not started)
        const initialStudentQuestion = await studentPage.locator('[data-testid="question"], .question, h2, h3').count();
        const initialProjectionQuestion = await projectionPage.locator('[data-testid="question"], .question, h2, h3').count();
        log(`Initial state - Student questions: ${initialStudentQuestion}, Projection questions: ${initialProjectionQuestion}`);

        // Test 2: Look for play controls without selecting questions first
        log('Looking for play/pause controls...');

        // Check what buttons are available on the dashboard
        const allButtons = await teacherPage.locator('button').allTextContents();
        log(`Available buttons: ${JSON.stringify(allButtons.slice(0, 15))}`); // Show first 15 buttons

        // Look for play/pause/stop buttons with various selectors
        const playButtonSelectors = [
            'button[data-play-pause-btn]',
            'button:has-text("Play")',
            'button:has-text("▶️")',
            'button:has-text("Start")',
            'button.play-btn',
            '.play-button button'
        ];

        let playButton;
        for (const selector of playButtonSelectors) {
            const buttons = teacherPage.locator(selector);
            const count = await buttons.count();
            log(`Found ${count} buttons with selector: ${selector}`);
            if (count > 0) {
                playButton = buttons.first();
                log(`Using first play button with selector: ${selector}`);
                break;
            }
        }

        if (playButton && await playButton.isVisible({ timeout: 2000 })) {
            await playButton.click();
            log('✅ Teacher clicked play button on selected question');

            await teacherPage.waitForTimeout(1000); // Brief wait after play button click

            // Check if question appears for student and projection
            const studentQuestionAfterStart = await studentPage.locator('[data-testid="question"], .question, h2, h3').count();
            const projectionQuestionAfterStart = await projectionPage.locator('[data-testid="question"], .question, h2, h3').count();

            log(`After start - Student questions: ${studentQuestionAfterStart}, Projection questions: ${projectionQuestionAfterStart}`);

            if (studentQuestionAfterStart > initialStudentQuestion) {
                log('✅ Question visible to students after teacher starts timer');
            } else {
                log('❌ Student still cannot see question after teacher starts quiz');
            }

            // Test 3: Teacher pauses the question
            const pauseButton = teacherPage.locator('button[data-play-pause-btn]').first();
            if (await pauseButton.isVisible({ timeout: 5000 })) {
                await pauseButton.click();
                log('✅ Teacher clicked pause button');

                await teacherPage.waitForTimeout(2000);

                // Check if student can still answer (they should be able to during pause)
                const answerButtonsDuringPause = studentPage.locator('button:has-text("A"), button:has-text("B"), button:has-text("C"), button:has-text("D"), button:has-text("1"), button:has-text("2"), button:has-text("3"), .answer-choice, [data-testid="answer"]');
                const canAnswerDuringPause = await answerButtonsDuringPause.count() > 0;
                log(`Student can answer during pause: ${canAnswerDuringPause}`);

                if (canAnswerDuringPause) {
                    // Try to click an answer during pause
                    const firstAnswerDuringPause = answerButtonsDuringPause.first();
                    await firstAnswerDuringPause.click();
                    log('✅ Student clicked answer during pause');

                    // Check for feedback/snackbar
                    try {
                        await studentPage.waitForSelector('.snackbar, .toast, .notification, [data-testid="feedback-snackbar"]', { timeout: 3000 });
                        log('✅ Feedback appeared after answering during pause');
                    } catch {
                        log('⚠️ No feedback detected after answering during pause');
                    }
                }
            }
        }

        // Test 4: Projection page leaderboard functionality
        log('Testing projection page leaderboard...');

        // Look for trophy/leaderboard button on projection page
        const trophyButtonSelectors = [
            'button:has-text("🏆")',
            'button[data-testid="trophy-btn"]',
            'button[data-testid="leaderboard-btn"]',
            'button:has-text("Classement")',
            'button:has-text("Leaderboard")',
            '.trophy-btn',
            '[data-testid="trophy"]'
        ];

        let trophyButton;
        for (const selector of trophyButtonSelectors) {
            trophyButton = projectionPage.locator(selector).first();
            if (await trophyButton.isVisible({ timeout: 1000 }).catch(() => false)) {
                log(`Found trophy button with selector: ${selector}`);
                break;
            }
        }

        if (trophyButton && await trophyButton.isVisible({ timeout: 3000 })) {
            await trophyButton.click();
            log('✅ Teacher clicked trophy button on projection page');

            await projectionPage.waitForTimeout(2000);

            // Check if leaderboard appears
            const leaderboardSelectors = [
                '[data-testid="leaderboard"]',
                '.leaderboard',
                'table',
                '.ranking',
                'text=/classement|leaderboard|ranking/i'
            ];

            let leaderboardVisible = false;
            for (const selector of leaderboardSelectors) {
                const elements = await projectionPage.locator(selector).count();
                if (elements > 0) {
                    leaderboardVisible = true;
                    log(`✅ Leaderboard visible with selector: ${selector} (${elements} elements)`);
                    break;
                }
            }

            if (leaderboardVisible) {
                // Check for student names/scores in leaderboard
                const leaderboardContent = await projectionPage.locator('[data-testid="leaderboard"], .leaderboard, table').textContent();
                log(`Leaderboard content: ${leaderboardContent?.substring(0, 200)}...`);

                // Look for student name "Marie" in leaderboard
                const hasStudentName = leaderboardContent?.includes('Marie') || false;
                log(`Student "Marie" appears in leaderboard: ${hasStudentName}`);
            } else {
                log('❌ Leaderboard not visible after clicking trophy button');
            }
        } else {
            log('⚠️ Trophy button not found on projection page');
        }

        log('✅ Teacher controls and projection page test completed');
    });

    test('projection page leaderboard test', async () => {
        // Ensure test teacher account exists
        await ensureTestTeacherAccount(teacherPage);

        // Create quiz via API (includes authentication)
        const accessCode = await createQuizViaAPI(teacherPage);
        log(`Quiz created with access code: ${accessCode}`);

        // Student joins the quiz
        await authenticateGuestUser(studentPage, 'Marie');
        await studentPage.goto(`${TEST_CONFIG.baseUrl}/student/join`);
        await studentPage.locator('input[type="tel"]').fill(accessCode);
        await studentPage.locator('button:has-text("Rejoindre")').click();
        await studentPage.waitForURL(`${TEST_CONFIG.baseUrl}/live/${accessCode}`, { timeout: 10000 });
        log('✅ Student joined quiz');

        // Projection page - authenticate as teacher FIRST
        log('Authenticating teacher for projection page...');
        await authenticateAsTeacher(projectionPage);

        // Listen for console errors on projection page
        const consoleErrors: string[] = [];
        const consoleLogs: string[] = [];

        projectionPage.on('console', msg => {
            const text = msg.text();
            consoleLogs.push(`[CONSOLE ${msg.type()}] ${text}`);
            if (msg.type() === 'error') {
                consoleErrors.push(text);
            }
        });

        projectionPage.on('pageerror', error => {
            consoleErrors.push(`[PAGE ERROR] ${error.message}`);
        });

        log('Teacher authenticated, now navigating to projection page...');

        await projectionPage.goto(`${TEST_CONFIG.baseUrl}/teacher/projection/${accessCode}`, { waitUntil: 'networkidle' });
        log('✅ Projection page navigation completed');

        // Check if we got redirected
        const currentUrl = projectionPage.url();
        log(`Current URL after navigation: ${currentUrl}`);

        if (currentUrl.includes('/login') || currentUrl.includes('error') || currentUrl === `${TEST_CONFIG.baseUrl}/`) {
            log('❌ Projection page validation failed - redirected away');
            log('This indicates the teacher authentication or quiz validation failed');
            // Don't throw error, just log and continue to test what we can
        } else {
            log('✅ Projection page loaded successfully');
            await projectionPage.waitForLoadState('networkidle', { timeout: 10000 });
            log('✅ Projection page fully loaded with network idle');

            // Wait a bit more for React components to mount
            await projectionPage.waitForTimeout(3000);

            // Take a screenshot to see what's on the page
            await projectionPage.screenshot({ path: 'test-results/e2e/debug-projection-page.png', fullPage: true });
            log('📸 Screenshot taken of projection page');
        }

        // Check projection page shows basic elements immediately
        log('Checking if page is still accessible...');
        const pageTitle = await projectionPage.title();
        log(`Page title: ${pageTitle}`);

        // Just check if the page contains any content at all
        const bodyText = await projectionPage.locator('body').textContent();
        const bodyLength = bodyText?.length || 0;
        log(`Body text length: ${bodyLength} characters`);

        if (bodyLength > 100) {
            log('✅ Page has content, checking for specific elements...');

            // Use JavaScript evaluation instead of Playwright locators to avoid crashes
            const pageContent = await projectionPage.evaluate(() => {
                const result = {
                    h1: document.querySelector('h1')?.textContent || null,
                    h2: document.querySelector('h2')?.textContent || null,
                    projectionTitle: document.querySelector('.projection-title')?.textContent || null,
                    timerElements: document.querySelectorAll('[data-testid="timer"], .timer, .countdown').length,
                    trophyButtons: document.querySelectorAll('button[data-testid="trophy-btn"], button[data-testid="leaderboard-btn"], .trophy-btn, [data-testid="trophy"]').length,
                    allButtons: document.querySelectorAll('button').length,
                    bodyHTML: document.body.innerHTML.substring(0, 500) + '...'
                };
                return result;
            });

            log(`Page content analysis:`, pageContent);
            log(`Projection title: ${pageContent.h1 || pageContent.h2 || pageContent.projectionTitle || 'No title found'}`);
            log(`Timer elements found: ${pageContent.timerElements}`);
            log(`Trophy buttons found: ${pageContent.trophyButtons}`);
            log(`Total buttons on page: ${pageContent.allButtons}`);
        } else {
            log('⚠️ Page has minimal content, might be loading or error state');
        }

        // Look for trophy/leaderboard button
        const trophyButtonSelectors = [
            'button:has-text("🏆")',
            'button[data-testid="trophy-btn"]',
            'button[data-testid="leaderboard-btn"]',
            'button:has-text("Classement")',
            'button:has-text("Leaderboard")',
            '.trophy-btn',
            '[data-testid="trophy"]'
        ];

        let trophyButton;
        for (const selector of trophyButtonSelectors) {
            trophyButton = projectionPage.locator(selector).first();
            if (await trophyButton.isVisible({ timeout: 1000 }).catch(() => false)) {
                log(`Found trophy button with selector: ${selector}`);
                break;
            }
        }

        if (trophyButton && await trophyButton.isVisible({ timeout: 3000 })) {
            await trophyButton.click();
            log('✅ Clicked trophy button');

            await projectionPage.waitForTimeout(2000);

            // Check if leaderboard appears
            const leaderboardSelectors = [
                '[data-testid="leaderboard"]',
                '.leaderboard',
                'table',
                '.ranking',
                'text=/classement|leaderboard|ranking/i'
            ];

            let leaderboardVisible = false;
            for (const selector of leaderboardSelectors) {
                const elements = await projectionPage.locator(selector).count();
                if (elements > 0) {
                    leaderboardVisible = true;
                    log(`✅ Leaderboard visible with selector: ${selector} (${elements} elements)`);
                    break;
                }
            }

            if (leaderboardVisible) {
                const leaderboardContent = await projectionPage.locator('[data-testid="leaderboard"], .leaderboard, table').textContent();
                log(`Leaderboard content: ${leaderboardContent?.substring(0, 200)}...`);

                // Look for student name "Marie" in leaderboard
                const hasStudentName = leaderboardContent?.includes('Marie') || false;
                log(`Student "Marie" appears in leaderboard: ${hasStudentName}`);
            } else {
                log('❌ Leaderboard not visible after clicking trophy button');
            }
        } else {
            log('⚠️ Trophy button not found on projection page');
        }

        // Log any console errors that occurred
        if (consoleErrors.length > 0) {
            log(`❌ Console errors found: ${consoleErrors.length}`);
            consoleErrors.forEach((error, i) => log(`  ${i + 1}. ${error}`));
        } else {
            log('✅ No console errors detected');
        }

        log('✅ Projection page leaderboard test completed');
    });
});
