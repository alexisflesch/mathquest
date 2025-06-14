/**
 * Shared API Response Types
 * 
 * All API response types should be defined here and imported by both
 * backend and frontend to ensure contract consistency.
 */

import type { UserRole } from '../core/user';
import type { Question } from '../quiz/question';
import type { GameTemplate, GameInstance } from '../core';
import type { BaseParticipant, LeaderboardEntry } from '../core/participant';

// --- Auth API Responses ---

export interface LoginResponse {
    message: string;
    token: string;
    user?: {
        id: string;
        username: string;
        email?: string;
        avatar: string;
        role: UserRole;
    };
    // Legacy teacher-specific fields for backward compatibility
    enseignant?: {
        id: string;
        username: string;
    };
    enseignantId?: string;
    username?: string;
    avatar?: string;
    cookie_id?: string;
    role?: string;
    success?: boolean;
}

export interface RegisterResponse {
    success: boolean;
    message: string;
    token: string;
    user: {
        id: string;
        username: string;
        email?: string;
        avatar: string;
        role: UserRole;
    };
}

export interface UpgradeAccountResponse {
    success: boolean;
    message: string;
    token: string;
    user: {
        id: string;
        username: string;
        email?: string;
        avatar: string;
        role: UserRole;
    };
}

export interface PasswordResetResponse {
    message: string;
    resetToken?: string; // Only in development
}

export interface PasswordResetConfirmResponse {
    message: string;
}

export interface AuthStatusResponse {
    authState: 'anonymous' | 'student' | 'teacher';
    cookiesFound: number;
    cookieNames: string[];
    hasAuthToken: boolean;
    hasTeacherToken: boolean;
    timestamp: string;
    user?: {
        id: string;
        username: string;
        email?: string;
        avatar: string;
        role: 'STUDENT' | 'TEACHER';
    };
    // Legacy fields
    isTeacher?: boolean;
    teacherId?: string;
}

export interface ProfileUpdateResponse {
    message: string;
    user: {
        id: string;
        username: string;
        email?: string;
        avatar: string;
        role: UserRole;
    };
}

// --- User API Responses ---

export interface PublicUserResponse {
    id: string;
    username: string;
    email?: string;
    role: UserRole;
    avatarEmoji: string;
    createdAt: string;
}

export interface UserByCookieResponse {
    user: PublicUserResponse;
}

export interface TeacherProfileResponse {
    user: PublicUserResponse;
}

// --- Game API Responses ---

export interface GameInstanceResponse {
    gameInstance: GameInstance;
}

export interface GameInstanceWithTemplateResponse {
    gameInstance: GameInstance & {
        gameTemplate: GameTemplate;
    };
}

export interface GameCreationResponse {
    gameInstance: GameInstance;
}

export interface GameJoinResponse {
    success: boolean;
    gameInstance: GameInstance;
    participant: BaseParticipant;
}

export interface GameStatusUpdateResponse {
    gameInstance: GameInstance;
}

export interface GameStateResponse {
    status: string;
    currentQuestionIndex: number;
    accessCode: string;
    name: string;
    gameState?: {
        currentQuestionIndex: number;
        questionUids: string | null;
        questionData: any;
        timer: any;
        redisStatus: string;
    };
    isLive: boolean;
}

export interface LeaderboardResponse {
    leaderboard: LeaderboardEntry[];
}

export interface TeacherActiveGamesResponse {
    games: GameInstance[];
}

export interface GameInstancesByTemplateResponse {
    gameInstances: GameInstance[];
}

// --- Game Control API Responses ---

export interface GameControlStateResponse {
    gameState: any; // Full game state object from Redis
}

export interface QuestionSetResponse {
    success: boolean;
    questionIndex: number;
    questionUid: string;
    timer: any;
}

export interface QuestionEndedResponse {
    success: boolean;
    questionIndex: number;
    gameState: any;
}

export interface GameEndedResponse {
    success: boolean;
    gameState: any;
}

// --- Question API Responses ---

export interface QuestionCreationResponse {
    question: any; // Flexible type for database question objects
}

export interface QuestionResponse {
    question: any; // Flexible type for database question objects
}

export interface QuestionsListResponse {
    questions: any[]; // Flexible type for database question objects
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

export interface QuestionUidsResponse {
    questionUids: string[];
    total: number;
}

export interface QuestionFiltersResponse {
    gradeLevel: (string | null)[];
    disciplines: string[];
    themes: string[];
}

// --- Game Template API Responses ---

export interface GameTemplateResponse {
    gameTemplate: GameTemplate;
}

export interface GameTemplatesResponse {
    gameTemplates: GameTemplate[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

export interface GameTemplateCreationResponse {
    gameTemplate: GameTemplate;
}

export interface GameTemplateUpdateResponse {
    message: string;
    gameTemplate: GameTemplate;
}

// --- Quiz Template API Responses ---

export interface QuizTemplateResponse {
    gameTemplate: GameTemplate;
}

export interface QuizTemplatesResponse {
    gameTemplates: GameTemplate[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface QuizTemplateCreationResponse {
    gameTemplate: GameTemplate;
}

export interface QuizTemplateUpdateResponse {
    gameTemplate: GameTemplate;
}

export interface QuizTemplateDeleteResponse {
    success: boolean;
}

export interface QuizTemplateQuestionResponse {
    gameTemplate: GameTemplate;
}

// --- Error Response ---

export interface ErrorResponse {
    error: string;
    details?: any;
    code?: string;
    statusCode?: number;
}

// --- Generic Success Response ---

export interface SuccessResponse {
    success: boolean;
    message?: string;
}
