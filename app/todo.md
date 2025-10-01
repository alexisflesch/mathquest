A few things need to be fixed on the UI.

3. ✅ **FIXED**: When, on live/[code] page, a student clicks on an answer too late, the UI now correctly reverts to the previously selected answer (if any) or unselects everything if none was selected before. The error message is shown and the UI state properly reflects the accepted answer.
   - **Implementation**: Added state management with `pendingAnswer` and `acceptedAnswers` tracking
   - **Error handling**: Socket error triggers reversion logic via `useEffect` on `socketError` + `socketErrorVersion`
   - **Bug fix (Oct 1, 2025)**: Fixed issue where numeric input was getting cleared after successful submission. Now only stores accepted answer without resetting UI state unnecessarily.
   - **Tests**: E2E tests validate numeric and multiple-choice answer reversion (`tests/e2e/numeric-answer-reversion.spec.ts`, `tests/e2e/multiple-choice-answer-reversion.spec.ts`)

4. 🔍 **INVESTIGATED**: On live/[code] page, if a student joins after during the phase where the answer is shown, it should give the same view as if he had not answered at all. Right now, the student don't see the correct answer.
   - **Status**: Bug reproduced and documented but not yet fixed
   - **Investigation**: Created test files and reproduction plan (`tests/e2e/late-join-reproduction-plan.md`)
   - **Root cause**: Late-joining students likely receive incomplete initial state and miss socket events from before they joined
   - **Expected behavior**: Late-joining student should see question + correct answer highlighted (same as student who was present but didn't answer)
   - **Current behavior**: Late-joining student doesn't see the correct answer
   - **Next steps**: Manual verification → targeted fix in live page state initialization