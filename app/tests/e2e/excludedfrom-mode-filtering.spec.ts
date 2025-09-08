/**
 * Test for ExcludedFrom Mode Filtering Bug Fix
 * 
 * This test verifies that the questions/filters API correctly respects the excludedFrom field
 * when filtering questions based on mode (practice, tournament, quiz).
 * 
 * Bug: Questions excluded from practice/tournament were still appearing in filter results
 * Fix: Frontend API route now passes mode parameter to backend for proper filtering
 */

import { test, expect } from '@playwright/test';

test.describe('ExcludedFrom Mode Filtering', () => {
  
  test('should filter out questions excluded from practice mode', async ({ request }) => {
    // Test with L2 grade level and practice mode
    const practiceResponse = await request.get('/api/questions/filters?gradeLevel=L2&mode=practice');
    expect(practiceResponse.ok()).toBeTruthy();
    
    const practiceData = await practiceResponse.json();
    
    // Extract compatible themes for practice mode
    const practiceCompatibleThemes = practiceData.themes
      .filter(theme => theme.isCompatible)
      .map(theme => theme.value);
    
    console.log('Compatible themes for L2 + practice:', practiceCompatibleThemes);
    
    // Should only have "Intégrales généralisées" for L2 practice mode
    expect(practiceCompatibleThemes).toContain('Intégrales généralisées');
    
    // Should NOT have themes that are excluded from practice
    expect(practiceCompatibleThemes).not.toContain('Déterminant');
    expect(practiceCompatibleThemes).not.toContain('Espaces préhilbertiens');
    expect(practiceCompatibleThemes).not.toContain('Réduction d\'endomorphismes');
    expect(practiceCompatibleThemes).not.toContain('Séries numériques');
    
    // Verify that practice filtering is more restrictive than no mode
    const allResponse = await request.get('/api/questions/filters?gradeLevel=L2');
    const allData = await allResponse.json();
    const allCompatibleThemes = allData.themes
      .filter(theme => theme.isCompatible)
      .map(theme => theme.value);
    
    console.log('All compatible themes for L2 (no mode):', allCompatibleThemes);
    
    // Practice mode should have fewer themes than no mode
    expect(practiceCompatibleThemes.length).toBeLessThan(allCompatibleThemes.length);
    
    // All themes should include the excluded ones
    expect(allCompatibleThemes).toContain('Déterminant');
    expect(allCompatibleThemes).toContain('Espaces préhilbertiens');
    expect(allCompatibleThemes).toContain('Réduction d\'endomorphismes');
    expect(allCompatibleThemes).toContain('Séries numériques');
  });

  test('should filter out questions excluded from tournament mode', async ({ request }) => {
    // Test with L2 grade level and tournament mode
    const tournamentResponse = await request.get('/api/questions/filters?gradeLevel=L2&mode=tournament');
    expect(tournamentResponse.ok()).toBeTruthy();
    
    const tournamentData = await tournamentResponse.json();
    
    // Extract compatible themes for tournament mode
    const tournamentCompatibleThemes = tournamentData.themes
      .filter(theme => theme.isCompatible)
      .map(theme => theme.value);
    
    console.log('Compatible themes for L2 + tournament:', tournamentCompatibleThemes);
    
    // Should only have "Intégrales généralisées" for L2 tournament mode
    expect(tournamentCompatibleThemes).toContain('Intégrales généralisées');
    
    // Should NOT have themes that are excluded from tournament
    expect(tournamentCompatibleThemes).not.toContain('Déterminant');
    expect(tournamentCompatibleThemes).not.toContain('Espaces préhilbertiens');
    expect(tournamentCompatibleThemes).not.toContain('Réduction d\'endomorphismes');
    expect(tournamentCompatibleThemes).not.toContain('Séries numériques');
  });

  test('should show all questions when no mode is specified', async ({ request }) => {
    // Test with L2 grade level and no mode
    const allResponse = await request.get('/api/questions/filters?gradeLevel=L2');
    expect(allResponse.ok()).toBeTruthy();
    
    const allData = await allResponse.json();
    
    // Extract compatible themes with no mode filtering
    const allCompatibleThemes = allData.themes
      .filter(theme => theme.isCompatible)
      .map(theme => theme.value);
    
    console.log('All compatible themes for L2 (no mode filtering):', allCompatibleThemes);
    
    // Should include ALL themes for L2, including those excluded from practice/tournament
    expect(allCompatibleThemes).toContain('Intégrales généralisées');
    expect(allCompatibleThemes).toContain('Déterminant');
    expect(allCompatibleThemes).toContain('Espaces préhilbertiens');
    expect(allCompatibleThemes).toContain('Réduction d\'endomorphismes');
    expect(allCompatibleThemes).toContain('Séries numériques');
    
    // Should have at least 5 themes for L2
    expect(allCompatibleThemes.length).toBeGreaterThanOrEqual(5);
  });

  test('should pass mode parameter to backend correctly', async ({ request }) => {
    // Test that mode parameter is properly forwarded to backend
    
    // Test practice mode with specific grade level
    const practiceL2Response = await request.get('/api/questions/filters?gradeLevel=L2&mode=practice');
    const practiceL2Data = await practiceL2Response.json();
    
    // Test tournament mode with specific grade level  
    const tournamentL2Response = await request.get('/api/questions/filters?gradeLevel=L2&mode=tournament');
    const tournamentL2Data = await tournamentL2Response.json();
    
    // Both should filter the same way for L2 (since questions are excluded from both modes)
    const practiceThemes = practiceL2Data.themes.filter(t => t.isCompatible).map(t => t.value);
    const tournamentThemes = tournamentL2Data.themes.filter(t => t.isCompatible).map(t => t.value);
    
    // Should be the same themes for both modes in this case
    expect(practiceThemes.sort()).toEqual(tournamentThemes.sort());
    
    console.log('Practice themes:', practiceThemes);
    console.log('Tournament themes:', tournamentThemes);
  });

  test('should work correctly in student create game context', async ({ page }) => {
    // Test the actual user workflow that was broken
    
    // Navigate to student create game with training mode
    await page.goto('/student/create-game?training=true');
    await page.waitForLoadState('networkidle');
    
    // Intercept API calls to verify mode parameter is passed
    let apiCallMade = false;
    page.on('request', request => {
      if (request.url().includes('/api/questions/filters') && request.url().includes('mode=practice')) {
        apiCallMade = true;
        console.log('✅ API call with practice mode detected:', request.url());
      }
    });
    
    // Select L2 grade level (this should trigger API call with mode=practice)
    await page.click('[data-testid="grade-level-dropdown"]');
    await page.click('text=L2');
    
    // Wait for API call
    await page.waitForTimeout(2000);
    
    // Verify API call was made with mode parameter
    expect(apiCallMade).toBe(true);
    
    // Check that only compatible disciplines are shown
    await page.click('[data-testid="discipline-dropdown"]');
    
    // Should only show Mathématiques for L2
    const disciplineOptions = await page.locator('[data-testid="discipline-dropdown"] option, [data-testid="discipline-dropdown"] [role="option"]').allTextContents();
    
    expect(disciplineOptions).toContain('Mathématiques');
    expect(disciplineOptions).not.toContain('Anglais');
    
    console.log('Available disciplines for L2 practice mode:', disciplineOptions);
  });
});

// Backend Integration Test
test.describe('Backend API Mode Filtering', () => {
  
  test('should verify backend directly filters by excludedFrom', async ({ request }) => {
    // Test backend API directly to ensure it handles mode parameter
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3007/api/v1';
    
    // Test backend with L2 and practice mode
    const backendResponse = await request.get(`${backendUrl}/questions/filters?gradeLevel=L2&mode=practice`);
    expect(backendResponse.ok()).toBeTruthy();
    
    const backendData = await backendResponse.json();
    console.log('Backend response for L2 + practice:', backendData);
    
    // Backend should return only themes that are not excluded from practice
    expect(backendData.themes).toContain('Intégrales généralisées');
    expect(backendData.themes).not.toContain('Déterminant');
    
    // Compare with no mode
    const backendNoModeResponse = await request.get(`${backendUrl}/questions/filters?gradeLevel=L2`);
    const backendNoModeData = await backendNoModeResponse.json();
    
    // No mode should have more themes
    expect(backendNoModeData.themes.length).toBeGreaterThan(backendData.themes.length);
    expect(backendNoModeData.themes).toContain('Déterminant');
  });
});
