# Test info

- Name: Practice Mode E2E >> Practice Mode: Self-paced learning with feedback
- Location: /home/aflesch/mathquest/app/tests/e2e/practice-mode.spec.ts:17:9

# Error details

```
TimeoutError: locator.waitFor: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Compte")').first() to be visible

    at LoginHelper.loginAsAuthenticatedStudent (/home/aflesch/mathquest/app/tests/e2e/helpers/test-helpers.ts:392:28)
    at /home/aflesch/mathquest/app/tests/e2e/practice-mode.spec.ts:30:13
```

# Test source

```ts
  292 |         }
  293 |
  294 |         // Switch to account login mode
  295 |         console.log('🔄 Switching to account login mode...');
  296 |
  297 |         // Debug: Check what buttons are available on the page
  298 |         const allButtons = await this.page.locator('button').all();
  299 |         console.log(`🔍 Found ${allButtons.length} buttons on the page:`);
  300 |         for (let i = 0; i < allButtons.length; i++) {
  301 |             const button = allButtons[i];
  302 |             const text = await button.textContent().catch(() => 'no-text');
  303 |             const className = await button.getAttribute('class').catch(() => 'no-class');
  304 |             console.log(`  Button ${i}: "${text}" (class: ${className})`);
  305 |         }
  306 |
  307 |         // Try multiple ways to find the account button
  308 |         let compteButton;
  309 |         try {
  310 |             compteButton = this.page.locator('button').filter({ hasText: 'Compte' });
  311 |             await compteButton.waitFor({ timeout: 1000 });
  312 |         } catch {
  313 |             // Fallback: look for button with Lock icon and Compte text
  314 |             compteButton = this.page.locator('button:has-text("Compte")');
  315 |             await compteButton.waitFor({ timeout: 1000 });
  316 |         }
  317 |         console.log('✅ Found Compte button, clicking...');
  318 |         await compteButton.click();
  319 |         console.log('✅ Clicked Compte button');
  320 |
  321 |         // Wait for the account form to appear and ensure we're in login mode
  322 |         console.log('⏳ Waiting for account form to load...');
  323 |         await this.page.waitForTimeout(2000);
  324 |
  325 |         // Check if the tab actually switched by looking for account-specific elements
  326 |         const accountFormVisible = await this.page.locator('input[name="email"]').isVisible().catch(() => false);
  327 |         console.log(`🔍 Account form visible after tab switch: ${accountFormVisible}`);
  328 |
  329 |         if (!accountFormVisible) {
  330 |             console.log('❌ Account form not visible, checking what inputs are actually present...');
  331 |             // Debug: Check what inputs are available
  332 |             const debugInputs = await this.page.locator('input').all();
  333 |             console.log(`🔍 Found ${debugInputs.length} input fields after clicking Compte`);
  334 |             for (let i = 0; i < debugInputs.length; i++) {
  335 |                 const input = debugInputs[i];
  336 |                 const name = await input.getAttribute('name').catch(() => 'no-name');
  337 |                 const type = await input.getAttribute('type').catch(() => 'no-type');
  338 |                 const id = await input.getAttribute('id').catch(() => 'no-id');
  339 |                 const placeholder = await input.getAttribute('placeholder').catch(() => 'no-placeholder');
  340 |                 console.log(`  Input ${i}: name="${name}", type="${type}", id="${id}", placeholder="${placeholder}"`);
  341 |             }
  342 |             throw new Error('Account form did not appear after clicking Compte tab');
  343 |         }
  344 |
  345 |         // Fill email field - use the exact name attribute that works
  346 |         console.log('📧 Filling email field...');
  347 |         const emailInput = this.page.locator('input[name="email"]');
  348 |         await emailInput.waitFor({ timeout: 5000, state: 'visible' });
  349 |         await emailInput.fill(credentials.email);
  350 |
  351 |         // Fill password field - use the exact name attribute that works
  352 |         console.log('� Filling password field...');
  353 |         const passwordInput = this.page.locator('input[name="password"]');
  354 |         await passwordInput.waitFor({ timeout: 5000, state: 'visible' });
  355 |         await passwordInput.fill(credentials.password);
  356 |
  357 |         // Click login button - try multiple selectors
  358 |         console.log('🚀 Clicking login button...');
  359 |         const loginButton = this.page.locator('button[type="submit"], button:has-text("Se connecter"), button:has-text("Connexion")').first();
  360 |         await loginButton.waitFor({ timeout: 3000 });
  361 |         await loginButton.click();
  362 |
  363 |         // Wait for successful login (redirect to home)
  364 |         const result = await Promise.race([
  365 |             this.page.waitForURL('/', { timeout: 10000 }).then(() => 'home'),
  366 |             this.page.waitForTimeout(10000).then(() => 'timeout')
  367 |         ]);
  368 |
  369 |         if (result === 'timeout') {
  370 |             throw new Error('Login failed: Timeout waiting for redirect after teacher login');
  371 |         }
  372 |
  373 |         console.log('✅ Teacher login successful');
  374 |     }
  375 |
  376 |     /**
  377 |      * Login as authenticated student with email/password
  378 |      */
  379 |     async loginAsAuthenticatedStudent(credentials: { email: string; password: string }): Promise<void> {
  380 |         console.log(`👨‍🎓 Logging in authenticated student: ${credentials.email}`);
  381 |
  382 |         await this.page.goto('/login');
  383 |         await this.page.waitForLoadState('networkidle');
  384 |
  385 |         // Wait for the page to be fully loaded
  386 |         console.log('⏳ Waiting for login page to stabilize...');
  387 |         await this.page.waitForTimeout(2000);
  388 |
  389 |         // Click the "Compte" button to switch to account login mode
  390 |         console.log('🔄 Clicking "Compte" button to switch to account mode...');
  391 |         const compteButton = this.page.locator('button:has-text("Compte")').first();
> 392 |         await compteButton.waitFor({ timeout: 5000, state: 'visible' });
      |                            ^ TimeoutError: locator.waitFor: Timeout 5000ms exceeded.
  393 |         console.log('✅ Found "Compte" button, clicking...');
  394 |         await compteButton.click();
  395 |         console.log('✅ Clicked "Compte" button');
  396 |
  397 |         // Wait for the account form to appear
  398 |         console.log('⏳ Waiting for account form to load...');
  399 |         await this.page.waitForTimeout(2000);
  400 |
  401 |         // Fill email field
  402 |         console.log('� Filling email field...');
  403 |         const emailInput = this.page.locator('input[name="email"], input[type="email"]').first();
  404 |         await emailInput.waitFor({ timeout: 5000, state: 'visible' });
  405 |         await emailInput.fill(credentials.email);
  406 |
  407 |         // Fill password field
  408 |         console.log('🔑 Filling password field...');
  409 |         const passwordInput = this.page.locator('input[name="password"], input[type="password"]').first();
  410 |         await passwordInput.waitFor({ timeout: 5000, state: 'visible' });
  411 |         await passwordInput.fill(credentials.password);
  412 |
  413 |         // Click login button
  414 |         console.log('🚀 Clicking login button...');
  415 |         const loginButton = this.page.locator('button[type="submit"], button:has-text("Se connecter"), button:has-text("Connexion")').first();
  416 |         await loginButton.waitFor({ timeout: 3000 });
  417 |         await loginButton.click();
  418 |
  419 |         // Wait for successful login (redirect to home)
  420 |         const result = await Promise.race([
  421 |             this.page.waitForURL('/', { timeout: 10000 }).then(() => 'home'),
  422 |             this.page.waitForTimeout(10000).then(() => 'timeout')
  423 |         ]);
  424 |
  425 |         if (result === 'timeout') {
  426 |             throw new Error('Login failed: Timeout waiting for redirect after authenticated student login');
  427 |         }
  428 |
  429 |         console.log('✅ Authenticated student login successful');
  430 |     }
  431 |
  432 |     /**
  433 |      * Login as guest student with username only
  434 |      */
  435 |     async loginAsGuestStudent(credentials: { username: string }): Promise<void> {
  436 |         console.log(`👨‍🎓 Logging in guest student: ${credentials.username}`);
  437 |
  438 |         await this.page.goto('/login');
  439 |         await this.page.waitForLoadState('networkidle');
  440 |
  441 |         await this.page.fill('[data-testid="username-input"]', credentials.username);
  442 |         await this.page.click('.avatar-option:first-child');
  443 |         await this.page.click('button[type="submit"]');
  444 |
  445 |         const result = await Promise.race([
  446 |             this.page.waitForURL('/', { timeout: 5000 }).then(() => 'home'),
  447 |             this.page.waitForTimeout(5000).then(() => 'timeout')
  448 |         ]);
  449 |
  450 |         if (result === 'timeout') {
  451 |             throw new Error('Login failed: Timeout waiting for redirect after guest login');
  452 |         }
  453 |
  454 |         console.log('✅ Guest student login successful');
  455 |     }
  456 |
  457 |     /**
  458 |      * Quick login with pre-created user data
  459 |      */
  460 |     async quickLogin(user: TestUser): Promise<void> {
  461 |         if (user.defaultMode === 'teacher' && user.email && user.password) {
  462 |             await this.loginAsTeacher({ email: user.email, password: user.password });
  463 |         } else if (user.defaultMode === 'student' && user.email && user.password) {
  464 |             await this.loginAsAuthenticatedStudent({ email: user.email, password: user.password });
  465 |         } else if (user.defaultMode === 'student') {
  466 |             await this.loginAsGuestStudent({ username: user.username });
  467 |         } else {
  468 |             throw new Error(`Invalid user data for login: ${JSON.stringify(user)}`);
  469 |         }
  470 |     }
  471 |
  472 |     /**
  473 |      * Logout current user
  474 |      */
  475 |     async logout(): Promise<void> {
  476 |         console.log('🚪 Logging out current user');
  477 |
  478 |         try {
  479 |             const logoutSelectors = [
  480 |                 'text=Déconnexion',
  481 |                 'text=Logout',
  482 |                 'text=Sign out',
  483 |                 '[data-testid="logout-button"]'
  484 |             ];
  485 |
  486 |             for (const selector of logoutSelectors) {
  487 |                 const element = this.page.locator(selector);
  488 |                 if (await element.count() > 0) {
  489 |                     await element.click();
  490 |                     await this.page.waitForLoadState('networkidle');
  491 |                     console.log('✅ Logout successful');
  492 |                     return;
```