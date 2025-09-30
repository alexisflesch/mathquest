/**
 * E2E Test: Single Choice Answer Reversion
 */

import { test, expect } from '@playwright/test';
import { TestDataHelper, LoginHelper } from './helpers/test-helpers';

// Test configuration
const TEST_CONFIG = {
    frontendUrl: 'http://localhost:3008',
    backendUrl: 'http://localhost:3007',
    timeout: 30000
};

// Helper function to log with timestamp
function log(message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Helper to create quiz via API (adapted from numeric test)
async function createQuizViaAPI(page: any, teacherData: any) {
    try {
        // Step 1: Get some question UIDs - look for CE1 maths single choice questions
        const questionsResponse = await page.request.get('http://localhost:3007/api/v1/questions/list', {
            params: {
                gradeLevel: 'CE1',
                discipline: 'Mathématiques',
                questionType: 'single_choice',
                themes: 'Calcul',
                limit: '5'
            }
        });

        if (!questionsResponse.ok()) {
            throw new Error(`Failed to get questions: ${questionsResponse.status()}`);
        }

        const questionUids = await questionsResponse.json();

        if (!Array.isArray(questionUids) || questionUids.length === 0) {
            throw new Error('No questions found for quiz creation');
        }

        log('Got question UIDs:', questionUids.slice(0, 3));

        // Step 2: Create a quiz template
        const templateResponse = await page.request.post('http://localhost:3007/api/v1/game-templates', {
            data: {
                name: 'Single Choice Quiz Template',
                gradeLevel: 'CE1',
                discipline: 'Mathématiques',
                themes: ['Calcul'],
                questionUids: questionUids,
                description: 'Auto-created template for single choice answer reversion test',
                defaultMode: 'quiz'
            }
        });

        if (!templateResponse.ok()) {
            const errorBody = await templateResponse.text();
            throw new Error(`Template creation failed: ${templateResponse.status()} - ${errorBody}`);
        }

        const templateData = await templateResponse.json();
        log('Template created:', templateData.gameTemplate.id);

        // Step 3: Create the quiz from the template
        const quizResponse = await page.request.post('http://localhost:3007/api/v1/games', {
            data: {
                name: 'Single Choice Quiz',
                gameTemplateId: templateData.gameTemplate.id,
                playMode: 'quiz',
                settings: {}
            }
        });

        if (!quizResponse.ok()) {
            const errorBody = await quizResponse.text();
            throw new Error(`Quiz creation failed: ${quizResponse.status()} - ${errorBody}`);
        }

        const quizData = await quizResponse.json();
        log('Quiz created successfully', quizData);

        return {
            accessCode: quizData.gameInstance.accessCode,
            quizId: quizData.gameInstance.id
        };
    } catch (error: any) {
        log('Quiz creation failed', { error: error.message });
        throw new Error(`Quiz creation failed: ${error.message}`);
    }
}

// Helper to handle guest authentication
async function authenticateAsGuest(page: any, userConfig: { username: string; avatar: string }): Promise<void> {
    log(`Starting guest authentication for ${userConfig.username}...`);

    await page.goto(TEST_CONFIG.frontendUrl + '/login');

    // Check if we're already logged in
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
    await usernameInput.fill(userConfig.username);
    log(`Filled username: ${userConfig.username}`);

    // Wait a bit for avatars to load
    await page.waitForTimeout(1000);

    // Select first available avatar
    const avatarSelector = '[data-testid="avatar-option"], .avatar-option, img[alt*="avatar"], button:has(img)';
    await page.waitForSelector(avatarSelector, { timeout: 5000 });
    const avatars = page.locator(avatarSelector);
    const avatarCount = await avatars.count();
    log(`Found ${avatarCount} avatars to choose from`);

    if (avatarCount > 0) {
        await avatars.first().click();
        log('Selected first available avatar');

        // Wait a moment and check page state
        await page.waitForTimeout(1000);
        const postAvatarContent = await page.textContent('body');
        log(`Page content after avatar selection (first 500 chars): ${postAvatarContent?.substring(0, 500)}`);
    } else {
        // Fallback: try clicking anywhere that might select an avatar
        await page.click('body');
        log('Clicked body as avatar fallback');
    }

    // Wait a moment after avatar selection
    await page.waitForTimeout(500);

    // Click login
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
            if (await submitButton.count() > 0) {
                await submitButton.click();
                log(`Clicked submit button with selector: ${selector}`);
                submitClicked = true;
                break;
            }
        } catch (e) {
            // Continue to next selector
        }
    }

    if (!submitClicked) {
        throw new Error('Could not find or click login submit button');
    }

    // Wait for successful login
    await page.waitForTimeout(1000);
    log('✅ Guest authentication completed');
}

test.describe('Single Choice Answer Reversion', () => {
    test('should revert to previously accepted single choice answer when late submission is rejected', async ({ browser }) => {
        test.setTimeout(60000); // 60 seconds for this test

        // Create browser contexts for teacher and student
        const teacherContext = await browser.newContext();
        const studentContext = await browser.newContext();

        const teacherPage = await teacherContext.newPage();
        const studentPage = await studentContext.newPage();

        try {
            // Step 1: Create teacher account and create quiz
            log('🚀 Starting single choice answer reversion test...');

            const dataHelper = new TestDataHelper(teacherPage);

            // Generate test data
            const teacherData = dataHelper.generateTestData('single_choice_teacher');

            // Create teacher account
            await dataHelper.createTeacher({
                username: teacherData.username,
                email: teacherData.email,
                password: teacherData.password
            });

            log('✅ Teacher account created');

            // Login teacher in browser
            const teacherLogin = new LoginHelper(teacherPage);
            await teacherLogin.loginAsTeacher({
                email: teacherData.email,
                password: teacherData.password
            });

            log('✅ Teacher logged in to browser');

            const quizData = await createQuizViaAPI(teacherPage, teacherData);

            log('✅ Quiz created with access code:', quizData.accessCode);

            // Step 2: Student joins quiz
            log('👨‍🎓 Student joining quiz...');

            // Generate student data with French name
            const studentData = dataHelper.generateTestData('single_choice_student_xyz');
            log('Generated student data:', studentData);

            // Authenticate as guest student
            await authenticateAsGuest(studentPage, {
                username: studentData.username,
                avatar: 'first'  // Use first available
            });

            log('✅ Student authenticated as guest');

            // Join the quiz
            await studentPage.goto('/student/join');
            await studentPage.fill('input[type="tel"], input[placeholder*="Code"]', quizData.accessCode);
            log('Filled access code:', quizData.accessCode);

            await studentPage.click('button:has-text("Rejoindre")');
            log('Clicked join button');

            // Verify student is on the live quiz page
            await studentPage.waitForURL(`**/live/${quizData.accessCode}`, { timeout: 5000 });
            log('✅ Student successfully joined quiz and is on live page');

            // Wait for student page to fully load
            await studentPage.waitForLoadState('networkidle');
            await studentPage.waitForTimeout(2000); // Extra time for React to render

            // Step 3: Teacher starts the quiz
            log('👨‍🏫 Teacher starting quiz...');
            await teacherPage.goto(`${TEST_CONFIG.frontendUrl}/teacher/dashboard/${quizData.accessCode}`);
            await teacherPage.click('button:has-text("Commencer")');
            log('✅ Teacher started quiz');

            // Step 4: Wait for question to appear and submit initial answer
            log('⏳ Waiting for question to appear...');
            await studentPage.waitForSelector('button.btn-answer', { timeout: 10000 });
            log('✅ Question appeared');

            // Get all answer buttons
            const allAnswerButtons = studentPage.locator('button.btn-answer');
            const answerCount = await allAnswerButtons.count();
            log(`Found ${answerCount} answer buttons`);

            if (answerCount < 2) {
                throw new Error(`Expected at least 2 answer buttons, but found ${answerCount}`);
            }

            // Select first answer as initial answer
            const initialAnswerIndex = 0;
            await allAnswerButtons.nth(initialAnswerIndex).click();
            log(`Selected initial answer: ${initialAnswerIndex}`);

            // Submit the answer
            const submitButton = studentPage.locator('button:has-text("Valider"), button:has-text("Submit"), button[type="submit"]').first();
            await submitButton.click();
            log('Clicked submit button for initial answer');

            // Wait for answer to be accepted (should show success feedback)
            const successSelectors = [
                '.success',
                '[class*="success"]',
                'text=Réponse enregistrée',
                'text=Answer recorded',
                'text=enregistrée',
                '.snackbar-success',
                '[data-testid="success-message"]'
            ];

            let successFound = false;
            for (const selector of successSelectors) {
                try {
                    await studentPage.waitForSelector(selector, { timeout: 2000 });
                    log(`✅ Found success feedback with selector: ${selector}`);
                    successFound = true;
                    break;
                } catch (e) {
                    // Continue to next selector
                }
            }

            if (!successFound) {
                log('⚠️ No explicit success feedback found, continuing with test...');
            }

            // Verify the initial answer is selected
            const initialSelected = await allAnswerButtons.nth(initialAnswerIndex).getAttribute('class').then(cls => cls?.includes('answer-selected'));
            if (!initialSelected) {
                throw new Error('Initial answer was not properly selected after submission');
            }
            log('✅ Initial answer is selected');

            // Step 5: Attempt late submission (try to change the answer)
            const lateAnswerIndex = 1; // Try to select the second answer
            await allAnswerButtons.nth(lateAnswerIndex).click();
            log(`Attempted to select late answer: ${lateAnswerIndex}`);

            // Try to submit again
            await submitButton.click();
            log('Clicked submit button for late submission');

            // Step 6: Verify late submission is rejected and UI reverts
            // Wait for the rejection logic to execute and state to update
            await studentPage.waitForTimeout(2000); // Give more time for state updates

            // Check that the initial answer is still selected and the late selection is reverted
            const initialStillSelected = await allAnswerButtons.nth(initialAnswerIndex).getAttribute('class').then(cls => cls?.includes('answer-selected'));
            const lateNotSelected = !(await allAnswerButtons.nth(lateAnswerIndex).getAttribute('class').then(cls => cls?.includes('answer-selected')));

            if (!initialStillSelected || !lateNotSelected) {
                log(`❌ Expected initial answer to remain selected and late answer to be rejected`);
                log(`Initial selected: ${initialStillSelected}, Late selected: ${!lateNotSelected}`);
                throw new Error(`Late submission was not rejected - UI did not revert to previously accepted answer`);
            }

            log('✅ Late submission rejected - UI reverted to previously accepted answer');

            // Check for rejection feedback message
            const rejectionSelectors = [
                'text=Réponse déjà enregistrée',
                'text=Answer already submitted',
                'text=already submitted',
                '.error',
                '[class*="error"]'
            ];

            let rejectionFound = false;
            for (const selector of rejectionSelectors) {
                const count = await studentPage.locator(selector).count();
                if (count > 0) {
                    log(`✅ Found rejection feedback with selector: ${selector}`);
                    rejectionFound = true;
                    break;
                }
            }

            if (!rejectionFound) {
                log('⚠️ No explicit rejection feedback found, but UI reverted correctly');
            }

            log('🎉 Single choice answer reversion test completed successfully!');

        } catch (error: any) {
            log(`❌ Test failed: ${error.message}`);
            throw error;
        } finally {
            await teacherContext.close();
            await studentContext.close();
        }
    });
});
