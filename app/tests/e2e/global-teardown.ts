import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
    console.log('🧹 Starting E2E test teardown...');

    // Note: Database cleanup requires backend API endpoints that don't exist yet
    // Test data persists between runs, which may cause conflicts

    console.log('✅ E2E test teardown complete');
}

export default globalTeardown;
