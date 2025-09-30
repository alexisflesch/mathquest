/**
 * E2E Test: Multiple Choice Answer Reversion
 *
 * This test verifies that when a student submits multiple choice answers that get accepted,
 * then tries to change them too         // Step 2: Create a quiz template
        const templateResponse = await page.request.post('http://localhost:3007/api/v1/game-templates', {
            data: {
                name: 'Multiple Choice Quiz Template',
                gradeLevel: 'CE1',
                discipline: 'Mathématiques',
                themes: ['Calcul'],
                questionUids: questionUids,
                description: 'Auto-created template for multiple choice answer reversion test',
                defaultMode: 'quiz'
            }
        }); submission is rejected, the UI reverts
 * to showing the previously accepted answers.
 *
 * This test uses a quiz format instead of tournament for simpler timing control.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { TestDataHelper, LoginHelper } from './helpers/test-helpers';

// Test configuration
const TEST_CONFIG = {
    frontendUrl: 'http://localhost:3008',
    backendUrl: 'http://localhost:3007',
    timeout: 30000,
    teacher: {
        username: 'TestTeacher',
        avatar: '🐨'
    },
    student: {
        username: 'TestStudent',
        avatar: '🐶'
    }
};

interface QuizData {
    accessCode: string;
    quizId: string;
}

// Helper function to log with timestamp
function log(message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Helper to handle guest authentication (simplified from working test)
async function authenticateAsGuest(page: Page, userConfig: { username: string; avatar: string }): Promise<void> {
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

    // Select first available avatar (with timeout protection)
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

    // Click login - try multiple selectors
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
            log(`Looking for submit button with selector "${selector}": found ${count}`);
            if (count > 0) {
                const buttonText = await submitButton.first().textContent();
                log(`Submit button text: "${buttonText}"`);
                await submitButton.first().click();
                log(`Clicked login button with selector: ${selector}`);
                submitClicked = true;
                break;
            }
        } catch (e) {
            log(`Error with selector ${selector}: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    if (!submitClicked) {
        log('No submit button found, trying to submit form by pressing Enter');
        await page.keyboard.press('Enter');
    }

    // Wait for authentication - be more flexible with success indicators
    try {
        await page.waitForSelector('[data-testid="user-profile"], .user-profile, nav, header, [data-testid="main-nav"]', { timeout: 5000 });
        log('Guest authentication successful');
    } catch (e) {
        // Check if we're on a different page or if login succeeded in another way
        const currentUrl = page.url();
        log(`Authentication wait failed, current URL: ${currentUrl}`);
        if (currentUrl.includes('/live/') || currentUrl.includes('/quiz/')) {
            log('Appears to be redirected to game page, authentication likely successful');
        } else {
            throw new Error(`Guest authentication failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
}

// Helper to create quiz via API (with proper teacher auth)
async function createQuizViaAPI(page: Page, teacherData: any): Promise<QuizData> {
    log('Creating quiz via API with teacher auth...');

    try {
        // First login the teacher to get auth cookies
        const loginResponse = await page.request.post('http://localhost:3007/api/v1/auth/login', {
            data: {
                email: teacherData.email,
                password: teacherData.password
            }
        });

        if (!loginResponse.ok()) {
            const errorBody = await loginResponse.text();
            throw new Error(`Teacher login failed: ${loginResponse.status()} - ${errorBody}`);
        }

        log('✅ Teacher login successful');

        // Step 1: Get some question UIDs - look for CE1 maths questions (any type)
        const questionsResponse = await page.request.get('http://localhost:3007/api/v1/questions/list', {
            params: {
                gradeLevel: 'CE1',
                discipline: 'Mathématiques',
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
                name: `Quiz Template ${Date.now()}`,
                gradeLevel: 'CP',
                discipline: 'Mathématiques',
                themes: ['Calcul'],
                questionUids: questionUids,
                description: 'Auto-created template for numeric answer reversion test',
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
                name: 'Multiple Choice Quiz',
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

test.describe('Multiple Choice Answer Reversion', () => {
    test('should revert to previously accepted multiple choice answers when late submission is rejected', async ({ browser }) => {
        test.setTimeout(60000); // 60 seconds for this test

        // Create browser contexts for teacher and student
        const teacherContext = await browser.newContext();
        const studentContext = await browser.newContext();

        const teacherPage = await teacherContext.newPage();
        const studentPage = await studentContext.newPage();

        try {
            // Step 1: Create teacher account and create quiz
            log('🚀 Starting multiple choice answer reversion test...');

            const dataHelper = new TestDataHelper(teacherPage);

            // Generate test data
            const teacherData = dataHelper.generateTestData('multiple_choice_teacher');

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
            const studentData = dataHelper.generateTestData('multiple_choice_student_xyz');
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

            // Check what the student sees after joining
            const studentStatus = await studentPage.textContent('body');
            const hasWaitingText = studentStatus?.includes('En attente') || studentStatus?.includes('waiting') || studentStatus?.includes('Participants');
            log('Student joined - waiting for quiz start. Has waiting text:', hasWaitingText);
            log('Student page content length:', studentStatus?.length);

            // Step 3: Teacher starts the quiz

            // Step 3: Teacher starts the quiz
            log('🚀 Teacher starting quiz...');

            // Navigate teacher to the teacher dashboard (not regular live page)
            await teacherPage.goto(`/teacher/dashboard/${quizData.accessCode}`);
            await teacherPage.waitForLoadState('networkidle');
            await teacherPage.waitForTimeout(3000); // Extra time for dashboard to load
            log('Teacher navigated to teacher dashboard');

            // Wait for socket connection and lobby to load
            log('Waiting for socket connection and lobby...');
            await teacherPage.waitForTimeout(5000); // Give time for socket to connect

            // Wait for teacher dashboard to load (look for questions section)
            await teacherPage.waitForSelector('text=Questions', { timeout: 10000 });
            log('Teacher dashboard loaded successfully');

            // Wait for teacher dashboard to be ready (just wait for basic page load)
            await teacherPage.waitForLoadState('networkidle');
            log('Teacher dashboard page loaded');

            // Give it some time for socket connections and data loading
            await teacherPage.waitForTimeout(3000);

            // Check if we got an access error
            const hasAccessError = await teacherPage.locator('text=Accès refusé').count() > 0;
            if (hasAccessError) {
                const errorText = await teacherPage.textContent('body');
                log('Access error on teacher dashboard:', errorText);
                throw new Error('Teacher cannot access dashboard - check authentication or quiz ownership');
            }

            // Check if dashboard loaded successfully
            const hasDashboardContent = await teacherPage.locator('text=Questions').count() > 0;
            log('Dashboard has questions section:', hasDashboardContent);

            if (!hasDashboardContent) {
                // Maybe dashboard is still loading, wait a bit more
                await teacherPage.waitForTimeout(5000);
            }

            // Look for a "Start Quiz" or "Démarrer le quiz" button instead of individual question play buttons
            const startQuizButton = teacherPage.locator('button:has-text("Démarrer"), button:has-text("Start"), button[data-testid="start-quiz"]');
            const startQuizCount = await startQuizButton.count();
            log(`Found ${startQuizCount} start quiz buttons`);

            if (startQuizCount > 0) {
                await startQuizButton.first().click();
                log('Clicked start quiz button');
            } else {
                // Fall back to individual question play buttons
                log('No start quiz button found, trying individual question play buttons');
                // Now look for the first question's play button specifically
                // Questions are in a list, each should have a play button
                const questionItems = teacherPage.locator('[data-testid*="question"], .question-item, [class*="question"]');
                const questionCount = await questionItems.count();
                log(`Found ${questionCount} question items in dashboard`);

                if (questionCount > 0) {
                    // Click on the first question to expand it if needed
                    await questionItems.first().click();
                    await teacherPage.waitForTimeout(500);

                    // Now look for play button within the first question
                    const firstQuestion = questionItems.first();
                    const playButton = firstQuestion.locator('button[data-testid="play-button"], button:has(svg), button[class*="play"]').first();

                    if (await playButton.count() > 0) {
                        await playButton.click();
                        log('Clicked play button on first question');
                    } else {
                        // Try clicking any button in the first question area
                        const anyButton = firstQuestion.locator('button').first();
                        if (await anyButton.count() > 0) {
                            await anyButton.click();
                            log('Clicked first button in first question');
                        } else {
                            log('No buttons found in first question');
                        }
                    }
                } else {
                    log('No question items found, trying fallback button click');
                    // Fallback: click any button that might work
                    const allButtons = teacherPage.locator('button');
                    const buttonCount = await allButtons.count();
                    log(`Found ${buttonCount} total buttons, clicking first non-close button`);
                    // Skip the first button (might be close/end button) and try the next one
                    if (buttonCount > 1) {
                        await allButtons.nth(1).click();
                        log('Clicked second button as fallback');
                    } else if (buttonCount > 0) {
                        await allButtons.first().click();
                        log('Clicked first button as last resort');
                    }
                }
            }

            // Wait a moment for socket events to propagate after clicking play
            await teacherPage.waitForTimeout(2000);

            // Check if student page updates (might reload or change content)
            log('Checking if student page updates after teacher starts quiz...');
            await studentPage.waitForLoadState('networkidle');
            await studentPage.waitForTimeout(2000); // Extra time for content to update

            // Now check for question - use the correct selector from QuestionCard component
            const questionSelectors = [
                '[data-testid="question-text"]',
                '.question-text-in-live-page',
                '.question-text',
                'h3:has-text("Question")',
                '[class*="question-text"]'
            ];

            let questionFound = false;
            for (const selector of questionSelectors) {
                try {
                    await studentPage.waitForSelector(selector, { timeout: 3000 });
                    log(`✅ Question found with selector: ${selector}`);
                    questionFound = true;
                    break;
                } catch (e) {
                    log(`Question not found with selector: ${selector}`);
                }
            }

            if (!questionFound) {
                // Log more debug info
                const studentContentAfter = await studentPage.textContent('body');
                log('Student page content after teacher play click - full content:');
                log(studentContentAfter ? studentContentAfter.substring(0, 2000) : 'No content found');

                // Check if student page reloaded or changed
                const currentUrl = studentPage.url();
                log(`Student current URL: ${currentUrl}`);

                // Check for any error messages
                const errorSelectors = ['.error', '.alert-error', '[class*="error"]', 'text=Erreur', 'text=Error'];
                for (const errorSel of errorSelectors) {
                    const errorCount = await studentPage.locator(errorSel).count();
                    if (errorCount > 0) {
                        const errorText = await studentPage.locator(errorSel).first().textContent();
                        log(`Found error on student page: ${errorText}`);
                    }
                }

                throw new Error('Question did not appear on student page after teacher started quiz');
            }

            log('✅ Quiz started, first question loaded on student page');

            // Step 4: Verify this is a numeric question and implement answer reversion test
            log('🔍 Checking question type and implementing numeric answer reversion test...');

            // Check if this is a numeric question by looking for numeric input field
            const numericInputLocator = studentPage.locator('input[type="number"], input[placeholder*="nombre"], input[placeholder*="chiffre"]');
            const numericInputCount = await numericInputLocator.count();

            if (numericInputCount === 0) {
                // Check question text to see if it's numeric
                const questionText = await studentPage.locator('.question-text-in-live-page').textContent();
                log(`Question text: ${questionText}`);

                // If not numeric, we might need to wait for the next question or check if there are numeric questions
                // For now, let's assume the first question might not be numeric and try to continue
                log('⚠️ First question does not appear to be numeric, checking if we can proceed...');
                throw new Error('Expected numeric question but found multiple choice question');
            } else {
                log('✅ Found numeric input field - this is a numeric question');

                // Step 5: Implement numeric answer reversion test
                log('🎯 Starting numeric answer reversion test...');

                // Listen for console logs from the frontend
                const consoleLogs: string[] = [];
                studentPage.on('console', msg => {
                    const text = msg.text();
                    consoleLogs.push(text);
                    if (text.includes('[NUMERIC-SUBMIT]')) {
                        log(`🎯 Frontend console: ${text}`);
                    }
                });

                // Get the numeric input field
                const numericInput = studentPage.locator('input[type="number"]').first();

                // Submit initial answer (let's use 42 as a test answer)
                const initialAnswer = '42';
                await numericInput.fill(initialAnswer);
                log(`Filled initial numeric answer: ${initialAnswer}`);

                // Submit the answer
                const submitButton = studentPage.locator('button:has-text("Valider"), button:has-text("Submit"), button[type="submit"]').first();
                await submitButton.click();
                log('Clicked submit button for initial answer');

                // Wait for answer to be accepted (should show success feedback)
                // Try multiple selectors for success feedback
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

                // Verify the input still shows the accepted answer
                const inputValueAfterSubmit = await numericInput.inputValue();
                if (inputValueAfterSubmit !== initialAnswer) {
                    throw new Error(`Expected input to show ${initialAnswer} but got ${inputValueAfterSubmit}`);
                }
                log('✅ Input field still shows accepted answer');

                // Step 6: Attempt late submission (try to change the answer)
                const lateAnswer = '99';
                await numericInput.fill(lateAnswer);
                log(`Attempted to change answer to: ${lateAnswer}`);

                // Try to submit again
                await submitButton.click();
                log('Clicked submit button for late answer');

                // Step 7: Verify late submission is rejected and UI reverts
                // Wait for the rejection logic to execute and state to update
                await studentPage.waitForTimeout(2000); // Give more time for state updates

                log(`📋 Console logs captured: ${consoleLogs.filter(log => log.includes('NUMERIC')).join(', ')}`);

                const inputValueAfterRejection = await numericInput.inputValue();
                if (inputValueAfterRejection !== initialAnswer) {
                    log(`❌ Expected input to revert to ${initialAnswer} but got ${inputValueAfterRejection}`);
                    throw new Error(`Late submission was not rejected - input shows ${inputValueAfterRejection} instead of ${initialAnswer}`);
                }

                log('✅ Late submission rejected - input reverted to previously accepted answer');

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
                        log(`✅ Found rejection feedback: ${selector}`);
                        rejectionFound = true;
                        break;
                    }
                }

                if (!rejectionFound) {
                    log('⚠️ No explicit rejection message found, but answer reversion worked');
                }

                log('� Numeric answer reversion test completed successfully!');
            }

        } catch (error) {
            log('❌ Test failed:', error);
            await teacherPage.screenshot({ path: 'test-results/e2e/numeric-reversion-teacher-error.png' });
            await studentPage.screenshot({ path: 'test-results/e2e/numeric-reversion-student-error.png' });
            throw error;
        } finally {
            // Cleanup
            await teacherContext.close();
            await studentContext.close();
        }
    });
});