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

// Helper: fetch question UIDs of a given type by combining public list + backend question details
async function getQuestionUidsByType(page: Page, questionType: 'numeric' | 'single' | 'multiple', count = 1): Promise<string[]> {
    const listResp = await page.request.get('/api/questions/list', {
        params: { limit: '50', gradeLevel: 'CP', discipline: 'Mathématiques', themes: 'Calcul' }
    });
    if (!listResp.ok()) throw new Error(`Failed to fetch question list: ${listResp.status()}`);
    const uids: string[] = await listResp.json();
    const picked: string[] = [];
    for (const uid of uids) {
        try {
            const detail = await page.request.get(`${CFG.backendUrl}/api/v1/questions/${uid}`);
            if (!detail.ok()) continue;
            const { question } = await detail.json();
            const qt = String(question?.questionType || '').toLowerCase();
            const isNumeric = qt.includes('numeric');
            const isSingle = qt.includes('single');
            const isMultiple = qt.includes('multiple') && !isSingle;
            if ((questionType === 'numeric' && isNumeric) || (questionType === 'single' && isSingle) || (questionType === 'multiple' && isMultiple)) {
                picked.push(uid);
                if (picked.length >= count) break;
            }
        } catch { /* ignore */ }
    }
    return picked;
}

// Helper: create game template and instance from explicit UIDs
async function createGameFromUids(page: Page, uids: string[]): Promise<QuizData> {
    if (!uids.length) throw new Error('No question UIDs provided');
    const tplResp = await page.request.post('/api/game-templates', {
        data: {
            name: `Revert Test Template ${Date.now()}`,
            gradeLevel: 'CP', discipline: 'Mathématiques', themes: ['Calcul'],
            questionUids: uids,
            description: 'Template for late-revert tests',
            defaultMode: 'quiz'
        }
    });
    if (!tplResp.ok()) throw new Error(`Template creation failed: ${tplResp.status()} - ${await tplResp.text()}`);
    const tpl = await tplResp.json();
    const gameResp = await page.request.post('/api/games', {
        data: {
            name: `Revert Test Game ${Date.now()}`,
            gameTemplateId: tpl.gameTemplate.id,
            playMode: 'quiz',
            settings: {}
        }
    });
    if (!gameResp.ok()) throw new Error(`Game creation failed: ${gameResp.status()} - ${await gameResp.text()}`);
    const game = await gameResp.json();
    return { accessCode: game.gameInstance?.accessCode, quizId: game.gameInstance?.id };
}

// Helper: try to create a game with a specific UID; fallback to multiple_choice if it fails
async function tryCreateGameWithSpecificUid(page: Page, uid: string): Promise<QuizData | null> {
    try {
        const tplResp = await page.request.post('/api/game-templates', {
            data: {
                name: `Specific UID Template ${Date.now()}`,
                gradeLevel: 'L1', discipline: 'Mathématiques', themes: ['Ensembles et applications'],
                questionUids: [uid], description: 'Template for specific UID test', defaultMode: 'quiz'
            }
        });
        if (!tplResp.ok()) {
            log(`[tryCreateGameWithSpecificUid] Template creation failed`, { status: tplResp.status(), text: await tplResp.text() });
            return null;
        }
        const tpl = await tplResp.json();
        const gameResp = await page.request.post('/api/games', {
            data: {
                name: `Specific UID Game ${Date.now()}`,
                gameTemplateId: tpl.gameTemplate.id,
                playMode: 'quiz', settings: {}
            }
        });
        if (!gameResp.ok()) {
            log(`[tryCreateGameWithSpecificUid] Game creation failed`, { status: gameResp.status(), text: await gameResp.text() });
            return null;
        }
        const game = await gameResp.json();
        return { accessCode: game.gameInstance?.accessCode, quizId: game.gameInstance?.id };
    } catch (e: any) {
        log('[tryCreateGameWithSpecificUid] exception', { error: e?.message || String(e) });
        return null;
    }
}

// Teacher-auth only: create a quiz with questions filtered by questionType using the teacher endpoint
async function createQuizByType(teacherPage: Page, questionType: 'multiple_choice' | 'numeric' | 'single_choice', count = 1): Promise<QuizData> {
    log(`[createQuizByType] Fetching ${questionType} questions via teacher endpoint...`);
    const qResp = await teacherPage.request.get('/api/questions', {
        params: { questionType, limit: String(Math.max(count, 4)) }
    });
    if (!qResp.ok()) throw new Error(`Teacher questions fetch failed: ${qResp.status()} - ${await qResp.text()}`);
    const qJson = await qResp.json();
    const questions = Array.isArray(qJson?.questions) ? qJson.questions : (qJson?.data?.questions || []);
    if (!questions.length) throw new Error(`No questions found for type ${questionType}`);
    const uids: string[] = questions.map((q: any) => q.uid).filter(Boolean).slice(0, Math.max(count, 4));

    const tplResp = await teacherPage.request.post('/api/game-templates', {
        data: {
            name: `Revert Test Template (${questionType}) ${Date.now()}`,
            gradeLevel: 'CP',
            discipline: 'Mathématiques',
            themes: ['Calcul'],
            questionUids: uids,
            description: `Template for ${questionType} late-revert test`,
            defaultMode: 'quiz'
        }
    });
    if (!tplResp.ok()) throw new Error(`Template creation failed: ${tplResp.status()} - ${await tplResp.text()}`);
    const tpl = await tplResp.json();

    const gameResp = await teacherPage.request.post('/api/games', {
        data: {
            name: `Revert Test Game (${questionType}) ${Date.now()}`,
            gameTemplateId: tpl.gameTemplate.id,
            playMode: 'quiz',
            settings: {}
        }
    });
    if (!gameResp.ok()) throw new Error(`Game creation failed: ${gameResp.status()} - ${await gameResp.text()}`);
    const game = await gameResp.json();
    log(`[createQuizByType] ✅ Game created (${questionType})`, { code: game.gameInstance?.accessCode, id: game.gameInstance?.id });
    return { accessCode: game.gameInstance?.accessCode, quizId: game.gameInstance?.id };
}

// Poll backend debug endpoint to confirm Socket.IO room membership for the student
async function waitForServerRoomJoin(page: Page, accessCode: string, timeoutMs = 15000) {
    const start = Date.now();
    for (; ;) {
        try {
            // Try backend directly to avoid Next.js API route collisions
            const resp = await page.request.get(`${CFG.backendUrl}/api/v1/debug/sockets/${accessCode}`);
            if (resp.ok()) {
                const json = await resp.json();
                const count = json?.rooms?.game?.socketIds?.length ?? 0;
                log('[SERVER-ROOM-JOIN]', { accessCode, gameRoom: json?.rooms?.game?.name, count });
                if (count > 0) return;
            } else {
                // If the debug endpoint isn't available in this environment (e.g., 404), don't block the test
                const status = resp.status();
                log('[SERVER-ROOM-JOIN] debug endpoint failed', { status });
                if (status === 404 || status === 501) {
                    return; // best-effort only
                }
            }
        } catch (e: any) {
            log('[SERVER-ROOM-JOIN] error', { error: e?.message || String(e) });
        }
        if (Date.now() - start > timeoutMs) break;
        await page.waitForTimeout(250);
    }
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
        } else if (message.type() === 'log' || message.type() === 'info') {
            const text = message.text();
            // Capture key socket logs emitted by client logger
            const markers = ['[QUESTION UPDATE]', 'TIMER UPDATE', '[GAME JOIN]', 'FEEDBACK PHASE', 'CORRECT ANSWERS', '[LEADERBOARD]'];
            if (markers.some(m => text.includes(m))) {
                infoEvents.push({ type: message.type(), text });
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
        (window as any).__transportEvents = [];
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
        // Patch WebSocket to observe low-level transport closes (when socket.io uses ws)
        try {
            const NativeWS = (window as any).WebSocket;
            if (NativeWS && !((window as any).__wsPatched)) {
                (window as any).__wsPatched = true;
                (window as any).WebSocket = function (...args: any[]) {
                    const ws = new NativeWS(...args);
                    try {
                        ws.addEventListener('close', (ev: any) => {
                            try { (window as any).__transportEvents.push({ type: 'ws-close', code: ev?.code, reason: ev?.reason, ts: Date.now() }); } catch { }
                        });
                        ws.addEventListener('error', (ev: any) => {
                            try { (window as any).__transportEvents.push({ type: 'ws-error', ts: Date.now() }); } catch { }
                        });
                    } catch { }
                    return ws;
                } as any;
                (window as any).WebSocket.prototype = NativeWS.prototype;
            }
        } catch { }
        // Patch EventSource (fallback transport)
        try {
            const NativeES = (window as any).EventSource;
            if (NativeES && !((window as any).__esPatched)) {
                (window as any).__esPatched = true;
                (window as any).EventSource = function (...args: any[]) {
                    const es = new NativeES(...args);
                    try {
                        es.addEventListener('error', () => {
                            try { (window as any).__transportEvents.push({ type: 'es-error', ts: Date.now() }); } catch { }
                        });
                    } catch { }
                    return es;
                } as any;
                (window as any).EventSource.prototype = NativeES.prototype;
            }
        } catch { }
        // Poll until io is present
        const id = setInterval(() => { try { (window as any).io && (tryWrap(), clearInterval(id)); } catch { } }, 25);
        // Also attempt once after DOMContentLoaded
        window.addEventListener('DOMContentLoaded', () => { tryWrap(); });
    });
    return {
        getEvents: async () => await page.evaluate(() => (window as any).__socketEvents || []),
        getTransportEvents: async () => await page.evaluate(() => (window as any).__transportEvents || []),
        clear: async () => await page.evaluate(() => { (window as any).__socketEvents = []; })
    };
}

// Working, UI-driven teacher auth + browser-fetch game creation (copied from live-quiz-flow.spec.ts pattern)
async function authenticateTeacherGuest(page: Page): Promise<void> {
    log('Authenticating teacher as guest via UI...');
    await page.goto(`${CFG.baseUrl}/login`);
    await page.waitForLoadState('networkidle');
    const usernameInput = page.locator('input[placeholder*="name" i], input[name="username" i], input#username').first();
    await usernameInput.waitFor({ timeout: 10000 });
    await usernameInput.fill('Pierre');
    await page.waitForTimeout(500);
    await page.locator('body').click({ position: { x: 10, y: 10 } }).catch(() => { });
    await page.waitForTimeout(200);
    const avatarButton = page.locator('button.emoji-avatar').first();
    if (await avatarButton.count()) { await avatarButton.click().catch(() => { }); }
    const submitButton = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter"), button:has-text("Login"), button:has-text("Commencer")').first();
    await submitButton.click();
    await page.waitForSelector('[data-testid="user-profile"], nav, header', { timeout: 15000 });
    log('✅ Teacher guest auth complete');
}

// Ensure a frontend-domain session cookie by calling the Next.js proxy directly
async function ensureFrontendSessionCookie(page: Page, username = 'Pierre'): Promise<void> {
    if (!page.url().startsWith(CFG.baseUrl)) {
        await page.goto(`${CFG.baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    }
    const cookieId = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const resp = await page.evaluate(async (payload) => {
        try {
            const r = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });
            const data = await r.json().catch(() => ({}));
            return { ok: r.ok, status: r.status, data };
        } catch (e: any) { return { ok: false, status: 0, error: e?.message || String(e) }; }
    }, { username, cookieId, role: 'STUDENT', avatar: '🐼' });
    log(`[ensureFrontendSessionCookie] register via proxy -> ${JSON.stringify(resp)}`);
    // Verify cookie present
    const cookieInfo = await page.evaluate(async () => (await fetch('/api/debug-cookies', { credentials: 'include' })).json());
    log(`[ensureFrontendSessionCookie] cookie-debug ${JSON.stringify(cookieInfo)}`);
}

async function createQuizViaBrowserFetch(page: Page): Promise<QuizData> {
    log('Creating quiz via browser fetch with session cookies...');
    // Debug: show cookies visible to frontend API
    try {
        const cookieInfo = await page.evaluate(async () => {
            const r = await fetch('/api/debug-cookies', { credentials: 'include' });
            return r.ok ? r.json() : { error: 'no-cookies' };
        });
        log(`[cookie-debug] ${JSON.stringify(cookieInfo)}`);
    } catch { }
    // Fetch questions (copied pattern from working suite)
    const questionsResponse = await page.evaluate(async () => {
        try {
            const result = await fetch('/api/questions/list?gradeLevel=CP&discipline=Mathématiques&themes=Calcul&limit=6', {
                method: 'GET',
                credentials: 'include'
            });
            if (!result.ok) {
                const text = await result.text();
                return { success: false, error: `${result.status} - ${text}` };
            }
            const data = await result.json();
            return { success: true, data };
        } catch (e: any) {
            return { success: false, error: e?.message || String(e) };
        }
    });
    log(`Questions API response: ${JSON.stringify(questionsResponse)}`);
    if (!questionsResponse.success) throw new Error(`Failed to get questions: ${questionsResponse.error}`);
    const questionUids: string[] = Array.isArray(questionsResponse.data) ? questionsResponse.data.slice(0, 4) : [];
    if (!questionUids.length) throw new Error('No questions available');

    // Create template
    const templateResp = await page.evaluate(async (data) => {
        try {
            const ctrl = new AbortController();
            const to = setTimeout(() => ctrl.abort('template-timeout'), 12000);
            const result = await fetch('/api/game-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include',
                signal: ctrl.signal
            });
            clearTimeout(to);
            if (!result.ok) {
                const text = await result.text();
                return { success: false, error: `${result.status} - ${text}` };
            }
            const json = await result.json();
            return { success: true, data: json };
        } catch (e: any) { return { success: false, error: e?.message || String(e) }; }
    }, { name: `MC Freeze Repro Template ${Date.now()}`, gradeLevel: 'CP', discipline: 'Mathématiques', themes: ['Calcul'], questionUids, description: 'Template for MC mobile freeze repro', defaultMode: 'quiz' });
    log(`Template creation API response: ${JSON.stringify(templateResp)}`);
    if (!templateResp.success) throw new Error(`Failed to create template: ${templateResp.error}`);

    // Create game
    const gameResp = await page.evaluate(async (tplId) => {
        try {
            const ctrl = new AbortController();
            const to = setTimeout(() => ctrl.abort('game-timeout'), 12000);
            const result = await fetch('/api/games', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: `MC Freeze Repro Game ${Date.now()}`, playMode: 'quiz', gameTemplateId: tplId, settings: {} }),
                credentials: 'include',
                signal: ctrl.signal
            });
            clearTimeout(to);
            if (!result.ok) {
                const text = await result.text();
                return { success: false, error: `${result.status} - ${text}` };
            }
            const json = await result.json();
            return { success: true, data: json };
        } catch (e: any) { return { success: false, error: e?.message || String(e) }; }
    }, (templateResp as any).data.gameTemplate.id);
    log(`Game creation API response: ${JSON.stringify(gameResp)}`);
    if (!gameResp.success) throw new Error(`Failed to create game: ${gameResp.error}`);

    const game = (gameResp as any).data;
    log('✅ Game created', { code: game.gameInstance?.accessCode, id: game.gameInstance?.id });
    return { accessCode: game.gameInstance?.accessCode, quizId: game.gameInstance?.id };
}

// Create via frontend API using page.request like working tests
async function createQuizViaFrontendApi(page: Page): Promise<QuizData> {
    log('Creating quiz via frontend API...');
    const qResp = await page.request.get('/api/questions/list', {
        params: { gradeLevel: 'CP', discipline: 'Mathématiques', themes: 'Calcul', limit: '6' }
    });
    if (!qResp.ok()) throw new Error(`Questions fetch failed: ${qResp.status()}`);
    const questionUids = await qResp.json();
    const selected = Array.isArray(questionUids) ? questionUids.slice(0, 4) : [];
    if (!selected.length) throw new Error('No questions available');

    const tplResp = await page.request.post('/api/game-templates', {
        data: {
            name: `MC Freeze Repro Template ${Date.now()}`,
            gradeLevel: 'CP',
            discipline: 'Mathématiques',
            themes: ['Calcul'],
            questionUids: selected,
            description: 'Template for MC mobile freeze repro',
            defaultMode: 'quiz'
        }
    });
    if (!tplResp.ok()) throw new Error(`Template creation failed: ${tplResp.status()} - ${await tplResp.text()}`);
    const tpl = await tplResp.json();

    const gameResp = await page.request.post('/api/games', {
        data: {
            name: `MC Freeze Repro Game ${Date.now()}`,
            gameTemplateId: tpl.gameTemplate.id,
            playMode: 'quiz',
            settings: {}
        }
    });
    if (!gameResp.ok()) throw new Error(`Game creation failed: ${gameResp.status()} - ${await gameResp.text()}`);
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
        for (let i = 0; i < 25; i++) {
            enabled = await submitBtn.isEnabled().catch(() => false);
            if (enabled) break;
            await page.waitForTimeout(200);
        }
        if (!enabled) {
            // Brute-force: try clicking any avatar-like control again
            const anyAvatarBtn = page.locator('[role="grid"] button, [role="listbox"] [role="option"], .avatar-option button, .emoji-avatar').first();
            if (await anyAvatarBtn.count()) {
                await anyAvatarBtn.click({ timeout: 5000 }).catch(() => { });
                for (let i = 0; i < 10; i++) {
                    enabled = await submitBtn.isEnabled().catch(() => false);
                    if (enabled) break;
                    await page.waitForTimeout(200);
                }
            }
            if (!enabled) {
                // Final fallback: press Enter to submit the form if possible
                await page.keyboard.press('Enter').catch(() => { });
            }
        }
    }
    await submitBtn.click({ timeout: 10000 });
    // Don't over-constrain visibility; just give the app a moment to set session
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    log('[AUTH] Guest student submitted login form');
}

// Wait until the student has actually joined the Socket.IO game room.
// Heuristics: look for client logs containing [GAME JOIN] or for the lobby header text ("Participants connectés").
async function waitForStudentJoined(page: Page, getInfoLogs: () => Promise<{ type: string; text: string }[]>, timeoutMs = 12000) {
    const start = Date.now();
    for (; ;) {
        // Check console info logs first (emitted by useStudentGameSocket logger)
        try {
            const logs = await getInfoLogs();
            if (logs.some(l => l.text.includes('[GAME JOIN]'))) return;
        } catch { }

        // Check for Lobby header that only renders when connectedToRoom=true and waiting
        try {
            const header = page.locator('text=Participants connectés');
            if (await header.count()) return;
        } catch { }

        if (Date.now() - start > timeoutMs) break;
        await page.waitForTimeout(200);
    }
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

// Switch to the second question in the list and start it
async function switchToSecondQuestionAndStart(page: Page) {
    await page.waitForSelector('ul.draggable-questions-list', { timeout: 20000 });
    const items = page.locator('ul.draggable-questions-list li');
    const count = await items.count();
    if (count < 2) {
        throw new Error('Not enough questions in the list to switch');
    }
    const firstItem = items.nth(0);
    const secondItem = items.nth(1);
    // Try to stop the current/first question before switching to ensure a clean transition
    try {
        const firstStop = firstItem.locator('.question-display [data-stop-btn]').first();
        if (await firstStop.count()) {
            await firstStop.scrollIntoViewIfNeeded().catch(() => { });
            await firstStop.click({ timeout: 5000 }).catch(() => { });
            await page.waitForTimeout(300);
        }
    } catch { }
    await secondItem.scrollIntoViewIfNeeded().catch(() => { });
    // Click the inner .question-display to toggle open, not just the <li>
    const secondDisplay = secondItem.locator('.question-display').first();
    if (await secondDisplay.count()) {
        await secondDisplay.click({ timeout: 5000 }).catch(() => { });
        // Wait for it to expand if aria-expanded is wired
        try {
            await expect(secondDisplay).toHaveAttribute('aria-expanded', /true|"true"/, { timeout: 2000 });
        } catch {
            // ignore; some variants may not set aria-expanded
        }
    } else {
        // Fallback to clicking the LI if .question-display isn't found
        await secondItem.click({ timeout: 5000 }).catch(() => { });
    }

    // Prefer a play/pause button scoped within the second item
    let playBtn = secondItem.locator('.question-display [data-play-pause-btn]').first();
    if (!(await playBtn.count())) {
        // If not rendered inside the item (collapsed or variant), try any play button on the page but target the 2nd in the list
        const allPlayBtns = page.locator('ul.draggable-questions-list [data-play-pause-btn]');
        if (await allPlayBtns.count()) {
            playBtn = allPlayBtns.nth(1);
        }
    }
    if (await playBtn.count()) {
        await playBtn.scrollIntoViewIfNeeded().catch(() => { });
        await playBtn.click({ timeout: 6000 }).catch(() => { });
        await page.waitForTimeout(600);
        // If a global/toolbar play exists, try it as a follow-up to ensure the second question is actually started
        const globalPlay = page.locator('[data-testid="start-question-button"], [data-testid="play-button"], button:has-text("Démarrer"), button:has-text("Start")').first();
        if (await globalPlay.count()) {
            await globalPlay.click({ timeout: 4000 }).catch(() => { });
            await page.waitForTimeout(400);
        }
        return;
    }
    // Fallbacks
    const fallbacks = [
        'button[data-testid="start-question-button"]',
        'button[data-testid="play-button"]',
        'button:has-text("Démarrer")',
        'button:has-text("Start")'
    ];
    for (const sel of fallbacks) {
        const btn = secondItem.locator(sel).first();
        if (await btn.count()) {
            await btn.scrollIntoViewIfNeeded().catch(() => { });
            await btn.click({ timeout: 5000 }).catch(() => { });
            await page.waitForTimeout(600);
            return;
        }
    }
    throw new Error('Could not start the second question');
}

// Main test
test('mobile multiple-choice live: tap answer and collect overlay diagnostics', async ({ browser }) => {
    test.setTimeout(180000);

    // Teacher UI context (desktop)
    const teacherCtx = await browser.newContext();
    const teacherPage = await teacherCtx.newPage();

    // Student mobile context (iPhone 12)
    const studentCtx = await browser.newContext({ ...devices['iPhone 12'] });
    const studentPage = await studentCtx.newPage();

    // Crash/long-task diagnostics
    const teacherDiag = await setupCrashDiagnostics(teacherCtx, teacherPage, 'teacher');
    const studentDiag = await setupCrashDiagnostics(studentCtx, studentPage, 'student');
    // Ensure socket capture init script is injected in the student's browser context
    const studentSocketCap = await setupSocketCapture(studentCtx, studentPage, 'student');

    try {
        // Working pattern: clean DB, create teacher via backend, login via UI, then create game via frontend API
        const dataHelper = new TestDataHelper(teacherPage);
        await dataHelper.cleanDatabase();
        const teacherSeed = dataHelper.generateTestData('mc_mobile_teacher');
        await dataHelper.createTeacher({ username: teacherSeed.username, email: teacherSeed.email, password: teacherSeed.password });
        const loginHelper = new LoginHelper(teacherPage);
        await loginHelper.loginAsTeacher({ email: teacherSeed.email, password: teacherSeed.password });
        log('Teacher logged-in to frontend');
        const { accessCode } = await createQuizViaFrontendApi(teacherPage);

        // Student: auth as guest then go straight to live page
        const studentSeed = dataHelper.generateTestData('mc_mobile_student');
        await authenticateGuestStudent(studentPage, studentSeed.username);
        await studentPage.goto(`${CFG.baseUrl}/live/${accessCode}`);
        await studentPage.waitForURL(`${CFG.baseUrl}/live/${accessCode}`, { timeout: 15000 });
        await studentPage.waitForLoadState('networkidle');
        log('Student is on live page');
        await studentDiag.clear(); // Clear login-route hydration noise; focus on live page
        // Give sockets a brief moment to connect and ensure student joined the room
        await studentPage.waitForTimeout(800);
        await waitForStudentJoined(studentPage, studentDiag.getInfoEvents, 20000);
        // Also verify server-side room membership to eliminate false positives
        await waitForServerRoomJoin(teacherPage, accessCode, 15000);

        // Teacher: navigate to dashboard and start first question
        await startQuestionFromDashboard(teacherPage, accessCode);

        // Early diagnostic: wait for initial QUESTION UPDATE logs from student (socket capture)
        {
            const start = Date.now();
            let sawInitialQuestion = false;
            for (; ;) {
                const infoLogs = await studentDiag.getInfoEvents();
                if (infoLogs.some(l => l.text.includes('[QUESTION UPDATE]'))) { sawInitialQuestion = true; break; }
                if (Date.now() - start > 8000) break;
                await studentPage.waitForTimeout(200);
            }
            if (!sawInitialQuestion) {
                const sock = await studentSocketCap.getEvents();
                log('[EARLY-DIAG no initial QUESTION UPDATE]', { totalSocketEvents: sock.length, last10: sock.slice(-10) });
            }
        }

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
            // Dump socket events for forensics
            const sock = await studentSocketCap.getEvents();
            log('[DIAG socket-events dump]', { total: sock.length, last20: sock.slice(-20) });
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

        // --- Question switch stress (iPhone): switch to second question and assert a new QUESTION UPDATE ---
        const studentInfoBefore = await studentDiag.getInfoEvents();
        const answersBefore = await studentPage.locator('.tqcard-answer').allInnerTexts().catch(() => []);
        await switchToSecondQuestionAndStart(teacherPage);
        const startWait = Date.now();
        let gotNewQuestionLog = false;
        for (; ;) {
            const logs = await studentDiag.getInfoEvents();
            const beforeCount = studentInfoBefore.filter(l => l.text.includes('[QUESTION UPDATE]')).length;
            const afterCount = logs.filter(l => l.text.includes('[QUESTION UPDATE]')).length;
            if (afterCount > beforeCount) { gotNewQuestionLog = true; break; }
            if (Date.now() - startWait > 12000) break;
            await studentPage.waitForTimeout(250);
        }
        await studentPage.waitForSelector('.tqcard-answer', { timeout: 15000 }).catch(() => { });
        const answersAfter = await studentPage.locator('.tqcard-answer').allInnerTexts().catch(() => []);
        const answersChanged = answersBefore.length && answersAfter.length && (JSON.stringify(answersBefore) !== JSON.stringify(answersAfter));
        log('[QUESTION-SWITCH iPhone] results', { gotNewQuestionLog, answersChanged, before: answersBefore.slice(0, 3), after: answersAfter.slice(0, 3) });
        if (!gotNewQuestionLog && !answersChanged) {
            // Nudge the dashboard once more (stop then play) to trigger a fresh emission, then re-check
            await stressStopResumeOnTeacher(teacherPage);
            await switchToSecondQuestionAndStart(teacherPage);
            const retryStart = Date.now();
            for (; ;) {
                const logs = await studentDiag.getInfoEvents();
                const beforeCount = studentInfoBefore.filter(l => l.text.includes('[QUESTION UPDATE]')).length;
                const afterCount = logs.filter(l => l.text.includes('[QUESTION UPDATE]')).length;
                if (afterCount > beforeCount) { gotNewQuestionLog = true; break; }
                if (Date.now() - retryStart > 8000) break;
                await studentPage.waitForTimeout(250);
            }
        }
        expect(gotNewQuestionLog || answersChanged, 'Student should reflect the second question (via log or answers change) after the switch').toBeTruthy();
    } finally {
        await teacherCtx.close();
        await studentCtx.close();
    }
});

// Android Chrome emulation variant
test('android (Pixel 5) multiple-choice live: tap answer and overlay cycle', async ({ browser }) => {
    test.setTimeout(180000);

    const teacherCtx = await browser.newContext();
    const teacherPage = await teacherCtx.newPage();

    const studentCtx = await browser.newContext({ ...devices['Pixel 5'] });
    const studentPage = await studentCtx.newPage();

    const teacherDiag = await setupCrashDiagnostics(teacherCtx, teacherPage, 'teacher-android');
    const studentDiag = await setupCrashDiagnostics(studentCtx, studentPage, 'student-android');
    // Ensure socket capture init script is injected in the student's browser context
    const studentSocketCap = await setupSocketCapture(studentCtx, studentPage, 'student-android');

    try {
        const dataHelper = new TestDataHelper(teacherPage);
        await dataHelper.cleanDatabase();
        const teacherSeed = dataHelper.generateTestData('mc_android_teacher');
        await dataHelper.createTeacher({ username: teacherSeed.username, email: teacherSeed.email, password: teacherSeed.password });
        const loginHelper = new LoginHelper(teacherPage);
        await loginHelper.loginAsTeacher({ email: teacherSeed.email, password: teacherSeed.password });
        log('Teacher logged-in to frontend (Android test)');
        const { accessCode } = await createQuizViaFrontendApi(teacherPage);

        const studentSeed = dataHelper.generateTestData('mc_android_student');
        await authenticateGuestStudent(studentPage, studentSeed.username);
        await studentPage.goto(`${CFG.baseUrl}/live/${accessCode}`);
        await studentPage.waitForURL(`${CFG.baseUrl}/live/${accessCode}`, { timeout: 15000 });
        await studentPage.waitForLoadState('networkidle');
        log('Android student is on live page');
        await studentDiag.clear(); // Clear pre-live errors to assert only live-page issues
        // Give sockets a brief moment to connect and ensure student joined the room
        await studentPage.waitForTimeout(800);
        await waitForStudentJoined(studentPage, studentDiag.getInfoEvents, 20000);
        await waitForServerRoomJoin(teacherPage, accessCode, 15000);

        await startQuestionFromDashboard(teacherPage, accessCode);

        // Early diagnostic: wait for initial QUESTION UPDATE logs from student (socket capture)
        {
            const start = Date.now();
            let sawInitialQuestion = false;
            for (; ;) {
                const infoLogs = await studentDiag.getInfoEvents();
                if (infoLogs.some(l => l.text.includes('[QUESTION UPDATE]'))) { sawInitialQuestion = true; break; }
                if (Date.now() - start > 8000) break;
                await studentPage.waitForTimeout(200);
            }
            if (!sawInitialQuestion) {
                const sock = await studentSocketCap.getEvents();
                log('[ANDROID EARLY-DIAG no initial QUESTION UPDATE]', { totalSocketEvents: sock.length, last10: sock.slice(-10) });
            }
        }

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
        try {
            await studentPage.waitForSelector('.tqcard-answer', { timeout: 20000 });
        } catch (e) {
            log('Android: answers did not render in time; capturing screenshots...');
            await teacherPage.screenshot({ path: 'test-results/e2e/debug-mc-android-teacher.png', fullPage: true });
            await studentPage.screenshot({ path: 'test-results/e2e/debug-mc-android-student.png', fullPage: true });
            const sock = await studentSocketCap.getEvents();
            log('[ANDROID DIAG socket-events dump]', { total: sock.length, last20: sock.slice(-20) });
            throw e;
        }
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

        // --- Question switch stress (Android): switch to second question and assert a new QUESTION UPDATE ---
        const studentAndroidInfoBefore = await studentDiag.getInfoEvents();
        const answersAndroidBefore = await studentPage.locator('.tqcard-answer').allInnerTexts().catch(() => []);
        await switchToSecondQuestionAndStart(teacherPage);
        const startWaitAndroid = Date.now();
        let gotNewQuestionLogAndroid = false;
        for (; ;) {
            const logs = await studentDiag.getInfoEvents();
            const beforeCount = studentAndroidInfoBefore.filter(l => l.text.includes('[QUESTION UPDATE]')).length;
            const afterCount = logs.filter(l => l.text.includes('[QUESTION UPDATE]')).length;
            if (afterCount > beforeCount) { gotNewQuestionLogAndroid = true; break; }
            if (Date.now() - startWaitAndroid > 12000) break;
            await studentPage.waitForTimeout(250);
        }
        await studentPage.waitForSelector('.tqcard-answer', { timeout: 15000 }).catch(() => { });
        const answersAndroidAfter = await studentPage.locator('.tqcard-answer').allInnerTexts().catch(() => []);
        const answersAndroidChanged = answersAndroidBefore.length && answersAndroidAfter.length && (JSON.stringify(answersAndroidBefore) !== JSON.stringify(answersAndroidAfter));
        log('[QUESTION-SWITCH Android] results', { gotNewQuestionLogAndroid, answersAndroidChanged, before: answersAndroidBefore.slice(0, 3), after: answersAndroidAfter.slice(0, 3) });
        if (!gotNewQuestionLogAndroid && !answersAndroidChanged) {
            await stressStopResumeOnTeacher(teacherPage);
            await switchToSecondQuestionAndStart(teacherPage);
            const retryStartAndroid = Date.now();
            for (; ;) {
                const logs = await studentDiag.getInfoEvents();
                const beforeCount = studentAndroidInfoBefore.filter(l => l.text.includes('[QUESTION UPDATE]')).length;
                const afterCount = logs.filter(l => l.text.includes('[QUESTION UPDATE]')).length;
                if (afterCount > beforeCount) { gotNewQuestionLogAndroid = true; break; }
                if (Date.now() - retryStartAndroid > 8000) break;
                await studentPage.waitForTimeout(250);
            }
        }
        expect(gotNewQuestionLogAndroid || answersAndroidChanged, 'Student (Android) should reflect the second question (via log or answers change) after the switch').toBeTruthy();
    } finally {
        await teacherCtx.close();
        await studentCtx.close();
    }
});

// New: Multiple-choice late revert behavior and crash stress (iPhone)
test('mobile multiple-choice: late answers revert to accepted selection and no crash under stress', async ({ browser }) => {
    test.setTimeout(180000);

    // Teacher UI (desktop) and Student (iPhone 12)
    const teacherCtx = await browser.newContext();
    const teacherPage = await teacherCtx.newPage();
    const studentCtx = await browser.newContext({ ...devices['iPhone 12'] });
    const studentPage = await studentCtx.newPage();

    // Crash/console diagnostics and socket capture
    const teacherDiag = await setupCrashDiagnostics(teacherCtx, teacherPage, 'teacher-mc-revert');
    const studentDiag = await setupCrashDiagnostics(studentCtx, studentPage, 'student-mc-revert');
    const studentSocketCap = await setupSocketCapture(studentCtx, studentPage, 'student-mc-revert');

    // Page crash guard
    let studentCrashed = false;
    studentPage.on('crash', () => { studentCrashed = true; });

    try {
        // Seed teacher and login
        const dataHelper = new TestDataHelper(teacherPage);
        await dataHelper.cleanDatabase();
        const teacherSeed = dataHelper.generateTestData('mc_revert_teacher');
        await dataHelper.createTeacher({ username: teacherSeed.username, email: teacherSeed.email, password: teacherSeed.password });
        const loginHelper = new LoginHelper(teacherPage);
        await loginHelper.loginAsTeacher({ email: teacherSeed.email, password: teacherSeed.password });

        // Create a quiz via frontend API
        const { accessCode } = await createQuizViaFrontendApi(teacherPage);

        // Student joins live page as guest
        const studentSeed = dataHelper.generateTestData('mc_revert_student');
        await authenticateGuestStudent(studentPage, studentSeed.username);
        await studentPage.goto(`${CFG.baseUrl}/live/${accessCode}`);
        await studentPage.waitForURL(`${CFG.baseUrl}/live/${accessCode}`, { timeout: 15000 });
        await studentPage.waitForLoadState('networkidle');
        await studentDiag.clear();
        await studentPage.waitForTimeout(800);
        await waitForStudentJoined(studentPage, studentDiag.getInfoEvents, 20000);

        // Teacher starts first question
        await startQuestionFromDashboard(teacherPage, accessCode);

        // Ensure answers visible
        await studentPage.waitForSelector('.tqcard-answer', { timeout: 20000 });

        // Submit an initial valid selection (choose index 0)
        const answers = studentPage.locator('.tqcard-answer');
        const initialCount = await answers.count();
        expect(initialCount).toBeGreaterThan(0);

        // For multiple-choice questions in this app, validation button appears when isMultipleChoice
        // We'll submit a single index to keep it simple
        await answers.nth(0).click();
        const validateBtn = studentPage.locator('button:has-text("Valider")');
        if (await validateBtn.count()) {
            await validateBtn.click();
        }

        // Wait for snackbar confirmation of accepted answer
        await studentPage.waitForSelector('text=Réponse enregistrée', { timeout: 10000 }).catch(() => { });
        await studentPage.waitForTimeout(300);

        // Record accepted selection state (indexes with selected class)
        const readSelectedIndexes = async () => {
            const n = await answers.count();
            const selected: number[] = [];
            for (let i = 0; i < n; i++) {
                const cls = await answers.nth(i).getAttribute('class');
                if ((cls || '').includes('tqcard-answer-selected')) selected.push(i);
            }
            return selected;
        };
        const acceptedBeforeStop = await readSelectedIndexes();

        // Teacher stops the timer to lock answers
        const stopBtn = teacherPage.locator('ul.draggable-questions-list li .question-display [data-stop-btn]').first();
        if (await stopBtn.count()) {
            await stopBtn.click({ timeout: 5000 }).catch(() => { });
        }
        await studentPage.waitForTimeout(500);

        // Attempt late changes several times to stress revert behavior
        const attemptLateChangeOnce = async () => {
            // Toggle different selections
            const count = await answers.count();
            const idx = Math.min(1, count - 1); // pick second if exists
            await answers.nth(idx).click().catch(() => { });
            if (await validateBtn.count()) {
                await validateBtn.click().catch(() => { });
            }
            // Give revert logic time to apply (listens to socket error)
            await studentPage.waitForTimeout(400);
        };

        for (let i = 0; i < 5; i++) {
            await attemptLateChangeOnce();
        }

        // Assert the UI reverted back to the originally accepted selection
        const selectedAfter = await readSelectedIndexes();
        expect(selectedAfter).toEqual(acceptedBeforeStop);

        // Ensure page did not crash
        expect(studentCrashed, 'Student page should not crash under late-answer stress').toBeFalsy();

        // Log summary for visibility in CI
        log('[MC-LATE-REVERT] summary', {
            acceptedBeforeStop,
            selectedAfter,
            crashed: studentCrashed
        });
    } finally {
        await teacherCtx.close();
        await studentCtx.close();
    }
});

// New: Single-choice late revert behavior (iPhone)
test('mobile single-choice: late answers revert to accepted selection and no crash under stress', async ({ browser }) => {
    test.setTimeout(180000);

    const teacherCtx = await browser.newContext();
    const teacherPage = await teacherCtx.newPage();
    const studentCtx = await browser.newContext({ ...devices['iPhone 12'] });
    const studentPage = await studentCtx.newPage();

    const teacherDiag = await setupCrashDiagnostics(teacherCtx, teacherPage, 'teacher-single-revert');
    const studentDiag = await setupCrashDiagnostics(studentCtx, studentPage, 'student-single-revert');
    const studentSocketCap = await setupSocketCapture(studentCtx, studentPage, 'student-single-revert');

    let studentCrashed = false;
    studentPage.on('crash', () => { studentCrashed = true; });

    try {
        const dataHelper = new TestDataHelper(teacherPage);
        await dataHelper.cleanDatabase();
        const teacherSeed = dataHelper.generateTestData('single_revert_teacher');
        await dataHelper.createTeacher({ username: teacherSeed.username, email: teacherSeed.email, password: teacherSeed.password });
        const loginHelper = new LoginHelper(teacherPage);
        await loginHelper.loginAsTeacher({ email: teacherSeed.email, password: teacherSeed.password });

        // Pick single-choice question
        const singleUids = await getQuestionUidsByType(teacherPage, 'single', 1);
        if (!singleUids.length) test.skip(true, 'No single-choice questions available');
        const { accessCode } = await createGameFromUids(teacherPage, singleUids);

        const studentSeed = dataHelper.generateTestData('single_revert_student');
        await authenticateGuestStudent(studentPage, studentSeed.username);
        await studentPage.goto(`${CFG.baseUrl}/live/${accessCode}`);
        await studentPage.waitForURL(`${CFG.baseUrl}/live/${accessCode}`, { timeout: 15000 });
        await studentPage.waitForLoadState('networkidle');
        await studentDiag.clear();
        await studentPage.waitForTimeout(800);
        await waitForStudentJoined(studentPage, studentDiag.getInfoEvents, 20000);

        await startQuestionFromDashboard(teacherPage, accessCode);
        await studentPage.waitForSelector('.tqcard-answer', { timeout: 20000 });

        const answers = studentPage.locator('.tqcard-answer');
        const count = await answers.count();
        expect(count).toBeGreaterThan(0);

        // Click an answer; single-choice submits immediately
        await answers.nth(0).click();
        await studentPage.waitForTimeout(400);

        const getSelected = async () => {
            const n = await answers.count();
            for (let i = 0; i < n; i++) {
                const cls = await answers.nth(i).getAttribute('class');
                if ((cls || '').includes('tqcard-answer-selected')) return i;
            }
            return -1;
        };
        const acceptedIndex = await getSelected();
        expect(acceptedIndex).toBeGreaterThanOrEqual(0);

        // Stop timer to lock answers
        const stopBtn = teacherPage.locator('ul.draggable-questions-list li .question-display [data-stop-btn]').first();
        if (await stopBtn.count()) await stopBtn.click({ timeout: 5000 }).catch(() => { });
        await studentPage.waitForTimeout(500);

        // Attempt late toggles repeatedly
        for (let i = 0; i < 5; i++) {
            const alt = acceptedIndex === 0 ? 1 : 0;
            if (alt < count) {
                await answers.nth(alt).click().catch(() => { });
                await studentPage.waitForTimeout(300);
            }
        }

        // Should revert back to accepted index
        const finalIndex = await getSelected();
        expect(finalIndex).toEqual(acceptedIndex);
        expect(studentCrashed).toBeFalsy();
        log('[SINGLE-LATE-REVERT] summary', { acceptedIndex, finalIndex, crashed: studentCrashed });
    } finally {
        await teacherCtx.close();
        await studentCtx.close();
    }
});

// New: Numeric late revert behavior (iPhone)
test('mobile numeric: late answers revert to accepted value and no crash under stress', async ({ browser }) => {
    test.setTimeout(180000);

    const teacherCtx = await browser.newContext();
    const teacherPage = await teacherCtx.newPage();
    const studentCtx = await browser.newContext({ ...devices['iPhone 12'] });
    const studentPage = await studentCtx.newPage();

    const teacherDiag = await setupCrashDiagnostics(teacherCtx, teacherPage, 'teacher-numeric-revert');
    const studentDiag = await setupCrashDiagnostics(studentCtx, studentPage, 'student-numeric-revert');
    const studentSocketCap = await setupSocketCapture(studentCtx, studentPage, 'student-numeric-revert');

    let studentCrashed = false;
    studentPage.on('crash', () => { studentCrashed = true; });

    try {
        const dataHelper = new TestDataHelper(teacherPage);
        await dataHelper.cleanDatabase();
        const teacherSeed = dataHelper.generateTestData('numeric_revert_teacher');
        await dataHelper.createTeacher({ username: teacherSeed.username, email: teacherSeed.email, password: teacherSeed.password });
        const loginHelper = new LoginHelper(teacherPage);
        await loginHelper.loginAsTeacher({ email: teacherSeed.email, password: teacherSeed.password });

        const numericUids = await getQuestionUidsByType(teacherPage, 'numeric', 1);
        if (!numericUids.length) test.skip(true, 'No numeric questions available');
        const { accessCode } = await createGameFromUids(teacherPage, numericUids);

        const studentSeed = dataHelper.generateTestData('numeric_revert_student');
        await authenticateGuestStudent(studentPage, studentSeed.username);
        await studentPage.goto(`${CFG.baseUrl}/live/${accessCode}`);
        await studentPage.waitForURL(`${CFG.baseUrl}/live/${accessCode}`, { timeout: 15000 });
        await studentPage.waitForLoadState('networkidle');
        await studentDiag.clear();
        await studentPage.waitForTimeout(800);
        await waitForStudentJoined(studentPage, studentDiag.getInfoEvents, 20000);

        await startQuestionFromDashboard(teacherPage, accessCode);

        // Numeric input flow
        const input = studentPage.locator('#numeric-answer');
        await input.waitFor({ timeout: 20000 });
        await input.fill('42');
        const validateBtn = studentPage.locator('button:has-text("Valider")');
        await validateBtn.click();
        await studentPage.waitForSelector('text=Réponse enregistrée', { timeout: 10000 }).catch(() => { });
        await studentPage.waitForTimeout(300);
        const acceptedValue = await input.inputValue();

        // Stop timer
        const stopBtn = teacherPage.locator('ul.draggable-questions-list li .question-display [data-stop-btn]').first();
        if (await stopBtn.count()) await stopBtn.click({ timeout: 5000 }).catch(() => { });
        await studentPage.waitForTimeout(500);

        // Attempt late submissions with different values
        const lateValues = ['7', '123', '0', '999', '3.14'];
        for (const v of lateValues) {
            await input.fill(v).catch(() => { });
            if (await validateBtn.count()) await validateBtn.click().catch(() => { });
            await studentPage.waitForTimeout(300);
        }

        // Should revert to the originally accepted value
        const finalValue = await input.inputValue();
        expect(finalValue).toEqual(acceptedValue);
        expect(studentCrashed).toBeFalsy();
        log('[NUMERIC-LATE-REVERT] summary', { acceptedValue, finalValue, crashed: studentCrashed });
    } finally {
        await teacherCtx.close();
        await studentCtx.close();
    }
});

// New: Validate late-answer revert behavior for multiple_choice
test('late-answer revert (multiple_choice): after timer stop, selection reverts to accepted state', async ({ browser }) => {
    test.setTimeout(180000);

    const teacherCtx = await browser.newContext();
    const teacherPage = await teacherCtx.newPage();

    const studentCtx = await browser.newContext({ ...devices['iPhone 12'] });
    const studentPage = await studentCtx.newPage();

    const teacherDiag = await setupCrashDiagnostics(teacherCtx, teacherPage, 'teacher-mc-revert');
    const studentDiag = await setupCrashDiagnostics(studentCtx, studentPage, 'student-mc-revert');

    try {
        const dataHelper = new TestDataHelper(teacherPage);
        await dataHelper.cleanDatabase();
        const teacherSeed = dataHelper.generateTestData('mc_revert_teacher');
        await dataHelper.createTeacher({ username: teacherSeed.username, email: teacherSeed.email, password: teacherSeed.password });
        const loginHelper = new LoginHelper(teacherPage);
        await loginHelper.loginAsTeacher({ email: teacherSeed.email, password: teacherSeed.password });
        const { accessCode } = await createQuizByType(teacherPage, 'multiple_choice', 4);

        // Student joins live page
        const studentSeed = dataHelper.generateTestData('mc_revert_student');
        await authenticateGuestStudent(studentPage, studentSeed.username);
        await studentPage.goto(`${CFG.baseUrl}/live/${accessCode}`);
        await studentPage.waitForURL(`${CFG.baseUrl}/live/${accessCode}`, { timeout: 15000 });
        await studentPage.waitForLoadState('networkidle');
        await studentDiag.clear();
        await waitForStudentJoined(studentPage, studentDiag.getInfoEvents, 20000);

        // Teacher starts first question
        await startQuestionFromDashboard(teacherPage, accessCode);
        await studentPage.waitForSelector('.tqcard-answer', { timeout: 20000 });

        // Select two answers (simulate multi-select) then submit via "Valider"
        const answers = studentPage.locator('.tqcard-answer');
        const total = await answers.count();
        const a0 = answers.nth(0);
        const a1 = answers.nth(Math.min(1, Math.max(0, total - 1)));
        await a0.click();
        if (total > 1) await a1.click();
        const submitBtn = studentPage.locator('button:has-text("Valider")').first();
        await submitBtn.click({ timeout: 8000 });

        // Wait for acceptance signal (snackbar or info log)
        const acceptStart = Date.now();
        let accepted = false;
        for (; ;) {
            const hasSnackbar = await studentPage.locator('text=Réponse enregistrée').count();
            const logs = await studentDiag.getInfoEvents();
            const sawAnswerReceived = logs.some(l => l.text.includes('ANSWER RECEIVED'));
            if (hasSnackbar || sawAnswerReceived) { accepted = true; break; }
            if (Date.now() - acceptStart > 8000) break;
            await studentPage.waitForTimeout(200);
        }

        // Snapshot accepted selection (indexes with selected class)
        const getSelectedIndexes = async () => {
            const els = await studentPage.locator('.tqcard-answer').all();
            const selected: number[] = [];
            for (let i = 0; i < els.length; i++) {
                const cls = await els[i].getAttribute('class');
                if (cls && cls.includes('tqcard-answer-selected')) selected.push(i);
            }
            return selected;
        };
        const acceptedSelected = await getSelectedIndexes();

        // Teacher stops timer to lock answers
        const stopBtn = teacherPage.locator('ul.draggable-questions-list li .question-display [data-stop-btn]').first();
        if (await stopBtn.count()) {
            await stopBtn.click({ timeout: 5000 }).catch(() => { });
        } else {
            // Fallback: toggle play/pause twice to end
            const play = teacherPage.locator('ul.draggable-questions-list li .question-display [data-play-pause-btn]').first();
            if (await play.count()) {
                await play.click().catch(() => { });
                await teacherPage.waitForTimeout(200);
                await play.click().catch(() => { });
            }
        }
        await studentPage.waitForTimeout(600);

        // Student attempts to change selection and resubmit
        // Toggle a different index, preferring index 2 if exists; else flip first
        const altIdx = total > 2 ? 2 : 0;
        await answers.nth(altIdx).click().catch(() => { });
        if (await submitBtn.count()) {
            await submitBtn.click({ timeout: 8000 }).catch(() => { });
        }

        // Wait briefly for potential late-error revert effect to apply
        await studentPage.waitForTimeout(1200);

        const afterSelected = await getSelectedIndexes();
        log('[MC REVERT] selections', { acceptedSelected, afterSelected });
        expect(JSON.stringify(afterSelected)).toBe(JSON.stringify(acceptedSelected));
    } finally {
        await teacherCtx.close();
        await studentCtx.close();
    }
});

// New: Desktop tab-switch + forced offline to trigger socket disconnect and ensure no crash (repro harness)
test('desktop live page: tab switch + offline -> disconnect and no crash (repro harness)', async ({ browser }) => {
    test.setTimeout(180000);

    // Desktop contexts for both teacher and student
    const teacherCtx = await browser.newContext();
    const teacherPage = await teacherCtx.newPage();
    const studentCtx = await browser.newContext();
    const studentPage = await studentCtx.newPage();

    const teacherDiag = await setupCrashDiagnostics(teacherCtx, teacherPage, 'teacher-desktop-tab');
    const studentDiag = await setupCrashDiagnostics(studentCtx, studentPage, 'student-desktop-tab');
    const studentSocketCap = await setupSocketCapture(studentCtx, studentPage, 'student-desktop-tab');

    // Crash guard
    let studentCrashed = false;
    studentPage.on('crash', () => { studentCrashed = true; });

    // Helper to wait for a socket event captured on the page
    const waitForSocketEvent = async (name: string, timeoutMs = 15000) => {
        const start = Date.now();
        for (; ;) {
            const events = await studentSocketCap.getEvents();
            if (events.some((e: any) => e.event === name)) return true;
            if (Date.now() - start > timeoutMs) return false;
            await studentPage.waitForTimeout(200);
        }
    };

    try {
        // Seed teacher and login
        const dataHelper = new TestDataHelper(teacherPage);
        await dataHelper.cleanDatabase();
        const teacherSeed = dataHelper.generateTestData('desktop_tab_teacher');
        await dataHelper.createTeacher({ username: teacherSeed.username, email: teacherSeed.email, password: teacherSeed.password });
        const loginHelper = new LoginHelper(teacherPage);
        await loginHelper.loginAsTeacher({ email: teacherSeed.email, password: teacherSeed.password });

        // Create a simple quiz via frontend API (default MC list)
        const { accessCode } = await createQuizViaFrontendApi(teacherPage);

        // Student joins live page as guest
        const studentSeed = dataHelper.generateTestData('desktop_tab_student');
        await authenticateGuestStudent(studentPage, studentSeed.username);
        await studentPage.goto(`${CFG.baseUrl}/live/${accessCode}`);
        await studentPage.waitForURL(`${CFG.baseUrl}/live/${accessCode}`, { timeout: 15000 });
        await studentPage.waitForLoadState('networkidle');
        await studentDiag.clear();
        await studentPage.waitForTimeout(800);
        await waitForStudentJoined(studentPage, studentDiag.getInfoEvents, 20000);

        // Teacher starts first question
        await startQuestionFromDashboard(teacherPage, accessCode);

        // Ensure answers are visible (recover if needed)
        const ensureAnswersVisibleDesktop = async () => {
            const visible = await studentPage.locator('.tqcard-answer').first().isVisible().catch(() => false);
            if (visible) return;
            const playBtnNow = teacherPage.locator('ul.draggable-questions-list li .question-display [data-play-pause-btn]').first();
            if (await playBtnNow.count()) {
                await playBtnNow.click({ timeout: 5000 }).catch(() => { });
                await teacherPage.waitForTimeout(400);
            }
            await studentPage.waitForTimeout(1000);
            const stillInvisible = !(await studentPage.locator('.tqcard-answer').first().isVisible().catch(() => false));
            if (stillInvisible) {
                await stressStopResumeOnTeacher(teacherPage);
                await studentPage.waitForTimeout(1200);
            }
        };
        await ensureAnswersVisibleDesktop();
        await studentPage.waitForSelector('.tqcard-answer', { timeout: 20000 });
        const firstAnswer = studentPage.locator('.tqcard-answer').first();
        await firstAnswer.click();
        const validateBtn = studentPage.locator('button:has-text("Valider")');
        if (await validateBtn.count()) await validateBtn.click().catch(() => { });
        await studentPage.waitForTimeout(300);

        // Simulate tab switch and force offline to expedite Socket.IO disconnect
        const bgTab = await studentCtx.newPage();
        await bgTab.goto(`${CFG.baseUrl}/`, { waitUntil: 'domcontentloaded' }).catch(() => { });
        await bgTab.bringToFront();

        // Force network offline -> expect socket disconnect after pingTimeout (can be ~20s)
        await studentCtx.setOffline(true);
        // Wait up to 28s to allow ping/pong timeout to trigger a disconnect if not detectable via event wrapper
        const gotDisconnect = await waitForSocketEvent('disconnect', 16000);
        if (!gotDisconnect) {
            // Fallback: passive wait to ensure disconnect occurs even if we can't intercept the event handler
            await studentPage.waitForTimeout(12000); // total offline wait ≈ 28s
        }
        log('[DESKTOP TAB] disconnect observed?', { gotDisconnect });

        // Bring the student tab back to front and restore network
        await studentCtx.setOffline(false);
        await studentPage.bringToFront();

        // Optionally wait for reconnect attempts/events
        const gotReconnectAttempt = await waitForSocketEvent('reconnect_attempt', 12000);
        const gotConnect = await waitForSocketEvent('connect', 15000);
        log('[DESKTOP TAB] reconnect signals', { gotReconnectAttempt, gotConnect });

        // Repeat the cycle once more to amplify any latent issues
        await bgTab.bringToFront();
        await studentCtx.setOffline(true);
        await studentPage.waitForTimeout(12000);
        await studentCtx.setOffline(false);
        await studentPage.bringToFront();
        await studentPage.waitForTimeout(3000);

        // Assert page did not crash (expectation); if it does, this test will fail and capture the stack
        expect(studentCrashed, 'Student page should not crash after tab switch + offline/online cycle').toBeFalsy();

        // Dump a concise socket summary for CI logs
        const sock = await studentSocketCap.getEvents();
        log('[DESKTOP TAB] socket events summary', {
            total: sock.length,
            last10: sock.slice(-10).map((e: any) => e.event)
        });
    } finally {
        await teacherCtx.close();
        await studentCtx.close();
    }
});

// New: Desktop idle crash repro — just sit on /live/[code] for ~2 minutes and detect crash
test('desktop live page: idle ~2 minutes should not crash (crash repro)', async ({ browser }) => {
    // Allow enough time for setup + 2 minute idle
    test.setTimeout(5 * 60 * 1000);

    const teacherCtx = await browser.newContext();
    const teacherPage = await teacherCtx.newPage();
    const studentCtx = await browser.newContext();
    const studentPage = await studentCtx.newPage();

    const teacherDiag = await setupCrashDiagnostics(teacherCtx, teacherPage, 'teacher-desktop-idle');
    const studentDiag = await setupCrashDiagnostics(studentCtx, studentPage, 'student-desktop-idle');
    const studentSocketCap = await setupSocketCapture(studentCtx, studentPage, 'student-desktop-idle');

    let studentCrashed = false;
    studentPage.on('crash', () => { studentCrashed = true; });

    try {
        // Seed teacher and login
        const dataHelper = new TestDataHelper(teacherPage);
        await dataHelper.cleanDatabase();
        const teacherSeed = dataHelper.generateTestData('desktop_idle_teacher');
        await dataHelper.createTeacher({ username: teacherSeed.username, email: teacherSeed.email, password: teacherSeed.password });
        const loginHelper = new LoginHelper(teacherPage);
        await loginHelper.loginAsTeacher({ email: teacherSeed.email, password: teacherSeed.password });

        // Create a game via frontend API
        const { accessCode } = await createQuizViaFrontendApi(teacherPage);

        // Student joins live page as guest
        const studentSeed = dataHelper.generateTestData('desktop_idle_student');
        await ensureFrontendSessionCookie(studentPage, studentSeed.username);
        await studentPage.goto(`${CFG.baseUrl}/live/${accessCode}`);
        await studentPage.waitForURL(`${CFG.baseUrl}/live/${accessCode}`, { timeout: 15000 });
        await studentPage.waitForLoadState('networkidle');
        await studentDiag.clear();

        // Start the first question (to simulate real game state with timer/phase transitions)
        await startQuestionFromDashboard(teacherPage, accessCode);
        // Ensure question content renders on student
        const ensureAnswersVisibleDesktop = async () => {
            const visible = await studentPage.locator('.tqcard-answer').first().isVisible().catch(() => false);
            if (visible) return;
            const playBtnNow = teacherPage.locator('ul.draggable-questions-list li .question-display [data-play-pause-btn]').first();
            if (await playBtnNow.count()) {
                await playBtnNow.click({ timeout: 5000 }).catch(() => { });
                await teacherPage.waitForTimeout(400);
            }
            await studentPage.waitForTimeout(1000);
            const stillInvisible = !(await studentPage.locator('.tqcard-answer').first().isVisible().catch(() => false));
            if (stillInvisible) {
                await stressStopResumeOnTeacher(teacherPage);
                await studentPage.waitForTimeout(1200);
            }
        };
        await ensureAnswersVisibleDesktop();

        // Idle: wait ~2 minutes to mimic the reported timeline (should cover timer end + phase changes)
        const idleMs = 2 * 60 * 1000 + 10 * 1000; // a little over two minutes
        await studentPage.waitForTimeout(idleMs);

        // Assert no crash occurred
        expect(studentCrashed, 'Student page should not crash after ~2 minutes of idle on live page').toBeFalsy();

        // Log captured info in case of silent issues
        const sock = await studentSocketCap.getEvents();
        const transports = await (studentSocketCap as any).getTransportEvents?.();
        const collected = await studentDiag.getCollected();
        log('[DESKTOP IDLE] summary', {
            socketEvents: sock.slice(-5).map((e: any) => e.event),
            transportEvents: transports?.slice(-3) || [],
            pageErrors: collected.errors.slice(-3),
            windowErrors: collected.windowErrors.errors.slice(-3)
        });
    } finally {
        await teacherCtx.close();
        await studentCtx.close();
    }
});

// New: Desktop background ~5 minutes (no offline) then return; should not crash
test('desktop live page: background ~5 minutes then return should not crash (tab idle repro)', async ({ browser }) => {
    // Setup generous timeout for long idle
    test.setTimeout(10 * 60 * 1000);

    const teacherCtx = await browser.newContext();
    const teacherPage = await teacherCtx.newPage();
    const studentCtx = await browser.newContext();
    const studentPage = await studentCtx.newPage();

    const teacherDiag = await setupCrashDiagnostics(teacherCtx, teacherPage, 'teacher-desktop-bg');
    const studentDiag = await setupCrashDiagnostics(studentCtx, studentPage, 'student-desktop-bg');
    const studentSocketCap = await setupSocketCapture(studentCtx, studentPage, 'student-desktop-bg');

    let studentCrashed = false;
    studentPage.on('crash', () => { studentCrashed = true; });

    try {
        // Seed teacher and login
        const dataHelper = new TestDataHelper(teacherPage);
        await dataHelper.cleanDatabase();
        const teacherSeed = dataHelper.generateTestData('desktop_bg_teacher');
        await dataHelper.createTeacher({ username: teacherSeed.username, email: teacherSeed.email, password: teacherSeed.password });
        const loginHelper = new LoginHelper(teacherPage);
        await loginHelper.loginAsTeacher({ email: teacherSeed.email, password: teacherSeed.password });

        // Create game via frontend API
        const { accessCode } = await createQuizViaFrontendApi(teacherPage);

        // Student joins live page as guest
        const studentSeed = dataHelper.generateTestData('desktop_bg_student');
        await ensureFrontendSessionCookie(studentPage, studentSeed.username);
        await studentPage.goto(`${CFG.baseUrl}/live/${accessCode}`);
        await studentPage.waitForURL(`${CFG.baseUrl}/live/${accessCode}`, { timeout: 15000 });
        await studentPage.waitForLoadState('networkidle');
        await studentDiag.clear();

        // Start first question and ensure content renders
        await startQuestionFromDashboard(teacherPage, accessCode);
        const ensureAnswersVisibleDesktop = async () => {
            const visible = await studentPage.locator('.tqcard-answer').first().isVisible().catch(() => false);
            if (visible) return;
            const playBtnNow = teacherPage.locator('ul.draggable-questions-list li .question-display [data-play-pause-btn]').first();
            if (await playBtnNow.count()) {
                await playBtnNow.click({ timeout: 5000 }).catch(() => { });
                await teacherPage.waitForTimeout(400);
            }
            await studentPage.waitForTimeout(1000);
            const stillInvisible = !(await studentPage.locator('.tqcard-answer').first().isVisible().catch(() => false));
            if (stillInvisible) {
                await stressStopResumeOnTeacher(teacherPage);
                await studentPage.waitForTimeout(1200);
            }
        };
        await ensureAnswersVisibleDesktop();

        // Bring another tab to front to background the student tab
        const bgTab = await studentCtx.newPage();
        await bgTab.goto(`${CFG.baseUrl}/`, { waitUntil: 'domcontentloaded' }).catch(() => { });
        await bgTab.bringToFront();

        // Idle while backgrounded: wait ~5 minutes
        const idleMs = 5 * 60 * 1000 + 10 * 1000; // a little over five minutes
        await bgTab.waitForTimeout(idleMs);

        // Return to the student tab
        await studentPage.bringToFront();
        await studentPage.waitForTimeout(2000);

        // Assert not crashed
        expect(studentCrashed, 'Student page should not crash after ~5 minutes background idle').toBeFalsy();

        // Log transport/socket signals for inspection
        const sock = await studentSocketCap.getEvents();
        const transports = await (studentSocketCap as any).getTransportEvents?.();
        const collected = await studentDiag.getCollected();
        log('[DESKTOP BG IDLE] summary', {
            socketEvents: sock.slice(-5).map((e: any) => e.event),
            transportEvents: transports?.slice(-5) || [],
            pageErrors: collected.errors.slice(-3),
            windowErrors: collected.windowErrors.errors.slice(-3)
        });
    } finally {
        await teacherCtx.close();
        await studentCtx.close();
    }
});

// New: Teacher profile on live page — follow exact manual steps: start+stop timer, open live as teacher, answer+validate, background ~5m
test('desktop teacher profile live: stop timer, answer repeatedly, background ~7m (manual-steps repro)', async ({ browser }) => {
    test.setTimeout(15 * 60 * 1000);

    // Single desktop context for teacher for both dashboard and live
    const teacherCtx = await browser.newContext();
    const dashboardPage = await teacherCtx.newPage();
    const livePage = await teacherCtx.newPage();

    const teacherDashDiag = await setupCrashDiagnostics(teacherCtx, dashboardPage, 'teacher-dash-repro');
    const teacherLiveDiag = await setupCrashDiagnostics(teacherCtx, livePage, 'teacher-live-repro');
    const liveSocketCap = await setupSocketCapture(teacherCtx, livePage, 'teacher-live-repro');

    let liveCrashed = false;
    livePage.on('crash', () => { liveCrashed = true; });

    try {
        // Seed teacher and login
        const dataHelper = new TestDataHelper(dashboardPage);
        await dataHelper.cleanDatabase();
        const teacherSeed = dataHelper.generateTestData('teacher_live_repro');
        await dataHelper.createTeacher({ username: teacherSeed.username, email: teacherSeed.email, password: teacherSeed.password });
        const loginHelper = new LoginHelper(dashboardPage);
        await loginHelper.loginAsTeacher({ email: teacherSeed.email, password: teacherSeed.password });

        // Create game with the exact UID if possible, else fallback to multiple_choice
        const TARGET_UID = 'aflesch-mt1-ensembles-et-applications-001';
        const specific = await tryCreateGameWithSpecificUid(dashboardPage, TARGET_UID);
        let game: QuizData;
        if (specific && specific.accessCode) {
            game = specific;
            log('[manual-steps repro] Using specific UID game', game);
        } else {
            log('[manual-steps repro] Falling back to multiple_choice list');
            game = await createQuizByType(dashboardPage, 'multiple_choice', 1);
        }

        // Step 1: Start a question on the teacher dashboard
        await startQuestionFromDashboard(dashboardPage, game.accessCode);

        // Step 2: Stop the timer
        const stopBtn = dashboardPage.locator('ul.draggable-questions-list li .question-display [data-stop-btn]').first();
        if (await stopBtn.count()) {
            await stopBtn.click({ timeout: 5000 }).catch(() => { });
        } else {
            // Fallback: play/pause may stop effectively in this variant
            const playPause = dashboardPage.locator('ul.draggable-questions-list li .question-display [data-play-pause-btn]').first();
            if (await playPause.count()) await playPause.click({ timeout: 5000 }).catch(() => { });
        }

        // Step 3: Load live/[code] with the teacher profile (same context)
        await livePage.goto(`${CFG.baseUrl}/live/${game.accessCode}`);
        await livePage.waitForURL(`${CFG.baseUrl}/live/${game.accessCode}`, { timeout: 15000 });
        await livePage.waitForLoadState('networkidle');
        await teacherLiveDiag.clear();

        // Step 4: Click answers and validate a few times to prime state (user notes this may accelerate crash)
        // Ensure answers render (some variants still show them after stop)
        await livePage.waitForSelector('.tqcard-answer', { timeout: 20000 }).catch(() => { });
        const answers = livePage.locator('.tqcard-answer');
        const validateBtn = livePage.locator('button:has-text("Valider")');
        const clickAndValidate = async (idx: number) => {
            const count = await answers.count();
            if (!count) return;
            const i = Math.min(Math.max(idx, 0), count - 1);
            await answers.nth(i).click({ timeout: 8000 }).catch(() => { });
            if (await validateBtn.count()) {
                await validateBtn.click({ timeout: 8000 }).catch(() => { });
            }
            await livePage.waitForTimeout(400);
        };
        if (await answers.count()) {
            // Try 4 quick submit cycles across the first few options
            for (let i = 0; i < 4; i++) {
                await clickAndValidate(i);
            }
        }

        // Step 5: Background the live tab and wait ~7 minutes
        const bgTab = await teacherCtx.newPage();
        await bgTab.goto(`${CFG.baseUrl}/`, { waitUntil: 'domcontentloaded' }).catch(() => { });
        await bgTab.bringToFront();
        // Wait 7 min + small buffer
        await bgTab.waitForTimeout(7 * 60 * 1000 + 15 * 1000);

        // Return to the live tab
        await livePage.bringToFront();
        await livePage.waitForTimeout(2000);

        // Optional: try one more quick submit to trigger any latent loop
        if (await answers.count()) {
            await clickAndValidate(0);
        }

        // Assert: page has not crashed (if it crashes, the test will fail here)
        expect(liveCrashed, 'Teacher-profile live page should not crash after ~5 minutes background idle').toBeFalsy();

        // Log signals for inspection
        const sock = await liveSocketCap.getEvents();
        const transports = await (liveSocketCap as any).getTransportEvents?.();
        const collected = await teacherLiveDiag.getCollected();
        log('[manual-steps repro] summary', {
            socketEvents: sock.slice(-5).map((e: any) => e.event),
            transportEvents: transports?.slice(-5) || [],
            pageErrors: collected.errors.slice(-3),
            windowErrors: collected.windowErrors.errors.slice(-3)
        });
    } finally {
        await teacherCtx.close();
    }
});
