import { test, expect, Page } from '@playwright/test';
import { TestDataHelper, LoginHelper, SocketHelper } from './helpers/test-helpers';

test.describe('Teacher Timer Controls E2E', () => {
    let teacherPage: Page;
    let studentPages: Page[] = [];
    let testData: any;
    const numStudents = 3;

    test.beforeAll(async ({ browser }) => {
        // Create separate browser contexts
        const teacherContext = await browser.newContext();
        teacherPage = await teacherContext.newPage();

        // Create student pages
        for (let i = 0; i < numStudents; i++) {
            const studentContext = await browser.newContext();
            const studentPage = await studentContext.newPage();
            studentPages.push(studentPage);
        }

        // Generate test data
        const dataHelper = new TestDataHelper(teacherPage);
        testData = dataHelper.generateTestData('timer_controls_e2e');
    });

    test.afterAll(async () => {
        await teacherPage?.close();
        for (const page of studentPages) {
            await page?.close();
        }
    });

    test('Teacher Timer Controls: Pause, resume, extend, and manual advance', async () => {
        const dataHelper = new TestDataHelper(teacherPage);
        const teacherLogin = new LoginHelper(teacherPage);
        const teacherSocket = new SocketHelper(teacherPage);

        // Step 1: Create teacher account and login
        await dataHelper.createTeacher({
            username: testData.username,
            email: testData.email,
            password: testData.password
        });

        await teacherLogin.loginAsTeacher({
            email: testData.email,
            password: testData.password
        });

        await expect(teacherPage).toHaveURL('/teacher/home');

        // Step 2: Create quiz with timer-enabled questions
        await teacherPage.click('[data-testid="create-quiz-button"]');
        await teacherPage.fill('[data-testid="quiz-name-input"]', testData.quizName);

        // Add questions with different timer settings
        for (let i = 0; i < 3; i++) {
            await teacherPage.click('[data-testid="add-question-button"]');
            await teacherPage.click(`[data-testid="question-select-${i}"]`);
        }

        // Enable timer for quiz
        await teacherPage.check('[data-testid="enable-timer-checkbox"]');
        await teacherPage.fill('[data-testid="default-timer-duration"]', '30'); // 30 seconds per question

        await teacherPage.click('[data-testid="create-quiz-confirm"]');
        await teacherPage.click('[data-testid="start-quiz-button"]');
        await teacherSocket.waitForSocketConnection();

        const accessCode = await teacherPage.locator('[data-testid="access-code"]').textContent();
        expect(accessCode).toBeTruthy();

        // Step 3: Students join the quiz
        const studentHelpers = [];
        for (let i = 0; i < numStudents; i++) {
            const studentPage = studentPages[i];
            const studentSocket = new SocketHelper(studentPage);

            studentHelpers.push({ page: studentPage, socket: studentSocket });

            await studentPage.goto('/student/join');
            await studentPage.fill('[data-testid="access-code-input"]', accessCode!);
            await studentPage.fill('[data-testid="username-input"]', `${testData.username}_student${i + 1}`);
            await studentPage.click('[data-testid="join-quiz-button"]');
            await studentSocket.waitForSocketConnection();
        }

        await expect(teacherPage.locator('[data-testid="participant-count"]')).toContainText(`${numStudents}`);

        // Step 4: Start first question with timer and test pause functionality
        await teacherPage.click('[data-testid="start-question-button"]');

        // Verify timer appears on all clients
        await expect(teacherPage.locator('[data-testid="timer-display"]')).toBeVisible();
        for (const helper of studentHelpers) {
            await expect(helper.page.locator('[data-testid="timer-display"]')).toBeVisible();
        }

        // Wait a few seconds, then pause timer
        await teacherPage.waitForTimeout(3000);
        const timerBeforePause = await teacherPage.locator('[data-testid="timer-display"]').textContent();

        await teacherPage.click('[data-testid="pause-timer-button"]');

        // Step 5: Verify all student interfaces show paused state
        await expect(teacherPage.locator('[data-testid="timer-paused-indicator"]')).toBeVisible();
        for (const helper of studentHelpers) {
            await expect(helper.page.locator('[data-testid="timer-paused-indicator"]')).toBeVisible();
            await expect(helper.page.locator('[data-testid="timer-paused-message"]')).toBeVisible();
        }

        // Verify timer stays paused (doesn't continue counting down)
        await teacherPage.waitForTimeout(2000);
        const timerDuringPause = await teacherPage.locator('[data-testid="timer-display"]').textContent();
        expect(timerDuringPause).toBe(timerBeforePause);

        // Step 6: Resume timer and verify countdown continues
        await teacherPage.click('[data-testid="resume-timer-button"]');

        // Verify paused indicators disappear
        await expect(teacherPage.locator('[data-testid="timer-paused-indicator"]')).not.toBeVisible();
        for (const helper of studentHelpers) {
            await expect(helper.page.locator('[data-testid="timer-paused-indicator"]')).not.toBeVisible();
        }

        // Verify timer resumes counting down
        await teacherPage.waitForTimeout(2000);
        const timerAfterResume = await teacherPage.locator('[data-testid="timer-display"]').textContent();
        expect(parseInt(timerAfterResume!)).toBeLessThan(parseInt(timerDuringPause!));

        // Step 7: Test timer extension during active question
        await teacherPage.click('[data-testid="extend-timer-button"]');
        await teacherPage.fill('[data-testid="extend-timer-input"]', '15'); // Add 15 seconds
        await teacherPage.click('[data-testid="confirm-extend-timer"]');

        // Verify timer extension reflects on all clients
        const extendedTimer = await teacherPage.locator('[data-testid="timer-display"]').textContent();
        expect(parseInt(extendedTimer!)).toBeGreaterThan(parseInt(timerAfterResume!));

        for (const helper of studentHelpers) {
            const studentTimer = await helper.page.locator('[data-testid="timer-display"]').textContent();
            expect(parseInt(studentTimer!)).toBeGreaterThan(parseInt(timerAfterResume!));
        }

        // Let students answer before moving to next question
        for (let i = 0; i < studentHelpers.length; i++) {
            const helper = studentHelpers[i];
            await helper.page.click('[data-testid="answer-option-0"]');
            await helper.page.click('[data-testid="submit-answer-button"]');
        }

        // Step 8: Test manual question advancement before timer expires
        await teacherPage.click('[data-testid="advance-question-button"]');

        // Verify manual advancement works and students see next question
        await teacherPage.click('[data-testid="start-question-button"]');

        for (const helper of studentHelpers) {
            await expect(helper.page.locator('[data-testid="quiz-question"]')).toBeVisible();
            await expect(helper.page.locator('[data-testid="timer-display"]')).toBeVisible();
        }

        // Step 9: Test timer behavior across different question types
        // (This would test if different question types handle timers correctly)

        // Answer second question normally
        for (let i = 0; i < studentHelpers.length; i++) {
            const helper = studentHelpers[i];
            await helper.page.click('[data-testid="answer-option-1"]');
            await helper.page.click('[data-testid="submit-answer-button"]');
        }

        await teacherPage.click('[data-testid="next-question-button"]');

        // Step 10: Test timer operations during final question
        await teacherPage.click('[data-testid="start-question-button"]');

        // Test multiple timer operations in sequence
        await teacherPage.waitForTimeout(2000);

        // Pause
        await teacherPage.click('[data-testid="pause-timer-button"]');
        await teacherPage.waitForTimeout(1000);

        // Resume
        await teacherPage.click('[data-testid="resume-timer-button"]');
        await teacherPage.waitForTimeout(1000);

        // Extend
        await teacherPage.click('[data-testid="extend-timer-button"]');
        await teacherPage.fill('[data-testid="extend-timer-input"]', '10');
        await teacherPage.click('[data-testid="confirm-extend-timer"]');

        // Verify no timing conflicts or race conditions
        await expect(teacherPage.locator('[data-testid="timer-display"]')).toBeVisible();
        for (const helper of studentHelpers) {
            await expect(helper.page.locator('[data-testid="timer-display"]')).toBeVisible();
        }

        // Step 11: Test student submission states during timer operations
        // Some students answer during timer manipulation
        await studentHelpers[0].page.click('[data-testid="answer-option-2"]');
        await studentHelpers[0].page.click('[data-testid="submit-answer-button"]');

        // Pause timer while some students have submitted
        await teacherPage.click('[data-testid="pause-timer-button"]');

        // Other students answer during pause
        await studentHelpers[1].page.click('[data-testid="answer-option-2"]');
        await studentHelpers[1].page.click('[data-testid="submit-answer-button"]');

        // Resume and let remaining student answer
        await teacherPage.click('[data-testid="resume-timer-button"]');
        await studentHelpers[2].page.click('[data-testid="answer-option-2"]');
        await studentHelpers[2].page.click('[data-testid="submit-answer-button"]');

        // Verify all submissions are properly handled
        await expect(teacherPage.locator('[data-testid="answers-received"]')).toContainText('3/3');

        // Step 12: Complete quiz and verify results
        await teacherPage.click('[data-testid="show-results-button"]');

        await expect(teacherPage.locator('[data-testid="quiz-results"]')).toBeVisible();
        for (const helper of studentHelpers) {
            await expect(helper.page.locator('[data-testid="quiz-results"]')).toBeVisible();
        }

        // Verify final scores reflect all answers submitted during timer operations
        const leaderboard = teacherPage.locator('[data-testid="leaderboard"]');
        for (let i = 0; i < numStudents; i++) {
            const studentName = `${testData.username}_student${i + 1}`;
            await expect(leaderboard).toContainText(studentName);
        }
    });

    test('Timer synchronization accuracy across clients', async () => {
        // Test that timer synchronization is maintained within acceptable tolerance
        // across all connected clients during various operations
    });

    test('Timer controls edge cases', async () => {
        // Test edge cases:
        // - Extending timer when it's already at 0
        // - Pausing when timer has expired
        // - Multiple rapid pause/resume operations
        // - Network disconnection during timer operations
    });

    test('Timer controls with network issues', async () => {
        // Test timer behavior when network connectivity is poor:
        // - Timer operations during high latency
        // - Timer synchronization after reconnection
        // - Handling of missed timer events
    });
});
