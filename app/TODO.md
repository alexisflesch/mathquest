# TODO & Refactor Checklist for MathQuest

## Outstanding Issue: Teacher Dashboard Unauthorized State

- [ ] **BUG: Unauthorized access when directly loading dashboard/[quizid]**
    - **Description:** If a teacher directly navigates to the dashboard for a quiz (e.g., via hard refresh or direct URL entry), the server does not recognize the teacher's socket as the authorized controller for that quiz. This is because the `join_quiz` socket event is not emitted, so `quizState[quizId]` is not initialized and `profSocketId` is not set. As a result, all control actions (set question, pause, play, etc.) are rejected as "unauthorized".
    - **Symptoms:**
        - Server logs show warnings like:
          `[SetQuestionHandler] [SetQuestion] Unauthorized access for quiz ... from socket ...`
          `[PauseQuizHandler] [PauseQuiz] Unauthorized attempt for quiz ... from socket ...`
        - Dashboard controls do not work until the page is reloaded in a way that triggers the join event, or the server state is reset.
    - **Root Cause:**
        - The frontend does not always emit the `join_quiz` event on dashboard load, especially after a direct navigation or hard refresh.
        - The server relies on this event to set up the quiz state and register the teacher's socket as the authorized controller.
    - **Resolution Plan:**
        - Ensure the frontend always emits `join_quiz` as soon as the dashboard loads and the socket is connected, before any control actions are possible.
        - Optionally, improve server-side error messages to prompt the teacher to reload or rejoin if unauthorized.

## General Best Practices
- [ ] Keep all files <500 lines where possible
- [ ] Use centralized logger for all server-side logging
- [ ] Update README.md with any technical changes or additions
- [ ] Use only globals.css for styling, never hardcode styles/colors in components
- [ ] Follow industry best practices for all implementation choices

## Further Suggestions
- [ ] Consider adding automated tests for timer/tournament state transitions
- [ ] Consider adding Redis or another persistence layer for tournament/quiz state for production reliability
- [ ] Review all socket event flows for consistency and maintainability
