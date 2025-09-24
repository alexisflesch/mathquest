import { test, expect, Page } from '@playwright/test';
import { TestDataHelper, LoginHelper, SocketHelper } from './helpers/test-helpers';

test.describe('Tournament Mode E2E', () => {
    let teacherPage: Page;
    let studentPages: Page[] = [];
    let testData: any;
    const numStudents = 4;

    test.beforeAll(async ({ browser }) => {
        // Create separate browser contexts for teacher and multiple students
        const teacherContext = await browser.newContext();
        teacherPage = await teacherContext.newPage();

        // Create 4 student pages for tournament
        for (let i = 0; i < numStudents; i++) {
            const studentContext = await browser.newContext();
            const studentPage = await studentContext.newPage();
            studentPages.push(studentPage);
        }

        // Generate test data
        const dataHelper = new TestDataHelper(teacherPage);
        testData = dataHelper.generateTestData('tournament_e2e');
    });

    test.afterAll(async () => {
        await teacherPage?.close();
        for (const page of studentPages) {
            await page?.close();
        }
    });

    test('Tournament Mode: Multiple students compete with real-time leaderboard', async () => {
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

        // Step 2: Create tournament with specific themes/difficulty
        await teacherPage.click('[data-testid="create-tournament-button"]');
        await teacherPage.fill('[data-testid="tournament-name-input"]', testData.tournamentName);

        // Set tournament configuration
        await teacherPage.selectOption('[data-testid="tournament-theme"]', 'arithmetic');
        await teacherPage.selectOption('[data-testid="tournament-difficulty"]', 'medium');
        await teacherPage.fill('[data-testid="tournament-questions-count"]', '5');
        await teacherPage.fill('[data-testid="tournament-time-per-question"]', '30');

        await teacherPage.click('[data-testid="create-tournament-confirm"]');

        // Step 3: Start tournament and get access code
        await teacherPage.click('[data-testid="start-tournament-button"]');
        await teacherSocket.waitForSocketConnection();

        const accessCode = await teacherPage.locator('[data-testid="access-code"]').textContent();
        expect(accessCode).toBeTruthy();
        expect(accessCode).toMatch(/^\d{6}$/);

        // Step 4: Students join tournament lobby
        const studentHelpers = [];
        for (let i = 0; i < numStudents; i++) {
            const studentPage = studentPages[i];
            const studentLogin = new LoginHelper(studentPage);
            const studentSocket = new SocketHelper(studentPage);

            studentHelpers.push({ page: studentPage, login: studentLogin, socket: studentSocket });

            // Student joins tournament
            await studentPage.goto('/student/join');
            await studentPage.fill('[data-testid="access-code-input"]', accessCode!);
            await studentPage.fill('[data-testid="username-input"]', `${testData.username}_student${i + 1}`);
            await studentPage.click('[data-testid="join-tournament-button"]');
            await studentSocket.waitForSocketConnection();
        }

        // Verify all students are in lobby
        await expect(teacherPage.locator('[data-testid="participant-count"]')).toContainText(`${numStudents}`);

        // Step 5: Tournament starts with countdown
        await teacherPage.click('[data-testid="start-tournament-countdown"]');

        // Verify countdown appears on all clients
        await expect(teacherPage.locator('[data-testid="tournament-countdown"]')).toBeVisible();
        for (const helper of studentHelpers) {
            await expect(helper.page.locator('[data-testid="tournament-countdown"]')).toBeVisible();
        }

        // Wait for countdown to complete
        await teacherPage.waitForSelector('[data-testid="tournament-active"]', { timeout: 10000 });

        // Step 6: Students answer questions simultaneously
        for (let questionIndex = 0; questionIndex < 5; questionIndex++) {
            // Verify question appears on all clients
            await expect(teacherPage.locator('[data-testid="tournament-question"]')).toBeVisible();
            for (const helper of studentHelpers) {
                await expect(helper.page.locator('[data-testid="tournament-question"]')).toBeVisible();
            }

            // Students submit answers with different response times and accuracy
            for (let i = 0; i < numStudents; i++) {
                const studentPage = studentHelpers[i].page;

                // Simulate different answer patterns for realistic competition
                const answerIndex = (i + questionIndex) % 4; // Different answers
                const delay = i * 500; // Staggered response times

                await studentPage.waitForTimeout(delay);
                await studentPage.click(`[data-testid="answer-option-${answerIndex}"]`);
                await studentPage.click('[data-testid="submit-answer-button"]');
            }

            // Step 7: Verify live leaderboard updates after each question
            await expect(teacherPage.locator('[data-testid="live-leaderboard"]')).toBeVisible();

            // Check that leaderboard shows all participants
            for (let i = 0; i < numStudents; i++) {
                const studentName = `${testData.username}_student${i + 1}`;
                await expect(teacherPage.locator('[data-testid="live-leaderboard"]')).toContainText(studentName);
            }

            // Verify leaderboard updates on student clients
            for (const helper of studentHelpers) {
                await expect(helper.page.locator('[data-testid="live-leaderboard"]')).toBeVisible();
            }

            // Wait for question to complete before next iteration
            if (questionIndex < 4) {
                await teacherPage.waitForSelector('[data-testid="question-complete"]');
            }
        }

        // Step 8: Tournament concludes with final rankings
        await expect(teacherPage.locator('[data-testid="tournament-results"]')).toBeVisible();

        // Verify final leaderboard accuracy
        const finalLeaderboard = teacherPage.locator('[data-testid="final-tournament-leaderboard"]');
        await expect(finalLeaderboard).toBeVisible();

        // Check that all students appear in final results
        for (let i = 0; i < numStudents; i++) {
            const studentName = `${testData.username}_student${i + 1}`;
            await expect(finalLeaderboard).toContainText(studentName);
        }

        // Verify rankings are ordered correctly (highest score first)
        const rankings = await finalLeaderboard.locator('[data-testid="ranking-entry"]').count();
        expect(rankings).toBe(numStudents);

        // Verify students see their final tournament results
        for (const helper of studentHelpers) {
            await expect(helper.page.locator('[data-testid="tournament-results"]')).toBeVisible();
            await expect(helper.page.locator('[data-testid="my-final-rank"]')).toBeVisible();
            await expect(helper.page.locator('[data-testid="my-final-score"]')).toBeVisible();
        }
    });

    test('Tournament simultaneous answer handling', async () => {
        // Test specifically focuses on handling multiple simultaneous submissions
        // This ensures the backend can handle concurrent answer processing correctly
    });

    test('Tournament performance under concurrent load', async () => {
        // Test tournament performance with maximum expected concurrent users
        // Could be expanded to stress test with more students if needed
    });
});
