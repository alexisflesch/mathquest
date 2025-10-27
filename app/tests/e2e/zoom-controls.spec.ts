import { test, expect, Page } from '@playwright/test';
import { LoginHelper, TestDataHelper } from './helpers/test-helpers';

const TEST_CONFIG = {
    baseUrl: 'http://localhost:3008',
    backendUrl: 'http://localhost:3007',
};

test('projection zoom controls change scale on question container', async ({ page }) => {
    const dataHelper = new TestDataHelper(page);
    const loginHelper = new LoginHelper(page);

    // Create teacher account and login
    const teacherData = dataHelper.generateTestData('zoom_teacher');
    await dataHelper.createTeacher({
        username: teacherData.username,
        email: teacherData.email,
        password: teacherData.password
    });

    await loginHelper.loginAsTeacher({
        email: teacherData.email,
        password: teacherData.password
    });

    // Create a small quiz via backend and get an access code
    const questionsRes = await page.request.get('/api/questions/list', {
        params: {
            gradeLevel: 'CP',
            discipline: 'Mathématiques',
            limit: '3'
        }
    });
    const questionUids = (await questionsRes.json()) || [];
    if (questionUids.length === 0) throw new Error('No questions available to create test game');

    const templateRes = await page.request.post('/api/game-templates', {
        data: {
            name: `zoom-test-template-${Date.now()}`,
            discipline: 'Mathématiques',
            gradeLevel: 'CP',
            description: 'zoom test',
            defaultMode: 'quiz',
            themes: ['Calcul'],
            questionUids: questionUids.slice(0, 3)
        }
    });
    const templateData = await templateRes.json();
    const templateId = templateData.gameTemplate?.id;

    const gameRes = await page.request.post('/api/games', {
        data: { gameTemplateId: templateId, name: `zoom-test-game-${Date.now()}`, playMode: 'quiz', settings: {} }
    });
    const gameData = await gameRes.json();
    const accessCode = gameData.gameInstance?.accessCode || 'TEST';

    // Go to teacher dashboard and start the first question
    await page.goto(`${TEST_CONFIG.baseUrl}/teacher/dashboard/${accessCode}`);
    await page.waitForLoadState('networkidle');

    // Wait for questions list to load
    await page.waitForSelector('ul.draggable-questions-list', { timeout: 15000 }).catch(() => { });
    await page.locator('ul.draggable-questions-list li').first().waitFor({ timeout: 10000 }).catch(() => { });

    // Try to start the first question using various methods
    const tryStart = async () => {
        // Method 1: Look for canonical start button
        const canonical = page.locator('[data-testid="start-question-button"]').first();
        if (await canonical.count()) {
            await canonical.click({ timeout: 6000 }).catch(() => { });
            await page.waitForTimeout(500);
            return true;
        }
        // Method 2: Look for play button in question list
        const playInList = page.locator('ul.draggable-questions-list li .question-display [data-play-pause-btn]').first();
        if (await playInList.count()) {
            await playInList.click({ timeout: 6000 }).catch(() => { });
            await page.waitForTimeout(500);
            return true;
        }
        return false;
    };

    let started = await tryStart();
    if (!started) {
        // Click on question first to select it
        const firstItem = page.locator('ul.draggable-questions-list li .question-display').first();
        if (await firstItem.count()) {
            await firstItem.click({ timeout: 5000 }).catch(() => { });
            await page.waitForTimeout(200);
        }
        started = await tryStart();
    }

    if (!started) {
        throw new Error('Could not start question from dashboard');
    }

    // Give backend/socket time to propagate the question to projection
    await page.waitForTimeout(1500);

    // Open projection page
    await page.goto(`${TEST_CONFIG.baseUrl}/teacher/projection/${accessCode}`);
    await page.waitForLoadState('networkidle');

    // Wait for socket connection and initial state
    await page.waitForTimeout(2000);

    // Wait for projection to show a question (or related heading) after socket join
    const projectionQuestionLocator = page.locator('[data-testid="question"], .question, h2, h3');
    await projectionQuestionLocator.first().waitFor({ state: 'visible', timeout: 8000 });

    // Find zoom controls and the question wrapper element
    const zoomIn = page.locator('button[aria-label="Zoom in"]').first();
    const zoomOut = page.locator('button[aria-label="Zoom out"]').first();
    const questionWrapper = page.locator('div[style*="transform: scale("]').first();

    // Ensure controls exist
    await expect(zoomIn).toBeVisible({ timeout: 5000 });
    await expect(zoomOut).toBeVisible({ timeout: 5000 });

    // Read initial scale numeric value
    const initialStyle = (await questionWrapper.getAttribute('style')) || '';
    const initialMatch = initialStyle.match(/scale\(([^)]+)\)/);
    const initialScale = initialMatch ? parseFloat(initialMatch[1]) : 1;

    // Click zoom in and verify numeric scale increased
    await zoomIn.click();
    await page.waitForTimeout(300);
    const afterInStyle = (await questionWrapper.getAttribute('style')) || '';
    const afterInMatch = afterInStyle.match(/scale\(([^)]+)\)/);
    const afterInScale = afterInMatch ? parseFloat(afterInMatch[1]) : initialScale;
    expect(afterInScale).toBeGreaterThan(initialScale);

    // Click zoom out and verify numeric scale decreased back
    await zoomOut.click();
    await page.waitForTimeout(300);
    const afterOutStyle = (await questionWrapper.getAttribute('style')) || '';
    const afterOutMatch = afterOutStyle.match(/scale\(([^)]+)\)/);
    const afterOutScale = afterOutMatch ? parseFloat(afterOutMatch[1]) : afterInScale;
    expect(afterOutScale).toBeLessThan(afterInScale);
});
