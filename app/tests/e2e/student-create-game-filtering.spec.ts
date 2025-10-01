/**
 * Test for Cross-Filter Compatibility in Student Create Game Page
 * 
 * This test verifies that the dropdown filtering works correctly on the student/create-game page.
 * It specifically tests that when a grade level is selected, only compatible disciplines and themes
 * are shown in the dropdowns.
 */

import { test, expect } from '@playwright/test';
import { LoginHelper, TestDataHelper } from './helpers/test-helpers';

test.describe('Student Create Game - Cross-Filter Compatibility', () => {
    test.beforeEach(async ({ page }) => {
        const dataHelper = new TestDataHelper(page);
        const studentLogin = new LoginHelper(page);

        // Step 1: Create student account and login
        const studentData = dataHelper.generateTestData('filtering_student');
        await dataHelper.createStudent({
            username: studentData.username,
            email: studentData.email,
            password: studentData.password
        });

        await studentLogin.loginAsAuthenticatedStudent({
            email: studentData.email,
            password: studentData.password
        });

        // Navigate to student create game page
        await page.goto('/student/create-game');

        // Wait for the page to load
        await page.waitForLoadState('networkidle');
    });

    test('should filter disciplines when grade level L2 is selected', async ({ page }) => {
        // Select L2 grade level
        await page.click('[data-testid="grade-level-dropdown"]');
        
        // Wait for the dropdown options to appear
        await page.waitForSelector('text=L2', { state: 'visible', timeout: 5000 });
        
        await page.click('text=L2');

        // Wait for disciplines to load
        await page.waitForTimeout(1000);

        // Open disciplines dropdown
        await page.click('[data-testid="discipline-dropdown"]');

        // Check that only compatible disciplines are shown
        // For L2, only "Mathématiques" should be available
        const disciplineOptions = await page.locator('[data-testid="discipline-dropdown"] option, [data-testid="discipline-dropdown"] [role="option"]').allTextContents();

        // Should only contain "Mathématiques" for L2
        expect(disciplineOptions).toContain('Mathématiques');

        // Should NOT contain incompatible disciplines like "Anglais", "Français", etc.
        expect(disciplineOptions).not.toContain('Anglais');
        expect(disciplineOptions).not.toContain('Français');
        expect(disciplineOptions).not.toContain('Allemand');

        console.log('Available disciplines for L2:', disciplineOptions);
    });

    test('should filter themes when discipline and grade level are selected', async ({ page }) => {
        // Select L2 grade level
        await page.click('[data-testid="grade-level-dropdown"]');
        await page.click('text=L2');

        // Wait for disciplines to load
        await page.waitForTimeout(1000);

        // Select Mathématiques discipline
        await page.click('[data-testid="discipline-dropdown"]');
        await page.click('text=Mathématiques');

        // Wait for themes to load
        await page.waitForTimeout(1000);

        // Open themes dropdown
        await page.click('[data-testid="themes-dropdown"]');

        // Check that only compatible themes are shown
        const themeOptions = await page.locator('[data-testid="themes-dropdown"] option, [data-testid="themes-dropdown"] [role="option"]').allTextContents();

        // Should contain compatible themes for L2 + Mathématiques
        // Based on the API response, these should be compatible:
        expect(themeOptions).toContain('Déterminant');
        expect(themeOptions).toContain('Espaces préhilbertiens');
        expect(themeOptions).toContain('Intégrales généralisées');
        expect(themeOptions).toContain('Réduction d\'endomorphismes');
        expect(themeOptions).toContain('Séries numériques');

        // Should NOT contain incompatible themes
        expect(themeOptions).not.toContain('Calcul');
        expect(themeOptions).not.toContain('Géométrie');
        expect(themeOptions).not.toContain('Nombres');

        console.log('Available themes for L2 + Mathématiques:', themeOptions);
    });

    test('should show all options when no filters are selected', async ({ page }) => {
        // Check initial state - all grade levels should be available
        await page.click('[data-testid="grade-level-dropdown"]');
        const gradeLevelOptions = await page.locator('[data-testid="grade-level-dropdown"] option, [data-testid="grade-level-dropdown"] [role="option"]').allTextContents();

        // Should contain multiple grade levels
        expect(gradeLevelOptions.length).toBeGreaterThan(1);
        expect(gradeLevelOptions).toContain('L1');
        expect(gradeLevelOptions).toContain('L2');

        console.log('All available grade levels:', gradeLevelOptions);
    });

    test('should reset dependent dropdowns when grade level changes', async ({ page }) => {
        // Select L2 and Mathématiques
        await page.click('[data-testid="grade-level-dropdown"]');
        await page.click('text=L2');
        await page.waitForTimeout(1000);

        await page.click('[data-testid="discipline-dropdown"]');
        await page.click('text=Mathématiques');
        await page.waitForTimeout(1000);

        // Verify discipline is selected
        const selectedDiscipline = await page.locator('[data-testid="discipline-dropdown"]').inputValue();
        expect(selectedDiscipline).toBe('Mathématiques');

        // Change grade level to L1
        await page.click('[data-testid="grade-level-dropdown"]');
        await page.click('text=L1');
        await page.waitForTimeout(1000);

        // Verify that discipline dropdown is reset
        const resetDiscipline = await page.locator('[data-testid="discipline-dropdown"]').inputValue();
        expect(resetDiscipline).toBe('');
    });
});

// API Integration Test
test.describe('API Integration - Cross-Filter Compatibility', () => {
    test('should return only compatible options via API', async ({ request }) => {
        // Test the frontend API endpoint directly
        const response = await request.get('/api/questions/filters?gradeLevel=L2');
        expect(response.ok()).toBeTruthy();

        const data = await response.json();

        // Verify structure
        expect(data).toHaveProperty('gradeLevel');
        expect(data).toHaveProperty('disciplines');
        expect(data).toHaveProperty('themes');

        // Verify disciplines - should have Mathématiques as compatible
        const mathDiscipline = data.disciplines.find((d: any) => d.value === 'Mathématiques');
        expect(mathDiscipline).toBeDefined();
        expect(mathDiscipline.isCompatible).toBe(true);

        // Verify incompatible disciplines
        const anglaisDiscipline = data.disciplines.find((d: any) => d.value === 'Anglais');
        expect(anglaisDiscipline).toBeDefined();
        expect(anglaisDiscipline.isCompatible).toBe(false);

        console.log('API Response for L2 filter:', JSON.stringify(data, null, 2));
    });

    test('should return all options as compatible when no filters applied', async ({ request }) => {
        const response = await request.get('/api/questions/filters');
        expect(response.ok()).toBeTruthy();

        const data = await response.json();

        // When no filters are applied, all options should be compatible
        const allDisciplinesCompatible = data.disciplines.every((d: any) => d.isCompatible === true);
        expect(allDisciplinesCompatible).toBe(true);

        const allThemesCompatible = data.themes.every((t: any) => t.isCompatible === true);
        expect(allThemesCompatible).toBe(true);
    });
});
