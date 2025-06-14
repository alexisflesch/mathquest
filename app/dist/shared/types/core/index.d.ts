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
export type { BaseParticipant, GameParticipant, TournamentParticipant, LobbyParticipant, LeaderboardEntry, ParticipantData } from './participant';
export type { TimerStatus, TimerRole, BaseTimer, Chrono, QuestionTimer, GameTimerState, TimerConfig, TimerUpdatePayload, GameTimerUpdatePayload, TimerActionPayload } from './timer';
export type { BaseAnswer, GameAnswer, TournamentAnswer, AnswerSubmissionPayload, AnswerResponsePayload, AnswerResult, AnswerStats, QuestionAnswerSummary } from './answer';
export type { UserRole, User, PublicUser, UserRegistrationData, UserLoginData, UserProfileUpdate, UserUpgradeData } from './user';
export type { PlayMode, GameTemplate, GameInstance, GameParticipantRecord, GameTemplateCreationData, GameTemplateUpdateData, GameInstanceCreationData, GameInstanceUpdateData } from './game';
export type { BaseQuestion, Question, ClientQuestion, QuestionCreationPayload, QuestionUpdatePayload } from './question';
export * from '../socket/dashboardPayloads';
