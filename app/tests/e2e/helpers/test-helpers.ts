import { Page, expect } from '@playwright/test';
import prenomsData from '../../../prenoms/prenoms.json';

export interface TestUser {
    id?: string;
    username: string;
    email?: string;
    password?: string;
    defaultMode: 'teacher' | 'student';
    avatarEmoji?: string;
}

export interface TestGameData {
    name: string;
    accessCode: string;
    defaultMode: 'tournament' | 'quiz' | 'practice';
    participants?: TestUser[];
    questions?: TestQuestion[];
}

export interface TestQuestion {
    uid: string;
    text: string;
    questionType: string;
    answerOptions: string[];
    correctAnswers: number[] | boolean[];
}

/**
 * Enhanced test data helper with comprehensive utilities
 */
export class TestDataHelper {
    constructor(private page: Page) { }

    /**
     * Create a test teacher account with enhanced validation
     */
    async createTeacher(userData: {
        username: string;
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
    }): Promise<TestUser> {
        console.log(`🧑‍🏫 Creating test teacher: ${userData.username}`);

        const response = await this.page.request.post('http://localhost:3007/api/v1/auth/register', {
            data: {
                username: userData.username,
                email: userData.email,
                password: userData.password,
                role: 'TEACHER',
                adminPassword: 'abc' // Use the actual admin password from backend .env
            }
        });

        if (!response.ok()) {
            const errorBody = await response.text();
            throw new Error(`Failed to create teacher: ${response.status()} - ${errorBody}`);
        }

        const result = await response.json();
        console.log(`✅ Teacher created successfully: ${result.user?.id || result.user?.username || userData.username}`);

        return {
            ...userData,
            id: result.user?.id || result.userId,
            defaultMode: 'teacher',
            avatarEmoji: '👩‍🏫'
        };
    }

    /**
     * Create a test student account with enhanced validation
     */
    async createStudent(userData: {
        username: string;
        email?: string;
        password?: string;
        firstName?: string;
        lastName?: string;
        avatarEmoji?: string;
    }): Promise<TestUser> {
        console.log(`👨‍🎓 Creating test student: ${userData.username}`);

        const response = await this.page.request.post('http://localhost:3007/api/v1/auth/register', {
            data: {
                username: userData.username,
                email: userData.email,
                password: userData.password,
                role: 'STUDENT',
                avatar: userData.avatarEmoji || '🐼' // Use panda emoji as default
            }
        });

        if (!response.ok()) {
            const errorBody = await response.text();
            throw new Error(`Failed to create student: ${response.status()} - ${errorBody}`);
        }

        const result = await response.json();
        console.log(`✅ Student created successfully: ${result.user?.id || result.user?.username || userData.username}`);

        return {
            ...userData,
            id: result.user?.id || result.userId,
            defaultMode: 'student',
            avatarEmoji: userData.avatarEmoji || '🐼'
        };
    }

    /**
     * Create multiple test students for concurrent testing
     */
    async createMultipleStudents(count: number, prefix: string = 'student'): Promise<TestUser[]> {
        console.log(`👥 Creating ${count} test students...`);

        const students: TestUser[] = [];

        for (let i = 0; i < count; i++) {
            const userData = this.generateTestData(`${prefix}_${i}`);
            const student = await this.createStudent({
                username: userData.username,
                avatarEmoji: this.getRandomAvatar()
            });
            students.push(student);
        }

        console.log(`✅ Created ${students.length} test students`);
        return students;
    }

    /**
     * Generate comprehensive test data with realistic values
     */
    generateTestData(prefix: string = 'test') {
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 1000);

        // Pick a random valid French first name
        const randomName = prenomsData[Math.floor(Math.random() * prenomsData.length)];

        return {
            username: randomName.toLowerCase(),
            email: `${prefix}_${timestamp}_${randomNum}@test-mathquest.com`,
            password: 'TestPassword123!',
            quizName: `${prefix}_quiz_${timestamp}`,
            tournamentName: `${prefix}_tournament_${timestamp}`,
            accessCode: this.generateAccessCode(),
            timestamp,
            randomNum
        };
    }

    /**
     * Generate realistic access codes
     */
    generateAccessCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Generate mock questions for testing
     */
    generateMockQuestions(count: number): TestQuestion[] {
        const questions: TestQuestion[] = [];
        const mathTopics = ['algebra', 'geometry', 'calculus', 'statistics', 'arithmetic'];

        for (let i = 0; i < count; i++) {
            const topic = mathTopics[i % mathTopics.length];
            questions.push({
                uid: `question_${Date.now()}_${i}`,
                text: `What is the result of ${i + 1} + ${i + 2} in ${topic}?`,
                questionType: 'single_choice',
                answerOptions: [
                    `${(i + 1) + (i + 2)}`, // Correct answer
                    `${(i + 1) + (i + 2) + 1}`,
                    `${(i + 1) + (i + 2) - 1}`,
                    `${(i + 1) + (i + 2) + 2}`
                ],
                correctAnswers: [0] // First option is correct
            });
        }

        return questions;
    }

    /**
     * Get random avatar emoji for student testing
     */
    getRandomAvatar(): string {
        const avatars = ['😀', '😊', '🤓', '😎', '🤖', '🐱', '🐶', '🦊', '🐼', '🦁'];
        return avatars[Math.floor(Math.random() * avatars.length)];
    }

    /**
     * Create test questions with 5-second time limits for fast tournament testing
     */
    async createTestQuestions(count: number = 5): Promise<string[]> {
        const questionUids: string[] = [];

        for (let i = 0; i < count; i++) {
            const questionData = {
                uid: `test-tournament-q${Date.now()}-${i}`,
                author: 'test-automation',
                discipline: 'Mathématiques',
                title: `Test Question ${i + 1}`,
                text: `Combien font ${i + 1} + ${i + 1} ?`,
                questionType: 'numeric',
                themes: ['Calcul'],
                tags: ['test', 'automation'],
                timeLimit: 5, // 5 seconds for fast testing
                difficulty: 1,
                gradeLevel: 'CP',
                correctAnswer: (i + 1) * 2,
                explanation: `${i + 1} + ${i + 1} = ${(i + 1) * 2}`,
                feedbackWaitTime: 2
            };

            const response = await this.page.request.post('/api/questions', {
                data: questionData
            });

            if (response.ok()) {
                questionUids.push(questionData.uid);
                console.log(`✅ Created test question: ${questionData.uid}`);
            } else {
                console.warn(`❌ Failed to create test question ${i + 1}:`, await response.text());
            }
        }

        return questionUids;
    }

    /**
     * Clean database for test isolation
     */
    async cleanDatabase(): Promise<void> {
        console.log('🧹 Cleaning test database...');

        try {
            const cleanupEndpoints = [
                '/api/v1/test/cleanup/users',
                '/api/v1/test/cleanup/games',
                '/api/v1/test/cleanup/sessions'
            ];

            for (const endpoint of cleanupEndpoints) {
                try {
                    const response = await this.page.request.delete(`http://localhost:3007${endpoint}`);
                    if (response.ok()) {
                        console.log(`✅ Cleaned: ${endpoint}`);
                    }
                } catch (error) {
                    console.log(`⚠️ Cleanup endpoint not available: ${endpoint}`);
                }
            }
        } catch (error) {
            console.log('⚠️ Database cleanup not fully available, relying on test isolation');
        }
    }
}

/**
 * Enhanced login helper for different user types
 */
export class LoginHelper {
    constructor(private page: Page) { }

    /**
     * Login as teacher with enhanced error handling
     */
    async loginAsTeacher(credentials: { email: string; password: string }): Promise<void> {
        console.log(`🧑‍🏫 Logging in teacher: ${credentials.email}`);

        await this.page.goto('/');
        await this.page.waitForLoadState('networkidle');
        console.log(`🔍 Current URL: ${this.page.url()}`);
        console.log(`🔍 Page title: ${await this.page.title()}`);

        // Check if already logged in
        const logoutButton = this.page.locator('button:has-text("Déconnexion")');
        const isLoggedIn = await logoutButton.isVisible().catch(() => false);
        if (isLoggedIn) {
            console.log('✅ User is already logged in, skipping login process');
            return;
        }

        // Switch to account login mode
        console.log('🔄 Switching to account login mode...');

        // Debug: Check what buttons are available on the page
        const allButtons = await this.page.locator('button').all();
        console.log(`🔍 Found ${allButtons.length} buttons on the page:`);
        for (let i = 0; i < allButtons.length; i++) {
            const button = allButtons[i];
            const text = await button.textContent().catch(() => 'no-text');
            const className = await button.getAttribute('class').catch(() => 'no-class');
            console.log(`  Button ${i}: "${text}" (class: ${className})`);
        }

        // Try multiple ways to find the account button
        let compteButton;
        try {
            compteButton = this.page.locator('button').filter({ hasText: 'Compte' });
            await compteButton.waitFor({ timeout: 1000 });
        } catch {
            // Fallback: look for button with Lock icon and Compte text
            compteButton = this.page.locator('button:has-text("Compte")');
            await compteButton.waitFor({ timeout: 1000 });
        }
        console.log('✅ Found Compte button, clicking...');
        await compteButton.click();
        console.log('✅ Clicked Compte button');

        // Wait for the account form to appear and ensure we're in login mode
        console.log('⏳ Waiting for account form to load...');
        await this.page.waitForTimeout(2000);

        // Check if the tab actually switched by looking for account-specific elements
        const accountFormVisible = await this.page.locator('input[name="email"]').isVisible().catch(() => false);
        console.log(`🔍 Account form visible after tab switch: ${accountFormVisible}`);

        if (!accountFormVisible) {
            console.log('❌ Account form not visible, checking what inputs are actually present...');
            // Debug: Check what inputs are available
            const debugInputs = await this.page.locator('input').all();
            console.log(`🔍 Found ${debugInputs.length} input fields after clicking Compte`);
            for (let i = 0; i < debugInputs.length; i++) {
                const input = debugInputs[i];
                const name = await input.getAttribute('name').catch(() => 'no-name');
                const type = await input.getAttribute('type').catch(() => 'no-type');
                const id = await input.getAttribute('id').catch(() => 'no-id');
                const placeholder = await input.getAttribute('placeholder').catch(() => 'no-placeholder');
                console.log(`  Input ${i}: name="${name}", type="${type}", id="${id}", placeholder="${placeholder}"`);
            }
            throw new Error('Account form did not appear after clicking Compte tab');
        }

        // Fill email field - use the exact name attribute that works
        console.log('📧 Filling email field...');
        const emailInput = this.page.locator('input[name="email"]');
        await emailInput.waitFor({ timeout: 5000, state: 'visible' });
        await emailInput.fill(credentials.email);

        // Fill password field - use the exact name attribute that works
        console.log('� Filling password field...');
        const passwordInput = this.page.locator('input[name="password"]');
        await passwordInput.waitFor({ timeout: 5000, state: 'visible' });
        await passwordInput.fill(credentials.password);

        // Click login button - try multiple selectors
        console.log('🚀 Clicking login button...');
        const loginButton = this.page.locator('button[type="submit"], button:has-text("Se connecter"), button:has-text("Connexion")').first();
        await loginButton.waitFor({ timeout: 3000 });
        await loginButton.click();

        // Wait for successful login (redirect to home)
        const result = await Promise.race([
            this.page.waitForURL('/', { timeout: 10000 }).then(() => 'home'),
            this.page.waitForTimeout(10000).then(() => 'timeout')
        ]);

        if (result === 'timeout') {
            throw new Error('Login failed: Timeout waiting for redirect after teacher login');
        }

        console.log('✅ Teacher login successful');
    }

    /**
     * Login as authenticated student with email/password
     */
    async loginAsAuthenticatedStudent(credentials: { email: string; password: string }): Promise<void> {
        console.log(`👨‍🎓 Logging in authenticated student: ${credentials.email}`);

        await this.page.goto('/login');
        await this.page.waitForLoadState('networkidle');

        // Wait for the page to be fully loaded
        console.log('⏳ Waiting for login page to stabilize...');
        await this.page.waitForTimeout(2000);

        // Click the "Compte" button to switch to account login mode
        console.log('🔄 Clicking "Compte" button to switch to account mode...');
        const compteButton = this.page.locator('button:has-text("Compte")').first();
        await compteButton.waitFor({ timeout: 5000, state: 'visible' });
        console.log('✅ Found "Compte" button, clicking...');
        await compteButton.click();
        console.log('✅ Clicked "Compte" button');

        // Wait for the account form to appear
        console.log('⏳ Waiting for account form to load...');
        await this.page.waitForTimeout(2000);

        // Fill email field
        console.log('� Filling email field...');
        const emailInput = this.page.locator('input[name="email"], input[type="email"]').first();
        await emailInput.waitFor({ timeout: 5000, state: 'visible' });
        await emailInput.fill(credentials.email);

        // Fill password field
        console.log('🔑 Filling password field...');
        const passwordInput = this.page.locator('input[name="password"], input[type="password"]').first();
        await passwordInput.waitFor({ timeout: 5000, state: 'visible' });
        await passwordInput.fill(credentials.password);

        // Click login button
        console.log('🚀 Clicking login button...');
        const loginButton = this.page.locator('button[type="submit"], button:has-text("Se connecter"), button:has-text("Connexion")').first();
        await loginButton.waitFor({ timeout: 3000 });
        await loginButton.click();

        // Wait for successful login (redirect to home)
        const result = await Promise.race([
            this.page.waitForURL('/', { timeout: 10000 }).then(() => 'home'),
            this.page.waitForTimeout(10000).then(() => 'timeout')
        ]);

        if (result === 'timeout') {
            throw new Error('Login failed: Timeout waiting for redirect after authenticated student login');
        }

        console.log('✅ Authenticated student login successful');
    }

    /**
     * Login as guest student with username only
     */
    async loginAsGuestStudent(credentials: { username: string }): Promise<void> {
        console.log(`👨‍🎓 Logging in guest student: ${credentials.username}`);

        await this.page.goto('/login');
        await this.page.waitForLoadState('networkidle');

        await this.page.fill('[data-testid="username-input"]', credentials.username);
        await this.page.click('.avatar-option:first-child');
        await this.page.click('button[type="submit"]');

        const result = await Promise.race([
            this.page.waitForURL('/', { timeout: 5000 }).then(() => 'home'),
            this.page.waitForTimeout(5000).then(() => 'timeout')
        ]);

        if (result === 'timeout') {
            throw new Error('Login failed: Timeout waiting for redirect after guest login');
        }

        console.log('✅ Guest student login successful');
    }

    /**
     * Quick login with pre-created user data
     */
    async quickLogin(user: TestUser): Promise<void> {
        if (user.defaultMode === 'teacher' && user.email && user.password) {
            await this.loginAsTeacher({ email: user.email, password: user.password });
        } else if (user.defaultMode === 'student' && user.email && user.password) {
            await this.loginAsAuthenticatedStudent({ email: user.email, password: user.password });
        } else if (user.defaultMode === 'student') {
            await this.loginAsGuestStudent({ username: user.username });
        } else {
            throw new Error(`Invalid user data for login: ${JSON.stringify(user)}`);
        }
    }

    /**
     * Logout current user
     */
    async logout(): Promise<void> {
        console.log('🚪 Logging out current user');

        try {
            const logoutSelectors = [
                'text=Déconnexion',
                'text=Logout',
                'text=Sign out',
                '[data-testid="logout-button"]'
            ];

            for (const selector of logoutSelectors) {
                const element = this.page.locator(selector);
                if (await element.count() > 0) {
                    await element.click();
                    await this.page.waitForLoadState('networkidle');
                    console.log('✅ Logout successful');
                    return;
                }
            }

            await this.page.context().clearCookies();
            await this.page.goto('/');
            console.log('✅ Logout via cookie clearing');

        } catch (error) {
            console.log('⚠️ Logout error, clearing session manually');
            await this.page.context().clearCookies();
            await this.page.goto('/');
        }
    }
}

/**
 * Enhanced Socket.IO testing helper
 */
export class SocketHelper {
    constructor(private page: Page) { }

    /**
     * Wait for socket connection with retry logic
     */
    async waitForSocketConnection(timeout: number = 10000): Promise<void> {
        console.log('🔌 Waiting for socket connection...');

        await this.page.waitForFunction(() => {
            return (window as any).socket && (window as any).socket.connected;
        }, { timeout });

        console.log('✅ Socket connection established');
    }

    /**
     * Wait for specific socket event
     */
    async waitForSocketEvent(eventName: string, timeout: number = 5000): Promise<any> {
        console.log(`📡 Waiting for socket event: ${eventName}`);

        const result = await this.page.waitForFunction(
            ({ eventName }) => {
                return new Promise((resolve) => {
                    if ((window as any).socket) {
                        (window as any).socket.once(eventName, resolve);
                    }
                });
            },
            { eventName },
            { timeout }
        );

        console.log(`✅ Received socket event: ${eventName}`);
        return result;
    }

    /**
     * Emit socket event from test
     */
    async emitSocketEvent(eventName: string, data: any): Promise<void> {
        console.log(`📤 Emitting socket event: ${eventName}`, data);

        await this.page.evaluate(
            ({ eventName, data }) => {
                if ((window as any).socket) {
                    (window as any).socket.emit(eventName, data);
                }
            },
            { eventName, data }
        );
    }

    /**
     * Check socket connection status
     */
    async isSocketConnected(): Promise<boolean> {
        return await this.page.evaluate(() => {
            return (window as any).socket && (window as any).socket.connected;
        });
    }

    /**
     * Simulate socket disconnection
     */
    async simulateDisconnection(): Promise<void> {
        console.log('🔌❌ Simulating socket disconnection...');

        await this.page.evaluate(() => {
            if ((window as any).socket) {
                (window as any).socket.disconnect();
            }
        });
    }

    /**
     * Simulate socket reconnection
     */
    async simulateReconnection(): Promise<void> {
        console.log('🔌✅ Simulating socket reconnection...');

        await this.page.evaluate(() => {
            if ((window as any).socket) {
                (window as any).socket.connect();
            }
        });

        await this.waitForSocketConnection();
    }
}

/**
 * Game state helper for validating game flows
 */
export class GameStateHelper {
    constructor(private page: Page) { }

    /**
     * Wait for game state change
     */
    async waitForGameState(expectedState: string, timeout: number = 10000): Promise<void> {
        console.log(`🎮 Waiting for game state: ${expectedState}`);

        await this.page.waitForFunction(
            (expectedState) => {
                const gameState = (window as any).gameState;
                return gameState && gameState.status === expectedState;
            },
            expectedState,
            { timeout }
        );

        console.log(`✅ Game state reached: ${expectedState}`);
    }

    /**
     * Get current game state
     */
    async getCurrentGameState(): Promise<any> {
        return await this.page.evaluate(() => {
            return (window as any).gameState || null;
        });
    }

    /**
     * Wait for question to load
     */
    async waitForQuestion(timeout: number = 10000): Promise<void> {
        console.log('📝 Waiting for question to load...');

        await this.page.waitForSelector('[data-testid="question-text"], .question-content', { timeout });

        console.log('✅ Question loaded');
    }

    /**
     * Submit answer and wait for result
     */
    async submitAnswerAndWait(answerIndex: number, timeout: number = 5000): Promise<void> {
        console.log(`✏️ Submitting answer: ${answerIndex}`);

        await this.page.click(`[data-testid="answer-option-${answerIndex}"], .answer-option:nth-child(${answerIndex + 1})`);
        await this.page.click('[data-testid="submit-answer"], button:has-text("Valider")');
        await this.page.waitForSelector('.answer-feedback, [data-testid="answer-result"]', { timeout });

        console.log('✅ Answer submitted and result received');
    }
}

/**
 * Performance testing helper
 */
export class PerformanceHelper {
    constructor(private page: Page) { }

    /**
     * Measure page load time
     */
    async measurePageLoad(url: string): Promise<number> {
        const startTime = Date.now();
        await this.page.goto(url);
        await this.page.waitForLoadState('networkidle');
        const endTime = Date.now();

        const loadTime = endTime - startTime;
        console.log(`⏱️ Page load time for ${url}: ${loadTime}ms`);

        return loadTime;
    }

    /**
     * Monitor memory usage during test
     */
    async startMemoryMonitoring(): Promise<void> {
        await this.page.addInitScript(() => {
            (window as any).memoryStats = [];
            setInterval(() => {
                if ((performance as any).memory) {
                    (window as any).memoryStats.push({
                        timestamp: Date.now(),
                        used: (performance as any).memory.usedJSHeapSize,
                        total: (performance as any).memory.totalJSHeapSize
                    });
                }
            }, 1000);
        });
    }

    /**
     * Get memory usage statistics
     */
    async getMemoryStats(): Promise<any[]> {
        return await this.page.evaluate(() => {
            return (window as any).memoryStats || [];
        });
    }
}

/**
 * Screenshot and debugging helper
 */
export class DebugHelper {
    constructor(private page: Page) { }

    /**
     * Take screenshot with timestamp
     */
    async takeScreenshot(name: string): Promise<void> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `debug-${name}-${timestamp}.png`;

        await this.page.screenshot({
            path: filename,
            fullPage: true
        });

        console.log(`📸 Screenshot saved: ${filename}`);
    }

    /**
     * Take screenshot on failure
     */
    async takeFailureScreenshot(testName: string, error: Error): Promise<void> {
        console.log(`❌ Test failed: ${testName}`);
        console.log(`Error: ${error.message}`);

        await this.takeScreenshot(`failure-${testName}`);
    }

    /**
     * Wait with visual feedback
     */
    async waitWithFeedback(ms: number, message: string): Promise<void> {
        console.log(`⏳ ${message} (waiting ${ms}ms)`);
        await this.page.waitForTimeout(ms);
        console.log(`✅ Wait completed: ${message}`);
    }
}
