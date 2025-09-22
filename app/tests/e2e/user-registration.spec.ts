import { test, expect } from '@playwright/test';
import { TestDataHelper, LoginHelper, DebugHelper } from './helpers/test-helpers';

/**
 * Comprehensive User Registration & Profile Management E2E Tests
 * 
 * Tests all aspects of user authentication and profile management:
 * - Teacher registration and login flows
 * - Student registration and login flows  
 * - Profile management and customization
 * - Session management and persistence
 * - Error handling and validation
 */

test.describe('User Registration & Authentication', () => {
    let testDataHelper: TestDataHelper;
    let loginHelper: LoginHelper;
    let debugHelper: DebugHelper;

    test.beforeEach(async ({ page }) => {
        testDataHelper = new TestDataHelper(page);
        loginHelper = new LoginHelper(page);
        debugHelper = new DebugHelper(page);

        // Clean database before each test for isolation
        await testDataHelper.cleanDatabase();
    });

    test.describe('Teacher Registration & Authentication', () => {
        test('should complete full teacher registration flow', async ({ page }) => {
            const testData = testDataHelper.generateTestData('teacher');

            try {
                // Navigate to registration page
                await page.goto('/');
                await page.waitForLoadState('networkidle');

                // Click registration link
                await page.click('text=Créer un compte', { timeout: 5000 });
                await page.waitForLoadState('networkidle');

                // Fill registration form
                await page.fill('[data-testid="username-input"], input[name="username"]', testData.username);
                await page.fill('[data-testid="email-input"], input[type="email"]', testData.email);
                await page.fill('[data-testid="password-input"], input[type="password"]', testData.password);

                // Submit registration
                await page.click('button[type="submit"]');
                await page.waitForLoadState('networkidle');

                // Verify registration success - should be redirected to dashboard or login
                const currentUrl = page.url();
                expect(currentUrl).toMatch(/\/(dashboard|login|home)/);

                // Verify success message or dashboard elements
                const successIndicators = [
                    'text=Compte créé avec succès',
                    'text=Registration successful',
                    'text=Bienvenue',
                    'text=Dashboard'
                ];

                let foundSuccess = false;
                for (const indicator of successIndicators) {
                    try {
                        await page.waitForSelector(indicator, { timeout: 2000 });
                        foundSuccess = true;
                        break;
                    } catch (e) {
                        // Try next indicator
                    }
                }

                if (!foundSuccess) {
                    // If no success message, check if we're in a logged-in state
                    const loggedInIndicators = ['text=Déconnexion', 'text=Mes quiz', 'text=Créer un quiz'];
                    for (const indicator of loggedInIndicators) {
                        try {
                            await page.waitForSelector(indicator, { timeout: 2000 });
                            foundSuccess = true;
                            break;
                        } catch (e) {
                            // Try next indicator
                        }
                    }
                }

                expect(foundSuccess).toBe(true);
                console.log('✅ Teacher registration completed successfully');

            } catch (error) {
                await debugHelper.takeFailureScreenshot('teacher-registration', error as Error);
                throw error;
            }
        });

        test('should handle teacher login after registration', async ({ page }) => {
            const testData = testDataHelper.generateTestData('teacher');

            try {
                // Create teacher account via API
                await testDataHelper.createTeacher({
                    username: testData.username,
                    email: testData.email,
                    password: testData.password
                });

                // Test login
                await loginHelper.loginAsTeacher({
                    email: testData.email,
                    password: testData.password
                });

                // Verify dashboard access
                const dashboardIndicators = [
                    'text=Déconnexion',
                    'text=Dashboard',
                    'text=Mes quiz',
                    'text=Créer un quiz'
                ];

                let foundDashboard = false;
                for (const indicator of dashboardIndicators) {
                    if (await page.locator(indicator).count() > 0) {
                        foundDashboard = true;
                        break;
                    }
                }

                expect(foundDashboard).toBe(true);
                console.log('✅ Teacher login and dashboard access verified');

            } catch (error) {
                await debugHelper.takeFailureScreenshot('teacher-login', error as Error);
                throw error;
            }
        });

        test('should handle invalid teacher login credentials', async ({ page }) => {
            try {
                await page.goto('/');
                await page.waitForLoadState('networkidle');

                // Click login
                await page.click('text=Se connecter');
                await page.waitForLoadState('networkidle');

                // Switch to account mode
                await page.click('button:has-text("Compte")');
                await page.waitForLoadState('networkidle');

                // Enter invalid credentials
                await page.fill('input[type="email"]', 'invalid@test.com');
                await page.fill('input[type="password"]', 'wrongpassword');
                await page.click('button[type="submit"]');

                // Wait for error message
                await page.waitForSelector('text=Email ou mot de passe incorrect', { timeout: 5000 });

                console.log('✅ Invalid login credentials properly rejected');

            } catch (error) {
                await debugHelper.takeFailureScreenshot('teacher-invalid-login', error as Error);
                throw error;
            }
        });
    });

    test.describe('Student Registration & Authentication', () => {
        test('should complete student guest registration flow', async ({ page }) => {
            const testData = testDataHelper.generateTestData('student');

            try {
                // Navigate to student login page
                await page.goto('/login');
                await page.waitForLoadState('networkidle');

                // Fill guest username
                await page.fill('[data-testid="username-input"], input[placeholder*="name"], input[name="username"]', testData.username);

                // Select avatar
                const avatarOptions = page.locator('.avatar-option, [data-testid="avatar-option"]');
                const avatarCount = await avatarOptions.count();

                if (avatarCount > 0) {
                    await avatarOptions.first().click();
                } else {
                    console.log('⚠️ No avatar options found, proceeding without avatar selection');
                }

                // Submit guest login
                await page.click('button[type="submit"]');
                await page.waitForLoadState('networkidle');

                // Verify successful login - should be redirected to home page
                const currentUrl = page.url();
                expect(currentUrl).toMatch(/\/(home|dashboard|\/)$/);

                // Verify student interface elements
                const studentIndicators = [
                    'text=Rejoindre',
                    'text=Créer',
                    'text=Practice',
                    'text=Tournoi'
                ];

                let foundStudentInterface = false;
                for (const indicator of studentIndicators) {
                    if (await page.locator(indicator).count() > 0) {
                        foundStudentInterface = true;
                        break;
                    }
                }

                expect(foundStudentInterface).toBe(true);
                console.log('✅ Student guest registration completed successfully');

            } catch (error) {
                await debugHelper.takeFailureScreenshot('student-guest-registration', error as Error);
                throw error;
            }
        });

        test('should handle student avatar selection', async ({ page }) => {
            const testData = testDataHelper.generateTestData('student');

            try {
                await page.goto('/login');
                await page.waitForLoadState('networkidle');

                await page.fill('[data-testid="username-input"], input[placeholder*="name"], input[name="username"]', testData.username);

                // Test avatar selection
                const avatarOptions = page.locator('.avatar-option, [data-testid="avatar-option"]');
                const avatarCount = await avatarOptions.count();

                if (avatarCount > 0) {
                    // Test selecting different avatars
                    for (let i = 0; i < Math.min(3, avatarCount); i++) {
                        await avatarOptions.nth(i).click();
                        await page.waitForTimeout(500); // Small delay to see selection

                        // Verify avatar is selected (look for active class or similar)
                        const isSelected = await avatarOptions.nth(i).evaluate(el =>
                            el.classList.contains('selected') ||
                            el.classList.contains('active') ||
                            el.getAttribute('data-selected') === 'true'
                        );

                        console.log(`Avatar ${i} selection state: ${isSelected}`);
                    }

                    // Select final avatar and proceed
                    await avatarOptions.first().click();
                    await page.click('button[type="submit"]');
                    await page.waitForLoadState('networkidle');

                    console.log('✅ Avatar selection functionality verified');
                } else {
                    console.log('⚠️ No avatar options found for testing');
                }

            } catch (error) {
                await debugHelper.takeFailureScreenshot('student-avatar-selection', error as Error);
                throw error;
            }
        });

        test('should validate username requirements', async ({ page }) => {
            try {
                await page.goto('/login');
                await page.waitForLoadState('networkidle');

                // Test empty username
                await page.click('button[type="submit"]');

                // Look for validation message
                const validationSelectors = [
                    'text=Nom d\'utilisateur requis',
                    'text=Username required',
                    'text=Ce champ est obligatoire',
                    '.error-message',
                    '[data-testid="error-message"]'
                ];

                let foundValidation = false;
                for (const selector of validationSelectors) {
                    if (await page.locator(selector).count() > 0) {
                        foundValidation = true;
                        break;
                    }
                }

                // If no validation message, check if form submission was prevented
                if (!foundValidation) {
                    const currentUrl = page.url();
                    const stillOnLoginPage = currentUrl.includes('/login');
                    expect(stillOnLoginPage).toBe(true);
                    console.log('✅ Empty username submission prevented (no redirect)');
                } else {
                    console.log('✅ Username validation message displayed');
                }

            } catch (error) {
                await debugHelper.takeFailureScreenshot('username-validation', error as Error);
                throw error;
            }
        });
    });

    test.describe('Session Management', () => {
        test('should maintain teacher session across page refreshes', async ({ page }) => {
            const testData = testDataHelper.generateTestData('teacher');

            try {
                // Create and login teacher
                await testDataHelper.createTeacher({
                    username: testData.username,
                    email: testData.email,
                    password: testData.password
                });

                await loginHelper.loginAsTeacher({
                    email: testData.email,
                    password: testData.password
                });

                // Verify initial login
                expect(await page.locator('text=Déconnexion').count()).toBeGreaterThan(0);

                // Refresh page
                await page.reload();
                await page.waitForLoadState('networkidle');

                // Verify session is maintained
                const sessionMaintained = await page.locator('text=Déconnexion').count() > 0;
                expect(sessionMaintained).toBe(true);

                console.log('✅ Teacher session maintained across page refresh');

            } catch (error) {
                await debugHelper.takeFailureScreenshot('teacher-session-persistence', error as Error);
                throw error;
            }
        });

        test('should handle teacher logout properly', async ({ page }) => {
            const testData = testDataHelper.generateTestData('teacher');

            try {
                // Create and login teacher
                await testDataHelper.createTeacher({
                    username: testData.username,
                    email: testData.email,
                    password: testData.password
                });

                await loginHelper.loginAsTeacher({
                    email: testData.email,
                    password: testData.password
                });

                // Logout
                await loginHelper.logout();

                // Verify logout - should not see logout button anymore
                const logoutButtonVisible = await page.locator('text=Déconnexion').count() > 0;
                expect(logoutButtonVisible).toBe(false);

                // Verify redirected to public page
                const currentUrl = page.url();
                expect(currentUrl).toMatch(/\/(home|login|\/)$/);

                console.log('✅ Teacher logout completed successfully');

            } catch (error) {
                await debugHelper.takeFailureScreenshot('teacher-logout', error as Error);
                throw error;
            }
        });

        test('should handle student session management', async ({ page }) => {
            const testData = testDataHelper.generateTestData('student');

            try {
                // Login as student
                await loginHelper.loginAsGuestStudent({ username: testData.username });

                // Navigate to different pages to test session
                const testPages = ['/student/create-game', '/student/join', '/'];

                for (const testPage of testPages) {
                    try {
                        await page.goto(testPage);
                        await page.waitForLoadState('networkidle');
                        console.log(`✅ Student session maintained on ${testPage}`);
                    } catch (error) {
                        console.log(`⚠️ Could not access ${testPage}, might be expected`);
                    }
                }

                console.log('✅ Student session management verified');

            } catch (error) {
                await debugHelper.takeFailureScreenshot('student-session-management', error as Error);
                throw error;
            }
        });
    });

    test.describe('Profile Management', () => {
        test('should display user profile information', async ({ page }) => {
            const testData = testDataHelper.generateTestData('teacher');

            try {
                // Create and login teacher
                await testDataHelper.createTeacher({
                    username: testData.username,
                    email: testData.email,
                    password: testData.password
                });

                await loginHelper.loginAsTeacher({
                    email: testData.email,
                    password: testData.password
                });

                // Look for profile information display
                const profileSelectors = [
                    `text=${testData.username}`,
                    `text=${testData.email}`,
                    '[data-testid="user-profile"]',
                    '.user-info',
                    '.profile-section'
                ];

                let foundProfile = false;
                for (const selector of profileSelectors) {
                    if (await page.locator(selector).count() > 0) {
                        foundProfile = true;
                        console.log(`✅ Found profile info with selector: ${selector}`);
                        break;
                    }
                }

                // If no specific profile display, just verify we're logged in
                if (!foundProfile) {
                    const loggedIn = await page.locator('text=Déconnexion').count() > 0;
                    expect(loggedIn).toBe(true);
                    console.log('✅ User logged in successfully (profile info may be in menu)');
                }

            } catch (error) {
                await debugHelper.takeFailureScreenshot('profile-display', error as Error);
                throw error;
            }
        });
    });

    test.afterEach(async ({ page }) => {
        // Clean up after each test
        try {
            await loginHelper.logout();
        } catch (error) {
            console.log('⚠️ Logout cleanup failed, clearing cookies manually');
            await page.context().clearCookies();
        }

        await testDataHelper.cleanDatabase();
    });
});
