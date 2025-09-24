/**
 * Shared API Request Types
 * 
 * All API request types should be defined here and imported by both
 * backend and frontend to ensure contract consistency.
 * 
 * Types are inferred from Zod schemas for runtime validation.
 */

import type { UserRole } from '../core/user';
import type { PlayMode } from '../core/game';

// Import validated types from schemas
export type {
    LoginRequest,
    RegisterRequest,
    CreateGameRequest,
    GameJoinRequest,
    GameStatusUpdateRequest,
    CreateGameTemplateRequest,
    UpdateGameTemplateRequest,
    RenameGameTemplateRequest,
    RenameGameInstanceRequest,
    CreateQuestionRequest,
    UpdateQuestionRequest,
    UpdateUserRequest,
    CreateQuizTemplateRequest,
    UpdateQuizTemplateRequest,
    UpgradeAccountRequest,
    PasswordResetRequest,
    PasswordResetConfirmRequest,
    ProfileUpdateRequest,
    TeacherUpgradeRequest,
    SendEmailVerificationRequest,
    VerifyEmailRequest,
    ResendEmailVerificationRequest,
    SetQuestionRequest
} from './schemas';

// Export schemas for runtime validation
export {
    LoginRequestSchema,
    RegisterRequestSchema,
    CreateGameRequestSchema,
    GameJoinRequestSchema,
    GameStatusUpdateRequestSchema,
    CreateGameTemplateRequestSchema,
    UpdateGameTemplateRequestSchema,
    RenameGameTemplateRequestSchema,
    RenameGameInstanceRequestSchema,
    CreateQuestionRequestSchema,
    UpdateQuestionRequestSchema,
    UpdateUserRequestSchema,
    CreateQuizTemplateRequestSchema,
    UpdateQuizTemplateRequestSchema,
    UpgradeAccountRequestSchema,
    PasswordResetRequestSchema,
    PasswordResetConfirmRequestSchema,
    ProfileUpdateRequestSchema,
    TeacherUpgradeRequestSchema,
    SendEmailVerificationRequestSchema,
    VerifyEmailRequestSchema,
    ResendEmailVerificationRequestSchema,
    SetQuestionRequestSchema
} from './schemas';

// --- Legacy/Additional Request Types (to be migrated) ---

// Note: UpgradeAccountRequest, PasswordResetRequest, PasswordResetConfirmRequest, and ProfileUpdateRequest 
// are now defined in schemas.ts with Zod validation

export interface TeacherRegisterRequest {
    username: string;
    email?: string;
    password: string;
    nom?: string;
    prenom?: string;
    adminPassword: string;
    avatar?: string;
}

// --- Legacy Game API Requests (to be migrated to Zod schemas) ---

export interface GameCreationRequest {
    name: string;
    gameTemplateId: string;
    playMode: PlayMode | string; // Allow both for flexibility during migration
    settings?: any;
    differedAvailableFrom?: string;
    differedAvailableTo?: string;
    // Additional fields used in the backend
    gradeLevel?: string;
    discipline?: string;
    themes?: string[];
    nbOfQuestions?: number;
    initiatorStudentId?: string;
}

// --- Legacy Game Template API Requests (to be migrated) ---

export interface GameTemplateCreationRequest {
    name: string;
    gradeLevel?: string;
    themes: string[];
    discipline?: string;
    description?: string;
    defaultMode?: string;
    questionUids?: string[];
    questions?: Array<{
        questionUid: string;
        sequence: number;
    }>;
}

export interface GameTemplateUpdateRequest {
    name?: string;
    gradeLevel?: string;
    themes?: string[];
    discipline?: string;
    description?: string;
    defaultMode?: string;
    questionUids?: string[];
    questions?: Array<{
        questionUid: string;
        sequence: number;
    }>;
}

// --- Legacy Question API Requests (to be migrated) ---

export interface QuestionCreationRequest {
    question: string;
    options: string[];
    correctAnswer: number;
    theme?: string;
    gradeLevel?: string;
    subject?: string;
    difficulty?: number;
    tags?: string[];
}

export interface QuestionUpdateRequest {
    question?: string;
    options?: string[];
    correctAnswer?: number;
    theme?: string;
    gradeLevel?: string;
    subject?: string;
    difficulty?: number;
    tags?: string[];
}

export interface QuestionSearchRequest {
    search?: string;
    theme?: string;
    gradeLevel?: string;
    subject?: string;
    difficulty?: number;
    tags?: string[];
    limit?: number;
    offset?: number;
}

// --- Player/User API Requests ---

export interface PlayerJoinGameRequest {
    gameId: string;
    username: string;
    avatar?: string;
}

export interface PlayerAnswerRequest {
    questionId: string;
    answer: number;
    timeTaken?: number;
}

// --- Teacher API Requests ---

export interface TeacherLoginRequest {
    email: string;
    password: string;
}

// --- Error Response Type ---

export interface ErrorResponse {
    error: string;
    success?: false;
    missing?: string[]; // For validation errors
    received?: any; // For debugging
    details?: any; // For additional error context
    target?: string[]; // For constraint violations
    allowedValues?: string[]; // For enum validation errors
    required?: string[]; // For required field errors
}

// --- Generic Success Response ---

export interface SuccessResponse {
    success: true;
    message: string;
    data?: any;
}

// Note: SetQuestionRequest is now defined in schemas.ts with Zod validation

// No request body needed for end-question and end-game endpoints
