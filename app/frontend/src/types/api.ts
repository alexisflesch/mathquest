/**
 * API Type Definitions - Uses Shared Types
 * 
 * This file re-exports shared types and schemas to maintain backward 
 * compatibility while centralizing all type definitions.
 */

import { z } from 'zod';

// Import schemas directly for use in API_SCHEMAS object
import {
    AuthStatusResponseSchema,
    UniversalLoginResponseSchema,
    RegisterResponseSchema,
    UpgradeAccountResponseSchema,
    UpgradeAccountRequestSchema,
    ProfileUpdateResponseSchema,
    LogoutResponseSchema,
    ErrorResponseSchema,
    QuestionsFiltersResponseSchema,
    QuestionsResponseSchema,
    QuestionsCountResponseSchema,
    QuizListResponseSchema,
    TournamentCodeResponseSchema,
    TeacherQuizQuestionsResponseSchema,
    QuizCreationResponseSchema,
    TournamentVerificationResponseSchema
} from '@shared/types/api/schemas';

// Re-export shared API response types
export type {
    // Auth API Types
    LoginResponse,
    RegisterResponse,
    UpgradeAccountResponse,
    AuthStatusResponse,
    ProfileUpdateResponse,
    PasswordResetResponse,
    PasswordResetConfirmResponse,
    ErrorResponse,
    // Game API Types  
    GameCreationResponse,
    GameJoinResponse,
    GameStatusUpdateResponse,
    GameInstanceResponse,
    GameInstanceWithTemplateResponse,
    GameStateResponse,
    LeaderboardResponse,
    TeacherActiveGamesResponse,
    GameInstancesByTemplateResponse,
    // Game Control API Types
    GameControlStateResponse,
    QuestionSetResponse,
    QuestionEndedResponse,
    GameEndedResponse,
    // Question API Types
    QuestionCreationResponse,
    QuestionResponse,
    QuestionsListResponse,
    QuestionUidsResponse,
    QuestionFiltersResponse,
    // Game Template API Types
    GameTemplateResponse,
    GameTemplatesResponse,
    GameTemplateCreationResponse,
    GameTemplateUpdateResponse,
    // Quiz Template API Types
    QuizTemplateResponse,
    QuizTemplatesResponse,
    QuizTemplateCreationResponse,
    QuizTemplateUpdateResponse,
    QuizTemplateDeleteResponse,
    QuizTemplateQuestionResponse,
    // User API Types
    PublicUserResponse,
    UserByCookieResponse,
    TeacherProfileResponse,
    // Generic Response Types
    SuccessResponse
} from '@shared/types/api/responses';

// Re-export shared API request types
export type {
    LoginRequest,
    RegisterRequest,
    UpgradeAccountRequest,
    PasswordResetRequest,
    PasswordResetConfirmRequest,
    ProfileUpdateRequest,
    CreateGameRequest,
    GameJoinRequest,
    GameStatusUpdateRequest,
    CreateGameTemplateRequest,
    UpdateGameTemplateRequest,
    CreateQuestionRequest,
    UpdateQuestionRequest,
    UpdateUserRequest,
    CreateQuizTemplateRequest,
    UpdateQuizTemplateRequest,
    SetQuestionRequest
} from '@shared/types/api/requests';

// Re-export all shared API schemas
export {
    // Auth Request Schemas
    LoginRequestSchema,
    RegisterRequestSchema,
    UpgradeAccountRequestSchema,
    PasswordResetRequestSchema,
    PasswordResetConfirmRequestSchema,
    ProfileUpdateRequestSchema,
    // Auth Response Schemas
    LoginResponseSchema,
    RegisterResponseSchema,
    UpgradeAccountResponseSchema,
    ProfileUpdateResponseSchema,
    LogoutResponseSchema,
    UniversalLoginResponseSchema,
    ErrorResponseSchema,
    // Game Request Schemas
    CreateGameRequestSchema,
    GameJoinRequestSchema,
    GameStatusUpdateRequestSchema,
    // Game Response Schemas
    GameCreationResponseSchema,
    GameJoinResponseSchema,
    GameStatusUpdateResponseSchema,
    GameStateResponseSchema,
    LeaderboardResponseSchema,
    TeacherActiveGamesResponseSchema,
    GameInstancesByTemplateResponseSchema,
    // Game Template Request Schemas
    CreateGameTemplateRequestSchema,
    UpdateGameTemplateRequestSchema,
    // Game Template Response Schemas
    GameTemplateResponseSchema,
    GameTemplatesResponseSchema,
    GameTemplateCreationResponseSchema,
    GameTemplateUpdateResponseSchema,
    // Question Request Schemas
    CreateQuestionRequestSchema,
    UpdateQuestionRequestSchema,
    // Question Response Schemas
    QuestionCreationResponseSchema,
    QuestionResponseSchema,
    QuestionsResponseSchema,
    QuestionsListResponseSchema,
    QuestionUidsResponseSchema,
    QuestionsFiltersResponseSchema,
    QuestionsCountResponseSchema,
    // User Request Schemas
    UpdateUserRequestSchema,
    // Quiz Template Request Schemas
    CreateQuizTemplateRequestSchema,
    UpdateQuizTemplateRequestSchema,
    // Quiz Template Response Schemas
    QuizTemplateResponseSchema,
    QuizTemplatesResponseSchema,
    QuizCreationResponseSchema,
    QuizTemplateCreationResponseSchema,
    QuizTemplateUpdateResponseSchema,
    QuizTemplateDeleteResponseSchema,
    QuizTemplateQuestionResponseSchema,
    QuizListResponseSchema,
    TeacherQuizQuestionsResponseSchema,
    TournamentCodeResponseSchema,
    TournamentVerificationResponseSchema,
    // Game Control Request Schemas
    SetQuestionRequestSchema,
    // Generic Response Schemas
    SuccessResponseSchema
} from '@shared/types/api/schemas';

// Re-export core types that are commonly used
export type { Question } from '@shared/types/quiz/question';
export type { UserRole } from '@shared/types/core/user';
export type { GameTemplate, GameInstance } from '@shared/types/core';
export type { BaseParticipant, LeaderboardEntry } from '@shared/types/core/participant';

// Import shared types and schemas that are already exported above
import type {
    RegisterResponse,
    UpgradeAccountResponse,
    QuestionFiltersResponse,
    QuestionsListResponse,
    UserByCookieResponse,
    GameTemplateCreationResponse,
    LeaderboardResponse
} from '@shared/types/api/responses';

import type {
    UpgradeAccountRequest
} from '@shared/types/api/requests';

import type {
    GameTemplate,
    Question
} from '@shared/types/core';

// Legacy type aliases for backward compatibility
export type RegistrationResponse = RegisterResponse;
export type UpgradeResponse = UpgradeAccountResponse;
export type UpgradeRequest = UpgradeAccountRequest;
export type UniversalLoginResponse = z.infer<typeof UniversalLoginResponseSchema>;

// Legacy question and quiz response types for backward compatibility
export type QuestionsFiltersResponse = QuestionFiltersResponse;
export type QuestionsResponse = QuestionsListResponse;
export type QuestionsCountResponse = {
    total: number;
};
export type QuizListResponse = import('@shared/types/api/responses').QuizTemplatesResponse;
export type TournamentCodeResponse = {
    tournament_code: string;
};
export type TeacherQuizQuestionsResponse = {
    questions: Question[];
};
export type PlayerCookieResponse = UserByCookieResponse;
export type QuizCreationResponse = GameTemplateCreationResponse;
export type TournamentVerificationResponse = {
    id: string;
    code?: string;
    nom?: string;
    type?: string;
    statut?: string;
};
export type TournamentStatusResponse = {
    code: string;
    defaultMode: string;
    statut: string;
};
export type TournamentLeaderboardResponse = LeaderboardResponse;
export type CanPlayDifferedResponse = {
    canPlay: boolean;
};
export type MyTournamentsResponse = {
    created: Array<{
        id: string;
        code: string;
        name: string;
        statut: string;
        createdAt: string;
        date_debut: string | null;
        date_fin: string | null;
        leaderboard?: unknown[];
    }>;
    played: Array<{
        id: string;
        code: string;
        name: string;
        statut: string;
        createdAt: string;
        date_debut: string | null;
        date_fin: string | null;
        leaderboard?: unknown[];
        position: number;
        score: number;
    }>;
};

// Legacy schemas for backward compatibility with existing code
export const RegistrationResponseSchema = RegisterResponseSchema;
export const UpgradeResponseSchema = UpgradeAccountResponseSchema;
export const UpgradeRequestSchema = UpgradeAccountRequestSchema;

// Additional frontend-specific schemas that aren't in shared
import { questionSchema as QuestionSchema } from '@shared/types/quiz/question.zod';

export const PlayerCookieResponseSchema = z.object({
    user: z.object({
        id: z.string(),
        username: z.string(),
        email: z.string().optional(),
        role: z.enum(['STUDENT', 'TEACHER']),
        avatarEmoji: z.string(),
        createdAt: z.string()
    })
});

export const TournamentStatusResponseSchema = z.object({
    code: z.string(),
    defaultMode: z.string(),
    statut: z.string()
});

export const TournamentLeaderboardResponseSchema = z.object({
    leaderboard: z.array(z.object({
        userId: z.string(), // Use userId to match shared LeaderboardEntry type
        username: z.string(),
        avatar: z.string().optional(), // Make optional to match shared type
        score: z.number(),
        rank: z.number().optional(), // Add rank field from shared type
        isDiffered: z.boolean().optional()
    }))
});

export const CanPlayDifferedResponseSchema = z.object({
    canPlay: z.boolean()
});

export const MyTournamentsResponseSchema = z.object({
    created: z.array(z.object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
        statut: z.string(),
        createdAt: z.string(),
        date_debut: z.string().nullable(),
        date_fin: z.string().nullable(),
        leaderboard: z.array(z.unknown()).optional()
    })),
    played: z.array(z.object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
        statut: z.string(),
        createdAt: z.string(),
        date_debut: z.string().nullable(),
        date_fin: z.string().nullable(),
        leaderboard: z.array(z.unknown()).optional(),
        position: z.number(),
        score: z.number()
    }))
});

// Export all schemas for runtime validation - maintaining legacy structure
export const API_SCHEMAS = {
    authStatus: AuthStatusResponseSchema,
    universalLogin: UniversalLoginResponseSchema, // Use UniversalLoginResponseSchema for backward compatibility
    registration: RegistrationResponseSchema,
    upgrade: UpgradeResponseSchema,
    profileUpdate: ProfileUpdateResponseSchema,
    logout: LogoutResponseSchema,
    error: ErrorResponseSchema,
    // Quiz and Question Schemas
    questionsFilters: QuestionsFiltersResponseSchema,
    questions: QuestionsResponseSchema,
    questionsCount: QuestionsCountResponseSchema,
    quizList: QuizListResponseSchema,
    tournamentCode: TournamentCodeResponseSchema,
    teacherQuizQuestions: TeacherQuizQuestionsResponseSchema,
    playerCookie: PlayerCookieResponseSchema,
    gameCreation: QuizCreationResponseSchema,
    quizCreation: QuizCreationResponseSchema,
    // Tournament Schemas
    tournamentVerification: TournamentVerificationResponseSchema,
    tournamentStatus: TournamentStatusResponseSchema,
    tournamentLeaderboard: TournamentLeaderboardResponseSchema,
    canPlayDiffered: CanPlayDifferedResponseSchema,
    myTournaments: MyTournamentsResponseSchema
} as const;
