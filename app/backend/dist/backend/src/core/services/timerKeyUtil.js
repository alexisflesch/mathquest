"use strict";
// Canonical timer key construction for all tournament modes
// Usage: getTimerKey({ accessCode, userId, questionUid, attemptCount, isDeferred })
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimerKey = getTimerKey;
function getTimerKey({ accessCode, userId, questionUid, attemptCount, isDeferred }) {
    if (isDeferred) {
        if (attemptCount == null)
            throw new Error('Deferred timer key requires attemptCount');
        return `mathquest:deferred:timer:${accessCode}:${userId}:${attemptCount}:${questionUid}`;
    }
    // Live/quiz mode
    return `mathquest:timer:${accessCode}:${questionUid}`;
}
