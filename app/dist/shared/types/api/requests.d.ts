/**
 * Shared API Request Types
 *
 * All API request types should be defined here and imported by both
 * backend and frontend to ensure contract consistency.
 */
import type { UserRole } from '../core/user';
import type { PlayMode } from '../core/game';
export interface LoginRequest {
    action?: 'login' | 'teacher_login';
    email: string;
    password: string;
}
export interface RegisterRequest {
    username: string;
    avatar?: string;
    cookieId?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    adminPassword?: string;
}
export interface TeacherRegisterRequest {
    username: string;
    email?: string;
    password: string;
    nom?: string;
    prenom?: string;
    adminPassword: string;
    avatar?: string;
}
export interface UpgradeAccountRequest {
    cookieId: string;
    email: string;
    password: string;
    targetRole?: UserRole;
    adminPassword?: string;
}
export interface PasswordResetRequest {
    email: string;
}
export interface PasswordResetConfirmRequest {
    token: string;
    newPassword: string;
}
export interface ProfileUpdateRequest {
    username: string;
    avatar: string;
}
export interface GameCreationRequest {
    name: string;
    gameTemplateId: string;
    playMode: PlayMode | string;
    settings?: any;
    isDiffered?: boolean;
    differedAvailableFrom?: string;
    differedAvailableTo?: string;
    gradeLevel?: string;
    discipline?: string;
    themes?: string[];
    nbOfQuestions?: number;
    initiatorStudentId?: string;
}
export interface GameJoinRequest {
    accessCode: string;
    username?: string;
    avatar?: string;
    userId?: string;
}
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
export interface TeacherLoginRequest {
    email: string;
    password: string;
}
export interface ErrorResponse {
    error: string;
    success?: false;
    missing?: string[];
    received?: any;
    details?: any;
    target?: string[];
    allowedValues?: string[];
    required?: string[];
}
export interface SuccessResponse {
    success: true;
    message: string;
    data?: any;
}
export interface SetQuestionRequest {
    questionIndex: number;
}
