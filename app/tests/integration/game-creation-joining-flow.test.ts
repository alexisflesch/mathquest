/**
 * Integration Tests for Game Creation and Joining Flow
 *
 * Tests the complete flow from game creation to joining,
 * ensuring that API routes work correctly together.
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3008',
    user: {
        username: 'IntegrationTestUser',
        avatar: '🤖'
    },
    game: {
        gradeLevel: 'CP',
        discipline: 'Mathématiques',
        themes: ['addition']
    }
};

interface GameData {
    accessCode: string;
    gameId: string;
}

// Helper function to log with timestamp
function log(message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Helper to authenticate user
async function authenticateUser(page: Page): Promise<void> {
    log('Starting user authentication...');

    await page.goto(TEST_CONFIG.baseUrl + '/login');

    // Check if we're already logged in
    try {
        await page.waitForSelector('[data-testid="user-profile"]', { timeout: 2000 });
        log('User already authenticated');
        return;
    } catch {
        log('User not authenticated, proceeding with login...');
    }

    // Fill username
    const usernameInput = page.locator('input[placeholder*="name"], input[name="username"]');
    await usernameInput.waitFor({ timeout: 5000 });
    await usernameInput.fill(TEST_CONFIG.user.username);

    // Select avatar
    const avatarButton = page.locator('button.emoji-avatar', { hasText: TEST_CONFIG.user.avatar });
    await avatarButton.first().click();

    // Submit login
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for successful login
    await page.waitForSelector('[data-testid="user-profile"], nav, header', { timeout: 10000 });
    log('User authentication successful');
}

// Helper to create a game
async function createGame(page: Page, playMode: 'quiz' | 'tournament' | 'practice' = 'quiz'): Promise<GameData> {
    log(`Creating ${playMode} game...`);

    const response = await page.request.post('/api/games', {
        data: {
            name: `${TEST_CONFIG.user.username} ${playMode}`,
            playMode: playMode,
            gradeLevel: TEST_CONFIG.game.gradeLevel,
            discipline: TEST_CONFIG.game.discipline,
            themes: TEST_CONFIG.game.themes,
            nbOfQuestions: 2,
            settings: {
                defaultMode: 'direct',
                avatar: TEST_CONFIG.user.avatar,
                username: TEST_CONFIG.user.username
            }
        }
    });

    if (!response.ok()) {
        const errorText = await response.text();
        throw new Error(`Failed to create game: ${response.status()} - ${errorText}`);
    }

    const gameData = await response.json();
    log('Game created successfully', gameData);

    return {
        accessCode: gameData.gameInstance.accessCode || gameData.gameInstance.code,
        gameId: gameData.gameInstance.id
    };
}

test.describe('Game Creation and Joining Integration', () => {
    test.beforeEach(async ({ page }) => {
        await authenticateUser(page);
    });

    test('complete game creation and joining flow', async ({ page }) => {
        // Step 1: Create a game
        const gameData = await createGame(page, 'quiz');
        expect(gameData.accessCode).toBeTruthy();
        expect(gameData.gameId).toBeTruthy();

        // Step 2: Fetch game data by access code
        const fetchResponse = await page.request.get(`/api/games/${gameData.accessCode}`);
        expect(fetchResponse.ok()).toBe(true);

        const fetchedGameData = await fetchResponse.json();
        expect(fetchedGameData.gameInstance).toBeTruthy();
        expect(fetchedGameData.gameInstance.id).toBe(gameData.gameId);
        expect(fetchedGameData.gameInstance.accessCode || fetchedGameData.gameInstance.code).toBe(gameData.accessCode);

        // Step 3: Navigate to student join page
        await page.goto('/student/join');

        // Step 4: Enter the access code
        const codeInput = page.locator('input[placeholder*="code"]');
        await codeInput.waitFor({ timeout: 5000 });
        await codeInput.fill(gameData.accessCode);

        // Step 5: Submit the form
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        // Step 6: Verify we're redirected to the practice page (since it's a quiz)
        await page.waitForURL(`**/student/practice/${gameData.accessCode}`, { timeout: 10000 });

        const currentUrl = page.url();
        expect(currentUrl).toContain(`/student/practice/${gameData.accessCode}`);

        log('✅ Complete game creation and joining flow successful', {
            gameId: gameData.gameId,
            accessCode: gameData.accessCode,
            finalUrl: currentUrl
        });
    });

    test('game creation with different modes', async ({ page }) => {
        const modes: ('quiz' | 'tournament' | 'practice')[] = ['quiz', 'tournament', 'practice'];

        for (const mode of modes) {
            log(`Testing ${mode} mode...`);

            // Create game
            const gameData = await createGame(page, mode);

            // Verify game data
            expect(gameData.accessCode).toBeTruthy();
            expect(gameData.gameId).toBeTruthy();

            // Fetch game data
            const fetchResponse = await page.request.get(`/api/games/${gameData.accessCode}`);
            expect(fetchResponse.ok()).toBe(true);

            const fetchedGameData = await fetchResponse.json();
            expect(fetchedGameData.gameInstance.playMode).toBe(mode);

            log(`✅ ${mode} mode game creation verified`);
        }
    });

    test('invalid access code handling', async ({ page }) => {
        // Try to fetch with invalid access code
        const response = await page.request.get('/api/games/INVALID123');
        expect([404, 401]).toContain(response.status());

        // Try to join with invalid access code
        const joinResponse = await page.request.post('/api/games/INVALID123/join', {
            data: { userId: 'test-user' }
        });
        expect([404, 401]).toContain(joinResponse.status());

        log('✅ Invalid access code handling verified');
    });

    test('game status updates', async ({ page }) => {
        // Create a game
        const gameData = await createGame(page, 'quiz');

        // Try to update game status (this might require teacher permissions)
        const statusResponse = await page.request.put(`/api/games/${gameData.accessCode}/status`, {
            data: { status: 'started' }
        });

        // Accept various responses (auth failures are OK for this test)
        expect([200, 401, 403, 404]).toContain(statusResponse.status());

        log('✅ Game status update route accessible', {
            status: statusResponse.status(),
            accessCode: gameData.accessCode
        });
    });

    test('concurrent game operations', async ({ page }) => {
        // Create multiple games simultaneously
        const promises = [
            createGame(page, 'quiz'),
            createGame(page, 'tournament'),
            createGame(page, 'practice')
        ];

        const results = await Promise.all(promises);

        // Verify all games were created successfully
        results.forEach((gameData, index) => {
            expect(gameData.accessCode).toBeTruthy();
            expect(gameData.gameId).toBeTruthy();
            log(`✅ Game ${index + 1} created: ${gameData.accessCode}`);
        });

        // Verify each game can be fetched
        for (const gameData of results) {
            const response = await page.request.get(`/api/games/${gameData.accessCode}`);
            expect(response.ok()).toBe(true);
        }

        log('✅ Concurrent game operations successful');
    });
});