A few things need to be fixed on the UI.

3. ✅ **FIXED**: When, on live/[code] page, a student clicks on an answer too late, the UI now correctly reverts to the previously selected answer (if any) or unselects everything if none was selected before. The error message is shown and the UI state properly reflects the accepted answer.
   - **Implementation**: Added state management with `pendingAnswer` and `acceptedAnswers` tracking
   - **Error handling**: Socket error triggers reversion logic via `useEffect` on `socketError` + `socketErrorVersion`
   - **Bug fix (Oct 1, 2025)**: Fixed issue where numeric input was getting cleared after successful submission. Now only stores accepted answer without resetting UI state unnecessarily.
   - **Tests**: E2E tests validate numeric and multiple-choice answer reversion (`tests/e2e/numeric-answer-reversion.spec.ts`, `tests/e2e/multiple-choice-answer-reversion.spec.ts`)

4. On live/[code] page, if a student joins after during the phase where the answer is shown, it should give the same view as if he had not answered at all. Right now, the student don't see the correct answer.