/**
 * Socket Type Guards
 * Type guards and safe event handlers for socket communications
 */
export declare function isTimerUpdatePayload(data: any): data is import('./socketEvents').TimerUpdatePayload;
export declare function createSafeEventHandler<T>(handler: (data: T) => void, typeGuard?: (data: any) => data is T, eventName?: string): (data: any) => void;
export declare function isGameJoinedPayload(data: any): data is import('./socketEvents').GameJoinedPayload;
export declare function isGameStateUpdatePayload(data: any): data is import('./socketEvents').GameStateUpdatePayload;
export declare function isErrorPayload(data: any): data is import('./socketEvents').ErrorPayload;
export declare function isQuestionData(data: any): data is import('./socketEvents').QuestionData;
export declare function isParticipantData(data: any): data is import('./core').ParticipantData;
export declare function validateEventPayload<T>(data: any, schema?: any): data is T;
export declare function isLiveQuestionPayload(data: any): data is import('./quiz/liveQuestion').LiveQuestionPayload;
export declare function isCorrectAnswersPayload(data: any): data is CorrectAnswersPayload;
export interface CorrectAnswersPayload {
    questionUid: string;
    correctAnswers: boolean[];
    explanation?: string;
}
