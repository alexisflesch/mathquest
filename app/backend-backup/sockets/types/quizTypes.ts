/**
 * TypeScript definitions for Quiz-related data structures
 * Now using shared types from shared/types
 */

import {
    Question as SharedQuestion,
    Answer as SharedQuestionOptionAnswer // Represents an answer option within a question
} from '@shared/types/quiz/question';

import {
    ExtendedQuizState as BaseSharedQuizState,
    Chrono as SharedChrono,
    QuestionTimer as SharedQuestionTimer
} from '@shared/types/quiz/state';

// Re-export shared types that don't need backend-specific versions for their primary structure
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
    name?: string; // Or username, ensure consistency with how it's used
    score: number;  // Total accumulated score for the quiz
    socketId?: string; // Optional: if direct socket mapping is stored here
}

/**
 * Backend-specific Quiz Answer Data.
 * This structure holds the raw answer submitted by a participant and the results after scoring.
 * Fields are populated progressively.
 */
export type BackendQuizAnswer = {
    questionUid: string; // UID of the question this answer pertains to
    questionType?: string; // Type of the question (QCU, QCM, LIBRE, etc.) from Question.defaultMode

    // Raw data from client/initial storage
    answer?: number | number[] | string; // The raw answer value (e.g., index, text)
    clientTimestamp?: number;         // Timestamp from client when answer was submitted
    serverReceiveTime?: number;       // Timestamp when server received the answer

    // Data added after scoring by closeQuestionHandler
    value?: string | string[];   // The processed textual value of the answer (e.g., text of selected choice)
    timeMs?: number;             // Calculated time taken in milliseconds for the answer
    isCorrect?: boolean;         // Overall correctness for this question
    score?: number;              // Normalized score awarded for this question
    baseScore?: number;          // Score before any time penalty was applied
    timePenalty?: number;        // The amount of penalty deducted for time
};

/**
 * Backend-specific QuizState: Extends the shared ExtendedQuizState.
 * It uses backend-specific types for participants and their answers to include scoring details.
 */
export type QuizState = Omit<BaseSharedQuizState, 'participants' | 'answers' | 'questions'> & {
    questions: Question[]; // Ensure this uses the correctly imported Question type
    participants?: {
        [participantId: string]: BackendQuizParticipant;
    };
    answers?: {
        [participantId: string]: {
            [questionUid: string]: BackendQuizAnswer;
        };
    };
    questionStart?: number; // Timestamp when the current question was sent/started, crucial for timeMs calculation
    // Inherits other fields like currentQuestionUid, lockedQuestions, tournament_code, etc., from BaseSharedQuizState
};

/**
 * Global quiz state container for all active quizzes on the server.
 */
export interface QuizStateContainer {
    [quizId: string]: QuizState; // Each quizId maps to a backend-specific QuizState
    wrapWithLogger?: any; // For compatibility with existing logger wrapping utility
}
