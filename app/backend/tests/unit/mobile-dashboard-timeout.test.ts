/**
 * Mobile Dashboard Timeout/Reconnection Regression Test
 *
 * Goal: Reproduce the teacher dashboard mobile disconnect by asserting the
 * Socket.IO server configuration uses an insufficient pingTimeout for mobile.
 *
 * This is a guard test: it FAILS if pingTimeout < 60000 ms, which is likely to
 * cause unintended disconnects on unstable mobile networks where devices sleep
 * or switch radios. The current server sets pingTimeout=30000 (30s), which is
 * below the recommended 60s for mobile robustness.
 *
 * We do NOT spin up a real server here; we assert the exported initialization
 * configuration to catch regressions deterministically and fast.
 */

import { describe, it, expect } from '@jest/globals';

// We import the socket initializer and inspect how it configures the server.
// The backend initializes Socket.IO with hardcoded values in src/sockets/index.ts
// We’ll read those values by requiring the module and checking the options used.

jest.mock('../../src/config/redis', () => ({
    redisClient: {
        duplicate: jest.fn(() => ({
            on: jest.fn(),
            quit: jest.fn(),
        })),
        on: jest.fn(),
        quit: jest.fn(),
    },
}));

describe('Mobile teacher dashboard socket timeout config', () => {
    it('should use a mobile-safe ping timeout (>= 60000ms) to avoid phone sleep disconnects', () => {
        // Arrange: import the module under test
        // We can directly require the file and parse the current literals from source if needed,
        // but simpler: rely on code knowledge that the server is configured with pingTimeout and pingInterval.
        // To make this deterministic without spinning servers, we read the source file and assert the literals.

        const fs = require('fs');
        const path = require('path');
        const socketIndexPath = path.resolve(__dirname, '../../src/sockets/index.ts');
        const src = fs.readFileSync(socketIndexPath, 'utf8');

        // Extract pingTimeout and pingInterval values from the file contents
        const timeoutMatch = src.match(/pingTimeout:\s*(\d+)/);
        const intervalMatch = src.match(/pingInterval:\s*(\d+)/);

        expect(timeoutMatch).toBeTruthy();
        expect(intervalMatch).toBeTruthy();

        const pingTimeout = parseInt(timeoutMatch![1], 10);
        const pingInterval = parseInt(intervalMatch![1], 10);

        // Assert: mobile-safe values (>= 60s timeout, <= timeout interval)
        // This is intentionally strict to surface the current 30000ms config as a failing case.
        expect(pingTimeout).toBeGreaterThanOrEqual(60000);
        // Optional sanity: interval should be less than timeout
        expect(pingInterval).toBeLessThan(pingTimeout);
    });
});
