/**
 * API Response Type Definitions
 * 
 * Centralized type definitions for API responses to ensure consistency
 * between client and server and prevent interface contract mismatches.
 */

import { z } from 'zod';
import { AUTH_STATES } from '../constants/auth';

// Base User Schema
const UserSchema = z.object({
    id: z.string(),
    username: z.string(),
    email: z.string().optional(), // Optional because guest users don't have emails
    role: z.enum(['STUDENT', 'TEACHER']),
    avatar: z.string().optional()
});

// Auth Status Response Schema
export const AuthStatusResponseSchema = z.object({
    authState: z.enum([AUTH_STATES.ANONYMOUS, AUTH_STATES.GUEST, AUTH_STATES.STUDENT, AUTH_STATES.TEACHER]),
    cookiesFound: z.number(),
    cookieNames: z.array(z.string()),
    hasAuthToken: z.boolean(),
    hasTeacherToken: z.boolean(),
    timestamp: z.string(),
    user: UserSchema.optional()
});

export type AuthStatusResponse = z.infer<typeof AuthStatusResponseSchema>;

// Universal Login Response Schema (handles both teacher and student login)
export const UniversalLoginResponseSchema = z.union([
    // Teacher login response
    z.object({
        message: z.string(),
        enseignantId: z.string(),
        username: z.string(),
        avatar: z.string().optional(),
        token: z.string()
    }),
    // Student login response  
    z.object({
        success: z.boolean(),
        user: UserSchema,
        token: z.string()
    })
]);

export type UniversalLoginResponse = z.infer<typeof UniversalLoginResponseSchema>;

// Registration Response Schema (for both students and teachers)
export const RegistrationResponseSchema = z.object({
    success: z.boolean(),
    user: UserSchema,
    token: z.string(),
    message: z.string().optional()
});

export type RegistrationResponse = z.infer<typeof RegistrationResponseSchema>;

// Upgrade Response Schema (guest to account)
export const UpgradeResponseSchema = z.object({
    success: z.boolean(),
    user: UserSchema,
    token: z.string(),
    message: z.string()
});

export type UpgradeResponse = z.infer<typeof UpgradeResponseSchema>;

// Upgrade Request Schema (guest to account)
export const UpgradeRequestSchema = z.object({
    cookieId: z.string(),
    email: z.string(),
    password: z.string(),
    targetRole: z.enum(['STUDENT'])
});

export type UpgradeRequest = z.infer<typeof UpgradeRequestSchema>;

// Profile Update Response Schema
export const ProfileUpdateResponseSchema = z.object({
    success: z.boolean(),
    user: UserSchema,
    message: z.string().optional()
});

export type ProfileUpdateResponse = z.infer<typeof ProfileUpdateResponseSchema>;

// Logout Response Schema
export const LogoutResponseSchema = z.object({
    message: z.string()
});

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;

// Generic Error Response Schema
export const ErrorResponseSchema = z.object({
    error: z.string(),
    message: z.string().optional(),
    success: z.boolean().optional()
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Question Schemas
const AnswerSchema = z.object({
    text: z.string(),
    correct: z.boolean()
});

const QuestionSchema = z.object({
    uid: z.string(),
    text: z.string(),
    questionType: z.string(), // Canonical field, matches DB and API
    answers: z.array(AnswerSchema),
    title: z.string().optional(),
    explanation: z.string().optional(),
    time: z.number().optional(),
    tags: z.array(z.string()).optional(),
    level: z.string().optional(),
    gradeLevel: z.string().optional(),
    discipline: z.string().optional(),
    themes: z.array(z.string()).optional()
});

export type Question = z.infer<typeof QuestionSchema>;

// Questions Filters Response Schema
export const QuestionsFiltersResponseSchema = z.object({
    niveaux: z.array(z.string()),
    disciplines: z.array(z.string()),
    themes: z.array(z.string())
});

export type QuestionsFiltersResponse = z.infer<typeof QuestionsFiltersResponseSchema>;

// Questions Response Schema (for various question endpoints)
export const QuestionsResponseSchema = z.object({
    questions: z.array(QuestionSchema),
    total: z.number().optional(),
    hasMore: z.boolean().optional()
});

export type QuestionsResponse = z.infer<typeof QuestionsResponseSchema>;

// Quiz Data Schema
const QuizSchema = z.object({
    id: z.string(),
    nom: z.string(),
    enseignant_id: z.string().optional(),
    questions_ids: z.array(z.string()).optional(),
    levels: z.array(z.string()).optional(),
    themes: z.array(z.string()).optional(),
    type: z.string().optional(),
    date_creation: z.string().optional(),
    niveaux: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional()
});

// Quiz List Response Schema
export const QuizListResponseSchema = z.array(QuizSchema);

export type QuizListResponse = z.infer<typeof QuizListResponseSchema>;

// Tournament Code Response Schema
export const TournamentCodeResponseSchema = z.object({
    tournament_code: z.string()
});

export type TournamentCodeResponse = z.infer<typeof TournamentCodeResponseSchema>;

// Teacher Quiz Questions Response Schema
export const TeacherQuizQuestionsResponseSchema = z.object({
    questions: z.array(QuestionSchema)
});

export type TeacherQuizQuestionsResponse = z.infer<typeof TeacherQuizQuestionsResponseSchema>;

// Player Cookie Response Schema
export const PlayerCookieResponseSchema = z.object({
    user: z.object({
        id: z.string(),
        username: z.string().optional(),
        avatar: z.string().optional()
    })
});

export type PlayerCookieResponse = z.infer<typeof PlayerCookieResponseSchema>;

// Game Creation Response Schema
export const GameCreationResponseSchema = z.object({
    gameInstance: z.object({
        accessCode: z.string(),
        id: z.string().optional()
    }),
    message: z.string().optional()
});

export type GameCreationResponse = z.infer<typeof GameCreationResponseSchema>;

// Questions Count Response Schema
export const QuestionsCountResponseSchema = z.object({
    total: z.number()
});

export type QuestionsCountResponse = z.infer<typeof QuestionsCountResponseSchema>;

// Quiz Creation Response Schema
export const QuizCreationResponseSchema = z.object({
    id: z.string(),
    message: z.string().optional()
});

export type QuizCreationResponse = z.infer<typeof QuizCreationResponseSchema>;

// Tournament Verification Response Schema
export const TournamentVerificationResponseSchema = z.object({
    id: z.string(),
    code: z.string().optional(),
    nom: z.string().optional(),
    type: z.string().optional(),
    statut: z.string().optional()
});

export type TournamentVerificationResponse = z.infer<typeof TournamentVerificationResponseSchema>;

// Tournament Status Response Schema
export const TournamentStatusResponseSchema = z.object({
    code: z.string(),
    type: z.string(),
    statut: z.string()
});

export type TournamentStatusResponse = z.infer<typeof TournamentStatusResponseSchema>;

// Tournament Leaderboard Response Schema
export const TournamentLeaderboardResponseSchema = z.object({
    leaderboard: z.array(z.object({
        id: z.string(),
        username: z.string(),
        avatar: z.string(),
        score: z.number(),
        isDiffered: z.boolean().optional()
    }))
});

export type TournamentLeaderboardResponse = z.infer<typeof TournamentLeaderboardResponseSchema>;

// Can Play Differed Response Schema
export const CanPlayDifferedResponseSchema = z.object({
    canPlay: z.boolean()
});

export type CanPlayDifferedResponse = z.infer<typeof CanPlayDifferedResponseSchema>;

// My Tournaments Response Schema
export const MyTournamentsResponseSchema = z.object({
    created: z.array(z.object({
        id: z.string(),
        code: z.string(),
        nom: z.string(),
        statut: z.string(),
        date_creation: z.string(),
        date_debut: z.string().nullable(),
        date_fin: z.string().nullable(),
        leaderboard: z.array(z.unknown()).optional()
    })),
    played: z.array(z.object({
        id: z.string(),
        code: z.string(),
        nom: z.string(),
        statut: z.string(),
        date_creation: z.string(),
        date_debut: z.string().nullable(),
        date_fin: z.string().nullable(),
        leaderboard: z.array(z.unknown()).optional(),
        position: z.number(),
        score: z.number()
    }))
});

export type MyTournamentsResponse = z.infer<typeof MyTournamentsResponseSchema>;

// Export all schemas for runtime validation
export const API_SCHEMAS = {
    authStatus: AuthStatusResponseSchema,
    universalLogin: UniversalLoginResponseSchema,
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
    gameCreation: GameCreationResponseSchema,
    quizCreation: QuizCreationResponseSchema,
    // Tournament Schemas
    tournamentVerification: TournamentVerificationResponseSchema,
    tournamentStatus: TournamentStatusResponseSchema,
    tournamentLeaderboard: TournamentLeaderboardResponseSchema,
    canPlayDiffered: CanPlayDifferedResponseSchema,
    myTournaments: MyTournamentsResponseSchema
} as const;
