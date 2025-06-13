# E2E Test Status and Progress - TODO List (June 2025)

This document tracks the current end-to-end (E2E) test status in the MathQuest app and provides a checklist for investigation and resolution. Update this file as issues are fixed or new failures are discovered.

## Summary
- **Test run date:** June 2025 (Latest)
- **Total E2E tests:** 28
- **Tests passed:** 22 ✅
- **Tests failed:** 6 ❌ 
- **Pass rate:** 78.6%
- **Timeout configuration:** Reduced to 3 seconds for faster feedback

## Major Improvements Completed
- ✅ **Timeout Configuration**: Reduced Playwright timeouts to 3 seconds for tests and expect assertions
- ✅ **Basic Connectivity**: Fixed selector ambiguity for "Enseignant" button using role-based selectors
- ✅ **Basic Auth Flow**: Updated login flow expectations to match actual app behavior
  - Fixed button text expectations ('Se connecter' vs 'Se connecter ou jouer en invité')
  - Removed incorrect URL expectation (/login) since login form appears inline
  - Added proper mode selection handling ("Invité" and "Compte" buttons)
  - Fixed student form selectors to use `getByRole('textbox')` and correct button text
- ✅ **Auth Test Helper**: Updated LoginHelper to handle new authentication flow
  - Added navigation to login page first
  - Added mode button selection (Compte/Invité)
  - Updated selectors for new auth flow
- ✅ **Navigation Test**: Fixed selector specificity using `getByRole('button', { name: 'Se connecter' })`
- ✅ **UI Cleanup**: Removed outdated checks for non-existent Teacher/Student role buttons from landing page
- ✅ **Route Cleanup**: Removed all references to deprecated pages: `/teacher/home`, `/teacher/login`, `/teacher/signup`, `/student/home` from all E2E tests and helpers. All tests now align with the current app routes and UI.

## Code Changes Made
- **Playwright Config**: Added `timeout: 3000` and `expect: { timeout: 3000 }`
- **LoginHelper**: Enhanced with proper navigation and mode selection
- **Test Selectors**: Migrated from text-based to role-based selectors for better specificity
- **Auth Flow Tests**: Updated to match inline login behavior instead of URL navigation expectations
- **Landing Page Tests**: Removed checks for deprecated UI elements
- **Route Cleanup**: All E2E tests and helpers updated to remove references to `/teacher/home`, `/teacher/login`, `/teacher/signup`, `/student/home`

## Failing Tests (as of last run)

1. **Late-Joiners E2E**
   - File: `tests/e2e/late-joiners.spec.ts`
   - Scenario: "Late-joiners: Different scenarios for joining after session starts"
   - Notes: Investigate join logic and session state handling.
2. ~~**Navigation Analysis**~~ ✅ **FIXED**
   - File: `tests/e2e/navigation-test.spec.ts`
   - Scenario: "Understand app navigation flow"
   - Notes: Fixed selector ambiguity by using specific button selector instead of ambiguous text.
3. **Practice Mode E2E**
   - File: `tests/e2e/practice-mode.spec.ts`
   - Scenario: "Practice Mode: Self-paced learning with feedback"
   - Notes: `[data-testid="practice-mode-selection"]` not found; check UI and test alignment.
4. **Complete Quiz Flow E2E**
   - File: `tests/e2e/quiz-flow.spec.ts`
   - Scenario: "Complete quiz flow: teacher creates quiz → students join → real-time gameplay → results"
   - Notes: Timeout waiting for dashboard/main content; check for missing/renamed elements.
5. **Teacher Timer Controls E2E**
   - File: `tests/e2e/teacher-timer-controls.spec.ts`
   - Scenario: "Teacher Timer Controls: Pause, resume, extend, and manual advance"
   - Notes: Timer controls not found or not visible; check UI rendering and test selectors.
6. **Tournament Deferred Mode E2E**
   - File: `tests/e2e/tournament-deferred.spec.ts`
   - Scenario: "Deferred Tournament: Students join and complete at different times"
   - Notes: Issues with deferred join/complete logic or UI feedback.
7. **Tournament Mode E2E**
   - File: `tests/e2e/tournament-mode.spec.ts`
   - Scenario: "Tournament Mode: Multiple students compete with real-time leaderboard"
   - Notes: Leaderboard or real-time updates not matching expectations.

---

## Next Steps
- [ ] **Legacy Socket Code Review**: Search frontend codebase for legacy socket connection code that may still be trying to connect to old unified backend. During the backend rewrite, the codebase was split into separate backend and frontend, so ensure all socket connections now properly connect to the new backend service rather than assuming a unified codebase.
- [ ] **Legacy Code Review 2**: update legacy auth methode to use the new auth flow and remove any old auth logic.
- [ ] Investigate each failing test scenario and document root causes.
- [ ] Align test selectors and expectations with current UI implementation.
- [ ] Fix application or test code as needed.
- [ ] Update this file as issues are resolved.

---

**See also:**
- [Main documentation](../README.md)
- [AI Agent Coding Guidelines](../../README.md)

---

*This file is auto-generated and should be kept up to date as E2E test status changes.*
