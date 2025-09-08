/**
 * Test for Cross-Filter Parameter Handling Bug Fix
 * 
 * This test verifies that the questions/filters API correctly handles both
 * singular and plural parameter names for disciplines, themes, and tags.
 * 
 * Bug: Frontend API was expecting 'disciplines' but student pages were sending 'discipline'
 * Fix: Updated frontend API to handle both singular and plural forms
 */

import { test, expect } from '@playwright/test';

test.describe('Cross-Filter Parameter Handling', () => {

    test('should handle singular discipline parameter correctly', async ({ request }) => {
        // Test with CP + Italien using singular 'discipline' parameter
        const response = await request.get('/api/questions/filters?gradeLevel=CP&discipline=Italien');
        expect(response.ok()).toBeTruthy();

        const data = await response.json();

        // Extract compatible themes
        const compatibleThemes = data.themes
            .filter(theme => theme.isCompatible)
            .map(theme => theme.value);

        console.log('Compatible themes for CP + Italien (singular):', compatibleThemes);

        // Should only have "Vocabulaire" for CP + Italien
        expect(compatibleThemes).toContain('Vocabulaire');
        expect(compatibleThemes).toHaveLength(1);

        // Should NOT have themes from other disciplines
        expect(compatibleThemes).not.toContain('Calcul');
        expect(compatibleThemes).not.toContain('Géométrie');
        expect(compatibleThemes).not.toContain('Nombres');
    });

    test('should handle plural disciplines parameter correctly', async ({ request }) => {
        // Test with CP + Italien using plural 'disciplines' parameter
        const response = await request.get('/api/questions/filters?gradeLevel=CP&disciplines=Italien');
        expect(response.ok()).toBeTruthy();

        const data = await response.json();

        // Extract compatible themes
        const compatibleThemes = data.themes
            .filter(theme => theme.isCompatible)
            .map(theme => theme.value);

        console.log('Compatible themes for CP + Italien (plural):', compatibleThemes);

        // Should only have "Vocabulaire" for CP + Italien
        expect(compatibleThemes).toContain('Vocabulaire');
        expect(compatibleThemes).toHaveLength(1);
    });

    test('should produce same results for singular and plural parameters', async ({ request }) => {
        // Test both forms and ensure they produce identical results
        const singularResponse = await request.get('/api/questions/filters?gradeLevel=CP&discipline=Italien');
        const pluralResponse = await request.get('/api/questions/filters?gradeLevel=CP&disciplines=Italien');

        expect(singularResponse.ok()).toBeTruthy();
        expect(pluralResponse.ok()).toBeTruthy();

        const singularData = await singularResponse.json();
        const pluralData = await pluralResponse.json();

        // Extract compatible themes from both
        const singularThemes = singularData.themes
            .filter(theme => theme.isCompatible)
            .map(theme => theme.value)
            .sort();

        const pluralThemes = pluralData.themes
            .filter(theme => theme.isCompatible)
            .map(theme => theme.value)
            .sort();

        // Should be identical
        expect(singularThemes).toEqual(pluralThemes);

        console.log('Singular discipline themes:', singularThemes);
        console.log('Plural disciplines themes:', pluralThemes);
    });

    test('should handle theme parameter correctly', async ({ request }) => {
        // Test with theme filtering using singular 'theme' parameter
        const response = await request.get('/api/questions/filters?gradeLevel=CP&discipline=Italien&theme=Vocabulaire');
        expect(response.ok()).toBeTruthy();

        const data = await response.json();

        // When theme is selected, tags should be filtered accordingly
        const compatibleTags = data.tags
            .filter(tag => tag.isCompatible)
            .map(tag => tag.value);

        console.log('Compatible tags for CP + Italien + Vocabulaire:', compatibleTags);

        // Should have some compatible tags
        expect(compatibleTags.length).toBeGreaterThan(0);
    });

    test('should properly filter tags based on grade level and discipline', async ({ request }) => {
        // Test that tags are correctly filtered
        const response = await request.get('/api/questions/filters?gradeLevel=CP&discipline=Italien');
        expect(response.ok()).toBeTruthy();

        const data = await response.json();

        // Extract compatible and incompatible tags
        const compatibleTags = data.tags.filter(tag => tag.isCompatible).map(tag => tag.value);
        const incompatibleTags = data.tags.filter(tag => !tag.isCompatible).map(tag => tag.value);

        console.log('Compatible tags for CP + Italien:', compatibleTags);
        console.log('Sample incompatible tags:', incompatibleTags.slice(0, 5));

        // Should have fewer compatible tags than total tags
        expect(compatibleTags.length).toBeLessThan(data.tags.length);

        // Should include tags relevant to Italian/vocabulary
        expect(compatibleTags).toContain('animaux');
        expect(compatibleTags).toContain('couleurs');

        // Should NOT include advanced math tags
        expect(incompatibleTags).toContain('Riemann');
        expect(incompatibleTags).toContain('absolue convergence');
    });

    test('should demonstrate the fixed behavior vs broken behavior', async ({ request }) => {
        // Test that shows the difference between correct filtering and no filtering

        // Test with specific filters applied
        const filteredResponse = await request.get('/api/questions/filters?gradeLevel=CP&discipline=Italien');
        const unfilteredResponse = await request.get('/api/questions/filters?gradeLevel=CP');

        const filteredData = await filteredResponse.json();
        const unfilteredData = await unfilteredResponse.json();

        const filteredThemes = filteredData.themes.filter(t => t.isCompatible).map(t => t.value);
        const unfilteredThemes = unfilteredData.themes.filter(t => t.isCompatible).map(t => t.value);

        console.log('🔍 Filtered (CP + Italien):', filteredThemes);
        console.log('📋 Unfiltered (CP only):', unfilteredThemes);

        // Filtered should have fewer themes than unfiltered
        expect(filteredThemes.length).toBeLessThan(unfilteredThemes.length);

        // Filtered should only have "Vocabulaire"
        expect(filteredThemes).toEqual(['Vocabulaire']);

        // Unfiltered should have more themes including math themes
        expect(unfilteredThemes).toContain('Vocabulaire');
        expect(unfilteredThemes).toContain('Calcul');
        expect(unfilteredThemes).toContain('Géométrie');
    });
});

// Manual verification helpers
test.describe('Manual Verification Helpers', () => {
    test('should log backend vs frontend comparison', async ({ request }) => {
        // This test helps verify our frontend matches the backend
        const frontendResponse = await request.get('/api/questions/filters?gradeLevel=CP&discipline=Italien');

        // Note: We can't easily test backend directly in Playwright, but this logs what we should expect
        console.log('\n=== VERIFICATION ===');
        console.log('Frontend API call: /api/questions/filters?gradeLevel=CP&discipline=Italien');
        console.log('Expected backend equivalent: http://localhost:3007/api/v1/questions/filters?gradeLevel=CP&discipline=Italien');
        console.log('Expected backend themes: ["Vocabulaire"]');
        console.log('Expected backend tags: ["animaux", "couleurs"]');

        const frontendData = await frontendResponse.json();
        const frontendThemes = frontendData.themes.filter(t => t.isCompatible).map(t => t.value);
        const frontendTags = frontendData.tags.filter(t => t.isCompatible).map(t => t.value);

        console.log('Actual frontend themes:', frontendThemes);
        console.log('Actual frontend tags:', frontendTags);

        expect(frontendThemes).toEqual(['Vocabulaire']);
        expect(frontendTags).toContain('animaux');
        expect(frontendTags).toContain('couleurs');
    });
});
