# E2E Test Failures - TODO List (June 3, 2025)

This document tracks the current end-to-end (E2E) test failures in the MathQuest app and provides a checklist for investigation and resolution. Update this file as issues are fixed or new failures are discovered.

## Summary
- **Test run date:** 2025-06-03
- **Total E2E tests failed:** 6 (down from 8 originally!)
- **Total E2E tests passed:** 28

## Recently Fixed Issues
- ✅ **Basic Auth Flow**: Fixed student form selectors (`pseudo` → `username`)
- ✅ **Navigation Analysis**: Fixed selector ambiguity for "Se connecter" button
- ✅ **Landing Page**: Updated to use unified login system (`/login?mode=student|teacher|guest`)
- ✅ **Old Login Pages**: Redirected `/student` and `/teacher` pages to unified login
- ✅ **Test Helpers**: Updated `loginAsStudent` and `loginAsTeacher` to use unified login flow

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
