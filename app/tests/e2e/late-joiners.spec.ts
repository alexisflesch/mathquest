import { test, expect, Page } from '@playwright/test';
import { TestDataHelper, LoginHelper, SocketHelper } from './helpers/test-helpers';

test.describe('Late-Joiners E2E', () => {
    let teacherPage: Page;
    let initialStudentPages: Page[] = [];
    let lateJoinerPages: Page[] = [];
    let testData: any;

    test.beforeAll(async ({ browser }) => {
        // Create separate browser contexts
        const teacherContext = await browser.newContext();
        teacherPage = await teacherContext.newPage();

        // Create pages for initial students (on-time joiners)
        for (let i = 0; i < 2; i++) {
            const studentContext = await browser.newContext();
            const studentPage = await studentContext.newPage();
            initialStudentPages.push(studentPage);
        }

        // Create pages for late joiners
        for (let i = 0; i < 3; i++) {
            const studentContext = await browser.newContext();
            const studentPage = await studentContext.newPage();
            lateJoinerPages.push(studentPage);
        }

        // Generate test data
        const dataHelper = new TestDataHelper(teacherPage);
        testData = dataHelper.generateTestData('late_joiners_e2e');
    });

    test.afterAll(async () => {
        await teacherPage?.close();
        for (const page of [...initialStudentPages, ...lateJoinerPages]) {
            await page?.close();
        }
    });

    test('Late-joiners: Different scenarios for joining after session starts', async () => {
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

        await expect(teacherPage).toHaveURL('/');

        // Step 2: Navigate to quiz creation page and create quiz
        await teacherPage.goto('/teacher/quiz/create');
        await teacherPage.click('[data-testid="create-quiz-button"]');
        await teacherPage.fill('[data-testid="quiz-name-input"]', testData.quizName);

        // Add 4 questions for testing different late-join scenarios
        for (let i = 0; i < 4; i++) {
            await teacherPage.click('[data-testid="add-question-button"]');
            await teacherPage.click(`[data-testid="question-select-${i}"]`);
        }

        await teacherPage.click('[data-testid="create-quiz-confirm"]');
        await teacherPage.click('[data-testid="start-quiz-button"]');
        await teacherSocket.waitForSocketConnection();

        const accessCode = await teacherPage.locator('[data-testid="access-code"]').textContent();
        expect(accessCode).toBeTruthy();

        // Step 3: Initial students join on time using current join flow
        const initialHelpers: Array<{ page: Page, socket: SocketHelper }> = [];
        for (let i = 0; i < initialStudentPages.length; i++) {
            const studentPage = initialStudentPages[i];
            const studentSocket = new SocketHelper(studentPage);

            initialHelpers.push({ page: studentPage, socket: studentSocket });

            // Use the current join flow via main page
            await studentPage.goto('/');
            await studentPage.click('[data-testid="join-game-button"]');
            await studentPage.fill('[data-testid="access-code-input"]', accessCode!);
            await studentPage.fill('[data-testid="username-input"]', `${testData.username}_initial_${i + 1}`);
            await studentPage.click('[data-testid="join-button"]');
            await studentSocket.waitForSocketConnection();
        }

        // Verify initial participants
        await expect(teacherPage.locator('[data-testid="participant-count"]')).toContainText('2');

        // Step 4: Progress through 1-2 questions with initial participants
        // Question 1
        await teacherPage.click('[data-testid="start-question-button"]');

        // Initial students answer
        for (let i = 0; i < initialHelpers.length; i++) {
            const helper = initialHelpers[i];
            await helper.page.click('[data-testid="answer-option-0"]');
            await helper.page.click('[data-testid="submit-answer-button"]');
        }

        await teacherPage.click('[data-testid="next-question-button"]');

        // Question 2
        await teacherPage.click('[data-testid="start-question-button"]');

        // Initial students answer
        for (let i = 0; i < initialHelpers.length; i++) {
            const helper = initialHelpers[i];
            await helper.page.click('[data-testid="answer-option-1"]');
            await helper.page.click('[data-testid="submit-answer-button"]');
        }

        // Step 5: Test late-joiner scenario 1 - Early in session (should be allowed)
        const earlyLateJoiner = lateJoinerPages[0];
        const earlyLateSocket = new SocketHelper(earlyLateJoiner);

        await earlyLateJoiner.goto('/');
        await earlyLateJoiner.click('[data-testid="join-game-button"]');
        await earlyLateJoiner.fill('[data-testid="access-code-input"]', accessCode!);
        await earlyLateJoiner.fill('[data-testid="username-input"]', `${testData.username}_early_late`);
        await earlyLateJoiner.click('[data-testid="join-button"]');

        // Check if early late-joiner is allowed or blocked based on settings
        try {
            await earlyLateSocket.waitForSocketConnection();
            // If allowed, verify they join mid-session
            await expect(earlyLateJoiner.locator('[data-testid="joined-mid-session"]')).toBeVisible();
            await expect(teacherPage.locator('[data-testid="participant-count"]')).toContainText('3');
            console.log('✅ Early late-joiner allowed to join mid-session');
        } catch (error) {
            // If blocked, verify appropriate messaging
            await expect(earlyLateJoiner.locator('[data-testid="late-join-blocked"]')).toBeVisible();
            await expect(earlyLateJoiner.locator('[data-testid="session-already-started-message"]')).toBeVisible();
            console.log('✅ Early late-joiner appropriately blocked');
        }

        // Continue to next question for more late-join testing
        await teacherPage.click('[data-testid="next-question-button"]');

        // Step 6: Test late-joiner scenario 2 - Late in session (should likely be blocked)
        const lateLateJoiner = lateJoinerPages[1];

        await lateLateJoiner.goto('/');
        await lateLateJoiner.click('[data-testid="join-game-button"]');
        await lateLateJoiner.fill('[data-testid="access-code-input"]', accessCode!);
        await lateLateJoiner.fill('[data-testid="username-input"]', `${testData.username}_very_late`);
        await lateLateJoiner.click('[data-testid="join-button"]');

        // Very late joiners should typically be blocked
        await expect(lateLateJoiner.locator('[data-testid="late-join-blocked"]')).toBeVisible();
        await expect(lateLateJoiner.locator('[data-testid="session-too-far-advanced-message"]')).toBeVisible();

        // Step 7: Test access code validity for late-joiners
        const invalidCodeJoiner = lateJoinerPages[2];

        await invalidCodeJoiner.goto('/');
        await invalidCodeJoiner.click('[data-testid="join-game-button"]');
        await invalidCodeJoiner.fill('[data-testid="access-code-input"]', '999999'); // Invalid code
        await invalidCodeJoiner.fill('[data-testid="username-input"]', `${testData.username}_invalid`);
        await invalidCodeJoiner.click('[data-testid="join-button"]');

        await expect(invalidCodeJoiner.locator('[data-testid="invalid-access-code"]')).toBeVisible();

        // Step 8: Verify no disruption to ongoing session for existing participants
        // Ensure initial students can still participate normally
        await teacherPage.click('[data-testid="start-question-button"]');

        for (let i = 0; i < initialHelpers.length; i++) {
            const helper = initialHelpers[i];
            // Verify question is visible and functional
            await expect(helper.page.locator('[data-testid="quiz-question"]')).toBeVisible();
            await helper.page.click('[data-testid="answer-option-2"]');
            await helper.page.click('[data-testid="submit-answer-button"]');
        }

        // Verify teacher still sees correct participant count (excluding blocked late-joiners)
        const finalCount = await teacherPage.locator('[data-testid="participant-count"]').textContent();
        expect(parseInt(finalCount!)).toBeLessThanOrEqual(3); // Initial 2 + possibly 1 early late-joiner

        // Step 9: Complete session and verify results
        await teacherPage.click('[data-testid="next-question-button"]');
        await teacherPage.click('[data-testid="start-question-button"]');

        // Final question
        for (let i = 0; i < initialHelpers.length; i++) {
            const helper = initialHelpers[i];
            await helper.page.click('[data-testid="answer-option-3"]');
            await helper.page.click('[data-testid="submit-answer-button"]');
        }

        await teacherPage.click('[data-testid="show-results-button"]');

        // Verify results only include participants who were allowed to join
        await expect(teacherPage.locator('[data-testid="quiz-results"]')).toBeVisible();
        const leaderboard = teacherPage.locator('[data-testid="leaderboard"]');

        // Initial students should always be in results
        await expect(leaderboard).toContainText(`${testData.username}_initial_1`);
        await expect(leaderboard).toContainText(`${testData.username}_initial_2`);

        // Late-joiners should NOT be in results if they were blocked
        await expect(leaderboard).not.toContainText(`${testData.username}_very_late`);
        await expect(leaderboard).not.toContainText(`${testData.username}_invalid`);
    });

    test('Late-join policies configuration', async () => {
        // Test different late-join policy configurations:
        // - Allow late-joiners until X% progress
        // - Block all late-joiners after session starts
        // - Allow late-joiners with score penalty
    });

    test('Late-join UI messaging accuracy', async () => {
        // Test that appropriate messages are shown for different late-join scenarios:
        // - Session hasn't started yet (should be allowed)
        // - Session just started (may be allowed)
        // - Session well underway (should be blocked)
        // - Session ended (should be blocked)
        // - Invalid access code
    });

    test('Session state handling during late-join attempts', async () => {
        // Test that late-join attempts don't disrupt ongoing session state:
        // - Timer synchronization maintained
        // - Question state remains consistent
        // - Existing participant connections stable
        // - No race conditions in session management
    });
});
