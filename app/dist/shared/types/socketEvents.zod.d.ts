import { z } from 'zod';
export declare const timerUpdatePayloadSchema: z.ZodObject<{
    timeLeftMs: z.ZodNullable<z.ZodNumber>;
    running: z.ZodBoolean;
    durationMs: z.ZodOptional<z.ZodNumber>;
    serverTime: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timeLeftMs: number | null;
    running: boolean;
    serverTime: number;
    durationMs?: number | undefined;
}, {
    timeLeftMs: number | null;
    running: boolean;
    serverTime: number;
    durationMs?: number | undefined;
}>;
export declare const gameTimerStateSchema: z.ZodObject<{
    status: z.ZodEnum<["run", "pause", "stop"]>;
    timerEndDateMs: z.ZodNumber;
    questionUid: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "run" | "pause" | "stop";
    timerEndDateMs: number;
    questionUid: string;
}, {
    status: "run" | "pause" | "stop";
    timerEndDateMs: number;
    questionUid: string;
}>;
export declare const dashboardTimerUpdatedPayloadSchema: z.ZodObject<{
    timer: z.ZodObject<{
        status: z.ZodEnum<["run", "pause", "stop"]>;
        timerEndDateMs: z.ZodNumber;
        questionUid: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "run" | "pause" | "stop";
        timerEndDateMs: number;
        questionUid: string;
    }, {
        status: "run" | "pause" | "stop";
        timerEndDateMs: number;
        questionUid: string;
    }>;
    questionUid: z.ZodString;
    questionIndex: z.ZodNumber;
    totalQuestions: z.ZodNumber;
    answersLocked: z.ZodBoolean;
    serverTime: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    serverTime: number;
    questionUid: string;
    timer: {
        status: "run" | "pause" | "stop";
        timerEndDateMs: number;
        questionUid: string;
    };
    questionIndex: number;
    totalQuestions: number;
    answersLocked: boolean;
}, {
    serverTime: number;
    questionUid: string;
    timer: {
        status: "run" | "pause" | "stop";
        timerEndDateMs: number;
        questionUid: string;
    };
    questionIndex: number;
    totalQuestions: number;
    answersLocked: boolean;
}>;
export declare const gameTimerUpdatePayloadSchema: z.ZodObject<{
    timer: z.ZodObject<{
        status: z.ZodEnum<["run", "pause", "stop"]>;
        timerEndDateMs: z.ZodNumber;
        questionUid: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "run" | "pause" | "stop";
        timerEndDateMs: number;
        questionUid: string;
    }, {
        status: "run" | "pause" | "stop";
        timerEndDateMs: number;
        questionUid: string;
    }>;
    questionUid: z.ZodString;
    questionIndex: z.ZodNumber;
    totalQuestions: z.ZodNumber;
    answersLocked: z.ZodBoolean;
    serverTime: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    serverTime: number;
    questionUid: string;
    timer: {
        status: "run" | "pause" | "stop";
        timerEndDateMs: number;
        questionUid: string;
    };
    questionIndex: number;
    totalQuestions: number;
    answersLocked: boolean;
}, {
    serverTime: number;
    questionUid: string;
    timer: {
        status: "run" | "pause" | "stop";
        timerEndDateMs: number;
        questionUid: string;
    };
    questionIndex: number;
    totalQuestions: number;
    answersLocked: boolean;
}>;
export declare const participantStatusSchema: z.ZodEnum<["PENDING", "ACTIVE", "COMPLETED", "LEFT"]>;
export declare const participationTypeSchema: z.ZodEnum<["LIVE", "DEFERRED"]>;
export declare const setQuestionPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    questionUid: z.ZodString;
    questionIndex: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    questionUid: string;
    accessCode: string;
    questionIndex?: number | undefined;
}, {
    questionUid: string;
    accessCode: string;
    questionIndex?: number | undefined;
}>;
export declare const joinDashboardPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
}, {
    accessCode: string;
}>;
export declare const timerActionPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    action: z.ZodEnum<["run", "pause", "stop", "edit"]>;
    /**
     * Absolute timestamp (ms since epoch, UTC) when the timer is scheduled to end.
     * This is the canonical end date for the timer, used for backend/logic and precise signaling.
     * May be updated if the timer is changed during a quiz.
     */
    timerEndDateMs: z.ZodOptional<z.ZodNumber>;
    /**
     * Target time in milliseconds (duration or remaining time, NOT a date).
     * Used for UI, duration, or other timer logic. Distinct from timerEndDateMs.
     */
    targetTimeMs: z.ZodOptional<z.ZodNumber>;
    questionUid: z.ZodString;
    /**
     * For 'edit' action: the new duration in milliseconds (REQUIRED for 'edit')
     */
    durationMs: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    questionUid: string;
    accessCode: string;
    action: "run" | "pause" | "stop" | "edit";
    durationMs?: number | undefined;
    timerEndDateMs?: number | undefined;
    targetTimeMs?: number | undefined;
}, {
    questionUid: string;
    accessCode: string;
    action: "run" | "pause" | "stop" | "edit";
    durationMs?: number | undefined;
    timerEndDateMs?: number | undefined;
    targetTimeMs?: number | undefined;
}>;
export declare const lockAnswersPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    lock: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    lock: boolean;
}, {
    accessCode: string;
    lock: boolean;
}>;
export declare const endGamePayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
}, {
    accessCode: string;
}>;
export declare const joinGamePayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    userId: z.ZodString;
    username: z.ZodString;
    avatarEmoji: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    userId: string;
    username: string;
    avatarEmoji?: string | undefined;
}, {
    accessCode: string;
    userId: string;
    username: string;
    avatarEmoji?: string | undefined;
}>;
export declare const leaveGamePayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    userId: string;
}, {
    accessCode: string;
    userId: string;
}>;
export declare const participantDataSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    username: z.ZodString;
    avatarEmoji: z.ZodOptional<z.ZodString>;
    score: z.ZodNumber;
    status: z.ZodOptional<z.ZodEnum<["PENDING", "ACTIVE", "COMPLETED", "LEFT"]>>;
    online: z.ZodOptional<z.ZodBoolean>;
    joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    socketId: z.ZodOptional<z.ZodString>;
    attemptCount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    username: string;
    id: string;
    score: number;
    status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
    avatarEmoji?: string | undefined;
    online?: boolean | undefined;
    joinedAt?: string | number | undefined;
    socketId?: string | undefined;
    attemptCount?: number | undefined;
}, {
    userId: string;
    username: string;
    id: string;
    score: number;
    status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
    avatarEmoji?: string | undefined;
    online?: boolean | undefined;
    joinedAt?: string | number | undefined;
    socketId?: string | undefined;
    attemptCount?: number | undefined;
}>;
export declare const gameAnswerPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    userId: z.ZodString;
    questionUid: z.ZodString;
    answer: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodArray<z.ZodString, "many">, z.ZodArray<z.ZodNumber, "many">]>;
    timeSpent: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    questionUid: string;
    accessCode: string;
    userId: string;
    answer: string | number | string[] | number[];
    timeSpent: number;
}, {
    questionUid: string;
    accessCode: string;
    userId: string;
    answer: string | number | string[] | number[];
    timeSpent: number;
}>;
export declare const errorPayloadSchema: z.ZodObject<{
    message: z.ZodString;
    code: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    code?: string | number | undefined;
    details?: Record<string, any> | undefined;
}, {
    message: string;
    code?: string | number | undefined;
    details?: Record<string, any> | undefined;
}>;
export declare const gameAlreadyPlayedPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
}, {
    accessCode: string;
}>;
export declare const playerJoinedGamePayloadSchema: z.ZodObject<{
    participant: z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        username: z.ZodString;
        avatarEmoji: z.ZodOptional<z.ZodString>;
        score: z.ZodNumber;
        status: z.ZodOptional<z.ZodEnum<["PENDING", "ACTIVE", "COMPLETED", "LEFT"]>>;
        online: z.ZodOptional<z.ZodBoolean>;
        joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        socketId: z.ZodOptional<z.ZodString>;
        attemptCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        username: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        socketId?: string | undefined;
        attemptCount?: number | undefined;
    }, {
        userId: string;
        username: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        socketId?: string | undefined;
        attemptCount?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    participant: {
        userId: string;
        username: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        socketId?: string | undefined;
        attemptCount?: number | undefined;
    };
}, {
    participant: {
        userId: string;
        username: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        socketId?: string | undefined;
        attemptCount?: number | undefined;
    };
}>;
export declare const notificationPayloadSchema: z.ZodObject<{
    message: z.ZodString;
    defaultMode: z.ZodEnum<["info", "warning", "error", "success"]>;
}, "strip", z.ZodTypeAny, {
    message: string;
    defaultMode: "info" | "warning" | "error" | "success";
}, {
    message: string;
    defaultMode: "info" | "warning" | "error" | "success";
}>;
export declare const questionDataForStudentSchema: z.ZodObject<{
    uid: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
    answerOptions: z.ZodArray<z.ZodString, "many">;
    questionType: z.ZodString;
    timeLimit: z.ZodNumber;
    currentQuestionIndex: z.ZodOptional<z.ZodNumber>;
    totalQuestions: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    uid: string;
    text: string;
    answerOptions: string[];
    questionType: string;
    timeLimit: number;
    totalQuestions?: number | undefined;
    title?: string | undefined;
    currentQuestionIndex?: number | undefined;
}, {
    uid: string;
    text: string;
    answerOptions: string[];
    questionType: string;
    timeLimit: number;
    totalQuestions?: number | undefined;
    title?: string | undefined;
    currentQuestionIndex?: number | undefined;
}>;
export declare const questionDataForTeacherSchema: z.ZodObject<{
    uid: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
    answerOptions: z.ZodArray<z.ZodString, "many">;
    questionType: z.ZodString;
    timeLimit: z.ZodNumber;
    currentQuestionIndex: z.ZodOptional<z.ZodNumber>;
    totalQuestions: z.ZodOptional<z.ZodNumber>;
} & {
    correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
    explanation: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    uid: string;
    text: string;
    answerOptions: string[];
    questionType: string;
    timeLimit: number;
    correctAnswers: boolean[];
    totalQuestions?: number | undefined;
    title?: string | undefined;
    currentQuestionIndex?: number | undefined;
    explanation?: string | undefined;
}, {
    uid: string;
    text: string;
    answerOptions: string[];
    questionType: string;
    timeLimit: number;
    correctAnswers: boolean[];
    totalQuestions?: number | undefined;
    title?: string | undefined;
    currentQuestionIndex?: number | undefined;
    explanation?: string | undefined;
}>;
/** @deprecated Use questionDataForStudentSchema or questionDataForTeacherSchema */
export declare const questionDataSchema: z.ZodObject<{
    uid: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
    answerOptions: z.ZodArray<z.ZodString, "many">;
    questionType: z.ZodString;
    timeLimit: z.ZodNumber;
    currentQuestionIndex: z.ZodOptional<z.ZodNumber>;
    totalQuestions: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    uid: string;
    text: string;
    answerOptions: string[];
    questionType: string;
    timeLimit: number;
    totalQuestions?: number | undefined;
    title?: string | undefined;
    currentQuestionIndex?: number | undefined;
}, {
    uid: string;
    text: string;
    answerOptions: string[];
    questionType: string;
    timeLimit: number;
    totalQuestions?: number | undefined;
    title?: string | undefined;
    currentQuestionIndex?: number | undefined;
}>;
export declare const leaderboardEntryDataSchema: z.ZodObject<{
    userId: z.ZodString;
    username: z.ZodString;
    avatarEmoji: z.ZodOptional<z.ZodString>;
    score: z.ZodNumber;
    rank: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    username: string;
    score: number;
    avatarEmoji?: string | undefined;
    rank?: number | undefined;
}, {
    userId: string;
    username: string;
    score: number;
    avatarEmoji?: string | undefined;
    rank?: number | undefined;
}>;
export declare const clientToServerEventsSchema: z.ZodObject<{
    join_game: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
        userId: z.ZodString;
        username: z.ZodString;
        avatarEmoji: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        accessCode: string;
        userId: string;
        username: string;
        avatarEmoji?: string | undefined;
    }, {
        accessCode: string;
        userId: string;
        username: string;
        avatarEmoji?: string | undefined;
    }>], z.ZodUnknown>, z.ZodVoid>;
    game_answer: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
        userId: z.ZodString;
        questionUid: z.ZodString;
        answer: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodArray<z.ZodString, "many">, z.ZodArray<z.ZodNumber, "many">]>;
        timeSpent: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        questionUid: string;
        accessCode: string;
        userId: string;
        answer: string | number | string[] | number[];
        timeSpent: number;
    }, {
        questionUid: string;
        accessCode: string;
        userId: string;
        answer: string | number | string[] | number[];
        timeSpent: number;
    }>], z.ZodUnknown>, z.ZodVoid>;
    request_participants: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        accessCode: string;
    }, {
        accessCode: string;
    }>], z.ZodUnknown>, z.ZodVoid>;
    teacher_set_question: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
        questionUid: z.ZodString;
        questionIndex: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        questionUid: string;
        questionIndex: number;
        accessCode: string;
    }, {
        questionUid: string;
        questionIndex: number;
        accessCode: string;
    }>], z.ZodUnknown>, z.ZodVoid>;
    teacher_timer_action: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
        action: z.ZodEnum<["run", "pause", "stop", "edit"]>;
        /**
         * Absolute timestamp (ms since epoch, UTC) when the timer is scheduled to end.
         * This is the canonical end date for the timer, used for backend/logic and precise signaling.
         * May be updated if the timer is changed during a quiz.
         */
        timerEndDateMs: z.ZodOptional<z.ZodNumber>;
        /**
         * Target time in milliseconds (duration or remaining time, NOT a date).
         * Used for UI, duration, or other timer logic. Distinct from timerEndDateMs.
         */
        targetTimeMs: z.ZodOptional<z.ZodNumber>;
        questionUid: z.ZodString;
        /**
         * For 'edit' action: the new duration in milliseconds (REQUIRED for 'edit')
         */
        durationMs: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        questionUid: string;
        accessCode: string;
        action: "run" | "pause" | "stop" | "edit";
        durationMs?: number | undefined;
        timerEndDateMs?: number | undefined;
        targetTimeMs?: number | undefined;
    }, {
        questionUid: string;
        accessCode: string;
        action: "run" | "pause" | "stop" | "edit";
        durationMs?: number | undefined;
        timerEndDateMs?: number | undefined;
        targetTimeMs?: number | undefined;
    }>], z.ZodUnknown>, z.ZodVoid>;
    teacher_lock_answers: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
        lock: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        accessCode: string;
        lock: boolean;
    }, {
        accessCode: string;
        lock: boolean;
    }>], z.ZodUnknown>, z.ZodVoid>;
    teacher_end_game: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        accessCode: string;
    }, {
        accessCode: string;
    }>], z.ZodUnknown>, z.ZodVoid>;
}, "strip", z.ZodTypeAny, {
    join_game: (args_0: {
        accessCode: string;
        userId: string;
        username: string;
        avatarEmoji?: string | undefined;
    }, ...args: unknown[]) => void;
    game_answer: (args_0: {
        questionUid: string;
        accessCode: string;
        userId: string;
        answer: string | number | string[] | number[];
        timeSpent: number;
    }, ...args: unknown[]) => void;
    request_participants: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    teacher_set_question: (args_0: {
        questionUid: string;
        questionIndex: number;
        accessCode: string;
    }, ...args: unknown[]) => void;
    teacher_timer_action: (args_0: {
        questionUid: string;
        accessCode: string;
        action: "run" | "pause" | "stop" | "edit";
        durationMs?: number | undefined;
        timerEndDateMs?: number | undefined;
        targetTimeMs?: number | undefined;
    }, ...args: unknown[]) => void;
    teacher_lock_answers: (args_0: {
        accessCode: string;
        lock: boolean;
    }, ...args: unknown[]) => void;
    teacher_end_game: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
}, {
    join_game: (args_0: {
        accessCode: string;
        userId: string;
        username: string;
        avatarEmoji?: string | undefined;
    }, ...args: unknown[]) => void;
    game_answer: (args_0: {
        questionUid: string;
        accessCode: string;
        userId: string;
        answer: string | number | string[] | number[];
        timeSpent: number;
    }, ...args: unknown[]) => void;
    request_participants: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    teacher_set_question: (args_0: {
        questionUid: string;
        questionIndex: number;
        accessCode: string;
    }, ...args: unknown[]) => void;
    teacher_timer_action: (args_0: {
        questionUid: string;
        accessCode: string;
        action: "run" | "pause" | "stop" | "edit";
        durationMs?: number | undefined;
        timerEndDateMs?: number | undefined;
        targetTimeMs?: number | undefined;
    }, ...args: unknown[]) => void;
    teacher_lock_answers: (args_0: {
        accessCode: string;
        lock: boolean;
    }, ...args: unknown[]) => void;
    teacher_end_game: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
}>;
export declare const interServerEventsSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const socketDataSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["STUDENT", "TEACHER", "GUEST"]>>;
    accessCode: z.ZodOptional<z.ZodString>;
    currentGameRoom: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessCode?: string | undefined;
    userId?: string | undefined;
    username?: string | undefined;
    role?: "STUDENT" | "TEACHER" | "GUEST" | undefined;
    currentGameRoom?: string | undefined;
}, {
    accessCode?: string | undefined;
    userId?: string | undefined;
    username?: string | undefined;
    role?: "STUDENT" | "TEACHER" | "GUEST" | undefined;
    currentGameRoom?: string | undefined;
}>;
export declare const gameJoinedPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    participant: z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        username: z.ZodString;
        avatarEmoji: z.ZodOptional<z.ZodString>;
        score: z.ZodNumber;
        status: z.ZodOptional<z.ZodEnum<["PENDING", "ACTIVE", "COMPLETED", "LEFT"]>>;
        online: z.ZodOptional<z.ZodBoolean>;
        joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        socketId: z.ZodOptional<z.ZodString>;
        attemptCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        username: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        socketId?: string | undefined;
        attemptCount?: number | undefined;
    }, {
        userId: string;
        username: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        socketId?: string | undefined;
        attemptCount?: number | undefined;
    }>;
    gameStatus: z.ZodEnum<["pending", "active", "completed", "archived"]>;
    gameMode: z.ZodEnum<["tournament", "quiz", "practice", "class"]>;
    differedAvailableFrom: z.ZodOptional<z.ZodString>;
    differedAvailableTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    participant: {
        userId: string;
        username: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        socketId?: string | undefined;
        attemptCount?: number | undefined;
    };
    gameStatus: "pending" | "active" | "completed" | "archived";
    gameMode: "tournament" | "quiz" | "practice" | "class";
    differedAvailableFrom?: string | undefined;
    differedAvailableTo?: string | undefined;
}, {
    accessCode: string;
    participant: {
        userId: string;
        username: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        socketId?: string | undefined;
        attemptCount?: number | undefined;
    };
    gameStatus: "pending" | "active" | "completed" | "archived";
    gameMode: "tournament" | "quiz" | "practice" | "class";
    differedAvailableFrom?: string | undefined;
    differedAvailableTo?: string | undefined;
}>;
export declare const requestNextQuestionPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    userId: z.ZodString;
    currentQuestionUid: z.ZodString;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    userId: string;
    currentQuestionUid: string;
}, {
    accessCode: string;
    userId: string;
    currentQuestionUid: string;
}>;
export declare const correctAnswersPayloadSchema: z.ZodObject<{
    questionUid: z.ZodString;
    correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
    /**
     * Map of questionUid to boolean indicating if correct answers have been shown (terminated)
     */
    terminatedQuestions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    questionUid: string;
    correctAnswers?: boolean[] | undefined;
    terminatedQuestions?: Record<string, boolean> | undefined;
}, {
    questionUid: string;
    correctAnswers?: boolean[] | undefined;
    terminatedQuestions?: Record<string, boolean> | undefined;
}>;
export declare const feedbackPayloadSchema: z.ZodObject<{
    questionUid: z.ZodString;
    feedbackRemaining: z.ZodNumber;
}, "strip", z.ZodAny, z.objectOutputType<{
    questionUid: z.ZodString;
    feedbackRemaining: z.ZodNumber;
}, z.ZodAny, "strip">, z.objectInputType<{
    questionUid: z.ZodString;
    feedbackRemaining: z.ZodNumber;
}, z.ZodAny, "strip">>;
export declare const gameStateUpdatePayloadSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["waiting", "active", "paused", "finished"]>>;
    currentQuestion: z.ZodOptional<z.ZodObject<{
        uid: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        text: z.ZodString;
        answerOptions: z.ZodArray<z.ZodString, "many">;
        questionType: z.ZodString;
        timeLimit: z.ZodNumber;
        currentQuestionIndex: z.ZodOptional<z.ZodNumber>;
        totalQuestions: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        uid: string;
        text: string;
        answerOptions: string[];
        questionType: string;
        timeLimit: number;
        totalQuestions?: number | undefined;
        title?: string | undefined;
        currentQuestionIndex?: number | undefined;
    }, {
        uid: string;
        text: string;
        answerOptions: string[];
        questionType: string;
        timeLimit: number;
        totalQuestions?: number | undefined;
        title?: string | undefined;
        currentQuestionIndex?: number | undefined;
    }>>;
    questionIndex: z.ZodOptional<z.ZodNumber>;
    totalQuestions: z.ZodOptional<z.ZodNumber>;
    timer: z.ZodOptional<z.ZodNumber>;
    participants: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        username: z.ZodString;
        avatarEmoji: z.ZodOptional<z.ZodString>;
        score: z.ZodNumber;
        status: z.ZodOptional<z.ZodEnum<["PENDING", "ACTIVE", "COMPLETED", "LEFT"]>>;
        online: z.ZodOptional<z.ZodBoolean>;
        joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        socketId: z.ZodOptional<z.ZodString>;
        attemptCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        username: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        socketId?: string | undefined;
        attemptCount?: number | undefined;
    }, {
        userId: string;
        username: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        socketId?: string | undefined;
        attemptCount?: number | undefined;
    }>, "many">>;
    gameMode: z.ZodOptional<z.ZodEnum<["tournament", "quiz", "practice", "class"]>>;
}, "strip", z.ZodAny, z.objectOutputType<{
    status: z.ZodOptional<z.ZodEnum<["waiting", "active", "paused", "finished"]>>;
    currentQuestion: z.ZodOptional<z.ZodObject<{
        uid: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        text: z.ZodString;
        answerOptions: z.ZodArray<z.ZodString, "many">;
        questionType: z.ZodString;
        timeLimit: z.ZodNumber;
        currentQuestionIndex: z.ZodOptional<z.ZodNumber>;
        totalQuestions: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        uid: string;
        text: string;
        answerOptions: string[];
        questionType: string;
        timeLimit: number;
        totalQuestions?: number | undefined;
        title?: string | undefined;
        currentQuestionIndex?: number | undefined;
    }, {
        uid: string;
        text: string;
        answerOptions: string[];
        questionType: string;
        timeLimit: number;
        totalQuestions?: number | undefined;
        title?: string | undefined;
        currentQuestionIndex?: number | undefined;
    }>>;
    questionIndex: z.ZodOptional<z.ZodNumber>;
    totalQuestions: z.ZodOptional<z.ZodNumber>;
    timer: z.ZodOptional<z.ZodNumber>;
    participants: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        username: z.ZodString;
        avatarEmoji: z.ZodOptional<z.ZodString>;
        score: z.ZodNumber;
        status: z.ZodOptional<z.ZodEnum<["PENDING", "ACTIVE", "COMPLETED", "LEFT"]>>;
        online: z.ZodOptional<z.ZodBoolean>;
        joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        socketId: z.ZodOptional<z.ZodString>;
        attemptCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        username: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        socketId?: string | undefined;
        attemptCount?: number | undefined;
    }, {
        userId: string;
        username: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        socketId?: string | undefined;
        attemptCount?: number | undefined;
    }>, "many">>;
    gameMode: z.ZodOptional<z.ZodEnum<["tournament", "quiz", "practice", "class"]>>;
}, z.ZodAny, "strip">, z.objectInputType<{
    status: z.ZodOptional<z.ZodEnum<["waiting", "active", "paused", "finished"]>>;
    currentQuestion: z.ZodOptional<z.ZodObject<{
        uid: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        text: z.ZodString;
        answerOptions: z.ZodArray<z.ZodString, "many">;
        questionType: z.ZodString;
        timeLimit: z.ZodNumber;
        currentQuestionIndex: z.ZodOptional<z.ZodNumber>;
        totalQuestions: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        uid: string;
        text: string;
        answerOptions: string[];
        questionType: string;
        timeLimit: number;
        totalQuestions?: number | undefined;
        title?: string | undefined;
        currentQuestionIndex?: number | undefined;
    }, {
        uid: string;
        text: string;
        answerOptions: string[];
        questionType: string;
        timeLimit: number;
        totalQuestions?: number | undefined;
        title?: string | undefined;
        currentQuestionIndex?: number | undefined;
    }>>;
    questionIndex: z.ZodOptional<z.ZodNumber>;
    totalQuestions: z.ZodOptional<z.ZodNumber>;
    timer: z.ZodOptional<z.ZodNumber>;
    participants: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        username: z.ZodString;
        avatarEmoji: z.ZodOptional<z.ZodString>;
        score: z.ZodNumber;
        status: z.ZodOptional<z.ZodEnum<["PENDING", "ACTIVE", "COMPLETED", "LEFT"]>>;
        online: z.ZodOptional<z.ZodBoolean>;
        joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        socketId: z.ZodOptional<z.ZodString>;
        attemptCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        username: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        socketId?: string | undefined;
        attemptCount?: number | undefined;
    }, {
        userId: string;
        username: string;
        id: string;
        score: number;
        status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
        joinedAt?: string | number | undefined;
        socketId?: string | undefined;
        attemptCount?: number | undefined;
    }>, "many">>;
    gameMode: z.ZodOptional<z.ZodEnum<["tournament", "quiz", "practice", "class"]>>;
}, z.ZodAny, "strip">>;
export declare const answerReceivedPayloadSchema: z.ZodObject<{
    questionUid: z.ZodString;
    timeSpent: z.ZodNumber;
    correct: z.ZodOptional<z.ZodBoolean>;
    correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
    explanation: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    questionUid: string;
    timeSpent: number;
    correctAnswers?: boolean[] | undefined;
    explanation?: string | undefined;
    correct?: boolean | undefined;
}, {
    questionUid: string;
    timeSpent: number;
    correctAnswers?: boolean[] | undefined;
    explanation?: string | undefined;
    correct?: boolean | undefined;
}>;
export declare const answerFeedbackPayloadSchema: z.ZodObject<{
    status: z.ZodEnum<["ok", "error"]>;
    questionUid: z.ZodOptional<z.ZodString>;
    scoreAwarded: z.ZodOptional<z.ZodNumber>;
    code: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    isCorrect: z.ZodOptional<z.ZodBoolean>;
    correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
    explanation: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodAny, z.objectOutputType<{
    status: z.ZodEnum<["ok", "error"]>;
    questionUid: z.ZodOptional<z.ZodString>;
    scoreAwarded: z.ZodOptional<z.ZodNumber>;
    code: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    isCorrect: z.ZodOptional<z.ZodBoolean>;
    correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
    explanation: z.ZodOptional<z.ZodString>;
}, z.ZodAny, "strip">, z.objectInputType<{
    status: z.ZodEnum<["ok", "error"]>;
    questionUid: z.ZodOptional<z.ZodString>;
    scoreAwarded: z.ZodOptional<z.ZodNumber>;
    code: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    isCorrect: z.ZodOptional<z.ZodBoolean>;
    correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
    explanation: z.ZodOptional<z.ZodString>;
}, z.ZodAny, "strip">>;
export declare const serverToClientEventsSchema: z.ZodObject<{
    connect: z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodVoid>;
    disconnect: z.ZodFunction<z.ZodTuple<[z.ZodString], z.ZodUnknown>, z.ZodVoid>;
    connection_established: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        socketId: z.ZodString;
        timestamp: z.ZodString;
        user: z.ZodObject<{
            userId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            username: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            role: z.ZodOptional<z.ZodOptional<z.ZodEnum<["STUDENT", "TEACHER", "GUEST"]>>>;
            accessCode: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            currentGameRoom: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            accessCode?: string | undefined;
            userId?: string | undefined;
            username?: string | undefined;
            role?: "STUDENT" | "TEACHER" | "GUEST" | undefined;
            currentGameRoom?: string | undefined;
        }, {
            accessCode?: string | undefined;
            userId?: string | undefined;
            username?: string | undefined;
            role?: "STUDENT" | "TEACHER" | "GUEST" | undefined;
            currentGameRoom?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        socketId: string;
        timestamp: string;
        user: {
            accessCode?: string | undefined;
            userId?: string | undefined;
            username?: string | undefined;
            role?: "STUDENT" | "TEACHER" | "GUEST" | undefined;
            currentGameRoom?: string | undefined;
        };
    }, {
        socketId: string;
        timestamp: string;
        user: {
            accessCode?: string | undefined;
            userId?: string | undefined;
            username?: string | undefined;
            role?: "STUDENT" | "TEACHER" | "GUEST" | undefined;
            currentGameRoom?: string | undefined;
        };
    }>], z.ZodUnknown>, z.ZodVoid>;
    game_joined: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
        participant: z.ZodObject<{
            id: z.ZodString;
            userId: z.ZodString;
            username: z.ZodString;
            avatarEmoji: z.ZodOptional<z.ZodString>;
            score: z.ZodNumber;
            status: z.ZodOptional<z.ZodEnum<["PENDING", "ACTIVE", "COMPLETED", "LEFT"]>>;
            online: z.ZodOptional<z.ZodBoolean>;
            joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            socketId: z.ZodOptional<z.ZodString>;
            attemptCount: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }, {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }>;
        gameStatus: z.ZodEnum<["pending", "active", "completed", "archived"]>;
        gameMode: z.ZodEnum<["tournament", "quiz", "practice", "class"]>;
        differedAvailableFrom: z.ZodOptional<z.ZodString>;
        differedAvailableTo: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        accessCode: string;
        participant: {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        };
        gameStatus: "pending" | "active" | "completed" | "archived";
        gameMode: "tournament" | "quiz" | "practice" | "class";
        differedAvailableFrom?: string | undefined;
        differedAvailableTo?: string | undefined;
    }, {
        accessCode: string;
        participant: {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        };
        gameStatus: "pending" | "active" | "completed" | "archived";
        gameMode: "tournament" | "quiz" | "practice" | "class";
        differedAvailableFrom?: string | undefined;
        differedAvailableTo?: string | undefined;
    }>], z.ZodUnknown>, z.ZodVoid>;
    game_question: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        uid: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        text: z.ZodString;
        answerOptions: z.ZodArray<z.ZodString, "many">;
        questionType: z.ZodString;
        timeLimit: z.ZodNumber;
        currentQuestionIndex: z.ZodOptional<z.ZodNumber>;
        totalQuestions: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        uid: string;
        text: string;
        answerOptions: string[];
        questionType: string;
        timeLimit: number;
        totalQuestions?: number | undefined;
        title?: string | undefined;
        currentQuestionIndex?: number | undefined;
    }, {
        uid: string;
        text: string;
        answerOptions: string[];
        questionType: string;
        timeLimit: number;
        totalQuestions?: number | undefined;
        title?: string | undefined;
        currentQuestionIndex?: number | undefined;
    }>], z.ZodUnknown>, z.ZodVoid>;
    answer_received: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        questionUid: z.ZodString;
        timeSpent: z.ZodNumber;
        correct: z.ZodOptional<z.ZodBoolean>;
        correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        explanation: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        questionUid: string;
        timeSpent: number;
        correctAnswers?: boolean[] | undefined;
        explanation?: string | undefined;
        correct?: boolean | undefined;
    }, {
        questionUid: string;
        timeSpent: number;
        correctAnswers?: boolean[] | undefined;
        explanation?: string | undefined;
        correct?: boolean | undefined;
    }>], z.ZodUnknown>, z.ZodVoid>;
    leaderboard_update: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        leaderboard: z.ZodArray<z.ZodObject<{
            userId: z.ZodString;
            username: z.ZodString;
            avatarEmoji: z.ZodOptional<z.ZodString>;
            score: z.ZodNumber;
            rank: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            userId: string;
            username: string;
            score: number;
            avatarEmoji?: string | undefined;
            rank?: number | undefined;
        }, {
            userId: string;
            username: string;
            score: number;
            avatarEmoji?: string | undefined;
            rank?: number | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        leaderboard: {
            userId: string;
            username: string;
            score: number;
            avatarEmoji?: string | undefined;
            rank?: number | undefined;
        }[];
    }, {
        leaderboard: {
            userId: string;
            username: string;
            score: number;
            avatarEmoji?: string | undefined;
            rank?: number | undefined;
        }[];
    }>], z.ZodUnknown>, z.ZodVoid>;
    player_joined_game: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        participant: z.ZodObject<{
            id: z.ZodString;
            userId: z.ZodString;
            username: z.ZodString;
            avatarEmoji: z.ZodOptional<z.ZodString>;
            score: z.ZodNumber;
            status: z.ZodOptional<z.ZodEnum<["PENDING", "ACTIVE", "COMPLETED", "LEFT"]>>;
            online: z.ZodOptional<z.ZodBoolean>;
            joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            socketId: z.ZodOptional<z.ZodString>;
            attemptCount: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }, {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        participant: {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        };
    }, {
        participant: {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        };
    }>], z.ZodUnknown>, z.ZodVoid>;
    player_left_game: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        userId: z.ZodString;
        socketId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        socketId: string;
    }, {
        userId: string;
        socketId: string;
    }>], z.ZodUnknown>, z.ZodVoid>;
    game_participants: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        participants: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            userId: z.ZodString;
            username: z.ZodString;
            avatarEmoji: z.ZodOptional<z.ZodString>;
            score: z.ZodNumber;
            status: z.ZodOptional<z.ZodEnum<["PENDING", "ACTIVE", "COMPLETED", "LEFT"]>>;
            online: z.ZodOptional<z.ZodBoolean>;
            joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            socketId: z.ZodOptional<z.ZodString>;
            attemptCount: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }, {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        participants: {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }[];
    }, {
        participants: {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }[];
    }>], z.ZodUnknown>, z.ZodVoid>;
    game_state_update: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        status: z.ZodOptional<z.ZodEnum<["waiting", "active", "paused", "finished"]>>;
        currentQuestion: z.ZodOptional<z.ZodObject<{
            uid: z.ZodString;
            title: z.ZodOptional<z.ZodString>;
            text: z.ZodString;
            answerOptions: z.ZodArray<z.ZodString, "many">;
            questionType: z.ZodString;
            timeLimit: z.ZodNumber;
            currentQuestionIndex: z.ZodOptional<z.ZodNumber>;
            totalQuestions: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            uid: string;
            text: string;
            answerOptions: string[];
            questionType: string;
            timeLimit: number;
            totalQuestions?: number | undefined;
            title?: string | undefined;
            currentQuestionIndex?: number | undefined;
        }, {
            uid: string;
            text: string;
            answerOptions: string[];
            questionType: string;
            timeLimit: number;
            totalQuestions?: number | undefined;
            title?: string | undefined;
            currentQuestionIndex?: number | undefined;
        }>>;
        questionIndex: z.ZodOptional<z.ZodNumber>;
        totalQuestions: z.ZodOptional<z.ZodNumber>;
        timer: z.ZodOptional<z.ZodNumber>;
        participants: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            userId: z.ZodString;
            username: z.ZodString;
            avatarEmoji: z.ZodOptional<z.ZodString>;
            score: z.ZodNumber;
            status: z.ZodOptional<z.ZodEnum<["PENDING", "ACTIVE", "COMPLETED", "LEFT"]>>;
            online: z.ZodOptional<z.ZodBoolean>;
            joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            socketId: z.ZodOptional<z.ZodString>;
            attemptCount: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }, {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }>, "many">>;
        gameMode: z.ZodOptional<z.ZodEnum<["tournament", "quiz", "practice", "class"]>>;
    }, "strip", z.ZodAny, z.objectOutputType<{
        status: z.ZodOptional<z.ZodEnum<["waiting", "active", "paused", "finished"]>>;
        currentQuestion: z.ZodOptional<z.ZodObject<{
            uid: z.ZodString;
            title: z.ZodOptional<z.ZodString>;
            text: z.ZodString;
            answerOptions: z.ZodArray<z.ZodString, "many">;
            questionType: z.ZodString;
            timeLimit: z.ZodNumber;
            currentQuestionIndex: z.ZodOptional<z.ZodNumber>;
            totalQuestions: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            uid: string;
            text: string;
            answerOptions: string[];
            questionType: string;
            timeLimit: number;
            totalQuestions?: number | undefined;
            title?: string | undefined;
            currentQuestionIndex?: number | undefined;
        }, {
            uid: string;
            text: string;
            answerOptions: string[];
            questionType: string;
            timeLimit: number;
            totalQuestions?: number | undefined;
            title?: string | undefined;
            currentQuestionIndex?: number | undefined;
        }>>;
        questionIndex: z.ZodOptional<z.ZodNumber>;
        totalQuestions: z.ZodOptional<z.ZodNumber>;
        timer: z.ZodOptional<z.ZodNumber>;
        participants: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            userId: z.ZodString;
            username: z.ZodString;
            avatarEmoji: z.ZodOptional<z.ZodString>;
            score: z.ZodNumber;
            status: z.ZodOptional<z.ZodEnum<["PENDING", "ACTIVE", "COMPLETED", "LEFT"]>>;
            online: z.ZodOptional<z.ZodBoolean>;
            joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            socketId: z.ZodOptional<z.ZodString>;
            attemptCount: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }, {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }>, "many">>;
        gameMode: z.ZodOptional<z.ZodEnum<["tournament", "quiz", "practice", "class"]>>;
    }, z.ZodAny, "strip">, z.objectInputType<{
        status: z.ZodOptional<z.ZodEnum<["waiting", "active", "paused", "finished"]>>;
        currentQuestion: z.ZodOptional<z.ZodObject<{
            uid: z.ZodString;
            title: z.ZodOptional<z.ZodString>;
            text: z.ZodString;
            answerOptions: z.ZodArray<z.ZodString, "many">;
            questionType: z.ZodString;
            timeLimit: z.ZodNumber;
            currentQuestionIndex: z.ZodOptional<z.ZodNumber>;
            totalQuestions: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            uid: string;
            text: string;
            answerOptions: string[];
            questionType: string;
            timeLimit: number;
            totalQuestions?: number | undefined;
            title?: string | undefined;
            currentQuestionIndex?: number | undefined;
        }, {
            uid: string;
            text: string;
            answerOptions: string[];
            questionType: string;
            timeLimit: number;
            totalQuestions?: number | undefined;
            title?: string | undefined;
            currentQuestionIndex?: number | undefined;
        }>>;
        questionIndex: z.ZodOptional<z.ZodNumber>;
        totalQuestions: z.ZodOptional<z.ZodNumber>;
        timer: z.ZodOptional<z.ZodNumber>;
        participants: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            userId: z.ZodString;
            username: z.ZodString;
            avatarEmoji: z.ZodOptional<z.ZodString>;
            score: z.ZodNumber;
            status: z.ZodOptional<z.ZodEnum<["PENDING", "ACTIVE", "COMPLETED", "LEFT"]>>;
            online: z.ZodOptional<z.ZodBoolean>;
            joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            socketId: z.ZodOptional<z.ZodString>;
            attemptCount: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }, {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }>, "many">>;
        gameMode: z.ZodOptional<z.ZodEnum<["tournament", "quiz", "practice", "class"]>>;
    }, z.ZodAny, "strip">>], z.ZodUnknown>, z.ZodVoid>;
    timer_update: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        timeLeftMs: z.ZodNullable<z.ZodNumber>;
        running: z.ZodBoolean;
        durationMs: z.ZodOptional<z.ZodNumber>;
        serverTime: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        timeLeftMs: number | null;
        running: boolean;
        serverTime: number;
        durationMs?: number | undefined;
    }, {
        timeLeftMs: number | null;
        running: boolean;
        serverTime: number;
        durationMs?: number | undefined;
    }>], z.ZodUnknown>, z.ZodVoid>;
    answers_locked: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        locked: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        locked: boolean;
    }, {
        locked: boolean;
    }>], z.ZodUnknown>, z.ZodVoid>;
    game_ended: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        accessCode: string;
    }, {
        accessCode: string;
    }>], z.ZodUnknown>, z.ZodVoid>;
    game_error: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        message: z.ZodString;
        code: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code?: string | number | undefined;
        details?: Record<string, any> | undefined;
    }, {
        message: string;
        code?: string | number | undefined;
        details?: Record<string, any> | undefined;
    }>], z.ZodUnknown>, z.ZodVoid>;
    game_already_played: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        accessCode: string;
    }, {
        accessCode: string;
    }>], z.ZodUnknown>, z.ZodVoid>;
    notification: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        message: z.ZodString;
        defaultMode: z.ZodEnum<["info", "warning", "error", "success"]>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        defaultMode: "info" | "warning" | "error" | "success";
    }, {
        message: string;
        defaultMode: "info" | "warning" | "error" | "success";
    }>], z.ZodUnknown>, z.ZodVoid>;
    game_control_question_set: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        questionIndex: z.ZodNumber;
        timer: z.ZodObject<{
            startedAt: z.ZodNumber;
            duration: z.ZodNumber;
            isPaused: z.ZodBoolean;
            pausedAt: z.ZodOptional<z.ZodNumber>;
            timeRemaining: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            startedAt: number;
            duration: number;
            isPaused: boolean;
            pausedAt?: number | undefined;
            timeRemaining?: number | undefined;
        }, {
            startedAt: number;
            duration: number;
            isPaused: boolean;
            pausedAt?: number | undefined;
            timeRemaining?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        timer: {
            startedAt: number;
            duration: number;
            isPaused: boolean;
            pausedAt?: number | undefined;
            timeRemaining?: number | undefined;
        };
        questionIndex: number;
    }, {
        timer: {
            startedAt: number;
            duration: number;
            isPaused: boolean;
            pausedAt?: number | undefined;
            timeRemaining?: number | undefined;
        };
        questionIndex: number;
    }>], z.ZodUnknown>, z.ZodVoid>;
    game_control_question_ended: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        questionUid: z.ZodString;
        timer: z.ZodObject<{
            startedAt: z.ZodNumber;
            duration: z.ZodNumber;
            isPaused: z.ZodBoolean;
            pausedAt: z.ZodOptional<z.ZodNumber>;
            timeRemaining: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            startedAt: number;
            duration: number;
            isPaused: boolean;
            pausedAt?: number | undefined;
            timeRemaining?: number | undefined;
        }, {
            startedAt: number;
            duration: number;
            isPaused: boolean;
            pausedAt?: number | undefined;
            timeRemaining?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        questionUid: string;
        timer: {
            startedAt: number;
            duration: number;
            isPaused: boolean;
            pausedAt?: number | undefined;
            timeRemaining?: number | undefined;
        };
    }, {
        questionUid: string;
        timer: {
            startedAt: number;
            duration: number;
            isPaused: boolean;
            pausedAt?: number | undefined;
            timeRemaining?: number | undefined;
        };
    }>], z.ZodUnknown>, z.ZodVoid>;
    question_ended: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        questionUid: z.ZodString;
        showLeaderboard: z.ZodOptional<z.ZodBoolean>;
        leaderboard: z.ZodOptional<z.ZodArray<z.ZodObject<{
            userId: z.ZodString;
            username: z.ZodString;
            avatarEmoji: z.ZodOptional<z.ZodString>;
            score: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            userId: string;
            username: string;
            score: number;
            avatarEmoji?: string | undefined;
        }, {
            userId: string;
            username: string;
            score: number;
            avatarEmoji?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        questionUid: string;
        leaderboard?: {
            userId: string;
            username: string;
            score: number;
            avatarEmoji?: string | undefined;
        }[] | undefined;
        showLeaderboard?: boolean | undefined;
    }, {
        questionUid: string;
        leaderboard?: {
            userId: string;
            username: string;
            score: number;
            avatarEmoji?: string | undefined;
        }[] | undefined;
        showLeaderboard?: boolean | undefined;
    }>], z.ZodUnknown>, z.ZodVoid>;
    set_question: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
        questionUid: z.ZodString;
        questionIndex: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        questionUid: string;
        accessCode: string;
        questionIndex?: number | undefined;
    }, {
        questionUid: string;
        accessCode: string;
        questionIndex?: number | undefined;
    }>], z.ZodUnknown>, z.ZodVoid>;
    join_dashboard: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        accessCode: string;
    }, {
        accessCode: string;
    }>], z.ZodUnknown>, z.ZodVoid>;
    timer_action: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
        action: z.ZodEnum<["run", "pause", "stop", "edit"]>;
        /**
         * Absolute timestamp (ms since epoch, UTC) when the timer is scheduled to end.
         * This is the canonical end date for the timer, used for backend/logic and precise signaling.
         * May be updated if the timer is changed during a quiz.
         */
        timerEndDateMs: z.ZodOptional<z.ZodNumber>;
        /**
         * Target time in milliseconds (duration or remaining time, NOT a date).
         * Used for UI, duration, or other timer logic. Distinct from timerEndDateMs.
         */
        targetTimeMs: z.ZodOptional<z.ZodNumber>;
        questionUid: z.ZodString;
        /**
         * For 'edit' action: the new duration in milliseconds (REQUIRED for 'edit')
         */
        durationMs: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        questionUid: string;
        accessCode: string;
        action: "run" | "pause" | "stop" | "edit";
        durationMs?: number | undefined;
        timerEndDateMs?: number | undefined;
        targetTimeMs?: number | undefined;
    }, {
        questionUid: string;
        accessCode: string;
        action: "run" | "pause" | "stop" | "edit";
        durationMs?: number | undefined;
        timerEndDateMs?: number | undefined;
        targetTimeMs?: number | undefined;
    }>], z.ZodUnknown>, z.ZodVoid>;
    lock_answers: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
        lock: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        accessCode: string;
        lock: boolean;
    }, {
        accessCode: string;
        lock: boolean;
    }>], z.ZodUnknown>, z.ZodVoid>;
    end_game: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        accessCode: string;
    }, {
        accessCode: string;
    }>], z.ZodUnknown>, z.ZodVoid>;
    correct_answers: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        questionUid: z.ZodString;
        correctAnswers: z.ZodOptional<z.ZodArray<z.ZodBoolean, "many">>;
        /**
         * Map of questionUid to boolean indicating if correct answers have been shown (terminated)
         */
        terminatedQuestions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        questionUid: string;
        correctAnswers?: boolean[] | undefined;
        terminatedQuestions?: Record<string, boolean> | undefined;
    }, {
        questionUid: string;
        correctAnswers?: boolean[] | undefined;
        terminatedQuestions?: Record<string, boolean> | undefined;
    }>], z.ZodUnknown>, z.ZodVoid>;
    feedback: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        questionUid: z.ZodString;
        feedbackRemaining: z.ZodNumber;
    }, "strip", z.ZodAny, z.objectOutputType<{
        questionUid: z.ZodString;
        feedbackRemaining: z.ZodNumber;
    }, z.ZodAny, "strip">, z.objectInputType<{
        questionUid: z.ZodString;
        feedbackRemaining: z.ZodNumber;
    }, z.ZodAny, "strip">>], z.ZodUnknown>, z.ZodVoid>;
}, "strip", z.ZodTypeAny, {
    connect: (...args: unknown[]) => void;
    disconnect: (args_0: string, ...args: unknown[]) => void;
    connection_established: (args_0: {
        socketId: string;
        timestamp: string;
        user: {
            accessCode?: string | undefined;
            userId?: string | undefined;
            username?: string | undefined;
            role?: "STUDENT" | "TEACHER" | "GUEST" | undefined;
            currentGameRoom?: string | undefined;
        };
    }, ...args: unknown[]) => void;
    game_joined: (args_0: {
        accessCode: string;
        participant: {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        };
        gameStatus: "pending" | "active" | "completed" | "archived";
        gameMode: "tournament" | "quiz" | "practice" | "class";
        differedAvailableFrom?: string | undefined;
        differedAvailableTo?: string | undefined;
    }, ...args: unknown[]) => void;
    game_question: (args_0: {
        uid: string;
        text: string;
        answerOptions: string[];
        questionType: string;
        timeLimit: number;
        totalQuestions?: number | undefined;
        title?: string | undefined;
        currentQuestionIndex?: number | undefined;
    }, ...args: unknown[]) => void;
    answer_received: (args_0: {
        questionUid: string;
        timeSpent: number;
        correctAnswers?: boolean[] | undefined;
        explanation?: string | undefined;
        correct?: boolean | undefined;
    }, ...args: unknown[]) => void;
    leaderboard_update: (args_0: {
        leaderboard: {
            userId: string;
            username: string;
            score: number;
            avatarEmoji?: string | undefined;
            rank?: number | undefined;
        }[];
    }, ...args: unknown[]) => void;
    player_joined_game: (args_0: {
        participant: {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        };
    }, ...args: unknown[]) => void;
    player_left_game: (args_0: {
        userId: string;
        socketId: string;
    }, ...args: unknown[]) => void;
    game_participants: (args_0: {
        participants: {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }[];
    }, ...args: unknown[]) => void;
    game_state_update: (args_0: z.objectInputType<{
        status: z.ZodOptional<z.ZodEnum<["waiting", "active", "paused", "finished"]>>;
        currentQuestion: z.ZodOptional<z.ZodObject<{
            uid: z.ZodString;
            title: z.ZodOptional<z.ZodString>;
            text: z.ZodString;
            answerOptions: z.ZodArray<z.ZodString, "many">;
            questionType: z.ZodString;
            timeLimit: z.ZodNumber;
            currentQuestionIndex: z.ZodOptional<z.ZodNumber>;
            totalQuestions: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            uid: string;
            text: string;
            answerOptions: string[];
            questionType: string;
            timeLimit: number;
            totalQuestions?: number | undefined;
            title?: string | undefined;
            currentQuestionIndex?: number | undefined;
        }, {
            uid: string;
            text: string;
            answerOptions: string[];
            questionType: string;
            timeLimit: number;
            totalQuestions?: number | undefined;
            title?: string | undefined;
            currentQuestionIndex?: number | undefined;
        }>>;
        questionIndex: z.ZodOptional<z.ZodNumber>;
        totalQuestions: z.ZodOptional<z.ZodNumber>;
        timer: z.ZodOptional<z.ZodNumber>;
        participants: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            userId: z.ZodString;
            username: z.ZodString;
            avatarEmoji: z.ZodOptional<z.ZodString>;
            score: z.ZodNumber;
            status: z.ZodOptional<z.ZodEnum<["PENDING", "ACTIVE", "COMPLETED", "LEFT"]>>;
            online: z.ZodOptional<z.ZodBoolean>;
            joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            socketId: z.ZodOptional<z.ZodString>;
            attemptCount: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }, {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }>, "many">>;
        gameMode: z.ZodOptional<z.ZodEnum<["tournament", "quiz", "practice", "class"]>>;
    }, z.ZodAny, "strip">, ...args: unknown[]) => void;
    timer_update: (args_0: {
        timeLeftMs: number | null;
        running: boolean;
        serverTime: number;
        durationMs?: number | undefined;
    }, ...args: unknown[]) => void;
    answers_locked: (args_0: {
        locked: boolean;
    }, ...args: unknown[]) => void;
    game_ended: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    game_error: (args_0: {
        message: string;
        code?: string | number | undefined;
        details?: Record<string, any> | undefined;
    }, ...args: unknown[]) => void;
    game_already_played: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    notification: (args_0: {
        message: string;
        defaultMode: "info" | "warning" | "error" | "success";
    }, ...args: unknown[]) => void;
    game_control_question_set: (args_0: {
        timer: {
            startedAt: number;
            duration: number;
            isPaused: boolean;
            pausedAt?: number | undefined;
            timeRemaining?: number | undefined;
        };
        questionIndex: number;
    }, ...args: unknown[]) => void;
    game_control_question_ended: (args_0: {
        questionUid: string;
        timer: {
            startedAt: number;
            duration: number;
            isPaused: boolean;
            pausedAt?: number | undefined;
            timeRemaining?: number | undefined;
        };
    }, ...args: unknown[]) => void;
    question_ended: (args_0: {
        questionUid: string;
        leaderboard?: {
            userId: string;
            username: string;
            score: number;
            avatarEmoji?: string | undefined;
        }[] | undefined;
        showLeaderboard?: boolean | undefined;
    }, ...args: unknown[]) => void;
    set_question: (args_0: {
        questionUid: string;
        accessCode: string;
        questionIndex?: number | undefined;
    }, ...args: unknown[]) => void;
    join_dashboard: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    timer_action: (args_0: {
        questionUid: string;
        accessCode: string;
        action: "run" | "pause" | "stop" | "edit";
        durationMs?: number | undefined;
        timerEndDateMs?: number | undefined;
        targetTimeMs?: number | undefined;
    }, ...args: unknown[]) => void;
    lock_answers: (args_0: {
        accessCode: string;
        lock: boolean;
    }, ...args: unknown[]) => void;
    end_game: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    correct_answers: (args_0: {
        questionUid: string;
        correctAnswers?: boolean[] | undefined;
        terminatedQuestions?: Record<string, boolean> | undefined;
    }, ...args: unknown[]) => void;
    feedback: (args_0: z.objectInputType<{
        questionUid: z.ZodString;
        feedbackRemaining: z.ZodNumber;
    }, z.ZodAny, "strip">, ...args: unknown[]) => void;
}, {
    connect: (...args: unknown[]) => void;
    disconnect: (args_0: string, ...args: unknown[]) => void;
    connection_established: (args_0: {
        socketId: string;
        timestamp: string;
        user: {
            accessCode?: string | undefined;
            userId?: string | undefined;
            username?: string | undefined;
            role?: "STUDENT" | "TEACHER" | "GUEST" | undefined;
            currentGameRoom?: string | undefined;
        };
    }, ...args: unknown[]) => void;
    game_joined: (args_0: {
        accessCode: string;
        participant: {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        };
        gameStatus: "pending" | "active" | "completed" | "archived";
        gameMode: "tournament" | "quiz" | "practice" | "class";
        differedAvailableFrom?: string | undefined;
        differedAvailableTo?: string | undefined;
    }, ...args: unknown[]) => void;
    game_question: (args_0: {
        uid: string;
        text: string;
        answerOptions: string[];
        questionType: string;
        timeLimit: number;
        totalQuestions?: number | undefined;
        title?: string | undefined;
        currentQuestionIndex?: number | undefined;
    }, ...args: unknown[]) => void;
    answer_received: (args_0: {
        questionUid: string;
        timeSpent: number;
        correctAnswers?: boolean[] | undefined;
        explanation?: string | undefined;
        correct?: boolean | undefined;
    }, ...args: unknown[]) => void;
    leaderboard_update: (args_0: {
        leaderboard: {
            userId: string;
            username: string;
            score: number;
            avatarEmoji?: string | undefined;
            rank?: number | undefined;
        }[];
    }, ...args: unknown[]) => void;
    player_joined_game: (args_0: {
        participant: {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        };
    }, ...args: unknown[]) => void;
    player_left_game: (args_0: {
        userId: string;
        socketId: string;
    }, ...args: unknown[]) => void;
    game_participants: (args_0: {
        participants: {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }[];
    }, ...args: unknown[]) => void;
    game_state_update: (args_0: z.objectOutputType<{
        status: z.ZodOptional<z.ZodEnum<["waiting", "active", "paused", "finished"]>>;
        currentQuestion: z.ZodOptional<z.ZodObject<{
            uid: z.ZodString;
            title: z.ZodOptional<z.ZodString>;
            text: z.ZodString;
            answerOptions: z.ZodArray<z.ZodString, "many">;
            questionType: z.ZodString;
            timeLimit: z.ZodNumber;
            currentQuestionIndex: z.ZodOptional<z.ZodNumber>;
            totalQuestions: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            uid: string;
            text: string;
            answerOptions: string[];
            questionType: string;
            timeLimit: number;
            totalQuestions?: number | undefined;
            title?: string | undefined;
            currentQuestionIndex?: number | undefined;
        }, {
            uid: string;
            text: string;
            answerOptions: string[];
            questionType: string;
            timeLimit: number;
            totalQuestions?: number | undefined;
            title?: string | undefined;
            currentQuestionIndex?: number | undefined;
        }>>;
        questionIndex: z.ZodOptional<z.ZodNumber>;
        totalQuestions: z.ZodOptional<z.ZodNumber>;
        timer: z.ZodOptional<z.ZodNumber>;
        participants: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            userId: z.ZodString;
            username: z.ZodString;
            avatarEmoji: z.ZodOptional<z.ZodString>;
            score: z.ZodNumber;
            status: z.ZodOptional<z.ZodEnum<["PENDING", "ACTIVE", "COMPLETED", "LEFT"]>>;
            online: z.ZodOptional<z.ZodBoolean>;
            joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            socketId: z.ZodOptional<z.ZodString>;
            attemptCount: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }, {
            userId: string;
            username: string;
            id: string;
            score: number;
            status?: "PENDING" | "ACTIVE" | "COMPLETED" | "LEFT" | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
            joinedAt?: string | number | undefined;
            socketId?: string | undefined;
            attemptCount?: number | undefined;
        }>, "many">>;
        gameMode: z.ZodOptional<z.ZodEnum<["tournament", "quiz", "practice", "class"]>>;
    }, z.ZodAny, "strip">, ...args: unknown[]) => void;
    timer_update: (args_0: {
        timeLeftMs: number | null;
        running: boolean;
        serverTime: number;
        durationMs?: number | undefined;
    }, ...args: unknown[]) => void;
    answers_locked: (args_0: {
        locked: boolean;
    }, ...args: unknown[]) => void;
    game_ended: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    game_error: (args_0: {
        message: string;
        code?: string | number | undefined;
        details?: Record<string, any> | undefined;
    }, ...args: unknown[]) => void;
    game_already_played: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    notification: (args_0: {
        message: string;
        defaultMode: "info" | "warning" | "error" | "success";
    }, ...args: unknown[]) => void;
    game_control_question_set: (args_0: {
        timer: {
            startedAt: number;
            duration: number;
            isPaused: boolean;
            pausedAt?: number | undefined;
            timeRemaining?: number | undefined;
        };
        questionIndex: number;
    }, ...args: unknown[]) => void;
    game_control_question_ended: (args_0: {
        questionUid: string;
        timer: {
            startedAt: number;
            duration: number;
            isPaused: boolean;
            pausedAt?: number | undefined;
            timeRemaining?: number | undefined;
        };
    }, ...args: unknown[]) => void;
    question_ended: (args_0: {
        questionUid: string;
        leaderboard?: {
            userId: string;
            username: string;
            score: number;
            avatarEmoji?: string | undefined;
        }[] | undefined;
        showLeaderboard?: boolean | undefined;
    }, ...args: unknown[]) => void;
    set_question: (args_0: {
        questionUid: string;
        accessCode: string;
        questionIndex?: number | undefined;
    }, ...args: unknown[]) => void;
    join_dashboard: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    timer_action: (args_0: {
        questionUid: string;
        accessCode: string;
        action: "run" | "pause" | "stop" | "edit";
        durationMs?: number | undefined;
        timerEndDateMs?: number | undefined;
        targetTimeMs?: number | undefined;
    }, ...args: unknown[]) => void;
    lock_answers: (args_0: {
        accessCode: string;
        lock: boolean;
    }, ...args: unknown[]) => void;
    end_game: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    correct_answers: (args_0: {
        questionUid: string;
        correctAnswers?: boolean[] | undefined;
        terminatedQuestions?: Record<string, boolean> | undefined;
    }, ...args: unknown[]) => void;
    feedback: (args_0: z.objectOutputType<{
        questionUid: z.ZodString;
        feedbackRemaining: z.ZodNumber;
    }, z.ZodAny, "strip">, ...args: unknown[]) => void;
}>;
export declare const startTimerPayloadSchema: z.ZodEffects<z.ZodObject<{
    gameId: z.ZodOptional<z.ZodString>;
    accessCode: z.ZodOptional<z.ZodString>;
    durationMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    durationMs: number;
    accessCode?: string | undefined;
    gameId?: string | undefined;
}, {
    durationMs: number;
    accessCode?: string | undefined;
    gameId?: string | undefined;
}>, {
    durationMs: number;
    accessCode?: string | undefined;
    gameId?: string | undefined;
}, {
    durationMs: number;
    accessCode?: string | undefined;
    gameId?: string | undefined;
}>;
export declare const pauseTimerPayloadSchema: z.ZodEffects<z.ZodObject<{
    gameId: z.ZodOptional<z.ZodString>;
    accessCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessCode?: string | undefined;
    gameId?: string | undefined;
}, {
    accessCode?: string | undefined;
    gameId?: string | undefined;
}>, {
    accessCode?: string | undefined;
    gameId?: string | undefined;
}, {
    accessCode?: string | undefined;
    gameId?: string | undefined;
}>;
export declare const startTournamentPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
}, {
    accessCode: string;
}>;
export declare const joinProjectorPayloadSchema: z.ZodObject<{
    gameId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    gameId: string;
}, {
    gameId: string;
}>;
export declare const leaveProjectorPayloadSchema: z.ZodObject<{
    gameId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    gameId: string;
}, {
    gameId: string;
}>;
/**
 * @deprecated Use joinGamePayloadSchema instead
 */
export declare const joinLobbyPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    userId: z.ZodString;
    username: z.ZodString;
    avatarEmoji: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    userId: string;
    username: string;
    avatarEmoji?: string | undefined;
}, {
    accessCode: string;
    userId: string;
    username: string;
    avatarEmoji?: string | undefined;
}>;
/**
 * @deprecated Use leaveGamePayloadSchema instead
 */
export declare const leaveLobbyPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    userId?: string | undefined;
}, {
    accessCode: string;
    userId?: string | undefined;
}>;
/**
 * @deprecated Use joinGamePayloadSchema instead
 */
export declare const getParticipantsPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
}, {
    accessCode: string;
}>;
export declare const startGamePayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    userId: string;
}, {
    accessCode: string;
    userId: string;
}>;
export declare const requestParticipantsPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
}, {
    accessCode: string;
}>;
export declare const sharedJoinPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    userId: z.ZodString;
    username: z.ZodString;
    avatarEmoji: z.ZodOptional<z.ZodString>;
    playMode: z.ZodOptional<z.ZodEnum<["quiz", "tournament", "practice"]>>;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    userId: string;
    username: string;
    avatarEmoji?: string | undefined;
    playMode?: "tournament" | "quiz" | "practice" | undefined;
}, {
    accessCode: string;
    userId: string;
    username: string;
    avatarEmoji?: string | undefined;
    playMode?: "tournament" | "quiz" | "practice" | undefined;
}>;
export declare const sharedAnswerPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    userId: z.ZodString;
    questionUid: z.ZodString;
    answer: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodArray<z.ZodString, "many">, z.ZodArray<z.ZodNumber, "many">]>;
    timeSpent: z.ZodNumber;
    playMode: z.ZodOptional<z.ZodEnum<["quiz", "tournament", "practice"]>>;
}, "strip", z.ZodTypeAny, {
    questionUid: string;
    accessCode: string;
    userId: string;
    answer: string | number | string[] | number[];
    timeSpent: number;
    playMode?: "tournament" | "quiz" | "practice" | undefined;
}, {
    questionUid: string;
    accessCode: string;
    userId: string;
    answer: string | number | string[] | number[];
    timeSpent: number;
    playMode?: "tournament" | "quiz" | "practice" | undefined;
}>;
export declare const connectedCountPayloadSchema: z.ZodObject<{
    count: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    count: number;
}, {
    count: number;
}>;
export declare const joinRoomPayloadSchema: z.ZodObject<{
    roomName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    roomName: string;
}, {
    roomName: string;
}>;
export declare const testConnectionPayloadSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const gameEndedPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    endedAt: z.ZodOptional<z.ZodString>;
    score: z.ZodOptional<z.ZodNumber>;
    totalQuestions: z.ZodOptional<z.ZodNumber>;
    correct: z.ZodOptional<z.ZodNumber>;
    total: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    totalQuestions?: number | undefined;
    score?: number | undefined;
    correct?: number | undefined;
    endedAt?: string | undefined;
    total?: number | undefined;
}, {
    accessCode: string;
    totalQuestions?: number | undefined;
    score?: number | undefined;
    correct?: number | undefined;
    endedAt?: string | undefined;
    total?: number | undefined;
}>;
export declare const connectionEstablishedPayloadSchema: z.ZodObject<{
    socketId: z.ZodString;
    timestamp: z.ZodString;
    user: z.ZodObject<{
        userId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        username: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        role: z.ZodOptional<z.ZodOptional<z.ZodEnum<["STUDENT", "TEACHER", "GUEST"]>>>;
        accessCode: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        currentGameRoom: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        practiceSessionId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        practiceUserId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        accessCode?: string | undefined;
        userId?: string | undefined;
        username?: string | undefined;
        role?: "STUDENT" | "TEACHER" | "GUEST" | undefined;
        currentGameRoom?: string | undefined;
        practiceSessionId?: string | undefined;
        practiceUserId?: string | undefined;
    }, {
        accessCode?: string | undefined;
        userId?: string | undefined;
        username?: string | undefined;
        role?: "STUDENT" | "TEACHER" | "GUEST" | undefined;
        currentGameRoom?: string | undefined;
        practiceSessionId?: string | undefined;
        practiceUserId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    socketId: string;
    timestamp: string;
    user: {
        accessCode?: string | undefined;
        userId?: string | undefined;
        username?: string | undefined;
        role?: "STUDENT" | "TEACHER" | "GUEST" | undefined;
        currentGameRoom?: string | undefined;
        practiceSessionId?: string | undefined;
        practiceUserId?: string | undefined;
    };
}, {
    socketId: string;
    timestamp: string;
    user: {
        accessCode?: string | undefined;
        userId?: string | undefined;
        username?: string | undefined;
        role?: "STUDENT" | "TEACHER" | "GUEST" | undefined;
        currentGameRoom?: string | undefined;
        practiceSessionId?: string | undefined;
        practiceUserId?: string | undefined;
    };
}>;
export declare const revealLeaderboardPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
}, {
    accessCode: string;
}>;
