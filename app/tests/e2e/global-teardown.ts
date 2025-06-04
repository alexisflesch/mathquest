import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
    console.log('🧹 Starting E2E test teardown...');

    // Clean up test data if needed
    // This could include clearing test database, Redis cache, etc.

    console.log('✅ E2E test teardown complete');
}

export default globalTeardown;
