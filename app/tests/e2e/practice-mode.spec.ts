import { test, expect, Page } from '@playwright/test';
import { LoginHelper, TestDataHelper } from './helpers/test-helpers';

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
        test.setTimeout(45000); // 45 seconds for practice mode test
        try {
            const dataHelper = new TestDataHelper(studentPage);

            // Step 1: Create student account via API
            const studentData = dataHelper.generateTestData('practice_student');
            const student = await dataHelper.createStudent({
                username: studentData.username,
                email: studentData.email,
                password: studentData.password
            });

            // Step 2: Login via backend API and set cookie
            const loginResp = await studentPage.request.post('http://localhost:3007/api/v1/auth/login', {
                data: {
                    email: studentData.email,
                    password: studentData.password,
                    role: 'STUDENT'
                }
            });

            if (!loginResp.ok()) {
                throw new Error(`Student login failed: ${loginResp.status()}`);
            }

            const loginData = await loginResp.json();
            const authToken = loginData.authToken || loginData.token;

            // Step 3: Set cookie
            await studentPage.context().addCookies([{
                name: 'authToken',
                value: authToken,
                domain: 'localhost',
                path: '/',
                httpOnly: true,
                secure: false,
                sameSite: 'Lax'
            }]);

            console.log('✅ Student authenticated via API');

            // Step 4: Navigate to practice mode (training)
            console.log('📚 Navigating to practice mode...');
            await studentPage.goto('/student/create-game?training=true');
            await studentPage.waitForLoadState('networkidle');

            // Wait for React hydration and component initialization
            await studentPage.waitForTimeout(2000);

            console.log('📸 Taking screenshot...');
            await studentPage.screenshot({ path: 'test-results/e2e/debug-practice-start.png' });

            // Step 3: Complete the step-by-step practice mode setup
            console.log('⚙️ Setting up practice parameters...');

            // Step 1: Select niveau (level) - wait for the form to be ready
            await expect(studentPage.locator('text=Choisis un niveau')).toBeVisible({ timeout: 15000 });

            // Wait for filters to load - the API call happens asynchronously
            console.log('⏳ Waiting for filters to load...');
            await studentPage.waitForTimeout(3000); // Give time for API call to complete
            console.log('✅ Filters should be loaded now');

            // Find the CustomDropdown with the "Choisis un niveau" label
            const niveauLabel = studentPage.locator('label:has-text("Choisis un niveau")');
            const niveauDropdown = niveauLabel.locator('..').locator('button').first();

            await niveauDropdown.click();
            console.log(' Opened niveau dropdown');

            // Wait for dropdown options to appear - wait for at least one option
            await studentPage.locator('.enhanced-single-dropdown-option').first().waitFor({ timeout: 10000 });
            console.log(' Dropdown options are now visible');

            // Look for niveau options in the dropdown
            const niveauOptions = studentPage.locator('.enhanced-single-dropdown-option');
            const niveauCount = await niveauOptions.count();
            console.log(' Found ' + niveauCount + ' niveau options');

            if (niveauCount > 0) {
                // Get all option texts for debugging
                const niveauTexts = await niveauOptions.allTextContents();
                console.log(' Available niveau options:', niveauTexts);

                // Select CP
                const cpOption = niveauOptions.filter({ hasText: 'CP' });
                if (await cpOption.count() > 0) {
                    console.log(' Found and selecting gradeLevel: CP');
                    await cpOption.first().click();
                } else {
                    // Select the first available niveau option
                    const firstNiveauText = niveauTexts[0];
                    console.log('Selecting first available gradeLevel: ' + firstNiveauText);
                    await niveauOptions.first().click();
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

            // Wait for dropdown options to appear - wait for at least one option
            await studentPage.locator('.enhanced-single-dropdown-option').first().waitFor({ timeout: 10000 });
            console.log(' Discipline dropdown options are now visible');

            // Look for discipline options in the dropdown
            const disciplineOptions = studentPage.locator('.enhanced-single-dropdown-option');
            const disciplineCount = await disciplineOptions.count();
            console.log(' Found ' + disciplineCount + ' discipline options');

            if (disciplineCount > 0) {
                // Get all option texts for debugging
                const disciplineTexts = await disciplineOptions.allTextContents();
                console.log(' Available discipline options:', disciplineTexts);

                // Select Mathématiques
                const mathOption = disciplineOptions.filter({ hasText: 'Mathématiques' });
                if (await mathOption.count() > 0) {
                    console.log(' Found and selecting discipline: Mathématiques');
                    await mathOption.first().click();
                } else {
                    // Select the first available discipline
                    const firstDisciplineText = disciplineTexts[0];
                    console.log('Selecting first available discipline: ' + firstDisciplineText);
                    await disciplineOptions.first().click();
                }
            } else {
                throw new Error('No discipline dropdown options found');
            }

            // Step 3: Select themes - should automatically advance to step 3
            await expect(studentPage.locator('text=Choisis un ou plusieurs thèmes')).toBeVisible({ timeout: 5000 });

            // Find the MultiSelectDropdown with the "Choisis un ou plusieurs thèmes" label
            const themeLabel = studentPage.locator('label:has-text("Choisis un ou plusieurs thèmes")');
            const themeDropdown = themeLabel.locator('..').locator('button').first();

            await themeDropdown.click();
            console.log(' Opened themes dropdown');

            // Wait for dropdown options to appear
            await studentPage.waitForTimeout(1000);

            // Look for theme options in the dropdown
            const themeOptions = studentPage.locator('.custom-multiselect-option, input[type="checkbox"]');
            const themeCount = await themeOptions.count();
            console.log(' Found ' + themeCount + ' theme options');

            if (themeCount > 0) {
                // Get all option texts for debugging
                const themeTexts = await themeOptions.allTextContents();
                console.log(' Available theme options:', themeTexts);

                // Select Géométrie
                const geometryOption = themeOptions.filter({ hasText: 'Géométrie' });
                if (await geometryOption.count() > 0) {
                    console.log(' Found and selecting theme: Géométrie');
                    await geometryOption.first().click();
                } else {
                    // Select the first available theme
                    console.log('Selecting first available theme');
                    await themeOptions.first().click();
                }
            } else {
                throw new Error('No theme dropdown options found');
            }

            // IMPORTANT: Click outside the dropdown to close it and reveal the "Valider" button
            console.log(' Clicking outside dropdown to close it and reveal validation button...');
            await studentPage.click('body', { position: { x: 100, y: 100 } });
            await studentPage.waitForTimeout(500); // Wait for dropdown to close

            // Click the Valider button to advance to step 4 (number of questions)
            const step3ValiderButton = studentPage.locator('button:has-text("Valider")').first();
            await step3ValiderButton.click();
            console.log(' Advanced to step 4 (number of questions)');

            // Step 4: Select number of questions
            await expect(studentPage.locator('text=Combien de questions ?')).toBeVisible({ timeout: 5000 });

            // Select 5 questions (default/first option)
            const questionButtons = studentPage.locator('button').filter({ hasText: '5' });
            await questionButtons.first().click();
            console.log(' Selected 5 questions');

            // Wait a moment for any automatic advancement
            await studentPage.waitForTimeout(1000);

            // Check if we're already in the confirmation step with Démarrer button
            const demarrerButton = studentPage.locator('button:has-text("Démarrer")');
            if (await demarrerButton.count() > 0) {
                console.log(' Démarrer button is already available - proceeding to confirmation step');
            } else {
                // If not, click the Valider button to advance to confirmation step
                const step4ValiderButtons = studentPage.locator('button:has-text("Valider")');
                const step4ValiderCount = await step4ValiderButtons.count();
                console.log(' Found', step4ValiderCount, 'Valider buttons after question selection');

                if (step4ValiderCount > 0) {
                    console.log(' Clicking step 4 Valider button...');
                    await step4ValiderButtons.first().click();
                    console.log(' Step 4 Valider button clicked');
                } else {
                    console.log(' No Valider button found after question selection');
                    throw new Error('Could not find Valider button in step 4');
                }

                // Wait for confirmation step
                await expect(studentPage.locator('text=Résumé')).toBeVisible({ timeout: 5000 });
                console.log(' Reached confirmation step');
            }

            // Debug: Check available buttons after reaching confirmation
            const allButtonsOnPage = await studentPage.locator('button').allTextContents();
            console.log(' Available buttons after confirmation:', allButtonsOnPage);

            // Find and click the Démarrer button in the confirmation step
            const finalDemarrerButton = studentPage.locator('button:has-text("Démarrer")');

            if (await finalDemarrerButton.count() > 0) {
                console.log(' Found Démarrer button, checking if enabled...');
                const isEnabled = await finalDemarrerButton.isEnabled();
                console.log(' Démarrer button is enabled:', isEnabled);

                if (!isEnabled) {
                    console.log(' Button is disabled, checking for validation errors...');
                    // Check for any error messages
                    const errorMessages = await studentPage.locator('.text-error, .text-red-500, [class*="error"]').allTextContents();
                    console.log(' Error messages found:', errorMessages);
                    throw new Error('Démarrer button is disabled');
                }

                console.log(' Clicking Démarrer button...');
                await finalDemarrerButton.click();
                console.log(' Démarrer button clicked - checking if loading state is triggered...');

                // Check if the button text changes to "Création..." indicating the API call started
                try {
                    await expect(studentPage.locator('button:has-text("Création...")')).toBeVisible({ timeout: 2000 });
                    console.log('✅ Button click triggered loading state');
                } catch (e) {
                    console.log('❌ Button click did not trigger loading state');
                    // Check what the button text is now
                    const buttonText = await finalDemarrerButton.textContent();
                    console.log(' Button text after click:', buttonText);
                }
            } else {
                console.log(' No Démarrer button found');
                throw new Error('Could not find Démarrer button in confirmation step');
            }

            // Wait for redirect to practice page
            await studentPage.waitForURL(/\/student\/practice\/.*/, { timeout: 10000 });
            console.log(' Redirected to practice page successfully');

            // Verify we're on the practice page
            await expect(studentPage.locator('text=Entraînement')).toBeVisible({ timeout: 5000 });
            console.log('✅ Practice page loaded successfully');

        } catch (error) {
            console.error('❌ Practice Mode test failed:', error);

            // Take error screenshot
            try {
                await studentPage.screenshot({ path: 'test-results/e2e/debug-practice-error.png' });
            } catch (screenshotError) {
                console.error('Failed to take error screenshot:', screenshotError);
            }

            // Log current page state for debugging
            try {
                const errorContent = await studentPage.textContent('body');
                console.log(' Error page content:', errorContent?.substring(0, 500) + '...');
            } catch (contentError) {
                console.error('Failed to get page content:', contentError);
            }

            throw error;
        }
    });
});
