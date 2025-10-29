/// <reference types="node" />

import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './tests/e2e',
    /* Run tests in files in parallel */
    fullyParallel: false, // Disable parallel for real-time testing (except stress tests)
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: true,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : 1, // Single worker for socket testing (stress tests handle their own parallelism)
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [
        ['html', { open: 'never' }], // Don't auto-open browser at end
        ['line'],
        ['json', { outputFile: 'test-results/e2e-results.json' }]
    ],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://localhost:3008',
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
        /* Screenshot on failure */
        screenshot: 'only-on-failure',
        /* Video on failure */
        video: 'retain-on-failure',
        /* Environment variables for tests */
        // extraHTTPHeaders: {
        //     'X-Test-Environment': 'true'
        // }
    },

    /* Global timeout settings - optimized for local development */
    timeout: 10000, // 10 seconds per test (much faster for local dev) - stress tests override this
    expect: {
        timeout: 3000, // 3 seconds for expect assertions
    },

    /* Global setup and teardown */
    globalSetup: './tests/e2e/global-setup.ts',
    globalTeardown: './tests/e2e/global-teardown.ts',

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Increase context timeout for stress tests
                contextOptions: {
                    // Allow more contexts for stress tests
                    // Note: Stress tests create ~100+ contexts
                }
            }
        }
    ]
});
