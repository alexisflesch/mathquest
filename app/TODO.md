# TODO & Refactor Checklist for MathQuest

## Timer & Tournament State Consistency
- [ ] Ensure all timer state transitions (play, pause, stop, edit) for tournaments go through `triggerTournamentTimerSet` (or `triggerTournamentPause` for pause)
- [ ] Remove any direct manual setting of `state.stopped` or direct emission of `tournament_question`/`tournament_set_timer` events outside these trigger functions
- [ ] For "play" (resume): always call `triggerTournamentTimerSet(io, code, timeLeft, true)`
- [ ] For "pause": always call `triggerTournamentPause(io, code, timeLeft)`
- [ ] For "stop": always call `triggerTournamentTimerSet(io, code, 0)`
- [ ] If classic tournaments (not quiz-linked) can be resumed from stopped, update their resume handler to use `triggerTournamentTimerSet(io, code, timeLeft, true)`

## Codebase Refactor
- [ ] Refactor duplicated logic in timerActionHandler, resumeHandler, and any other handler to use the above trigger functions
- [ ] Remove any manual state management for `state.stopped`, `state.paused`, etc. outside the trigger functions
- [ ] Ensure all event emission for timer state (`tournament_set_timer`, `tournament_question`, etc.) is handled only in the trigger functions

## Documentation & Comments
- [ ] Add or update header comments in all timer/tournament-related files to explain their purpose and main logic
- [ ] Add inline comments where logic is non-obvious, especially around timer state transitions

## Testing & Validation
- [ ] Test the following flows for both quiz-linked and classic tournaments:
    - Start → Stop → Edit timer → Play (timer restarts, answers accepted)
    - Start → Pause → Resume (timer resumes, answers accepted)
    - Start → Stop → Play (timer restarts, answers accepted)
    - Edit timer while running/paused (timer updates correctly)
- [ ] Test that students always see the correct timer state and can answer when allowed
- [ ] Test that backend never rejects answers when timer is running/active

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
