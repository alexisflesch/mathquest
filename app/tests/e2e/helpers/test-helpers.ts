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
        // Quick health probe to fail fast if backend is not ready
        try {
            const health = await this.page.request.get('http://localhost:3007/health', { timeout: 5000 });
            console.log(`🩺 Backend health: ${health.status()} ${await health.text().catch(() => '')}`);
        } catch (e) {
            console.log(`⚠️ Backend health probe failed before registration: ${(e as Error).message}`);
        }

        // Primary path: universal register endpoint with simple retries (same logic as working tests)
        const attemptRegister = async (timeoutMs: number) => {
            const response = await this.page.request.post('http://localhost:3007/api/v1/auth/register', {
                data: {
                    username: userData.username,
                    email: userData.email,
                    password: userData.password,
                    role: 'TEACHER',
                    // Align with local backend .env ADMIN_PASSWORD (see app/backend/.env)
                    adminPassword: 'abc'
                },
                timeout: timeoutMs
            });
            return response;
        };

        let lastErr: Error | null = null;
        for (const timeoutMs of [20000, 30000]) {
            try {
                const response = await attemptRegister(timeoutMs);
                console.log(`📊 Registration response status: ${response.status()}`);
                if (!response.ok()) {
                    const errorBody = await response.text();
                    console.log(`❌ Registration failed with body: ${errorBody}`);
                    lastErr = new Error(`Failed to create teacher: ${response.status()} - ${errorBody}`);
                    continue;
                }
                const result = await response.json();
                console.log(`✅ Registration successful, response:`, result);
                const teacherId = result.user?.id || result.userId;
                console.log(`✅ Teacher created successfully: ${teacherId || userData.username}`);
                return {
                    ...userData,
                    id: teacherId,
                    defaultMode: 'teacher',
                    avatarEmoji: '👩‍🏫'
                };
            } catch (e) {
                lastErr = e as Error;
                console.log(`⚠️ Registration attempt failed: ${lastErr.message}. Retrying...`);
                await new Promise(res => setTimeout(res, 1000));
            }
        }
        throw new Error(`Failed to create teacher after retries: ${lastErr?.message}`);
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

        // Fast-path: try API login first to avoid brittle UI flows or email verification gates
        try {
            const apiResp = await this.page.request.post('http://localhost:3007/api/v1/auth/login', {
                data: { email: credentials.email, password: credentials.password, role: 'TEACHER' },
                timeout: 10000
            });
            if (apiResp.ok()) {
                const body = await apiResp.json();
                const teacherToken = body.teacherToken || body.token || body.accessToken;
                const studentToken = body.authToken || body.token || body.accessToken;
                if (teacherToken || studentToken) {
                    await this.page.context().addCookies([
                        teacherToken ? { name: 'teacherToken', value: String(teacherToken), domain: 'localhost', path: '/' } : undefined,
                        studentToken ? { name: 'authToken', value: String(studentToken), domain: 'localhost', path: '/' } : undefined,
                    ].filter(Boolean) as any);
                    await this.page.goto('/');
                    // Verify logged in by checking we are not on /login
                    if (!this.page.url().includes('/login')) {
                        console.log('✅ Teacher API-login successful (cookies set)');
                        return;
                    }
                }
            } else {
                console.log(`ℹ️ API login returned ${apiResp.status()}`);
            }
        } catch (e) {
            console.log(`ℹ️ API login path failed: ${(e as Error).message}. Falling back to UI login.`);
        }

        await this.page.goto('/login');
        await this.page.waitForLoadState('networkidle');
        // If the app auto-redirected (guest/student/teacher), force back to login in account mode
        try {
            await this.page.waitForURL(/\/login(\?.*)?$/, { timeout: 2000 });
        } catch {
            console.log('↩️ Not on /login after initial nav, forcing /login?mode=account');
            await this.page.goto('/login?mode=account');
            await this.page.waitForLoadState('domcontentloaded');
        }
        console.log(`🔍 Current URL: ${this.page.url()}`);
        console.log(`🔍 Page title: ${await this.page.title()}`);

        // Wait for the page to fully load - increase timeout
        await this.page.waitForTimeout(3000);

        // Debug: Check page content
        const pageContent = await this.page.content();
        console.log(`🔍 Page content length: ${pageContent.length}`);
        console.log(`🔍 First 500 chars of page content: ${pageContent.substring(0, 500)}`);

        // Check if already logged in - be more specific
        const logoutButton = this.page.locator('button:has-text("Déconnexion"), [data-testid="logout-button"]');
        const isLoggedIn = await logoutButton.isVisible().catch(() => false);
        if (isLoggedIn) {
            console.log('✅ User is already logged in, skipping login process');
            return;
        }

        // Check if we're already in account login mode (email input visible)
        const emailInputAlreadyVisible = await this.page.locator('input[name="email"], input[type="email"]').isVisible().catch(() => false);
        console.log(`🔍 Email input already visible: ${emailInputAlreadyVisible}`);

        if (!emailInputAlreadyVisible) {
            // Switch to account login mode (layout recently changed to guest/account toggle)
            console.log('🔄 Switching to account login mode...');

            // Ensure buttons have rendered before scanning
            await this.page.waitForSelector('button', { timeout: 10000 }).catch(() => undefined);

            // Debug: Check what buttons are available on the page
            const allButtons = await this.page.locator('button').all();
            console.log(`🔍 Found ${allButtons.length} buttons on the page:`);
            for (let i = 0; i < allButtons.length; i++) {
                const button = allButtons[i];
                const text = await button.textContent().catch(() => 'no-text');
                const className = await button.getAttribute('class').catch(() => 'no-class');
                console.log(`  Button ${i}: "${text}" (class: ${className})`);
            }

            const accountToggleSelectors = [
                'button:has-text("Compte enseignant")',
                'button:has-text("Compte")',
                'button:has-text("Account")',
                '[data-testid="auth-toggle-account"]'
            ];

            let accountToggle = null;
            for (const selector of accountToggleSelectors) {
                const candidate = this.page.locator(selector).first();
                const visible = await candidate.isVisible().catch(() => false);
                if (visible) {
                    accountToggle = candidate;
                    break;
                }
                try {
                    await candidate.waitFor({ timeout: 2000, state: 'visible' });
                    accountToggle = candidate;
                    break;
                } catch {
                    continue;
                }
            }

            if (accountToggle) {
                console.log(`✅ Found account toggle (${await accountToggle.textContent().catch(() => 'unknown')}), clicking...`);
                await accountToggle.click();
                console.log('✅ Account toggle clicked');

                // Wait for the account form to appear - remove timeout to avoid test timeout
                console.log('⏳ Waiting for account form to load...');
                // await this.page.waitForTimeout(2000);
            } else {
                console.log('⚠️ Account toggle not found, assuming already in account mode');
            }
        } else {
            console.log('✅ Already in account login mode');
        }

        // Now check for the account form
        const accountFormVisible = await this.page.locator('input[name="email"], input[type="email"]').isVisible().catch(() => false);
        console.log(`🔍 Account form visible: ${accountFormVisible}`);

        if (!accountFormVisible) {
            console.log('❌ Account form not visible, checking what inputs are actually present...');
            // Debug: Check what inputs are available
            const debugInputs = await this.page.locator('input').all();
            console.log(`🔍 Found ${debugInputs.length} input fields:`);
            for (let i = 0; i < debugInputs.length; i++) {
                const input = debugInputs[i];
                const name = await input.getAttribute('name').catch(() => 'no-name');
                const type = await input.getAttribute('type').catch(() => 'no-type');
                const id = await input.getAttribute('id').catch(() => 'no-id');
                const placeholder = await input.getAttribute('placeholder').catch(() => 'no-placeholder');
                console.log(`  Input ${i}: name="${name}", type="${type}", id="${id}", placeholder="${placeholder}"`);
            }
            throw new Error('Account form did not appear after attempting to switch to account mode');
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

        // First, let's check what submit buttons are available
        const submitButtons = await this.page.locator('button[type="submit"]').allTextContents();
        console.log('📋 Available submit buttons:', submitButtons);

        const loginButton = this.page.locator('button[type="submit"], button:has-text("Se connecter"), button:has-text("Connexion"), button:has-text("Login")').first();
        await loginButton.waitFor({ timeout: 3000 });

        const buttonText = await loginButton.textContent();
        console.log(`🎯 Clicking button with text: "${buttonText}"`);

        await loginButton.click();

        // Wait a bit for form submission
        await this.page.waitForTimeout(1000);

        // Check current URL and page content after login attempt
        const currentUrl = this.page.url();
        console.log(`🔍 Current URL after login click: ${currentUrl}`);

        // Check for any error messages
        const errorMessages = await this.page.locator('.error, .alert, [class*="error"], [class*="alert"]').allTextContents();
        if (errorMessages.length > 0) {
            console.log('❌ Found error messages:', errorMessages);
        }

        // Check if we're still on login page
        if (currentUrl.includes('/login')) {
            console.log('❌ Still on login page - login may have failed');
            // Take a screenshot for debugging
            await this.page.screenshot({ path: 'login-failed.png' });
            throw new Error('Login failed: Still on login page after login attempt');
        }

        // Wait for successful login (redirect to home)
        const result = await Promise.race([
            this.page.waitForURL('/', { timeout: 20000 }).then(() => 'home'),
            this.page.waitForTimeout(20000).then(() => 'timeout')
        ]);

        if (result === 'timeout') {
            const finalUrl = this.page.url();
            console.log(`❌ Login timeout - final URL: ${finalUrl}`);
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

        // Always perform explicit student account login to avoid false positives
        // from layout variations that might expose a "Déconnexion" control even on auth screens.

        // Wait for the page to be fully loaded
        console.log('⏳ Waiting for login page to stabilize...');
        await this.page.waitForTimeout(2000);

        // Ensure we're in account login mode (some layouts have a guest/account toggle)
        const accountEmailVisible = await this.page.locator('input[name="email"], input[type="email"]').isVisible().catch(() => false);
        if (!accountEmailVisible) {
            console.log('🔄 Switching to account login mode...');
            const candidateSelectors = [
                'button:has-text("Compte étudiant")',
                'button:has-text("Compte enseignant")',
                'button:has-text("Compte")',
                'button:has-text("Account")',
                '[data-testid="auth-toggle-account"]',
                '[data-testid="auth-toggle-account-student"]'
            ];
            let toggled = false;
            for (const sel of candidateSelectors) {
                const btn = this.page.locator(sel).first();
                if (await btn.isVisible().catch(() => false)) {
                    console.log(`✅ Found account toggle (${sel}), clicking...`);
                    await btn.click();
                    toggled = true;
                    break;
                }
                try {
                    await btn.waitFor({ timeout: 1500, state: 'visible' });
                    console.log(`✅ Found account toggle after wait (${sel}), clicking...`);
                    await btn.click();
                    toggled = true;
                    break;
                } catch { /* continue */ }
            }
            // As a last resort, directly navigate with mode query
            if (!toggled) {
                console.log('↪️ Navigating to /login?mode=account to force account view');
                await this.page.goto('/login?mode=account');
                await this.page.waitForLoadState('domcontentloaded');
            }
            if (!toggled) {
                console.log('⚠️ Account toggle not found; proceeding assuming account mode');
            }
        } else {
            console.log('✅ Already in account login mode');
        }

        // Wait for the account form to appear
        console.log('⏳ Waiting for account form to load...');
        await this.page.waitForTimeout(2000);

        // Fill email field
        console.log('📧 Filling email field...');
        const emailInput = this.page.locator('input[name="email"], input[type="email"]').first();
        await emailInput.waitFor({ timeout: 7000, state: 'visible' });
        await emailInput.fill(credentials.email);

        // Fill password field
        console.log('🔑 Filling password field...');
        const passwordInput = this.page.locator('input[name="password"], input[type="password"]').first();
        await passwordInput.waitFor({ timeout: 7000, state: 'visible' });
        await passwordInput.fill(credentials.password);

        // Click login button
        console.log('🚀 Clicking login button...');
        const loginButton = this.page.locator('button[type="submit"], button:has-text("Se connecter"), button:has-text("Connexion"), [data-testid="submit-login"]').first();
        await loginButton.waitFor({ timeout: 5000 });
        await loginButton.click();

        // Wait for successful login (redirect to home)
        const result = await Promise.race([
            this.page.waitForURL(/\/?$/, { timeout: 15000 }).then(() => 'home'),
            this.page.waitForTimeout(15000).then(() => 'timeout')
        ]);

        if (result === 'timeout') {
            throw new Error('Login failed: Timeout waiting for redirect after authenticated student login');
        }

        console.log('✅ Authenticated student login successful');
    }

    /**
     * Login as guest student with username only
     * WORKING PATTERN from live-quiz-flow.spec.ts and comprehensive-full-flow.spec.ts
     */
    async loginAsGuestStudent(credentials: { username: string }): Promise<void> {
        console.log(`👨‍🎓 Logging in guest student: ${credentials.username}`);

        await this.page.goto('/login');
        await this.page.waitForLoadState('networkidle');

        // Fill username using the UsernameSelector (autocomplete component)
        const usernameInput = this.page.locator('input[placeholder*="chercher"], input[placeholder*="prénom"], input[placeholder*="pseudo"]').first();
        await usernameInput.waitFor({ timeout: 5000 });
        await usernameInput.fill(credentials.username.substring(0, 3)); // Type first few letters
        await this.page.waitForTimeout(500); // Wait for dropdown

        // Select first matching name from dropdown
        const dropdownOption = this.page.locator('ul li').first();
        if (await dropdownOption.count() > 0) {
            await dropdownOption.click();
            console.log('Selected username from dropdown');
        } else {
            // If no dropdown, try pressing Enter
            await usernameInput.press('Enter');
            console.log('Pressed Enter on username');
        }

        // Select avatar
        const avatarButton = this.page.locator('button.emoji-avatar').first();
        await avatarButton.click();

        // Click submit button
        const submitButton = this.page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter"), button:has-text("Login"), button:has-text("Commencer")');
        await submitButton.click();

        // Wait for authentication to complete
        await this.page.waitForSelector('[data-testid="user-profile"], .user-profile, nav, header', { timeout: 15000 });
        console.log('✅ Guest student login successful');
    }

    /**
     * Login as guest teacher (same as guest student, just different name)
     * WORKING PATTERN from live-quiz-flow.spec.ts
     */
    async loginAsGuestTeacher(credentials: { username: string }): Promise<void> {
        console.log(`🧑‍🏫 Logging in guest teacher: ${credentials.username}`);

        await this.page.goto('/login');
        await this.page.waitForLoadState('networkidle');

        // Use guest login (same pattern as student)
        const usernameInput = this.page.locator('input[placeholder*="name"], input[name="username"], input[id="username"]');
        await usernameInput.waitFor({ timeout: 5000 });

        await usernameInput.fill(credentials.username);
        console.log(`Filled username: ${credentials.username}`);

        // Wait for dropdown and click outside to close it
        await this.page.waitForTimeout(1000);
        await this.page.locator('body').click({ position: { x: 10, y: 10 } });
        await this.page.waitForTimeout(500);

        // Select avatar
        const avatarButton = this.page.locator('button.emoji-avatar').first();
        await avatarButton.click();

        // Click submit button
        const submitButton = this.page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter"), button:has-text("Login"), button:has-text("Commencer")');
        await submitButton.click();

        // Wait for authentication to complete
        await this.page.waitForSelector('[data-testid="user-profile"], .user-profile, nav, header', { timeout: 15000 });
        console.log('✅ Guest teacher login successful');
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
        const filename = `test-results/e2e/debug-${name}-${timestamp}.png`;

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
