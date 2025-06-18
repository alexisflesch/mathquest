"use strict";
/**
 * Socket Type Guards
 * Type guards and safe event handlers for socket communications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTimerUpdatePayload = isTimerUpdatePayload;
exports.createSafeEventHandler = createSafeEventHandler;
exports.isGameJoinedPayload = isGameJoinedPayload;
exports.isGameStateUpdatePayload = isGameStateUpdatePayload;
exports.isErrorPayload = isErrorPayload;
exports.isQuestionData = isQuestionData;
exports.isParticipantData = isParticipantData;
exports.validateEventPayload = validateEventPayload;
exports.isLiveQuestionPayload = isLiveQuestionPayload;
exports.isCorrectAnswersPayload = isCorrectAnswersPayload;
// Type guard for timer updates
function isTimerUpdatePayload(data) {
    return data && typeof data === 'object' &&
        typeof data.timeRemaining === 'number' &&
        typeof data.gameAccessCode === 'string';
}
// Generic safe event handler creator
function createSafeEventHandler(handler, typeGuard, eventName) {
    return (data) => {
        try {
            if (typeGuard && !typeGuard(data)) {
                console.warn(`Invalid data received for event ${eventName}:`, data);
                return;
            }
            handler(data);
        }
        catch (error) {
            console.error(`Error in socket event handler for ${eventName}:`, error);
        }
    };
}
// Additional type guards for common socket events
function isGameJoinedPayload(data) {
    return data && typeof data === 'object' &&
        typeof data.gameId === 'string' &&
        typeof data.accessCode === 'string';
}
function isGameStateUpdatePayload(data) {
    return data && typeof data === 'object' &&
        typeof data.gameState === 'object';
}
function isErrorPayload(data) {
    return data && typeof data === 'object' &&
        typeof data.error === 'string';
}
// Type guard for question data
function isQuestionData(data) {
    return data && typeof data === 'object' &&
        typeof data.uid === 'string' &&
        typeof data.text === 'string';
}
// Type guard for participant data
function isParticipantData(data) {
    return data && typeof data === 'object' &&
        typeof data.id === 'string' &&
        typeof data.username === 'string';
}
// Validate event payload
function validateEventPayload(data, schema) {
    if (schema && typeof schema.safeParse === 'function') {
        const result = schema.safeParse(data);
        return result.success;
    }
    return true; // Fallback for basic validation
}
// Type guard for live question payload
function isLiveQuestionPayload(data) {
    return data && typeof data === 'object' &&
        typeof data.question === 'object';
}
// Type guard for correct answers payload
function isCorrectAnswersPayload(data) {
    return data && typeof data === 'object' &&
        typeof data.questionUid === 'string' &&
        Array.isArray(data.correctAnswers);
}
