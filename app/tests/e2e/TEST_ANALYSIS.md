# E2E Test Analysis & Execution Log

**Date**: 2025-10-27  
**Purpose**: Analyze working E2E tests to identify successful authentication patterns

## Quick Test Results

| Test File | Status | Notes |
|-----------|--------|-------|
| `quiz-flow.spec.ts` | ✅ PASS (3/3) | Uses TestDataHelper.createTeacher + LoginHelper.loginAsTeacher (API-based) |
| `comprehensive-full-flow.spec.ts` | ⚠️ PARTIAL (4/5) | 1 test failed on auth, uses guest auth |
| `live-quiz-flow.spec.ts` | ✅ PASS (1/1) | Uses GUEST authentication + page.evaluate fetch with credentials:'include' |
| `practice-mode.spec.ts` | ❌ FAIL (0/1) | loginAsAuthenticatedStudent fails - email input not visible |
| `late-joiners.spec.ts` | ⏭️ SKIP (0/4) | All tests skipped |
| `user-registration.spec.ts` | ⚠️ PARTIAL (7/10) | Some login/session tests fail |

## Key Findings: Working Authentication Patterns

### ✅ Pattern 1: API-Based Teacher Login (RECOMMENDED)

**Used by**: `quiz-flow.spec.ts`, `TestDataHelper`

```typescript
// Step 1: Create teacher via API
const dataHelper = new TestDataHelper(page);
const teacher = await dataHelper.createTeacher({
    username: 'test_teacher',
    email: 'teacher@test.com',
    password: 'TestPassword123!'
});

// Step 2: Login via API (sets cookies directly)
const loginHelper = new LoginHelper(page);
await loginHelper.loginAsTeacher({
    email: 'teacher@test.com',
    password: 'TestPassword123!'
});

// Step 3: Navigate to protected page
await page.goto('/dashboard');
```

**How it works**:
1. `LoginHelper.loginAsTeacher()` calls backend `/api/v1/auth/login` endpoint
2. Gets JWT token from response
3. Adds `teacherToken` cookie to browser context via `page.context().addCookies()`
4. Navigates to home page to verify login
5. **AVOIDS ALL UI INTERACTION** - no clicking, no form filling

**Why it works**:
- Direct cookie manipulation bypasses AuthProvider hydration timing
- Cookies are set before navigation
- No race conditions with React components

### ✅ Pattern 2: Guest Auth + Browser Fetch (RECOMMENDED for simple tests)

**Used by**: `live-quiz-flow.spec.ts`, `comprehensive-full-flow.spec.ts`

```typescript
// Step 1: Navigate to /login
await page.goto('/login');
await page.waitForLoadState('networkidle');

// Step 2: Fill guest form (NO email/password)
const usernameInput = page.locator('input[name="username"]');
await usernameInput.fill('TestUser');

// Step 3: Select avatar
const avatarButton = page.locator('button.emoji-avatar').first();
await avatarButton.click();

// Step 4: Submit
const submitButton = page.locator('button[type="submit"]');
await submitButton.click();

// Step 5: Wait for auth to complete
await page.waitForSelector('[data-testid="user-profile"]', { timeout: 15000 });

// Step 6: Make authenticated API calls using page.evaluate
const response = await page.evaluate(async (data) => {
    const result = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include' // CRITICAL: sends cookies
    });
    return result.json();
}, { name: 'Test Game', playMode: 'quiz' });
```

**Why it works**:
- Guest auth sets localStorage immediately (no JWT needed)
- AuthProvider hydrates from localStorage on client
- `page.evaluate()` runs in browser context where cookies are available
- `credentials: 'include'` ensures cookies are sent with fetch

### ❌ Pattern 3: Student Account Auth via UI (PROBLEMATIC)

**Attempted by**: `practice-mode.spec.ts`, `background-resume-dedupe.spec.ts`

```typescript
// This FAILS because:
// 1. Must switch to "Compte" tab
// 2. Email input visibility is flaky
// 3. Login redirect timing issues
// 4. AuthProvider hydration unpredictable

await loginHelper.loginAsAuthenticatedStudent({
    email: 'student@test.com',
    password: 'password'
});
```

**Why it fails**:
- UI-based login has timing issues
- Account tab switching is brittle
- AuthProvider async hydration causes page to return null
- Middleware can redirect before React components load

### ✅ Pattern 4: Student Account Auth via API (ALTERNATIVE)

**Should work** (based on LoginHelper.loginAsTeacher pattern):

```typescript
// Step 1: Create student via API
const student = await dataHelper.createStudent({
    username: 'test_student',
    email: 'student@test.com',
    password: 'TestPassword123!'
});

// Step 2: Login via backend API
const loginResponse = await page.request.post('http://localhost:3007/api/v1/auth/login', {
    data: { 
        email: 'student@test.com',
        password: 'TestPassword123!',
        role: 'STUDENT'
    }
});

const body = await loginResponse.json();
const authToken = body.authToken || body.token;

// Step 3: Set cookie manually
await page.context().addCookies([{
    name: 'authToken',
    value: authToken,
    domain: 'localhost',
    path: '/'
}]);

// Step 4: Navigate to protected page
await page.goto('/live/CODE123?e2e=1');
```

## Authentication Method Comparison

| Method | Speed | Reliability | Use Case | Issues |
|--------|-------|-------------|----------|--------|
| **API Teacher Login** | ⚡ Fast | 🟢 High | Teacher dashboard tests | None known |
| **Guest Auth + Fetch** | ⚡ Fast | 🟢 High | Simple gameplay tests | Limited permissions |
| **Student UI Login** | 🐌 Slow | 🔴 Low | N/A | Timing issues, flaky |
| **Student API Login** | ⚡ Fast | 🟡 Medium | Student gameplay tests | Needs e2e bypass in LiveGamePage |

## Critical Implementation Details

### 1. E2E Bypass Query Parameter

Add `?e2e=1` to URLs to bypass some auth checks:

```typescript
await page.goto('/live/CODE123?e2e=1');
```

**What it bypasses**:
- ✅ Middleware redirect in `middleware.ts` (lines 39-47)
- ✅ useEffect redirect in `LiveGamePage.tsx` (lines 624-652)
- ❌ Early return in `LiveGamePage.tsx` (lines 654-657) - **NOT BYPASSED!**

### 2. Using page.evaluate() for API Calls

**DO THIS** (works with cookies):
```typescript
const result = await page.evaluate(async (data) => {
    const res = await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include' // REQUIRED
    });
    return res.json();
}, payloadData);
```

**DON'T DO THIS** (cookies not automatically sent):
```typescript
const result = await page.request.post('/api/endpoint', {
    data: payloadData
});
```

### 3. Cookie Domain Configuration

```typescript
await page.context().addCookies([{
    name: 'authToken',
    value: token,
    domain: 'localhost', // MUST be 'localhost', not '127.0.0.1'
    path: '/',
    httpOnly: true,
    secure: false, // false for localhost
    sameSite: 'Lax'
}]);
```

### 4. Waiting for Auth Hydration

For guest auth (localStorage-based):
```typescript
// Wait for UI element that confirms auth loaded
await page.waitForSelector('[data-testid="user-profile"]', { timeout: 15000 });
```

For student/teacher auth (cookie-based):
```typescript
// Verify not redirected to login
await page.waitForURL(/^(?!.*\/login)/, { timeout: 5000 });

// Or check for logout button
await expect(page.locator('button:has-text("Déconnexion")')).toBeVisible();
```

## Test Helper Classes

### TestDataHelper

**Location**: `tests/e2e/helpers/test-helpers.ts`

**Key Methods**:
- `createTeacher()` - Creates teacher via backend API
- `createStudent()` - Creates student via backend API
- `generateTestData()` - Generates unique usernames/emails
- `createMultipleStudents()` - Batch student creation

### LoginHelper

**Location**: `tests/e2e/helpers/test-helpers.ts`

**Key Methods**:
- `loginAsTeacher()` - **RECOMMENDED** API-based teacher login
- `loginAsAuthenticatedStudent()` - ⚠️ UI-based, flaky
- `loginAsGuest()` - Guest UI login

## Common Pitfalls & Solutions

### ❌ Problem: Page returns null even with valid auth

**Cause**: LiveGamePage early return (lines 654-657) has no e2e bypass

**Solution**: Use guest auth OR add e2e bypass to LiveGamePage:
```typescript
// In LiveGamePage.tsx
const searchParams = useSearchParams();
const e2eBypass = searchParams.get('e2e') === '1';

if (!e2eBypass && (userState === 'anonymous' || !userProfile.username)) {
    return null;
}
```

### ❌ Problem: extraHTTPHeaders don't work in tests

**Cause**: Playwright `extraHTTPHeaders` only apply to fetch/XHR, not browser navigation

**Solution**: Use query parameters (?e2e=1) or cookies instead

### ❌ Problem: Student can't join game room

**Cause**: AuthProvider hasn't hydrated yet, userState still 'anonymous'

**Solution**: 
1. Use guest auth instead of student accounts
2. OR wait for auth: `await page.waitForSelector('[data-testid="user-profile"]')`
3. OR add e2e bypass to LiveGamePage early return

### ❌ Problem: "Authentication required" errors

**Cause**: Cookies not sent with API requests

**Solution**: Use `page.evaluate()` with `credentials: 'include'`

## Recommended Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { TestDataHelper, LoginHelper } from './helpers/test-helpers';

test.describe('My Feature', () => {
    let teacherPage: Page;
    let studentPage: Page;
    let testData: any;

    test.beforeAll(async ({ browser }) => {
        // Create separate contexts for isolation
        teacherPage = await browser.newContext().then(ctx => ctx.newPage());
        studentPage = await browser.newContext().then(ctx => ctx.newPage());

        // Generate unique test data
        const dataHelper = new TestDataHelper(teacherPage);
        testData = dataHelper.generateTestData('my_feature');
    });

    test.afterAll(async () => {
        await teacherPage?.close();
        await studentPage?.close();
    });

    test('Teacher creates game', async () => {
        const dataHelper = new TestDataHelper(teacherPage);
        const loginHelper = new LoginHelper(teacherPage);

        // Create and login teacher (API-based)
        await dataHelper.createTeacher(testData);
        await loginHelper.loginAsTeacher({
            email: testData.email,
            password: testData.password
        });

        // Create game via API using page.evaluate
        const game = await teacherPage.evaluate(async (data) => {
            const res = await fetch('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include'
            });
            return res.json();
        }, { name: 'Test Game', playMode: 'quiz' });

        expect(game.gameInstance.accessCode).toBeTruthy();
    });

    test('Student joins game', async () => {
        // Use GUEST auth for students (more reliable)
        await studentPage.goto('/login');
        await studentPage.locator('input[name="username"]').fill('TestStudent');
        await studentPage.locator('button.emoji-avatar').first().click();
        await studentPage.locator('button[type="submit"]').click();
        
        // Wait for auth
        await studentPage.waitForSelector('[data-testid="user-profile"]');

        // Navigate to game
        await studentPage.goto(`/live/${testData.accessCode}`);
        
        // Verify joined
        await expect(studentPage.locator('text=Participants connectés')).toBeVisible();
    });
});
```

## Next Steps

1. ✅ Document working patterns (this file)
2. ⏳ Fix `background-resume-dedupe.spec.ts` using API-based student login
3. ⏳ Add e2e bypass to LiveGamePage early return
4. ⏳ Update failing tests to use working patterns
5. ⏳ Create comprehensive E2E testing guide (README.md)
