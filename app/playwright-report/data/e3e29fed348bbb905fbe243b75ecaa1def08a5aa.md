# Test info

- Name: Late Join During Show Answers Phase >> should show correct answer to student joining during show_answers phase
- Location: /home/aflesch/mathquest/app/tests/e2e/late-join-show-answers.spec.ts:199:9

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/live/3815" until "load"
============================================================
    at /home/aflesch/mathquest/app/tests/e2e/late-join-show-answers.spec.ts:508:32
```

# Test source

```ts
  408 |             for (const selector of showAnswersSelectors) {
  409 |                 try {
  410 |                     const showButton = teacherPage.locator(selector).first();
  411 |                     if (await showButton.isVisible({ timeout: 1000 })) {
  412 |                         await showButton.click();
  413 |                         log(`✅ Clicked show answers button: ${selector}`);
  414 |                         answersShown = true;
  415 |                         break;
  416 |                     }
  417 |                 } catch (e) {
  418 |                     continue;
  419 |                 }
  420 |             }
  421 |
  422 |             if (!answersShown) {
  423 |                 log('⚠️ Could not find explicit "show answers" button, answers may show automatically after timer stops');
  424 |             }
  425 |
  426 |             await teacherPage.waitForTimeout(2000);
  427 |
  428 |             // Check if Student1 sees the correct answer
  429 |             log('🔍 Checking if Student1 sees correct answer...');
  430 |             const correctAnswerSelectors = [
  431 |                 '[data-testid="correct-answer"]',
  432 |                 '.correct-answer',
  433 |                 '[class*="correct"]',
  434 |                 'text=/réponse correcte/i',
  435 |                 'text=/correct answer/i'
  436 |             ];
  437 |
  438 |             let student1SeesCorrectAnswer = false;
  439 |             for (const selector of correctAnswerSelectors) {
  440 |                 const count = await student1Page.locator(selector).count();
  441 |                 if (count > 0) {
  442 |                     const text = await student1Page.locator(selector).first().textContent();
  443 |                     log(`✅ Student1 sees correct answer indicator: "${text}"`);
  444 |                     student1SeesCorrectAnswer = true;
  445 |                     break;
  446 |                 }
  447 |             }
  448 |
  449 |             // Take screenshot of Student1's view for reference
  450 |             await student1Page.screenshot({ path: 'test-results/e2e/student1-show-answers-view.png', fullPage: true });
  451 |             log('📸 Saved Student1 screenshot');
  452 |
  453 |             // Now Student2 joins DURING the show_answers phase
  454 |             log('👨‍🎓 Student2 joining DURING show_answers phase...');
  455 |             const student2Data = dataHelper.generateTestData('late_join_student2');
  456 |             await authenticateAsGuest(student2Page, student2Data.username);
  457 |             log('✅ Student2 authenticated as guest');
  458 |
  459 |             // Student2 joins the quiz - try joining directly without navigating to /student/join
  460 |             // since auth state might not persist across navigation
  461 |             log('Student2 attempting to join quiz directly...');
  462 |
  463 |             // First try to join by going directly to the live page with access code
  464 |             await student2Page.goto(`/live/${quizData.accessCode}`);
  465 |             await student2Page.waitForTimeout(2000);
  466 |
  467 |             // Check if we're already on the live page or need to authenticate
  468 |             const currentUrlStudent2 = student2Page.url();
  469 |             if (currentUrl.includes('/live/')) {
  470 |                 log('✅ Student2 joined quiz directly - already authenticated');
  471 |             } else {
  472 |                 // If not on live page, we need to authenticate and join
  473 |                 log('Student2 not on live page, trying join flow...');
  474 |                 await student2Page.goto('/student/join');
  475 |
  476 |                 // Re-check authentication state
  477 |                 const authCheckAfterNavigate = await student2Page.evaluate(() => {
  478 |                     const token = localStorage.getItem('studentToken') || sessionStorage.getItem('studentToken');
  479 |                     const user = localStorage.getItem('userProfile') || sessionStorage.getItem('userProfile');
  480 |                     return { hasToken: !!token, hasUser: !!user };
  481 |                 });
  482 |                 log(`Student2 auth state after navigate: token=${authCheckAfterNavigate.hasToken}, user=${authCheckAfterNavigate.hasUser}`);
  483 |
  484 |                 if (!authCheckAfterNavigate.hasToken || !authCheckAfterNavigate.hasUser) {
  485 |                     log('❌ Student2 lost authentication, re-authenticating...');
  486 |                     await authenticateAsGuest(student2Page, student2Data.username);
  487 |                     log('✅ Student2 re-authenticated as guest');
  488 |                 }
  489 |
  490 |                 await student2Page.fill('input[type="tel"], input[placeholder*="Code"]', quizData.accessCode);
  491 |                 log(`Student2 filled access code: "${quizData.accessCode}"`);
  492 |                 await student2Page.click('button:has-text("Rejoindre")');
  493 |                 log('Student2 clicked join button');
  494 |             }
  495 |
  496 |             // Debug: Check what happens after join button click
  497 |             await student2Page.waitForTimeout(2000);
  498 |             const currentUrlAfterJoin = student2Page.url();
  499 |             log(`Current URL after join click: ${currentUrlAfterJoin}`);
  500 |
  501 |             // Check for any error messages
  502 |             const errorMessagesStudent2 = await student2Page.locator('.error, .alert, [class*="error"]').allTextContents();
  503 |             if (errorMessagesStudent2.length > 0) {
  504 |                 log(`Found error messages: ${errorMessagesStudent2.join(', ')}`);
  505 |             }
  506 |
  507 |             // Verify student is on the live quiz page
> 508 |             await student2Page.waitForURL(`**/live/${quizData.accessCode}`, { timeout: 15000 });
      |                                ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  509 |             log('✅ Student2 joined quiz during show_answers phase');
  510 |
  511 |             // Wait for student page to fully load
  512 |             await student2Page.waitForLoadState('networkidle');
  513 |             await student2Page.waitForTimeout(3000);
  514 |
  515 |             // Check if Student2 sees the correct answer
  516 |             log('🔍 Checking if Student2 sees correct answer (THIS IS THE BUG)...');
  517 |             let student2SeesCorrectAnswer = false;
  518 |             for (const selector of correctAnswerSelectors) {
  519 |                 const count = await student2Page.locator(selector).count();
  520 |                 if (count > 0) {
  521 |                     const text = await student2Page.locator(selector).first().textContent();
  522 |                     log(`✅ Student2 sees correct answer indicator: "${text}"`);
  523 |                     student2SeesCorrectAnswer = true;
  524 |                     break;
  525 |                 }
  526 |             }
  527 |
  528 |             // Take screenshot of Student2's view
  529 |             await student2Page.screenshot({ path: 'test-results/e2e/student2-late-join-view.png', fullPage: true });
  530 |             log('📸 Saved Student2 screenshot');
  531 |
  532 |             // Get page content for debugging
  533 |             const student1Content = await student1Page.content();
  534 |             const student2Content = await student2Page.content();
  535 |             log(`Student1 page content length: ${student1Content.length}`);
  536 |             log(`Student2 page content length: ${student2Content.length}`);
  537 |
  538 |             // Report findings
  539 |             log('\n📊 TEST RESULTS:');
  540 |             log(`Student1 (did not answer) sees correct answer: ${student1SeesCorrectAnswer}`);
  541 |             log(`Student2 (joined late) sees correct answer: ${student2SeesCorrectAnswer}`);
  542 |
  543 |             if (student1SeesCorrectAnswer && !student2SeesCorrectAnswer) {
  544 |                 log('❌ BUG REPRODUCED: Student2 does NOT see correct answer when joining during show_answers phase');
  545 |                 log('Expected: Student2 should see the same view as Student1 (correct answer visible)');
  546 |                 log('Actual: Student2 does not see the correct answer');
  547 |             } else if (!student1SeesCorrectAnswer && !student2SeesCorrectAnswer) {
  548 |                 log('⚠️ Neither student sees correct answer - may need to verify show_answers logic');
  549 |             } else if (student2SeesCorrectAnswer) {
  550 |                 log('✅ Student2 DOES see correct answer - bug may already be fixed or test needs adjustment');
  551 |             }
  552 |
  553 |             // This test documents the current bug: Student2 does NOT see correct answer when joining during show_answers phase
  554 |             // When the bug is fixed, change this to expect(true)
  555 |             expect(student2SeesCorrectAnswer).toBe(false);
  556 |             log('✅ Test passed - Student2 correctly does NOT see correct answer (bug documented)');
  557 |
  558 |         } catch (error) {
  559 |             log('❌ Test failed:', error);
  560 |             // Take error screenshots
  561 |             await teacherPage.screenshot({ path: 'test-results/e2e/late-join-teacher-error.png' });
  562 |             await student1Page.screenshot({ path: 'test-results/e2e/late-join-student1-error.png' });
  563 |             await student2Page.screenshot({ path: 'test-results/e2e/late-join-student2-error.png' });
  564 |             throw error;
  565 |         } finally {
  566 |             // Cleanup
  567 |             log('🧹 Starting E2E test teardown...');
  568 |             await teacherContext.close();
  569 |             await student1Context.close();
  570 |             await student2Context.close();
  571 |         }
  572 |     });
  573 | });
  574 |
```