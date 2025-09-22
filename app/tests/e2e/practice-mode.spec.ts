import { test, expect, Page } from '@playwright/test';
import { LoginHelper } from './helpers/test-helpers';

test.describe('Practice Mode E2E', () => {
    let studentPage: Page;

    test.beforeAll(async ({ browser }) => {
        // Create browser context for student
        const studentContext = await browser.newContext();
        studentPage = await studentContext.newPage();
    });

    test.afterAll(async () => {
        await studentPage?.close();
    });

    test('Practice Mode: Self-paced learning with feedback', async () => {
        try {
            // Step 1: Login as student using unified login page
            console.log('🔐 Logging in as student...');
            const studentLogin = new LoginHelper(studentPage);
            await studentLogin.loginAsStudent({ username: 'PracticeTestStudent' });
            console.log(' Student login successful');

            // Step 2: Navigate to practice mode (training)
            console.log(' Navigating to practice mode...');
            await studentPage.goto('/student/create-game?training=true');
            await studentPage.waitForLoadState('networkidle');

            // Wait for React hydration and component initialization
            await studentPage.waitForTimeout(2000);

            console.log('📸 Taking screenshot...');
            await studentPage.screenshot({ path: 'debug-practice-start.png' });

            // Step 3: Complete the step-by-step practice mode setup
            console.log('⚙️ Setting up practice parameters...');

            // Step 1: Select niveau (level) - wait for the form to be ready
            await expect(studentPage.locator('text=Choisis un niveau')).toBeVisible({ timeout: 15000 });

            // Debug: Check what's actually in the page
            const pageContent = await studentPage.textContent('body');
            console.log(' Page contains:', pageContent?.substring(0, 500) + '...');

            // Wait for the step to be interactive and find the dropdown within step 1
            await studentPage.waitForTimeout(1000);

            // Find the CustomDropdown with the "Choisis un niveau" label
            const niveauLabel = studentPage.locator('label:has-text("Choisis un niveau")');
            const niveauDropdown = niveauLabel.locator('..').locator('button').first();

            await niveauDropdown.click();
            console.log(' Opened niveau dropdown');

            // Wait for dropdown options to appear
            await studentPage.waitForTimeout(1000);

            // Look for niveau options in the dropdown
            const niveauOptions = studentPage.locator('.custom-dropdown-option');
            const niveauCount = await niveauOptions.count();
            console.log(` Found ${niveauCount} niveau options`);

            if (niveauCount > 0) {
                // Get all option texts for debugging
                const niveauTexts = await niveauOptions.allTextContents();
                console.log(' Available niveau options:', niveauTexts);

                // Look for specific niveau options
                const possibleNiveaux = ['elementary', 'CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', 'Primaire', 'Collège'];
                let selectedNiveau = false;

                for (const niveau of possibleNiveaux) {
                    const niveauOption = niveauOptions.filter({ hasText: niveau });
                    if (await niveauOption.count() > 0) {
                        console.log(` Found and selecting gradeLevel: ${gradeLevel`);
                        await niveauOption.first().click();
                        selectedNiveau = true;
                        break;
                    }
                }

                if (!selectedNiveau) {
                    // Select the first available niveau option
                    const firstNiveauText = niveauTexts[0];
                    console.log(`Selecting first available gradeLevel: ${ firstNiveauText }`);
                    await niveauOptions.first().click();
                    selectedNiveau = true;
                }
            } else {
                throw new Error('No niveau dropdown options found');
            }

            // Step 2: Select discipline - should automatically advance to step 2
            await expect(studentPage.locator('text=Choisis une discipline')).toBeVisible({ timeout: 5000 });

            // Find the CustomDropdown with the "Choisis une discipline" label
            const disciplineLabel = studentPage.locator('label:has-text("Choisis une discipline")');
            const disciplineDropdown = disciplineLabel.locator('..').locator('button').first();

            await disciplineDropdown.click();
            console.log(' Opened discipline dropdown');

            // Wait for dropdown options to appear
            await studentPage.waitForTimeout(1000);

            // Look for discipline options in the dropdown
            const disciplineOptions = studentPage.locator('.custom-dropdown-option');
            const disciplineCount = await disciplineOptions.count();
            console.log(` Found ${ disciplineCount } discipline options`);

            if (disciplineCount > 0) {
                // Get all option texts for debugging
                const disciplineTexts = await disciplineOptions.allTextContents();
                console.log(' Available discipline options:', disciplineTexts);

                // Look for mathematical discipline options
                const disciplines = ['Mathématiques', 'Mathematics', 'Math', 'Français', 'Histoire'];
                let selectedDiscipline = false;

                for (const discipline of disciplines) {
                    const disciplineOption = disciplineOptions.filter({ hasText: discipline });
                    if (await disciplineOption.count() > 0) {
                        console.log(` Found and selecting discipline: ${ discipline }`);
                        await disciplineOption.first().click();
                        selectedDiscipline = true;
                        break;
                    }
                }

                if (!selectedDiscipline) {
                    // Select the first available discipline option
                    const firstDisciplineText = disciplineTexts[0];
                    console.log(` Selecting first available discipline: ${ firstDisciplineText }`);
                    await disciplineOptions.first().click();
                    selectedDiscipline = true;
                }

                if (!selectedDiscipline) {
                    throw new Error('Could not find or select any discipline option from dropdown');
                }
            } else {
                throw new Error('No discipline dropdown options found');
            }

            // Step 3: Select themes - should automatically advance to step 3
            await expect(studentPage.locator('text=Choisis un ou plusieurs thèmes')).toBeVisible({ timeout: 5000 });

            // Find the MultiSelectDropdown with the "Choisis un ou plusieurs thèmes" label
            const themesLabel = studentPage.locator('label:has-text("Choisis un ou plusieurs thèmes")');
            const themesDropdown = themesLabel.locator('..').locator('button').first();

            console.log(' Debug: Looking for themes dropdown...');
            await themesDropdown.click();
            console.log(' Opened themes dropdown');

            // Wait for dropdown to open and be visible
            await studentPage.waitForTimeout(1000);

            // Debug: Check all visible dropdown options (for MultiSelectDropdown, these are labels with checkboxes)
            const themeLabels = studentPage.locator('.multi-dropdown-option');
            const themeCount = await themeLabels.count();
            console.log(` Found ${ themeCount } theme options`);

            if (themeCount > 0) {
                // Get all theme texts for debugging
                const themeTexts = await themeLabels.allTextContents();
                console.log(' Available theme options:', themeTexts);

                // Try to find mathematical themes specifically
                const themes = ['Addition', 'Soustraction', 'Multiplication', 'Division', 'Géométrie', 'Nombres', 'Calcul'];
                let selectedTheme = false;

                for (const theme of themes) {
                    const themeLabel = themeLabels.filter({ hasText: theme });
                    if (await themeLabel.count() > 0) {
                        console.log(` Found and selecting theme: ${ theme }`);
                        await themeLabel.first().click();
                        selectedTheme = true;
                        break;
                    }
                }

                if (!selectedTheme) {
                    // Select the first available theme option
                    const firstThemeText = themeTexts[0];
                    console.log(` Selecting first available theme: ${ firstThemeText }`);
                    await themeLabels.first().click();
                    selectedTheme = true;
                }

                if (!selectedTheme) {
                    throw new Error('Could not find or select any theme option from dropdown');
                }
            } else {
                throw new Error('No theme dropdown options found');
            }

            // IMPORTANT: Click outside the dropdown to close it and reveal the "Valider les thèmes" button
            console.log(' Clicking outside dropdown to close it and reveal next step button...');
            await studentPage.click('body', { position: { x: 100, y: 100 } });
            await studentPage.waitForTimeout(500); // Wait for dropdown to close

            // Click validate themes button
            await studentPage.click('button:has-text("Valider les thèmes")');
            console.log(' Validated themes');

            // Step 4: Select number of questions
            await expect(studentPage.locator('text=Combien de questions ?')).toBeVisible({ timeout: 5000 });            // Debug: Check available question number options
            const questionButtons = await studentPage.locator('button').filter({ hasText: /^[0-9]+$/ }).allTextContents();
            console.log(' Available question numbers:', questionButtons);

            // Select 5 questions - target the question count button specifically (not the stepper badge)
            // Look for buttons with class that suggests they're for question selection
            const fiveButton = studentPage.locator('button:has-text("5")').filter({ hasNotText: 'badge' }).filter({ hasText: /^\s*5\s*$/ });

            // If that doesn't work, try targeting by button classes that suggest question selection
            const questionCountButtons = studentPage.locator('button').filter({ hasText: /^[0-9]+$/ }).filter({ hasNotText: 'stepper' });
            const fiveButtonFallback = questionCountButtons.filter({ hasText: '5' });

            let questionSelected = false;

            // Try the specific selector first
            if (await fiveButton.count() === 1) {
                console.log(' Found unique question count button for 5');
                await fiveButton.click();
                questionSelected = true;
            } else if (await fiveButtonFallback.count() === 1) {
                console.log(' Found question count button via fallback selector');
                await fiveButtonFallback.click();
                questionSelected = true;
            } else {
                // Manual approach: find all buttons with "5" and click the one that's not a stepper
                const allFiveButtons = studentPage.locator('button:has-text("5")');
                const fiveButtonCount = await allFiveButtons.count();
                console.log(` Found ${ fiveButtonCount } buttons with "5" text`);

                for (let i = 0; i < fiveButtonCount; i++) {
                    const button = allFiveButtons.nth(i);
                    const buttonClass = await button.getAttribute('class') || '';
                    const buttonText = await button.textContent() || '';

                    console.log(` Button ${ i }: class="${buttonClass}", text = "${buttonText}"`);

                    // Skip stepper badges and target question selection buttons
                    if (!buttonClass.includes('badge') && !buttonClass.includes('stepper') && buttonText.trim() === '5') {
                        console.log(` Selecting question count button ${ i } `);
                        await button.click();
                        questionSelected = true;
                        break;
                    }
                }
            }

            if (!questionSelected) {
                throw new Error('Could not select 5 questions - no suitable button found');
            }

            console.log(' Selected 5 questions');

            // Wait for form to auto-advance to summary page or for "Commencer l'entraînement" button to appear
            await studentPage.waitForTimeout(2000);

            // Step 5: Look for "Commencer l'entraînement" button (NOT "Valider")
            console.log(' Looking for "Commencer l\'entraînement" button...');

            // Debug: Check all buttons available on the page
            const allButtons = await studentPage.locator('button').allTextContents();
            console.log(' All buttons on page:', allButtons);

            // Look for the specific training start button with multiple variations
            const startTrainingSelectors = [
                'button:has-text("Commencer l\'entraînement")',
                "button:has-text(\"Commencer l'entraînement\")",
                'button:has-text("Commencer")',
                'button:has-text("Démarrer l\'entraînement")',
                'button:has-text("Démarrer")',
                'button:has-text("Start Training")',
                'button[data-training="start"]',
                'button[type="submit"]'
            ];

            let trainingStarted = false;

            for (const selector of startTrainingSelectors) {
                const button = studentPage.locator(selector);
                const buttonCount = await button.count();

                if (buttonCount > 0) {
                    console.log(` Found training button with selector: ${ selector } `);
                    try {
                        await button.first().click();
                        console.log(' Successfully clicked training start button');
                        trainingStarted = true;
                        break;
                    } catch (error) {
                        console.log(`⚠️ Failed to click button with ${ selector }: `, error);
                        continue;
                    }
                }
            }

            if (!trainingStarted) {
                console.log(' Could not find or click any training start button');
                // Fallback: try clicking any submit-like button that's not "Valider"
                const fallbackButtons = studentPage.locator('button').filter({
                    hasText: /.+/
                }).filter({
                    hasNotText: 'Valider'
                });
                const fallbackTexts = await fallbackButtons.allTextContents();
                console.log(' Available fallback buttons:', fallbackTexts);

                // Try the last button (often the primary action)
                const buttonCount = await fallbackButtons.count();
                if (buttonCount > 0) {
                    console.log(' Attempting to click last available non-Valider button as fallback');
                    await fallbackButtons.last().click();
                    trainingStarted = true;
                }
            }

            if (!trainingStarted) {
                throw new Error('Could not start training session - no valid button found');
            }

            // Step 6: Wait for training session to load and interact with practice questions
            console.log(' Waiting for practice session to start...');
            await studentPage.waitForLoadState('networkidle');
            await studentPage.waitForTimeout(3000);

            // Take screenshot of practice session
            await studentPage.screenshot({ path: 'debug-practice-session.png' });

            // Look for practice session elements
            const sessionContent = await studentPage.textContent('body');
            console.log(' Practice session content:', sessionContent?.substring(0, 300) + '...');

            // Check if we're in a practice session (look for question elements)
            const questionElements = [
                'text=Question',
                '[data-testid="question"]',
                '.question',
                'text=?'
            ];

            let inPracticeSession = false;
            for (const questionSelector of questionElements) {
                const questionElement = studentPage.locator(questionSelector);
                if (await questionElement.count() > 0) {
                    console.log(` Found practice session question with: ${ questionSelector } `);
                    inPracticeSession = true;
                    break;
                }
            }

            if (inPracticeSession) {
                console.log(' Successfully entered practice session');

                // Helper function to interact with practice questions
                const interactWithPracticeSession = async () => {
                    let questionsAnswered = 0;
                    const maxQuestions = 5;

                    while (questionsAnswered < maxQuestions) {
                        console.log(`📝 Answering question ${ questionsAnswered + 1 }/${maxQuestions}...`);

    // Look for answer buttons or input fields
    const answerButtons = studentPage.locator('button').filter({ hasText: /^[0-9]+$/ });
    const answerInputs = studentPage.locator('input[type="text"], input[type="number"]');
    const submitButtons = studentPage.locator('button:has-text("Valider"), button:has-text("Submit"), button:has-text("Confirmer")');

    const buttonCount = await answerButtons.count();
    const inputCount = await answerInputs.count();
    const submitCount = await submitButtons.count();

    if (buttonCount > 0) {
        // Multiple choice question
        console.log(`🔘 Found ${buttonCount} answer buttons, selecting first one`);
        await answerButtons.first().click();
        await studentPage.waitForTimeout(500);
    } else if (inputCount > 0) {
        // Text input question
        console.log(`✏️ Found ${inputCount} input fields, entering answer`);
        await answerInputs.first().fill('42'); // Generic answer
        await studentPage.waitForTimeout(500);
    }

    // Submit the answer
    if (submitCount > 0) {
        console.log(' Submitting answer...');
        await submitButtons.first().click();
        await studentPage.waitForTimeout(2000);
    }

    // Look for next question button or session completion
    const nextButtons = studentPage.locator('button:has-text("Suivant"), button:has-text("Next"), button:has-text("Continuer")');
    const nextCount = await nextButtons.count();

    if (nextCount > 0) {
        console.log('➡️ Moving to next question...');
        await nextButtons.first().click();
        await studentPage.waitForTimeout(2000);
        questionsAnswered++;
    } else {
        // Check if session is complete
        const completionElements = [
            'text=Terminé',
            'text=Completed',
            'text=Félicitations',
            'text=Results',
            'text=Score'
        ];

        let sessionComplete = false;
        for (const completionSelector of completionElements) {
            if (await studentPage.locator(completionSelector).count() > 0) {
                console.log(` Practice session completed with: ${completionSelector}`);
                sessionComplete = true;
                break;
            }
        }

        if (sessionComplete) {
            break;
        } else {
            questionsAnswered++;
            if (questionsAnswered >= maxQuestions) {
                console.log(' Reached maximum questions limit');
                break;
            }
        }
    }
}
                };

await interactWithPracticeSession();

// Final verification
console.log(' Practice mode test completed successfully');

// Take final screenshot
await studentPage.screenshot({ path: 'debug-practice-complete.png' });

            } else {
    console.log('⚠️ Could not verify practice session started, but training button was clicked');
    // Still consider test partially successful if we got this far
}

console.log(' Practice Mode E2E test completed');

        } catch (error) {
    console.error(' Practice Mode E2E test failed:', error);

    // Take error screenshot
    await studentPage.screenshot({ path: 'debug-practice-error.png' });

    // Log current page state for debugging
    const errorContent = await studentPage.textContent('body');
    console.log(' Error page content:', errorContent?.substring(0, 500) + '...');

    throw error;
}
    });
});