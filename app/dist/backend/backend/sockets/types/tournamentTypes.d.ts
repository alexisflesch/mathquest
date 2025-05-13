/**
 * TypeScript definitions for Tournament-related data structures
 * Now using shared types from shared/types
 */
import { Participant as BaseParticipant, TournamentParticipant as BaseTournamentParticipant, TournamentAnswer as BaseTournamentAnswer, LeaderboardEntry as BaseLeaderboardEntry } from '@shared/types/tournament/participant';
import { QuestionTimerState as BaseQuestionTimerState, QuestionState as BaseQuestionState, TournamentState as BaseTournamentState, TournamentStateContainer as BaseTournamentStateContainer } from '@shared/types/tournament/state';
export type Participant = BaseParticipant;
export type TournamentParticipant = BaseTournamentParticipant;
export type TournamentAnswer = BaseTournamentAnswer;
export type LeaderboardEntry = BaseLeaderboardEntry;
export type QuestionTimerState = BaseQuestionTimerState;
export type QuestionState = BaseQuestionState;
export type TournamentState = BaseTournamentState;
export type TournamentStateContainer = BaseTournamentStateContainer;
