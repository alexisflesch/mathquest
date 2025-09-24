1. Add questions to test database and keep fixing tests under app/tests until all tests pass. If a test looks useless or outdated or redundant, remove it.


2. Complete e2e tests to cover the full user flow for all main features, that is :
    - tournament
    - practice
    - quiz

For each feature, cover:
    - starting a game
    - joining a game
    - playing through a full game
    - handling edge cases (disconnects, errors)
    - verifying correct scoring and results
For quiz, cover 
    - teacher changing questions
    - students joining mid-quiz
    - multiple students playing simultaneously
    - teacher stopping timer, showing results, etc...


This work is absolutely critical to ensure the app is stable and reliable. We need to be able to automatically test all main user flows end-to-end to catch regressions and bugs early.

    - re-use existing components wherever possible
    - no copy-pasting or re-implementing
    - take inspiration from existing working tests