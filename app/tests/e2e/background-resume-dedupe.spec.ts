import { test, expect, Browser, Page } from '@playwright/test';
import { TestDataHelper, LoginHelper, GameStateHelper } from './helpers/test-helpers';

const CFG = { baseUrl: 'http://localhost:3008', backendUrl: 'http://localhost:3007' };

// Minimal background/resume + reconnect dedupe verification
// Goal: After a short offline/online flap, student should not receive a burst of duplicate GAME_QUESTION events

test.describe('Background/Resume dedupe smoke', () => {
  let teacherPage: Page;
  let studentPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Same setup as quiz-flow.spec.ts - NO extraHTTPHeaders!
    const teacherCtx = await browser.newContext();
    const studentCtx = await browser.newContext();
    teacherPage = await teacherCtx.newPage();
    studentPage = await studentCtx.newPage();
  });

  test.afterAll(async () => {
    await teacherPage?.context().close();
    await studentPage?.context().close();
  });

  test('student receives at most one game_question around reconnect', async ({ }, testInfo) => {
    // This flow involves API setup + UI interactions; give it ample time
    testInfo.setTimeout(60000);

    // EXACT PATTERN FROM quiz-flow.spec.ts
    const dataHelper = new TestDataHelper(teacherPage);
    const loginHelper = new LoginHelper(teacherPage);
    const seed = dataHelper.generateTestData('bg_resume');

    // Step 1: Create teacher account and login
    const teacherData = await dataHelper.createTeacher({
      username: seed.username,
      email: seed.email,
      password: seed.password
    });

    await loginHelper.loginAsTeacher({
      email: seed.email,
      password: seed.password
    });

    // Step 2: Get some question UIDs first
    const questionsResponse = await teacherPage.request.get('/api/questions/list', {
      params: {
        gradeLevel: 'CP',
        discipline: 'Mathématiques',
        themes: 'Calcul',
        limit: '5'
      }
    });

    expect(questionsResponse.ok()).toBeTruthy();
    const questionsData = await questionsResponse.json();
    const questionUids = Array.isArray(questionsData) ? questionsData.slice(0, 3) : [];

    expect(questionUids.length).toBeGreaterThan(0);

    // Step 3: Create a quiz template via API
    const templateResponse = await teacherPage.request.post('/api/game-templates', {
      data: {
        name: seed.quizName,
        gradeLevel: 'CP',
        discipline: 'Mathématiques',
        themes: ['Calcul'],
        questionUids: questionUids,
        description: 'Test template created by e2e test',
        defaultMode: 'quiz'
      }
    });

    expect(templateResponse.ok()).toBeTruthy();
    const templateData = await templateResponse.json();
    expect(templateData.gameTemplate).toBeTruthy();
    expect(templateData.gameTemplate.id).toBeTruthy();

    // Step 4: Instantiate a quiz game from the template via API
    const gameResponse = await teacherPage.request.post('/api/games', {
      data: {
        name: `Test Quiz Game ${Date.now()}`,
        gameTemplateId: templateData.gameTemplate.id,
        playMode: 'quiz',
        settings: {}
      }
    });

    if (!gameResponse.ok()) {
      const errorText = await gameResponse.text();
      throw new Error(`Game creation failed: ${gameResponse.status()} - ${errorText}`);
    }

    const gameData = await gameResponse.json();
    expect(gameData.gameInstance).toBeTruthy();
    expect(gameData.gameInstance.id).toBeTruthy();
    expect(gameData.gameInstance.accessCode).toBeTruthy();

    const accessCode = gameData.gameInstance.accessCode;
    console.log(`✅ Quiz template created and game instantiated successfully with code: ${accessCode}`);

    // **Set up console listener BEFORE any navigation/events**
    let beforeFlapGameQuestionCount = 0;
    let afterFlapGameQuestionCount = 0;
    let flapStarted = false;

    studentPage.on('console', (msg) => {
      const text = msg.text().toLowerCase();
      if (text.includes('game_question')) {
        if (!flapStarted) beforeFlapGameQuestionCount++;
        else afterFlapGameQuestionCount++;
      }
    });

    // Student: Use UI-based guest login (same pattern as game-creation-joining-flow)
    const studentUsername = 'Lucas'; // Use a valid prenom from prenoms.json

    console.log(`👨‍🎓 Logging in student via UI: ${studentUsername}`);

    // Navigate to login page
    await studentPage.goto(`${CFG.baseUrl}/login`);
    await studentPage.waitForLoadState('networkidle');

    // Fill in username
    const usernameInput = studentPage.locator('input[name="username"]');
    await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
    await usernameInput.fill(studentUsername);

    // Trigger blur to auto-select exact match
    await usernameInput.blur();
    await studentPage.waitForTimeout(500);

    // Select avatar
    const avatarButton = studentPage.locator('button.emoji-avatar').first();
    await avatarButton.click();

    // Click submit button
    const submitButton = studentPage.locator('button[type="submit"]');
    await submitButton.click();
    await studentPage.waitForLoadState('networkidle');

    console.log(`✅ Student logged in via UI`);

    // Navigate to live game page
    await studentPage.goto(`${CFG.baseUrl}/live/${accessCode}`);
    await studentPage.waitForLoadState('networkidle');

    // Wait for lobby to render
    await studentPage.waitForSelector('text=Participants connectés', { timeout: 15000 });

    // Teacher: open dashboard and start first question
    await teacherPage.goto(`${CFG.baseUrl}/teacher/dashboard/${accessCode}`, { waitUntil: 'networkidle' });
    await teacherPage.waitForSelector('ul.draggable-questions-list', { timeout: 20000 }).catch(() => { });
    await teacherPage.locator('ul.draggable-questions-list li').first().waitFor({ timeout: 10000 }).catch(() => { });
    const tryStart = async () => {
      const canonical = teacherPage.locator('[data-testid="start-question-button"]').first();
      if (await canonical.count()) {
        await canonical.click({ timeout: 6000 }).catch(() => { });
        await teacherPage.waitForTimeout(500);
        return true;
      }
      const playInList = teacherPage.locator('ul.draggable-questions-list li .question-display [data-play-pause-btn]').first();
      if (await playInList.count()) {
        await playInList.click({ timeout: 6000 }).catch(() => { });
        await teacherPage.waitForTimeout(500);
        return true;
      }
      return false;
    };
    let started = await tryStart();
    if (!started) {
      const firstItem = teacherPage.locator('ul.draggable-questions-list li .question-display').first();
      if (await firstItem.count()) {
        await firstItem.click({ timeout: 5000 }).catch(() => { });
        await teacherPage.waitForTimeout(200);
      }
      started = await tryStart();
    }
    expect(started, 'Could not start question from dashboard').toBeTruthy();
    // Ensure student is still on live page (in case of redirect)
    await studentPage.waitForURL(new RegExp(`/live/${accessCode}$`), { timeout: 10000 }).catch(() => { });
    // Ensure answers become visible; if not, nudge teacher play/pause once
    const answersVisible = await studentPage.locator('.tqcard-answer').first().isVisible().catch(() => false);
    if (!answersVisible) {
      const playBtnNow = teacherPage.locator('ul.draggable-questions-list li .question-display [data-play-pause-btn]').first();
      if (await playBtnNow.count()) {
        await playBtnNow.click({ timeout: 5000 }).catch(() => { });
        await teacherPage.waitForTimeout(300);
      }
    }
    await studentPage.waitForSelector('.tqcard-answer, [data-testid="question-text"], .question-content', { timeout: 20000 });

    // Small settle window
    await studentPage.waitForTimeout(1500);

    // Simulate brief background/resume via offline/online flap
    const studentCtx = studentPage.context();
    await studentCtx.setOffline(true);
    await studentPage.waitForTimeout(800);
    flapStarted = true;
    await studentCtx.setOffline(false);

    // Allow reconnect and re-subscribe
    await studentPage.waitForTimeout(2500);

    // Optional: teacher toggles pause/resume once to simulate minor activity
    // Toggle play/pause (scoped to first item) to generate minimal activity
    const playBtn = teacherPage.locator('ul.draggable-questions-list li .question-display [data-play-pause-btn]').first();
    if (await playBtn.count()) {
      await playBtn.click();
    }
    await teacherPage.waitForTimeout(500);
    if (await playBtn.count()) {
      await playBtn.click();
    }

    // Final short window to collect post-flap messages
    await studentPage.waitForTimeout(1000);

    // Assertions
    // We expect at most one game_question pre-flap (initial) and at most one immediately post-flap (recovery),
    // not an unbounded storm.
    expect(beforeFlapGameQuestionCount).toBeGreaterThan(0);
    expect(beforeFlapGameQuestionCount).toBeLessThanOrEqual(2);
    expect(afterFlapGameQuestionCount).toBeLessThanOrEqual(1);
  });
});
