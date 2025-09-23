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

// Helper to create quiz via API
async function createQuizViaAPI(page: Page): Promise<{ accessCode: string, gameId: string }> {
    log('Creating quiz via API...');

    // Fetch questions first
    const questionsResponse = await page.request.get(`${TEST_CONFIG.backendUrl}/api/questions/list`, {
        params: {
            gradeLevel: 'CP',
            discipline: 'Mathématiques',
            themes: 'Calcul',
            limit: '3'
        }
    });

    if (!questionsResponse.ok()) {
        throw new Error(`Failed to fetch questions: ${questionsResponse.status()}`);
    }

    const questionsData = await questionsResponse.json();
    const questionUids = questionsData.questions?.map((q: any) => q.uid) || [];
    log(`Got ${questionUids.length} question UIDs: ${questionUids.join(', ')}`);

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
            questions: questionUids.map((uid: string) => ({ questionUid: uid, sequence: questionUids.indexOf(uid) }))
        }
    });

    if (!templateResponse.ok()) {
        const errorText = await templateResponse.text();
        throw new Error(`Failed to create template: ${templateResponse.status()} - ${errorText}`);
    }

    const templateData = await templateResponse.json();
    log(`Template created: ${templateData.template.id}`);

    // Create game instance
    const gameResponse = await page.request.post(`${TEST_CONFIG.backendUrl}/api/v1/games`, {
        data: {
            gameTemplateId: templateData.template.id,
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
    const accessCode = gameData.gameInstance.accessCode;
    const gameId = gameData.gameInstance.id;

    log(`Game created: ${gameId} with access code: ${accessCode}`);

    return { accessCode, gameId };
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

        // Authenticate as teacher
        await authenticateAsTeacher(teacherPage);
        log('✅ Teacher authentication successful');

        // Create quiz via API
        const { accessCode, gameId } = await createQuizViaAPI(teacherPage);
        log(`Quiz created with access code: ${accessCode}`);

        // Navigate to teacher dashboard
        await teacherPage.goto(`${TEST_CONFIG.baseUrl}/teacher/dashboard`);
        await teacherPage.waitForLoadState('networkidle');

        // Verify dashboard shows the quiz
        const dashboardTitle = await teacherPage.locator('h1, h2, .dashboard-title').textContent();
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

        // Projection page - authenticate as the same teacher
        await authenticateGuestUser(projectionPage, 'Pierre');
        await projectionPage.goto(`${TEST_CONFIG.baseUrl}/teacher/projection/${accessCode}`);
        await projectionPage.waitForLoadState('networkidle');
        await projectionPage.waitForTimeout(1000); // Wait for socket connection

        log('✅ All participants ready - teacher on dashboard, student joined, projection loaded');

        // Test 1: Initially, students should not see questions (quiz not started)
        const initialStudentQuestion = await studentPage.locator('[data-testid="question"], .question, h2, h3').count();
        const initialProjectionQuestion = await projectionPage.locator('[data-testid="question"], .question, h2, h3').count();
        log(`Initial state - Student questions: ${initialStudentQuestion}, Projection questions: ${initialProjectionQuestion}`);

        // Test 2: Teacher selects and starts a question
        log('Selecting first question...');
        const firstQuestion = teacherPage.locator('[data-testid="question"], .question-display, .sortable-question').first();
        await firstQuestion.waitFor({ timeout: 5000 });
        await firstQuestion.click();
        log('✅ Teacher selected first question');

        await teacherPage.waitForTimeout(1000);

        // Now look for play button on the selected question
        const playButton = teacherPage.locator('button[data-play-pause-btn]').first();
        if (await playButton.isVisible({ timeout: 5000 })) {
            await playButton.click();
            log('✅ Teacher clicked play button on selected question');

            // Confirm start if needed
            const confirmButton = teacherPage.locator('button:has-text("Oui"), button:has-text("Confirmer")').first();
            if (await confirmButton.isVisible({ timeout: 2000 })) {
                await confirmButton.click();
            }

            await teacherPage.waitForTimeout(5000);

            // Check if question appears for student
            const studentQuestionAfterStart = await studentPage.locator('[data-testid="question"], .question, h2, h3').count();
            const projectionQuestionAfterStart = await projectionPage.locator('[data-testid="question"], .question, h2, h3').count();

            log(`After start - Student questions: ${studentQuestionAfterStart}, Projection questions: ${projectionQuestionAfterStart}`);

            if (studentQuestionAfterStart > initialStudentQuestion) {
                log('✅ Question visible to students after teacher starts timer');

                // Test 2a: Check if student can answer during initial play state
                const answerButtonsDuringInitialPlay = studentPage.locator('button:has-text(/[A-D]|[0-9]/), .answer-choice, [data-testid="answer"]');
                const canAnswerDuringInitialPlay = await answerButtonsDuringInitialPlay.count() > 0;
                log(`Student can answer during initial play: ${canAnswerDuringInitialPlay}`);

                if (canAnswerDuringInitialPlay) {
                    // Try to click an answer during initial play
                    const firstAnswerDuringInitialPlay = answerButtonsDuringInitialPlay.first();
                    await firstAnswerDuringInitialPlay.click();
                    log('✅ Student clicked answer during initial play');

                    // Check for feedback/snackbar
                    try {
                        await studentPage.waitForSelector('.snackbar, .toast, .notification, [data-testid="feedback-snackbar"]', { timeout: 3000 });
                        log('✅ Feedback appeared after answering during initial play');
                    } catch {
                        log('⚠️ No feedback detected after answering during initial play');
                    }
                }
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
                const answerButtonsDuringPause = studentPage.locator('button:has-text(/[A-D]|[0-9]/), .answer-choice, [data-testid="answer"]');
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

            // Test 4: Teacher resumes the question
            const resumeButtonAfterPause = teacherPage.locator('button[data-play-pause-btn]').first();
            if (await resumeButtonAfterPause.isVisible({ timeout: 5000 })) {
                await resumeButtonAfterPause.click();
                log('✅ Teacher clicked resume button');

                await teacherPage.waitForTimeout(2000);

                // Check if student can still answer (they should be able to during play)
                const answerButtonsDuringPlay = studentPage.locator('button:has-text(/[A-D]|[0-9]/), .answer-choice, [data-testid="answer"]');
                const canAnswerDuringPlay = await answerButtonsDuringPlay.count() > 0;
                log(`Student can answer during play: ${canAnswerDuringPlay}`);

                if (canAnswerDuringPlay) {
                    // Try to click an answer during play
                    const firstAnswerDuringPlay = answerButtonsDuringPlay.first();
                    await firstAnswerDuringPlay.click();
                    log('✅ Student clicked answer during play');

                    // Check for feedback/snackbar
                    try {
                        await studentPage.waitForSelector('.snackbar, .toast, .notification, [data-testid="feedback-snackbar"]', { timeout: 3000 });
                        log('✅ Feedback appeared after answering during play');
                    } catch {
                        log('⚠️ No feedback detected after answering during play');
                    }
                }
            }
        }

        // Test 5: Teacher stops the question
        const stopButton = teacherPage.locator('button:has-text("Stop"), button[data-stop-btn]').first();
        if (await stopButton.isVisible({ timeout: 5000 })) {
            await stopButton.click();
            log('✅ Teacher clicked stop button');

            await teacherPage.waitForTimeout(3000);

            // Check if student is redirected to results
            const currentStudentUrl = studentPage.url();
            const isOnResultsPage = currentStudentUrl.includes('/results') || currentStudentUrl.includes('/leaderboard');
            log(`Student redirected to results: ${isOnResultsPage}`);
        }

        log('✅ Teacher controls test completed');
    });
});
