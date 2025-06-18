/**
 * Socket Type Guards
 * Type guards and safe event handlers for socket communications
 */

// Type guard for timer updates
export function isTimerUpdatePayload(data: any): data is import('./socketEvents').TimerUpdatePayload {
    return data && typeof data === 'object' &&
        typeof data.timeRemaining === 'number' &&
        typeof data.gameAccessCode === 'string';
}

// Generic safe event handler creator
export function createSafeEventHandler<T>(
    handler: (data: T) => void,
    typeGuard?: (data: any) => data is T,
    eventName?: string
) {
    return (data: any) => {
        try {
            if (typeGuard && !typeGuard(data)) {
                console.warn(`Invalid data received for event ${eventName}:`, data);
                return;
            }
            handler(data);
        } catch (error) {
            console.error(`Error in socket event handler for ${eventName}:`, error);
        }
    };
}

// Additional type guards for common socket events
export function isGameJoinedPayload(data: any): data is import('./socketEvents').GameJoinedPayload {
    return data && typeof data === 'object' &&
        typeof data.gameId === 'string' &&
        typeof data.accessCode === 'string';
}

export function isGameStateUpdatePayload(data: any): data is import('./socketEvents').GameStateUpdatePayload {
    return data && typeof data === 'object' &&
        typeof data.gameState === 'object';
}

export function isErrorPayload(data: any): data is import('./socketEvents').ErrorPayload {
    return data && typeof data === 'object' &&
        typeof data.error === 'string';
}

// Type guard for question data
export function isQuestionData(data: any): data is import('./socketEvents').QuestionData {
    return data && typeof data === 'object' &&
        typeof data.uid === 'string' &&
        typeof data.text === 'string';
}

// Type guard for participant data
export function isParticipantData(data: any): data is import('./core').ParticipantData {
    return data && typeof data === 'object' &&
        typeof data.id === 'string' &&
        typeof data.username === 'string';
}

// Validate event payload
export function validateEventPayload<T>(data: any, schema?: any): data is T {
    if (schema && typeof schema.safeParse === 'function') {
        const result = schema.safeParse(data);
        return result.success;
    }
    return true; // Fallback for basic validation
}

// Type guard for live question payload
export function isLiveQuestionPayload(data: any): data is import('./quiz/liveQuestion').LiveQuestionPayload {
    return data && typeof data === 'object' &&
        typeof data.question === 'object';
}

// Type guard for correct answers payload
export function isCorrectAnswersPayload(data: any): data is CorrectAnswersPayload {
    return data && typeof data === 'object' &&
        typeof data.questionUid === 'string' &&
        Array.isArray(data.correctAnswers);
}

// Correct answers payload type
export interface CorrectAnswersPayload {
    questionUid: string;
    correctAnswers: boolean[];
    explanation?: string;
}
