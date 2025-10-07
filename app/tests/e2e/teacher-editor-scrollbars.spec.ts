import { test, expect, Page } from '@playwright/test';
import { TestDataHelper, LoginHelper } from './helpers/test-helpers';

async function ensureLoggedInTeacher(page: Page) {
  const dataHelper = new TestDataHelper(page);
  const login = new LoginHelper(page);
  const creds = dataHelper.generateTestData('teacher_editor_scroll');

  // Create teacher
  await dataHelper.createTeacher({
    username: creds.username,
    email: creds.email,
    password: creds.password,
  });

  // Login via UI (helper is robust to current login UX)
  await login.loginAsTeacher({ email: creds.email, password: creds.password });
  await expect(page).toHaveURL(/\//);
}

async function countAnswerHorizontalScrollbars(page: Page) {
  // Count answer content spans that actually show horizontal scrollbars
  // using scrollWidth > clientWidth AND overflow-x allowing scroll.
  return page.evaluate(() => {
    const container = document.querySelector('.card .tqcard-content');
    if (!container) return -1; // not ready yet
    const spans = container.querySelectorAll('button.tqcard-answer > span:first-child');
    let count = 0;
    spans.forEach((s: Element) => {
      const el = s as HTMLElement;
      const style = getComputedStyle(el);
      const allowsScroll = style.overflowX === 'auto' || style.overflowX === 'scroll';
      if (allowsScroll && el.scrollWidth > el.clientWidth + 1) count++;
    });
    return count;
  });
}

async function assertNoAnswerScrollbars(page: Page) {
  const count = await countAnswerHorizontalScrollbars(page);
  expect(count).toBe(0);
}

async function typeInQuestionTextarea(page: Page, text: string) {
  // Locate the question textarea on the left form (label: Question)
  const locator = page.locator('textarea[placeholder*="question" i]');
  await locator.first().click();
  await locator.first().type(text);
}

async function setMathAnswersInForm(page: Page) {
  // Ensure we are on Formulaire tab
  const formTab = page.getByRole('button', { name: /Formulaire/i });
  if (await formTab.isVisible()) await formTab.click();

  // Make sure answer inputs are visible
  const answerInputs = page.locator('input[placeholder^="Réponse"], input[placeholder^="Reponse"]');
  await answerInputs.first().waitFor({ state: 'visible' });

  // Fill first 4 answers with display-math-rich content
  const formulas = [
    String.raw`\\[ \\sqrt{2} \\in \\mathbb{Q} \\]`,
    String.raw`\\[ \\sqrt{2} \\subset \\mathbb{C} \\]`,
    String.raw`\\[ \\{ \\sqrt{2}, \\pi \\} \\in \\mathbb{R} \\]`,
    String.raw`\\[ \\{ \\sqrt{2}, \\pi \\} \\subset \\mathbb{C} \\]`,
  ];

  for (let i = 0; i < 4; i++) {
    const input = answerInputs.nth(i);
    await input.fill('');
    await input.type(formulas[i]);
  }

  // Wait for MathJax wrappers to appear inside the preview answers
  await page.waitForFunction(() => {
    const spans = document.querySelectorAll('button.tqcard-answer > span:first-child');
    if (!spans.length) return false;
    return Array.from(spans).some(s => s.querySelector('mjx-container,.mjx-chtml,.MathJax'));
  }, { timeout: 5000 });
}

test.describe('Teacher question editor - MathJax scrollbars', () => {
  test('no useless horizontal scrollbars in preview when toggling and typing', async ({ page }) => {
    await ensureLoggedInTeacher(page);

    // Go to the editor page
    await page.goto('/teacher/questions/edit');
    await page.waitForLoadState('networkidle');

    // Ensure preview card is present
    await page.waitForSelector('.card .tqcard-content');

    // Fill answers with display math to trigger the real layout case
    await setMathAnswersInForm(page);

    // Baseline: should be zero scrollbars in answers
    await assertNoAnswerScrollbars(page);

    // Toggle YAML, then back to Formulaire
    await page.getByRole('button', { name: /YAML/i }).click();
    await page.getByRole('button', { name: /Formulaire/i }).click();

    // After toggling: still expected zero — current bug likely shows 1 (this should fail until fixed)
    await assertNoAnswerScrollbars(page);

    // Simulate typing in the question textarea to trigger live re-typeset
    await typeInQuestionTextarea(page, ' abcdef');

    // After typing: still expected zero — bug often grows scrollbars (this should fail until fixed)
    await assertNoAnswerScrollbars(page);
  });
});
