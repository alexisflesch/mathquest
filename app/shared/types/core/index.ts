/**
 * Core Types Index
 * 
 * Exports all consolidated core type definitions to eliminate duplication
 * across the MathQuest codebase.
 */

// Core user types
export * from './user';

// Core game types
export * from './game';

// Core participant types
export * from './participant';

// Core timer types  
export * from './timer';

// Core answer types
export * from './answer';

// Core question types
export * from './question';

// Re-export key types with clear names for easy importing
export type {
    BaseParticipant,
    GameParticipant,
    TournamentParticipant,
    LeaderboardEntry,
    ParticipantData
} from './participant';

export type {
    TimerStatus,
    TimerRole,
    BaseTimer,
    Chrono,
    QuestionTimer,
    GameTimerState,
    TimerConfig,
    TimerUpdatePayload,
    GameTimerUpdatePayload,
    TimerActionPayload
} from './timer';

export type {
    BaseAnswer,
    GameAnswer,
    TournamentAnswer,
    AnswerSubmissionPayload,
    AnswerResponsePayload,
    AnswerResult,
    AnswerStats,
    QuestionAnswerSummary
} from './answer';

export type {
    UserRole,
    User,
    PublicUser,
    UserRegistrationData,
    UserLoginData,
    UserProfileUpdate,
    UserUpgradeData
} from './user';

export type {
    PlayMode,
    GameTemplate,
    GameInstance,
    GameParticipantRecord,
    GameTemplateCreationData,
    GameTemplateUpdateData,
    GameInstanceCreationData,
    GameInstanceUpdateData
} from './game';

export type {
    BaseQuestion,
    Question,
    ClientQuestion,
    QuestionCreationPayload,
    QuestionUpdatePayload
} from './question';

// Re-export dashboard payloads for convenience
export * from '../socket/dashboardPayloads';
