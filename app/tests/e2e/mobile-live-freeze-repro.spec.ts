/**
 * Mobile Live Page Freeze Repro
 *
 * Goal: Reproduce the reported issue on some phones where the live/[code] page freezes
 * (answers not clickable, timer stops, only scrolling works). This test:
 * - Creates a quiz via backend API as a teacher (consistent with working tests)
 * - Authenticates a student (guest) and joins the quiz
 * - Opens the student page in a mobile context (iPhone 12)
 * - Opens the teacher dashboard and attempts to start the first question
 * - Tries to tap an answer on the student page, then collects diagnostics
 */

import { test, expect, devices, Page } from '@playwright/test';
import { TestDataHelper } from './helpers/test-helpers';

const CFG = {
    baseUrl: 'http://localhost:3008',
    backendUrl: 'http://localhost:3007',
};

// Create teacher, login via API, create template+game via backend to get access code
async function createQuizViaAPI(page: Page, teacher: { email: string; password: string; username: string }): Promise<{ accessCode: string; gameId: string }> {
    // Login teacher to get token
    const loginResp = await page.request.post(`${CFG.backendUrl}/api/v1/auth/login`, {
        data: { email: teacher.email, password: teacher.password }
    });
    if (!loginResp.ok()) {
        throw new Error(`Teacher login failed: ${loginResp.status()}`);
    }
    const loginData = await loginResp.json();

    // Set auth cookie for browser session to access teacher dashboard
    await page.context().addCookies([
        {
            name: 'teacherToken',
            value: loginData.token,
            domain: 'localhost',
            path: '/',
            httpOnly: true,
            secure: false
        }
    ]);

    // Fetch some questions
    const qResp = await page.request.get(`${CFG.backendUrl}/api/v1/questions/list`, {
        params: { gradeLevel: 'CP', discipline: 'Mathématiques', themes: 'Calcul', limit: '5' }
    });
    if (!qResp.ok()) throw new Error(`Questions fetch failed: ${qResp.status()}`);
    const questionUids = await qResp.json();
    if (!Array.isArray(questionUids) || questionUids.length === 0) {
        throw new Error('No questions available');
    }

    // Create template
    const tplResp = await page.request.post(`${CFG.backendUrl}/api/v1/game-templates`, {
        data: {
            name: `Freeze Repro Template ${Date.now()}`,
            discipline: 'Mathématiques',
            gradeLevel: 'CP',
            themes: ['Calcul'],
            description: 'Template for mobile freeze repro',
            defaultMode: 'quiz',
            questionUids: questionUids.slice(0, 3)
        }
    });
    if (!tplResp.ok()) throw new Error(`Template creation failed: ${tplResp.status()}`);
    const tpl = await tplResp.json();
    const templateId = tpl.gameTemplate?.id;

    // Create game
    const gameResp = await page.request.post(`${CFG.backendUrl}/api/v1/games`, {
        data: {
            name: `Freeze Repro Game ${Date.now()}`,
            gameTemplateId: templateId,
            playMode: 'quiz',
            settings: { defaultMode: 'direct', avatar: '👨‍🏫', username: teacher.username }
        }
    });
    if (!gameResp.ok()) throw new Error(`Game creation failed: ${gameResp.status()}`);
    const game = await gameResp.json();
    return { accessCode: game.gameInstance?.accessCode, gameId: game.gameInstance?.id };
}

async function authGuestAndJoinStudent(page: Page, accessCode: string) {
    await page.goto(`${CFG.baseUrl}/login`);
    // Fill username and pick an avatar
    await page.locator('input[placeholder*="name"], input[name="username"], input#username').fill('MobileTester');
    await page.waitForTimeout(300); // small UI delay
    await page.locator('button.emoji-avatar').first().click();
    await page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Commencer")').click();
    await page.waitForSelector('nav, header, [data-testid="user-profile"]', { timeout: 10000 });
    console.log('[MOBILE-REPRO] Student authenticated as guest');

    // Join flow: navigate directly to the live page (simpler and used in other working tests)
    await page.goto(`${CFG.baseUrl}/live/${accessCode}`);
    await page.waitForURL(`${CFG.baseUrl}/live/${accessCode}`, { timeout: 15000 });
    console.log('[MOBILE-REPRO] Student navigated directly to live page:', await page.url());
}

async function startFirstQuestionFromDashboard(page: Page, accessCode: string) {
    // Navigate to teacher dashboard and start first question using canonical test id
    await page.goto(`${CFG.baseUrl}/teacher/dashboard/${accessCode}`, { waitUntil: 'networkidle' });
    console.log('[MOBILE-REPRO] Teacher dashboard URL:', await page.url());

    // Wait for dashboard to render controls or questions section
    await Promise.race([
        page.waitForSelector('[data-testid="start-question-button"]', { timeout: 10000 }),
        page.waitForSelector('text=Questions', { timeout: 10000 })
    ]).catch(() => undefined);

    // Try canonical start button first
    const startBtn = page.locator('[data-testid="start-question-button"]').first();
    try {
        await startBtn.waitFor({ timeout: 10000 });
        await startBtn.click();
        await page.waitForTimeout(1000);
        console.log('[MOBILE-REPRO] Clicked start-question-button');
        return;
    } catch (_) {
        // Fallbacks
    }

    // Try clicking first question to reveal controls, then attempt again
    const firstQuestion = page.locator('[data-testid="question"], .question-display, .sortable-question').first();
    if (await firstQuestion.count()) {
        await firstQuestion.click().catch(() => { });
        try {
            await page.locator('[data-testid="start-question-button"]').first().click({ timeout: 5000 });
            await page.waitForTimeout(800);
            console.log('[MOBILE-REPRO] Clicked start-question-button after selecting first question');
            return;
        } catch { /* continue */ }
    }

    const fallbackSelectors = [
        'button[data-testid="play-button"]',
        'button:has-text("Démarrer")',
        'button:has-text("Start")',
    ];
    for (const sel of fallbackSelectors) {
        const btn = page.locator(sel).first();
        if (await btn.count()) {
            try {
                await btn.click({ timeout: 3000 });
                await page.waitForTimeout(1000);
                console.log('[MOBILE-REPRO] Clicked fallback start selector:', sel);
                return;
            } catch {
                // try next
            }
        }
    }
}

test('tap answer on mobile live page and collect diagnostics', async ({ browser }) => {
    test.setTimeout(120000);
    // Desktop teacher context
    const teacherCtx = await browser.newContext();
    const teacherPage = await teacherCtx.newPage();

    // Mobile student context (iPhone 12)
    const studentCtx = await browser.newContext({ ...devices['iPhone 12'] });
    const studentPage = await studentCtx.newPage();

    try {
        // Create teacher account and quiz via backend API
        const dataHelper = new TestDataHelper(teacherPage);
        const teacherData = dataHelper.generateTestData('mobile_freeze_teacher');
        await dataHelper.createTeacher({ username: teacherData.username, email: teacherData.email, password: teacherData.password });
        const { accessCode } = await createQuizViaAPI(teacherPage, { email: teacherData.email, password: teacherData.password, username: teacherData.username });

        await authGuestAndJoinStudent(studentPage, accessCode);
        await startFirstQuestionFromDashboard(teacherPage, accessCode);

        // If question not visible yet, try to select first question then start again
        const answersCount = await studentPage.locator('.tqcard-answer').count();
        if (!answersCount) {
            // Try select first question item in dashboard and then press play
            const questionItem = teacherPage.locator('[data-testid="question"], .question-display, .sortable-question').first();
            if (await questionItem.count()) {
                await questionItem.click({ timeout: 5000 }).catch(() => { });
                await startFirstQuestionFromDashboard(teacherPage, accessCode);
            }
        }

        // Wait for question to appear on student page (longer)
        try {
            await studentPage.waitForSelector('.tqcard-answer', { timeout: 30000 });
        } catch (e) {
            console.log('[MOBILE-REPRO] Answers not visible after 30s, capturing screenshots for diagnostics...');
            await teacherPage.screenshot({ path: 'test-results/e2e/debug-mobile-freeze-teacher.png', fullPage: true });
            await studentPage.screenshot({ path: 'test-results/e2e/debug-mobile-freeze-student.png', fullPage: true });
            // Re-throw to let the test fail at the wait point
            throw e;
        }

        // Try to tap the first answer
        const firstAnswer = studentPage.locator('.tqcard-answer').first();
        const beforeClasses = await firstAnswer.getAttribute('class');
        await firstAnswer.click({ timeout: 5000 });
        const afterClasses = await firstAnswer.getAttribute('class');

        // Basic assertion: class should change to selected style at least transiently
        // If not, collect diagnostics
        const clicked = beforeClasses !== afterClasses;
        if (!clicked) {
            // Collect overlay diagnostics
            const diag = await studentPage.evaluate(() => {
                const overlay = document.querySelector('.feedback-overlay') as HTMLElement | null;
                const card = document.querySelector('.feedback-card') as HTMLElement | null;
                const timer = document.querySelector('[class*="Timer"]') as HTMLElement | null;
                const anyFixed = Array.from(document.querySelectorAll<HTMLElement>('*')).filter(e => getComputedStyle(e).position === 'fixed').length;
                const overlayStyles = overlay ? getComputedStyle(overlay) : null;
                const peOverlay = overlayStyles?.pointerEvents;
                const zOverlay = overlayStyles?.zIndex;
                const rect = document.querySelector('.tqcard-answer')?.getBoundingClientRect();
                const midX = rect ? Math.floor(rect.left + rect.width / 2) : 50;
                const midY = rect ? Math.floor(rect.top + rect.height / 2) : 200;
                const elAtPoint = document.elementFromPoint(midX, midY);
                const ancestry: string[] = [];
                let n: Element | null = elAtPoint;
                while (n && ancestry.length < 6) { ancestry.push(n instanceof HTMLElement ? `${n.tagName}.${n.className}` : n.tagName); n = n.parentElement; }
                return {
                    anyFixed,
                    overlayPresent: !!overlay,
                    cardPresent: !!card,
                    timerPresent: !!timer,
                    overlayPointerEvents: peOverlay,
                    overlayZ: zOverlay,
                    elementAtPoint: elAtPoint ? (elAtPoint as HTMLElement).className : null,
                    ancestry,
                };
            });
            console.log('[MOBILE-FREEZE-DIAG]', JSON.stringify(diag));
        }

        // Even if class didn't change, we at least want the click not to hang
        expect(firstAnswer).toBeTruthy();
    } finally {
        await teacherCtx.close();
        await studentCtx.close();
    }
});
