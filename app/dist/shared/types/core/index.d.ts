/**
 * Core Types Index
 *
 * Exports all consolidated core type definitions to eliminate duplication
 * across the MathQuest codebase.
 */
export * from './user';
export * from './game';
export * from './participant';
export * from './timer';
export * from './answer';
export * from './question';
export type { BaseParticipant, GameParticipant, TournamentParticipant, LeaderboardEntry, ParticipantData } from './participant';
export type { TimerStatus, TimerRole, BaseTimer, Chrono, QuestionTimer, GameTimerState, TimerConfig, TimerUpdatePayload, GameTimerUpdatePayload, TimerActionPayload } from './timer';
export type { BaseAnswer, GameAnswer, TournamentAnswer, AnswerSubmissionPayload, AnswerResponsePayload, AnswerStats, QuestionAnswerSummary } from './answer';
export type { UserRole, PublicUser, UserRegistrationData, UserLoginData, UserUpgradeData } from './user';
export type { PlayMode, GameTemplate, GameInstance, GameParticipantRecord, GameTemplateCreationData, GameTemplateUpdateData, GameInstanceCreationData } from './game';
export type { BaseQuestion, Question, QuestionCreationPayload, QuestionUpdatePayload } from './question';
export * from '../socket/dashboardPayloads';
