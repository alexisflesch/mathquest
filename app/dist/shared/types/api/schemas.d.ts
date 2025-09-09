/**
 * Zod validation schemas for API requests and responses
 *
 * These schemas provide runtime validation for API payloads
 * and can be used to infer TypeScript types.
 */
import { z } from 'zod';
export declare const LoginRequestSchema: z.ZodObject<{
    action: z.ZodOptional<z.ZodEnum<["login", "teacher_login"]>>;
    email: z.ZodString;
    password: z.ZodString;
    username: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    action?: "login" | "teacher_login" | undefined;
    username?: string | undefined;
}, {
    email: string;
    password: string;
    action?: "login" | "teacher_login" | undefined;
    username?: string | undefined;
}>;
export declare const RegisterRequestSchema: z.ZodObject<{
    action: z.ZodOptional<z.ZodEnum<["teacher_register", "teacher_signup"]>>;
    username: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["STUDENT", "TEACHER", "GUEST"]>>;
    gradeLevel: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    cookieId: z.ZodOptional<z.ZodString>;
    adminPassword: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    prenom: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    username: string;
    action?: "teacher_register" | "teacher_signup" | undefined;
    email?: string | undefined;
    password?: string | undefined;
    role?: "STUDENT" | "TEACHER" | "GUEST" | undefined;
    gradeLevel?: string | undefined;
    avatar?: string | undefined;
    cookieId?: string | undefined;
    adminPassword?: string | undefined;
    name?: string | undefined;
    prenom?: string | undefined;
}, {
    username: string;
    action?: "teacher_register" | "teacher_signup" | undefined;
    email?: string | undefined;
    password?: string | undefined;
    role?: "STUDENT" | "TEACHER" | "GUEST" | undefined;
    gradeLevel?: string | undefined;
    avatar?: string | undefined;
    cookieId?: string | undefined;
    adminPassword?: string | undefined;
    name?: string | undefined;
    prenom?: string | undefined;
}>;
export declare const UpgradeAccountRequestSchema: z.ZodObject<{
    cookieId: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    targetRole: z.ZodOptional<z.ZodEnum<["STUDENT", "TEACHER", "GUEST"]>>;
    adminPassword: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    cookieId: string;
    adminPassword?: string | undefined;
    targetRole?: "STUDENT" | "TEACHER" | "GUEST" | undefined;
}, {
    email: string;
    password: string;
    cookieId: string;
    adminPassword?: string | undefined;
    targetRole?: "STUDENT" | "TEACHER" | "GUEST" | undefined;
}>;
export declare const PasswordResetRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const PasswordResetConfirmRequestSchema: z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
    newPassword: string;
}, {
    token: string;
    newPassword: string;
}>;
export declare const ProfileUpdateRequestSchema: z.ZodObject<{
    username: z.ZodString;
    avatar: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    avatar: string;
}, {
    username: string;
    avatar: string;
}>;
export declare const TeacherUpgradeRequestSchema: z.ZodObject<{
    adminPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    adminPassword: string;
}, {
    adminPassword: string;
}>;
export declare const SendEmailVerificationRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const VerifyEmailRequestSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const ResendEmailVerificationRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const CreateGameRequestSchema: z.ZodObject<{
    name: z.ZodString;
    gameTemplateId: z.ZodOptional<z.ZodString>;
    playMode: z.ZodEnum<["quiz", "tournament", "practice", "class"]>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    differedAvailableFrom: z.ZodOptional<z.ZodString>;
    differedAvailableTo: z.ZodOptional<z.ZodString>;
    gradeLevel: z.ZodOptional<z.ZodString>;
    discipline: z.ZodOptional<z.ZodString>;
    themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    nbOfQuestions: z.ZodOptional<z.ZodNumber>;
    initiatorStudentId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["pending", "completed"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    playMode: "quiz" | "tournament" | "practice" | "class";
    status?: "pending" | "completed" | undefined;
    gradeLevel?: string | undefined;
    gameTemplateId?: string | undefined;
    settings?: Record<string, any> | undefined;
    differedAvailableFrom?: string | undefined;
    differedAvailableTo?: string | undefined;
    discipline?: string | undefined;
    themes?: string[] | undefined;
    nbOfQuestions?: number | undefined;
    initiatorStudentId?: string | undefined;
}, {
    name: string;
    playMode: "quiz" | "tournament" | "practice" | "class";
    status?: "pending" | "completed" | undefined;
    gradeLevel?: string | undefined;
    gameTemplateId?: string | undefined;
    settings?: Record<string, any> | undefined;
    differedAvailableFrom?: string | undefined;
    differedAvailableTo?: string | undefined;
    discipline?: string | undefined;
    themes?: string[] | undefined;
    nbOfQuestions?: number | undefined;
    initiatorStudentId?: string | undefined;
}>;
export declare const GameJoinRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    username: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    username?: string | undefined;
    avatar?: string | undefined;
}, {
    userId: string;
    username?: string | undefined;
    avatar?: string | undefined;
}>;
export declare const GameStatusUpdateRequestSchema: z.ZodObject<{
    status: z.ZodEnum<["pending", "active", "paused", "completed", "archived"]>;
    currentQuestionIndex: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "completed" | "active" | "paused" | "archived";
    currentQuestionIndex?: number | undefined;
}, {
    status: "pending" | "completed" | "active" | "paused" | "archived";
    currentQuestionIndex?: number | undefined;
}>;
export declare const CreateGameTemplateRequestSchema: z.ZodObject<{
    name: z.ZodString;
    gradeLevel: z.ZodOptional<z.ZodString>;
    themes: z.ZodArray<z.ZodString, "many">;
    discipline: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    defaultMode: z.ZodOptional<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>;
    questionUids: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    themes: string[];
    questionUids: string[];
    gradeLevel?: string | undefined;
    discipline?: string | undefined;
    description?: string | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | "class" | undefined;
}, {
    name: string;
    themes: string[];
    questionUids: string[];
    gradeLevel?: string | undefined;
    discipline?: string | undefined;
    description?: string | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | "class" | undefined;
}>;
export declare const UpdateGameTemplateRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    gradeLevel: z.ZodOptional<z.ZodString>;
    themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    discipline: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    defaultMode: z.ZodOptional<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>;
    questionUids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    gradeLevel?: string | undefined;
    name?: string | undefined;
    discipline?: string | undefined;
    themes?: string[] | undefined;
    description?: string | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | "class" | undefined;
    questionUids?: string[] | undefined;
}, {
    gradeLevel?: string | undefined;
    name?: string | undefined;
    discipline?: string | undefined;
    themes?: string[] | undefined;
    description?: string | undefined;
    defaultMode?: "quiz" | "tournament" | "practice" | "class" | undefined;
    questionUids?: string[] | undefined;
}>;
export declare const RenameGameTemplateRequestSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const RenameGameInstanceRequestSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const CreateQuestionRequestSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
    defaultMode: z.ZodString;
    discipline: z.ZodString;
    gradeLevel: z.ZodOptional<z.ZodString>;
    themes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    correctAnswer: z.ZodString;
    explanationCorrect: z.ZodOptional<z.ZodString>;
    explanationIncorrect: z.ZodOptional<z.ZodString>;
    difficultyLevel: z.ZodOptional<z.ZodNumber>;
    timeToSolve: z.ZodOptional<z.ZodNumber>;
    feedbackWaitTime: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    discipline: string;
    themes: string[];
    defaultMode: string;
    text: string;
    correctAnswer: string;
    tags: string[];
    gradeLevel?: string | undefined;
    title?: string | undefined;
    answerOptions?: string[] | undefined;
    explanationCorrect?: string | undefined;
    explanationIncorrect?: string | undefined;
    difficultyLevel?: number | undefined;
    timeToSolve?: number | undefined;
    feedbackWaitTime?: number | undefined;
}, {
    discipline: string;
    defaultMode: string;
    text: string;
    correctAnswer: string;
    gradeLevel?: string | undefined;
    themes?: string[] | undefined;
    title?: string | undefined;
    answerOptions?: string[] | undefined;
    explanationCorrect?: string | undefined;
    explanationIncorrect?: string | undefined;
    difficultyLevel?: number | undefined;
    timeToSolve?: number | undefined;
    feedbackWaitTime?: number | undefined;
    tags?: string[] | undefined;
}>;
export declare const UpdateQuestionRequestSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    text: z.ZodOptional<z.ZodString>;
    defaultMode: z.ZodOptional<z.ZodString>;
    discipline: z.ZodOptional<z.ZodString>;
    gradeLevel: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    themes: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    answerOptions: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    correctAnswer: z.ZodOptional<z.ZodString>;
    explanationCorrect: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    explanationIncorrect: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    difficultyLevel: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    timeToSolve: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    feedbackWaitTime: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    gradeLevel?: string | undefined;
    discipline?: string | undefined;
    themes?: string[] | undefined;
    defaultMode?: string | undefined;
    title?: string | undefined;
    text?: string | undefined;
    answerOptions?: string[] | undefined;
    correctAnswer?: string | undefined;
    explanationCorrect?: string | undefined;
    explanationIncorrect?: string | undefined;
    difficultyLevel?: number | undefined;
    timeToSolve?: number | undefined;
    feedbackWaitTime?: number | undefined;
    tags?: string[] | undefined;
}, {
    gradeLevel?: string | undefined;
    discipline?: string | undefined;
    themes?: string[] | undefined;
    defaultMode?: string | undefined;
    title?: string | undefined;
    text?: string | undefined;
    answerOptions?: string[] | undefined;
    correctAnswer?: string | undefined;
    explanationCorrect?: string | undefined;
    explanationIncorrect?: string | undefined;
    difficultyLevel?: number | undefined;
    timeToSolve?: number | undefined;
    feedbackWaitTime?: number | undefined;
    tags?: string[] | undefined;
}>;
export declare const UpdateUserRequestSchema: z.ZodObject<{
    username: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    gradeLevel: z.ZodOptional<z.ZodString>;
    avatarEmoji: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    username?: string | undefined;
    gradeLevel?: string | undefined;
    avatarEmoji?: string | undefined;
}, {
    email?: string | undefined;
    username?: string | undefined;
    gradeLevel?: string | undefined;
    avatarEmoji?: string | undefined;
}>;
export declare const CreateQuizTemplateRequestSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    questionUids: z.ZodArray<z.ZodString, "many">;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    questionUids: string[];
    settings?: Record<string, any> | undefined;
    description?: string | undefined;
}, {
    name: string;
    questionUids: string[];
    settings?: Record<string, any> | undefined;
    description?: string | undefined;
}>;
export declare const UpdateQuizTemplateRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    questionUids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    settings: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    settings?: Record<string, any> | undefined;
    description?: string | undefined;
    questionUids?: string[] | undefined;
}, {
    name?: string | undefined;
    settings?: Record<string, any> | undefined;
    description?: string | undefined;
    questionUids?: string[] | undefined;
}>;
export declare const SetQuestionRequestSchema: z.ZodObject<{
    questionIndex: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    questionIndex: number;
}, {
    questionIndex: number;
}>;
export declare const LoginResponseSchema: z.ZodObject<{
    message: z.ZodString;
    token: z.ZodString;
    user: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        username: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        avatar: z.ZodString;
        role: z.ZodEnum<["STUDENT", "TEACHER", "GUEST"]>;
    }, "strip", z.ZodTypeAny, {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    }, {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    }>>;
    enseignant: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        username: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        username: string;
        id: string;
    }, {
        username: string;
        id: string;
    }>>;
    enseignantId: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    cookie_id: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
    success: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    message: string;
    token: string;
    username?: string | undefined;
    role?: string | undefined;
    avatar?: string | undefined;
    user?: {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    } | undefined;
    enseignant?: {
        username: string;
        id: string;
    } | undefined;
    enseignantId?: string | undefined;
    cookie_id?: string | undefined;
    success?: boolean | undefined;
}, {
    message: string;
    token: string;
    username?: string | undefined;
    role?: string | undefined;
    avatar?: string | undefined;
    user?: {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    } | undefined;
    enseignant?: {
        username: string;
        id: string;
    } | undefined;
    enseignantId?: string | undefined;
    cookie_id?: string | undefined;
    success?: boolean | undefined;
}>;
export declare const RegisterResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    token: z.ZodOptional<z.ZodString>;
    user: z.ZodObject<{
        id: z.ZodString;
        username: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        avatar: z.ZodString;
        role: z.ZodEnum<["STUDENT", "TEACHER", "GUEST"]>;
    }, "strip", z.ZodTypeAny, {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    }, {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    }>;
    requiresEmailVerification: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    message: string;
    user: {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    };
    success: boolean;
    token?: string | undefined;
    requiresEmailVerification?: boolean | undefined;
}, {
    message: string;
    user: {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    };
    success: boolean;
    token?: string | undefined;
    requiresEmailVerification?: boolean | undefined;
}>;
export declare const UpgradeAccountResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    token: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        username: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        avatar: z.ZodString;
        role: z.ZodEnum<["STUDENT", "TEACHER", "GUEST"]>;
    }, "strip", z.ZodTypeAny, {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    }, {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    message: string;
    token: string;
    user: {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    };
    success: boolean;
}, {
    message: string;
    token: string;
    user: {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    };
    success: boolean;
}>;
export declare const AuthStatusResponseSchema: z.ZodObject<{
    authState: z.ZodEnum<["anonymous", "student", "teacher", "guest"]>;
    cookiesFound: z.ZodNumber;
    cookieNames: z.ZodArray<z.ZodString, "many">;
    hasAuthToken: z.ZodBoolean;
    hasTeacherToken: z.ZodBoolean;
    timestamp: z.ZodString;
    user: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        username: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        avatar: z.ZodString;
        role: z.ZodEnum<["STUDENT", "TEACHER", "GUEST"]>;
    }, "strip", z.ZodTypeAny, {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    }, {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    }>>;
    hasUserProfile: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    authState: "anonymous" | "student" | "teacher" | "guest";
    cookiesFound: number;
    cookieNames: string[];
    hasAuthToken: boolean;
    hasTeacherToken: boolean;
    timestamp: string;
    user?: {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    } | undefined;
    hasUserProfile?: boolean | undefined;
}, {
    authState: "anonymous" | "student" | "teacher" | "guest";
    cookiesFound: number;
    cookieNames: string[];
    hasAuthToken: boolean;
    hasTeacherToken: boolean;
    timestamp: string;
    user?: {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    } | undefined;
    hasUserProfile?: boolean | undefined;
}>;
export declare const ProfileUpdateResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        username: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        avatar: z.ZodString;
        role: z.ZodEnum<["STUDENT", "TEACHER", "GUEST"]>;
    }, "strip", z.ZodTypeAny, {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    }, {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    message: string;
    user: {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    };
    success: boolean;
}, {
    message: string;
    user: {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    };
    success: boolean;
}>;
export declare const TeacherUpgradeResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    token: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        username: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        avatar: z.ZodString;
        role: z.ZodEnum<["STUDENT", "TEACHER", "GUEST"]>;
    }, "strip", z.ZodTypeAny, {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    }, {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    message: string;
    token: string;
    user: {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    };
    success: boolean;
}, {
    message: string;
    token: string;
    user: {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    };
    success: boolean;
}>;
export declare const LogoutResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
}, {
    message: string;
    success: boolean;
}>;
export declare const ErrorResponseSchema: z.ZodObject<{
    error: z.ZodString;
    success: z.ZodOptional<z.ZodLiteral<false>>;
    details: z.ZodOptional<z.ZodAny>;
    required: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    error: string;
    success?: false | undefined;
    details?: any;
    required?: string[] | undefined;
}, {
    error: string;
    success?: false | undefined;
    details?: any;
    required?: string[] | undefined;
}>;
export declare const UniversalLoginResponseSchema: z.ZodUnion<[z.ZodObject<{
    message: z.ZodString;
    enseignantId: z.ZodString;
    username: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    token: string;
    enseignantId: string;
    username?: string | undefined;
    avatar?: string | undefined;
}, {
    message: string;
    token: string;
    enseignantId: string;
    username?: string | undefined;
    avatar?: string | undefined;
}>, z.ZodObject<{
    success: z.ZodBoolean;
    user: z.ZodObject<{
        id: z.ZodString;
        username: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        avatar: z.ZodString;
        role: z.ZodEnum<["STUDENT", "TEACHER", "GUEST"]>;
    }, "strip", z.ZodTypeAny, {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    }, {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    }>;
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
    user: {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    };
    success: boolean;
}, {
    token: string;
    user: {
        username: string;
        role: "STUDENT" | "TEACHER" | "GUEST";
        avatar: string;
        id: string;
        email?: string | undefined;
    };
    success: boolean;
}>]>;
export declare const GameCreationResponseSchema: z.ZodObject<{
    gameInstance: z.ZodType<any, z.ZodTypeDef, any>;
}, "strip", z.ZodTypeAny, {
    gameInstance?: any;
}, {
    gameInstance?: any;
}>;
export declare const GameJoinResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    gameInstance: z.ZodType<any, z.ZodTypeDef, any>;
    participant: z.ZodObject<{
        id: z.ZodString;
        username: z.ZodString;
        avatar: z.ZodString;
        score: z.ZodNumber;
        isDeferred: z.ZodOptional<z.ZodBoolean>;
        socketId: z.ZodOptional<z.ZodString>;
        scoredQuestions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        username: string;
        avatar: string;
        id: string;
        score: number;
        isDeferred?: boolean | undefined;
        socketId?: string | undefined;
        scoredQuestions?: Record<string, number> | undefined;
    }, {
        username: string;
        avatar: string;
        id: string;
        score: number;
        isDeferred?: boolean | undefined;
        socketId?: string | undefined;
        scoredQuestions?: Record<string, number> | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    participant: {
        username: string;
        avatar: string;
        id: string;
        score: number;
        isDeferred?: boolean | undefined;
        socketId?: string | undefined;
        scoredQuestions?: Record<string, number> | undefined;
    };
    gameInstance?: any;
}, {
    success: boolean;
    participant: {
        username: string;
        avatar: string;
        id: string;
        score: number;
        isDeferred?: boolean | undefined;
        socketId?: string | undefined;
        scoredQuestions?: Record<string, number> | undefined;
    };
    gameInstance?: any;
}>;
export declare const GameStatusUpdateResponseSchema: z.ZodObject<{
    gameInstance: z.ZodType<any, z.ZodTypeDef, any>;
}, "strip", z.ZodTypeAny, {
    gameInstance?: any;
}, {
    gameInstance?: any;
}>;
export declare const GameStateResponseSchema: z.ZodObject<{
    status: z.ZodString;
    currentQuestionIndex: z.ZodNumber;
    accessCode: z.ZodString;
    name: z.ZodString;
    gameState: z.ZodOptional<z.ZodAny>;
    isLive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    status: string;
    name: string;
    currentQuestionIndex: number;
    accessCode: string;
    isLive: boolean;
    gameState?: any;
}, {
    status: string;
    name: string;
    currentQuestionIndex: number;
    accessCode: string;
    isLive: boolean;
    gameState?: any;
}>;
export declare const LeaderboardResponseSchema: z.ZodObject<{
    leaderboard: z.ZodArray<z.ZodObject<{
        userId: z.ZodString;
        username: z.ZodString;
        avatar: z.ZodOptional<z.ZodString>;
        score: z.ZodNumber;
        rank: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        username: string;
        userId: string;
        score: number;
        avatar?: string | undefined;
        rank?: number | undefined;
    }, {
        username: string;
        userId: string;
        score: number;
        avatar?: string | undefined;
        rank?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    leaderboard: {
        username: string;
        userId: string;
        score: number;
        avatar?: string | undefined;
        rank?: number | undefined;
    }[];
}, {
    leaderboard: {
        username: string;
        userId: string;
        score: number;
        avatar?: string | undefined;
        rank?: number | undefined;
    }[];
}>;
export declare const TeacherActiveGamesResponseSchema: z.ZodObject<{
    games: z.ZodArray<z.ZodAny, "many">;
}, "strip", z.ZodTypeAny, {
    games: any[];
}, {
    games: any[];
}>;
export declare const GameInstancesByTemplateResponseSchema: z.ZodObject<{
    gameInstances: z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">;
}, "strip", z.ZodTypeAny, {
    gameInstances: any[];
}, {
    gameInstances: any[];
}>;
export declare const QuestionCreationResponseSchema: z.ZodObject<{
    question: z.ZodEffects<z.ZodObject<{
        uid: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        text: z.ZodString;
        questionType: z.ZodString;
        discipline: z.ZodString;
        themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        difficulty: z.ZodOptional<z.ZodNumber>;
        gradeLevel: z.ZodOptional<z.ZodString>;
        author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        durationMs: z.ZodNumber;
    } & {
        multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
            answerOptions: z.ZodArray<z.ZodString, "many">;
            correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
        }, "strip", z.ZodTypeAny, {
            answerOptions: string[];
            correctAnswers: boolean[];
        }, {
            answerOptions: string[];
            correctAnswers: boolean[];
        }>>;
        numericQuestion: z.ZodOptional<z.ZodObject<{
            correctAnswer: z.ZodNumber;
            tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        }, {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        }>>;
        answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
    }, "strip", z.ZodTypeAny, {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }, {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }>, {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }, {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    question: {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    };
}, {
    question: {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    };
}>;
export declare const QuestionResponseSchema: z.ZodObject<{
    question: z.ZodEffects<z.ZodObject<{
        uid: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        text: z.ZodString;
        questionType: z.ZodString;
        discipline: z.ZodString;
        themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        difficulty: z.ZodOptional<z.ZodNumber>;
        gradeLevel: z.ZodOptional<z.ZodString>;
        author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        durationMs: z.ZodNumber;
    } & {
        multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
            answerOptions: z.ZodArray<z.ZodString, "many">;
            correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
        }, "strip", z.ZodTypeAny, {
            answerOptions: string[];
            correctAnswers: boolean[];
        }, {
            answerOptions: string[];
            correctAnswers: boolean[];
        }>>;
        numericQuestion: z.ZodOptional<z.ZodObject<{
            correctAnswer: z.ZodNumber;
            tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        }, {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        }>>;
        answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
    }, "strip", z.ZodTypeAny, {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }, {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }>, {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }, {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    question: {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    };
}, {
    question: {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    };
}>;
export declare const QuestionsResponseSchema: z.ZodObject<{
    questions: z.ZodArray<z.ZodEffects<z.ZodObject<{
        uid: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        text: z.ZodString;
        questionType: z.ZodString;
        discipline: z.ZodString;
        themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        difficulty: z.ZodOptional<z.ZodNumber>;
        gradeLevel: z.ZodOptional<z.ZodString>;
        author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        durationMs: z.ZodNumber;
    } & {
        multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
            answerOptions: z.ZodArray<z.ZodString, "many">;
            correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
        }, "strip", z.ZodTypeAny, {
            answerOptions: string[];
            correctAnswers: boolean[];
        }, {
            answerOptions: string[];
            correctAnswers: boolean[];
        }>>;
        numericQuestion: z.ZodOptional<z.ZodObject<{
            correctAnswer: z.ZodNumber;
            tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        }, {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        }>>;
        answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
    }, "strip", z.ZodTypeAny, {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }, {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }>, {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }, {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    totalPages: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    questions: {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}, {
    questions: {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
export declare const QuestionsListResponseSchema: z.ZodArray<z.ZodString, "many">;
export declare const QuestionUidsResponseSchema: z.ZodObject<{
    questionUids: z.ZodArray<z.ZodString, "many">;
    total: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    questionUids: string[];
    total: number;
}, {
    questionUids: string[];
    total: number;
}>;
export declare const FilterOptionSchema: z.ZodObject<{
    value: z.ZodString;
    label: z.ZodOptional<z.ZodString>;
    isCompatible: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    value: string;
    isCompatible: boolean;
    label?: string | undefined;
}, {
    value: string;
    isCompatible: boolean;
    label?: string | undefined;
}>;
export declare const QuestionsFiltersResponseSchema: z.ZodObject<{
    gradeLevel: z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        isCompatible: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        value: string;
        isCompatible: boolean;
        label?: string | undefined;
    }, {
        value: string;
        isCompatible: boolean;
        label?: string | undefined;
    }>, "many">;
    disciplines: z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        isCompatible: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        value: string;
        isCompatible: boolean;
        label?: string | undefined;
    }, {
        value: string;
        isCompatible: boolean;
        label?: string | undefined;
    }>, "many">;
    themes: z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        isCompatible: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        value: string;
        isCompatible: boolean;
        label?: string | undefined;
    }, {
        value: string;
        isCompatible: boolean;
        label?: string | undefined;
    }>, "many">;
    tags: z.ZodOptional<z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        isCompatible: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        value: string;
        isCompatible: boolean;
        label?: string | undefined;
    }, {
        value: string;
        isCompatible: boolean;
        label?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    gradeLevel: {
        value: string;
        isCompatible: boolean;
        label?: string | undefined;
    }[];
    themes: {
        value: string;
        isCompatible: boolean;
        label?: string | undefined;
    }[];
    disciplines: {
        value: string;
        isCompatible: boolean;
        label?: string | undefined;
    }[];
    tags?: {
        value: string;
        isCompatible: boolean;
        label?: string | undefined;
    }[] | undefined;
}, {
    gradeLevel: {
        value: string;
        isCompatible: boolean;
        label?: string | undefined;
    }[];
    themes: {
        value: string;
        isCompatible: boolean;
        label?: string | undefined;
    }[];
    disciplines: {
        value: string;
        isCompatible: boolean;
        label?: string | undefined;
    }[];
    tags?: {
        value: string;
        isCompatible: boolean;
        label?: string | undefined;
    }[] | undefined;
}>;
export declare const QuestionsCountResponseSchema: z.ZodObject<{
    count: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    count: number;
}, {
    count: number;
}>;
export declare const GameTemplateResponseSchema: z.ZodObject<{
    gameTemplate: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        gradeLevel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        themes: z.ZodArray<z.ZodString, "many">;
        discipline: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        defaultMode: z.ZodOptional<z.ZodNullable<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        creatorId: z.ZodString;
        creator: z.ZodOptional<z.ZodAny>;
        questions: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            uid: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            text: z.ZodString;
            questionType: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            difficulty: z.ZodOptional<z.ZodNumber>;
            gradeLevel: z.ZodOptional<z.ZodString>;
            author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            durationMs: z.ZodNumber;
        } & {
            multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
                answerOptions: z.ZodArray<z.ZodString, "many">;
                correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
            }, "strip", z.ZodTypeAny, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }>>;
            numericQuestion: z.ZodOptional<z.ZodObject<{
                correctAnswer: z.ZodNumber;
                tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }>>;
            answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        }, "strip", z.ZodTypeAny, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, "many">>;
        gameInstances: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    gameTemplate: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    };
}, {
    gameTemplate: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    };
}>;
export declare const GameTemplatesResponseSchema: z.ZodObject<{
    gameTemplates: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        gradeLevel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        themes: z.ZodArray<z.ZodString, "many">;
        discipline: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        defaultMode: z.ZodOptional<z.ZodNullable<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        creatorId: z.ZodString;
        creator: z.ZodOptional<z.ZodAny>;
        questions: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            uid: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            text: z.ZodString;
            questionType: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            difficulty: z.ZodOptional<z.ZodNumber>;
            gradeLevel: z.ZodOptional<z.ZodString>;
            author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            durationMs: z.ZodNumber;
        } & {
            multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
                answerOptions: z.ZodArray<z.ZodString, "many">;
                correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
            }, "strip", z.ZodTypeAny, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }>>;
            numericQuestion: z.ZodOptional<z.ZodObject<{
                correctAnswer: z.ZodNumber;
                tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }>>;
            answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        }, "strip", z.ZodTypeAny, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, "many">>;
        gameInstances: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
        page: z.ZodNumber;
        pageSize: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }, {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
}, "strip", z.ZodTypeAny, {
    gameTemplates: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}, {
    gameTemplates: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}>;
export declare const GameTemplateCreationResponseSchema: z.ZodObject<{
    gameTemplate: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        gradeLevel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        themes: z.ZodArray<z.ZodString, "many">;
        discipline: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        defaultMode: z.ZodOptional<z.ZodNullable<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        creatorId: z.ZodString;
        creator: z.ZodOptional<z.ZodAny>;
        questions: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            uid: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            text: z.ZodString;
            questionType: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            difficulty: z.ZodOptional<z.ZodNumber>;
            gradeLevel: z.ZodOptional<z.ZodString>;
            author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            durationMs: z.ZodNumber;
        } & {
            multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
                answerOptions: z.ZodArray<z.ZodString, "many">;
                correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
            }, "strip", z.ZodTypeAny, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }>>;
            numericQuestion: z.ZodOptional<z.ZodObject<{
                correctAnswer: z.ZodNumber;
                tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }>>;
            answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        }, "strip", z.ZodTypeAny, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, "many">>;
        gameInstances: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    gameTemplate: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    };
}, {
    gameTemplate: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    };
}>;
export declare const GameTemplateUpdateResponseSchema: z.ZodObject<{
    message: z.ZodString;
    gameTemplate: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        gradeLevel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        themes: z.ZodArray<z.ZodString, "many">;
        discipline: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        defaultMode: z.ZodOptional<z.ZodNullable<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        creatorId: z.ZodString;
        creator: z.ZodOptional<z.ZodAny>;
        questions: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            uid: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            text: z.ZodString;
            questionType: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            difficulty: z.ZodOptional<z.ZodNumber>;
            gradeLevel: z.ZodOptional<z.ZodString>;
            author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            durationMs: z.ZodNumber;
        } & {
            multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
                answerOptions: z.ZodArray<z.ZodString, "many">;
                correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
            }, "strip", z.ZodTypeAny, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }>>;
            numericQuestion: z.ZodOptional<z.ZodObject<{
                correctAnswer: z.ZodNumber;
                tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }>>;
            answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        }, "strip", z.ZodTypeAny, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, "many">>;
        gameInstances: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    message: string;
    gameTemplate: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    };
}, {
    message: string;
    gameTemplate: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    };
}>;
export declare const QuizTemplateResponseSchema: z.ZodObject<{
    gameTemplate: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        gradeLevel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        themes: z.ZodArray<z.ZodString, "many">;
        discipline: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        defaultMode: z.ZodOptional<z.ZodNullable<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        creatorId: z.ZodString;
        creator: z.ZodOptional<z.ZodAny>;
        questions: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            uid: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            text: z.ZodString;
            questionType: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            difficulty: z.ZodOptional<z.ZodNumber>;
            gradeLevel: z.ZodOptional<z.ZodString>;
            author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            durationMs: z.ZodNumber;
        } & {
            multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
                answerOptions: z.ZodArray<z.ZodString, "many">;
                correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
            }, "strip", z.ZodTypeAny, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }>>;
            numericQuestion: z.ZodOptional<z.ZodObject<{
                correctAnswer: z.ZodNumber;
                tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }>>;
            answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        }, "strip", z.ZodTypeAny, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, "many">>;
        gameInstances: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    gameTemplate: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    };
}, {
    gameTemplate: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    };
}>;
export declare const QuizTemplatesResponseSchema: z.ZodObject<{
    gameTemplates: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        gradeLevel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        themes: z.ZodArray<z.ZodString, "many">;
        discipline: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        defaultMode: z.ZodOptional<z.ZodNullable<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        creatorId: z.ZodString;
        creator: z.ZodOptional<z.ZodAny>;
        questions: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            uid: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            text: z.ZodString;
            questionType: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            difficulty: z.ZodOptional<z.ZodNumber>;
            gradeLevel: z.ZodOptional<z.ZodString>;
            author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            durationMs: z.ZodNumber;
        } & {
            multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
                answerOptions: z.ZodArray<z.ZodString, "many">;
                correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
            }, "strip", z.ZodTypeAny, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }>>;
            numericQuestion: z.ZodOptional<z.ZodObject<{
                correctAnswer: z.ZodNumber;
                tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }>>;
            answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        }, "strip", z.ZodTypeAny, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, "many">>;
        gameInstances: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    totalPages: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    gameTemplates: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }[];
}, {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    gameTemplates: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }[];
}>;
export declare const QuizCreationResponseSchema: z.ZodObject<{
    gameTemplate: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        gradeLevel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        themes: z.ZodArray<z.ZodString, "many">;
        discipline: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        defaultMode: z.ZodOptional<z.ZodNullable<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        creatorId: z.ZodString;
        creator: z.ZodOptional<z.ZodAny>;
        questions: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            uid: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            text: z.ZodString;
            questionType: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            difficulty: z.ZodOptional<z.ZodNumber>;
            gradeLevel: z.ZodOptional<z.ZodString>;
            author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            durationMs: z.ZodNumber;
        } & {
            multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
                answerOptions: z.ZodArray<z.ZodString, "many">;
                correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
            }, "strip", z.ZodTypeAny, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }>>;
            numericQuestion: z.ZodOptional<z.ZodObject<{
                correctAnswer: z.ZodNumber;
                tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }>>;
            answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        }, "strip", z.ZodTypeAny, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, "many">>;
        gameInstances: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    gameTemplate: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    };
}, {
    gameTemplate: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    };
}>;
export declare const QuizTemplateCreationResponseSchema: z.ZodObject<{
    gameTemplate: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        gradeLevel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        themes: z.ZodArray<z.ZodString, "many">;
        discipline: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        defaultMode: z.ZodOptional<z.ZodNullable<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        creatorId: z.ZodString;
        creator: z.ZodOptional<z.ZodAny>;
        questions: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            uid: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            text: z.ZodString;
            questionType: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            difficulty: z.ZodOptional<z.ZodNumber>;
            gradeLevel: z.ZodOptional<z.ZodString>;
            author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            durationMs: z.ZodNumber;
        } & {
            multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
                answerOptions: z.ZodArray<z.ZodString, "many">;
                correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
            }, "strip", z.ZodTypeAny, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }>>;
            numericQuestion: z.ZodOptional<z.ZodObject<{
                correctAnswer: z.ZodNumber;
                tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }>>;
            answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        }, "strip", z.ZodTypeAny, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, "many">>;
        gameInstances: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    gameTemplate: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    };
}, {
    gameTemplate: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    };
}>;
export declare const QuizTemplateUpdateResponseSchema: z.ZodObject<{
    gameTemplate: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        gradeLevel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        themes: z.ZodArray<z.ZodString, "many">;
        discipline: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        defaultMode: z.ZodOptional<z.ZodNullable<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        creatorId: z.ZodString;
        creator: z.ZodOptional<z.ZodAny>;
        questions: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            uid: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            text: z.ZodString;
            questionType: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            difficulty: z.ZodOptional<z.ZodNumber>;
            gradeLevel: z.ZodOptional<z.ZodString>;
            author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            durationMs: z.ZodNumber;
        } & {
            multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
                answerOptions: z.ZodArray<z.ZodString, "many">;
                correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
            }, "strip", z.ZodTypeAny, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }>>;
            numericQuestion: z.ZodOptional<z.ZodObject<{
                correctAnswer: z.ZodNumber;
                tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }>>;
            answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        }, "strip", z.ZodTypeAny, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, "many">>;
        gameInstances: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    gameTemplate: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    };
}, {
    gameTemplate: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    };
}>;
export declare const QuizTemplateDeleteResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    success: boolean;
}, {
    success: boolean;
}>;
export declare const QuizTemplateQuestionResponseSchema: z.ZodObject<{
    gameTemplate: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        gradeLevel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        themes: z.ZodArray<z.ZodString, "many">;
        discipline: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        defaultMode: z.ZodOptional<z.ZodNullable<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        creatorId: z.ZodString;
        creator: z.ZodOptional<z.ZodAny>;
        questions: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            uid: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            text: z.ZodString;
            questionType: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            difficulty: z.ZodOptional<z.ZodNumber>;
            gradeLevel: z.ZodOptional<z.ZodString>;
            author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            durationMs: z.ZodNumber;
        } & {
            multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
                answerOptions: z.ZodArray<z.ZodString, "many">;
                correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
            }, "strip", z.ZodTypeAny, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }>>;
            numericQuestion: z.ZodOptional<z.ZodObject<{
                correctAnswer: z.ZodNumber;
                tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }>>;
            answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        }, "strip", z.ZodTypeAny, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, "many">>;
        gameInstances: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    gameTemplate: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    };
}, {
    gameTemplate: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    };
}>;
export declare const QuizListResponseSchema: z.ZodObject<{
    gameTemplates: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        gradeLevel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        themes: z.ZodArray<z.ZodString, "many">;
        discipline: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        defaultMode: z.ZodOptional<z.ZodNullable<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        creatorId: z.ZodString;
        creator: z.ZodOptional<z.ZodAny>;
        questions: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            uid: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            text: z.ZodString;
            questionType: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            difficulty: z.ZodOptional<z.ZodNumber>;
            gradeLevel: z.ZodOptional<z.ZodString>;
            author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            durationMs: z.ZodNumber;
        } & {
            multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
                answerOptions: z.ZodArray<z.ZodString, "many">;
                correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
            }, "strip", z.ZodTypeAny, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }>>;
            numericQuestion: z.ZodOptional<z.ZodObject<{
                correctAnswer: z.ZodNumber;
                tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }>>;
            answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        }, "strip", z.ZodTypeAny, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, "many">>;
        gameInstances: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    totalPages: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    gameTemplates: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }[];
}, {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    gameTemplates: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }[];
}>;
export declare const TeacherQuizQuestionsResponseSchema: z.ZodObject<{
    questions: z.ZodArray<z.ZodEffects<z.ZodObject<{
        uid: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        text: z.ZodString;
        questionType: z.ZodString;
        discipline: z.ZodString;
        themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        difficulty: z.ZodOptional<z.ZodNumber>;
        gradeLevel: z.ZodOptional<z.ZodString>;
        author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        durationMs: z.ZodNumber;
    } & {
        multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
            answerOptions: z.ZodArray<z.ZodString, "many">;
            correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
        }, "strip", z.ZodTypeAny, {
            answerOptions: string[];
            correctAnswers: boolean[];
        }, {
            answerOptions: string[];
            correctAnswers: boolean[];
        }>>;
        numericQuestion: z.ZodOptional<z.ZodObject<{
            correctAnswer: z.ZodNumber;
            tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        }, {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        }>>;
        answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
    }, "strip", z.ZodTypeAny, {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }, {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }>, {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }, {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }>, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
        page: z.ZodNumber;
        pageSize: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }, {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
}, "strip", z.ZodTypeAny, {
    questions: {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}, {
    questions: {
        discipline: string;
        text: string;
        questionType: string;
        durationMs: number;
        gradeLevel?: string | undefined;
        themes?: string[] | undefined;
        title?: string | null | undefined;
        answerOptions?: string[] | undefined;
        tags?: string[] | undefined;
        uid?: string | undefined;
        difficulty?: number | undefined;
        author?: string | null | undefined;
        explanation?: string | null | undefined;
        excludedFrom?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | null | undefined;
            unit?: string | null | undefined;
        } | undefined;
    }[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}>;
export declare const TournamentCodeResponseSchema: z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
}, {
    code: string;
}>;
export declare const TournamentVerificationResponseSchema: z.ZodObject<{
    verified: z.ZodBoolean;
    gameTemplate: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        gradeLevel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        themes: z.ZodArray<z.ZodString, "many">;
        discipline: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        defaultMode: z.ZodOptional<z.ZodNullable<z.ZodEnum<["quiz", "tournament", "practice", "class"]>>>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        creatorId: z.ZodString;
        creator: z.ZodOptional<z.ZodAny>;
        questions: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            uid: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            text: z.ZodString;
            questionType: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            difficulty: z.ZodOptional<z.ZodNumber>;
            gradeLevel: z.ZodOptional<z.ZodString>;
            author: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            explanation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            excludedFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            durationMs: z.ZodNumber;
        } & {
            multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
                answerOptions: z.ZodArray<z.ZodString, "many">;
                correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
            }, "strip", z.ZodTypeAny, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }>>;
            numericQuestion: z.ZodOptional<z.ZodObject<{
                correctAnswer: z.ZodNumber;
                tolerance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }, {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            }>>;
            answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        }, "strip", z.ZodTypeAny, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }, {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }>, "many">>;
        gameInstances: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }, {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    }>>;
}, "strip", z.ZodTypeAny, {
    verified: boolean;
    gameTemplate?: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    } | undefined;
}, {
    verified: boolean;
    gameTemplate?: {
        name: string;
        themes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        gradeLevel?: string | null | undefined;
        discipline?: string | null | undefined;
        description?: string | null | undefined;
        defaultMode?: "quiz" | "tournament" | "practice" | "class" | null | undefined;
        gameInstances?: any[] | undefined;
        questions?: {
            discipline: string;
            text: string;
            questionType: string;
            durationMs: number;
            gradeLevel?: string | undefined;
            themes?: string[] | undefined;
            title?: string | null | undefined;
            answerOptions?: string[] | undefined;
            tags?: string[] | undefined;
            uid?: string | undefined;
            difficulty?: number | undefined;
            author?: string | null | undefined;
            explanation?: string | null | undefined;
            excludedFrom?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | null | undefined;
                unit?: string | null | undefined;
            } | undefined;
        }[] | undefined;
        creator?: any;
    } | undefined;
}>;
export declare const TournamentListItemSchema: z.ZodObject<{
    id: z.ZodString;
    code: z.ZodString;
    name: z.ZodString;
    statut: z.ZodString;
    playMode: z.ZodEnum<["quiz", "tournament", "practice", "class"]>;
    createdAt: z.ZodString;
    date_debut: z.ZodNullable<z.ZodString>;
    date_fin: z.ZodNullable<z.ZodString>;
    creatorUsername: z.ZodString;
    leaderboard: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    position: z.ZodOptional<z.ZodNumber>;
    score: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    playMode: "quiz" | "tournament" | "practice" | "class";
    id: string;
    createdAt: string;
    statut: string;
    date_debut: string | null;
    date_fin: string | null;
    creatorUsername: string;
    score?: number | undefined;
    leaderboard?: any[] | undefined;
    position?: number | undefined;
}, {
    code: string;
    name: string;
    playMode: "quiz" | "tournament" | "practice" | "class";
    id: string;
    createdAt: string;
    statut: string;
    date_debut: string | null;
    date_fin: string | null;
    creatorUsername: string;
    score?: number | undefined;
    leaderboard?: any[] | undefined;
    position?: number | undefined;
}>;
export declare const MyTournamentsResponseSchema: z.ZodObject<{
    pending: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        code: z.ZodString;
        name: z.ZodString;
        statut: z.ZodString;
        playMode: z.ZodEnum<["quiz", "tournament", "practice", "class"]>;
        createdAt: z.ZodString;
        date_debut: z.ZodNullable<z.ZodString>;
        date_fin: z.ZodNullable<z.ZodString>;
        creatorUsername: z.ZodString;
        leaderboard: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        position: z.ZodOptional<z.ZodNumber>;
        score: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        name: string;
        playMode: "quiz" | "tournament" | "practice" | "class";
        id: string;
        createdAt: string;
        statut: string;
        date_debut: string | null;
        date_fin: string | null;
        creatorUsername: string;
        score?: number | undefined;
        leaderboard?: any[] | undefined;
        position?: number | undefined;
    }, {
        code: string;
        name: string;
        playMode: "quiz" | "tournament" | "practice" | "class";
        id: string;
        createdAt: string;
        statut: string;
        date_debut: string | null;
        date_fin: string | null;
        creatorUsername: string;
        score?: number | undefined;
        leaderboard?: any[] | undefined;
        position?: number | undefined;
    }>, "many">;
    active: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        code: z.ZodString;
        name: z.ZodString;
        statut: z.ZodString;
        playMode: z.ZodEnum<["quiz", "tournament", "practice", "class"]>;
        createdAt: z.ZodString;
        date_debut: z.ZodNullable<z.ZodString>;
        date_fin: z.ZodNullable<z.ZodString>;
        creatorUsername: z.ZodString;
        leaderboard: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        position: z.ZodOptional<z.ZodNumber>;
        score: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        name: string;
        playMode: "quiz" | "tournament" | "practice" | "class";
        id: string;
        createdAt: string;
        statut: string;
        date_debut: string | null;
        date_fin: string | null;
        creatorUsername: string;
        score?: number | undefined;
        leaderboard?: any[] | undefined;
        position?: number | undefined;
    }, {
        code: string;
        name: string;
        playMode: "quiz" | "tournament" | "practice" | "class";
        id: string;
        createdAt: string;
        statut: string;
        date_debut: string | null;
        date_fin: string | null;
        creatorUsername: string;
        score?: number | undefined;
        leaderboard?: any[] | undefined;
        position?: number | undefined;
    }>, "many">;
    ended: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        code: z.ZodString;
        name: z.ZodString;
        statut: z.ZodString;
        playMode: z.ZodEnum<["quiz", "tournament", "practice", "class"]>;
        createdAt: z.ZodString;
        date_debut: z.ZodNullable<z.ZodString>;
        date_fin: z.ZodNullable<z.ZodString>;
        creatorUsername: z.ZodString;
        leaderboard: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        position: z.ZodOptional<z.ZodNumber>;
        score: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        name: string;
        playMode: "quiz" | "tournament" | "practice" | "class";
        id: string;
        createdAt: string;
        statut: string;
        date_debut: string | null;
        date_fin: string | null;
        creatorUsername: string;
        score?: number | undefined;
        leaderboard?: any[] | undefined;
        position?: number | undefined;
    }, {
        code: string;
        name: string;
        playMode: "quiz" | "tournament" | "practice" | "class";
        id: string;
        createdAt: string;
        statut: string;
        date_debut: string | null;
        date_fin: string | null;
        creatorUsername: string;
        score?: number | undefined;
        leaderboard?: any[] | undefined;
        position?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    pending: {
        code: string;
        name: string;
        playMode: "quiz" | "tournament" | "practice" | "class";
        id: string;
        createdAt: string;
        statut: string;
        date_debut: string | null;
        date_fin: string | null;
        creatorUsername: string;
        score?: number | undefined;
        leaderboard?: any[] | undefined;
        position?: number | undefined;
    }[];
    active: {
        code: string;
        name: string;
        playMode: "quiz" | "tournament" | "practice" | "class";
        id: string;
        createdAt: string;
        statut: string;
        date_debut: string | null;
        date_fin: string | null;
        creatorUsername: string;
        score?: number | undefined;
        leaderboard?: any[] | undefined;
        position?: number | undefined;
    }[];
    ended: {
        code: string;
        name: string;
        playMode: "quiz" | "tournament" | "practice" | "class";
        id: string;
        createdAt: string;
        statut: string;
        date_debut: string | null;
        date_fin: string | null;
        creatorUsername: string;
        score?: number | undefined;
        leaderboard?: any[] | undefined;
        position?: number | undefined;
    }[];
}, {
    pending: {
        code: string;
        name: string;
        playMode: "quiz" | "tournament" | "practice" | "class";
        id: string;
        createdAt: string;
        statut: string;
        date_debut: string | null;
        date_fin: string | null;
        creatorUsername: string;
        score?: number | undefined;
        leaderboard?: any[] | undefined;
        position?: number | undefined;
    }[];
    active: {
        code: string;
        name: string;
        playMode: "quiz" | "tournament" | "practice" | "class";
        id: string;
        createdAt: string;
        statut: string;
        date_debut: string | null;
        date_fin: string | null;
        creatorUsername: string;
        score?: number | undefined;
        leaderboard?: any[] | undefined;
        position?: number | undefined;
    }[];
    ended: {
        code: string;
        name: string;
        playMode: "quiz" | "tournament" | "practice" | "class";
        id: string;
        createdAt: string;
        statut: string;
        date_debut: string | null;
        date_fin: string | null;
        creatorUsername: string;
        score?: number | undefined;
        leaderboard?: any[] | undefined;
        position?: number | undefined;
    }[];
}>;
export type TournamentListItem = z.infer<typeof TournamentListItemSchema>;
export type MyTournamentsResponse = z.infer<typeof MyTournamentsResponseSchema>;
export declare const SuccessResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    message?: string | undefined;
}, {
    success: boolean;
    message?: string | undefined;
}>;
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
export type UpgradeRequest = UpgradeAccountRequest;
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
export declare const PracticeSettingsSchema: z.ZodObject<{
    gradeLevel: z.ZodString;
    discipline: z.ZodString;
    themes: z.ZodArray<z.ZodString, "many">;
    questionCount: z.ZodNumber;
    showImmediateFeedback: z.ZodBoolean;
    allowRetry: z.ZodBoolean;
    randomizeQuestions: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    gradeLevel: string;
    discipline: string;
    themes: string[];
    questionCount: number;
    showImmediateFeedback: boolean;
    allowRetry: boolean;
    randomizeQuestions: boolean;
}, {
    gradeLevel: string;
    discipline: string;
    themes: string[];
    questionCount: number;
    showImmediateFeedback: boolean;
    allowRetry: boolean;
    randomizeQuestions: boolean;
}>;
export declare const PracticeAnswerSchema: z.ZodObject<{
    questionUid: z.ZodString;
    selectedAnswers: z.ZodArray<z.ZodNumber, "many">;
    isCorrect: z.ZodBoolean;
    submittedAt: z.ZodDate;
    timeSpentMs: z.ZodNumber;
    attemptNumber: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    questionUid: string;
    selectedAnswers: number[];
    isCorrect: boolean;
    submittedAt: Date;
    timeSpentMs: number;
    attemptNumber: number;
}, {
    questionUid: string;
    selectedAnswers: number[];
    isCorrect: boolean;
    submittedAt: Date;
    timeSpentMs: number;
    attemptNumber: number;
}>;
export declare const PracticeQuestionDataSchema: z.ZodEffects<z.ZodObject<{
    uid: z.ZodString;
    title: z.ZodString;
    text: z.ZodString;
    questionType: z.ZodString;
    timeLimit: z.ZodNumber;
    gradeLevel: z.ZodString;
    discipline: z.ZodString;
    themes: z.ZodArray<z.ZodString, "many">;
    multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
        answerOptions: z.ZodArray<z.ZodString, "many">;
        correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
    }, "strip", z.ZodTypeAny, {
        answerOptions: string[];
        correctAnswers: boolean[];
    }, {
        answerOptions: string[];
        correctAnswers: boolean[];
    }>>;
    numericQuestion: z.ZodOptional<z.ZodObject<{
        correctAnswer: z.ZodNumber;
        tolerance: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        correctAnswer: number;
        tolerance?: number | undefined;
        unit?: string | undefined;
    }, {
        correctAnswer: number;
        tolerance?: number | undefined;
        unit?: string | undefined;
    }>>;
    answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
}, "strip", z.ZodTypeAny, {
    gradeLevel: string;
    discipline: string;
    themes: string[];
    title: string;
    text: string;
    uid: string;
    questionType: string;
    timeLimit: number;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        tolerance?: number | undefined;
        unit?: string | undefined;
    } | undefined;
}, {
    gradeLevel: string;
    discipline: string;
    themes: string[];
    title: string;
    text: string;
    uid: string;
    questionType: string;
    timeLimit: number;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        tolerance?: number | undefined;
        unit?: string | undefined;
    } | undefined;
}>, {
    gradeLevel: string;
    discipline: string;
    themes: string[];
    title: string;
    text: string;
    uid: string;
    questionType: string;
    timeLimit: number;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        tolerance?: number | undefined;
        unit?: string | undefined;
    } | undefined;
}, {
    gradeLevel: string;
    discipline: string;
    themes: string[];
    title: string;
    text: string;
    uid: string;
    questionType: string;
    timeLimit: number;
    answerOptions?: string[] | undefined;
    correctAnswers?: boolean[] | undefined;
    multipleChoiceQuestion?: {
        answerOptions: string[];
        correctAnswers: boolean[];
    } | undefined;
    numericQuestion?: {
        correctAnswer: number;
        tolerance?: number | undefined;
        unit?: string | undefined;
    } | undefined;
}>;
export declare const PracticeStatisticsSchema: z.ZodObject<{
    questionsAttempted: z.ZodNumber;
    correctAnswers: z.ZodNumber;
    incorrectAnswers: z.ZodNumber;
    accuracyPercentage: z.ZodNumber;
    averageTimePerQuestion: z.ZodNumber;
    totalTimeSpent: z.ZodNumber;
    retriedQuestions: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    correctAnswers: number;
    questionsAttempted: number;
    incorrectAnswers: number;
    accuracyPercentage: number;
    averageTimePerQuestion: number;
    totalTimeSpent: number;
    retriedQuestions: string[];
}, {
    correctAnswers: number;
    questionsAttempted: number;
    incorrectAnswers: number;
    accuracyPercentage: number;
    averageTimePerQuestion: number;
    totalTimeSpent: number;
    retriedQuestions: string[];
}>;
export declare const PracticeSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    userId: z.ZodString;
    settings: z.ZodObject<{
        gradeLevel: z.ZodString;
        discipline: z.ZodString;
        themes: z.ZodArray<z.ZodString, "many">;
        questionCount: z.ZodNumber;
        showImmediateFeedback: z.ZodBoolean;
        allowRetry: z.ZodBoolean;
        randomizeQuestions: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
    }, {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
    }>;
    status: z.ZodEnum<["active", "completed", "abandoned"]>;
    questionPool: z.ZodArray<z.ZodString, "many">;
    currentQuestionIndex: z.ZodNumber;
    currentQuestion: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        uid: z.ZodString;
        title: z.ZodString;
        text: z.ZodString;
        questionType: z.ZodString;
        timeLimit: z.ZodNumber;
        gradeLevel: z.ZodString;
        discipline: z.ZodString;
        themes: z.ZodArray<z.ZodString, "many">;
        multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
            answerOptions: z.ZodArray<z.ZodString, "many">;
            correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
        }, "strip", z.ZodTypeAny, {
            answerOptions: string[];
            correctAnswers: boolean[];
        }, {
            answerOptions: string[];
            correctAnswers: boolean[];
        }>>;
        numericQuestion: z.ZodOptional<z.ZodObject<{
            correctAnswer: z.ZodNumber;
            tolerance: z.ZodOptional<z.ZodNumber>;
            unit: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            correctAnswer: number;
            tolerance?: number | undefined;
            unit?: string | undefined;
        }, {
            correctAnswer: number;
            tolerance?: number | undefined;
            unit?: string | undefined;
        }>>;
        answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
    }, "strip", z.ZodTypeAny, {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        title: string;
        text: string;
        uid: string;
        questionType: string;
        timeLimit: number;
        answerOptions?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | undefined;
            unit?: string | undefined;
        } | undefined;
    }, {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        title: string;
        text: string;
        uid: string;
        questionType: string;
        timeLimit: number;
        answerOptions?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | undefined;
            unit?: string | undefined;
        } | undefined;
    }>, {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        title: string;
        text: string;
        uid: string;
        questionType: string;
        timeLimit: number;
        answerOptions?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | undefined;
            unit?: string | undefined;
        } | undefined;
    }, {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        title: string;
        text: string;
        uid: string;
        questionType: string;
        timeLimit: number;
        answerOptions?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | undefined;
            unit?: string | undefined;
        } | undefined;
    }>>;
    answers: z.ZodArray<z.ZodObject<{
        questionUid: z.ZodString;
        selectedAnswers: z.ZodArray<z.ZodNumber, "many">;
        isCorrect: z.ZodBoolean;
        submittedAt: z.ZodDate;
        timeSpentMs: z.ZodNumber;
        attemptNumber: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        questionUid: string;
        selectedAnswers: number[];
        isCorrect: boolean;
        submittedAt: Date;
        timeSpentMs: number;
        attemptNumber: number;
    }, {
        questionUid: string;
        selectedAnswers: number[];
        isCorrect: boolean;
        submittedAt: Date;
        timeSpentMs: number;
        attemptNumber: number;
    }>, "many">;
    statistics: z.ZodObject<{
        questionsAttempted: z.ZodNumber;
        correctAnswers: z.ZodNumber;
        incorrectAnswers: z.ZodNumber;
        accuracyPercentage: z.ZodNumber;
        averageTimePerQuestion: z.ZodNumber;
        totalTimeSpent: z.ZodNumber;
        retriedQuestions: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        correctAnswers: number;
        questionsAttempted: number;
        incorrectAnswers: number;
        accuracyPercentage: number;
        averageTimePerQuestion: number;
        totalTimeSpent: number;
        retriedQuestions: string[];
    }, {
        correctAnswers: number;
        questionsAttempted: number;
        incorrectAnswers: number;
        accuracyPercentage: number;
        averageTimePerQuestion: number;
        totalTimeSpent: number;
        retriedQuestions: string[];
    }>;
    createdAt: z.ZodDate;
    startedAt: z.ZodOptional<z.ZodDate>;
    completedAt: z.ZodOptional<z.ZodDate>;
    expiresAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status: "completed" | "active" | "abandoned";
    settings: {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
    };
    userId: string;
    currentQuestionIndex: number;
    createdAt: Date;
    sessionId: string;
    questionPool: string[];
    answers: {
        questionUid: string;
        selectedAnswers: number[];
        isCorrect: boolean;
        submittedAt: Date;
        timeSpentMs: number;
        attemptNumber: number;
    }[];
    statistics: {
        correctAnswers: number;
        questionsAttempted: number;
        incorrectAnswers: number;
        accuracyPercentage: number;
        averageTimePerQuestion: number;
        totalTimeSpent: number;
        retriedQuestions: string[];
    };
    expiresAt: Date;
    currentQuestion?: {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        title: string;
        text: string;
        uid: string;
        questionType: string;
        timeLimit: number;
        answerOptions?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | undefined;
            unit?: string | undefined;
        } | undefined;
    } | undefined;
    startedAt?: Date | undefined;
    completedAt?: Date | undefined;
}, {
    status: "completed" | "active" | "abandoned";
    settings: {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
    };
    userId: string;
    currentQuestionIndex: number;
    createdAt: Date;
    sessionId: string;
    questionPool: string[];
    answers: {
        questionUid: string;
        selectedAnswers: number[];
        isCorrect: boolean;
        submittedAt: Date;
        timeSpentMs: number;
        attemptNumber: number;
    }[];
    statistics: {
        correctAnswers: number;
        questionsAttempted: number;
        incorrectAnswers: number;
        accuracyPercentage: number;
        averageTimePerQuestion: number;
        totalTimeSpent: number;
        retriedQuestions: string[];
    };
    expiresAt: Date;
    currentQuestion?: {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        title: string;
        text: string;
        uid: string;
        questionType: string;
        timeLimit: number;
        answerOptions?: string[] | undefined;
        correctAnswers?: boolean[] | undefined;
        multipleChoiceQuestion?: {
            answerOptions: string[];
            correctAnswers: boolean[];
        } | undefined;
        numericQuestion?: {
            correctAnswer: number;
            tolerance?: number | undefined;
            unit?: string | undefined;
        } | undefined;
    } | undefined;
    startedAt?: Date | undefined;
    completedAt?: Date | undefined;
}>;
export declare const CreatePracticeSessionRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    settings: z.ZodObject<{
        gradeLevel: z.ZodString;
        discipline: z.ZodString;
        themes: z.ZodArray<z.ZodString, "many">;
        questionCount: z.ZodNumber;
        showImmediateFeedback: z.ZodBoolean;
        allowRetry: z.ZodBoolean;
        randomizeQuestions: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
    }, {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    settings: {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
    };
    userId: string;
}, {
    settings: {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
    };
    userId: string;
}>;
export declare const CreatePracticeSessionResponseSchema: z.ZodObject<{
    session: z.ZodObject<{
        sessionId: z.ZodString;
        userId: z.ZodString;
        settings: z.ZodObject<{
            gradeLevel: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodArray<z.ZodString, "many">;
            questionCount: z.ZodNumber;
            showImmediateFeedback: z.ZodBoolean;
            allowRetry: z.ZodBoolean;
            randomizeQuestions: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        }, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        }>;
        status: z.ZodEnum<["active", "completed", "abandoned"]>;
        questionPool: z.ZodArray<z.ZodString, "many">;
        currentQuestionIndex: z.ZodNumber;
        currentQuestion: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            uid: z.ZodString;
            title: z.ZodString;
            text: z.ZodString;
            questionType: z.ZodString;
            timeLimit: z.ZodNumber;
            gradeLevel: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodArray<z.ZodString, "many">;
            multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
                answerOptions: z.ZodArray<z.ZodString, "many">;
                correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
            }, "strip", z.ZodTypeAny, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }>>;
            numericQuestion: z.ZodOptional<z.ZodObject<{
                correctAnswer: z.ZodNumber;
                tolerance: z.ZodOptional<z.ZodNumber>;
                unit: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            }, {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            }>>;
            answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        }, "strip", z.ZodTypeAny, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        }, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        }>, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        }, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        }>>;
        answers: z.ZodArray<z.ZodObject<{
            questionUid: z.ZodString;
            selectedAnswers: z.ZodArray<z.ZodNumber, "many">;
            isCorrect: z.ZodBoolean;
            submittedAt: z.ZodDate;
            timeSpentMs: z.ZodNumber;
            attemptNumber: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }, {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }>, "many">;
        statistics: z.ZodObject<{
            questionsAttempted: z.ZodNumber;
            correctAnswers: z.ZodNumber;
            incorrectAnswers: z.ZodNumber;
            accuracyPercentage: z.ZodNumber;
            averageTimePerQuestion: z.ZodNumber;
            totalTimeSpent: z.ZodNumber;
            retriedQuestions: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        }, {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        }>;
        createdAt: z.ZodDate;
        startedAt: z.ZodOptional<z.ZodDate>;
        completedAt: z.ZodOptional<z.ZodDate>;
        expiresAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "active" | "abandoned";
        settings: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        };
        userId: string;
        currentQuestionIndex: number;
        createdAt: Date;
        sessionId: string;
        questionPool: string[];
        answers: {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }[];
        statistics: {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        };
        expiresAt: Date;
        currentQuestion?: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        } | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    }, {
        status: "completed" | "active" | "abandoned";
        settings: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        };
        userId: string;
        currentQuestionIndex: number;
        createdAt: Date;
        sessionId: string;
        questionPool: string[];
        answers: {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }[];
        statistics: {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        };
        expiresAt: Date;
        currentQuestion?: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        } | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    }>;
    success: z.ZodLiteral<true>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: true;
    session: {
        status: "completed" | "active" | "abandoned";
        settings: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        };
        userId: string;
        currentQuestionIndex: number;
        createdAt: Date;
        sessionId: string;
        questionPool: string[];
        answers: {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }[];
        statistics: {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        };
        expiresAt: Date;
        currentQuestion?: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        } | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    };
    message?: string | undefined;
}, {
    success: true;
    session: {
        status: "completed" | "active" | "abandoned";
        settings: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        };
        userId: string;
        currentQuestionIndex: number;
        createdAt: Date;
        sessionId: string;
        questionPool: string[];
        answers: {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }[];
        statistics: {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        };
        expiresAt: Date;
        currentQuestion?: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        } | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    };
    message?: string | undefined;
}>;
export declare const StartPracticeSessionPayloadSchema: z.ZodObject<{
    userId: z.ZodString;
    settings: z.ZodObject<{
        gradeLevel: z.ZodString;
        discipline: z.ZodString;
        themes: z.ZodArray<z.ZodString, "many">;
        questionCount: z.ZodNumber;
        showImmediateFeedback: z.ZodBoolean;
        allowRetry: z.ZodBoolean;
        randomizeQuestions: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
    }, {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
    }>;
    preferences: z.ZodOptional<z.ZodObject<{
        maxDurationMinutes: z.ZodOptional<z.ZodNumber>;
        shuffleQuestions: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        maxDurationMinutes?: number | undefined;
        shuffleQuestions?: boolean | undefined;
    }, {
        maxDurationMinutes?: number | undefined;
        shuffleQuestions?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    settings: {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
    };
    userId: string;
    preferences?: {
        maxDurationMinutes?: number | undefined;
        shuffleQuestions?: boolean | undefined;
    } | undefined;
}, {
    settings: {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
    };
    userId: string;
    preferences?: {
        maxDurationMinutes?: number | undefined;
        shuffleQuestions?: boolean | undefined;
    } | undefined;
}>;
export declare const SubmitPracticeAnswerPayloadSchema: z.ZodObject<{
    sessionId: z.ZodString;
    questionUid: z.ZodString;
    selectedAnswers: z.ZodArray<z.ZodNumber, "many">;
    timeSpentMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    questionUid: string;
    selectedAnswers: number[];
    timeSpentMs: number;
    sessionId: string;
}, {
    questionUid: string;
    selectedAnswers: number[];
    timeSpentMs: number;
    sessionId: string;
}>;
export declare const GetNextPracticeQuestionPayloadSchema: z.ZodObject<{
    sessionId: z.ZodString;
    skipCurrent: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    skipCurrent?: boolean | undefined;
}, {
    sessionId: string;
    skipCurrent?: boolean | undefined;
}>;
export declare const RetryPracticeQuestionPayloadSchema: z.ZodObject<{
    sessionId: z.ZodString;
    questionUid: z.ZodString;
}, "strip", z.ZodTypeAny, {
    questionUid: string;
    sessionId: string;
}, {
    questionUid: string;
    sessionId: string;
}>;
export declare const EndPracticeSessionPayloadSchema: z.ZodObject<{
    sessionId: z.ZodString;
    reason: z.ZodEnum<["completed", "user_quit", "timeout"]>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    reason: "completed" | "user_quit" | "timeout";
}, {
    sessionId: string;
    reason: "completed" | "user_quit" | "timeout";
}>;
export declare const GetPracticeSessionStatePayloadSchema: z.ZodObject<{
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
}, {
    sessionId: string;
}>;
export declare const CreatePracticeSessionApiRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    settings: z.ZodObject<{
        gradeLevel: z.ZodString;
        discipline: z.ZodString;
        themes: z.ZodArray<z.ZodString, "many">;
        questionCount: z.ZodNumber;
        showImmediateFeedback: z.ZodBoolean;
        allowRetry: z.ZodBoolean;
        randomizeQuestions: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
    }, {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    settings: {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
    };
    userId: string;
}, {
    settings: {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
    };
    userId: string;
}>;
export declare const GetPracticeSessionsApiRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<["active", "completed", "abandoned"]>>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    status?: "completed" | "active" | "abandoned" | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}, {
    userId: string;
    status?: "completed" | "active" | "abandoned" | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export declare const UpdatePracticeSessionApiRequestSchema: z.ZodObject<{
    sessionId: z.ZodString;
    settings: z.ZodObject<{
        gradeLevel: z.ZodOptional<z.ZodString>;
        discipline: z.ZodOptional<z.ZodString>;
        themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        questionCount: z.ZodOptional<z.ZodNumber>;
        showImmediateFeedback: z.ZodOptional<z.ZodBoolean>;
        allowRetry: z.ZodOptional<z.ZodBoolean>;
        randomizeQuestions: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        gradeLevel?: string | undefined;
        discipline?: string | undefined;
        themes?: string[] | undefined;
        questionCount?: number | undefined;
        showImmediateFeedback?: boolean | undefined;
        allowRetry?: boolean | undefined;
        randomizeQuestions?: boolean | undefined;
    }, {
        gradeLevel?: string | undefined;
        discipline?: string | undefined;
        themes?: string[] | undefined;
        questionCount?: number | undefined;
        showImmediateFeedback?: boolean | undefined;
        allowRetry?: boolean | undefined;
        randomizeQuestions?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    settings: {
        gradeLevel?: string | undefined;
        discipline?: string | undefined;
        themes?: string[] | undefined;
        questionCount?: number | undefined;
        showImmediateFeedback?: boolean | undefined;
        allowRetry?: boolean | undefined;
        randomizeQuestions?: boolean | undefined;
    };
    sessionId: string;
}, {
    settings: {
        gradeLevel?: string | undefined;
        discipline?: string | undefined;
        themes?: string[] | undefined;
        questionCount?: number | undefined;
        showImmediateFeedback?: boolean | undefined;
        allowRetry?: boolean | undefined;
        randomizeQuestions?: boolean | undefined;
    };
    sessionId: string;
}>;
export declare const GetPracticeQuestionsApiRequestSchema: z.ZodObject<{
    gradeLevel: z.ZodString;
    discipline: z.ZodString;
    themes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    limit: z.ZodOptional<z.ZodNumber>;
    excludeQuestions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    gradeLevel: string;
    discipline: string;
    themes?: string[] | undefined;
    limit?: number | undefined;
    excludeQuestions?: string[] | undefined;
}, {
    gradeLevel: string;
    discipline: string;
    themes?: string[] | undefined;
    limit?: number | undefined;
    excludeQuestions?: string[] | undefined;
}>;
export declare const CreatePracticeSessionApiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    session: z.ZodOptional<z.ZodObject<{
        sessionId: z.ZodString;
        userId: z.ZodString;
        settings: z.ZodObject<{
            gradeLevel: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodArray<z.ZodString, "many">;
            questionCount: z.ZodNumber;
            showImmediateFeedback: z.ZodBoolean;
            allowRetry: z.ZodBoolean;
            randomizeQuestions: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        }, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        }>;
        status: z.ZodEnum<["active", "completed", "abandoned"]>;
        questionPool: z.ZodArray<z.ZodString, "many">;
        currentQuestionIndex: z.ZodNumber;
        currentQuestion: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            uid: z.ZodString;
            title: z.ZodString;
            text: z.ZodString;
            questionType: z.ZodString;
            timeLimit: z.ZodNumber;
            gradeLevel: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodArray<z.ZodString, "many">;
            multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
                answerOptions: z.ZodArray<z.ZodString, "many">;
                correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
            }, "strip", z.ZodTypeAny, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }>>;
            numericQuestion: z.ZodOptional<z.ZodObject<{
                correctAnswer: z.ZodNumber;
                tolerance: z.ZodOptional<z.ZodNumber>;
                unit: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            }, {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            }>>;
            answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        }, "strip", z.ZodTypeAny, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        }, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        }>, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        }, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        }>>;
        answers: z.ZodArray<z.ZodObject<{
            questionUid: z.ZodString;
            selectedAnswers: z.ZodArray<z.ZodNumber, "many">;
            isCorrect: z.ZodBoolean;
            submittedAt: z.ZodDate;
            timeSpentMs: z.ZodNumber;
            attemptNumber: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }, {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }>, "many">;
        statistics: z.ZodObject<{
            questionsAttempted: z.ZodNumber;
            correctAnswers: z.ZodNumber;
            incorrectAnswers: z.ZodNumber;
            accuracyPercentage: z.ZodNumber;
            averageTimePerQuestion: z.ZodNumber;
            totalTimeSpent: z.ZodNumber;
            retriedQuestions: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        }, {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        }>;
        createdAt: z.ZodDate;
        startedAt: z.ZodOptional<z.ZodDate>;
        completedAt: z.ZodOptional<z.ZodDate>;
        expiresAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "active" | "abandoned";
        settings: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        };
        userId: string;
        currentQuestionIndex: number;
        createdAt: Date;
        sessionId: string;
        questionPool: string[];
        answers: {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }[];
        statistics: {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        };
        expiresAt: Date;
        currentQuestion?: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        } | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    }, {
        status: "completed" | "active" | "abandoned";
        settings: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        };
        userId: string;
        currentQuestionIndex: number;
        createdAt: Date;
        sessionId: string;
        questionPool: string[];
        answers: {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }[];
        statistics: {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        };
        expiresAt: Date;
        currentQuestion?: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        } | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    }>>;
    error: z.ZodOptional<z.ZodString>;
    statusCode: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    statusCode: number;
    error?: string | undefined;
    session?: {
        status: "completed" | "active" | "abandoned";
        settings: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        };
        userId: string;
        currentQuestionIndex: number;
        createdAt: Date;
        sessionId: string;
        questionPool: string[];
        answers: {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }[];
        statistics: {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        };
        expiresAt: Date;
        currentQuestion?: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        } | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    } | undefined;
}, {
    success: boolean;
    statusCode: number;
    error?: string | undefined;
    session?: {
        status: "completed" | "active" | "abandoned";
        settings: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        };
        userId: string;
        currentQuestionIndex: number;
        createdAt: Date;
        sessionId: string;
        questionPool: string[];
        answers: {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }[];
        statistics: {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        };
        expiresAt: Date;
        currentQuestion?: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        } | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    } | undefined;
}>;
export declare const GetPracticeSessionApiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    session: z.ZodOptional<z.ZodObject<{
        sessionId: z.ZodString;
        userId: z.ZodString;
        settings: z.ZodObject<{
            gradeLevel: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodArray<z.ZodString, "many">;
            questionCount: z.ZodNumber;
            showImmediateFeedback: z.ZodBoolean;
            allowRetry: z.ZodBoolean;
            randomizeQuestions: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        }, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        }>;
        status: z.ZodEnum<["active", "completed", "abandoned"]>;
        questionPool: z.ZodArray<z.ZodString, "many">;
        currentQuestionIndex: z.ZodNumber;
        currentQuestion: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            uid: z.ZodString;
            title: z.ZodString;
            text: z.ZodString;
            questionType: z.ZodString;
            timeLimit: z.ZodNumber;
            gradeLevel: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodArray<z.ZodString, "many">;
            multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
                answerOptions: z.ZodArray<z.ZodString, "many">;
                correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
            }, "strip", z.ZodTypeAny, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }>>;
            numericQuestion: z.ZodOptional<z.ZodObject<{
                correctAnswer: z.ZodNumber;
                tolerance: z.ZodOptional<z.ZodNumber>;
                unit: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            }, {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            }>>;
            answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        }, "strip", z.ZodTypeAny, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        }, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        }>, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        }, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        }>>;
        answers: z.ZodArray<z.ZodObject<{
            questionUid: z.ZodString;
            selectedAnswers: z.ZodArray<z.ZodNumber, "many">;
            isCorrect: z.ZodBoolean;
            submittedAt: z.ZodDate;
            timeSpentMs: z.ZodNumber;
            attemptNumber: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }, {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }>, "many">;
        statistics: z.ZodObject<{
            questionsAttempted: z.ZodNumber;
            correctAnswers: z.ZodNumber;
            incorrectAnswers: z.ZodNumber;
            accuracyPercentage: z.ZodNumber;
            averageTimePerQuestion: z.ZodNumber;
            totalTimeSpent: z.ZodNumber;
            retriedQuestions: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        }, {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        }>;
        createdAt: z.ZodDate;
        startedAt: z.ZodOptional<z.ZodDate>;
        completedAt: z.ZodOptional<z.ZodDate>;
        expiresAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "active" | "abandoned";
        settings: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        };
        userId: string;
        currentQuestionIndex: number;
        createdAt: Date;
        sessionId: string;
        questionPool: string[];
        answers: {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }[];
        statistics: {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        };
        expiresAt: Date;
        currentQuestion?: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        } | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    }, {
        status: "completed" | "active" | "abandoned";
        settings: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        };
        userId: string;
        currentQuestionIndex: number;
        createdAt: Date;
        sessionId: string;
        questionPool: string[];
        answers: {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }[];
        statistics: {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        };
        expiresAt: Date;
        currentQuestion?: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        } | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    }>>;
    error: z.ZodOptional<z.ZodString>;
    statusCode: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    statusCode: number;
    error?: string | undefined;
    session?: {
        status: "completed" | "active" | "abandoned";
        settings: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        };
        userId: string;
        currentQuestionIndex: number;
        createdAt: Date;
        sessionId: string;
        questionPool: string[];
        answers: {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }[];
        statistics: {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        };
        expiresAt: Date;
        currentQuestion?: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        } | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    } | undefined;
}, {
    success: boolean;
    statusCode: number;
    error?: string | undefined;
    session?: {
        status: "completed" | "active" | "abandoned";
        settings: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        };
        userId: string;
        currentQuestionIndex: number;
        createdAt: Date;
        sessionId: string;
        questionPool: string[];
        answers: {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }[];
        statistics: {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        };
        expiresAt: Date;
        currentQuestion?: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        } | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    } | undefined;
}>;
export declare const GetPracticeSessionsApiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    sessions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        sessionId: z.ZodString;
        userId: z.ZodString;
        settings: z.ZodObject<{
            gradeLevel: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodArray<z.ZodString, "many">;
            questionCount: z.ZodNumber;
            showImmediateFeedback: z.ZodBoolean;
            allowRetry: z.ZodBoolean;
            randomizeQuestions: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        }, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        }>;
        status: z.ZodEnum<["active", "completed", "abandoned"]>;
        questionPool: z.ZodArray<z.ZodString, "many">;
        currentQuestionIndex: z.ZodNumber;
        currentQuestion: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            uid: z.ZodString;
            title: z.ZodString;
            text: z.ZodString;
            questionType: z.ZodString;
            timeLimit: z.ZodNumber;
            gradeLevel: z.ZodString;
            discipline: z.ZodString;
            themes: z.ZodArray<z.ZodString, "many">;
            multipleChoiceQuestion: z.ZodOptional<z.ZodObject<{
                answerOptions: z.ZodArray<z.ZodString, "many">;
                correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
            }, "strip", z.ZodTypeAny, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }, {
                answerOptions: string[];
                correctAnswers: boolean[];
            }>>;
            numericQuestion: z.ZodOptional<z.ZodObject<{
                correctAnswer: z.ZodNumber;
                tolerance: z.ZodOptional<z.ZodNumber>;
                unit: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            }, {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            }>>;
            answerOptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        }, "strip", z.ZodTypeAny, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        }, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        }>, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        }, {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        }>>;
        answers: z.ZodArray<z.ZodObject<{
            questionUid: z.ZodString;
            selectedAnswers: z.ZodArray<z.ZodNumber, "many">;
            isCorrect: z.ZodBoolean;
            submittedAt: z.ZodDate;
            timeSpentMs: z.ZodNumber;
            attemptNumber: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }, {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }>, "many">;
        statistics: z.ZodObject<{
            questionsAttempted: z.ZodNumber;
            correctAnswers: z.ZodNumber;
            incorrectAnswers: z.ZodNumber;
            accuracyPercentage: z.ZodNumber;
            averageTimePerQuestion: z.ZodNumber;
            totalTimeSpent: z.ZodNumber;
            retriedQuestions: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        }, {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        }>;
        createdAt: z.ZodDate;
        startedAt: z.ZodOptional<z.ZodDate>;
        completedAt: z.ZodOptional<z.ZodDate>;
        expiresAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "active" | "abandoned";
        settings: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        };
        userId: string;
        currentQuestionIndex: number;
        createdAt: Date;
        sessionId: string;
        questionPool: string[];
        answers: {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }[];
        statistics: {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        };
        expiresAt: Date;
        currentQuestion?: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        } | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    }, {
        status: "completed" | "active" | "abandoned";
        settings: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        };
        userId: string;
        currentQuestionIndex: number;
        createdAt: Date;
        sessionId: string;
        questionPool: string[];
        answers: {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }[];
        statistics: {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        };
        expiresAt: Date;
        currentQuestion?: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        } | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    }>, "many">>;
    pagination: z.ZodOptional<z.ZodObject<{
        total: z.ZodNumber;
        page: z.ZodNumber;
        pageSize: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }, {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>>;
    error: z.ZodOptional<z.ZodString>;
    statusCode: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    statusCode: number;
    error?: string | undefined;
    sessions?: {
        status: "completed" | "active" | "abandoned";
        settings: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        };
        userId: string;
        currentQuestionIndex: number;
        createdAt: Date;
        sessionId: string;
        questionPool: string[];
        answers: {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }[];
        statistics: {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        };
        expiresAt: Date;
        currentQuestion?: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        } | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    }[] | undefined;
    pagination?: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    } | undefined;
}, {
    success: boolean;
    statusCode: number;
    error?: string | undefined;
    sessions?: {
        status: "completed" | "active" | "abandoned";
        settings: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            questionCount: number;
            showImmediateFeedback: boolean;
            allowRetry: boolean;
            randomizeQuestions: boolean;
        };
        userId: string;
        currentQuestionIndex: number;
        createdAt: Date;
        sessionId: string;
        questionPool: string[];
        answers: {
            questionUid: string;
            selectedAnswers: number[];
            isCorrect: boolean;
            submittedAt: Date;
            timeSpentMs: number;
            attemptNumber: number;
        }[];
        statistics: {
            correctAnswers: number;
            questionsAttempted: number;
            incorrectAnswers: number;
            accuracyPercentage: number;
            averageTimePerQuestion: number;
            totalTimeSpent: number;
            retriedQuestions: string[];
        };
        expiresAt: Date;
        currentQuestion?: {
            gradeLevel: string;
            discipline: string;
            themes: string[];
            title: string;
            text: string;
            uid: string;
            questionType: string;
            timeLimit: number;
            answerOptions?: string[] | undefined;
            correctAnswers?: boolean[] | undefined;
            multipleChoiceQuestion?: {
                answerOptions: string[];
                correctAnswers: boolean[];
            } | undefined;
            numericQuestion?: {
                correctAnswer: number;
                tolerance?: number | undefined;
                unit?: string | undefined;
            } | undefined;
        } | undefined;
        startedAt?: Date | undefined;
        completedAt?: Date | undefined;
    }[] | undefined;
    pagination?: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    } | undefined;
}>;
export declare const GetPracticeQuestionsApiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    questionUids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    totalAvailable: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
    statusCode: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    statusCode: number;
    questionUids?: string[] | undefined;
    error?: string | undefined;
    totalAvailable?: number | undefined;
}, {
    success: boolean;
    statusCode: number;
    questionUids?: string[] | undefined;
    error?: string | undefined;
    totalAvailable?: number | undefined;
}>;
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
