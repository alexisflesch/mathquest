/**
 * Chaos Testing Suite
 * 
 * Tests app stability under adverse conditions:
 * - Network flaps (offline/online cycles)
 * - Background/resume scenarios
 * - Duplicate event floods
 * - Extended duration stress tests
 * 
 * Exit criteria:
 * - No crashes (window.error, unhandledrejection, ws.close 1006)
 * - Event counter budgets not exceeded
 * - No duplicate GAME_QUESTION storms
 */

// @ts-nocheck - Playwright test globals

import { test, expect, Browser, Page, BrowserContext } from '@playwright/test';
import { TestDataHelper, LoginHelper } from '../helpers/test-helpers';
import {
    injectEventCounters,
    injectCrashSentinels,
    getEventCounters,
    resetEventCounters,
    assertCounterBudget,
    assertNoCrashes,
    getCrashReport,
    simulateNetworkFlap,
    simulateNetworkFlapWithJitter,
    simulateBackgroundResume,
    waitForStableConnection,
    logEventCounters,
    assertNoDuplicateBroadcasts,
    logEventStatistics,
    getDuplicateEventCounts,
    // Render tracking
    injectRenderCounters,
    getRenderCounts,
    resetRenderCounters,
    logRenderStatistics,
    assertRenderBudgets,
    // Log tracking
    injectLogCounters,
    getLogCounts,
    resetLogCounters,
    logConsoleStatistics,
    assertLogBudget
} from '../helpers/chaos-helpers';

test.describe('Chaos Suite: Network Resilience', () => {
    // Each test gets its own fresh contexts to avoid pollution

    test('should survive single network flap without crashes', async ({ browser }) => {
        test.setTimeout(120000); // 2 minutes

        // Create fresh contexts for this test
        const teacherContext = await browser.newContext();
        const studentContext = await browser.newContext();
        const teacherPage = await teacherContext.newPage();
        const studentPage = await studentContext.newPage();

        // Inject monitoring
        await injectEventCounters(teacherPage);
        await injectEventCounters(studentPage);
        await injectCrashSentinels(teacherPage);
        await injectCrashSentinels(studentPage);

        try {
            const dataHelper = new TestDataHelper(teacherPage);
            const loginHelper = new LoginHelper(teacherPage);
            const seed = dataHelper.generateTestData('network_flap');

            // Setup: Create teacher and game
            await dataHelper.createTeacher({
                username: seed.username,
                email: seed.email,
                password: seed.password
            });

            await loginHelper.loginAsTeacher({
                email: seed.email,
                password: seed.password
            });

            // Get questions
            const questionsResponse = await teacherPage.request.get('/api/questions/list', {
                params: { gradeLevel: 'CP', limit: '3' }
            });
            const questions = await questionsResponse.json();
            const questionUids = questions.slice(0, 3);

            // Create template
            const templateResponse = await teacherPage.request.post('/api/game-templates', {
                data: {
                    name: seed.quizName,
                    gradeLevel: 'CP',
                    discipline: 'Mathématiques',
                    themes: ['Calcul'],
                    questionUids: questionUids,
                    description: 'Chaos test template',
                    defaultMode: 'quiz'
                }
            });

            expect(templateResponse.ok()).toBeTruthy();
            const templateData = await templateResponse.json();
            expect(templateData.gameTemplate).toBeTruthy();
            expect(templateData.gameTemplate.id).toBeTruthy();

            // Create game
            const gameResponse = await teacherPage.request.post('/api/games', {
                data: {
                    name: `Chaos Test ${Date.now()}`,
                    gameTemplateId: templateData.gameTemplate.id,
                    playMode: 'quiz',
                    settings: {}
                }
            });

            expect(gameResponse.ok()).toBeTruthy();
            const gameData = await gameResponse.json();
            expect(gameData.gameInstance).toBeTruthy();
            const accessCode = gameData.gameInstance.accessCode;

            // Student joins
            const studentLogin = new LoginHelper(studentPage);
            await studentLogin.loginAsGuestStudent({ username: 'ChaosStudent1' });

            await resetEventCounters(studentPage);

            // Navigate to game
            await studentPage.goto(`http://localhost:3008/live/${accessCode}?e2e=1`);
            await studentPage.waitForTimeout(2000); // Wait for join

            // Record initial counters
            await logEventCounters(studentPage, 'Before flap');
            const beforeFlap = await getEventCounters(studentPage);

            // CHAOS: Single network flap (2s offline)
            console.log('🌩️ Simulating network flap...');
            await simulateNetworkFlap(studentContext, 2000);

            // Wait for reconnection and stability
            await studentPage.waitForTimeout(3000);
            await waitForStableConnection(studentPage, 2000);

            // Record after counters
            await logEventCounters(studentPage, 'After flap');
            const afterFlap = await getEventCounters(studentPage);

            // ASSERTIONS
            // 1. No crashes
            await assertNoCrashes(studentPage);
            await assertNoCrashes(teacherPage);

            // 2. JOIN_GAME should not have fired more than once during reconnect
            // (idempotency guard should block duplicates)
            const joinGameDelta = afterFlap.join_game - beforeFlap.join_game;
            expect(joinGameDelta).toBeLessThanOrEqual(1);

            // 3. GAME_QUESTION should not storm (max 2: initial + one after reconnect if needed)
            await assertCounterBudget(studentPage, 'game_question', 2);

            console.log('✅ Single network flap survived without issues');
        } finally {
            // Cleanup
            await teacherContext.close();
            await studentContext.close();
        }
    });

    test('should survive multiple network flaps with jitter', async ({ browser }) => {
        test.setTimeout(180000); // 3 minutes

        // Create fresh contexts for this test
        const studentContext = await browser.newContext();
        const studentPage = await studentContext.newPage();

        // Inject monitoring
        await injectEventCounters(studentPage);
        await injectCrashSentinels(studentPage);

        try {
            const dataHelper = new TestDataHelper(studentPage);
            const seed = dataHelper.generateTestData('multi_flap');

            // Setup game (abbreviated for speed)
            await resetEventCounters(studentPage);

            const studentLogin = new LoginHelper(studentPage);

            // Go to practice mode (simpler, no game creation needed)
            await studentPage.goto('http://localhost:3008/live/PRACTICE?e2e=1');
            await studentPage.waitForTimeout(2000); // Wait for page load

            await studentLogin.loginAsGuestStudent({ username: 'ChaosStudent2' });
            await studentPage.waitForTimeout(2000); // Wait for connection

            await logEventCounters(studentPage, 'Before multi-flap');

            // CHAOS: 3 network flaps with random durations
            console.log('🌩️🌩️🌩️ Simulating multiple network flaps with jitter...');
            await simulateNetworkFlapWithJitter(studentContext, 3, 1000, 3000);

            // Wait for full stabilization
            await studentPage.waitForTimeout(5000);
            await waitForStableConnection(studentPage, 3000);

            await logEventCounters(studentPage, 'After multi-flap');

            // ASSERTIONS
            await assertNoCrashes(studentPage);

            console.log('✅ Multiple network flaps survived');
        } finally {
            // Cleanup
            await studentContext.close();
        }
    });

    test('should handle background/resume cycle (mobile simulation)', async ({ browser }) => {
        test.setTimeout(120000);

        // Create fresh context for this test
        const studentContext = await browser.newContext();
        const studentPage = await studentContext.newPage();

        // Inject monitoring
        await injectEventCounters(studentPage);
        await injectCrashSentinels(studentPage);

        try {
            const studentLogin = new LoginHelper(studentPage);

            await studentPage.goto('http://localhost:3008/live/PRACTICE?e2e=1');
            await studentPage.waitForTimeout(2000); // Wait for page load

            await studentLogin.loginAsGuestStudent({ username: 'ChaosStudent3' });

            await studentPage.waitForTimeout(3000); // Wait for socket connection

            await resetEventCounters(studentPage);
            await logEventCounters(studentPage, 'Before background');

            // CHAOS: Simulate going to background for 5 seconds
            console.log('📱 Simulating background/resume...');
            await simulateBackgroundResume(studentPage, 5000);

            await studentPage.waitForTimeout(2000);
            await logEventCounters(studentPage, 'After resume');

            // ASSERTIONS
            await assertNoCrashes(studentPage);

            // Should still be functional (no excessive reconnects)
            const counters = await getEventCounters(studentPage);
            expect(counters.socket_reconnect).toBeLessThanOrEqual(2);

            console.log('✅ Background/resume cycle handled');
        } finally {
            // Cleanup
            await studentContext.close();
        }
    });
});

test.describe('Chaos Suite: Duplicate Event Protection', () => {
    // Each test gets its own fresh contexts to avoid pollution

    test('should deduplicate GAME_QUESTION events after reconnect', async ({ browser }) => {
        test.setTimeout(120000);

        // Create fresh contexts for this test
        const teacherContext = await browser.newContext();
        const studentContext = await browser.newContext();
        const teacherPage = await teacherContext.newPage();
        const studentPage = await studentContext.newPage();

        // Inject monitoring
        await injectEventCounters(teacherPage);
        await injectEventCounters(studentPage);
        await injectCrashSentinels(teacherPage);
        await injectCrashSentinels(studentPage);
        // Add render tracking
        await injectRenderCounters(studentPage);
        await injectRenderCounters(teacherPage);
        // Add log tracking
        await injectLogCounters(studentPage);
        await injectLogCounters(teacherPage);

        try {
            // This test verifies that client-side dedupe logic prevents
            // duplicate GAME_QUESTION processing after network disruption

            const dataHelper = new TestDataHelper(teacherPage);
            const loginHelper = new LoginHelper(teacherPage);
            const seed = dataHelper.generateTestData('dedupe_test');

            // Create teacher and game
            await dataHelper.createTeacher({
                username: seed.username,
                email: seed.email,
                password: seed.password
            });

            await loginHelper.loginAsTeacher({
                email: seed.email,
                password: seed.password
            });

            // Get questions
            const questionsResponse = await teacherPage.request.get('/api/questions/list', {
                params: { gradeLevel: 'CP', limit: '3' }
            });
            const questions = await questionsResponse.json();

            // Create template and game
            const templateResponse = await teacherPage.request.post('/api/game-templates', {
                data: {
                    name: seed.quizName,
                    gradeLevel: 'CP',
                    discipline: 'Mathématiques',
                    themes: ['Calcul'],
                    questionUids: questions.slice(0, 3),
                    description: 'Dedupe test template',
                    defaultMode: 'quiz'
                }
            });

            expect(templateResponse.ok()).toBeTruthy();
            const templateData = await templateResponse.json();
            expect(templateData.gameTemplate).toBeTruthy();

            const gameResponse = await teacherPage.request.post('/api/games', {
                data: {
                    name: `Dedupe Test ${Date.now()}`,
                    gameTemplateId: templateData.gameTemplate.id,
                    playMode: 'quiz',
                    settings: {}
                }
            });

            expect(gameResponse.ok()).toBeTruthy();
            const gameData = await gameResponse.json();
            expect(gameData.gameInstance).toBeTruthy();
            const accessCode = gameData.gameInstance.accessCode;

            // Student joins
            const studentLogin = new LoginHelper(studentPage);
            await studentLogin.loginAsGuestStudent({ username: 'DedupeStudent' });

            await studentPage.goto(`http://localhost:3008/live/${accessCode}?e2e=1`);
            await studentPage.waitForTimeout(2000);

            // Teacher starts quiz
            await teacherPage.goto(`http://localhost:3008/teacher/dashboard/${accessCode}?e2e=1`);
            await teacherPage.waitForTimeout(2000);

            // Click start button (if exists)
            const startButton = teacherPage.locator('button:has-text("Démarrer")');
            if (await startButton.count() > 0) {
                await startButton.click();
                await teacherPage.waitForTimeout(1000);
            }

            // Reset counters right before flap
            await resetEventCounters(studentPage);

            // Trigger network flap DURING active game
            console.log('🌩️ Network flap during active game...');
            await simulateNetworkFlap(await studentPage.context(), 2000);

            // Wait for reconnection
            await studentPage.waitForTimeout(5000);

            await logEventCounters(studentPage, 'After dedupe test');
            const counters = await getEventCounters(studentPage);

            // Log duplicate broadcast statistics
            console.log('\n📊 Checking for duplicate broadcasts...');
            await logEventStatistics(studentPage, 'Network Flap Test');
            const duplicates = await getDuplicateEventCounts(studentPage);
            console.log('📊 Duplicate events detected:', duplicates);

            // CRITICAL: Should receive at most 1 GAME_QUESTION after reconnect
            // (dedupe logic should drop any duplicates)
            expect(counters.game_question).toBeLessThanOrEqual(1);

            // Also check for any duplicate broadcasts
            const totalDuplicates = Object.values(duplicates).reduce((sum: number, count: number) => sum + count, 0);
            console.log(`📊 Total duplicate broadcasts: ${totalDuplicates}`);
            if (totalDuplicates > 0) {
                console.warn('⚠️  Duplicate broadcasts detected - this may indicate unnecessary network traffic');
            }

            // Log render statistics
            console.log('\n🎨 Checking React render counts...');
            await logRenderStatistics(studentPage, 'Student Page');
            await logRenderStatistics(teacherPage, 'Teacher Page');

            // Log console statistics
            console.log('\n📋 Checking console log counts...');
            await logConsoleStatistics(studentPage, 'Student Page');
            await logConsoleStatistics(teacherPage, 'Teacher Page');

            // No crashes
            await assertNoCrashes(studentPage);
            await assertNoCrashes(teacherPage);

            console.log('✅ Duplicate GAME_QUESTION protection verified');
        } finally {
            // Cleanup
            await teacherContext.close();
            await studentContext.close();
        }
    });
});

test.describe('Chaos Suite: Extended Duration Stress', () => {
    test('should remain stable during 3-minute session with periodic stress', async ({ browser }) => {
        test.setTimeout(300000); // 5 minutes (3 min test + buffer)

        const context = await browser.newContext();
        const page = await context.newPage();

        await injectEventCounters(page);
        await injectCrashSentinels(page);

        const loginHelper = new LoginHelper(page);

        await page.goto('http://localhost:3008/live/PRACTICE?e2e=1');
        await page.waitForTimeout(1000);

        await loginHelper.loginAsGuestStudent({ username: 'StressTestStudent' });

        await page.waitForTimeout(2000);

        console.log('🔥 Starting 3-minute stress test...');

        // Run for 3 minutes with periodic network flaps
        const startTime = Date.now();
        const duration = 3 * 60 * 1000; // 3 minutes
        let flapCount = 0;

        while (Date.now() - startTime < duration) {
            // Wait 30-60 seconds
            const waitTime = Math.floor(Math.random() * 30000) + 30000;
            await page.waitForTimeout(waitTime);

            // Random network flap
            console.log(`🌩️ Stress flap ${++flapCount}...`);
            await simulateNetworkFlap(context, 2000);

            // Check for crashes (ignore hydration errors)
            const crashReport = await getCrashReport(page);
            if (crashReport.hasError && !crashReport.errorMessage?.includes('Hydration failed')) {
                throw new Error(`Crash detected during stress test: ${crashReport.errorMessage}`);
            }

            // Log progress
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            console.log(`⏱️  Elapsed: ${elapsed}s / 180s`);
        }

        await logEventCounters(page, 'After 3-minute stress');

        // Final assertions
        await assertNoCrashes(page);

        // Should not have excessive reconnections (budget: 10 for 3 minutes with periodic flaps)
        await assertCounterBudget(page, 'socket_reconnect', 10);

        await context.close();

        console.log('✅ 3-minute stress test completed successfully');
    });
});

test.describe('Chaos Suite: Broadcast Duplication Detection', () => {
    test('should detect duplicate broadcast events during game flow', async ({ browser }) => {
        test.setTimeout(60000); // 1 minute

        const teacherContext = await browser.newContext();
        const studentContext = await browser.newContext();
        const teacherPage = await teacherContext.newPage();
        const studentPage = await studentContext.newPage();

        // Inject monitoring with duplicate detection
        await injectEventCounters(teacherPage);
        await injectEventCounters(studentPage);
        await injectCrashSentinels(studentPage);

        try {
            const dataHelper = new TestDataHelper(teacherPage);
            const loginHelper = new LoginHelper(teacherPage);
            const seed = dataHelper.generateTestData('duplicate_check');

            // Setup: Create teacher and game
            await dataHelper.createTeacher({
                username: seed.username,
                email: seed.email,
                password: seed.password
            });

            await loginHelper.loginAsTeacher({
                email: seed.email,
                password: seed.password
            });

            // Get questions
            const questionsResponse = await teacherPage.request.get('/api/questions/list', {
                params: { gradeLevel: 'CP', limit: '5' }
            });
            const questions = await questionsResponse.json();
            const questionUids = questions.slice(0, 5);

            // Create template
            const templateResponse = await teacherPage.request.post('/api/game-templates', {
                data: {
                    name: seed.quizName,
                    gradeLevel: 'CP',
                    discipline: 'sciences', // Required field  
                    questionUids,
                    themes: ['addition'], // Required field
                    defaultMode: 'quiz' // Changed from 'live' to 'quiz'
                }
            });

            if (!templateResponse.ok()) {
                const errorText = await templateResponse.text();
                throw new Error(`Failed to create game template: ${templateResponse.status()} ${errorText}`);
            }

            const template = await templateResponse.json();

            // Create game instance
            const gamePayload = {
                name: `Test Quiz Game ${Date.now()}`,
                playMode: 'quiz' as const,
                gameTemplateId: template.gameTemplate?.id || template.id,
                gradeLevel: 'CP',
                discipline: 'sciences',
                themes: ['addition'],
                nbOfQuestions: 3,
                settings: {
                    defaultMode: 'direct',
                    avatar: '🧑‍🏫',
                    username: seed.username
                }
            };

            const instanceResponse = await teacherPage.request.post('/api/games', {
                data: gamePayload
            });

            if (!instanceResponse.ok()) {
                const errorText = await instanceResponse.text();
                throw new Error(`Failed to create game instance: ${instanceResponse.status()} ${errorText}`);
            }

            const instance = await instanceResponse.json();
            const accessCode = instance.gameInstance?.accessCode || instance.accessCode;

            // Teacher navigates to dashboard
            await teacherPage.goto(`/teacher/dashboard/${accessCode}`, { waitUntil: 'networkidle' });
            await teacherPage.waitForTimeout(2000);

            // Student joins
            await studentPage.goto(`/live/${accessCode}`);
            await studentPage.fill('input[type="text"]', 'TestStudent');
            await studentPage.click('button:has-text("Rejoindre")');
            await studentPage.waitForSelector('[data-testid="waiting-room"]', { timeout: 10000 });

            console.log('📊 Reset counters before game starts');
            await resetEventCounters(studentPage);

            // Teacher starts game and advances through questions
            for (let i = 0; i < Math.min(3, questionUids.length); i++) {
                console.log(`\n📝 Question ${i + 1}/${questionUids.length}`);

                if (i === 0) {
                    await teacherPage.click('button:has-text("Démarrer")');
                } else {
                    await teacherPage.click('button:has-text("Question suivante")');
                }

                await studentPage.waitForSelector('[data-testid="question-display"]', { timeout: 10000 });

                // Log statistics after each question
                await logEventStatistics(studentPage, `After Question ${i + 1}`);

                // Check for duplicates so far
                const statsCheck = await studentPage.evaluate(() => {
                    return {
                        duplicates: (window as any).__mqDuplicates || {},
                        counters: (window as any).__mqCounters || {}
                    };
                });

                if (Object.keys(statsCheck.duplicates).length > 0) {
                    console.warn(`⚠️  Duplicates detected at Question ${i + 1}:`, statsCheck.duplicates);
                }

                // Wait a bit before next question
                await studentPage.waitForTimeout(1000);
            }

            // Final check for duplicates
            console.log('\n📊 Final duplicate check...');
            await logEventStatistics(studentPage, 'End of Game');
            await assertNoDuplicateBroadcasts(studentPage);

            console.log('✅ No duplicate broadcasts detected');

        } finally {
            await teacherContext.close();
            await studentContext.close();
        }
    });
});
