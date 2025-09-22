import { test, expect, Page } from '@playwright/test';
import { TestDataHelper, LoginHelper, SocketHelper } from './helpers/test-helpers';

test.describe('Tournament Deferred Mode E2E', () => {
    let teacherPage: Page;
    let batchOnePages: Page[] = [];
    let batchTwoPages: Page[] = [];
    let testData: any;

    test.beforeAll(async ({ browser }) => {
        // Create separate browser contexts
        const teacherContext = await browser.newContext();
        teacherPage = await teacherContext.newPage();

        // Create pages for first batch of students (early joiners)
        for (let i = 0; i < 3; i++) {
            const studentContext = await browser.newContext();
            const studentPage = await studentContext.newPage();
            batchOnePages.push(studentPage);
        }

        // Create pages for second batch of students (later joiners)
        for (let i = 0; i < 2; i++) {
            const studentContext = await browser.newContext();
            const studentPage = await studentContext.newPage();
            batchTwoPages.push(studentPage);
        }

        // Generate test data
        const dataHelper = new TestDataHelper(teacherPage);
        testData = dataHelper.generateTestData('deferred_tournament_e2e');
    });

    test.afterAll(async () => {
        await teacherPage?.close();
        for (const page of [...batchOnePages, ...batchTwoPages]) {
            await page?.close();
        }
    });

    test('Deferred Tournament: Students join and complete at different times', async () => {
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

        // Step 2: Create tournament in deferred mode with duration/deadline
        await teacherPage.click('[data-testid="create-tournament-button"]');
        await teacherPage.fill('[data-testid="tournament-name-input"]', testData.tournamentName);

        // Enable deferred mode
        await teacherPage.check('[data-testid="deferred-mode-checkbox"]');

        // Set tournament configuration for deferred mode
        await teacherPage.selectOption('[data-testid="tournament-theme"]', 'arithmetic');
        await teacherPage.selectOption('[data-testid="tournament-difficulty"]', 'easy');
        await teacherPage.fill('[data-testid="tournament-questions-count"]', '4');

        // Set tournament duration (e.g., 2 hours from now)
        const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
        await teacherPage.fill('[data-testid="tournament-deadline"]', futureTime.toISOString().slice(0, 16));

        await teacherPage.click('[data-testid="create-tournament-confirm"]');

        // Step 3: Start deferred tournament
        await teacherPage.click('[data-testid="start-deferred-tournament-button"]');
        await teacherSocket.waitForSocketConnection();

        const accessCode = await teacherPage.locator('[data-testid="access-code"]').textContent();
        expect(accessCode).toBeTruthy();
        expect(accessCode).toMatch(/^\d{6}$/);

        // Verify deferred mode indicators
        await expect(teacherPage.locator('[data-testid="deferred-mode-active"]')).toBeVisible();
        await expect(teacherPage.locator('[data-testid="tournament-deadline-display"]')).toBeVisible();

        // Step 4: First batch of students join and complete tournament
        const batchOneHelpers = [];
        for (let i = 0; i < batchOnePages.length; i++) {
            const studentPage = batchOnePages[i];
            const studentSocket = new SocketHelper(studentPage);

            batchOneHelpers.push({ page: studentPage, socket: studentSocket });

            // Student joins deferred tournament
            await studentPage.goto('/student/join');
            await studentPage.fill('[data-testid="access-code-input"]', accessCode!);
            await studentPage.fill('[data-testid="username-input"]', `${testData.username}_batch1_student${i + 1}`);
            await studentPage.click('[data-testid="join-tournament-button"]');
            await studentSocket.waitForSocketConnection();

            // Verify deferred mode interface
            await expect(studentPage.locator('[data-testid="deferred-tournament-start"]')).toBeVisible();
            await expect(studentPage.locator('[data-testid="tournament-deadline-timer"]')).toBeVisible();
        }

        // Students from batch 1 start their individual tournaments
        for (let i = 0; i < batchOneHelpers.length; i++) {
            const helper = batchOneHelpers[i];

            await helper.page.click('[data-testid="start-my-tournament-button"]');

            // Complete tournament questions at their own pace
            for (let questionIndex = 0; questionIndex < 4; questionIndex++) {
                await expect(helper.page.locator('[data-testid="deferred-question"]')).toBeVisible();

                // Answer question (with some variety)
                const answerIndex = (i + questionIndex) % 4;
                await helper.page.click(`[data-testid="answer-option-${answerIndex}"]`);
                await helper.page.click('[data-testid="submit-answer-button"]');

                // Wait for next question or completion
                if (questionIndex < 3) {
                    await helper.page.click('[data-testid="next-question-button"]');
                }
            }

            // Verify individual completion
            await expect(helper.page.locator('[data-testid="deferred-tournament-complete"]')).toBeVisible();
            await expect(helper.page.locator('[data-testid="my-score-display"]')).toBeVisible();
        }

        // Step 5: Verify teacher can see partial leaderboard with batch 1 completions
        await expect(teacherPage.locator('[data-testid="deferred-leaderboard"]')).toBeVisible();
        await expect(teacherPage.locator('[data-testid="completed-count"]')).toContainText('3');

        for (let i = 0; i < batchOneHelpers.length; i++) {
            const studentName = `${testData.username}_batch1_student${i + 1}`;
            await expect(teacherPage.locator('[data-testid="deferred-leaderboard"]')).toContainText(studentName);
        }

        // Step 6: Second batch of students join later (while tournament still active)
        // Simulate some time passing
        await teacherPage.waitForTimeout(2000);

        const batchTwoHelpers = [];
        for (let i = 0; i < batchTwoPages.length; i++) {
            const studentPage = batchTwoPages[i];
            const studentSocket = new SocketHelper(studentPage);

            batchTwoHelpers.push({ page: studentPage, socket: studentSocket });

            // Later students join the same tournament
            await studentPage.goto('/student/join');
            await studentPage.fill('[data-testid="access-code-input"]', accessCode!);
            await studentPage.fill('[data-testid="username-input"]', `${testData.username}_batch2_student${i + 1}`);
            await studentPage.click('[data-testid="join-tournament-button"]');
            await studentSocket.waitForSocketConnection();

            // Verify they can still join and see tournament is active
            await expect(studentPage.locator('[data-testid="deferred-tournament-start"]')).toBeVisible();
            await expect(studentPage.locator('[data-testid="tournament-deadline-timer"]')).toBeVisible();
        }

        // Step 7: Batch 2 students complete tournament at their own pace
        for (let i = 0; i < batchTwoHelpers.length; i++) {
            const helper = batchTwoHelpers[i];

            await helper.page.click('[data-testid="start-my-tournament-button"]');

            // Complete tournament questions
            for (let questionIndex = 0; questionIndex < 4; questionIndex++) {
                await expect(helper.page.locator('[data-testid="deferred-question"]')).toBeVisible();

                // Answer question (different pattern from batch 1)
                const answerIndex = (i + questionIndex + 2) % 4;
                await helper.page.click(`[data-testid="answer-option-${answerIndex}"]`);
                await helper.page.click('[data-testid="submit-answer-button"]');

                if (questionIndex < 3) {
                    await helper.page.click('[data-testid="next-question-button"]');
                }
            }

            await expect(helper.page.locator('[data-testid="deferred-tournament-complete"]')).toBeVisible();
        }

        // Step 8: Final leaderboard aggregates all participants across time periods
        await expect(teacherPage.locator('[data-testid="completed-count"]')).toContainText('5');

        // Verify all students from both batches appear in final leaderboard
        const finalLeaderboard = teacherPage.locator('[data-testid="deferred-leaderboard"]');

        for (let i = 0; i < batchOneHelpers.length; i++) {
            const studentName = `${testData.username}_batch1_student${i + 1}`;
            await expect(finalLeaderboard).toContainText(studentName);
        }

        for (let i = 0; i < batchTwoHelpers.length; i++) {
            const studentName = `${testData.username}_batch2_student${i + 1}`;
            await expect(finalLeaderboard).toContainText(studentName);
        }

        // Step 9: Verify tournament deadline enforcement (if we want to test this)
        // This would require manipulating time or using a very short deadline
        // For now, we'll verify the deadline display works correctly
        await expect(teacherPage.locator('[data-testid="tournament-deadline-display"]')).toBeVisible();

        // Step 10: Test session state persistence
        // Verify that students can refresh/reconnect and maintain their progress
        const testPage = batchTwoPages[0];
        await testPage.reload();

        // Should show completed state since they finished
        await expect(testPage.locator('[data-testid="deferred-tournament-complete"]')).toBeVisible();
    });

    test('Deferred mode tournament deadline enforcement', async () => {
        // Test that tournament properly closes when deadline is reached
        // This would create a tournament with a very short deadline
    });

    test('Deferred mode session persistence', async () => {
        // Test that students can disconnect/reconnect and resume where they left off
        // This is important for deferred mode where students may take breaks
    });
});
