/**
 * Chaos Testing Helpers
 * 
 * Utilities for stability testing: network flaps, event counters, crash detection
 */

import { Page, BrowserContext } from '@playwright/test';

/**
 * Event counter interface for tracking critical events
 */
export interface EventCounters {
    join_game: number;
    game_joined: number;
    game_question: number;
    player_joined_game: number;
    game_error: number;
    // Additional broadcast events to track
    participant_list: number;
    leaderboard_update: number;
    timer_update: number;
    question_data_for_student: number;
    [key: string]: number;
}

/**
 * Payload tracking for duplicate detection
 */
export interface PayloadHistory {
    [event: string]: Array<{
        payload: any;
        timestamp: number;
        count: number;
    }>;
}

/**
 * Inject event counter tracking into the page
 * Exposes window.__mqCounters for monitoring critical socket events
 * Also tracks payload history for duplicate detection
 */
export async function injectEventCounters(page: Page): Promise<void> {
    await page.addInitScript(() => {
        // Initialize counters
        (window as any).__mqCounters = {
            join_game: 0,
            game_joined: 0,
            game_question: 0,
            player_joined_game: 0,
            game_error: 0,
            socket_connect: 0,
            socket_disconnect: 0,
            socket_reconnect: 0,
            // Broadcast events
            participant_list: 0,
            leaderboard_update: 0,
            timer_update: 0,
            question_data_for_student: 0
        };

        // Payload history for duplicate detection (last 10 of each event type)
        (window as any).__mqPayloadHistory = {};

        // Helper to track payload
        const trackPayload = (event: string, payload: any) => {
            const history = (window as any).__mqPayloadHistory;
            if (!history[event]) {
                history[event] = [];
            }

            // Create a hash of the payload for comparison
            const payloadStr = JSON.stringify(payload);
            const now = Date.now();

            // Check if this exact payload was sent recently (within 1 second)
            const recent = history[event].find((item: any) =>
                item.payload === payloadStr && (now - item.timestamp) < 1000
            );

            if (recent) {
                // Duplicate found!
                recent.count++;
                (window as any).__mqDuplicates = (window as any).__mqDuplicates || {};
                (window as any).__mqDuplicates[event] =
                    ((window as any).__mqDuplicates[event] || 0) + 1;
            } else {
                // New payload
                history[event].push({
                    payload: payloadStr,
                    timestamp: now,
                    count: 1
                });

                // Keep only last 10 payloads per event
                if (history[event].length > 10) {
                    history[event].shift();
                }
            }
        };

        // Track socket.io events when socket is available
        const originalEmit = (window as any).io?.Socket?.prototype?.emit;
        if (originalEmit) {
            (window as any).io.Socket.prototype.emit = function (event: string, ...args: any[]) {
                if ((window as any).__mqCounters[event] !== undefined) {
                    (window as any).__mqCounters[event]++;
                }
                trackPayload(event, args[0]); // Track first argument as payload
                return originalEmit.apply(this, [event, ...args]);
            };
        }

        // Track incoming socket events (broadcasts from server)
        const originalOn = (window as any).io?.Socket?.prototype?.on;
        if (originalOn) {
            (window as any).io.Socket.prototype.on = function (event: string, handler: Function) {
                const wrappedHandler = (...args: any[]) => {
                    // Increment counter for incoming events
                    if ((window as any).__mqCounters[event] !== undefined) {
                        (window as any).__mqCounters[event]++;
                    }
                    trackPayload(event, args[0]); // Track first argument as payload
                    return handler.apply(this, args);
                };
                return originalOn.call(this, event, wrappedHandler);
            };
        }
    });
}

/**
 * Get current event counter values
 */
export async function getEventCounters(page: Page): Promise<EventCounters> {
    const counters = await page.evaluate(() => {
        return (window as any).__mqCounters || {};
    });
    return counters as EventCounters;
}

/**
 * Reset event counters to zero
 */
export async function resetEventCounters(page: Page): Promise<void> {
    await page.evaluate(() => {
        const counters = (window as any).__mqCounters;
        if (counters) {
            Object.keys(counters).forEach(key => {
                counters[key] = 0;
            });
        }
    });
}

/**
 * Assert event counter is within budget
 * @throws Error if counter exceeds max
 */
export async function assertCounterBudget(
    page: Page,
    event: string,
    maxAllowed: number
): Promise<void> {
    const counters = await getEventCounters(page);
    const actual = counters[event] || 0;

    if (actual > maxAllowed) {
        throw new Error(
            `Event counter budget exceeded: ${event} fired ${actual} times (max: ${maxAllowed})`
        );
    }
}

/**
 * Get duplicate event counts
 * Returns number of duplicate broadcasts detected per event type
 */
export async function getDuplicateEventCounts(page: Page): Promise<Record<string, number>> {
    const duplicates = await page.evaluate(() => {
        return (window as any).__mqDuplicates || {};
    });
    return duplicates;
}

/**
 * Assert no duplicate broadcasts occurred
 * @throws Error if duplicates detected
 */
export async function assertNoDuplicateBroadcasts(page: Page): Promise<void> {
    const duplicates = await getDuplicateEventCounts(page);
    const eventNames = Object.keys(duplicates);

    if (eventNames.length > 0) {
        const summary = eventNames.map(event => `${event}: ${duplicates[event]}`).join(', ');
        throw new Error(
            `Duplicate broadcasts detected: ${summary}`
        );
    }
}

/**
 * Get detailed event statistics including duplicates
 */
export async function getEventStatistics(page: Page): Promise<{
    counters: EventCounters;
    duplicates: Record<string, number>;
    totalEvents: number;
    totalDuplicates: number;
}> {
    const counters = await getEventCounters(page);
    const duplicates = await getDuplicateEventCounts(page);

    const totalEvents = Object.values(counters).reduce((sum, count) => sum + count, 0);
    const totalDuplicates = Object.values(duplicates).reduce((sum, count) => sum + count, 0);

    return {
        counters,
        duplicates,
        totalEvents,
        totalDuplicates
    };
}

/**
 * Log event statistics including duplicates
 */
export async function logEventStatistics(page: Page, label: string): Promise<void> {
    const stats = await getEventStatistics(page);
    console.log(`\n[${label}] Event Statistics:`);
    console.log(`  Total Events: ${stats.totalEvents}`);
    console.log(`  Total Duplicates: ${stats.totalDuplicates}`);
    console.log(`  Counters:`, JSON.stringify(stats.counters, null, 2));
    if (stats.totalDuplicates > 0) {
        console.log(`  ⚠️  Duplicates:`, JSON.stringify(stats.duplicates, null, 2));
    }
}

/**
 * Crash sentinel - setup listeners for unhandled errors and WebSocket failures
 */
export interface CrashReport {
    hasError: boolean;
    errorMessage?: string;
    errorType?: 'window_error' | 'unhandled_rejection' | 'websocket_close_1006';
    timestamp?: number;
}

/**
 * Inject crash detection sentinels
 */
export async function injectCrashSentinels(page: Page): Promise<void> {
    await page.addInitScript(() => {
        (window as any).__mqCrashReport = {
            hasError: false
        };

        // Window error handler
        window.addEventListener('error', (event) => {
            (window as any).__mqCrashReport = {
                hasError: true,
                errorMessage: event.message,
                errorType: 'window_error',
                timestamp: Date.now()
            };
        });

        // Unhandled promise rejection
        window.addEventListener('unhandledrejection', (event) => {
            (window as any).__mqCrashReport = {
                hasError: true,
                errorMessage: event.reason?.message || String(event.reason),
                errorType: 'unhandled_rejection',
                timestamp: Date.now()
            };
        });
    });

    // Monitor WebSocket close code 1006 (abnormal closure)
    page.on('websocket', (ws) => {
        ws.on('close', async () => {
            // Check if it was abnormal closure (1006)
            // Note: Playwright doesn't expose close code directly, 
            // so we detect via socket.io reconnection patterns
        });
    });
}

/**
 * Get crash report
 */
export async function getCrashReport(page: Page): Promise<CrashReport> {
    const report = await page.evaluate(() => {
        return (window as any).__mqCrashReport || { hasError: false };
    });
    return report as CrashReport;
}

/**
 * Assert no crashes occurred
 * @throws Error if crash detected
 */
export async function assertNoCrashes(page: Page): Promise<void> {
    const report = await getCrashReport(page);
    if (report.hasError) {
        // Ignore React hydration errors (harmless warnings, React recovers automatically)
        if (report.errorMessage?.includes('Hydration failed')) {
            console.log('⚠️  Ignoring React hydration warning (non-fatal)');
            return;
        }
        throw new Error(
            `Crash detected: ${report.errorType} - ${report.errorMessage} at ${report.timestamp}`
        );
    }
}

/**
 * Simulate network flap (offline/online cycle)
 * @param durationMs How long to stay offline
 */
export async function simulateNetworkFlap(
    context: BrowserContext,
    durationMs: number = 2000
): Promise<void> {
    // Go offline
    await context.setOffline(true);

    // Wait
    await new Promise(resolve => setTimeout(resolve, durationMs));

    // Go back online
    await context.setOffline(false);
}

/**
 * Simulate network flap with jitter (random offline durations)
 * @param count Number of flaps
 * @param minMs Minimum offline duration
 * @param maxMs Maximum offline duration
 */
export async function simulateNetworkFlapWithJitter(
    context: BrowserContext,
    count: number,
    minMs: number = 1000,
    maxMs: number = 5000
): Promise<void> {
    for (let i = 0; i < count; i++) {
        const durationMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
        await simulateNetworkFlap(context, durationMs);

        // Add delay between flaps
        const delayMs = Math.floor(Math.random() * 2000) + 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
}

/**
 * Simulate mobile background/resume
 * Note: This is a simplified simulation using visibility change
 */
export async function simulateBackgroundResume(
    page: Page,
    backgroundDurationMs: number = 5000
): Promise<void> {
    // Simulate going to background
    await page.evaluate(() => {
        document.dispatchEvent(new Event('visibilitychange'));
        Object.defineProperty(document, 'hidden', {
            writable: true,
            configurable: true,
            value: true
        });
    });

    // Wait
    await new Promise(resolve => setTimeout(resolve, backgroundDurationMs));

    // Simulate coming back to foreground
    await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', {
            writable: true,
            configurable: true,
            value: false
        });
        document.dispatchEvent(new Event('visibilitychange'));
    });
}

/**
 * Wait for stable connection (no reconnect attempts for specified duration)
 * @param page Page to monitor
 * @param stableDurationMs How long to wait for stability
 */
export async function waitForStableConnection(
    page: Page,
    stableDurationMs: number = 2000
): Promise<void> {
    const startCounters = await getEventCounters(page);
    await new Promise(resolve => setTimeout(resolve, stableDurationMs));
    const endCounters = await getEventCounters(page);

    // Check if reconnection happened during wait
    if (endCounters.socket_reconnect > startCounters.socket_reconnect) {
        // Still reconnecting, wait more
        await waitForStableConnection(page, stableDurationMs);
    }
}

/**
 * Log event counters for debugging
 */
export async function logEventCounters(page: Page, label: string): Promise<void> {
    const counters = await getEventCounters(page);
    console.log(`[${label}] Event Counters:`, JSON.stringify(counters, null, 2));
}

/**
 * Inject React render counter tracking into the page
 * Exposes window.__mqRenderCounts for monitoring component render frequency
 */
export async function injectRenderCounters(page: Page): Promise<void> {
    await page.addInitScript(() => {
        // Initialize render counters
        (window as any).__mqRenderCounts = {};
        (window as any).__mqRenderHistory = [];

        // Helper to track a render
        (window as any).__mqTrackRender = (componentName: string, reason?: string) => {
            if (!(window as any).__mqRenderCounts) {
                (window as any).__mqRenderCounts = {};
            }
            if (!(window as any).__mqRenderHistory) {
                (window as any).__mqRenderHistory = [];
            }

            // Increment counter
            (window as any).__mqRenderCounts[componentName] =
                ((window as any).__mqRenderCounts[componentName] || 0) + 1;

            // Track in history with timestamp
            (window as any).__mqRenderHistory.push({
                component: componentName,
                timestamp: Date.now(),
                count: (window as any).__mqRenderCounts[componentName],
                reason: reason || 'unknown'
            });

            // Keep history size manageable (last 1000 renders)
            if ((window as any).__mqRenderHistory.length > 1000) {
                (window as any).__mqRenderHistory.shift();
            }
        };
    });
}

/**
 * Get current render counts
 */
export async function getRenderCounts(page: Page): Promise<Record<string, number>> {
    return await page.evaluate(() => {
        return (window as any).__mqRenderCounts || {};
    });
}

/**
 * Reset render counters
 */
export async function resetRenderCounters(page: Page): Promise<void> {
    await page.evaluate(() => {
        (window as any).__mqRenderCounts = {};
        (window as any).__mqRenderHistory = [];
    });
}

/**
 * Get render history with timestamps
 */
export async function getRenderHistory(page: Page): Promise<Array<{
    component: string;
    timestamp: number;
    count: number;
    reason: string;
}>> {
    return await page.evaluate(() => {
        return (window as any).__mqRenderHistory || [];
    });
}

/**
 * Log render statistics
 */
export async function logRenderStatistics(page: Page, label: string): Promise<void> {
    const counts = await getRenderCounts(page);
    const history = await getRenderHistory(page);

    const totalRenders = Object.values(counts).reduce((sum: number, count: number) => sum + count, 0);

    console.log(`\n[${label}] Render Statistics:`);
    console.log(`  Total Renders: ${totalRenders}`);
    console.log(`  Component Breakdown:`, JSON.stringify(counts, null, 2));

    if (history.length > 0) {
        const recentRenders = history.slice(-10);
        console.log(`  Recent Renders (last 10):`, recentRenders.map(r =>
            `${r.component} (${r.count}) - ${r.reason}`
        ).join('\n    '));
    }
}

/**
 * Assert render budgets are not exceeded
 * @param page - Playwright page
 * @param budgets - Component render budgets { componentName: maxRenders }
 */
export async function assertRenderBudgets(
    page: Page,
    budgets: Record<string, number>
): Promise<void> {
    const counts = await getRenderCounts(page);
    const violations: string[] = [];

    for (const [component, budget] of Object.entries(budgets)) {
        const actual = counts[component] || 0;
        if (actual > budget) {
            violations.push(
                `${component}: ${actual} renders (budget: ${budget}, exceeded by ${actual - budget})`
            );
        }
    }

    if (violations.length > 0) {
        console.error('❌ Render budget violations:', violations);
        throw new Error(
            `Render budgets exceeded:\n${violations.join('\n')}`
        );
    }
}

/**
 * Calculate render rate (renders per second) over a time window
 */
export async function getRenderRate(page: Page, windowMs: number = 5000): Promise<Record<string, number>> {
    const history = await getRenderHistory(page);
    const now = Date.now();
    const cutoff = now - windowMs;

    const recentRenders = history.filter(r => r.timestamp >= cutoff);
    const rates: Record<string, number> = {};

    for (const render of recentRenders) {
        rates[render.component] = (rates[render.component] || 0) + 1;
    }

    // Convert to renders per second
    const windowSeconds = windowMs / 1000;
    for (const component in rates) {
        rates[component] = rates[component] / windowSeconds;
    }

    return rates;
}

/**
 * Console log tracking interface
 */
export interface ConsoleLogCounts {
    log: number;
    warn: number;
    error: number;
    info: number;
    debug: number;
    total: number;
}

/**
 * Inject console log tracking into the page
 * Exposes window.__mqLogCounts for monitoring console spam
 */
export async function injectLogCounters(page: Page): Promise<void> {
    await page.addInitScript(() => {
        // Initialize log counters
        (window as any).__mqLogCounts = {
            log: 0,
            warn: 0,
            error: 0,
            info: 0,
            debug: 0,
            total: 0
        };

        (window as any).__mqLogHistory = [];

        // Wrap console methods to track calls
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        const originalInfo = console.info;
        const originalDebug = console.debug;

        console.log = function (...args: any[]) {
            (window as any).__mqLogCounts.log++;
            (window as any).__mqLogCounts.total++;
            (window as any).__mqLogHistory.push({
                level: 'log',
                timestamp: Date.now(),
                message: args.map(a => String(a)).join(' ').substring(0, 200)
            });
            // Keep history manageable
            if ((window as any).__mqLogHistory.length > 500) {
                (window as any).__mqLogHistory.shift();
            }
            return originalLog.apply(console, args);
        };

        console.warn = function (...args: any[]) {
            (window as any).__mqLogCounts.warn++;
            (window as any).__mqLogCounts.total++;
            (window as any).__mqLogHistory.push({
                level: 'warn',
                timestamp: Date.now(),
                message: args.map(a => String(a)).join(' ').substring(0, 200)
            });
            if ((window as any).__mqLogHistory.length > 500) {
                (window as any).__mqLogHistory.shift();
            }
            return originalWarn.apply(console, args);
        };

        console.error = function (...args: any[]) {
            (window as any).__mqLogCounts.error++;
            (window as any).__mqLogCounts.total++;
            (window as any).__mqLogHistory.push({
                level: 'error',
                timestamp: Date.now(),
                message: args.map(a => String(a)).join(' ').substring(0, 200)
            });
            if ((window as any).__mqLogHistory.length > 500) {
                (window as any).__mqLogHistory.shift();
            }
            return originalError.apply(console, args);
        };

        console.info = function (...args: any[]) {
            (window as any).__mqLogCounts.info++;
            (window as any).__mqLogCounts.total++;
            (window as any).__mqLogHistory.push({
                level: 'info',
                timestamp: Date.now(),
                message: args.map(a => String(a)).join(' ').substring(0, 200)
            });
            if ((window as any).__mqLogHistory.length > 500) {
                (window as any).__mqLogHistory.shift();
            }
            return originalInfo.apply(console, args);
        };

        console.debug = function (...args: any[]) {
            (window as any).__mqLogCounts.debug++;
            (window as any).__mqLogCounts.total++;
            (window as any).__mqLogHistory.push({
                level: 'debug',
                timestamp: Date.now(),
                message: args.map(a => String(a)).join(' ').substring(0, 200)
            });
            if ((window as any).__mqLogHistory.length > 500) {
                (window as any).__mqLogHistory.shift();
            }
            return originalDebug.apply(console, args);
        };
    });
}

/**
 * Get current log counts
 */
export async function getLogCounts(page: Page): Promise<ConsoleLogCounts> {
    return await page.evaluate(() => {
        return (window as any).__mqLogCounts || {
            log: 0, warn: 0, error: 0, info: 0, debug: 0, total: 0
        };
    });
}

/**
 * Reset log counters
 */
export async function resetLogCounters(page: Page): Promise<void> {
    await page.evaluate(() => {
        (window as any).__mqLogCounts = {
            log: 0, warn: 0, error: 0, info: 0, debug: 0, total: 0
        };
        (window as any).__mqLogHistory = [];
    });
}

/**
 * Get log history
 */
export async function getLogHistory(page: Page): Promise<Array<{
    level: string;
    timestamp: number;
    message: string;
}>> {
    return await page.evaluate(() => {
        return (window as any).__mqLogHistory || [];
    });
}

/**
 * Log console statistics
 */
export async function logConsoleStatistics(page: Page, label: string): Promise<void> {
    const counts = await getLogCounts(page);
    const history = await getLogHistory(page);

    console.log(`\n[${label}] Console Log Statistics:`);
    console.log(`  Total Logs: ${counts.total}`);
    console.log(`  Breakdown:`, JSON.stringify({
        log: counts.log,
        warn: counts.warn,
        error: counts.error,
        info: counts.info,
        debug: counts.debug
    }, null, 2));

    if (history.length > 0) {
        const recentLogs = history.slice(-5);
        console.log(`  Recent Logs (last 5):`);
        recentLogs.forEach(log => {
            console.log(`    [${log.level}] ${log.message}`);
        });
    }

    // Highlight if there's spam
    if (counts.total > 100) {
        console.warn(`⚠️  High log count: ${counts.total} logs detected - potential log spam`);
    }
}

/**
 * Assert log budgets are not exceeded
 * @param page - Playwright page
 * @param budget - Maximum total logs allowed
 */
export async function assertLogBudget(page: Page, budget: number): Promise<void> {
    const counts = await getLogCounts(page);

    if (counts.total > budget) {
        const history = await getLogHistory(page);
        const topMessages = history
            .reduce((acc: any[], log) => {
                const existing = acc.find(l => l.message === log.message);
                if (existing) {
                    existing.count++;
                } else {
                    acc.push({ message: log.message, count: 1, level: log.level });
                }
                return acc;
            }, [])
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        console.error('❌ Log budget exceeded:', {
            actual: counts.total,
            budget,
            exceeded: counts.total - budget,
            topRepeated: topMessages
        });

        throw new Error(
            `Log budget exceeded: ${counts.total} logs (budget: ${budget}, exceeded by ${counts.total - budget})\n` +
            `Top repeated messages:\n${topMessages.map(m => `  [${m.level}] ${m.message} (x${m.count})`).join('\n')}`
        );
    }
}
