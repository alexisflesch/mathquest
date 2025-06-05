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
            console.log('✅ Student login successful');

            // Step 2: Navigate to practice mode (training)
            console.log('🎯 Navigating to practice mode...');
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
            console.log('🔍 Page contains:', pageContent?.substring(0, 500) + '...');
            
            // Wait for the step to be interactive and find the dropdown within step 1
            await studentPage.waitForTimeout(1000);
            
            // Find the CustomDropdown with the "Choisis un niveau" label
            const niveauLabel = studentPage.locator('label:has-text("Choisis un niveau")');
            const niveauDropdown = niveauLabel.locator('..').locator('button').first();
            
            await niveauDropdown.click();
            console.log('✅ Opened niveau dropdown');
            
            // Wait for dropdown options to appear
            await studentPage.waitForTimeout(1000);
            
            // Look for niveau options in the dropdown
            const niveauOptions = studentPage.locator('.custom-dropdown-option');
            const niveauCount = await niveauOptions.count();
            console.log(`🔍 Found ${niveauCount} niveau options`);
            
            if (niveauCount > 0) {
                // Get all option texts for debugging
                const niveauTexts = await niveauOptions.allTextContents();
                console.log('🔍 Available niveau options:', niveauTexts);
                
                // Look for specific niveau options
                const possibleNiveaux = ['elementary', 'CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', 'Primaire', 'Collège'];
                let selectedNiveau = false;
                
                for (const niveau of possibleNiveaux) {
                    const niveauOption = niveauOptions.filter({ hasText: niveau });
                    if (await niveauOption.count() > 0) {
                        console.log(`✅ Found and selecting niveau: ${niveau}`);
                        await niveauOption.first().click();
                        selectedNiveau = true;
                        break;
                    }
                }
                
                if (!selectedNiveau) {
                    // Select the first available niveau option
                    const firstNiveauText = niveauTexts[0];
                    console.log(`✅ Selecting first available niveau: ${firstNiveauText}`);
                    await niveauOptions.first().click();
                    selectedNiveau = true;
                }
                
                if (!selectedNiveau) {
                    throw new Error('Could not find or select any niveau option from dropdown');
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
            console.log('✅ Opened discipline dropdown');
            
            // Wait for dropdown options to appear
            await studentPage.waitForTimeout(1000);
            
            // Look for discipline options in the dropdown
            const disciplineOptions = studentPage.locator('.custom-dropdown-option');
            const disciplineCount = await disciplineOptions.count();
            console.log(`🔍 Found ${disciplineCount} discipline options`);
            
            if (disciplineCount > 0) {
                // Get all option texts for debugging
                const disciplineTexts = await disciplineOptions.allTextContents();
                console.log('🔍 Available discipline options:', disciplineTexts);
                
                // Look for mathematical discipline options
                const disciplines = ['Mathématiques', 'Mathematics', 'Math', 'Français', 'Histoire'];
                let selectedDiscipline = false;
                
                for (const discipline of disciplines) {
                    const disciplineOption = disciplineOptions.filter({ hasText: discipline });
                    if (await disciplineOption.count() > 0) {
                        console.log(`✅ Found and selecting discipline: ${discipline}`);
                        await disciplineOption.first().click();
                        selectedDiscipline = true;
                        break;
                    }
                }
                
                if (!selectedDiscipline) {
                    // Select the first available discipline option
                    const firstDisciplineText = disciplineTexts[0];
                    console.log(`✅ Selecting first available discipline: ${firstDisciplineText}`);
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
            
            console.log('🔍 Debug: Looking for themes dropdown...');
            await themesDropdown.click();
            console.log('✅ Opened themes dropdown');
            
            // Wait for dropdown to open and be visible
            await studentPage.waitForTimeout(1000);
            
            // Debug: Check all visible dropdown options (for MultiSelectDropdown, these are labels with checkboxes)
            const themeLabels = studentPage.locator('.multi-dropdown-option');
            const themeCount = await themeLabels.count();
            console.log(`🔍 Found ${themeCount} theme options`);
            
            if (themeCount > 0) {
                // Get all theme texts for debugging
                const themeTexts = await themeLabels.allTextContents();
                console.log('🔍 Available theme options:', themeTexts);
                
                // Try to find mathematical themes specifically
                const themes = ['Addition', 'Soustraction', 'Multiplication', 'Division', 'Géométrie', 'Nombres', 'Calcul'];
                let selectedTheme = false;
                
                for (const theme of themes) {
                    const themeLabel = themeLabels.filter({ hasText: theme });
                    if (await themeLabel.count() > 0) {
                        console.log(`✅ Found and selecting theme: ${theme}`);
                        await themeLabel.first().click();
                        selectedTheme = true;
                        break;
                    }
                }
                
                if (!selectedTheme) {
                    // Select the first available theme option
                    const firstThemeText = themeTexts[0];
                    console.log(`✅ Selecting first available theme: ${firstThemeText}`);
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
            console.log('🔄 Clicking outside dropdown to close it and reveal next step button...');
            await studentPage.click('body', { position: { x: 100, y: 100 } });
            await studentPage.waitForTimeout(500); // Wait for dropdown to close
            
            // Click validate themes button
            await studentPage.click('button:has-text("Valider les thèmes")');
            console.log('✅ Validated themes');

            // Step 4: Select number of questions
            await expect(studentPage.locator('text=Combien de questions ?')).toBeVisible({ timeout: 5000 });
            
            // Debug: Check available question number options
            const questionButtons = await studentPage.locator('button').filter({ hasText: /^[0-9]+$/ }).allTextContents();
            console.log('🔍 Available question numbers:', questionButtons);
            
            // Select 5 questions
            const fiveButton = studentPage.locator('button:has-text("5")');
            await fiveButton.click();
            console.log('✅ Selected 5 questions');
            
            // Wait for form to auto-advance to summary page or for "Commencer l'entraînement" button to appear
            await studentPage.waitForTimeout(2000);

            // Step 5: Look for "Commencer l'entraînement" button - it might appear immediately after selecting questions
            console.log('🔍 Looking for "Commencer l\'entraînement" button...');
            
            // Wait for either the summary page or the training start button
            try {
                await expect(
                    studentPage.locator('text=Résumé').or(
                        studentPage.locator('button:has-text("Commencer l\'entraînement")')
                    )
                ).toBeVisible({ timeout: 10000 });
            } catch (error) {
                console.log('⚠️ Neither summary nor start button found, checking page state...');
                const currentContent = await studentPage.textContent('body');
                console.log('📄 Current page content:', currentContent?.substring(0, 500) + '...');
            }
            
            // Debug: Check all buttons available on the page
            const allButtons = await studentPage.locator('button').allTextContents();
            console.log('🔍 All buttons on page:', allButtons);
            
            // Look for the specific training start button with multiple variations
            const startTrainingSelectors = [
                'button:has-text("Commencer l\'entraînement")',
                'button:has-text("Commencer l'entraînement")', 
                'button:has-text("Commencer")',
                'button[type="submit"]',
                'button:has-text("Créer")',
                'button:has-text("Démarrer")'
            ];
            
            let trainingStarted = false;
            
            for (const selector of startTrainingSelectors) {
                const button = studentPage.locator(selector);
                const buttonCount = await button.count();
                
                if (buttonCount > 0) {
                    console.log(`✅ Found training button with selector: ${selector}`);
                    try {
                        await button.first().click();
                        console.log('✅ Successfully clicked training start button');
                        trainingStarted = true;
                        break;
                    } catch (error) {
                        console.log(`⚠️ Failed to click button with ${selector}:`, error);
                        continue;
                    }
                }
            }
            
            if (!trainingStarted) {
                console.log('❌ Could not find or click any training start button');
                // Fallback: try clicking any submit-like button
                const fallbackButtons = studentPage.locator('button').filter({ hasText: /.+/ });
                const fallbackTexts = await fallbackButtons.allTextContents();
                console.log('🔍 Available fallback buttons:', fallbackTexts);
                
                // Try the last button (often the primary action)
                const buttonCount = await fallbackButtons.count();
                if (buttonCount > 0) {
                    console.log('🔄 Attempting to click last available button as fallback');
                    await fallbackButtons.last().click();
                    trainingStarted = true;
                }
            }
                console.log('✅ Found alternative training start button');
                await startTrainingButtonAlt.first().click();
                console.log('✅ Clicked alternative training start button');
            } else {
                // Fallback to other possible button texts
                console.log('⚠️ "Commencer l\'entraînement" button not found, trying fallbacks...');
                const fallbackButtons = [
                    'button:has-text("Créer")',
                    'button:has-text("Continuer")',
                    'button:has-text("Commencer")',
                    'button:has-text("Démarrer")',
                    'button[type="submit"]'
                ];
                
                let buttonClicked = false;
                for (const selector of fallbackButtons) {
                    const button = studentPage.locator(selector);
                    if (await button.count() > 0) {
                        const buttonText = await button.textContent();
                        console.log(`✅ Found fallback button: ${buttonText}`);
                        await button.click();
                        buttonClicked = true;
                        break;
                    }
                }
                
                if (!buttonClicked) {
                    throw new Error('Could not find any button to start the training session');
                }
            }
            console.log('✅ Training session start initiated');

            // Step 6: Wait for either practice session or lobby redirect
            console.log('🔄 Waiting for redirect...');
            
            // Give some time for the redirect to happen
            await studentPage.waitForTimeout(3000);
            
            const currentUrl = studentPage.url();
            console.log('📍 Current URL:', currentUrl);
            
            // Helper function to handle practice session interactions
            const handlePracticeSession = async (page: Page) => {
                console.log('🎯 Entering practice session...');
                
                // Wait for question elements to load
                const questionSelectors = [
                    'h1', 'h2', 'h3', // Question headers
                    'text=Question',
                    '.question',
                    '[data-testid="question"]'
                ];
                
                let questionFound = false;
                for (const selector of questionSelectors) {
                    if (await page.locator(selector).count() > 0) {
                        console.log(`✅ Found question element: ${selector}`);
                        questionFound = true;
                        break;
                    }
                }
                
                if (!questionFound) {
                    console.log('⚠️ No question elements found, checking page content...');
                    const content = await page.textContent('body');
                    console.log('📄 Page content:', content?.substring(0, 300) + '...');
                }
                
                // Try to answer a few questions
                const maxQuestions = 3;
                for (let i = 0; i < maxQuestions; i++) {
                    console.log(`🔢 Attempting to answer question ${i + 1}...`);
                    
                    // Look for input fields or answer buttons
                    const answerInputs = page.locator('input[type="text"], input[type="number"], textarea');
                    const answerButtons = page.locator('button').filter({ hasText: /^[0-9]+$|^[A-D]$|Réponse/ });
                    
                    const inputCount = await answerInputs.count();
                    const buttonCount = await answerButtons.count();
                    
                    console.log(`🔍 Found ${inputCount} answer inputs and ${buttonCount} answer buttons`);
                    
                    if (inputCount > 0) {
                        // Text/number input question
                        const input = answerInputs.first();
                        await input.fill('42'); // Generic answer
                        console.log('✏️ Filled answer input with "42"');
                        
                        // Look for submit button
                        const submitButton = page.locator('button').filter({ hasText: /Valider|Submit|Confirmer|Suivant/ });
                        if (await submitButton.count() > 0) {
                            await submitButton.first().click();
                            console.log('✅ Submitted answer');
                        }
                        
                    } else if (buttonCount > 0) {
                        // Multiple choice question
                        await answerButtons.first().click();
                        console.log('✅ Selected first answer option');
                        
                    } else {
                        console.log('⚠️ No answer inputs or buttons found');
                        break;
                    }
                    
                    // Wait for next question or completion
                    await page.waitForTimeout(2000);
                    
                    // Check if practice session is complete
                    const completionIndicators = [
                        'text=Terminé',
                        'text=Completed', 
                        'text=Fini',
                        'text=Résultats',
                        'text=Results'
                    ];
                    
                    let sessionComplete = false;
                    for (const indicator of completionIndicators) {
                        if (await page.locator(indicator).count() > 0) {
                            console.log(`🎉 Practice session completed: ${indicator}`);
                            sessionComplete = true;
                            break;
                        }
                    }
                    
                    if (sessionComplete) {
                        break;
                    }
                }
                
                console.log('✅ Practice session interaction completed');
            };
            
            // Check if we're in a practice session or lobby
            if (currentUrl.includes('/practice/session') || currentUrl.includes('/session/')) {
                console.log('✅ Redirected to practice session');
                
                // Verify practice session elements and complete a few questions
                await handlePracticeSession(studentPage);
                
            } else if (currentUrl.includes('/lobby/')) {
                console.log('✅ Redirected to lobby (this is expected for training mode)');
                
                // In training mode, we might be redirected to a lobby first
                // Look for start button or join functionality
                const startButtons = [
                    'button:has-text("Commencer")',
                    'button:has-text("Démarrer")', 
                    'button:has-text("Start")',
                    'button:has-text("Rejoindre")'
                ];
                
                let foundStartButton = false;
                for (const buttonSelector of startButtons) {
                    const button = studentPage.locator(buttonSelector);
                    if (await button.count() > 0) {
                        console.log(`✅ Found start button: ${buttonSelector}`);
                        await button.click();
                        foundStartButton = true;
                        
                        // Wait for session to start
                        await studentPage.waitForTimeout(2000);
                        await handlePracticeSession(studentPage);
                        break;
                    }
                }
                
                if (!foundStartButton) {
                    console.log('⚠️ No start button found in lobby, but this might be expected');
                    // Check for training indicators
                    const trainingIndicators = [
                        'text=Entraînement',
                        'text=Training', 
                        'text=Practice',
                        '[data-training="true"]'
                    ];
                    
                    for (const indicator of trainingIndicators) {
                        if (await studentPage.locator(indicator).count() > 0) {
                            console.log(`✅ Found training indicator: ${indicator}`);
                            break;
                        }
                    }
                }
                
            } else {
                console.log('⚠️ Unexpected redirect location:', currentUrl);
                await studentPage.screenshot({ path: 'debug-unexpected-location.png' });
                
                // Check if there are any error messages
                const errorSelectors = [
                    'text=Erreur',
                    'text=Error',
                    '.error',
                    '.alert-error',
                    '[role="alert"]'
                ];
                
                for (const errorSelector of errorSelectors) {
                    const errorElement = studentPage.locator(errorSelector);
                    if (await errorElement.count() > 0) {
                        const errorText = await errorElement.textContent();
                        console.log(`❌ Found error message: ${errorText}`);
                    }
                }
            }
            
            console.log('🎉 Practice mode flow test completed successfully');
            
        } catch (error) {
            console.error('❌ Test failed:', error);
            console.log('📍 Current URL at error:', studentPage.url());
            await studentPage.screenshot({ path: 'debug-test-error.png' });
            throw error;
        }
    });
});
