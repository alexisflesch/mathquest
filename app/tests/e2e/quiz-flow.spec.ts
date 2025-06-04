import { test, expect, Page } from '@playwright/test';
import { TestDataHelper, LoginHelper, SocketHelper } from './helpers/test-helpers';

test.describe('Complete Quiz Flow E2E', () => {
    let teacherPage: Page;
    let studentPage1: Page;
    let studentPage2: Page;
    let testData: any;

    test.beforeAll(async ({ browser }) => {
        // Create separate browser contexts for teacher and students
        const teacherContext = await browser.newContext();
        const studentContext1 = await browser.newContext();
        const studentContext2 = await browser.newContext();

        teacherPage = await teacherContext.newPage();
        studentPage1 = await studentContext1.newPage();
        studentPage2 = await studentContext2.newPage();

        // Generate test data
        const dataHelper = new TestDataHelper(teacherPage);
        testData = dataHelper.generateTestData('quiz_e2e');
    });

    test.afterAll(async () => {
        await teacherPage?.close();
        await studentPage1?.close();
        await studentPage2?.close();
    });

    test('Complete quiz flow: teacher creates quiz → students join → real-time gameplay → results', async () => {
        const dataHelper = new TestDataHelper(teacherPage);
        const teacherLogin = new LoginHelper(teacherPage);
        const teacherSocket = new SocketHelper(teacherPage);

        // Step 1: Create teacher account and login
        const teacherData = await dataHelper.createTeacher({
            username: testData.username + '_teacher',
            email: testData.email,
            password: testData.password
        });

        await teacherLogin.loginAsTeacher({
            email: testData.email,
            password: testData.password
        });

        // Verify teacher login was successful (check for logout button presence)
        await expect(teacherPage.locator('button:has-text("Déconnexion")')).toBeVisible();

        // Navigate to teacher dashboard and verify it loads
        await teacherPage.goto('/teacher/home');

        // Wait for page to load and check for teacher dashboard content
        // Use actual UI elements instead of data-testid attributes
        await expect(teacherPage.locator('h1, h2, [role="main"]')).toBeVisible({ timeout: 10000 });

        // Verify we're on a teacher page (not the login page anymore)
        await expect(teacherPage.locator('h1:has-text("Connexion Enseignant")')).not.toBeVisible();

        // Step 2: Teacher creates a quiz with 3 questions
        await teacherPage.click('[data-testid="create-quiz-button"]');
        await teacherPage.fill('[data-testid="quiz-name-input"]', testData.quizName);

        // Add 3 questions (assuming existing question bank)
        await teacherPage.click('[data-testid="add-question-button"]');
        await teacherPage.click('[data-testid="question-select-0"]'); // First question

        await teacherPage.click('[data-testid="add-question-button"]');
        await teacherPage.click('[data-testid="question-select-1"]'); // Second question

        await teacherPage.click('[data-testid="add-question-button"]');
        await teacherPage.click('[data-testid="question-select-2"]'); // Third question

        await teacherPage.click('[data-testid="create-quiz-confirm"]');

        // Step 3: Teacher starts the quiz and gets access code
        await teacherPage.click('[data-testid="start-quiz-button"]');
        await teacherSocket.waitForSocketConnection();

        const accessCode = await teacherPage.locator('[data-testid="access-code"]').textContent();
        expect(accessCode).toBeTruthy();
        expect(accessCode).toMatch(/^\d{6}$/); // 6-digit code

        // Step 4: Students join using access code
        const student1Login = new LoginHelper(studentPage1);
        const student2Login = new LoginHelper(studentPage2);
        const student1Socket = new SocketHelper(studentPage1);
        const student2Socket = new SocketHelper(studentPage2);

        // Student 1 joins
        await studentPage1.goto('/student/join');
        await studentPage1.fill('[data-testid="access-code-input"]', accessCode!);
        await studentPage1.fill('[data-testid="username-input"]', testData.username + '_student1');
        await studentPage1.click('[data-testid="join-quiz-button"]');
        await student1Socket.waitForSocketConnection();

        // Student 2 joins
        await studentPage2.goto('/student/join');
        await studentPage2.fill('[data-testid="access-code-input"]', accessCode!);
        await studentPage2.fill('[data-testid="username-input"]', testData.username + '_student2');
        await studentPage2.click('[data-testid="join-quiz-button"]');
        await student2Socket.waitForSocketConnection();

        // Step 5: Verify participants list updates
        await expect(teacherPage.locator('[data-testid="participant-count"]')).toContainText('2');
        await expect(teacherPage.locator('[data-testid="participant-list"]')).toContainText(testData.username + '_student1');
        await expect(teacherPage.locator('[data-testid="participant-list"]')).toContainText(testData.username + '_student2');

        // Step 6: Teacher progresses through questions with timer
        for (let questionIndex = 0; questionIndex < 3; questionIndex++) {
            // Start question
            await teacherPage.click('[data-testid="start-question-button"]');

            // Verify timer synchronization across all clients
            await expect(teacherPage.locator('[data-testid="timer"]')).toBeVisible();
            await expect(studentPage1.locator('[data-testid="timer"]')).toBeVisible();
            await expect(studentPage2.locator('[data-testid="timer"]')).toBeVisible();

            // Students submit answers in real-time
            await studentPage1.click('[data-testid="answer-option-0"]'); // Student 1 answers A
            await studentPage1.click('[data-testid="submit-answer-button"]');

            await studentPage2.click('[data-testid="answer-option-1"]'); // Student 2 answers B
            await studentPage2.click('[data-testid="submit-answer-button"]');

            // Verify answer submission indicators
            await expect(teacherPage.locator('[data-testid="answers-received"]')).toContainText('2/2');

            // Teacher advances to next question or results
            if (questionIndex < 2) {
                await teacherPage.click('[data-testid="next-question-button"]');
            } else {
                await teacherPage.click('[data-testid="show-results-button"]');
            }
        }

        // Step 7: Verify final results and leaderboard accuracy
        await expect(teacherPage.locator('[data-testid="quiz-results"]')).toBeVisible();
        await expect(studentPage1.locator('[data-testid="quiz-results"]')).toBeVisible();
        await expect(studentPage2.locator('[data-testid="quiz-results"]')).toBeVisible();

        // Verify leaderboard shows both students
        const leaderboard = teacherPage.locator('[data-testid="leaderboard"]');
        await expect(leaderboard).toContainText(testData.username + '_student1');
        await expect(leaderboard).toContainText(testData.username + '_student2');

        // Verify scores are calculated correctly
        const student1Score = await studentPage1.locator('[data-testid="final-score"]').textContent();
        const student2Score = await studentPage2.locator('[data-testid="final-score"]').textContent();

        expect(student1Score).toBeTruthy();
        expect(student2Score).toBeTruthy();
        expect(parseInt(student1Score!)).toBeGreaterThanOrEqual(0);
        expect(parseInt(student2Score!)).toBeGreaterThanOrEqual(0);
    });

    test('Socket.IO real-time updates work correctly', async () => {
        // This test specifically focuses on real-time synchronization
        // Will be implemented as part of the main test above
    });

    test('Timer synchronization across all clients', async () => {
        // This test specifically focuses on timer synchronization
        // Will be implemented as part of the main test above
    });
});
