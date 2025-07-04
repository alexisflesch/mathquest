# GameInstance Deletion Modernization

## Phase 1: Redis Cleanup on GameInstance Deletion

### Goal
Ensure all Redis state for a game instance is deleted when the instance is deleted.

### Checklist
- [x] Audit all Redis key patterns related to gameInstance/accessCode
- [x] Confirm all patterns in codebase (including lobby and explanation keys)
- [x] Update API endpoint to delete all Redis keys for a gameInstance
- [x] Factorize Redis cleanup logic for reuse (single util)
- [x] Update game template deletion to clean Redis for all related game instances
- [ ] Log this change in documentation
- [ ] Provide test/validation steps

### Redis Key Patterns to Delete
- mathquest:game:participants:{accessCode}
- mathquest:game:userIdToSocketId:{accessCode}
- mathquest:game:socketIdToUserId:{accessCode}
- mathquest:game:participantCount:{accessCode}
- mathquest:game:terminatedQuestions:{accessCode}
- mathquest:game:question_start:{accessCode}:*
- mathquest:explanation_sent:{accessCode}:*
- mathquest:game:answers:{accessCode}:*
- mathquest:lobby:{accessCode}

### Exit Criteria
- All Redis keys for a deleted gameInstance are removed.
- No legacy or orphaned Redis state remains after deletion.
- Change is documented and testable.
