A few things need to be fixed on the UI.

1. On login page, one can :
   - enter a letter in username field (or incomplete firstname)
   - click outside the field (not on a username in dropdown)
   - choose a suffix
   - choose an avatar
   - login
This **should not be possible**. It isn't possible if no suffix is chosen by the way. Plus, the app is broken afterwards : user can't join anything, shows infinity spinner forever when trying to start a session. But user shouldn't have been let through. Meaning there are actually two issues here.

2. 🔍 **INVESTIGATED**: On live/[code] page, if a student joins after during the phase where the answer is shown, it should give the same view as if he had not answered at all. Right now, the student don't see the correct answer.
   - **Status**: Bug reproduced and documented but not yet fixed
   - **Investigation**: Created test files and reproduction plan (`tests/e2e/late-join-reproduction-plan.md`)
   - **Root cause**: Late-joining students likely receive incomplete initial state and miss socket events from before they joined
   - **Expected behavior**: Late-joining student should see question + correct answer highlighted (same as student who was present but didn't answer)
   - **Current behavior**: Late-joining student doesn't see the correct answer
   - **Next steps**: Manual verification → targeted fix in live page state initialization