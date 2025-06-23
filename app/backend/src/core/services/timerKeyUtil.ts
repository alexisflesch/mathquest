// Canonical timer key construction for all tournament modes
// Usage: getTimerKey({ accessCode, userId, questionUid, attemptCount, isDeferred })

export interface TimerKeyParams {
    accessCode: string;
    userId: string;
    questionUid: string;
    attemptCount?: number;
    isDeferred?: boolean;
}

export function getTimerKey({ accessCode, userId, questionUid, attemptCount, isDeferred }: TimerKeyParams): string {
    if (isDeferred) {
        if (attemptCount == null) throw new Error('Deferred timer key requires attemptCount');
        return `mathquest:deferred:timer:${accessCode}:${userId}:${attemptCount}:${questionUid}`;
    }
    // Live/quiz mode
    return `mathquest:timer:${accessCode}:${questionUid}`;
}
