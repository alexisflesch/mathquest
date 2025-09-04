"use strict";
/**
 * Zod validation schemas for API requests and responses
 *
 * These schemas provide runtime validation for API payloads
 * and can be used to infer TypeScript types.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameTemplateUpdateResponseSchema = exports.GameTemplateCreationResponseSchema = exports.GameTemplatesResponseSchema = exports.GameTemplateResponseSchema = exports.QuestionsCountResponseSchema = exports.QuestionsFiltersResponseSchema = exports.QuestionUidsResponseSchema = exports.QuestionsListResponseSchema = exports.QuestionsResponseSchema = exports.QuestionResponseSchema = exports.QuestionCreationResponseSchema = exports.GameInstancesByTemplateResponseSchema = exports.TeacherActiveGamesResponseSchema = exports.LeaderboardResponseSchema = exports.GameStateResponseSchema = exports.GameStatusUpdateResponseSchema = exports.GameJoinResponseSchema = exports.GameCreationResponseSchema = exports.UniversalLoginResponseSchema = exports.ErrorResponseSchema = exports.LogoutResponseSchema = exports.TeacherUpgradeResponseSchema = exports.ProfileUpdateResponseSchema = exports.AuthStatusResponseSchema = exports.UpgradeAccountResponseSchema = exports.RegisterResponseSchema = exports.LoginResponseSchema = exports.SetQuestionRequestSchema = exports.UpdateQuizTemplateRequestSchema = exports.CreateQuizTemplateRequestSchema = exports.UpdateUserRequestSchema = exports.UpdateQuestionRequestSchema = exports.CreateQuestionRequestSchema = exports.RenameGameInstanceRequestSchema = exports.RenameGameTemplateRequestSchema = exports.UpdateGameTemplateRequestSchema = exports.CreateGameTemplateRequestSchema = exports.GameStatusUpdateRequestSchema = exports.GameJoinRequestSchema = exports.CreateGameRequestSchema = exports.ResendEmailVerificationRequestSchema = exports.VerifyEmailRequestSchema = exports.SendEmailVerificationRequestSchema = exports.TeacherUpgradeRequestSchema = exports.ProfileUpdateRequestSchema = exports.PasswordResetConfirmRequestSchema = exports.PasswordResetRequestSchema = exports.UpgradeAccountRequestSchema = exports.RegisterRequestSchema = exports.LoginRequestSchema = void 0;
exports.GetPracticeQuestionsApiResponseSchema = exports.GetPracticeSessionsApiResponseSchema = exports.GetPracticeSessionApiResponseSchema = exports.CreatePracticeSessionApiResponseSchema = exports.GetPracticeQuestionsApiRequestSchema = exports.UpdatePracticeSessionApiRequestSchema = exports.GetPracticeSessionsApiRequestSchema = exports.CreatePracticeSessionApiRequestSchema = exports.GetPracticeSessionStatePayloadSchema = exports.EndPracticeSessionPayloadSchema = exports.RetryPracticeQuestionPayloadSchema = exports.GetNextPracticeQuestionPayloadSchema = exports.SubmitPracticeAnswerPayloadSchema = exports.StartPracticeSessionPayloadSchema = exports.CreatePracticeSessionResponseSchema = exports.CreatePracticeSessionRequestSchema = exports.PracticeSessionSchema = exports.PracticeStatisticsSchema = exports.PracticeQuestionDataSchema = exports.PracticeAnswerSchema = exports.PracticeSettingsSchema = exports.SuccessResponseSchema = exports.MyTournamentsResponseSchema = exports.TournamentListItemSchema = exports.TournamentVerificationResponseSchema = exports.TournamentCodeResponseSchema = exports.TeacherQuizQuestionsResponseSchema = exports.QuizListResponseSchema = exports.QuizTemplateQuestionResponseSchema = exports.QuizTemplateDeleteResponseSchema = exports.QuizTemplateUpdateResponseSchema = exports.QuizTemplateCreationResponseSchema = exports.QuizCreationResponseSchema = exports.QuizTemplatesResponseSchema = exports.QuizTemplateResponseSchema = void 0;
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
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters').optional(), // Optional for guest users
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
exports.TeacherUpgradeRequestSchema = zod_1.z.object({
    adminPassword: zod_1.z.string().min(1, 'Admin password is required')
});
exports.SendEmailVerificationRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format')
});
exports.VerifyEmailRequestSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Verification token is required')
});
exports.ResendEmailVerificationRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format')
});
// --- Game API Request Schemas ---
exports.CreateGameRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Game name is required'),
    gameTemplateId: zod_1.z.string().uuid('Invalid game template ID').optional(),
    playMode: zod_1.z.enum(['quiz', 'tournament', 'practice', 'class']),
    settings: zod_1.z.record(zod_1.z.any()).optional(),
    differedAvailableFrom: zod_1.z.string().datetime().optional(),
    differedAvailableTo: zod_1.z.string().datetime().optional(),
    // Additional fields for student tournaments
    gradeLevel: zod_1.z.string().optional(),
    discipline: zod_1.z.string().optional(),
    themes: zod_1.z.array(zod_1.z.string()).optional(),
    nbOfQuestions: zod_1.z.number().int().positive().optional(),
    initiatorStudentId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(['pending', 'completed']).optional()
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
    questionUids: zod_1.z.array(zod_1.z.string()).min(1, 'At least one question is required') // Temporarily allow any string format
});
exports.UpdateGameTemplateRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    gradeLevel: zod_1.z.string().optional(),
    themes: zod_1.z.array(zod_1.z.string()).optional(),
    discipline: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    defaultMode: zod_1.z.enum(['quiz', 'tournament', 'practice', 'class']).optional(),
    questionUids: zod_1.z.array(zod_1.z.string()).optional() // Temporarily allow any string format
});
exports.RenameGameTemplateRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Le nom du modèle est requis').max(100, 'Le nom du modèle est trop long')
});
exports.RenameGameInstanceRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Le nom de la session est requis').max(100, 'Le nom de la session est trop long')
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
    token: zod_1.z.string().optional(), // Optional for email verification cases
    user: ApiUserSchema,
    requiresEmailVerification: zod_1.z.boolean().optional() // Indicates email verification needed
});
exports.UpgradeAccountResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string(),
    token: zod_1.z.string(),
    user: ApiUserSchema
});
exports.AuthStatusResponseSchema = zod_1.z.object({
    authState: zod_1.z.enum(['anonymous', 'student', 'teacher', 'guest']),
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
exports.TeacherUpgradeResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string(),
    token: zod_1.z.string(),
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
    total: zod_1.z.number(),
    page: zod_1.z.number(),
    pageSize: zod_1.z.number(),
    totalPages: zod_1.z.number()
});
// Questions list endpoint returns just UIDs as string array
exports.QuestionsListResponseSchema = zod_1.z.array(zod_1.z.string());
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
// --- Tournament List Item & MyTournaments API Response Schemas ---
exports.TournamentListItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    code: zod_1.z.string(),
    name: zod_1.z.string(),
    statut: zod_1.z.string(), // Consider stricter enum if possible
    playMode: zod_1.z.enum(['quiz', 'tournament', 'practice', 'class']),
    createdAt: zod_1.z.string(),
    date_debut: zod_1.z.string().nullable(),
    date_fin: zod_1.z.string().nullable(),
    creatorUsername: zod_1.z.string(),
    leaderboard: zod_1.z.array(zod_1.z.any()).optional(),
    position: zod_1.z.number().optional(),
    score: zod_1.z.number().optional()
});
exports.MyTournamentsResponseSchema = zod_1.z.object({
    pending: zod_1.z.array(exports.TournamentListItemSchema),
    active: zod_1.z.array(exports.TournamentListItemSchema),
    ended: zod_1.z.array(exports.TournamentListItemSchema)
});
// --- Generic Response Schemas ---
exports.SuccessResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string().optional()
});
/**
 * Practice Session Validation Schemas
 * Zod schemas for runtime validation of practice mode data
 */
// Practice Session Settings Schema
exports.PracticeSettingsSchema = zod_1.z.object({
    gradeLevel: zod_1.z.string().min(1, "Grade level is required"),
    discipline: zod_1.z.string().min(1, "Discipline is required"),
    themes: zod_1.z.array(zod_1.z.string()).min(1, "At least one theme is required"),
    questionCount: zod_1.z.number().int().min(1, "Question count must be at least 1").max(50, "Question count cannot exceed 50"),
    showImmediateFeedback: zod_1.z.boolean(),
    allowRetry: zod_1.z.boolean(),
    randomizeQuestions: zod_1.z.boolean()
});
// Practice Answer Schema
exports.PracticeAnswerSchema = zod_1.z.object({
    questionUid: zod_1.z.string().min(1, "Question UID is required"),
    selectedAnswers: zod_1.z.array(zod_1.z.number().int().min(0)),
    isCorrect: zod_1.z.boolean(),
    submittedAt: zod_1.z.date(),
    timeSpentMs: zod_1.z.number().int().min(0, "Time spent must be non-negative"),
    attemptNumber: zod_1.z.number().int().min(1, "Attempt number must be at least 1")
});
// Practice Question Data Schema
exports.PracticeQuestionDataSchema = zod_1.z.object({
    uid: zod_1.z.string().min(1, "Question UID is required"),
    title: zod_1.z.string().min(1, "Question title is required"),
    text: zod_1.z.string().min(1, "Question text is required"),
    questionType: zod_1.z.string().min(1, "Question type is required"),
    timeLimit: zod_1.z.number().int().min(1),
    gradeLevel: zod_1.z.string().min(1, "Grade level is required"),
    discipline: zod_1.z.string().min(1, "Discipline is required"),
    themes: zod_1.z.array(zod_1.z.string()).min(1, "At least one theme is required"),
    // Polymorphic question data
    multipleChoiceQuestion: zod_1.z.object({
        answerOptions: zod_1.z.array(zod_1.z.string()).min(2, "At least 2 answer options required"),
        correctAnswers: zod_1.z.array(zod_1.z.boolean())
    }).optional(),
    numericQuestion: zod_1.z.object({
        correctAnswer: zod_1.z.number(),
        tolerance: zod_1.z.number().optional(),
        unit: zod_1.z.string().optional()
    }).optional(),
    // Legacy fields for backward compatibility
    answerOptions: zod_1.z.array(zod_1.z.string()).optional(),
    correctAnswers: zod_1.z.array(zod_1.z.boolean()).optional()
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
exports.PracticeStatisticsSchema = zod_1.z.object({
    questionsAttempted: zod_1.z.number().int().min(0),
    correctAnswers: zod_1.z.number().int().min(0),
    incorrectAnswers: zod_1.z.number().int().min(0),
    accuracyPercentage: zod_1.z.number().min(0).max(100),
    averageTimePerQuestion: zod_1.z.number().min(0),
    totalTimeSpent: zod_1.z.number().min(0),
    retriedQuestions: zod_1.z.array(zod_1.z.string())
});
// Practice Session Schema
exports.PracticeSessionSchema = zod_1.z.object({
    sessionId: zod_1.z.string().min(1, "Session ID is required"),
    userId: zod_1.z.string().min(1, "User ID is required"),
    settings: exports.PracticeSettingsSchema,
    status: zod_1.z.enum(['active', 'completed', 'abandoned']),
    questionPool: zod_1.z.array(zod_1.z.string()).min(1, "Question pool cannot be empty"),
    currentQuestionIndex: zod_1.z.number().int().min(-1),
    currentQuestion: exports.PracticeQuestionDataSchema.optional(),
    answers: zod_1.z.array(exports.PracticeAnswerSchema),
    statistics: exports.PracticeStatisticsSchema,
    createdAt: zod_1.z.date(),
    startedAt: zod_1.z.date().optional(),
    completedAt: zod_1.z.date().optional(),
    expiresAt: zod_1.z.date()
});
// Practice Session Creation Request Schema
exports.CreatePracticeSessionRequestSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, "User ID is required"),
    settings: exports.PracticeSettingsSchema
});
// Practice Session Creation Response Schema
exports.CreatePracticeSessionResponseSchema = zod_1.z.object({
    session: exports.PracticeSessionSchema,
    success: zod_1.z.literal(true),
    message: zod_1.z.string().optional()
});
// Practice Socket Event Schemas
exports.StartPracticeSessionPayloadSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, "User ID is required"),
    settings: exports.PracticeSettingsSchema,
    preferences: zod_1.z.object({
        maxDurationMinutes: zod_1.z.number().int().min(1).max(180).optional(),
        shuffleQuestions: zod_1.z.boolean().optional()
    }).optional()
});
exports.SubmitPracticeAnswerPayloadSchema = zod_1.z.object({
    sessionId: zod_1.z.string().min(1, "Session ID is required"),
    questionUid: zod_1.z.string().min(1, "Question UID is required"),
    selectedAnswers: zod_1.z.array(zod_1.z.number().int().min(0)),
    timeSpentMs: zod_1.z.number().int().min(0, "Time spent must be non-negative")
});
exports.GetNextPracticeQuestionPayloadSchema = zod_1.z.object({
    sessionId: zod_1.z.string().min(1, "Session ID is required"),
    skipCurrent: zod_1.z.boolean().optional()
});
exports.RetryPracticeQuestionPayloadSchema = zod_1.z.object({
    sessionId: zod_1.z.string().min(1, "Session ID is required"),
    questionUid: zod_1.z.string().min(1, "Question UID is required")
});
exports.EndPracticeSessionPayloadSchema = zod_1.z.object({
    sessionId: zod_1.z.string().min(1, "Session ID is required"),
    reason: zod_1.z.enum(['completed', 'user_quit', 'timeout'])
});
exports.GetPracticeSessionStatePayloadSchema = zod_1.z.object({
    sessionId: zod_1.z.string().min(1, "Session ID is required")
});
// Practice API Request Schemas
exports.CreatePracticeSessionApiRequestSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, "User ID is required"),
    settings: exports.PracticeSettingsSchema
});
exports.GetPracticeSessionsApiRequestSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, "User ID is required"),
    status: zod_1.z.enum(['active', 'completed', 'abandoned']).optional(),
    limit: zod_1.z.number().int().min(1).max(100).optional(),
    offset: zod_1.z.number().int().min(0).optional()
});
exports.UpdatePracticeSessionApiRequestSchema = zod_1.z.object({
    sessionId: zod_1.z.string().min(1, "Session ID is required"),
    settings: exports.PracticeSettingsSchema.partial()
});
exports.GetPracticeQuestionsApiRequestSchema = zod_1.z.object({
    gradeLevel: zod_1.z.string().min(1, "Grade level is required"),
    discipline: zod_1.z.string().min(1, "Discipline is required"),
    themes: zod_1.z.array(zod_1.z.string()).optional(),
    limit: zod_1.z.number().int().min(1).max(100).optional(),
    excludeQuestions: zod_1.z.array(zod_1.z.string()).optional()
});
// Practice API Response Schemas
exports.CreatePracticeSessionApiResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    session: exports.PracticeSessionSchema.optional(),
    error: zod_1.z.string().optional(),
    statusCode: zod_1.z.number().int()
});
exports.GetPracticeSessionApiResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    session: exports.PracticeSessionSchema.optional(),
    error: zod_1.z.string().optional(),
    statusCode: zod_1.z.number().int()
});
exports.GetPracticeSessionsApiResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    sessions: zod_1.z.array(exports.PracticeSessionSchema).optional(),
    pagination: zod_1.z.object({
        total: zod_1.z.number().int().min(0),
        page: zod_1.z.number().int().min(1),
        pageSize: zod_1.z.number().int().min(1),
        totalPages: zod_1.z.number().int().min(0)
    }).optional(),
    error: zod_1.z.string().optional(),
    statusCode: zod_1.z.number().int()
});
exports.GetPracticeQuestionsApiResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    questionUids: zod_1.z.array(zod_1.z.string()).optional(),
    totalAvailable: zod_1.z.number().int().min(0).optional(),
    error: zod_1.z.string().optional(),
    statusCode: zod_1.z.number().int()
});
