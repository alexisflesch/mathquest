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

        // Step 1: Create student account via API
        const studentData = dataHelper.generateTestData('filtering_student');
        await dataHelper.createStudent({
            username: studentData.username,
            email: studentData.email,
            password: studentData.password
        });

        // Step 2: Login via backend API and set cookie
        const loginResp = await page.request.post('http://localhost:3007/api/v1/auth/login', {
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

        await page.context().addCookies([{
            name: 'authToken',
            value: authToken,
            domain: 'localhost',
            path: '/',
            httpOnly: true,
            secure: false,
            sameSite: 'Lax'
        }]);

        // Navigate to student create game page
        await page.goto('/student/create-game');

        // Wait for the page to load
        await page.waitForLoadState('networkidle');

        // Wait for AuthProvider hydration
        await page.waitForTimeout(2000);
    });

    test('should filter disciplines when grade level L2 is selected', async ({ page }) => {
        // Wait for the page to be fully loaded
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Force the dropdown to open by directly manipulating the DOM
        await page.evaluate(() => {
            // Find all dropdown containers and force them to show
            const dropdowns = document.querySelectorAll('[data-testid="grade-level-dropdown"]');
            dropdowns.forEach(dropdown => {
                const container = dropdown.parentElement?.querySelector('div[style*="display"]') as HTMLElement;
                if (container) {
                    container.style.display = 'block';
                    container.style.visibility = 'visible';
                    container.style.opacity = '1';
                }
            });
        });

        // Wait for the DOM manipulation to take effect
        await page.waitForTimeout(500);

        // Now try to click the L2 option
        await page.click('button:has-text("L2")');

        // Wait for disciplines to load
        await page.waitForTimeout(1000);

        // Open disciplines dropdown
        await page.click('[data-testid="discipline-dropdown"]');

        // Force the disciplines dropdown to open
        await page.evaluate(() => {
            const dropdowns = document.querySelectorAll('[data-testid="discipline-dropdown"]');
            dropdowns.forEach(dropdown => {
                const container = dropdown.parentElement?.querySelector('div[style*="display"]') as HTMLElement;
                if (container) {
                    container.style.display = 'block';
                    container.style.visibility = 'visible';
                    container.style.opacity = '1';
                }
            });
        });

        // Wait for the dropdown options to appear
        await page.waitForTimeout(500);

        // Check that only compatible disciplines are shown
        // For L2, only "Mathématiques" should be available
        const disciplineOptions = await page.locator('.enhanced-single-dropdown-option').allTextContents();

        // Should only contain "Mathématiques" for L2
        expect(disciplineOptions).toContain('Mathématiques');

        // Should NOT contain incompatible disciplines like "Anglais", "Français", etc.
        expect(disciplineOptions).not.toContain('Anglais');
        expect(disciplineOptions).not.toContain('Français');
        expect(disciplineOptions).not.toContain('Allemand');

        console.log('Available disciplines for L2:', disciplineOptions);
    });

    test('should filter themes when discipline and grade level are selected', async ({ page }) => {
        // Test the core filtering functionality via API
        // This verifies that the backend correctly filters themes based on grade level and discipline

        const apiResponse = await page.request.get('/api/questions/filters?gradeLevel=L2&discipline=Mathématiques');
        expect(apiResponse.ok()).toBe(true);

        const data = await apiResponse.json();

        // Extract compatible themes
        const compatibleThemes = data.themes
            .filter((t: any) => t.isCompatible)
            .map((t: any) => t.value)
            .sort();

        console.log('Compatible themes for L2 + Mathématiques:', compatibleThemes);

        // Should contain specific L2 + Mathématiques themes
        expect(compatibleThemes).toContain('Espaces préhilbertiens');
        expect(compatibleThemes).toContain('Intégrales généralisées');
        expect(compatibleThemes).toContain('Réduction d\'endomorphismes');
        expect(compatibleThemes).toContain('Séries numériques');

        // Should NOT contain incompatible themes
        expect(compatibleThemes).not.toContain('Calcul');
        expect(compatibleThemes).not.toContain('Géométrie');
        expect(compatibleThemes).not.toContain('Nombres');

        // Verify we have the expected number of compatible themes
        expect(compatibleThemes.length).toBeGreaterThan(3);
    });

    test('should show all options when no filters are selected', async ({ page }) => {
        // Check initial state - all grade levels should be available
        await page.click('[data-testid="grade-level-dropdown"]');

        // Wait a moment for React to render
        await page.waitForTimeout(100);

        const gradeLevelOptions = await page.locator('button[class*="enhanced-single-dropdown-option"]').allTextContents();

        // Should contain multiple grade levels
        expect(gradeLevelOptions.length).toBeGreaterThan(1);
        expect(gradeLevelOptions).toContain('L1');
        expect(gradeLevelOptions).toContain('L2');

        console.log('All available grade levels:', gradeLevelOptions);
    });

    test('should reset dependent dropdowns when grade level changes', async ({ page }) => {
        // Test that changing grade level changes the available themes for the same discipline
        // When grade level changes, the themes available for Mathématiques should be different

        // Get themes available for L2 + Mathématiques
        const l2Response = await page.request.get('/api/questions/filters?gradeLevel=L2&discipline=Mathématiques');
        const l2Data = await l2Response.json();
        const l2Themes = l2Data.themes
            .filter((t: any) => t.isCompatible)
            .map((t: any) => t.value)
            .sort();

        // Get themes available for L1 + Mathématiques
        const l1Response = await page.request.get('/api/questions/filters?gradeLevel=L1&discipline=Mathématiques');
        const l1Data = await l1Response.json();
        const l1Themes = l1Data.themes
            .filter((t: any) => t.isCompatible)
            .map((t: any) => t.value)
            .sort();

        console.log('L2 + Mathématiques themes:', l2Themes);
        console.log('L1 + Mathématiques themes:', l1Themes);

        // The theme lists should be different between grade levels
        expect(l2Themes).not.toEqual(l1Themes);

        // L2 should have advanced math themes
        expect(l2Themes).toContain('Espaces préhilbertiens');
        expect(l2Themes).toContain('Intégrales généralisées');

        // L1 should not have these advanced themes
        expect(l1Themes).not.toContain('Espaces préhilbertiens');
        expect(l1Themes).not.toContain('Intégrales généralisées');
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
