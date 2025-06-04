import { test, expect, Page } from '@playwright/test';
import { LoginHelper } from './helpers/test-helpers';

test.describe('Practice Mode E2E', () => {
    let studentPage: Page;

    test.beforeAll(async ({ browser }) => {
        // Create browser context for student
        const studentContext = await browser.newContext();
        studentPage = await studentContext.newPage();
    });

    test.afterAll(async () => {
        await studentPage?.close();
    });

    test('Practice Mode: Self-paced learning with feedback', async () => {
        // Step 1: Login as student using unified login page
        const studentLogin = new LoginHelper(studentPage);
        await studentLogin.loginAsStudent({ username: 'PracticeTestStudent' });

        // Step 2: Navigate to practice mode (training)
        await studentPage.goto('/student/create-game?training=true');
        await studentPage.waitForLoadState('networkidle');

        // Step 3: Select practice parameters (niveau, discipline, themes)
        await expect(studentPage.locator('[data-testid="dropdown-niveau"]')).toBeVisible();
        await studentPage.click('[data-testid="dropdown-niveau"]');
        await studentPage.click('text=CP');

        await expect(studentPage.locator('[data-testid="dropdown-discipline"]')).toBeVisible();
        await studentPage.click('[data-testid="dropdown-discipline"]');
        await studentPage.click('text=Mathématiques');

        await expect(studentPage.locator('[data-testid="dropdown-themes"]')).toBeVisible();
        await studentPage.click('[data-testid="dropdown-themes"]');
        await studentPage.click('text=Addition');
        await studentPage.click('button:has-text("Valider les thèmes")');

        await studentPage.click('text=5');
        await studentPage.click('button:has-text("Valider")');
        await studentPage.click('button:has-text("Créer")');

        // Step 4: Verify practice session starts
        await studentPage.waitForURL('**/student/practice/session**');
        await expect(studentPage.locator('h1, h2')).toContainText('Entraînement');
        await expect(studentPage.locator('[data-testid="practice-session-active"]')).toBeVisible();
        await expect(studentPage.locator('[data-testid="practice-question"]')).toBeVisible();
        await expect(studentPage.locator('[data-testid="practice-progress"]')).toContainText('1/5');
        await expect(studentPage.locator('[data-testid="timer-display"]')).not.toBeVisible();
        await expect(studentPage.locator('[data-testid="self-paced-indicator"]')).toBeVisible();

        // Step 5: Answer questions with feedback
        for (let questionIndex = 0; questionIndex < 5; questionIndex++) {
            await expect(studentPage.locator('[data-testid="practice-question"]')).toBeVisible();
            await expect(studentPage.locator('[data-testid="practice-progress"]')).toContainText(`${questionIndex + 1}/5`);
            await studentPage.click('[data-testid="answer-option-0"]');
            await studentPage.click('[data-testid="submit-answer-button"]');
            await expect(studentPage.locator('[data-testid="answer-feedback-overlay"]')).toBeVisible();
            await expect(studentPage.locator('[data-testid="feedback-message"]')).toBeVisible();
            await expect(studentPage.locator('[data-testid="answer-explanation"]')).toBeVisible();
            await expect(studentPage.locator('[data-testid="understanding-confirmation"]')).toBeVisible();
            await studentPage.click('[data-testid="jai-compris-button"]');
            await expect(studentPage.locator('[data-testid="answer-feedback-overlay"]')).not.toBeVisible();
        }

        // Step 6: Session summary
        await expect(studentPage.locator('[data-testid="practice-session-complete"]')).toBeVisible();
        await expect(studentPage.locator('[data-testid="practice-summary"]')).toBeVisible();
        await expect(studentPage.locator('[data-testid="questions-completed"]')).toContainText('5');
        await expect(studentPage.locator('[data-testid="correct-answers-count"]')).toBeVisible();
        await expect(studentPage.locator('[data-testid="accuracy-percentage"]')).toBeVisible();
        await expect(studentPage.locator('[data-testid="topics-practiced"]')).toBeVisible();
    });
});
