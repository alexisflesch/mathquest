- Refactored CanonicalTimerService to use canonical getTimerKey utility for all timer key construction (2025-06-23)
    - All timer key construction is now DRY and unified
    - No legacy timer key logic remains in CanonicalTimerService
- Investigated root cause of missing time penalties in deferred tournaments (2025-06-23)
    - Found that isDiffered flag is only set in handler context, not in DB
    - ScoringService fetches gameInstance from DB, so isDiffered is always false at scoring time
    - Decided to refactor scoring logic to accept isDeferred override from handler context
    - Next: Patch call chain and validate with logs
- Projection now receives the same canonical question payload as the live room, on every question change (2025-06-23)
    - setQuestionHandler emits full filtered question object and timer to both live and projection rooms
    - Legacy projection question event (UID/timer only) replaced with full payload
    - All payloads use canonical shared types and are Zod-validated
