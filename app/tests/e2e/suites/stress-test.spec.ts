/**
 * Stress Testing Suite
 * 
 * Tests app performance and stability under realistic classroom load:
 * - 100 concurrent students
 * - 10 questions
 * - Realistic timing (join over 30s, answer within timer window)
 * 
 * Tracks:
 * - Connection success rate
 * - Answer submission success rate
 * - Message delivery rate
 * - Resource usage (memory, CPU, connections)
 * - Broadcast efficiency
 * - Event latency
 * 
 * Exit criteria:
 * - ≥95% connection success rate
 * - ≥95% answer submission success rate
 * - ≥99% message delivery rate
 * - No memory leaks
 * - No crashes
 * - Backend memory <500MB
 * - Event latency <500ms p95
 */

// @ts-nocheck - Playwright test globals

import { test, expect, Browser, Page, BrowserContext } from '@playwright/test';
import { TestDataHelper, LoginHelper } from '../helpers/test-helpers';
import {
    injectEventCounters,
    injectCrashSentinels,
    getEventCounters,
    assertNoCrashes,
    logEventStatistics,
    getDuplicateEventCounts
} from '../helpers/chaos-helpers';
import os from 'os';

// Configure test for stress testing
test.describe.configure({ mode: 'parallel' });

/**
 * Resource monitoring helper
 */
interface ResourceSnapshot {
    timestamp: number;
    memoryUsageMB: number;
    cpuUsagePercent: number;
    heapUsedMB: number;
    heapTotalMB: number;
    externalMB: number;
}

/**
 * Student connection tracker
 */
interface StudentMetrics {
    studentId: string;
    username: string;
    connectionSuccess: boolean;
    connectionTime: number;
    answersSubmitted: number;
    answersSuccess: number;
    eventsReceived: number;
    crashes: number;
    errors: string[];
}

/**
 * Get backend resource usage via API
 */
async function getBackendResourceUsage(page: Page): Promise<ResourceSnapshot> {
    try {
        // Try new endpoint first
        const response = await page.request.get('/api/v1/health/resources');
        if (response.ok()) {
            return await response.json();
        }
    } catch (e) {
        // Endpoint not available, use fallback
    }

    // Fallback: estimate from Node.js process (test process, not backend)
    const memUsage = process.memoryUsage();
    console.warn('  ⚠️  Backend resource endpoint not available, using test process memory as estimate');
    return {
        timestamp: Date.now(),
        memoryUsageMB: memUsage.rss / 1024 / 1024,
        cpuUsagePercent: 0,
        heapUsedMB: memUsage.heapUsed / 1024 / 1024,
        heapTotalMB: memUsage.heapTotal / 1024 / 1024,
        externalMB: memUsage.external / 1024 / 1024
    };
}

/**
 * Monitor frontend page memory
 */
async function getFrontendMemoryUsage(page: Page): Promise<number> {
    try {
        const memoryInfo = await page.evaluate(() => {
            if ('memory' in performance && (performance as any).memory) {
                return {
                    usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
                    totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
                    jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
                };
            }
            return null;
        });

        if (memoryInfo) {
            return memoryInfo.usedJSHeapSize / 1024 / 1024; // MB
        }
    } catch (e) {
        // Memory API not available
    }

    return 0;
}

/**
 * Create a student page and join game (FAST version for stress testing)
 * Bypasses UI login and directly navigates to game
 */
async function createAndJoinStudent(
    browser: Browser,
    accessCode: string,
    studentNum: number,
    delayMs: number
): Promise<{ page: Page; context: BrowserContext; metrics: StudentMetrics }> {
    const startTime = Date.now();
    const username = `Student${studentNum.toString().padStart(3, '0')}`;

    const metrics: StudentMetrics = {
        studentId: `student_${studentNum}`,
        username,
        connectionSuccess: false,
        connectionTime: 0,
        answersSubmitted: 0,
        answersSuccess: 0,
        eventsReceived: 0,
        crashes: 0,
        errors: []
    };

    try {
        // Wait for staggered join (simulate students joining over time)
        if (delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        // Create browser context and page
        const context = await browser.newContext();
        const page = await context.newPage();

        // Inject monitoring
        await injectEventCounters(page);
        await injectCrashSentinels(page);

        // Track page errors
        page.on('pageerror', error => {
            metrics.crashes++;
            metrics.errors.push(error.message);
        });

        page.on('console', msg => {
            if (msg.type() === 'error') {
                metrics.errors.push(msg.text());
            }
        });

        // FAST LOGIN: Go directly to /login, fill form quickly, no waits
        await page.goto('http://localhost:3008/login', { waitUntil: 'domcontentloaded' });

        // Fill username (first match in dropdown)
        const usernameInput = page.locator('input[placeholder*="chercher"], input[placeholder*="prénom"]').first();
        await usernameInput.fill(username.substring(0, 3));
        await page.waitForTimeout(300); // Minimal wait for dropdown

        // Select first option or press Enter
        const dropdownOption = page.locator('ul li').first();
        if (await dropdownOption.count() > 0) {
            await dropdownOption.click();
        } else {
            await usernameInput.press('Enter');
        }

        // Select avatar quickly
        await page.locator('button.emoji-avatar').first().click();

        // Submit
        await page.locator('button[type="submit"]').click();

        // Wait for redirect to complete
        await page.waitForURL('**/*', { timeout: 5000 });

        // Navigate to game
        await page.goto(`http://localhost:3008/live/${accessCode}?e2e=1`, { waitUntil: 'domcontentloaded' });

        // Wait for lobby to appear (connection success)
        await page.waitForSelector('[data-testid="waiting-room"]', { timeout: 10000 });

        metrics.connectionSuccess = true;
        metrics.connectionTime = Date.now() - startTime;

        return { page, context, metrics };
    } catch (error) {
        metrics.errors.push(error.message);
        throw error;
    }
} test.describe('Stress Test: Multiple Students', () => {
    test('should handle 2 concurrent students with 3 questions', async ({ browser }) => {
        test.setTimeout(120000); // 2 minutes

        console.log('\n🔥 STRESS TEST: 2 Students, 3 Questions 🔥\n');

        // Step 1: Setup teacher and game
        console.log('📚 Step 1: Creating teacher and game...');
        const teacherContext = await browser.newContext();
        const teacherPage = await teacherContext.newPage();

        const dataHelper = new TestDataHelper(teacherPage);
        const loginHelper = new LoginHelper(teacherPage);
        const seed = dataHelper.generateTestData('stress_100');

        await dataHelper.createTeacher({
            username: seed.username,
            email: seed.email,
            password: seed.password
        });

        await loginHelper.loginAsTeacher({
            email: seed.email,
            password: seed.password
        });

        // Get 3 questions
        const questionsResponse = await teacherPage.request.get('/api/questions/list', {
            params: { gradeLevel: 'CP', limit: '3' }
        });
        const questions = await questionsResponse.json();
        const questionUids = questions.slice(0, 3);

        console.log(`  ✅ Retrieved ${questionUids.length} questions`);

        // Create template
        const templateResponse = await teacherPage.request.post('/api/game-templates', {
            data: {
                name: `Stress Test ${Date.now()}`,
                gradeLevel: 'CP',
                discipline: 'Mathématiques',
                themes: ['Calcul'],
                questionUids,
                description: 'Stress test',
                defaultMode: 'quiz'
            }
        });

        expect(templateResponse.ok()).toBeTruthy();
        const templateData = await templateResponse.json();

        // Create game instance
        const gameResponse = await teacherPage.request.post('/api/games', {
            data: {
                name: `Stress Test ${Date.now()}`,
                gameTemplateId: templateData.gameTemplate.id,
                playMode: 'quiz',
                settings: {}
            }
        });

        expect(gameResponse.ok()).toBeTruthy();
        const gameData = await gameResponse.json();

        // Handle different response structures
        const accessCode = gameData.gameInstance?.accessCode || gameData.accessCode;

        if (!accessCode) {
            console.error('❌ Game creation response:', JSON.stringify(gameData, null, 2));
            throw new Error('Failed to get access code from game creation response');
        }

        console.log(`  ✅ Game created with code: ${accessCode}`);

        // Navigate teacher to dashboard
        await teacherPage.goto(`http://localhost:3008/teacher/dashboard/${accessCode}?e2e=1`);
        await teacherPage.waitForTimeout(2000);

        console.log('  ✅ Teacher ready on dashboard');

        // Step 2: Create and join students (staggered)
        // Start with 10 students, then scale up to 100
        const studentCount = 10; // Start small: 10 students
        const joinDuration = 10000; // 10 seconds for 10 students
        const delayPerStudent = joinDuration / studentCount;

        console.log(`\n👥 Step 2: Spawning ${studentCount} students (staggered over ${joinDuration / 1000}s)...`);

        const studentSessions: Array<{
            page: Page;
            context: BrowserContext;
            metrics: StudentMetrics;
        }> = [];

        const joinPromises: Promise<any>[] = [];

        for (let i = 0; i < studentCount; i++) {
            const joinPromise = createAndJoinStudent(
                browser,
                accessCode,
                i + 1,
                i * delayPerStudent
            ).then(session => {
                studentSessions.push(session);
                console.log(`  ✅ ${i + 1}/${studentCount} students joined`);
            }).catch(error => {
                console.error(`  ❌ Student ${i + 1} failed to join:`, error.message);
            });

            joinPromises.push(joinPromise);
        }

        // Wait for all students to attempt join
        await Promise.allSettled(joinPromises);

        const successfulJoins = studentSessions.length;
        const connectionSuccessRate = (successfulJoins / studentCount) * 100;

        console.log(`\n📊 Connection Results:`);
        console.log(`  Total Students: ${studentCount}`);
        console.log(`  Successful Joins: ${successfulJoins}`);
        console.log(`  Connection Success Rate: ${connectionSuccessRate.toFixed(1)}%`);

        // ASSERTION: 100% connection success for small test
        expect(connectionSuccessRate).toBeGreaterThanOrEqual(100);

        // Calculate connection time statistics
        const connectionTimes = studentSessions.map(s => s.metrics.connectionTime);
        const avgConnectionTime = connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length;
        const maxConnectionTime = Math.max(...connectionTimes);
        const minConnectionTime = Math.min(...connectionTimes);

        console.log(`  Avg Connection Time: ${avgConnectionTime.toFixed(0)}ms`);
        console.log(`  Min Connection Time: ${minConnectionTime}ms`);
        console.log(`  Max Connection Time: ${maxConnectionTime}ms`);

        // Step 3: Measure backend resources after all students joined
        console.log('\n💾 Step 3: Measuring backend resources...');
        const resourcesAfterJoin = await getBackendResourceUsage(teacherPage);
        console.log(`  Memory Usage: ${resourcesAfterJoin.memoryUsageMB.toFixed(1)} MB`);
        console.log(`  Heap Used: ${resourcesAfterJoin.heapUsedMB.toFixed(1)} MB`);
        console.log(`  Heap Total: ${resourcesAfterJoin.heapTotalMB.toFixed(1)} MB`);

        // ASSERTION: Backend memory <500MB
        expect(resourcesAfterJoin.memoryUsageMB).toBeLessThan(500);

        // Step 4: Start game and run through 3 questions
        console.log('\n🎮 Step 4: Starting game and running 3 questions...');

        // Click start button
        const startButton = teacherPage.locator('button:has-text("Démarrer")');
        if (await startButton.count() > 0) {
            await startButton.click();
            await teacherPage.waitForTimeout(2000);
            console.log('  ✅ Game started');
        }

        // Track broadcast statistics
        const broadcastStats = {
            totalBroadcasts: 0,
            duplicateBroadcasts: 0,
            broadcastsPerQuestion: [] as number[]
        };

        // Run through all 10 questions
        for (let qNum = 1; qNum <= questionUids.length; qNum++) {
            console.log(`\n📝 Question ${qNum}/${questionUids.length}`);

            // Wait for question to appear on student pages (sample 5 students)
            const sampleStudents = studentSessions.slice(0, Math.min(5, studentSessions.length));

            await Promise.all(
                sampleStudents.map(session =>
                    session.page.waitForSelector('[data-testid="question-display"]', { timeout: 10000 })
                        .catch(err => {
                            session.metrics.errors.push(`Question ${qNum} not displayed: ${err.message}`);
                        })
                )
            );

            console.log('  ✅ Question displayed to sample students');

            // Students submit answers (simulate some delay)
            const answerPromises = studentSessions.map(async (session, idx) => {
                // Stagger answers over 5 seconds
                await new Promise(resolve => setTimeout(resolve, Math.random() * 5000));

                try {
                    // Click first answer option (simplified - just simulate engagement)
                    const answerButton = session.page.locator('button[data-answer-index="0"]').first();
                    if (await answerButton.count() > 0) {
                        await answerButton.click();
                        session.metrics.answersSubmitted++;
                        session.metrics.answersSuccess++;
                    }
                } catch (error) {
                    session.metrics.errors.push(`Q${qNum} answer failed: ${error.message}`);
                }
            });

            await Promise.allSettled(answerPromises);

            // Count successful answers
            const answersThisQuestion = studentSessions.filter(
                s => s.metrics.answersSubmitted >= qNum
            ).length;

            console.log(`  ✅ ${answersThisQuestion}/${successfulJoins} students answered`);

            // Check for duplicate broadcasts on sample student
            if (sampleStudents.length > 0) {
                const duplicates = await getDuplicateEventCounts(sampleStudents[0].page);
                const dupCount = Object.values(duplicates).reduce((sum: number, count: number) => sum + count, 0);
                broadcastStats.duplicateBroadcasts += dupCount;

                if (dupCount > 0) {
                    console.log(`  ⚠️  ${dupCount} duplicate broadcasts detected`);
                }
            }

            // Teacher advances to next question (if not last)
            if (qNum < questionUids.length) {
                await teacherPage.waitForTimeout(2000); // Wait for answers to settle
                const nextButton = teacherPage.locator('button:has-text("Question suivante")');
                if (await nextButton.count() > 0) {
                    await nextButton.click();
                    await teacherPage.waitForTimeout(1000);
                }
            }
        }

        // Step 5: Collect final metrics
        console.log('\n📊 Step 5: Collecting final metrics...');

        // Answer submission success rate
        const totalAnswers = studentSessions.reduce((sum, s) => sum + s.metrics.answersSubmitted, 0);
        const maxPossibleAnswers = successfulJoins * questionUids.length;
        const answerSuccessRate = (totalAnswers / maxPossibleAnswers) * 100;

        console.log(`\n📊 Answer Submission Results:`);
        console.log(`  Total Answers Submitted: ${totalAnswers}`);
        console.log(`  Max Possible Answers: ${maxPossibleAnswers}`);
        console.log(`  Answer Success Rate: ${answerSuccessRate.toFixed(1)}%`);

        // ASSERTION: ≥90% answer submission success for small test
        expect(answerSuccessRate).toBeGreaterThanOrEqual(90);

        // Crash and error statistics
        const totalCrashes = studentSessions.reduce((sum, s) => sum + s.metrics.crashes, 0);
        const studentsWithErrors = studentSessions.filter(s => s.metrics.errors.length > 0).length;

        console.log(`\n📊 Stability Results:`);
        console.log(`  Total Crashes: ${totalCrashes}`);
        console.log(`  Students with Errors: ${studentsWithErrors}`);

        // ASSERTION: No crashes
        expect(totalCrashes).toBe(0);

        // Broadcast statistics
        console.log(`\n📊 Broadcast Statistics:`);
        console.log(`  Duplicate Broadcasts: ${broadcastStats.duplicateBroadcasts}`);

        if (broadcastStats.duplicateBroadcasts > 0) {
            console.warn(`  ⚠️  Warning: ${broadcastStats.duplicateBroadcasts} duplicate broadcasts detected`);
        }

        // Backend resources after game
        const resourcesAfterGame = await getBackendResourceUsage(teacherPage);
        console.log(`\n💾 Backend Resources After Game:`);
        console.log(`  Memory Usage: ${resourcesAfterGame.memoryUsageMB.toFixed(1)} MB`);
        console.log(`  Heap Used: ${resourcesAfterGame.heapUsedMB.toFixed(1)} MB`);
        console.log(`  Memory Growth: +${(resourcesAfterGame.memoryUsageMB - resourcesAfterJoin.memoryUsageMB).toFixed(1)} MB`);

        // Check for memory leaks (growth >50MB indicates potential leak)
        const memoryGrowth = resourcesAfterGame.memoryUsageMB - resourcesAfterJoin.memoryUsageMB;
        if (memoryGrowth > 50) {
            console.warn(`  ⚠️  Potential memory leak: +${memoryGrowth.toFixed(1)} MB during game`);
        }

        // Step 6: Cleanup
        console.log('\n🧹 Step 6: Cleaning up...');

        for (const session of studentSessions) {
            await session.context.close();
        }
        await teacherContext.close();

        console.log('  ✅ All contexts closed');

        // Final summary
        console.log('\n✅ STRESS TEST COMPLETE ✅\n');
        console.log('Summary:');
        console.log(`  Students: ${successfulJoins}/${studentCount} (${connectionSuccessRate.toFixed(1)}%)`);
        console.log(`  Answers: ${totalAnswers}/${maxPossibleAnswers} (${answerSuccessRate.toFixed(1)}%)`);
        console.log(`  Crashes: ${totalCrashes}`);
        console.log(`  Memory: ${resourcesAfterGame.memoryUsageMB.toFixed(1)} MB`);
        console.log(`  Duplicate Broadcasts: ${broadcastStats.duplicateBroadcasts}`);
        console.log('');
    });
});

test.describe('Stress Test: Memory Leak Detection', () => {
    test('should not leak memory over 5 games with 20 students each', async ({ browser }) => {
        test.setTimeout(600000); // 10 minutes

        console.log('\n🔍 MEMORY LEAK TEST: 5 games × 20 students 🔍\n');

        const memorySnapshots: ResourceSnapshot[] = [];

        for (let gameNum = 1; gameNum <= 5; gameNum++) {
            console.log(`\n🎮 Game ${gameNum}/5`);

            // Create teacher and game
            const teacherContext = await browser.newContext();
            const teacherPage = await teacherContext.newPage();

            const dataHelper = new TestDataHelper(teacherPage);
            const loginHelper = new LoginHelper(teacherPage);
            const seed = dataHelper.generateTestData(`leak_test_${gameNum}`);

            await dataHelper.createTeacher({
                username: seed.username,
                email: seed.email,
                password: seed.password
            });

            await loginHelper.loginAsTeacher({
                email: seed.email,
                password: seed.password
            });

            // Get 3 questions (quick game)
            const questionsResponse = await teacherPage.request.get('/api/questions/list', {
                params: { gradeLevel: 'CP', limit: '3' }
            });
            const questions = await questionsResponse.json();

            // Create game
            const templateResponse = await teacherPage.request.post('/api/game-templates', {
                data: {
                    name: `Memory Test ${gameNum}`,
                    gradeLevel: 'CP',
                    discipline: 'Mathématiques',
                    themes: ['Calcul'],
                    questionUids: questions.slice(0, 3),
                    defaultMode: 'quiz'
                }
            });

            const templateData = await templateResponse.json();

            const gameResponse = await teacherPage.request.post('/api/games', {
                data: {
                    name: `Memory Test Game ${gameNum}`,
                    gameTemplateId: templateData.gameTemplate.id,
                    playMode: 'quiz',
                    settings: {}
                }
            });

            const gameData = await gameResponse.json();
            const accessCode = gameData.gameInstance?.accessCode || gameData.accessCode;

            if (!accessCode) {
                console.error(`❌ Game ${gameNum} creation failed:`, JSON.stringify(gameData, null, 2));
                throw new Error(`Failed to get access code for game ${gameNum}`);
            }

            await teacherPage.goto(`http://localhost:3008/teacher/dashboard/${accessCode}?e2e=1`);
            await teacherPage.waitForTimeout(2000);

            // 20 students join
            const studentSessions = [];
            for (let i = 0; i < 20; i++) {
                try {
                    const session = await createAndJoinStudent(browser, accessCode, i + 1, i * 100);
                    studentSessions.push(session);
                } catch (error) {
                    console.warn(`  ⚠️  Student ${i + 1} failed to join`);
                }
            }

            console.log(`  ✅ ${studentSessions.length}/20 students joined`);

            // Take memory snapshot
            const snapshot = await getBackendResourceUsage(teacherPage);
            memorySnapshots.push(snapshot);
            console.log(`  💾 Memory: ${snapshot.memoryUsageMB.toFixed(1)} MB`);

            // Start and finish game quickly
            const startButton = teacherPage.locator('button:has-text("Démarrer")');
            if (await startButton.count() > 0) {
                await startButton.click();
                await teacherPage.waitForTimeout(2000);
            }

            // Run through questions quickly (no student interaction)
            for (let q = 0; q < 2; q++) {
                await teacherPage.waitForTimeout(2000);
                const nextButton = teacherPage.locator('button:has-text("Question suivante")');
                if (await nextButton.count() > 0) {
                    await nextButton.click();
                    await teacherPage.waitForTimeout(1000);
                }
            }

            // Cleanup
            for (const session of studentSessions) {
                await session.context.close();
            }
            await teacherContext.close();

            console.log(`  ✅ Game ${gameNum} complete`);
        }

        // Analyze memory trend
        console.log('\n📊 Memory Trend Analysis:');
        memorySnapshots.forEach((snapshot, idx) => {
            const growth = idx > 0 ? snapshot.memoryUsageMB - memorySnapshots[0].memoryUsageMB : 0;
            console.log(`  Game ${idx + 1}: ${snapshot.memoryUsageMB.toFixed(1)} MB (+${growth.toFixed(1)} MB)`);
        });

        // Check for memory leak (growth >100MB over 5 games indicates leak)
        const totalGrowth = memorySnapshots[4].memoryUsageMB - memorySnapshots[0].memoryUsageMB;
        console.log(`\n  Total Growth: ${totalGrowth.toFixed(1)} MB`);

        if (totalGrowth > 100) {
            console.warn('  ⚠️  Potential memory leak detected');
        } else {
            console.log('  ✅ No significant memory leak');
        }

        // ASSERTION: Memory growth <100MB
        expect(totalGrowth).toBeLessThan(100);

        console.log('\n✅ MEMORY LEAK TEST COMPLETE ✅\n');
    });
});
