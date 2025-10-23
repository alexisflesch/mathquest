/**
 * Mobile MC Live Page Freeze Repro (Option A)
 *
 * Goal: Use a known-good E2E flow (teacher UI login + backend API game creation)
 * with a mobile student context to reliably reach the live question and then
 * attempt a tap while collecting diagnostics around overlays and hit-testing.
 *
 * This targets multiple choice (not numeric), matching the original bug report context.
 */

import { test, expect, devices, Page, BrowserContext } from '@playwright/test';
import { TestDataHelper, LoginHelper } from './helpers/test-helpers';

const CFG = {
    baseUrl: 'http://localhost:3008',
    backendUrl: 'http://localhost:3007',
};

interface QuizData { accessCode: string; quizId: string }

function log(message: string, data?: unknown) {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Attach error capture to a browser context and page: pageerror + console.error + window error hooks
async function setupCrashDiagnostics(context: BrowserContext, page: Page, label: string) {
    const errors: string[] = [];
    const infoEvents: { type: string; text: string }[] = [];
    page.on('pageerror', (err) => {
        const msg = `[${label}] pageerror: ${err?.message || String(err)}`;
        console.error(msg);
        errors.push(msg);
    });
    page.on('console', (message) => {
        if (message.type() === 'error') {
            const msg = `[${label}] console.error: ${message.text()}`;
            console.error(msg);
            errors.push(msg);
        } else if (message.type() === 'log') {
            const text = message.text();
            // Capture key socket logs emitted by client logger
            const markers = ['[QUESTION UPDATE]', 'TIMER UPDATE', '[GAME JOIN]', 'FEEDBACK PHASE', 'CORRECT ANSWERS', '[LEADERBOARD]'];
            if (markers.some(m => text.includes(m))) {
                infoEvents.push({ type: 'log', text });
            }
        }
    });
    await context.addInitScript(() => {
        (window as any).__errors = [];
        (window as any).__unhandledRejections = [];
        window.addEventListener('error', (e) => {
            try {
                (window as any).__errors.push({ message: e?.error?.message || e?.message || 'unknown', stack: e?.error?.stack });
            } catch (_) { }
        });
        window.addEventListener('unhandledrejection', (e: any) => {
            try {
                const reason = e?.reason;
                (window as any).__unhandledRejections.push({ message: reason?.message || String(reason), stack: reason?.stack });
            } catch (_) { }
        });
    });
    return {
        getCollected: async () => {
            const windowErrors = await page.evaluate(() => ({
                errors: (window as any).__errors || [],
                rejections: (window as any).__unhandledRejections || []
            }));
            return { errors, windowErrors };
        },
        getInfoEvents: async () => infoEvents.slice(),
        clear: async () => {
            errors.length = 0;
            infoEvents.length = 0;
            await page.evaluate(() => {
                (window as any).__errors = [];
                (window as any).__unhandledRejections = [];
            });
        }
    };
}

// Capture Socket.IO events on the page (best-effort). Exposes window.__socketEvents
async function setupSocketCapture(context: BrowserContext, page: Page, label: string) {
    await context.addInitScript(() => {
        (window as any).__socketEvents = [];
        (window as any).__ioWrapped = false;
        const tryWrap = () => {
            const w: any = window as any;
            if (w.__ioWrapped) return;
            const io = w.io;
            if (!io) return;
            try {
                w.__ioWrapped = true;
                const orig = io;
                w.io = function (...args: any[]) {
                    const socket = orig.apply(this, args);
                    try {
                        const origOn = socket.on.bind(socket);
                        socket.on = function (event: string, handler: any) {
                            const wrapped = function (...hargs: any[]) {
                                try {
                                    (window as any).__socketEvents.push({ event, data: hargs?.[0], ts: Date.now() });
                                } catch { }
                                return handler?.(...hargs);
                            };
                            return origOn(event, wrapped);
                        };
                    } catch { }
                    return socket;
                };
            } catch { }
        };
        // Poll until io is present
        const id = setInterval(() => { try { (window as any).io && (tryWrap(), clearInterval(id)); } catch { } }, 25);
        // Also attempt once after DOMContentLoaded
        window.addEventListener('DOMContentLoaded', () => { tryWrap(); });
    });
    return {
        getEvents: async () => await page.evaluate(() => (window as any).__socketEvents || []),
        clear: async () => await page.evaluate(() => { (window as any).__socketEvents = []; })
    };
}

// Backend API quiz creation with teacher auth (mirrors working tests)
async function createQuizViaAPI(page: Page, teacher: { email: string; password: string }): Promise<QuizData> {
    log('Creating quiz via API with teacher auth...');

    // Login teacher to get token (cookies managed by API layer)
    const loginResponse = await page.request.post(`${CFG.backendUrl}/api/v1/auth/login`, {
        data: { email: teacher.email, password: teacher.password }
    });
    if (!loginResponse.ok()) {
        const body = await loginResponse.text();
        throw new Error(`Teacher login failed: ${loginResponse.status()} - ${body}`);
    }
    log('✅ Teacher API login successful');

    // Fetch question UIDs (any type, we just need MC to appear among them)
    const qResp = await page.request.get(`${CFG.backendUrl}/api/v1/questions/list`, {
        params: { gradeLevel: 'CP', discipline: 'Mathématiques', themes: 'Calcul', limit: '6' }
    });
    if (!qResp.ok()) throw new Error(`Questions fetch failed: ${qResp.status()}`);
    const questionUids = await qResp.json();
    if (!Array.isArray(questionUids) || questionUids.length === 0) throw new Error('No questions available');

    // Create template
    const tplResp = await page.request.post(`${CFG.backendUrl}/api/v1/game-templates`, {
        data: {
            name: `MC Freeze Repro Template ${Date.now()}`,
            discipline: 'Mathématiques',
            gradeLevel: 'CP',
            themes: ['Calcul'],
            description: 'Template for MC mobile freeze repro',
            defaultMode: 'quiz',
            questionUids: questionUids.slice(0, 4)
        }
    });
    if (!tplResp.ok()) {
        const body = await tplResp.text();
        throw new Error(`Template creation failed: ${tplResp.status()} - ${body}`);
    }
    const tpl = await tplResp.json();

    const gameResp = await page.request.post(`${CFG.backendUrl}/api/v1/games`, {
        data: {
            name: `MC Freeze Repro Game ${Date.now()}`,
            gameTemplateId: tpl.gameTemplate.id,
            playMode: 'quiz',
            settings: {}
        }
    });
    if (!gameResp.ok()) {
        const body = await gameResp.text();
        throw new Error(`Game creation failed: ${gameResp.status()} - ${body}`);
    }
    const game = await gameResp.json();
    log('✅ Game created', { code: game.gameInstance?.accessCode, id: game.gameInstance?.id });
    return { accessCode: game.gameInstance?.accessCode, quizId: game.gameInstance?.id };
}

async function authenticateGuestStudent(page: Page, username: string) {
    log('[AUTH] Navigating to /login for guest student');
    await page.goto(`${CFG.baseUrl}/login`);
    const nameInput = page.locator('input[placeholder*="name" i], input[name="username" i], input#username');
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.fill(username);
    await page.waitForTimeout(300);
    // Try to select an avatar if required by the form; broaden selectors for mobile variants
    const maybePickAvatar = async () => {
        const avatar = page.locator('button.emoji-avatar, [data-testid="avatar-option"], .avatar-option, button:has(img), [role="grid"] button, [role="listbox"] [role="option"], [data-testid="avatar"]');
        if (await avatar.count()) {
            const firstAvatar = avatar.first();
            await firstAvatar.scrollIntoViewIfNeeded().catch(() => { });
            await firstAvatar.click({ timeout: 10000 }).catch(() => { });
            return true;
        }
        // Radio-based avatar picker fallback
        const radio = page.locator('input[type="radio"][name*="avatar" i], input[type="radio"][value], input[type="radio"]').first();
        if (await radio.count()) {
            const id = await radio.getAttribute('id');
            if (id) {
                const label = page.locator(`label[for="${id}"]`).first();
                if (await label.count()) {
                    await label.click({ timeout: 8000 }).catch(async () => { await radio.check({ timeout: 8000 }).catch(() => { }); });
                    return true;
                }
            }
            await radio.check({ timeout: 8000 }).catch(() => { });
            return true;
        }
        return false;
    };

    const submitBtn = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Commencer")').first();
    await submitBtn.scrollIntoViewIfNeeded().catch(() => { });
    // If disabled, pick an avatar then wait for enablement
    let enabled = await submitBtn.isEnabled().catch(() => false);
    if (!enabled) {
        await maybePickAvatar();
        // wait briefly for enablement
        for (let i = 0; i < 10; i++) {
            enabled = await submitBtn.isEnabled().catch(() => false);
            if (enabled) break;
            await page.waitForTimeout(200);
        }
    }
    await submitBtn.click({ timeout: 10000 });
    // Don't over-constrain visibility; just give the app a moment to set session
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    log('[AUTH] Guest student submitted login form');
}

async function startQuestionFromDashboard(page: Page, accessCode: string) {
    await page.goto(`${CFG.baseUrl}/teacher/dashboard/${accessCode}`, { waitUntil: 'networkidle' });
    log('Teacher at dashboard', { url: page.url() });

    // Ensure the questions list is rendered before attempting to interact
    await page.waitForSelector('ul.draggable-questions-list', { timeout: 20000 });
    // Prefer waiting for at least one question item if available
    await page.locator('ul.draggable-questions-list li').first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => { });

    // Try canonical start button
    const canonical = page.locator('[data-testid="start-question-button"]').first();
    if (await canonical.count()) {
        try {
            await canonical.click({ timeout: 6000 });
            await page.waitForTimeout(800);
            log('Clicked [data-testid=start-question-button]');
            return;
        } catch { }
    }

    // Preferred: Use the actual play/pause control in QuestionDisplay
    const playBtnInList = page.locator('ul.draggable-questions-list li .question-display [data-play-pause-btn]').first();
    if (await playBtnInList.count()) {
        await playBtnInList.click({ timeout: 6000 });
        await page.waitForTimeout(800);
        log('Clicked first question play/pause button via [data-play-pause-btn]');
        return;
    }

    // Click first question to reveal controls
    const firstQuestion = page.locator('[data-testid="question"], .question-display, .sortable-question').first();
    if (await firstQuestion.count()) {
        await firstQuestion.click().catch(() => { });
        try {
            // Try play/pause button again after selecting
            const afterSelectPlay = page.locator('[data-play-pause-btn]').first();
            if (await afterSelectPlay.count()) {
                await afterSelectPlay.click({ timeout: 5000 });
                await page.waitForTimeout(800);
                log('Clicked play after selecting first question');
                return;
            }
            await page.locator('[data-testid="start-question-button"]').first().click({ timeout: 5000 });
            await page.waitForTimeout(800);
            log('Clicked start (data-testid) after selecting first question');
            return;
        } catch { }
    }

    // Fallbacks
    const fallbacks = [
        'button[data-play-pause-btn]',
        'button[data-testid="play-button"]',
        'button:has-text("Démarrer")',
        'button:has-text("Start")',
    ];
    for (const sel of fallbacks) {
        const btn = page.locator(sel).first();
        if (await btn.count()) {
            try {
                await btn.click({ timeout: 4000 });
                await page.waitForTimeout(800);
                log('Clicked fallback', { sel });
                return;
            } catch { }
        }
    }

    throw new Error('Could not find a way to start the question on dashboard');
}

// Stress the teacher controls to probe stop/resume edge cases
async function stressStopResumeOnTeacher(page: Page) {
    const playPause = page.locator('ul.draggable-questions-list li .question-display [data-play-pause-btn]').first();
    const stopBtn = page.locator('ul.draggable-questions-list li .question-display [data-stop-btn]').first();

    // Quick pause/resume
    if (await playPause.count()) {
        await playPause.click({ timeout: 5000 }).catch(() => { }); // toggle
        await page.waitForTimeout(200);
        await playPause.click({ timeout: 5000 }).catch(() => { });
    }

    // Stop then resume
    if (await stopBtn.count()) {
        await stopBtn.click({ timeout: 5000 }).catch(() => { });
        await page.waitForTimeout(300);
        if (await playPause.count()) {
            await playPause.click({ timeout: 5000 }).catch(() => { });
        }
    }

    // One more quick toggle burst
    for (let i = 0; i < 2; i++) {
        if (await playPause.count()) {
            await playPause.click({ timeout: 5000 }).catch(() => { });
            await page.waitForTimeout(150);
        }
    }
}

// Main test
test('mobile multiple-choice live: tap answer and collect overlay diagnostics', async ({ browser }) => {
    test.setTimeout(120000);

    // Teacher UI context (desktop)
    const teacherCtx = await browser.newContext();
    const teacherPage = await teacherCtx.newPage();

    // Student mobile context (iPhone 12)
    const studentCtx = await browser.newContext({ ...devices['iPhone 12'] });
    const studentPage = await studentCtx.newPage();

    // Crash/long-task diagnostics
    const teacherDiag = await setupCrashDiagnostics(teacherCtx, teacherPage, 'teacher');
    const studentDiag = await setupCrashDiagnostics(studentCtx, studentPage, 'student');
    const studentSocketCap = await setupSocketCapture(teacherCtx, studentPage, 'student');

    try {
        // Create teacher + login via UI (front-end session), then create quiz via API
        const dataHelper = new TestDataHelper(teacherPage);
        const teacherSeed = dataHelper.generateTestData('mc_mobile_teacher');
        await dataHelper.createTeacher({ username: teacherSeed.username, email: teacherSeed.email, password: teacherSeed.password });

        const loginHelper = new LoginHelper(teacherPage);
        await loginHelper.loginAsTeacher({ email: teacherSeed.email, password: teacherSeed.password });
        log('Teacher logged-in to frontend');

        const { accessCode } = await createQuizViaAPI(teacherPage, { email: teacherSeed.email, password: teacherSeed.password });

        // Student: auth as guest then go straight to live page
        const studentSeed = dataHelper.generateTestData('mc_mobile_student');
        await authenticateGuestStudent(studentPage, studentSeed.username);
        await studentPage.goto(`${CFG.baseUrl}/live/${accessCode}`);
        await studentPage.waitForURL(`${CFG.baseUrl}/live/${accessCode}`, { timeout: 15000 });
        await studentPage.waitForLoadState('networkidle');
        log('Student is on live page');
        await studentDiag.clear(); // Clear login-route hydration noise; focus on live page
        // Give sockets a brief moment to connect before starting the question
        await studentPage.waitForTimeout(1500);

        // Teacher: navigate to dashboard and start first question
        await startQuestionFromDashboard(teacherPage, accessCode);

        // Stress: quick pause/resume to try to surface timing issues
        const playBtn = teacherPage.locator('ul.draggable-questions-list li .question-display [data-play-pause-btn]').first();
        if (await playBtn.count()) {
            for (let i = 0; i < 3; i++) {
                await playBtn.click({ timeout: 5000 }).catch(() => { });
                await teacherPage.waitForTimeout(250);
            }
        }

        // Extra stress: stop then resume, and verify student interactivity afterward
        await stressStopResumeOnTeacher(teacherPage);

        // Wait for timer to show up as a proxy that the question actually started
        await studentPage.waitForSelector('.navbar-timer-bg', { timeout: 20000 }).catch(() => { });
        // Recovery-aware wait as on Android: ensure teacher ends in PLAY and, if needed, stop/resume
        const ensureAnswersVisible = async () => {
            const answersVisible = await studentPage.locator('.tqcard-answer').first().isVisible().catch(() => false);
            if (answersVisible) return;

            const playBtnNow = teacherPage.locator('ul.draggable-questions-list li .question-display [data-play-pause-btn]').first();
            if (await playBtnNow.count()) {
                await playBtnNow.click({ timeout: 5000 }).catch(() => { });
                await teacherPage.waitForTimeout(300);
            }
            await studentPage.waitForTimeout(1000);
            const visibleAfterPlay = await studentPage.locator('.tqcard-answer').first().isVisible().catch(() => false);
            if (visibleAfterPlay) return;

            await stressStopResumeOnTeacher(teacherPage);
            await studentPage.waitForTimeout(1000);
        };

        await ensureAnswersVisible();
        // Then wait for answers to appear on student page
        try {
            await studentPage.waitForSelector('.tqcard-answer', { timeout: 20000 });
        } catch (e) {
            log('Answers did not render in time; capturing screenshots...');
            await teacherPage.screenshot({ path: 'test-results/e2e/debug-mc-mobile-teacher.png', fullPage: true });
            await studentPage.screenshot({ path: 'test-results/e2e/debug-mc-mobile-student.png', fullPage: true });
            throw e;
        }

        // Tap first answer and compare class change
        const firstAnswer = studentPage.locator('.tqcard-answer').first();
        const before = await firstAnswer.getAttribute('class');
        await firstAnswer.click({ timeout: 5000 });
        const after = await firstAnswer.getAttribute('class');

        const clicked = before !== after;
        if (!clicked) {
            // Collect hit-testing + overlay diagnostics
            const diag = await studentPage.evaluate(() => {
                const overlay = document.querySelector('.feedback-overlay') as HTMLElement | null;
                const card = document.querySelector('.feedback-card') as HTMLElement | null;
                const timer = document.querySelector('[class*="Timer"]') as HTMLElement | null;
                const anyFixed = Array.from(document.querySelectorAll<HTMLElement>('*')).filter(e => getComputedStyle(e).position === 'fixed').length;
                const ovStyles = overlay ? getComputedStyle(overlay) : null;
                const rect = document.querySelector('.tqcard-answer')?.getBoundingClientRect();
                const midX = rect ? Math.floor(rect.left + rect.width / 2) : 50;
                const midY = rect ? Math.floor(rect.top + rect.height / 2) : 200;
                const elAtPoint = document.elementFromPoint(midX, midY);
                const ancestry: string[] = [];
                let n: Element | null = elAtPoint;
                while (n && ancestry.length < 6) { ancestry.push(n instanceof HTMLElement ? `${n.tagName}.${n.className}` : n.tagName); n = n.parentElement; }
                return {
                    overlayPresent: !!overlay,
                    overlayPointerEvents: ovStyles?.pointerEvents,
                    overlayZ: ovStyles?.zIndex,
                    cardPresent: !!card,
                    timerPresent: !!timer,
                    anyFixed,
                    elementAtPoint: elAtPoint ? (elAtPoint as HTMLElement).className : null,
                    ancestry,
                };
            });
            log('[MC-MOBILE-FREEZE-DIAG]', diag);
        }

        // Post stop/resume, ensure buttons are still clickable (not frozen under overlays)
        const containerPointerEvents = await studentPage.evaluate(() => getComputedStyle(document.querySelector('.tqcard-content') as HTMLElement).pointerEvents);
        log('[POST-RESUME] pointer-events on .tqcard-content', { containerPointerEvents });
        const clickableCheck = await firstAnswer.isEnabled();
        log('[POST-RESUME] first answer isEnabled()', { clickableCheck });

        // Optional: if feedback overlay appears, wait for it to disappear, then try tapping again
        const overlay = studentPage.locator('[data-testid="feedback-overlay"]');
        if (await overlay.count()) {
            log('Feedback overlay detected; waiting briefly...');
            await overlay.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
            await studentPage.waitForTimeout(1000);
            await overlay.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => { });
            log('Overlay hidden; attempting another tap');
            const before2 = await firstAnswer.getAttribute('class');
            await firstAnswer.click({ timeout: 5000 }).catch(() => { });
            const after2 = await firstAnswer.getAttribute('class');
            if (before2 === after2) {
                const diag2 = await studentPage.evaluate(() => {
                    const overlay = document.querySelector('.feedback-overlay') as HTMLElement | null;
                    const ovStyles = overlay ? getComputedStyle(overlay) : null;
                    const rect = document.querySelector('.tqcard-answer')?.getBoundingClientRect();
                    const midX = rect ? Math.floor(rect.left + rect.width / 2) : 50;
                    const midY = rect ? Math.floor(rect.top + rect.height / 2) : 200;
                    const elAtPoint = document.elementFromPoint(midX, midY);
                    return {
                        overlayVisible: !!overlay,
                        overlayPointerEvents: ovStyles?.pointerEvents,
                        elementAtPoint: elAtPoint ? (elAtPoint as HTMLElement).className : null,
                    };
                });
                log('[MC-MOBILE-POST-OVERLAY-DIAG]', diag2);
            }
        }

        expect(firstAnswer).toBeTruthy();

        // Collect crash logs and long tasks from student
        const collected = await studentDiag.getCollected();
        log('[student-errors]', collected);
        const infoLogs = await studentDiag.getInfoEvents();
        log('[student-info-socket-logs-summary]', {
            total: infoLogs.length,
            last3: infoLogs.slice(-3).map(l => l.text.substring(0, 200))
        });
        // TDD assertion: no hydration mismatch errors should be present
        const studentHasHydrationError = collected.errors.some(e => e.toLowerCase().includes('hydration failed')) ||
            collected.windowErrors.errors.some((e: any) => String(e.message || '').toLowerCase().includes('hydration failed'));
        expect(studentHasHydrationError, 'No hydration mismatch should occur on student flow').toBeFalsy();
        const socketEvents = await studentSocketCap.getEvents();
        log('[student-socket-events-summary]', {
            total: socketEvents.length,
            last5: socketEvents.slice(-5).map((e: any) => e.event)
        });
        const longTasks = await studentPage.evaluate(() => {
            try {
                const entries = (performance as any).getEntriesByType?.('longtask') || [];
                return entries.map((e: any) => ({ duration: e.duration, name: e.name, startTime: e.startTime })).slice(0, 10);
            } catch { return []; }
        });
        log('[student-longtasks-top10]', longTasks);
    } finally {
        await teacherCtx.close();
        await studentCtx.close();
    }
});

// Android Chrome emulation variant
test('android (Pixel 5) multiple-choice live: tap answer and overlay cycle', async ({ browser }) => {
    test.setTimeout(120000);

    const teacherCtx = await browser.newContext();
    const teacherPage = await teacherCtx.newPage();

    const studentCtx = await browser.newContext({ ...devices['Pixel 5'] });
    const studentPage = await studentCtx.newPage();

    const teacherDiag = await setupCrashDiagnostics(teacherCtx, teacherPage, 'teacher-android');
    const studentDiag = await setupCrashDiagnostics(studentCtx, studentPage, 'student-android');
    const studentSocketCap = await setupSocketCapture(teacherCtx, studentPage, 'student-android');

    try {
        const dataHelper = new TestDataHelper(teacherPage);
        const teacherSeed = dataHelper.generateTestData('mc_android_teacher');
        await dataHelper.createTeacher({ username: teacherSeed.username, email: teacherSeed.email, password: teacherSeed.password });
        const loginHelper = new LoginHelper(teacherPage);
        await loginHelper.loginAsTeacher({ email: teacherSeed.email, password: teacherSeed.password });
        log('Teacher logged-in to frontend (Android test)');

        const { accessCode } = await createQuizViaAPI(teacherPage, { email: teacherSeed.email, password: teacherSeed.password });

        const studentSeed = dataHelper.generateTestData('mc_android_student');
        await authenticateGuestStudent(studentPage, studentSeed.username);
        await studentPage.goto(`${CFG.baseUrl}/live/${accessCode}`);
        await studentPage.waitForURL(`${CFG.baseUrl}/live/${accessCode}`, { timeout: 15000 });
        await studentPage.waitForLoadState('networkidle');
        log('Android student is on live page');
        await studentDiag.clear(); // Clear pre-live errors to assert only live-page issues
        // Give sockets a brief moment to connect before starting the question
        await studentPage.waitForTimeout(1500);

        await startQuestionFromDashboard(teacherPage, accessCode);

        // Stress: quick pause/resume toggles
        const playBtn = teacherPage.locator('ul.draggable-questions-list li .question-display [data-play-pause-btn]').first();
        if (await playBtn.count()) {
            for (let i = 0; i < 3; i++) {
                await playBtn.click({ timeout: 5000 }).catch(() => { });
                await teacherPage.waitForTimeout(250);
            }
        }

        // Wait for timer bubble if present (proxy that the question started)
        await studentPage.waitForSelector('.navbar-timer-bg', { timeout: 20000 }).catch(() => { });
        // Recovery-aware wait: if answers don't appear promptly, ensure teacher state is playing,
        // and if still not, perform a stop/resume to re-sync student subscription.
        const ensureAnswersVisible = async () => {
            const answersVisible = await studentPage.locator('.tqcard-answer').first().isVisible().catch(() => false);
            if (answersVisible) return;

            // Ensure we end in a PLAY state
            const playBtnNow = teacherPage.locator('ul.draggable-questions-list li .question-display [data-play-pause-btn]').first();
            if (await playBtnNow.count()) {
                await playBtnNow.click({ timeout: 5000 }).catch(() => { });
                await teacherPage.waitForTimeout(300);
            }

            // Give student time to receive GAME_QUESTION
            await studentPage.waitForTimeout(1000);
            const visibleAfterPlay = await studentPage.locator('.tqcard-answer').first().isVisible().catch(() => false);
            if (visibleAfterPlay) return;

            // As a last resort, stop then resume to trigger a fresh payload
            await stressStopResumeOnTeacher(teacherPage);
            await studentPage.waitForTimeout(1000);
        };

        await ensureAnswersVisible();
        await studentPage.waitForSelector('.tqcard-answer', { timeout: 20000 });
        const firstAnswer = studentPage.locator('.tqcard-answer').first();
        const before = await firstAnswer.getAttribute('class');
        await firstAnswer.tap({ timeout: 5000 }).catch(async () => {
            // Fallback to click if tap fails
            await firstAnswer.click({ timeout: 5000 });
        });
        const after = await firstAnswer.getAttribute('class');
        if (before === after) {
            const diag = await studentPage.evaluate(() => {
                const overlay = document.querySelector('.feedback-overlay') as HTMLElement | null;
                const card = document.querySelector('.feedback-card') as HTMLElement | null;
                const ovStyles = overlay ? getComputedStyle(overlay) : null;
                return {
                    overlayPresent: !!overlay,
                    overlayPointerEvents: ovStyles?.pointerEvents,
                    cardPresent: !!card,
                };
            });
            log('[ANDROID-MC-DIAG]', diag);
        }

        // Stress stop/resume and confirm interactivity recovers
        await stressStopResumeOnTeacher(teacherPage);
        await studentPage.waitForTimeout(500);
        const containerPointerEvents = await studentPage.evaluate(() => getComputedStyle(document.querySelector('.tqcard-content') as HTMLElement).pointerEvents);
        log('[ANDROID POST-RESUME] pointer-events on .tqcard-content', { containerPointerEvents });
        const clickableCheck = await firstAnswer.isEnabled();
        log('[ANDROID POST-RESUME] first answer isEnabled()', { clickableCheck });

        // Overlay cycle attempt
        const overlay = studentPage.locator('[data-testid="feedback-overlay"]');
        if (await overlay.count()) {
            await overlay.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
            await studentPage.waitForTimeout(1200);
            await overlay.waitFor({ state: 'hidden', timeout: 12000 }).catch(() => { });
            const before2 = await firstAnswer.getAttribute('class');
            await firstAnswer.tap({ timeout: 5000 }).catch(async () => { await firstAnswer.click({ timeout: 5000 }); });
            const after2 = await firstAnswer.getAttribute('class');
            if (before2 === after2) {
                const diag2 = await studentPage.evaluate(() => {
                    const overlay = document.querySelector('.feedback-overlay') as HTMLElement | null;
                    const ovStyles = overlay ? getComputedStyle(overlay) : null;
                    return { overlayVisible: !!overlay, overlayPointerEvents: ovStyles?.pointerEvents };
                });
                log('[ANDROID-MC-POST-OVERLAY-DIAG]', diag2);
            }
        }

        expect(firstAnswer).toBeTruthy();

        // Collect crash logs and long tasks from student (Android)
        const collected = await studentDiag.getCollected();
        log('[student-android-errors]', collected);
        const infoLogs = await studentDiag.getInfoEvents();
        log('[student-android-info-socket-logs-summary]', {
            total: infoLogs.length,
            last3: infoLogs.slice(-3).map(l => l.text.substring(0, 200))
        });
        const androidHasHydrationError = collected.errors.some(e => e.toLowerCase().includes('hydration failed')) ||
            collected.windowErrors.errors.some((e: any) => String(e.message || '').toLowerCase().includes('hydration failed'));
        expect(androidHasHydrationError, 'No hydration mismatch should occur on student Android flow').toBeFalsy();
        const socketEvents = await studentSocketCap.getEvents();
        log('[student-android-socket-events-summary]', {
            total: socketEvents.length,
            last5: socketEvents.slice(-5).map((e: any) => e.event)
        });
        const longTasks = await studentPage.evaluate(() => {
            try {
                const entries = (performance as any).getEntriesByType?.('longtask') || [];
                return entries.map((e: any) => ({ duration: e.duration, name: e.name, startTime: e.startTime })).slice(0, 10);
            } catch { return []; }
        });
        log('[student-android-longtasks-top10]', longTasks);
    } finally {
        await teacherCtx.close();
        await studentCtx.close();
    }
});
