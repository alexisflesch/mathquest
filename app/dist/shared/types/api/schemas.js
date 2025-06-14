"use strict";
/**
 * Zod validation schemas for API requests and responses
 *
 * These schemas provide runtime validation for API payloads
 * and can be used to infer TypeScript types.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizTemplateQuestionResponseSchema = exports.QuizTemplateDeleteResponseSchema = exports.QuizTemplateUpdateResponseSchema = exports.QuizTemplateCreationResponseSchema = exports.QuizCreationResponseSchema = exports.QuizTemplatesResponseSchema = exports.QuizTemplateResponseSchema = exports.GameTemplateUpdateResponseSchema = exports.GameTemplateCreationResponseSchema = exports.GameTemplatesResponseSchema = exports.GameTemplateResponseSchema = exports.QuestionsCountResponseSchema = exports.QuestionsFiltersResponseSchema = exports.QuestionUidsResponseSchema = exports.QuestionsListResponseSchema = exports.QuestionsResponseSchema = exports.QuestionResponseSchema = exports.QuestionCreationResponseSchema = exports.GameInstancesByTemplateResponseSchema = exports.TeacherActiveGamesResponseSchema = exports.LeaderboardResponseSchema = exports.GameStateResponseSchema = exports.GameStatusUpdateResponseSchema = exports.GameJoinResponseSchema = exports.GameCreationResponseSchema = exports.UniversalLoginResponseSchema = exports.ErrorResponseSchema = exports.LogoutResponseSchema = exports.ProfileUpdateResponseSchema = exports.AuthStatusResponseSchema = exports.UpgradeAccountResponseSchema = exports.RegisterResponseSchema = exports.LoginResponseSchema = exports.SetQuestionRequestSchema = exports.UpdateQuizTemplateRequestSchema = exports.CreateQuizTemplateRequestSchema = exports.UpdateUserRequestSchema = exports.UpdateQuestionRequestSchema = exports.CreateQuestionRequestSchema = exports.UpdateGameTemplateRequestSchema = exports.CreateGameTemplateRequestSchema = exports.GameStatusUpdateRequestSchema = exports.GameJoinRequestSchema = exports.CreateGameRequestSchema = exports.ProfileUpdateRequestSchema = exports.PasswordResetConfirmRequestSchema = exports.PasswordResetRequestSchema = exports.UpgradeAccountRequestSchema = exports.RegisterRequestSchema = exports.LoginRequestSchema = void 0;
exports.SuccessResponseSchema = exports.TournamentVerificationResponseSchema = exports.TournamentCodeResponseSchema = exports.TeacherQuizQuestionsResponseSchema = exports.QuizListResponseSchema = void 0;
const zod_1 = require("zod");
const question_zod_1 = require("../quiz/question.zod");
const game_zod_1 = require("../core/game.zod");
const participant_zod_1 = require("../tournament/participant.zod");
// --- Auth API Request Schemas ---
exports.LoginRequestSchema = zod_1.z.object({
    action: zod_1.z.enum(['login', 'teacher_login']).optional(),
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
    username: zod_1.z.string().optional() // For backwards compatibility
});
exports.RegisterRequestSchema = zod_1.z.object({
    action: zod_1.z.enum(['teacher_register', 'teacher_signup']).optional(),
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
    email: zod_1.z.string().email('Invalid email format').optional(),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.enum(['STUDENT', 'TEACHER']).optional(),
    gradeLevel: zod_1.z.string().optional(),
    avatar: zod_1.z.string().optional(),
    cookieId: zod_1.z.string().optional(),
    adminPassword: zod_1.z.string().optional(),
    name: zod_1.z.string().optional(), // For teacher registration
    prenom: zod_1.z.string().optional() // For teacher registration
});
// --- Additional Auth Request Schemas ---
exports.UpgradeAccountRequestSchema = zod_1.z.object({
    cookieId: zod_1.z.string().min(1, 'Cookie ID is required'),
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    targetRole: zod_1.z.enum(['STUDENT', 'TEACHER']).optional(),
    adminPassword: zod_1.z.string().optional()
});
exports.PasswordResetRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format')
});
exports.PasswordResetConfirmRequestSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters')
});
exports.ProfileUpdateRequestSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
    avatar: zod_1.z.string().min(1, 'Avatar is required')
});
// --- Game API Request Schemas ---
exports.CreateGameRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Game name is required'),
    gameTemplateId: zod_1.z.string().uuid('Invalid game template ID').optional(),
    playMode: zod_1.z.enum(['quiz', 'tournament', 'practice', 'class']),
    settings: zod_1.z.record(zod_1.z.any()).optional(),
    isDiffered: zod_1.z.boolean().optional(),
    differedAvailableFrom: zod_1.z.string().datetime().optional(),
    differedAvailableTo: zod_1.z.string().datetime().optional(),
    // Additional fields for student tournaments
    gradeLevel: zod_1.z.string().optional(),
    discipline: zod_1.z.string().optional(),
    themes: zod_1.z.array(zod_1.z.string()).optional(),
    nbOfQuestions: zod_1.z.number().int().positive().optional(),
    initiatorStudentId: zod_1.z.string().uuid().optional()
});
exports.GameJoinRequestSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID'),
    username: zod_1.z.string().optional(),
    avatar: zod_1.z.string().optional()
});
exports.GameStatusUpdateRequestSchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'active', 'paused', 'completed', 'archived']),
    currentQuestionIndex: zod_1.z.number().int().min(0).optional()
});
// --- Game Template API Request Schemas ---
exports.CreateGameTemplateRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Template name is required'),
    gradeLevel: zod_1.z.string().optional(),
    themes: zod_1.z.array(zod_1.z.string()).min(1, 'At least one theme is required'),
    discipline: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    defaultMode: zod_1.z.enum(['quiz', 'tournament', 'practice', 'class']).optional(),
    questionUids: zod_1.z.array(zod_1.z.string().uuid()).min(1, 'At least one question is required')
});
exports.UpdateGameTemplateRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    gradeLevel: zod_1.z.string().optional(),
    themes: zod_1.z.array(zod_1.z.string()).optional(),
    discipline: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    defaultMode: zod_1.z.enum(['quiz', 'tournament', 'practice', 'class']).optional(),
    questionUids: zod_1.z.array(zod_1.z.string().uuid()).optional()
});
// --- Question API Request Schemas ---
exports.CreateQuestionRequestSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    text: zod_1.z.string().min(1, 'Question text is required'),
    defaultMode: zod_1.z.string().min(1, 'Question type is required'),
    discipline: zod_1.z.string().min(1, 'Discipline is required'),
    gradeLevel: zod_1.z.string().optional(),
    themes: zod_1.z.array(zod_1.z.string()).default([]),
    answerOptions: zod_1.z.array(zod_1.z.string()).optional(),
    correctAnswer: zod_1.z.string().min(1, 'Correct answer is required'),
    explanationCorrect: zod_1.z.string().optional(),
    explanationIncorrect: zod_1.z.string().optional(),
    difficultyLevel: zod_1.z.number().int().min(1).max(5).optional(),
    timeToSolve: zod_1.z.number().int().positive().optional(),
    feedbackWaitTime: zod_1.z.number().int().min(0).optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([])
});
exports.UpdateQuestionRequestSchema = exports.CreateQuestionRequestSchema.partial();
// --- User API Request Schemas ---
exports.UpdateUserRequestSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).optional(),
    email: zod_1.z.string().email().optional(),
    gradeLevel: zod_1.z.string().optional(),
    avatarEmoji: zod_1.z.string().optional()
});
// --- Quiz Template API Request Schemas ---
exports.CreateQuizTemplateRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Quiz template name is required'),
    description: zod_1.z.string().optional(),
    questionUids: zod_1.z.array(zod_1.z.string().uuid()).min(1, 'At least one question is required'),
    settings: zod_1.z.record(zod_1.z.any()).optional()
});
exports.UpdateQuizTemplateRequestSchema = exports.CreateQuizTemplateRequestSchema.partial();
// --- Game Control API Request Schemas ---
exports.SetQuestionRequestSchema = zod_1.z.object({
    questionIndex: zod_1.z.number().int().min(0, 'Question index must be a non-negative integer')
});
// --- API Response Validation Schemas ---
// Base User Schema for responses
const ApiUserSchema = zod_1.z.object({
    id: zod_1.z.string(),
    username: zod_1.z.string(),
    email: zod_1.z.string().optional(),
    avatar: zod_1.z.string(),
    role: zod_1.z.enum(['STUDENT', 'TEACHER'])
});
// Auth Response Schemas
exports.LoginResponseSchema = zod_1.z.object({
    message: zod_1.z.string(),
    token: zod_1.z.string(),
    user: ApiUserSchema.optional(),
    // Legacy teacher-specific fields for backward compatibility
    enseignant: zod_1.z.object({
        id: zod_1.z.string(),
        username: zod_1.z.string()
    }).optional(),
    enseignantId: zod_1.z.string().optional(),
    username: zod_1.z.string().optional(),
    avatar: zod_1.z.string().optional(),
    cookie_id: zod_1.z.string().optional(),
    role: zod_1.z.string().optional(),
    success: zod_1.z.boolean().optional()
});
exports.RegisterResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string(),
    token: zod_1.z.string(),
    user: ApiUserSchema
});
exports.UpgradeAccountResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string(),
    token: zod_1.z.string(),
    user: ApiUserSchema
});
exports.AuthStatusResponseSchema = zod_1.z.object({
    authState: zod_1.z.string(),
    cookiesFound: zod_1.z.number(),
    cookieNames: zod_1.z.array(zod_1.z.string()),
    hasAuthToken: zod_1.z.boolean(),
    hasTeacherToken: zod_1.z.boolean(),
    timestamp: zod_1.z.string(),
    user: ApiUserSchema.optional(),
    hasUserProfile: zod_1.z.boolean().optional()
});
exports.ProfileUpdateResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string(),
    user: ApiUserSchema
});
exports.LogoutResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string()
});
// Error Response Schema
exports.ErrorResponseSchema = zod_1.z.object({
    error: zod_1.z.string(),
    success: zod_1.z.literal(false).optional(),
    details: zod_1.z.any().optional(),
    required: zod_1.z.array(zod_1.z.string()).optional()
});
// For frontend compatibility - UniversalLoginResponse is a union of teacher/student responses
exports.UniversalLoginResponseSchema = zod_1.z.union([
    // Teacher login response format
    zod_1.z.object({
        message: zod_1.z.string(),
        enseignantId: zod_1.z.string(),
        username: zod_1.z.string().optional(),
        avatar: zod_1.z.string().optional(),
        token: zod_1.z.string()
    }),
    // Student login response format  
    zod_1.z.object({
        success: zod_1.z.boolean(),
        user: ApiUserSchema,
        token: zod_1.z.string()
    })
]);
// --- Game API Response Schemas ---
exports.GameCreationResponseSchema = zod_1.z.object({
    gameInstance: game_zod_1.GameInstanceSchema
});
exports.GameJoinResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    gameInstance: game_zod_1.GameInstanceSchema,
    participant: participant_zod_1.participantSchema
});
exports.GameStatusUpdateResponseSchema = zod_1.z.object({
    gameInstance: game_zod_1.GameInstanceSchema
});
exports.GameStateResponseSchema = zod_1.z.object({
    status: zod_1.z.string(),
    currentQuestionIndex: zod_1.z.number(),
    accessCode: zod_1.z.string(),
    name: zod_1.z.string(),
    gameState: zod_1.z.any().optional(),
    isLive: zod_1.z.boolean()
});
// --- Leaderboard Schemas ---
const LeaderboardEntrySchema = zod_1.z.object({
    userId: zod_1.z.string(),
    username: zod_1.z.string(),
    avatar: zod_1.z.string().optional(),
    score: zod_1.z.number(),
    rank: zod_1.z.number().optional()
});
exports.LeaderboardResponseSchema = zod_1.z.object({
    leaderboard: zod_1.z.array(LeaderboardEntrySchema)
});
exports.TeacherActiveGamesResponseSchema = zod_1.z.object({
    games: zod_1.z.array(zod_1.z.any())
});
exports.GameInstancesByTemplateResponseSchema = zod_1.z.object({
    gameInstances: zod_1.z.array(game_zod_1.GameInstanceSchema)
});
// --- Question API Response Schemas ---
exports.QuestionCreationResponseSchema = zod_1.z.object({
    question: question_zod_1.questionSchema
});
exports.QuestionResponseSchema = zod_1.z.object({
    question: question_zod_1.questionSchema
});
exports.QuestionsResponseSchema = zod_1.z.object({
    questions: zod_1.z.array(question_zod_1.questionSchema),
    meta: zod_1.z.object({
        total: zod_1.z.number(),
        page: zod_1.z.number(),
        pageSize: zod_1.z.number(),
        totalPages: zod_1.z.number()
    })
});
exports.QuestionsListResponseSchema = exports.QuestionsResponseSchema; // Alias
exports.QuestionUidsResponseSchema = zod_1.z.object({
    questionUids: zod_1.z.array(zod_1.z.string()),
    total: zod_1.z.number()
});
exports.QuestionsFiltersResponseSchema = zod_1.z.object({
    gradeLevel: zod_1.z.array(zod_1.z.string().nullable()),
    disciplines: zod_1.z.array(zod_1.z.string()),
    themes: zod_1.z.array(zod_1.z.string())
});
exports.QuestionsCountResponseSchema = zod_1.z.object({
    count: zod_1.z.number()
});
// --- Game Template API Response Schemas ---
// Simple GameTemplate schema for API responses (without circular references)
const ApiGameTemplateSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    gradeLevel: zod_1.z.string().nullable().optional(),
    themes: zod_1.z.array(zod_1.z.string()),
    discipline: zod_1.z.string().nullable().optional(),
    description: zod_1.z.string().nullable().optional(),
    defaultMode: zod_1.z.enum(['quiz', 'tournament', 'practice', 'class']).nullable().optional(),
    createdAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date(),
    creatorId: zod_1.z.string(),
    // Optional relations - simplified for API responses
    creator: zod_1.z.any().optional(),
    questions: zod_1.z.array(question_zod_1.questionSchema).optional(),
    gameInstances: zod_1.z.array(zod_1.z.any()).optional()
});
exports.GameTemplateResponseSchema = zod_1.z.object({
    gameTemplate: ApiGameTemplateSchema
});
exports.GameTemplatesResponseSchema = zod_1.z.object({
    gameTemplates: zod_1.z.array(ApiGameTemplateSchema),
    meta: zod_1.z.object({
        total: zod_1.z.number(),
        page: zod_1.z.number(),
        pageSize: zod_1.z.number(),
        totalPages: zod_1.z.number()
    })
});
exports.GameTemplateCreationResponseSchema = zod_1.z.object({
    gameTemplate: ApiGameTemplateSchema
});
exports.GameTemplateUpdateResponseSchema = zod_1.z.object({
    message: zod_1.z.string(),
    gameTemplate: ApiGameTemplateSchema
});
// --- Quiz Template API Response Schemas ---
exports.QuizTemplateResponseSchema = zod_1.z.object({
    gameTemplate: ApiGameTemplateSchema
});
exports.QuizTemplatesResponseSchema = zod_1.z.object({
    gameTemplates: zod_1.z.array(ApiGameTemplateSchema),
    total: zod_1.z.number(),
    page: zod_1.z.number(),
    pageSize: zod_1.z.number(),
    totalPages: zod_1.z.number()
});
exports.QuizCreationResponseSchema = zod_1.z.object({
    gameTemplate: ApiGameTemplateSchema
});
exports.QuizTemplateCreationResponseSchema = exports.QuizCreationResponseSchema; // Alias
exports.QuizTemplateUpdateResponseSchema = zod_1.z.object({
    gameTemplate: ApiGameTemplateSchema
});
exports.QuizTemplateDeleteResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean()
});
exports.QuizTemplateQuestionResponseSchema = zod_1.z.object({
    gameTemplate: ApiGameTemplateSchema
});
exports.QuizListResponseSchema = zod_1.z.object({
    gameTemplates: zod_1.z.array(ApiGameTemplateSchema),
    total: zod_1.z.number(),
    page: zod_1.z.number(),
    pageSize: zod_1.z.number(),
    totalPages: zod_1.z.number()
});
exports.TeacherQuizQuestionsResponseSchema = zod_1.z.object({
    questions: zod_1.z.array(question_zod_1.questionSchema),
    meta: zod_1.z.object({
        total: zod_1.z.number(),
        page: zod_1.z.number(),
        pageSize: zod_1.z.number(),
        totalPages: zod_1.z.number()
    })
});
exports.TournamentCodeResponseSchema = zod_1.z.object({
    code: zod_1.z.string()
});
exports.TournamentVerificationResponseSchema = zod_1.z.object({
    verified: zod_1.z.boolean(),
    gameTemplate: ApiGameTemplateSchema.optional()
});
// --- Generic Response Schemas ---
exports.SuccessResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string().optional()
});
