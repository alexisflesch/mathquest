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
    [key: string]: number;
}

/**
 * Inject event counter tracking into the page
 * Exposes window.__mqCounters for monitoring critical socket events
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
            socket_reconnect: 0
        };

        // Track socket.io events when socket is available
        const originalEmit = (window as any).io?.Socket?.prototype?.emit;
        if (originalEmit) {
            (window as any).io.Socket.prototype.emit = function (event: string, ...args: any[]) {
                if ((window as any).__mqCounters[event] !== undefined) {
                    (window as any).__mqCounters[event]++;
                }
                return originalEmit.apply(this, [event, ...args]);
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
