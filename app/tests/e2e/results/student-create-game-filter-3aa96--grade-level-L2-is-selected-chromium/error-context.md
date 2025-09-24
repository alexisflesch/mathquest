# Test info

- Name: Student Create Game - Cross-Filter Compatibility >> should filter disciplines when grade level L2 is selected
- Location: /home/aflesch/mathquest/app/tests/e2e/student-create-game-filtering.spec.ts:20:9

# Error details

```
Error: page.click: Test ended.
Call log:
  - waiting for locator('[data-testid="grade-level-dropdown"]')

    at /home/aflesch/mathquest/app/tests/e2e/student-create-game-filtering.spec.ts:22:20
```

# Test source

```ts
   1 | /**
   2 |  * Test for Cross-Filter Compatibility in Student Create Game Page
   3 |  * 
   4 |  * This test verifies that the dropdown filtering works correctly on the student/create-game page.
   5 |  * It specifically tests that when a grade level is selected, only compatible disciplines and themes
   6 |  * are shown in the dropdowns.
   7 |  */
   8 |
   9 | import { test, expect } from '@playwright/test';
   10 |
   11 | test.describe('Student Create Game - Cross-Filter Compatibility', () => {
   12 |     test.beforeEach(async ({ page }) => {
   13 |         // Navigate to student create game page
   14 |         await page.goto('/student/create-game');
   15 |
   16 |         // Wait for the page to load
   17 |         await page.waitForLoadState('networkidle');
   18 |     });
   19 |
   20 |     test('should filter disciplines when grade level L2 is selected', async ({ page }) => {
   21 |         // Select L2 grade level
>  22 |         await page.click('[data-testid="grade-level-dropdown"]');
      |                    ^ Error: page.click: Test ended.
   23 |         await page.click('text=L2');
   24 |
   25 |         // Wait for disciplines to load
   26 |         await page.waitForTimeout(1000);
   27 |
   28 |         // Open disciplines dropdown
   29 |         await page.click('[data-testid="discipline-dropdown"]');
   30 |
   31 |         // Check that only compatible disciplines are shown
   32 |         // For L2, only "Mathématiques" should be available
   33 |         const disciplineOptions = await page.locator('[data-testid="discipline-dropdown"] option, [data-testid="discipline-dropdown"] [role="option"]').allTextContents();
   34 |
   35 |         // Should only contain "Mathématiques" for L2
   36 |         expect(disciplineOptions).toContain('Mathématiques');
   37 |
   38 |         // Should NOT contain incompatible disciplines like "Anglais", "Français", etc.
   39 |         expect(disciplineOptions).not.toContain('Anglais');
   40 |         expect(disciplineOptions).not.toContain('Français');
   41 |         expect(disciplineOptions).not.toContain('Allemand');
   42 |
   43 |         console.log('Available disciplines for L2:', disciplineOptions);
   44 |     });
   45 |
   46 |     test('should filter themes when discipline and grade level are selected', async ({ page }) => {
   47 |         // Select L2 grade level
   48 |         await page.click('[data-testid="grade-level-dropdown"]');
   49 |         await page.click('text=L2');
   50 |
   51 |         // Wait for disciplines to load
   52 |         await page.waitForTimeout(1000);
   53 |
   54 |         // Select Mathématiques discipline
   55 |         await page.click('[data-testid="discipline-dropdown"]');
   56 |         await page.click('text=Mathématiques');
   57 |
   58 |         // Wait for themes to load
   59 |         await page.waitForTimeout(1000);
   60 |
   61 |         // Open themes dropdown
   62 |         await page.click('[data-testid="themes-dropdown"]');
   63 |
   64 |         // Check that only compatible themes are shown
   65 |         const themeOptions = await page.locator('[data-testid="themes-dropdown"] option, [data-testid="themes-dropdown"] [role="option"]').allTextContents();
   66 |
   67 |         // Should contain compatible themes for L2 + Mathématiques
   68 |         // Based on the API response, these should be compatible:
   69 |         expect(themeOptions).toContain('Déterminant');
   70 |         expect(themeOptions).toContain('Espaces préhilbertiens');
   71 |         expect(themeOptions).toContain('Intégrales généralisées');
   72 |         expect(themeOptions).toContain('Réduction d\'endomorphismes');
   73 |         expect(themeOptions).toContain('Séries numériques');
   74 |
   75 |         // Should NOT contain incompatible themes
   76 |         expect(themeOptions).not.toContain('Calcul');
   77 |         expect(themeOptions).not.toContain('Géométrie');
   78 |         expect(themeOptions).not.toContain('Nombres');
   79 |
   80 |         console.log('Available themes for L2 + Mathématiques:', themeOptions);
   81 |     });
   82 |
   83 |     test('should show all options when no filters are selected', async ({ page }) => {
   84 |         // Check initial state - all grade levels should be available
   85 |         await page.click('[data-testid="grade-level-dropdown"]');
   86 |         const gradeLevelOptions = await page.locator('[data-testid="grade-level-dropdown"] option, [data-testid="grade-level-dropdown"] [role="option"]').allTextContents();
   87 |
   88 |         // Should contain multiple grade levels
   89 |         expect(gradeLevelOptions.length).toBeGreaterThan(1);
   90 |         expect(gradeLevelOptions).toContain('L1');
   91 |         expect(gradeLevelOptions).toContain('L2');
   92 |
   93 |         console.log('All available grade levels:', gradeLevelOptions);
   94 |     });
   95 |
   96 |     test('should reset dependent dropdowns when grade level changes', async ({ page }) => {
   97 |         // Select L2 and Mathématiques
   98 |         await page.click('[data-testid="grade-level-dropdown"]');
   99 |         await page.click('text=L2');
  100 |         await page.waitForTimeout(1000);
  101 |
  102 |         await page.click('[data-testid="discipline-dropdown"]');
  103 |         await page.click('text=Mathématiques');
  104 |         await page.waitForTimeout(1000);
  105 |
  106 |         // Verify discipline is selected
  107 |         const selectedDiscipline = await page.locator('[data-testid="discipline-dropdown"]').inputValue();
  108 |         expect(selectedDiscipline).toBe('Mathématiques');
  109 |
  110 |         // Change grade level to L1
  111 |         await page.click('[data-testid="grade-level-dropdown"]');
  112 |         await page.click('text=L1');
  113 |         await page.waitForTimeout(1000);
  114 |
  115 |         // Verify that discipline dropdown is reset
  116 |         const resetDiscipline = await page.locator('[data-testid="discipline-dropdown"]').inputValue();
  117 |         expect(resetDiscipline).toBe('');
  118 |     });
  119 | });
  120 |
  121 | // API Integration Test
  122 | test.describe('API Integration - Cross-Filter Compatibility', () => {
```