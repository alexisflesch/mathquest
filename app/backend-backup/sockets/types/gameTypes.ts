/**
 * TypeScript definitions for Game-related data structures
 * Using shared types from shared/types with renamed fields
 */
import {
    Participant as BaseParticipant,
    TournamentParticipant as BaseSharedGameParticipant,
    TournamentAnswer as BaseSharedGameAnswer,
    LeaderboardEntry as BaseLeaderboardEntry
} from '@shared/types/tournament/participant';

import {
    QuestionTimerState as BaseQuestionTimerState,
    QuestionState as BaseQuestionState,
    TournamentState as BaseSharedGameState,
    TournamentStateContainer as BaseSharedGameStateContainer
} from '@shared/types/tournament/state';

// Backend-specific GameAnswer: Extends the shared version with backend-only fields
export type GameAnswer = BaseSharedGameAnswer & {
    serverReceiveTime?: number; // Timestamp of when the server received/processed the answer
    // Ensure all other fields used in handleTimerExpiration (like value, timeMs, isCorrect, score, baseScore, timePenalty)
    // are present in BaseSharedGameAnswer or added here if backend-specific.
};

// Backend-specific GameParticipant: Extends the shared version to use backend's GameAnswer
export type GameParticipant = Omit<BaseSharedGameParticipant, 'answers' | 'scoredQuestions'> & {
    answers?: GameAnswer[]; // Uses backend-specific GameAnswer for detailed answer list
    scoredQuestions?: Record<string, number>; // Stores the normalized score for each question
    // Inherits id, username, avatar, score, isDeferred, socketId from BaseParticipant via BaseSharedGameParticipant
};

// Backend-specific GameState: Extends the shared version to use backend-specific types for answers and participants
export type GameState = Omit<BaseSharedGameState, 'answers' | 'participants'> & {
    answers?: {
        [participantId: string]: {
            [questionUid: string]: GameAnswer; // Uses backend-specific GameAnswer
        };
    };
    participants?: GameParticipant[]; // Uses backend-specific GameParticipant
    // Inherits other properties like currentQuestionUid, questions (Question[]), questionStart, etc.
    // from BaseSharedGameState.
    // Additional fields specific to GameInstance model
    gameId?: string; // ID of the GameInstance in the database
    quizTemplateId?: string; // ID of the QuizTemplate associated with this game
    accessCode?: string; // Access code of the game (replacing code)
    playMode?: 'class' | 'tournament' | 'practice'; // Mode of play for this game
};

// Re-export other types that don't need backend-specific modifications or are simple aliases
export type Participant = BaseParticipant; // Simple alias
export type LeaderboardEntry = BaseLeaderboardEntry;
export type QuestionTimerState = BaseQuestionTimerState;
export type QuestionState = BaseQuestionState; // This is used for state.currentQuestionState

// Backend-specific GameStateContainer: Uses the backend-specific GameState
export type GameStateContainer = {
    [accessCode: string]: GameState; // Uses backend-specific GameState
};
