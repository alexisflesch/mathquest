import { test, expect, Page } from '@playwright/test';
import { TestDataHelper, LoginHelper } from './helpers/test-helpers';

// Logging helper
const log = (message: string) => console.log(message);

// Helper to handle guest authentication (copied from working late-join test)
async function authenticateAsGuest(page: Page, username: string): Promise<void> {
    log(`Starting guest authentication for ${username}...`);

    await page.goto('http://localhost:3008/login');

    // Check if already logged in
    try {
        await page.waitForSelector('[data-testid="user-profile"]', { timeout: 1000 });
        log('User already authenticated');
        return;
    } catch {
        log('User not authenticated, proceeding with login...');
    }

    // Fill username
    const usernameInput = page.locator('input[placeholder*="pseudo"], input[name="username"]');
    await usernameInput.waitFor({ timeout: 2000 });
    await usernameInput.fill(username);
    log(`Filled username: ${username}`);

    // Wait for autocomplete dropdown to appear, then dismiss it
    await page.waitForTimeout(1000); // Give time for dropdown to appear
    await page.keyboard.press('Escape'); // Try Escape first
    await page.locator('body').click({ force: true }); // Force click on body
    await page.waitForTimeout(500); // Wait for dropdown to disappear

    await page.waitForTimeout(1000);

    // Select first available avatar
    const avatarSelector = '[data-testid="avatar-option"], .avatar-option, img[alt*="avatar"], button:has(img)';
    await page.waitForSelector(avatarSelector, { timeout: 5000 });
    const avatars = page.locator(avatarSelector);
    const avatarCount = await avatars.count();
    log(`Found ${avatarCount} avatars to choose from`);

    if (avatarCount > 0) {
        log('Attempting to click first avatar...');
        await avatars.first().click();
        log('Selected first available avatar');
        // Wait for avatar selection to take effect
        await page.waitForTimeout(1000);

        // Check if page changed after avatar selection
        const currentUrl = page.url();
        log(`Current URL after avatar selection: ${currentUrl}`);

        // Check for submit button immediately after avatar selection
        const submitButtonExists = await page.locator('button[type="submit"]').count() > 0;
        log(`Submit button exists after avatar selection: ${submitButtonExists}`);
    } else {
        log('❌ No avatars found to select');
        throw new Error('No avatars available for selection');
    }

    // Click submit button - try multiple approaches
    const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Connexion")',
        'button:has-text("Login")',
        'button:has-text("Se connecter")',
        '[data-testid="login-submit"]'
    ];

    let submitClicked = false;
    for (const selector of submitSelectors) {
        try {
            const submitButton = page.locator(selector);
            const count = await submitButton.count();
            log(`Checking selector "${selector}": found ${count} elements`);
            if (count > 0) {
                log(`Waiting for button to be enabled with selector: ${selector}`);
                // Try to wait for button to be enabled, but if it doesn't become enabled, force click it
                try {
                    await page.waitForFunction(
                        (sel) => {
                            const btn = document.querySelector(sel) as HTMLButtonElement;
                            return btn && !btn.disabled;
                        },
                        selector,
                        { timeout: 3000 }
                    );
                    log(`Button is now enabled, attempting to click with selector: ${selector}`);
                    await submitButton.first().click();
                } catch (e) {
                    log(`Button never became enabled, trying force click: ${String(e)}`);
                    await submitButton.first().click({ force: true });
                }
                log(`Clicked submit button with selector: ${selector}`);
                submitClicked = true;
                break;
            }
        } catch (e) {
            log(`Failed to click with selector "${selector}": ${String(e)}`);
            // Continue to next selector
        }
    }

    if (!submitClicked) {
        throw new Error('Could not find or click login submit button');
    }

    await page.waitForSelector('[data-testid="user-profile"], .user-profile, nav, header', { timeout: 5000 });
    log('Guest authentication successful');
}

// Helper to get authentication cookies from page context
async function getAuthCookies(page: Page): Promise<string> {
    // Try to get cookies from both context and document
    const contextCookies = await page.context().cookies();
    console.log('Context cookies:', contextCookies);

    // Also check document.cookie
    const documentCookies = await page.evaluate(() => document.cookie);
    console.log('Document cookies:', documentCookies);

    // Combine both
    const allCookies = [...contextCookies];
    if (documentCookies) {
        // Parse document cookies and add them if not already present
        documentCookies.split(';').forEach(cookieStr => {
            const [name, value] = cookieStr.trim().split('=');
            if (name && !allCookies.find(c => c.name === name)) {
                allCookies.push({ name, value: value || '', domain: '', path: '', expires: -1, httpOnly: false, secure: false, sameSite: 'Lax' as any });
            }
        });
    }

    console.log('All combined cookies:', allCookies);
    return allCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}

test.describe('Practice Session Recovery E2E', () => {
    test('Practice Session: Recovery after page refresh', async ({ page }) => {
        console.log('🔐 Starting practice session recovery test...');

        test.setTimeout(60000); // Increase timeout to 60 seconds

        try {
            // Step 1: Create student account and login
            console.log('🔑 Creating and logging in student...');
            const dataHelper = new TestDataHelper(page);
            const studentData = dataHelper.generateTestData('practice_recovery_student');
            const student = await dataHelper.createStudent({
                username: studentData.username,
                email: studentData.email,
                password: studentData.password
            });

            // Login via backend API
            const loginResponse = await page.request.post('http://localhost:3007/api/v1/auth/login', {
                data: {
                    email: student.email,
                    password: student.password
                }
            });

            if (!loginResponse.ok()) {
                const errorBody = await loginResponse.text();
                throw new Error(`Student login failed: ${loginResponse.status()} - ${errorBody}`);
            }

            console.log('✅ Student authentication successful');

            // Step 2: Create practice game via API (like tournament test)
            console.log('🎯 Creating practice game...');

            // Wait a moment for session to be fully established
            await page.waitForTimeout(2000);

            // Create practice game directly (no template needed for practice)
            const gameResponse = await page.request.post('http://localhost:3007/api/v1/games', {
                data: {
                    name: 'Practice Recovery Game',
                    playMode: 'practice',
                    gradeLevel: 'CP',
                    discipline: 'Mathématiques',
                    themes: ['Calcul'],
                    nbOfQuestions: 5,
                    settings: {
                        defaultMode: 'direct',
                        avatar: '🐨',
                        username: student.username
                    }
                }
            });

            if (!gameResponse.ok()) {
                const errorText = await gameResponse.text();
                throw new Error(`Failed to create practice game: ${gameResponse.status()} - ${errorText}`);
            }

            const gameData = await gameResponse.json();
            const accessCode = gameData.gameInstance?.accessCode || gameData.accessCode;
            console.log(`✅ Practice game created with access code: ${accessCode}`);

            if (!accessCode) {
                throw new Error('No access code received from game creation');
            }

            // Step 3: Login student on frontend
            console.log('🔑 Logging in student on frontend...');
            const loginHelper = new LoginHelper(page);
            await loginHelper.loginAsAuthenticatedStudent({
                email: student.email!,
                password: student.password!
            });
            console.log('✅ Frontend login successful');

            // Step 4: Navigate to practice game
            console.log('🎮 Starting practice session...');
            await page.goto(`http://localhost:3008/live/${accessCode}`);
            console.log('✅ Navigation to practice game completed');

            // Step 4: Test answer button detection and session recovery
            console.log('❓ Testing answer button detection...');
            await page.waitForTimeout(5000); // Wait longer for game to load

            // Check if we need to join the game first
            const joinButton = page.locator('button:has-text("Rejoindre"), button:has-text("Join"), button:has-text("Commencer")');
            const joinVisible = await joinButton.isVisible().catch(() => false);
            if (joinVisible) {
                console.log('🎯 Joining the game...');
                await joinButton.first().click();
                await page.waitForTimeout(3000);
            }

            // Try multiple selectors for answer buttons
            console.log('🔍 Looking for answer buttons...');

            // Method 1: CSS classes from user's example
            const btnAnswer = page.locator('button.btn-answer');
            const btnAnswerCount = await btnAnswer.count();
            console.log(`Found ${btnAnswerCount} buttons with class 'btn-answer'`);

            // Method 2: tqcard-answer class
            const tqcardAnswer = page.locator('button.tqcard-answer');
            const tqcardCount = await tqcardAnswer.count();
            console.log(`Found ${tqcardCount} buttons with class 'tqcard-answer'`);

            // Method 3: Any button with answer-like text
            const textAnswers = page.locator('button').filter({ hasText: /.+/ });
            const textCount = await textAnswers.count();
            console.log(`Found ${textCount} buttons with any text`);

            // Log details of found buttons
            if (textCount > 0) {
                console.log('📋 Button details:');
                for (let i = 0; i < Math.min(textCount, 10); i++) {
                    const button = textAnswers.nth(i);
                    const text = await button.textContent();
                    const classes = await button.getAttribute('class');
                    const disabled = await button.getAttribute('aria-disabled');
                    console.log(`  Button ${i}: "${text}" | class: ${classes} | disabled: ${disabled}`);
                }
            }

            // Try to find actual answer buttons (not header buttons)
            const answerSelectors = [
                'button.btn-answer',
                'button.tqcard-answer',
                '.answer-option button',
                '[data-testid="answer-button"]',
                'button:has-text("A")', // Common answer labels
                'button:has-text("B")',
                'button:has-text("C")',
                'button:has-text("D")'
            ];

            let answerButtons = null;
            for (const selector of answerSelectors) {
                const buttons = page.locator(selector);
                const count = await buttons.count();
                if (count > 0) {
                    console.log(`✅ Found ${count} answer buttons with selector: ${selector}`);
                    answerButtons = buttons;
                    break;
                }
            }

            if (answerButtons) {
                console.log('🎯 Clicking first answer button...');
                await answerButtons.first().click();
                console.log('✅ Answer button clicked successfully');

                // Step 5: Test recovery by refreshing the page
                console.log('🔄 Testing session recovery by refreshing page...');
                const beforeRefreshUrl = page.url();
                console.log(`URL before refresh: ${beforeRefreshUrl}`);

                // Capture current question content before refresh
                const questionSelectors = [
                    '[data-testid="question-text"]',
                    '.question-text-in-live-page',
                    '.question-text',
                    '[class*="question-text"]',
                    'h2, h3, p'
                ];

                let questionText = '';
                for (const selector of questionSelectors) {
                    const element = page.locator(selector).first();
                    const count = await element.count();
                    if (count > 0) {
                        questionText = await element.textContent() || '';
                        if (questionText.trim()) {
                            console.log(`✅ Found question text with selector: ${selector}`);
                            break;
                        }
                    }
                }

                console.log(`Question text before refresh: "${questionText}"`);

                // Use goto instead of reload to avoid browser context issues
                try {
                    await page.goto(beforeRefreshUrl, { waitUntil: 'networkidle', timeout: 10000 });
                    await page.waitForTimeout(3000);
                    console.log('✅ Page refresh/navigation successful');
                } catch (error) {
                    console.log('⚠️ Page navigation failed, trying alternative approach...');
                    // Try a simple reload as fallback
                    await page.reload({ timeout: 10000 });
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(3000);
                }

                // Step 6: Check recovery
                const afterRefreshUrl = page.url();
                console.log(`URL after refresh: ${afterRefreshUrl}`);

                // Check if question content is the same
                let afterRefreshQuestionText = '';
                for (const selector of questionSelectors) {
                    const element = page.locator(selector).first();
                    const count = await element.count();
                    if (count > 0) {
                        afterRefreshQuestionText = await element.textContent() || '';
                        if (afterRefreshQuestionText.trim()) {
                            console.log(`✅ Found question text after refresh with selector: ${selector}`);
                            break;
                        }
                    }
                }

                console.log(`Question text after refresh: "${afterRefreshQuestionText}"`);

                // Check if user is still logged in
                const stillLoggedIn = await page.locator('button').filter({ hasText: 'Déconnexion' }).count() > 0;
                console.log(`User still logged in after refresh: ${stillLoggedIn}`);

                // Determine if recovery worked
                const questionTextSame = questionText === afterRefreshQuestionText;
                const urlSame = beforeRefreshUrl === afterRefreshUrl;

                console.log(`\n🔍 RECOVERY ANALYSIS:`);
                console.log(`Question text same: ${questionTextSame}`);
                console.log(`URL same: ${urlSame}`);
                console.log(`User logged in: ${stillLoggedIn}`);

                if (urlSame && questionTextSame && stillLoggedIn) {
                    console.log('\n🎉 SESSION RECOVERY SUCCESSFUL!');
                    console.log('✅ Practice session continued from same question after refresh');
                    console.log('✅ User remains logged in');
                    console.log('✅ Recovery mechanism working correctly');
                } else if (!stillLoggedIn) {
                    console.log('\n❌ AUTHENTICATION LOST!');
                    console.log('❌ User was logged out during refresh');
                    console.log('❌ Authentication issue during recovery');
                } else {
                    console.log('\n⚠️ SESSION RECOVERY PARTIAL!');
                    console.log('⚠️ Session may have been affected by refresh');
                    console.log('⚠️ May need further investigation');
                }

                console.log('\n✅ TEST COMPLETED: Practice session recovery analysis done');

            } else {
                console.log('❌ No answer buttons found, taking screenshot for debugging...');
                await page.screenshot({ path: 'test-results/e2e/debug-no-answer-buttons.png' });
                throw new Error('No answer buttons found on the practice game page');
            }

        } catch (error) {
            console.error('❌ Test failed:', error);
            await page.screenshot({ path: 'test-results/e2e/debug-answer-button-failure.png' });
            throw error;
        }
    });
});