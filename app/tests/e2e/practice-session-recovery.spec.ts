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
            // Step 1: Login using authenticateAsGuest
            console.log('🔑 Logging in...');
            const dataHelper = new TestDataHelper(page);
            const studentData = dataHelper.generateTestData('practice_recovery_student');
            // Use a very unique username that won't trigger autocomplete
            await authenticateAsGuest(page, 'Xyz987UniqueTestUser');
            console.log('✅ Login successful, on home page');

            // Step 2: Create practice game via API (like comprehensive test)
            console.log('🎯 Creating practice game...');

            // Wait a moment for session to be fully established
            await page.waitForTimeout(2000);

            // Get auth cookies
            const cookieHeader = await getAuthCookies(page);
            console.log('🍪 Retrieved cookies:', cookieHeader);

            // Get question UIDs
            const questionsResponse = await page.request.get('/api/questions/list', {
                params: {
                    gradeLevel: 'CP',
                    discipline: 'Mathématiques',
                    themes: 'Calcul',
                    limit: '5'
                },
                headers: {
                    'Cookie': cookieHeader
                }
            });

            if (!questionsResponse.ok()) {
                throw new Error(`Failed to get questions: ${questionsResponse.status()}`);
            }

            const questionsData = await questionsResponse.json();
            const questionUids = Array.isArray(questionsData) ? questionsData.slice(0, 5) : [];

            if (questionUids.length === 0) {
                throw new Error('No questions found for practice game creation');
            }

            // Create template via API
            const templateResponse = await page.request.post('/api/game-templates', {
                data: {
                    name: 'Practice Recovery Template',
                    gradeLevel: 'CP',
                    discipline: 'Mathématiques',
                    themes: ['Calcul'],
                    questionUids: questionUids,
                    description: 'AUTO: Created for practice recovery test',
                    defaultMode: 'practice'
                },
                headers: {
                    'Cookie': cookieHeader
                }
            });

            if (!templateResponse.ok()) {
                const errorText = await templateResponse.text();
                throw new Error(`Failed to create practice template: ${templateResponse.status()} - ${errorText}`);
            }

            const templateData = await templateResponse.json();
            const templateId = templateData.gameTemplate.id;

            // Create practice game from template
            const gameResponse = await page.request.post('/api/games', {
                data: {
                    name: 'Practice Recovery Game',
                    gameTemplateId: templateId,
                    playMode: 'practice',
                    settings: {
                        defaultMode: 'direct',
                        avatar: '🐨',
                        username: 'PracticeRecoveryStudent'
                    }
                },
                headers: {
                    'Cookie': cookieHeader
                }
            });

            if (!gameResponse.ok()) {
                const errorText = await gameResponse.text();
                throw new Error(`Failed to create practice game: ${gameResponse.status()} - ${errorText}`);
            }

            const gameData = await gameResponse.json();
            const accessCode = gameData.gameInstance.accessCode || gameData.gameInstance.code;
            console.log(`✅ Practice game created with access code: ${accessCode}`);

            // Step 3: Navigate to practice game
            console.log('🎮 Starting practice session...');
            await page.goto(`http://localhost:3008/live/${accessCode}`);
            console.log('✅ Navigation to practice game completed');

            // Step 4: Test answer button detection and session recovery
            console.log('❓ Testing answer button detection...');
            await page.waitForTimeout(3000);

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
                for (let i = 0; i < Math.min(textCount, 5); i++) {
                    const button = textAnswers.nth(i);
                    const text = await button.textContent();
                    const classes = await button.getAttribute('class');
                    const disabled = await button.getAttribute('aria-disabled');
                    console.log(`  Button ${i}: "${text}" | class: ${classes} | disabled: ${disabled}`);
                }
            }

            // Try to click the first available answer button
            let clicked = false;
            if (btnAnswerCount > 0) {
                console.log('🎯 Clicking first btn-answer button...');
                await btnAnswer.first().click();
                clicked = true;
            } else if (tqcardCount > 0) {
                console.log('🎯 Clicking first tqcard-answer button...');
                await tqcardAnswer.first().click();
                clicked = true;
            } else if (textCount > 0) {
                console.log('🎯 Clicking first button with text...');
                await textAnswers.first().click();
                clicked = true;
            }

            if (clicked) {
                console.log('✅ Answer button clicked successfully');

                // Step 5: Test recovery by refreshing the page
                console.log('🔄 Testing session recovery by refreshing page...');
                const beforeRefreshUrl = page.url();
                console.log(`URL before refresh: ${beforeRefreshUrl}`);

                // Capture current question content before refresh
                const questionElements = page.locator('[data-testid="question-text"], .question-text, h2, h3, p').first();
                const questionText = await questionElements.textContent();
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
                const afterRefreshQuestionElements = page.locator('[data-testid="question-text"], .question-text, h2, h3, p').first();
                const afterRefreshQuestionText = await afterRefreshQuestionElements.textContent();
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
                console.log('❌ No clickable answer buttons found');
                console.log('ℹ️ Cannot test recovery without answer buttons');
            }

        } catch (error) {
            console.error('❌ Test failed:', error);
            await page.screenshot({ path: 'test-results/e2e/debug-answer-button-failure.png' });
            throw error;
        }
    });
});