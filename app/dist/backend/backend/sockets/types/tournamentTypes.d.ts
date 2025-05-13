/**
 * TypeScript definitions for Tournament-related data structures
 * Now using shared types from shared/types
 */
import { Participant as BaseParticipant, TournamentParticipant as BaseSharedTournamentParticipant, TournamentAnswer as BaseSharedTournamentAnswer, LeaderboardEntry as BaseLeaderboardEntry } from '@shared/types/tournament/participant';
import { QuestionTimerState as BaseQuestionTimerState, QuestionState as BaseQuestionState, TournamentState as BaseSharedTournamentState } from '@shared/types/tournament/state';
export type TournamentAnswer = BaseSharedTournamentAnswer & {
    serverReceiveTime?: number;
};
export type TournamentParticipant = Omit<BaseSharedTournamentParticipant, 'answers' | 'scoredQuestions'> & {
    answers?: TournamentAnswer[];
    scoredQuestions?: Record<string, number>;
};
export type TournamentState = Omit<BaseSharedTournamentState, 'answers' | 'participants'> & {
    answers?: {
        [participantId: string]: {
            [questionUid: string]: TournamentAnswer;
        };
    };
    participants?: TournamentParticipant[];
};
export type Participant = BaseParticipant;
export type LeaderboardEntry = BaseLeaderboardEntry;
export type QuestionTimerState = BaseQuestionTimerState;
export type QuestionState = BaseQuestionState;
export type TournamentStateContainer = {
    [code: string]: TournamentState;
};
