The timer creation in runDeferredQuestionSequence (in deferredTournamentFlow.ts) currently uses a custom key format:

However, the canonical timer service expects the key for deferred tournaments to be:

and all timer logic (start, get, pause) should go through the CanonicalTimerService.

To standardize and modernize:

Replace the custom timer creation logic in runDeferredQuestionSequence with a call to CanonicalTimerService.startTimer, passing the correct parameters for deferred mode.
Remove direct Redis set/get for timers in this flow.
Ensure all timer set/get actions use the canonical key and service.
Update logging to reflect the canonical key and service usage.