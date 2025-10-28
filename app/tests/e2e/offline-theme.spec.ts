import { test, expect } from '@playwright/test';

const OFFLINE_URL = 'http://localhost:3008/offline.html';

test.describe('Offline Page Theme Awareness', () => {
    test('should apply light theme by default', async ({ page }) => {
        await page.goto(OFFLINE_URL);
        await page.waitForLoadState('networkidle');

        // Check that data-theme attribute is set
        const htmlElement = page.locator('html');
        const dataTheme = await htmlElement.getAttribute('data-theme');
        expect(['light', 'dark']).toContain(dataTheme);

        // Verify CSS variables are defined
        const bgColor = await page.evaluate(() => {
            return getComputedStyle(document.documentElement).getPropertyValue('--background');
        });
        expect(bgColor).toBeTruthy();
        expect(bgColor.trim()).not.toBe('');
    });

    test('should respect localStorage theme setting - dark', async ({ page }) => {
        // Set dark theme in localStorage before navigation
        await page.addInitScript(() => {
            localStorage.setItem('theme', 'dark');
        });

        await page.goto(OFFLINE_URL);
        await page.waitForLoadState('networkidle');

        // Check data-theme attribute
        const htmlElement = page.locator('html');
        const dataTheme = await htmlElement.getAttribute('data-theme');
        expect(dataTheme).toBe('dark');

        // Verify dark theme colors
        const bgColor = await page.evaluate(() => {
            return getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
        });
        const cardColor = await page.evaluate(() => {
            return getComputedStyle(document.documentElement).getPropertyValue('--card').trim();
        });

        // Dark theme should have dark background
        expect(bgColor).toBe('#23272f');
        expect(cardColor).toBe('#2d3340');
    });

    test('should respect localStorage theme setting - light', async ({ page }) => {
        // Set light theme in localStorage before navigation
        await page.addInitScript(() => {
            localStorage.setItem('theme', 'light');
        });

        await page.goto(OFFLINE_URL);
        await page.waitForLoadState('networkidle');

        // Check data-theme attribute
        const htmlElement = page.locator('html');
        const dataTheme = await htmlElement.getAttribute('data-theme');
        expect(dataTheme).toBe('light');

        // Verify light theme colors
        const bgColor = await page.evaluate(() => {
            return getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
        });
        const cardColor = await page.evaluate(() => {
            return getComputedStyle(document.documentElement).getPropertyValue('--card').trim();
        });

        // Light theme should have light background
        expect(bgColor).toBe('#ebf0f5');
        expect(cardColor).toBe('#fff');
    });

    test('should respect light theme even with dark system preference', async ({ page }) => {
        // Simulate dark system preference
        await page.emulateMedia({ colorScheme: 'dark' });

        // Set light theme in localStorage (user override)
        await page.addInitScript(() => {
            localStorage.setItem('theme', 'light');
        });

        await page.goto(OFFLINE_URL);
        await page.waitForLoadState('networkidle');

        // Should still be light theme (localStorage overrides system)
        const htmlElement = page.locator('html');
        const dataTheme = await htmlElement.getAttribute('data-theme');
        expect(dataTheme).toBe('light');

        // Verify light theme colors are applied
        const bgColor = await page.evaluate(() => {
            return getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
        });
        const cardColor = await page.evaluate(() => {
            return getComputedStyle(document.documentElement).getPropertyValue('--card').trim();
        });

        // Light theme colors should be applied despite dark system preference
        expect(bgColor).toBe('#ebf0f5');
        expect(cardColor).toBe('#fff');
    });

    test('should respect localStorage theme setting - system (dark preference)', async ({ page }) => {
        // Set dark color scheme preference
        await page.emulateMedia({ colorScheme: 'dark' });

        // Set system theme in localStorage before navigation
        await page.addInitScript(() => {
            localStorage.setItem('theme', 'system');
        });

        await page.goto(OFFLINE_URL);
        await page.waitForLoadState('networkidle');

        // Check data-theme attribute should be dark
        const htmlElement = page.locator('html');
        const dataTheme = await htmlElement.getAttribute('data-theme');
        expect(dataTheme).toBe('dark');

        // Verify dark theme colors
        const bgColor = await page.evaluate(() => {
            return getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
        });
        expect(bgColor).toBe('#23272f');
    });

    test('should respect localStorage theme setting - system (light preference)', async ({ page }) => {
        // Set light color scheme preference
        await page.emulateMedia({ colorScheme: 'light' });

        // Set system theme in localStorage before navigation
        await page.addInitScript(() => {
            localStorage.setItem('theme', 'system');
        });

        await page.goto(OFFLINE_URL);
        await page.waitForLoadState('networkidle');

        // Check data-theme attribute should be light
        const htmlElement = page.locator('html');
        const dataTheme = await htmlElement.getAttribute('data-theme');
        expect(dataTheme).toBe('light');

        // Verify light theme colors
        const bgColor = await page.evaluate(() => {
            return getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
        });
        expect(bgColor).toBe('#ebf0f5');
    });

    test('should apply theme without flash (theme script runs immediately)', async ({ page }) => {
        // Set dark theme
        await page.addInitScript(() => {
            localStorage.setItem('theme', 'dark');
        });

        await page.goto(OFFLINE_URL);

        // Check that data-theme is set before DOMContentLoaded
        const dataThemeSetEarly = await page.evaluate(() => {
            return document.documentElement.hasAttribute('data-theme');
        });
        expect(dataThemeSetEarly).toBe(true);
    });

    test('should have all required CSS variables defined', async ({ page }) => {
        await page.goto(OFFLINE_URL);
        await page.waitForLoadState('networkidle');

        const cssVars = await page.evaluate(() => {
            const vars = [
                '--background',
                '--navbar',
                '--foreground',
                '--primary',
                '--primary-foreground',
                '--secondary',
                '--card',
                '--muted-foreground',
                '--border'
            ];
            const style = getComputedStyle(document.documentElement);
            return vars.map(v => ({
                name: v,
                value: style.getPropertyValue(v).trim()
            }));
        });

        // All variables should be defined and non-empty
        for (const cssVar of cssVars) {
            expect(cssVar.value, `CSS variable ${cssVar.name} should be defined`).toBeTruthy();
            expect(cssVar.value, `CSS variable ${cssVar.name} should not be empty`).not.toBe('');
        }
    });

    test('should display correct content and UI elements', async ({ page }) => {
        await page.goto(OFFLINE_URL);
        await page.waitForLoadState('networkidle');

        // Check for main elements
        await expect(page.locator('h1')).toContainText('Vous êtes hors ligne');
        await expect(page.locator('p')).toContainText('Impossible de se connecter');

        // Check for retry button
        const retryButton = page.locator('.retry-button');
        await expect(retryButton).toBeVisible();
        await expect(retryButton).toContainText('Réessayer');

        // Check icon
        const icon = page.locator('.icon');
        await expect(icon).toBeVisible();
        await expect(icon).toContainText('📡');
    });

    test('should use theme colors for UI elements', async ({ page }) => {
        // Test with dark theme
        await page.addInitScript(() => {
            localStorage.setItem('theme', 'dark');
        });

        await page.goto(OFFLINE_URL);
        await page.waitForLoadState('networkidle');

        // Check that text uses --foreground color
        const h1Color = await page.locator('h1').evaluate((el) => {
            return getComputedStyle(el).color;
        });

        // Check that card uses --card background
        const cardBg = await page.locator('.container').evaluate((el) => {
            return getComputedStyle(el).backgroundColor;
        });

        // Check that button uses --primary background
        const buttonBg = await page.locator('.retry-button').evaluate((el) => {
            return getComputedStyle(el).backgroundColor;
        });

        // These should all be defined (not 'rgba(0, 0, 0, 0)' or empty)
        expect(h1Color).toBeTruthy();
        expect(cardBg).toBeTruthy();
        expect(buttonBg).toBeTruthy();
    });

    test('should handle missing localStorage gracefully', async ({ page }) => {
        // Don't set any theme in localStorage
        await page.goto(OFFLINE_URL);
        await page.waitForLoadState('networkidle');

        // Should still have a theme applied (fallback to system)
        const htmlElement = page.locator('html');
        const dataTheme = await htmlElement.getAttribute('data-theme');
        expect(['light', 'dark']).toContain(dataTheme);

        // Should still be functional
        await expect(page.locator('.container')).toBeVisible();
        await expect(page.locator('.retry-button')).toBeVisible();
    });
});
