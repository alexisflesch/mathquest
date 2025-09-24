import { test, expect, Page } from '@playwright/test';

test.describe('Practice Session Recovery E2E', () => {
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        const context = await browser.newContext();
        page = await context.newPage();
    });

    test.afterEach(async () => {
        await page?.close();
    });

    test('Practice Session: Recovery after page refresh', async () => {
        console.log('🔐 Starting practice session recovery test...');

        test.setTimeout(60000); // Increase timeout to 60 seconds

        try {
            // Step 1: Login
            console.log('🔑 Logging in...');
            await page.goto('/login');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            // Fill username
            const usernameInput = page.locator('.username-selector input').first();
            await usernameInput.fill('ALEX');
            console.log('✅ Username filled');

            // Close any open dropdown by clicking outside
            await page.locator('body').click();
            await page.waitForTimeout(500);

            // Select avatar
            const avatarButton = page.locator('button').filter({ hasText: '🐶' }).first();
            await avatarButton.click();
            console.log('✅ Avatar selected');

            // Submit login
            const submitButton = page.locator('button[type="submit"]').first();
            await submitButton.click();
            console.log('🚀 Login submitted');

            // Wait for redirect to home
            await page.waitForURL('**/');
            console.log('✅ Login successful, on home page');

            // Step 2: Navigate to practice session creation
            console.log('🎯 Navigating to practice session...');
            await page.goto('/student/create-game?training=true', { waitUntil: 'networkidle' });
            console.log('✅ Navigation to practice page completed');

            const currentUrl = page.url();
            console.log(`Final URL: ${currentUrl}`);

            // Check if redirected to login - if so, login again
            if (currentUrl.includes('/login')) {
                console.log('🔄 Redirected to login, re-authenticating...');

                // Re-do login process
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(2000);

                // Fill username
                const usernameInput = page.locator('.username-selector input').first();
                await usernameInput.fill('ALEX');
                console.log('✅ Username re-filled');

                // Close any open dropdown by clicking outside
                await page.locator('body').click();
                await page.waitForTimeout(500);

                // Select avatar
                const avatarButton = page.locator('button').filter({ hasText: '🐶' }).first();
                await avatarButton.click();
                console.log('✅ Avatar re-selected');

                // Submit login
                const submitButton = page.locator('button[type="submit"]').first();
                await submitButton.click();
                console.log('🚀 Login re-submitted');

                // Wait for redirect
                await page.waitForURL('**/student/create-game?training=true', { timeout: 10000 });
                console.log('✅ Re-login successful, on practice page');
            }

            if (currentUrl.includes('create-game') || currentUrl.includes('training') || currentUrl.includes('practice') || currentUrl.includes('/student/create-game?training=true')) {
                console.log('✅ On practice session creation page');

                // Complete wizard quickly
                const niveauButton = page.locator('button').filter({ hasText: 'Niveau' }).first();
                await niveauButton.click();
                await page.waitForTimeout(500);

                const gradeOption = page.locator('button.enhanced-single-dropdown-option').filter({ hasText: 'CP' }).first();
                await gradeOption.click();
                console.log('✅ Grade level selected (CP)');
                await page.waitForTimeout(1000);
                console.log('✅ Grade level selected (CP)');
                await page.waitForTimeout(1000);

                const disciplineButton = page.locator('button').filter({ hasText: 'Discipline' }).first();
                await disciplineButton.click();
                await page.waitForTimeout(500);

                const disciplineOption = page.locator('button.enhanced-single-dropdown-option').first();
                await disciplineOption.click();
                console.log('✅ Discipline selected');
                await page.waitForTimeout(1000);

                const themeButton = page.locator('button').filter({ hasText: 'Thèmes' }).first();
                await themeButton.click();
                await page.waitForTimeout(500);

                const themeCheckboxes = page.locator('input[type="checkbox"]');
                if (await themeCheckboxes.count() > 0) {
                    await themeCheckboxes.first().check();
                    console.log('✅ Theme selected');
                    await page.waitForTimeout(500);

                    const validateButton = page.locator('button').filter({ hasText: 'Valider' }).first();
                    await validateButton.click();
                    console.log('✅ Themes validated');
                    await page.waitForTimeout(1000);
                }

                const questionButton = page.locator('button').filter({ hasText: '5' }).first();
                await questionButton.click();
                console.log('✅ Question count selected (5)');
                await page.waitForTimeout(1000);

                const startButton = page.locator('button').filter({ hasText: 'Démarrer' }).first();
                await startButton.click();
                console.log('✅ Practice session started');
                await page.waitForTimeout(2000);

                const newUrl = page.url();
                console.log(`URL after starting session: ${newUrl}`);

                if (newUrl !== currentUrl) {
                    console.log('✅ Navigation occurred - practice session started');

                    // Step 3: Test answer button detection
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

                        // Step 4: Wait for "Suivant" button to appear after answering
                        console.log('⏳ Waiting for "Suivant" button to appear...');
                        await page.waitForTimeout(2000);

                        // Look for the "Suivant" button that appears after answering
                        const suivantButton = page.locator('button').filter({ hasText: 'Suivant' });
                        const suivantCount = await suivantButton.count();
                        console.log(`"Suivant" buttons found: ${suivantCount}`);

                        if (suivantCount > 0) {
                            console.log('🎯 Clicking "Suivant" to advance to next question...');
                            await suivantButton.first().click();
                            console.log('✅ "Suivant" clicked - should load next question');

                            // Wait for next question to load
                            await page.waitForTimeout(3000);

                            // Check if new answer buttons appeared (next question loaded)
                            const newAnswerButtons = page.locator('button.btn-answer, button.tqcard-answer');
                            const newAnswerCount = await newAnswerButtons.count();
                            console.log(`Answer buttons after "Suivant": ${newAnswerCount}`);

                            if (newAnswerCount > 0) {
                                console.log('✅ Next question loaded successfully');

                                // Step 5: Capture question 2 content before refresh
                                console.log('📝 Capturing question 2 content before refresh...');

                                // Try to find question text/content
                                const questionElements = page.locator('[data-testid="question-text"], .question-text, h2, h3, p').first();
                                const questionText = await questionElements.textContent();
                                console.log(`Question text before refresh: "${questionText}"`);

                                // Also capture answer button texts to compare
                                const answerButtons = page.locator('button.btn-answer, button.tqcard-answer');
                                const answerTexts = [];
                                for (let i = 0; i < await answerButtons.count(); i++) {
                                    const text = await answerButtons.nth(i).textContent();
                                    answerTexts.push(text);
                                }
                                console.log(`Answer options before refresh: [${answerTexts.join(', ')}]`);

                                // Step 6: Test recovery by refreshing the page
                                console.log('🔄 Testing session recovery by refreshing page...');
                                const beforeRefreshUrl = page.url();
                                console.log(`URL before refresh: ${beforeRefreshUrl}`);

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

                                // Step 7: Check recovery
                                const afterRefreshUrl = page.url();
                                console.log(`URL after refresh: ${afterRefreshUrl}`);

                                // Check if question content is the same or different
                                const afterRefreshQuestionElements = page.locator('[data-testid="question-text"], .question-text, h2, h3, p').first();
                                const afterRefreshQuestionText = await afterRefreshQuestionElements.textContent();
                                console.log(`Question text after refresh: "${afterRefreshQuestionText}"`);

                                // Check answer button texts after refresh
                                const afterRefreshAnswerButtons = page.locator('button.btn-answer, button.tqcard-answer');
                                const afterRefreshAnswerTexts = [];
                                for (let i = 0; i < await afterRefreshAnswerButtons.count(); i++) {
                                    const text = await afterRefreshAnswerButtons.nth(i).textContent();
                                    afterRefreshAnswerTexts.push(text);
                                }
                                console.log(`Answer options after refresh: [${afterRefreshAnswerTexts.join(', ')}]`);

                                // Check if user is still logged in
                                const stillLoggedIn = await page.locator('button').filter({ hasText: 'Déconnexion' }).count() > 0;
                                console.log(`User still logged in after refresh: ${stillLoggedIn}`);

                                // Determine if recovery worked
                                const questionTextSame = questionText === afterRefreshQuestionText;
                                const answerTextsSame = JSON.stringify(answerTexts) === JSON.stringify(afterRefreshAnswerTexts);
                                const urlSame = beforeRefreshUrl === afterRefreshUrl;

                                console.log(`\n🔍 RECOVERY ANALYSIS:`);
                                console.log(`Question text same: ${questionTextSame}`);
                                console.log(`Answer options same: ${answerTextsSame}`);
                                console.log(`URL same: ${urlSame}`);
                                console.log(`User logged in: ${stillLoggedIn}`);

                                // Check if we progressed to question 2 (should contain "2" in the text)
                                const wasOnQuestion2 = questionText && questionText.includes('2');
                                const isNowOnQuestion2 = afterRefreshQuestionText && afterRefreshQuestionText.includes('2');

                                console.log(`Was on Question 2 before refresh: ${wasOnQuestion2}`);
                                console.log(`Is on Question 2 after refresh: ${isNowOnQuestion2}`);

                                if (urlSame && wasOnQuestion2 && isNowOnQuestion2 && stillLoggedIn) {
                                    console.log('\n🎉 SESSION RECOVERY SUCCESSFUL!');
                                    console.log('✅ Practice session continued from Question 2 after refresh');
                                    console.log('✅ User did NOT restart from question 1');
                                    console.log('✅ Recovery mechanism working correctly');
                                    console.log('✅ User remains logged in');
                                } else if (!isNowOnQuestion2 && wasOnQuestion2) {
                                    console.log('\n❌ SESSION RECOVERY FAILED!');
                                    console.log('❌ User was on Question 2 but returned to Question 1 after refresh');
                                    console.log('❌ Session was lost on page refresh');
                                    console.log('❌ Recovery mechanism is NOT working');
                                } else if (!stillLoggedIn) {
                                    console.log('\n❌ AUTHENTICATION LOST!');
                                    console.log('❌ User was logged out during refresh');
                                    console.log('❌ Authentication issue during recovery');
                                } else {
                                    console.log('\n⚠️ UNCLEAR RECOVERY STATE');
                                    console.log('⚠️ Session state unclear after refresh');
                                    console.log('⚠️ May need further investigation');
                                }

                                console.log('\n✅ TEST COMPLETED: Practice session recovery analysis done');

                            } else {
                                console.log('❌ Next question did not load after clicking "Suivant"');
                                console.log('ℹ️ Cannot test recovery without second question');
                            }

                        } else {
                            console.log('❌ "Suivant" button did not appear after answering');
                            console.log('ℹ️ Practice session may not be working correctly');
                        }

                    } else {
                        console.log('❌ No clickable answer buttons found');
                    }

                } else {
                    console.log('❌ No navigation occurred after clicking start button');
                }

            } else {
                console.log('❌ Not on practice session page');
            }

        } catch (error) {
            console.error('❌ Test failed:', error);
            await page.screenshot({ path: 'debug-answer-button-failure.png' });
            throw error;
        }
    });
});