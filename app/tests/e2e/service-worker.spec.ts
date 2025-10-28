import { test, expect, type Page } from '@playwright/test';

// This suite validates service worker behavior in production mode
// Assumptions:
// - Frontend is running on baseURL (see playwright.config.ts)
// - PWA is enabled in production (npm run start)
// - SW URL is /sw.js and scope is '/'

const BAD_MESSAGES = [
    "_ref is undefined",
    "_ref is not defined",
    "Failed to execute 'importScripts'",
    'script resource is behind a redirect',
    'The script at',
];

/**
 * Waits for navigator.serviceWorker.ready and returns the active registration details.
 */
async function getSWInfo(page: Page) {
    return await page.evaluate(async () => {
        const reg = await navigator.serviceWorker.ready;
        const active = reg.active;
        return {
            scriptURL: active?.scriptURL || null,
            scope: reg.scope || null,
        };
    });
}

/**
 * Returns the names of caches currently present
 */
async function getCacheKeys(page: Page) {
    return await page.evaluate(async () => {
        const keys = await caches.keys();
        return keys;
    });
}

/**
 * Returns number of requests cached in a given cache
 */
async function getCacheEntryCount(page: Page, cacheName: string) {
    return await page.evaluate(async (name: string) => {
        try {
            const cache = await caches.open(name);
            const requests = await cache.keys();
            return requests.length;
        } catch {
            return -1;
        }
    }, cacheName);
}

test.describe('PWA Service Worker', () => {
    test('registers without errors and controls the page', async ({ page, context }) => {
        // Capture console messages for error scanning
        const logs: string[] = [];
        page.on('console', (msg) => {
            const text = msg.text();
            logs.push(text);
        });

        // Go to home and wait until the SW is ready
        await page.goto('/', { waitUntil: 'load' });

        const sw = await getSWInfo(page);
        expect(sw.scriptURL).toBeTruthy();
        expect(sw.scriptURL).toContain('/sw.js');
        const expectedScope = await page.evaluate(() => `${location.origin}/`);
        expect(sw.scope).toBe(expectedScope);

        // Ensure no known SW errors made it to the page console
        const bad = logs.filter((l) => BAD_MESSAGES.some((m) => l.toLowerCase().includes(m.toLowerCase())));
        expect.soft(bad, `Unexpected SW-related console errors: \n${bad.join('\n')}`).toHaveLength(0);

        // Confirm our start-url cache has at least one entry after initial load
        // (NetworkFirst should store the start document)
        const startCacheCount = await getCacheEntryCount(page, 'start-url');
        expect.soft(startCacheCount).toBeGreaterThanOrEqual(1);

        // Verify that sw.js and imported worker scripts are directly reachable (no redirects)
        const swFetch = await page.evaluate(async () => {
            const res = await fetch('/sw.js', { cache: 'reload' });
            const text = await res.text();
            return { ok: res.ok, redirected: res.redirected, text };
        });
        expect(swFetch.ok).toBeTruthy();
        expect(swFetch.redirected).toBeFalsy();

        const workerFetchResults = await page.evaluate(async (swJsText: string) => {
            const matches = Array.from(swJsText.matchAll(/importScripts\(\s*["']([^"']*worker-[^"']+\.js)["']/g));
            const urls = matches.map((m) => m[1]);
            const results: Array<{ url: string; ok: boolean; redirected: boolean; status: number }>
                = [];
            for (const url of urls) {
                const res = await fetch(url, { cache: 'reload' });
                results.push({ url, ok: res.ok, redirected: res.redirected, status: res.status });
            }
            return results;
        }, swFetch.text);

        for (const r of workerFetchResults) {
            expect.soft(r.ok, `worker script not ok: ${r.url} (status ${r.status})`).toBeTruthy();
            expect.soft(r.redirected, `worker script was redirected: ${r.url}`).toBeFalsy();
        }
    });

    test('offline: home uses cached start-url (no offline page)', async ({ page, context }) => {
        // Visit home online once to ensure it is cached
        await page.goto('/', { waitUntil: 'load' });

        // Wait for SW ready
        await page.waitForFunction(() => navigator.serviceWorker?.ready);

        // Enable offline
        await context.setOffline(true);

        // Reload home - should render cached content (NOT the offline page)
        await page.goto('/', { waitUntil: 'load' });

        const offlineMarker = await page.locator('text=Vous êtes hors ligne').count();
        expect.soft(offlineMarker).toBe(0);

        // We only assert that the offline page marker is NOT shown on '/'
        // (served from the 'start-url' cache)

        // Restore online for any following tests
        await context.setOffline(false);
    });
});
