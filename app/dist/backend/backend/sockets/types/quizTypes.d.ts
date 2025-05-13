/**
 * TypeScript definitions for Quiz-related data structures
 * Now using shared types from shared/types
 */
import { Question as SharedQuestion, Answer as SharedQuestionOptionAnswer } from '@shared/types/quiz/question';
import { ExtendedQuizState as BaseSharedQuizState, Chrono as SharedChrono, QuestionTimer as SharedQuestionTimer } from '@shared/types/quiz/state';
export type QuestionTimer = SharedQuestionTimer;
export type QuestionOptionAnswer = SharedQuestionOptionAnswer;
export type Question = SharedQuestion;
export type Chrono = SharedChrono;
/**
 * Backend-specific Quiz Participant Data.
 * This holds the participant's identity and their total score.
 */
export interface BackendQuizParticipant {
    id: string;
    name?: string;
    score: number;
    socketId?: string;
}
/**
 * Backend-specific Quiz Answer Data.
 * This structure holds the raw answer submitted by a participant and the results after scoring.
 * Fields are populated progressively.
 */
export type BackendQuizAnswer = {
    questionUid: string;
    questionType?: string;
    answer?: number | number[] | string;
    clientTimestamp?: number;
    serverReceiveTime?: number;
    value?: string | string[];
    timeMs?: number;
    isCorrect?: boolean;
    score?: number;
    baseScore?: number;
    timePenalty?: number;
};
/**
 * Backend-specific QuizState: Extends the shared ExtendedQuizState.
 * It uses backend-specific types for participants and their answers to include scoring details.
 */
export type QuizState = Omit<BaseSharedQuizState, 'participants' | 'answers' | 'questions'> & {
    questions: Question[];
    participants?: {
        [participantId: string]: BackendQuizParticipant;
    };
    answers?: {
        [participantId: string]: {
            [questionUid: string]: BackendQuizAnswer;
        };
    };
    questionStart?: number;
};
/**
 * Global quiz state container for all active quizzes on the server.
 */
export interface QuizStateContainer {
    [quizId: string]: QuizState;
    wrapWithLogger?: any;
}
