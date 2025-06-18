/**
 * Shared API Response Types
 *
 * All API response types should be defined here and imported by both
 * backend and frontend to ensure contract consistency.
 */
import type { UserRole } from '../core/user';
import type { GameTemplate, GameInstance } from '../core';
import type { BaseParticipant, LeaderboardEntry } from '../core/participant';
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
    resetToken?: string;
}
export interface PasswordResetConfirmResponse {
    message: string;
}
export interface AuthStatusResponse {
    authState: 'anonymous' | 'student' | 'teacher' | 'guest';
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
export interface GameControlStateResponse {
    gameState: any;
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
export interface QuestionCreationResponse {
    question: any;
}
export interface QuestionResponse {
    question: any;
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
export interface ErrorResponse {
    error: string;
    details?: any;
    code?: string;
    statusCode?: number;
}
export interface SuccessResponse {
    success: boolean;
    message?: string;
}
