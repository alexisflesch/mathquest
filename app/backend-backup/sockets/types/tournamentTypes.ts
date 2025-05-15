/**
 * TypeScript definitions for Tournament-related data structures
 * Now using shared types from shared/types
 */
import {
    Participant as BaseParticipant,
    TournamentParticipant as BaseSharedTournamentParticipant,
    TournamentAnswer as BaseSharedTournamentAnswer,
    LeaderboardEntry as BaseLeaderboardEntry
} from '@shared/types/tournament/participant';

import {
    QuestionTimerState as BaseQuestionTimerState,
    QuestionState as BaseQuestionState,
    TournamentState as BaseSharedTournamentState,
    TournamentStateContainer as BaseSharedTournamentStateContainer
} from '@shared/types/tournament/state';

// Backend-specific TournamentAnswer: Extends the shared version with backend-only fields
export type TournamentAnswer = BaseSharedTournamentAnswer & {
    serverReceiveTime?: number; // Timestamp of when the server received/processed the answer
    // Ensure all other fields used in handleTimerExpiration (like value, timeMs, isCorrect, score, baseScore, timePenalty)
    // are present in BaseSharedTournamentAnswer or added here if backend-specific.
    // BaseSharedTournamentAnswer already includes:
    // questionUid?, answerIdx?, value?, clientTimestamp?, score?, timePenalty?, baseScore?, timeMs?, isCorrect?
};

// Backend-specific TournamentParticipant: Extends the shared version to use backend's TournamentAnswer
export type TournamentParticipant = Omit<BaseSharedTournamentParticipant, 'answers' | 'scoredQuestions'> & {
    answers?: TournamentAnswer[]; // Uses backend-specific TournamentAnswer for detailed answer list
    scoredQuestions?: Record<string, number>; // Assuming this stores the normalized score for each q
    // Inherits id, username, avatar, score, isDiffered, socketId from BaseParticipant via BaseSharedTournamentParticipant
};

// Backend-specific TournamentState: Extends the shared version to use backend-specific types for answers and participants
export type TournamentState = Omit<BaseSharedTournamentState, 'answers' | 'participants'> & {
    answers?: {
        [participantId: string]: {
            [questionUid: string]: TournamentAnswer; // Uses backend-specific TournamentAnswer
        };
    };
    participants?: TournamentParticipant[]; // Uses backend-specific TournamentParticipant
    // Inherits other properties like currentQuestionUid, questions (Question[]), questionStart, etc.
    // from BaseSharedTournamentState.
    // Ensure Question type used in BaseSharedTournamentState.questions is compatible.
};

// Re-export other types that don't need backend-specific modifications or are simple aliases
export type Participant = BaseParticipant; // Simple alias, assuming it doesn't contain conflicting answer structures
export type LeaderboardEntry = BaseLeaderboardEntry;
export type QuestionTimerState = BaseQuestionTimerState;
export type QuestionState = BaseQuestionState; // This is likely used for state.currentQuestionState

// Backend-specific TournamentStateContainer: Uses the backend-specific TournamentState
export type TournamentStateContainer = {
    [code: string]: TournamentState; // Uses backend-specific TournamentState
};
