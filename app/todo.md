A few things need to be fixed on the UI.

1. When a teacher accesses his dashboard for a quiz that has been completed (which he shouldn't be able to do from the UI, but still can happend after he clicks "Cloturer" button), we should have questions greyed out and not startable. We should stil be able to expand them to see statistics. But we shouldn't be able to click "play", edit timer, etc. Also it should say that the quiz is over, maybe give a link to the leaderboard, grey out "Cloturer" button, etc.

One issue i'm seeing is that the statistics are not available when i go to a completed quiz's dashboard : maybe the info has been lost by backend because it was stored in redis. This needs investigation. If no score are left, then we should maybe think about a new strategy (don't want to store in db, so we'll discuss it together).

2. When a teacher closes a quiz, we should also discuss what behaviour we want.

3. When, on live/[code] page, a student clicks on an answer too late, it still selects his answer (and shows the error message). I think it should go back to previously selected answer (if any) or unselect everything if none was selected before. Currently it selects the too-late answer, which is not very logical.

4. On live/[code] page, if a student joins after during the phase where the answer is shown, it should give the same view as if he had not answered at all. Right now, the student don't see the correct answer.