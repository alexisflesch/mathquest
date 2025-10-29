import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
    console.log('🚀 Starting E2E test setup...');

    // Wait for backend to be ready
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Wait for backend health check
    let backendReady = false;
    for (let i = 0; i < 30; i++) {
        try {
            const response = await page.request.get('http://localhost:3007/health');
            if (response.ok()) {
                backendReady = true;
                console.log('✅ Backend is ready on port 3007');
                break;
            }
        } catch (error) {
            // Backend not ready yet
        }
        await page.waitForTimeout(1000);
    }

    if (!backendReady) {
        throw new Error('Backend failed to start within 30 seconds');
    }

    // Extra readiness: ensure auth POST endpoints respond (not necessarily 200, but no timeout)
    let backendPostReady = false;
    for (let i = 0; i < 30; i++) {
        try {
            const resp = await page.request.post('http://localhost:3007/api/v1/auth', {
                data: { action: 'login', email: 'probe@test-mathquest.com', password: 'x' },
                timeout: 3000
            });
            // Any response status means the route is responsive
            console.log(`ℹ️ Auth POST probe status: ${resp.status()}`);
            backendPostReady = true;
            break;
        } catch (error) {
            // Likely not ready yet or timed out
        }
        await page.waitForTimeout(1000);
    }

    if (!backendPostReady) {
        throw new Error('Backend auth POST endpoints did not become responsive within 30 seconds');
    }

    // Wait for frontend to be ready
    let frontendReady = false;
    for (let i = 0; i < 30; i++) {
        try {
            await page.goto('http://localhost:3008', { timeout: 5000 });
            frontendReady = true;
            console.log('✅ Frontend is ready on port 3008');
            break;
        } catch (error) {
            // Frontend not ready yet
        }
        await page.waitForTimeout(1000);
    }

    if (!frontendReady) {
        throw new Error('Frontend failed to start within 30 seconds');
    }

    await browser.close();
    console.log('✅ E2E test setup complete');
}

export default globalSetup;
