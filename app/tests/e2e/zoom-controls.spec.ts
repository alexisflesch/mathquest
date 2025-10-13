import { test, expect, Page } from '@playwright/test';

const TEST_CONFIG = {
    baseUrl: 'http://localhost:3008',
    backendUrl: 'http://localhost:3007',
};

async function loginAsTeacher(page: Page) {
    const res = await page.request.post(`${TEST_CONFIG.backendUrl}/api/v1/auth`, {
        data: { action: 'login', email: 'test-teacher@test-mathquest.com', password: 'testpassword123' }
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    await page.context().addCookies([{ name: 'teacherToken', value: body.token, domain: 'localhost', path: '/' }]);
}

test('projection zoom controls change scale on question container', async ({ page }) => {
    await loginAsTeacher(page);

    // Create a small quiz via backend and get an access code using API (same flow as other tests)
    const questionsRes = await page.request.get(`${TEST_CONFIG.backendUrl}/api/v1/questions/list`, { params: { limit: '3' } });
    const questionUids = (await questionsRes.json()) || [];
    if (questionUids.length === 0) throw new Error('No questions available to create test game');

    const templateRes = await page.request.post(`${TEST_CONFIG.backendUrl}/api/v1/game-templates`, {
        data: {
            name: `zoom-test-template-${Date.now()}`,
            discipline: 'Mathématiques',
            gradeLevel: 'CP',
            description: 'zoom test',
            defaultMode: 'quiz',
            themes: ['Calcul'],
            questionUids: questionUids.slice(0, 3),
            questions: questionUids.slice(0, 3).map((uid: string, i: number) => ({ questionUid: uid, sequence: i }))
        }
    });
    const templateData = await templateRes.json();
    const templateId = templateData.gameTemplate?.id;

    const gameRes = await page.request.post(`${TEST_CONFIG.backendUrl}/api/v1/games`, {
        data: { gameTemplateId: templateId, name: `zoom-test-game-${Date.now()}`, playMode: 'quiz' }
    });
    const gameData = await gameRes.json();
    const accessCode = gameData.gameInstance?.accessCode || 'TEST';

    // Go to teacher dashboard and start the quiz so projection will receive a question
    await page.goto(`${TEST_CONFIG.baseUrl}/teacher/dashboard/${accessCode}`);
    await page.waitForLoadState('networkidle');
    // Try to find a start button and click it
    const startBtn = page.locator('button:has-text("Démarrer"), button:has-text("Start"), button[data-testid="start-quiz"]').first();
    if (await startBtn.count() > 0) {
        await startBtn.click();
    }
    // Give backend/socket a moment to propagate the question to projection
    await page.waitForTimeout(800);

    // Open projection page
    await page.goto(`${TEST_CONFIG.baseUrl}/teacher/projection/${accessCode}`);
    await page.waitForLoadState('networkidle');

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
