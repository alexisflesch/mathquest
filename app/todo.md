A few things need to be fixed on the UI.

1. COMPLETED: When a teacher accesses his dashboard for a quiz that has been completed (which he shouldn't be able to do from the UI, but still can happend after he clicks "Cloturer" button), we should have questions greyed out and not startable. We should stil be able to expand them to see statistics. But we shouldn't be able to click "play", edit timer, etc. Also it should say that the quiz is over, maybe give a link to the leaderboard, grey out "Cloturer" button, etc.

   NEW APPROACH: Instead of trying to persist statistics (too complex), implement:
   - On page load for completed quiz: redirect to leaderboard
   - When teacher closes quiz: grey out controls and show completion message with leaderboard link

2. When a teacher closes a quiz, we should also discuss what behaviour we want.

3. When, on live/[code] page, a student clicks on an answer too late, it still selects his answer (and shows the error message). I think it should go back to previously selected answer (if any) or unselect everything if none was selected before. Currently it selects the too-late answer, which is not very logical.

4. On live/[code] page, if a student joins after during the phase where the answer is shown, it should give the same view as if he had not answered at all. Right now, the student don't see the correct answer.