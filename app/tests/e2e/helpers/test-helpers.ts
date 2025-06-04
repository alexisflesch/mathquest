import { Page } from '@playwright/test';

export class TestDataHelper {
    constructor(private page: Page) { }

    /**
     * Create a test teacher account
     */
    async createTeacher(userData: {
        username: string;
        email: string;
        password: string;
    }) {
        const response = await this.page.request.post('http://localhost:3007/api/v1/teachers/register', {
            data: userData
        });

        if (!response.ok()) {
            throw new Error(`Failed to create teacher: ${response.status()}`);
        }

        return await response.json();
    }

    /**
     * Create a test student account
     */
    async createStudent(userData: {
        username: string;
        email?: string;
        password?: string;
    }) {
        const response = await this.page.request.post('http://localhost:3007/api/v1/players/register', {
            data: userData
        });

        if (!response.ok()) {
            throw new Error(`Failed to create student: ${response.status()}`);
        }

        return await response.json();
    }

    /**
     * Clean database for test isolation
     */
    async cleanDatabase() {
        // This would typically call a backend cleanup endpoint
        // For now, we'll rely on the test database being cleaned between runs
        console.log('🧹 Cleaning test database...');
    }

    /**
     * Generate unique test data
     */
    generateTestData(prefix: string = 'test') {
        const timestamp = Date.now();
        return {
            username: `${prefix}_user_${timestamp}`,
            email: `${prefix}_${timestamp}@example.com`,
            password: 'TestPassword123!',
            quizName: `${prefix}_quiz_${timestamp}`,
            tournamentName: `${prefix}_tournament_${timestamp}`
        };
    }
}

/**
 * Login helper for different user types
 */
export class LoginHelper {
    constructor(private page: Page) { }

    async loginAsTeacher(credentials: { email: string; password: string }) {
        // Navigate directly to unified login page in teacher mode
        await this.page.goto('/login?mode=teacher');
        await this.page.waitForLoadState('networkidle');

        // Fill in the actual form fields
        await this.page.fill('input[type="email"]', credentials.email);
        await this.page.fill('input[type="password"]', credentials.password);

        // Click the login button
        await this.page.click('button[type="submit"]');

        // Wait for either dashboard or error message
        const result = await Promise.race([
            this.page.waitForSelector('text=Déconnexion', { timeout: 7000 }).then(() => 'success'),
            this.page.waitForSelector('text=Email ou mot de passe incorrect', { timeout: 7000 }).then(() => 'error').catch(() => undefined),
            this.page.waitForTimeout(7000).then(() => 'timeout')
        ]);

        if (result === 'error') {
            throw new Error('Login failed: Email ou mot de passe incorrect');
        } else if (result === 'timeout') {
            throw new Error('Login failed: Timeout waiting for dashboard or error message');
        }
    }

    async loginAsStudent(credentials: { username: string; password?: string }) {
        // Navigate directly to unified login page and use guest mode
        await this.page.goto('/login');
        await this.page.waitForLoadState('networkidle');

        // The login page defaults to guest mode, so username input should be visible
        // Fill in username field
        await this.page.fill('[data-testid="username-input"]', credentials.username);

        // Select first avatar
        await this.page.click('.avatar-option:first-child');

        // Click submit button to join as guest
        await this.page.click('button[type="submit"]');

        // Wait for redirect to main page
        const result = await Promise.race([
            this.page.waitForURL('/', { timeout: 5000 }).then(() => 'home'),
            this.page.waitForTimeout(5000).then(() => 'timeout')
        ]);

        if (result === 'timeout') {
            throw new Error('Login failed: Timeout waiting for redirect after guest login');
        }
    }
}

/**
 * Socket.IO testing helper
 */
export class SocketHelper {
    constructor(private page: Page) { }

    /**
     * Wait for socket connection
     */
    async waitForSocketConnection() {
        await this.page.waitForFunction(() => {
            return (window as any).socket && (window as any).socket.connected;
        }, { timeout: 10000 });
    }

    /**
     * Wait for specific socket event
     */
    async waitForSocketEvent(eventName: string, timeout: number = 5000) {
        return await this.page.waitForFunction(
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
    }
}
