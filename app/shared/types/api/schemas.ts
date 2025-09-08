/**
 * Zod validation schemas for API requests and responses
 * 
 * These schemas provide runtime validation for API payloads
 * and can be used to infer TypeScript types.
 */

import { z } from 'zod';
import { questionSchema } from '../quiz/question.zod';
import {
    GameTemplateSchema as SharedGameTemplateSchema,
    GameInstanceSchema as SharedGameInstanceSchema
} from '../core/game.zod';
import { participantSchema } from '../tournament/participant.zod';

// --- Auth API Request Schemas ---

export const LoginRequestSchema = z.object({
    action: z.enum(['login', 'teacher_login']).optional(),
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
    username: z.string().optional() // For backwards compatibility
});

export const RegisterRequestSchema = z.object({
    action: z.enum(['teacher_register', 'teacher_signup']).optional(),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email format').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(), // Optional for guest users
    role: z.enum(['STUDENT', 'TEACHER']).optional(),
    gradeLevel: z.string().optional(),
    avatar: z.string().optional(),
    cookieId: z.string().optional(),
    adminPassword: z.string().optional(),
    name: z.string().optional(), // For teacher registration
    prenom: z.string().optional() // For teacher registration
});

// --- Additional Auth Request Schemas ---

export const UpgradeAccountRequestSchema = z.object({
    cookieId: z.string().min(1, 'Cookie ID is required'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    targetRole: z.enum(['STUDENT', 'TEACHER']).optional(),
    adminPassword: z.string().optional()
});

export const PasswordResetRequestSchema = z.object({
    email: z.string().email('Invalid email format')
});

export const PasswordResetConfirmRequestSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

export const ProfileUpdateRequestSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    avatar: z.string().min(1, 'Avatar is required')
});

export const TeacherUpgradeRequestSchema = z.object({
    adminPassword: z.string().min(1, 'Admin password is required')
});

export const SendEmailVerificationRequestSchema = z.object({
    email: z.string().email('Invalid email format')
});

export const VerifyEmailRequestSchema = z.object({
    token: z.string().min(1, 'Verification token is required')
});

export const ResendEmailVerificationRequestSchema = z.object({
    email: z.string().email('Invalid email format')
});

// --- Game API Request Schemas ---

export const CreateGameRequestSchema = z.object({
    name: z.string().min(1, 'Game name is required'),
    gameTemplateId: z.string().uuid('Invalid game template ID').optional(),
    playMode: z.enum(['quiz', 'tournament', 'practice', 'class']),
    settings: z.record(z.any()).optional(),
    differedAvailableFrom: z.string().datetime().optional(),
    differedAvailableTo: z.string().datetime().optional(),
    // Additional fields for student tournaments
    gradeLevel: z.string().optional(),
    discipline: z.string().optional(),
    themes: z.array(z.string()).optional(),
    nbOfQuestions: z.number().int().positive().optional(),
    initiatorStudentId: z.string().uuid().optional(),
    status: z.enum(['pending', 'completed']).optional()
});

export const GameJoinRequestSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    username: z.string().optional(),
    avatar: z.string().optional()
});

export const GameStatusUpdateRequestSchema = z.object({
    status: z.enum(['pending', 'active', 'paused', 'completed', 'archived']),
    currentQuestionIndex: z.number().int().min(0).optional()
});

// --- Game Template API Request Schemas ---

export const CreateGameTemplateRequestSchema = z.object({
    name: z.string().min(1, 'Template name is required'),
    gradeLevel: z.string().optional(),
    themes: z.array(z.string()).min(1, 'At least one theme is required'),
    discipline: z.string().optional(),
    description: z.string().optional(),
    defaultMode: z.enum(['quiz', 'tournament', 'practice', 'class']).optional(),
    questionUids: z.array(z.string()).min(1, 'At least one question is required') // Temporarily allow any string format
});

export const UpdateGameTemplateRequestSchema = z.object({
    name: z.string().min(1).optional(),
    gradeLevel: z.string().optional(),
    themes: z.array(z.string()).optional(),
    discipline: z.string().optional(),
    description: z.string().optional(),
    defaultMode: z.enum(['quiz', 'tournament', 'practice', 'class']).optional(),
    questionUids: z.array(z.string()).optional() // Temporarily allow any string format
});

export const RenameGameTemplateRequestSchema = z.object({
    name: z.string().min(1, 'Le nom du modèle est requis').max(100, 'Le nom du modèle est trop long')
});

export const RenameGameInstanceRequestSchema = z.object({
    name: z.string().min(1, 'Le nom de la session est requis').max(100, 'Le nom de la session est trop long')
});

// --- Question API Request Schemas ---

export const CreateQuestionRequestSchema = z.object({
    title: z.string().optional(),
    text: z.string().min(1, 'Question text is required'),
    defaultMode: z.string().min(1, 'Question type is required'),
    discipline: z.string().min(1, 'Discipline is required'),
    gradeLevel: z.string().optional(),
    themes: z.array(z.string()).default([]),
    answerOptions: z.array(z.string()).optional(),
    correctAnswer: z.string().min(1, 'Correct answer is required'),
    explanationCorrect: z.string().optional(),
    explanationIncorrect: z.string().optional(),
    difficultyLevel: z.number().int().min(1).max(5).optional(),
    timeToSolve: z.number().int().positive().optional(),
    feedbackWaitTime: z.number().int().min(0).optional(),
    tags: z.array(z.string()).default([])
});

export const UpdateQuestionRequestSchema = CreateQuestionRequestSchema.partial();

// --- User API Request Schemas ---

export const UpdateUserRequestSchema = z.object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    gradeLevel: z.string().optional(),
    avatarEmoji: z.string().optional()
});

// --- Quiz Template API Request Schemas ---

export const CreateQuizTemplateRequestSchema = z.object({
    name: z.string().min(1, 'Quiz template name is required'),
    description: z.string().optional(),
    questionUids: z.array(z.string().uuid()).min(1, 'At least one question is required'),
    settings: z.record(z.any()).optional()
});

export const UpdateQuizTemplateRequestSchema = CreateQuizTemplateRequestSchema.partial();

// --- Game Control API Request Schemas ---

export const SetQuestionRequestSchema = z.object({
    questionIndex: z.number().int().min(0, 'Question index must be a non-negative integer')
});

// --- API Response Validation Schemas ---

// Base User Schema for responses
const ApiUserSchema = z.object({
    id: z.string(),
    username: z.string(),
    email: z.string().optional(),
    avatar: z.string(),
    role: z.enum(['STUDENT', 'TEACHER'])
});

// Auth Response Schemas
export const LoginResponseSchema = z.object({
    message: z.string(),
    token: z.string(),
    user: ApiUserSchema.optional(),
    // Legacy teacher-specific fields for backward compatibility
    enseignant: z.object({
        id: z.string(),
        username: z.string()
    }).optional(),
    enseignantId: z.string().optional(),
    username: z.string().optional(),
    avatar: z.string().optional(),
    cookie_id: z.string().optional(),
    role: z.string().optional(),
    success: z.boolean().optional()
});

export const RegisterResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    token: z.string().optional(), // Optional for email verification cases
    user: ApiUserSchema,
    requiresEmailVerification: z.boolean().optional() // Indicates email verification needed
});

export const UpgradeAccountResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    token: z.string(),
    user: ApiUserSchema
});

export const AuthStatusResponseSchema = z.object({
    authState: z.enum(['anonymous', 'student', 'teacher', 'guest']),
    cookiesFound: z.number(),
    cookieNames: z.array(z.string()),
    hasAuthToken: z.boolean(),
    hasTeacherToken: z.boolean(),
    timestamp: z.string(),
    user: ApiUserSchema.optional(),
    hasUserProfile: z.boolean().optional()
});

export const ProfileUpdateResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    user: ApiUserSchema
});

export const TeacherUpgradeResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    token: z.string(),
    user: ApiUserSchema
});

export const LogoutResponseSchema = z.object({
    success: z.boolean(),
    message: z.string()
});

// Error Response Schema
export const ErrorResponseSchema = z.object({
    error: z.string(),
    success: z.literal(false).optional(),
    details: z.any().optional(),
    required: z.array(z.string()).optional()
});

// For frontend compatibility - UniversalLoginResponse is a union of teacher/student responses
export const UniversalLoginResponseSchema = z.union([
    // Teacher login response format
    z.object({
        message: z.string(),
        enseignantId: z.string(),
        username: z.string().optional(),
        avatar: z.string().optional(),
        token: z.string()
    }),
    // Student login response format  
    z.object({
        success: z.boolean(),
        user: ApiUserSchema,
        token: z.string()
    })
]);

// --- Game API Response Schemas ---

export const GameCreationResponseSchema = z.object({
    gameInstance: SharedGameInstanceSchema
});

export const GameJoinResponseSchema = z.object({
    success: z.boolean(),
    gameInstance: SharedGameInstanceSchema,
    participant: participantSchema
});

export const GameStatusUpdateResponseSchema = z.object({
    gameInstance: SharedGameInstanceSchema
});

export const GameStateResponseSchema = z.object({
    status: z.string(),
    currentQuestionIndex: z.number(),
    accessCode: z.string(),
    name: z.string(),
    gameState: z.any().optional(),
    isLive: z.boolean()
});

// --- Leaderboard Schemas ---

const LeaderboardEntrySchema = z.object({
    userId: z.string(),
    username: z.string(),
    avatar: z.string().optional(),
    score: z.number(),
    rank: z.number().optional()
});

export const LeaderboardResponseSchema = z.object({
    leaderboard: z.array(LeaderboardEntrySchema)
});

export const TeacherActiveGamesResponseSchema = z.object({
    games: z.array(z.any())
});

export const GameInstancesByTemplateResponseSchema = z.object({
    gameInstances: z.array(SharedGameInstanceSchema)
});

// --- Question API Response Schemas ---

export const QuestionCreationResponseSchema = z.object({
    question: questionSchema
});

export const QuestionResponseSchema = z.object({
    question: questionSchema
});

export const QuestionsResponseSchema = z.object({
    questions: z.array(questionSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number()
});

// Questions list endpoint returns just UIDs as string array
export const QuestionsListResponseSchema = z.array(z.string());

export const QuestionUidsResponseSchema = z.object({
    questionUids: z.array(z.string()),
    total: z.number()
});

// FilterOption schema for enhanced filters with compatibility information
export const FilterOptionSchema = z.object({
    value: z.string(),
    label: z.string().optional(),
    isCompatible: z.boolean()
});

export const QuestionsFiltersResponseSchema = z.object({
    gradeLevel: z.array(FilterOptionSchema),
    disciplines: z.array(FilterOptionSchema),
    themes: z.array(FilterOptionSchema),
    tags: z.array(FilterOptionSchema).optional()
});

export const QuestionsCountResponseSchema = z.object({
    count: z.number()
});

// --- Game Template API Response Schemas ---

// Simple GameTemplate schema for API responses (without circular references)
const ApiGameTemplateSchema = z.object({
    id: z.string(),
    name: z.string(),
    gradeLevel: z.string().nullable().optional(),
    themes: z.array(z.string()),
    discipline: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    defaultMode: z.enum(['quiz', 'tournament', 'practice', 'class']).nullable().optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    creatorId: z.string(),
    // Optional relations - simplified for API responses
    creator: z.any().optional(),
    questions: z.array(questionSchema).optional(),
    gameInstances: z.array(z.any()).optional()
});

export const GameTemplateResponseSchema = z.object({
    gameTemplate: ApiGameTemplateSchema
});

export const GameTemplatesResponseSchema = z.object({
    gameTemplates: z.array(ApiGameTemplateSchema),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        pageSize: z.number(),
        totalPages: z.number()
    })
});

export const GameTemplateCreationResponseSchema = z.object({
    gameTemplate: ApiGameTemplateSchema
});

export const GameTemplateUpdateResponseSchema = z.object({
    message: z.string(),
    gameTemplate: ApiGameTemplateSchema
});

// --- Quiz Template API Response Schemas ---

export const QuizTemplateResponseSchema = z.object({
    gameTemplate: ApiGameTemplateSchema
});

export const QuizTemplatesResponseSchema = z.object({
    gameTemplates: z.array(ApiGameTemplateSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number()
});

export const QuizCreationResponseSchema = z.object({
    gameTemplate: ApiGameTemplateSchema
});

export const QuizTemplateCreationResponseSchema = QuizCreationResponseSchema; // Alias

export const QuizTemplateUpdateResponseSchema = z.object({
    gameTemplate: ApiGameTemplateSchema
});

export const QuizTemplateDeleteResponseSchema = z.object({
    success: z.boolean()
});

export const QuizTemplateQuestionResponseSchema = z.object({
    gameTemplate: ApiGameTemplateSchema
});

export const QuizListResponseSchema = z.object({
    gameTemplates: z.array(ApiGameTemplateSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number()
});

export const TeacherQuizQuestionsResponseSchema = z.object({
    questions: z.array(questionSchema),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        pageSize: z.number(),
        totalPages: z.number()
    })
});

export const TournamentCodeResponseSchema = z.object({
    code: z.string()
});

export const TournamentVerificationResponseSchema = z.object({
    verified: z.boolean(),
    gameTemplate: ApiGameTemplateSchema.optional()
});

// --- Tournament List Item & MyTournaments API Response Schemas ---

export const TournamentListItemSchema = z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    statut: z.string(), // Consider stricter enum if possible
    playMode: z.enum(['quiz', 'tournament', 'practice', 'class']),
    createdAt: z.string(),
    date_debut: z.string().nullable(),
    date_fin: z.string().nullable(),
    creatorUsername: z.string(),
    leaderboard: z.array(z.any()).optional(),
    position: z.number().optional(),
    score: z.number().optional()
});

export const MyTournamentsResponseSchema = z.object({
    pending: z.array(TournamentListItemSchema),
    active: z.array(TournamentListItemSchema),
    ended: z.array(TournamentListItemSchema)
});

export type TournamentListItem = z.infer<typeof TournamentListItemSchema>;
export type MyTournamentsResponse = z.infer<typeof MyTournamentsResponseSchema>;

// --- Generic Response Schemas ---

export const SuccessResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional()
});

// Type inference exports
// Request Types
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type CreateGameRequest = z.infer<typeof CreateGameRequestSchema>;
export type GameJoinRequest = z.infer<typeof GameJoinRequestSchema>;
export type GameStatusUpdateRequest = z.infer<typeof GameStatusUpdateRequestSchema>;
export type CreateGameTemplateRequest = z.infer<typeof CreateGameTemplateRequestSchema>;
export type UpdateGameTemplateRequest = z.infer<typeof UpdateGameTemplateRequestSchema>;
export type CreateQuestionRequest = z.infer<typeof CreateQuestionRequestSchema>;
export type UpdateQuestionRequest = z.infer<typeof UpdateQuestionRequestSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type CreateQuizTemplateRequest = z.infer<typeof CreateQuizTemplateRequestSchema>;
export type UpdateQuizTemplateRequest = z.infer<typeof UpdateQuizTemplateRequestSchema>;
export type UpgradeAccountRequest = z.infer<typeof UpgradeAccountRequestSchema>;
export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetConfirmRequest = z.infer<typeof PasswordResetConfirmRequestSchema>;
export type ProfileUpdateRequest = z.infer<typeof ProfileUpdateRequestSchema>;
export type TeacherUpgradeRequest = z.infer<typeof TeacherUpgradeRequestSchema>;
export type SendEmailVerificationRequest = z.infer<typeof SendEmailVerificationRequestSchema>;
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;
export type ResendEmailVerificationRequest = z.infer<typeof ResendEmailVerificationRequestSchema>;
export type SetQuestionRequest = z.infer<typeof SetQuestionRequestSchema>;
// Backward compatibility aliases
export type UpgradeRequest = UpgradeAccountRequest;

// Response Types
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type UpgradeAccountResponse = z.infer<typeof UpgradeAccountResponseSchema>;
export type AuthStatusResponse = z.infer<typeof AuthStatusResponseSchema>;
export type ProfileUpdateResponse = z.infer<typeof ProfileUpdateResponseSchema>;
export type TeacherUpgradeResponse = z.infer<typeof TeacherUpgradeResponseSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type GameCreationResponse = z.infer<typeof GameCreationResponseSchema>;
export type GameJoinResponse = z.infer<typeof GameJoinResponseSchema>;
export type GameStatusUpdateResponse = z.infer<typeof GameStatusUpdateResponseSchema>;
export type GameStateResponse = z.infer<typeof GameStateResponseSchema>;
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;
export type TeacherActiveGamesResponse = z.infer<typeof TeacherActiveGamesResponseSchema>;
export type GameInstancesByTemplateResponse = z.infer<typeof GameInstancesByTemplateResponseSchema>;
export type QuestionCreationResponse = z.infer<typeof QuestionCreationResponseSchema>;
export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;
export type QuestionsResponse = z.infer<typeof QuestionsResponseSchema>;
export type QuestionsListResponse = z.infer<typeof QuestionsListResponseSchema>;
export type QuestionUidsResponse = z.infer<typeof QuestionUidsResponseSchema>;
export type QuestionsFiltersResponse = z.infer<typeof QuestionsFiltersResponseSchema>;
export type QuestionsCountResponse = z.infer<typeof QuestionsCountResponseSchema>;
export type GameTemplateResponse = z.infer<typeof GameTemplateResponseSchema>;
export type GameTemplatesResponse = z.infer<typeof GameTemplatesResponseSchema>;
export type GameTemplateCreationResponse = z.infer<typeof GameTemplateCreationResponseSchema>;
export type GameTemplateUpdateResponse = z.infer<typeof GameTemplateUpdateResponseSchema>;
export type QuizTemplateResponse = z.infer<typeof QuizTemplateResponseSchema>;
export type QuizTemplatesResponse = z.infer<typeof QuizTemplatesResponseSchema>;
export type QuizCreationResponse = z.infer<typeof QuizCreationResponseSchema>;
export type QuizTemplateCreationResponse = z.infer<typeof QuizTemplateCreationResponseSchema>;
export type QuizTemplateUpdateResponse = z.infer<typeof QuizTemplateUpdateResponseSchema>;
export type QuizTemplateDeleteResponse = z.infer<typeof QuizTemplateDeleteResponseSchema>;
export type QuizTemplateQuestionResponse = z.infer<typeof QuizTemplateQuestionResponseSchema>;
export type QuizListResponse = z.infer<typeof QuizListResponseSchema>;
export type TeacherQuizQuestionsResponse = z.infer<typeof TeacherQuizQuestionsResponseSchema>;
export type TournamentCodeResponse = z.infer<typeof TournamentCodeResponseSchema>;
export type TournamentVerificationResponse = z.infer<typeof TournamentVerificationResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type UniversalLoginResponse = z.infer<typeof UniversalLoginResponseSchema>;

/**
 * Practice Session Validation Schemas
 * Zod schemas for runtime validation of practice mode data
 */

// Practice Session Settings Schema
export const PracticeSettingsSchema = z.object({
    gradeLevel: z.string().min(1, "Grade level is required"),
    discipline: z.string().min(1, "Discipline is required"),
    themes: z.array(z.string()).min(1, "At least one theme is required"),
    questionCount: z.number().int().min(1, "Question count must be at least 1").max(50, "Question count cannot exceed 50"),
    showImmediateFeedback: z.boolean(),
    allowRetry: z.boolean(),
    randomizeQuestions: z.boolean()
});

// Practice Answer Schema
export const PracticeAnswerSchema = z.object({
    questionUid: z.string().min(1, "Question UID is required"),
    selectedAnswers: z.array(z.number().int().min(0)),
    isCorrect: z.boolean(),
    submittedAt: z.date(),
    timeSpentMs: z.number().int().min(0, "Time spent must be non-negative"),
    attemptNumber: z.number().int().min(1, "Attempt number must be at least 1")
});

// Practice Question Data Schema
export const PracticeQuestionDataSchema = z.object({
    uid: z.string().min(1, "Question UID is required"),
    title: z.string().min(1, "Question title is required"),
    text: z.string().min(1, "Question text is required"),
    questionType: z.string().min(1, "Question type is required"),
    timeLimit: z.number().int().min(1),
    gradeLevel: z.string().min(1, "Grade level is required"),
    discipline: z.string().min(1, "Discipline is required"),
    themes: z.array(z.string()).min(1, "At least one theme is required"),

    // Polymorphic question data
    multipleChoiceQuestion: z.object({
        answerOptions: z.array(z.string()).min(2, "At least 2 answer options required"),
        correctAnswers: z.array(z.boolean())
    }).optional(),
    numericQuestion: z.object({
        correctAnswer: z.number(),
        tolerance: z.number().optional(),
        unit: z.string().optional()
    }).optional(),

    // Legacy fields for backward compatibility
    answerOptions: z.array(z.string()).optional(),
    correctAnswers: z.array(z.boolean()).optional()
}).refine((data) => {
    // Ensure appropriate question type data exists
    if (data.questionType === 'multipleChoice') {
        return !!(data.multipleChoiceQuestion || data.answerOptions);
    }
    if (data.questionType === 'numeric') {
        return !!data.numericQuestion;
    }
    return true;
}, {
    message: "Question must have appropriate type-specific data for its question type"
});

// Practice Statistics Schema
export const PracticeStatisticsSchema = z.object({
    questionsAttempted: z.number().int().min(0),
    correctAnswers: z.number().int().min(0),
    incorrectAnswers: z.number().int().min(0),
    accuracyPercentage: z.number().min(0).max(100),
    averageTimePerQuestion: z.number().min(0),
    totalTimeSpent: z.number().min(0),
    retriedQuestions: z.array(z.string())
});

// Practice Session Schema
export const PracticeSessionSchema = z.object({
    sessionId: z.string().min(1, "Session ID is required"),
    userId: z.string().min(1, "User ID is required"),
    settings: PracticeSettingsSchema,
    status: z.enum(['active', 'completed', 'abandoned']),
    questionPool: z.array(z.string()).min(1, "Question pool cannot be empty"),
    currentQuestionIndex: z.number().int().min(-1),
    currentQuestion: PracticeQuestionDataSchema.optional(),
    answers: z.array(PracticeAnswerSchema),
    statistics: PracticeStatisticsSchema,
    createdAt: z.date(),
    startedAt: z.date().optional(),
    completedAt: z.date().optional(),
    expiresAt: z.date()
});

// Practice Session Creation Request Schema
export const CreatePracticeSessionRequestSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    settings: PracticeSettingsSchema
});

// Practice Session Creation Response Schema
export const CreatePracticeSessionResponseSchema = z.object({
    session: PracticeSessionSchema,
    success: z.literal(true),
    message: z.string().optional()
});

// Practice Socket Event Schemas
export const StartPracticeSessionPayloadSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    settings: PracticeSettingsSchema,
    preferences: z.object({
        maxDurationMinutes: z.number().int().min(1).max(180).optional(),
        shuffleQuestions: z.boolean().optional()
    }).optional()
});

export const SubmitPracticeAnswerPayloadSchema = z.object({
    sessionId: z.string().min(1, "Session ID is required"),
    questionUid: z.string().min(1, "Question UID is required"),
    selectedAnswers: z.array(z.number().int().min(0)),
    timeSpentMs: z.number().int().min(0, "Time spent must be non-negative")
});

export const GetNextPracticeQuestionPayloadSchema = z.object({
    sessionId: z.string().min(1, "Session ID is required"),
    skipCurrent: z.boolean().optional()
});

export const RetryPracticeQuestionPayloadSchema = z.object({
    sessionId: z.string().min(1, "Session ID is required"),
    questionUid: z.string().min(1, "Question UID is required")
});

export const EndPracticeSessionPayloadSchema = z.object({
    sessionId: z.string().min(1, "Session ID is required"),
    reason: z.enum(['completed', 'user_quit', 'timeout'])
});

export const GetPracticeSessionStatePayloadSchema = z.object({
    sessionId: z.string().min(1, "Session ID is required")
});

// Practice API Request Schemas
export const CreatePracticeSessionApiRequestSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    settings: PracticeSettingsSchema
});

export const GetPracticeSessionsApiRequestSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    status: z.enum(['active', 'completed', 'abandoned']).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional()
});

export const UpdatePracticeSessionApiRequestSchema = z.object({
    sessionId: z.string().min(1, "Session ID is required"),
    settings: PracticeSettingsSchema.partial()
});

export const GetPracticeQuestionsApiRequestSchema = z.object({
    gradeLevel: z.string().min(1, "Grade level is required"),
    discipline: z.string().min(1, "Discipline is required"),
    themes: z.array(z.string()).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    excludeQuestions: z.array(z.string()).optional()
});

// Practice API Response Schemas
export const CreatePracticeSessionApiResponseSchema = z.object({
    success: z.boolean(),
    session: PracticeSessionSchema.optional(),
    error: z.string().optional(),
    statusCode: z.number().int()
});

export const GetPracticeSessionApiResponseSchema = z.object({
    success: z.boolean(),
    session: PracticeSessionSchema.optional(),
    error: z.string().optional(),
    statusCode: z.number().int()
});

export const GetPracticeSessionsApiResponseSchema = z.object({
    success: z.boolean(),
    sessions: z.array(PracticeSessionSchema).optional(),
    pagination: z.object({
        total: z.number().int().min(0),
        page: z.number().int().min(1),
        pageSize: z.number().int().min(1),
        totalPages: z.number().int().min(0)
    }).optional(),
    error: z.string().optional(),
    statusCode: z.number().int()
});

export const GetPracticeQuestionsApiResponseSchema = z.object({
    success: z.boolean(),
    questionUids: z.array(z.string()).optional(),
    totalAvailable: z.number().int().min(0).optional(),
    error: z.string().optional(),
    statusCode: z.number().int()
});

// Infer types from schemas for use in TypeScript
export type PracticeSettings = z.infer<typeof PracticeSettingsSchema>;
export type PracticeAnswer = z.infer<typeof PracticeAnswerSchema>;
export type PracticeQuestionData = z.infer<typeof PracticeQuestionDataSchema>;
export type PracticeStatistics = z.infer<typeof PracticeStatisticsSchema>;
export type PracticeSession = z.infer<typeof PracticeSessionSchema>;
export type CreatePracticeSessionRequest = z.infer<typeof CreatePracticeSessionRequestSchema>;
export type CreatePracticeSessionResponse = z.infer<typeof CreatePracticeSessionResponseSchema>;
export type StartPracticeSessionPayload = z.infer<typeof StartPracticeSessionPayloadSchema>;
export type SubmitPracticeAnswerPayload = z.infer<typeof SubmitPracticeAnswerPayloadSchema>;
export type GetNextPracticeQuestionPayload = z.infer<typeof GetNextPracticeQuestionPayloadSchema>;
export type RetryPracticeQuestionPayload = z.infer<typeof RetryPracticeQuestionPayloadSchema>;
export type EndPracticeSessionPayload = z.infer<typeof EndPracticeSessionPayloadSchema>;
export type GetPracticeSessionStatePayload = z.infer<typeof GetPracticeSessionStatePayloadSchema>;
export type CreatePracticeSessionApiRequest = z.infer<typeof CreatePracticeSessionApiRequestSchema>;
export type GetPracticeSessionsApiRequest = z.infer<typeof GetPracticeSessionsApiRequestSchema>;
export type UpdatePracticeSessionApiRequest = z.infer<typeof UpdatePracticeSessionApiRequestSchema>;
export type GetPracticeQuestionsApiRequest = z.infer<typeof GetPracticeQuestionsApiRequestSchema>;
export type GetPracticeSessionApiResponse = z.infer<typeof GetPracticeSessionApiResponseSchema>;
export type GetPracticeSessionsApiResponse = z.infer<typeof GetPracticeSessionsApiResponseSchema>;
export type GetPracticeQuestionsApiResponse = z.infer<typeof GetPracticeQuestionsApiResponseSchema>;
export type CreatePracticeSessionApiResponse = z.infer<typeof CreatePracticeSessionApiResponseSchema>;

export type RenameGameTemplateRequest = z.infer<typeof RenameGameTemplateRequestSchema>;
export type RenameGameInstanceRequest = z.infer<typeof RenameGameInstanceRequestSchema>;
