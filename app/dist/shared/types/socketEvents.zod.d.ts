import { z } from 'zod';
export declare const setQuestionPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    questionUid: z.ZodString;
    questionIndex: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    questionUid: string;
    questionIndex?: number | undefined;
}, {
    accessCode: string;
    questionUid: string;
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
    action: z.ZodEnum<["start", "pause", "resume", "stop", "set_duration"]>;
    duration: z.ZodOptional<z.ZodNumber>;
    questionUid: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    action: "pause" | "stop" | "start" | "resume" | "set_duration";
    questionUid?: string | undefined;
    duration?: number | undefined;
}, {
    accessCode: string;
    action: "pause" | "stop" | "start" | "resume" | "set_duration";
    questionUid?: string | undefined;
    duration?: number | undefined;
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
    isDiffered: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    userId: string;
    username: string;
    isDiffered?: boolean | undefined;
    avatarEmoji?: string | undefined;
}, {
    accessCode: string;
    userId: string;
    username: string;
    isDiffered?: boolean | undefined;
    avatarEmoji?: string | undefined;
}>;
export declare const gameAnswerPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    userId: z.ZodString;
    questionUid: z.ZodString;
    answer: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodArray<z.ZodString, "many">, z.ZodArray<z.ZodNumber, "many">]>;
    timeSpent: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    userId: string;
    questionUid: string;
    answer: string | number | string[] | number[];
    timeSpent: number;
}, {
    accessCode: string;
    userId: string;
    questionUid: string;
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
export declare const participantDataSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    username: z.ZodString;
    avatar: z.ZodString;
    score: z.ZodNumber;
    avatarEmoji: z.ZodOptional<z.ZodString>;
    online: z.ZodOptional<z.ZodBoolean>;
    joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    socketId: z.ZodOptional<z.ZodString>;
    isDeferred: z.ZodOptional<z.ZodBoolean>;
    cookieId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    username: string;
    avatar: string;
    score: number;
    joinedAt?: string | number | undefined;
    isDeferred?: boolean | undefined;
    socketId?: string | undefined;
    cookieId?: string | undefined;
    avatarEmoji?: string | undefined;
    online?: boolean | undefined;
}, {
    id: string;
    userId: string;
    username: string;
    avatar: string;
    score: number;
    joinedAt?: string | number | undefined;
    isDeferred?: boolean | undefined;
    socketId?: string | undefined;
    cookieId?: string | undefined;
    avatarEmoji?: string | undefined;
    online?: boolean | undefined;
}>;
export declare const playerJoinedGamePayloadSchema: z.ZodObject<{
    participant: z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        username: z.ZodString;
        avatar: z.ZodString;
        score: z.ZodNumber;
        avatarEmoji: z.ZodOptional<z.ZodString>;
        online: z.ZodOptional<z.ZodBoolean>;
        joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
        socketId: z.ZodOptional<z.ZodString>;
        isDeferred: z.ZodOptional<z.ZodBoolean>;
        cookieId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        userId: string;
        username: string;
        avatar: string;
        score: number;
        joinedAt?: string | number | undefined;
        isDeferred?: boolean | undefined;
        socketId?: string | undefined;
        cookieId?: string | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
    }, {
        id: string;
        userId: string;
        username: string;
        avatar: string;
        score: number;
        joinedAt?: string | number | undefined;
        isDeferred?: boolean | undefined;
        socketId?: string | undefined;
        cookieId?: string | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    participant: {
        id: string;
        userId: string;
        username: string;
        avatar: string;
        score: number;
        joinedAt?: string | number | undefined;
        isDeferred?: boolean | undefined;
        socketId?: string | undefined;
        cookieId?: string | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
    };
}, {
    participant: {
        id: string;
        userId: string;
        username: string;
        avatar: string;
        score: number;
        joinedAt?: string | number | undefined;
        isDeferred?: boolean | undefined;
        socketId?: string | undefined;
        cookieId?: string | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
    };
}>;
export declare const notificationPayloadSchema: z.ZodObject<{
    message: z.ZodString;
    defaultMode: z.ZodEnum<["info", "warning", "error", "success"]>;
}, "strip", z.ZodTypeAny, {
    message: string;
    defaultMode: "success" | "error" | "info" | "warning";
}, {
    message: string;
    defaultMode: "success" | "error" | "info" | "warning";
}>;
export declare const questionDataSchema: z.ZodObject<{
    uid: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
    answerOptions: z.ZodArray<z.ZodString, "many">;
    correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
    questionType: z.ZodString;
    timeLimit: z.ZodOptional<z.ZodNumber>;
    currentQuestionIndex: z.ZodOptional<z.ZodNumber>;
    totalQuestions: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    uid: string;
    text: string;
    answerOptions: string[];
    correctAnswers: boolean[];
    questionType: string;
    title?: string | undefined;
    timeLimit?: number | undefined;
    currentQuestionIndex?: number | undefined;
    totalQuestions?: number | undefined;
}, {
    uid: string;
    text: string;
    answerOptions: string[];
    correctAnswers: boolean[];
    questionType: string;
    title?: string | undefined;
    timeLimit?: number | undefined;
    currentQuestionIndex?: number | undefined;
    totalQuestions?: number | undefined;
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
        isDiffered: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        accessCode: string;
        userId: string;
        username: string;
        isDiffered?: boolean | undefined;
        avatarEmoji?: string | undefined;
    }, {
        accessCode: string;
        userId: string;
        username: string;
        isDiffered?: boolean | undefined;
        avatarEmoji?: string | undefined;
    }>], z.ZodUnknown>, z.ZodVoid>;
    game_answer: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
        userId: z.ZodString;
        questionUid: z.ZodString;
        answer: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodArray<z.ZodString, "many">, z.ZodArray<z.ZodNumber, "many">]>;
        timeSpent: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        accessCode: string;
        userId: string;
        questionUid: string;
        answer: string | number | string[] | number[];
        timeSpent: number;
    }, {
        accessCode: string;
        userId: string;
        questionUid: string;
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
        accessCode: string;
        questionUid: string;
        questionIndex: number;
    }, {
        accessCode: string;
        questionUid: string;
        questionIndex: number;
    }>], z.ZodUnknown>, z.ZodVoid>;
    teacher_timer_action: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
        action: z.ZodEnum<["start", "pause", "resume", "stop", "set_duration"]>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        accessCode: string;
        action: "pause" | "stop" | "start" | "resume" | "set_duration";
        duration?: number | undefined;
    }, {
        accessCode: string;
        action: "pause" | "stop" | "start" | "resume" | "set_duration";
        duration?: number | undefined;
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
        isDiffered?: boolean | undefined;
        avatarEmoji?: string | undefined;
    }, ...args: unknown[]) => void;
    game_answer: (args_0: {
        accessCode: string;
        userId: string;
        questionUid: string;
        answer: string | number | string[] | number[];
        timeSpent: number;
    }, ...args: unknown[]) => void;
    request_participants: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    teacher_set_question: (args_0: {
        accessCode: string;
        questionUid: string;
        questionIndex: number;
    }, ...args: unknown[]) => void;
    teacher_timer_action: (args_0: {
        accessCode: string;
        action: "pause" | "stop" | "start" | "resume" | "set_duration";
        duration?: number | undefined;
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
        isDiffered?: boolean | undefined;
        avatarEmoji?: string | undefined;
    }, ...args: unknown[]) => void;
    game_answer: (args_0: {
        accessCode: string;
        userId: string;
        questionUid: string;
        answer: string | number | string[] | number[];
        timeSpent: number;
    }, ...args: unknown[]) => void;
    request_participants: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    teacher_set_question: (args_0: {
        accessCode: string;
        questionUid: string;
        questionIndex: number;
    }, ...args: unknown[]) => void;
    teacher_timer_action: (args_0: {
        accessCode: string;
        action: "pause" | "stop" | "start" | "resume" | "set_duration";
        duration?: number | undefined;
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
    role: z.ZodOptional<z.ZodEnum<["player", "teacher", "admin", "projector"]>>;
    accessCode: z.ZodOptional<z.ZodString>;
    currentGameRoom: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessCode?: string | undefined;
    userId?: string | undefined;
    username?: string | undefined;
    role?: "teacher" | "player" | "admin" | "projector" | undefined;
    currentGameRoom?: string | undefined;
}, {
    accessCode?: string | undefined;
    userId?: string | undefined;
    username?: string | undefined;
    role?: "teacher" | "player" | "admin" | "projector" | undefined;
    currentGameRoom?: string | undefined;
}>;
export declare const gameJoinedPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    participant: z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        username: z.ZodString;
        avatar: z.ZodString;
        score: z.ZodNumber;
        avatarEmoji: z.ZodOptional<z.ZodString>;
        online: z.ZodOptional<z.ZodBoolean>;
        joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
        socketId: z.ZodOptional<z.ZodString>;
        isDeferred: z.ZodOptional<z.ZodBoolean>;
        cookieId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        userId: string;
        username: string;
        avatar: string;
        score: number;
        joinedAt?: string | number | undefined;
        isDeferred?: boolean | undefined;
        socketId?: string | undefined;
        cookieId?: string | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
    }, {
        id: string;
        userId: string;
        username: string;
        avatar: string;
        score: number;
        joinedAt?: string | number | undefined;
        isDeferred?: boolean | undefined;
        socketId?: string | undefined;
        cookieId?: string | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
    }>;
    gameStatus: z.ZodEnum<["pending", "active", "completed", "archived"]>;
    isDiffered: z.ZodBoolean;
    differedAvailableFrom: z.ZodOptional<z.ZodString>;
    differedAvailableTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    isDiffered: boolean;
    participant: {
        id: string;
        userId: string;
        username: string;
        avatar: string;
        score: number;
        joinedAt?: string | number | undefined;
        isDeferred?: boolean | undefined;
        socketId?: string | undefined;
        cookieId?: string | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
    };
    gameStatus: "pending" | "active" | "completed" | "archived";
    differedAvailableFrom?: string | undefined;
    differedAvailableTo?: string | undefined;
}, {
    accessCode: string;
    isDiffered: boolean;
    participant: {
        id: string;
        userId: string;
        username: string;
        avatar: string;
        score: number;
        joinedAt?: string | number | undefined;
        isDeferred?: boolean | undefined;
        socketId?: string | undefined;
        cookieId?: string | undefined;
        avatarEmoji?: string | undefined;
        online?: boolean | undefined;
    };
    gameStatus: "pending" | "active" | "completed" | "archived";
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
export declare const serverToClientEventsSchema: z.ZodObject<{
    connect: z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodVoid>;
    disconnect: z.ZodFunction<z.ZodTuple<[z.ZodString], z.ZodUnknown>, z.ZodVoid>;
    connection_established: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        socketId: z.ZodString;
        timestamp: z.ZodString;
        user: z.ZodObject<{
            userId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            username: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            role: z.ZodOptional<z.ZodOptional<z.ZodEnum<["player", "teacher", "admin", "projector"]>>>;
            accessCode: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            currentGameRoom: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            accessCode?: string | undefined;
            userId?: string | undefined;
            username?: string | undefined;
            role?: "teacher" | "player" | "admin" | "projector" | undefined;
            currentGameRoom?: string | undefined;
        }, {
            accessCode?: string | undefined;
            userId?: string | undefined;
            username?: string | undefined;
            role?: "teacher" | "player" | "admin" | "projector" | undefined;
            currentGameRoom?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        user: {
            accessCode?: string | undefined;
            userId?: string | undefined;
            username?: string | undefined;
            role?: "teacher" | "player" | "admin" | "projector" | undefined;
            currentGameRoom?: string | undefined;
        };
        socketId: string;
        timestamp: string;
    }, {
        user: {
            accessCode?: string | undefined;
            userId?: string | undefined;
            username?: string | undefined;
            role?: "teacher" | "player" | "admin" | "projector" | undefined;
            currentGameRoom?: string | undefined;
        };
        socketId: string;
        timestamp: string;
    }>], z.ZodUnknown>, z.ZodVoid>;
    game_joined: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        accessCode: z.ZodString;
        participant: z.ZodObject<{
            id: z.ZodString;
            userId: z.ZodString;
            username: z.ZodString;
            avatar: z.ZodString;
            score: z.ZodNumber;
            avatarEmoji: z.ZodOptional<z.ZodString>;
            online: z.ZodOptional<z.ZodBoolean>;
            joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
            socketId: z.ZodOptional<z.ZodString>;
            isDeferred: z.ZodOptional<z.ZodBoolean>;
            cookieId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
        }, {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
        }>;
        gameStatus: z.ZodEnum<["pending", "active", "completed", "archived"]>;
        isDiffered: z.ZodBoolean;
        differedAvailableFrom: z.ZodOptional<z.ZodString>;
        differedAvailableTo: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        accessCode: string;
        isDiffered: boolean;
        participant: {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
        };
        gameStatus: "pending" | "active" | "completed" | "archived";
        differedAvailableFrom?: string | undefined;
        differedAvailableTo?: string | undefined;
    }, {
        accessCode: string;
        isDiffered: boolean;
        participant: {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
        };
        gameStatus: "pending" | "active" | "completed" | "archived";
        differedAvailableFrom?: string | undefined;
        differedAvailableTo?: string | undefined;
    }>], z.ZodUnknown>, z.ZodVoid>;
    game_question: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        uid: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        text: z.ZodString;
        answerOptions: z.ZodArray<z.ZodString, "many">;
        correctAnswers: z.ZodArray<z.ZodBoolean, "many">;
        questionType: z.ZodString;
        timeLimit: z.ZodOptional<z.ZodNumber>;
        currentQuestionIndex: z.ZodOptional<z.ZodNumber>;
        totalQuestions: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        uid: string;
        text: string;
        answerOptions: string[];
        correctAnswers: boolean[];
        questionType: string;
        title?: string | undefined;
        timeLimit?: number | undefined;
        currentQuestionIndex?: number | undefined;
        totalQuestions?: number | undefined;
    }, {
        uid: string;
        text: string;
        answerOptions: string[];
        correctAnswers: boolean[];
        questionType: string;
        title?: string | undefined;
        timeLimit?: number | undefined;
        currentQuestionIndex?: number | undefined;
        totalQuestions?: number | undefined;
    }>], z.ZodUnknown>, z.ZodVoid>;
    answer_received: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        questionUid: z.ZodString;
        timeSpent: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        questionUid: string;
        timeSpent: number;
    }, {
        questionUid: string;
        timeSpent: number;
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
            avatar: z.ZodString;
            score: z.ZodNumber;
            avatarEmoji: z.ZodOptional<z.ZodString>;
            online: z.ZodOptional<z.ZodBoolean>;
            joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
            socketId: z.ZodOptional<z.ZodString>;
            isDeferred: z.ZodOptional<z.ZodBoolean>;
            cookieId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
        }, {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        participant: {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
        };
    }, {
        participant: {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
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
            avatar: z.ZodString;
            score: z.ZodNumber;
            avatarEmoji: z.ZodOptional<z.ZodString>;
            online: z.ZodOptional<z.ZodBoolean>;
            joinedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
            socketId: z.ZodOptional<z.ZodString>;
            isDeferred: z.ZodOptional<z.ZodBoolean>;
            cookieId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
        }, {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        participants: {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
        }[];
    }, {
        participants: {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
        }[];
    }>], z.ZodUnknown>, z.ZodVoid>;
    game_state_update: z.ZodFunction<z.ZodTuple<[z.ZodAny], z.ZodUnknown>, z.ZodVoid>;
    timer_update: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
        timeLeftMs: z.ZodNullable<z.ZodNumber>;
        running: z.ZodBoolean;
        durationMs: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        running: boolean;
        timeLeftMs: number | null;
        durationMs?: number | undefined;
    }, {
        running: boolean;
        timeLeftMs: number | null;
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
        defaultMode: "success" | "error" | "info" | "warning";
    }, {
        message: string;
        defaultMode: "success" | "error" | "info" | "warning";
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
        questionIndex: number;
        timer: {
            startedAt: number;
            duration: number;
            isPaused: boolean;
            pausedAt?: number | undefined;
            timeRemaining?: number | undefined;
        };
    }, {
        questionIndex: number;
        timer: {
            startedAt: number;
            duration: number;
            isPaused: boolean;
            pausedAt?: number | undefined;
            timeRemaining?: number | undefined;
        };
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
        accessCode: string;
        questionUid: string;
        questionIndex?: number | undefined;
    }, {
        accessCode: string;
        questionUid: string;
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
        action: z.ZodEnum<["start", "pause", "resume", "stop", "set_duration"]>;
        duration: z.ZodOptional<z.ZodNumber>;
        questionUid: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        accessCode: string;
        action: "pause" | "stop" | "start" | "resume" | "set_duration";
        questionUid?: string | undefined;
        duration?: number | undefined;
    }, {
        accessCode: string;
        action: "pause" | "stop" | "start" | "resume" | "set_duration";
        questionUid?: string | undefined;
        duration?: number | undefined;
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
}, "strip", z.ZodTypeAny, {
    join_dashboard: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    set_question: (args_0: {
        accessCode: string;
        questionUid: string;
        questionIndex?: number | undefined;
    }, ...args: unknown[]) => void;
    lock_answers: (args_0: {
        accessCode: string;
        lock: boolean;
    }, ...args: unknown[]) => void;
    end_game: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    game_joined: (args_0: {
        accessCode: string;
        isDiffered: boolean;
        participant: {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
        };
        gameStatus: "pending" | "active" | "completed" | "archived";
        differedAvailableFrom?: string | undefined;
        differedAvailableTo?: string | undefined;
    }, ...args: unknown[]) => void;
    player_joined_game: (args_0: {
        participant: {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
        };
    }, ...args: unknown[]) => void;
    game_participants: (args_0: {
        participants: {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
        }[];
    }, ...args: unknown[]) => void;
    game_question: (args_0: {
        uid: string;
        text: string;
        answerOptions: string[];
        correctAnswers: boolean[];
        questionType: string;
        title?: string | undefined;
        timeLimit?: number | undefined;
        currentQuestionIndex?: number | undefined;
        totalQuestions?: number | undefined;
    }, ...args: unknown[]) => void;
    answer_received: (args_0: {
        questionUid: string;
        timeSpent: number;
    }, ...args: unknown[]) => void;
    game_ended: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    game_error: (args_0: {
        message: string;
        code?: string | number | undefined;
        details?: Record<string, any> | undefined;
    }, ...args: unknown[]) => void;
    timer_update: (args_0: {
        running: boolean;
        timeLeftMs: number | null;
        durationMs?: number | undefined;
    }, ...args: unknown[]) => void;
    game_already_played: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    connect: (...args: unknown[]) => void;
    disconnect: (args_0: string, ...args: unknown[]) => void;
    connection_established: (args_0: {
        user: {
            accessCode?: string | undefined;
            userId?: string | undefined;
            username?: string | undefined;
            role?: "teacher" | "player" | "admin" | "projector" | undefined;
            currentGameRoom?: string | undefined;
        };
        socketId: string;
        timestamp: string;
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
    player_left_game: (args_0: {
        userId: string;
        socketId: string;
    }, ...args: unknown[]) => void;
    game_state_update: (args_0: any, ...args: unknown[]) => void;
    answers_locked: (args_0: {
        locked: boolean;
    }, ...args: unknown[]) => void;
    notification: (args_0: {
        message: string;
        defaultMode: "success" | "error" | "info" | "warning";
    }, ...args: unknown[]) => void;
    game_control_question_set: (args_0: {
        questionIndex: number;
        timer: {
            startedAt: number;
            duration: number;
            isPaused: boolean;
            pausedAt?: number | undefined;
            timeRemaining?: number | undefined;
        };
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
    timer_action: (args_0: {
        accessCode: string;
        action: "pause" | "stop" | "start" | "resume" | "set_duration";
        questionUid?: string | undefined;
        duration?: number | undefined;
    }, ...args: unknown[]) => void;
}, {
    join_dashboard: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    set_question: (args_0: {
        accessCode: string;
        questionUid: string;
        questionIndex?: number | undefined;
    }, ...args: unknown[]) => void;
    lock_answers: (args_0: {
        accessCode: string;
        lock: boolean;
    }, ...args: unknown[]) => void;
    end_game: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    game_joined: (args_0: {
        accessCode: string;
        isDiffered: boolean;
        participant: {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
        };
        gameStatus: "pending" | "active" | "completed" | "archived";
        differedAvailableFrom?: string | undefined;
        differedAvailableTo?: string | undefined;
    }, ...args: unknown[]) => void;
    player_joined_game: (args_0: {
        participant: {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
        };
    }, ...args: unknown[]) => void;
    game_participants: (args_0: {
        participants: {
            id: string;
            userId: string;
            username: string;
            avatar: string;
            score: number;
            joinedAt?: string | number | undefined;
            isDeferred?: boolean | undefined;
            socketId?: string | undefined;
            cookieId?: string | undefined;
            avatarEmoji?: string | undefined;
            online?: boolean | undefined;
        }[];
    }, ...args: unknown[]) => void;
    game_question: (args_0: {
        uid: string;
        text: string;
        answerOptions: string[];
        correctAnswers: boolean[];
        questionType: string;
        title?: string | undefined;
        timeLimit?: number | undefined;
        currentQuestionIndex?: number | undefined;
        totalQuestions?: number | undefined;
    }, ...args: unknown[]) => void;
    answer_received: (args_0: {
        questionUid: string;
        timeSpent: number;
    }, ...args: unknown[]) => void;
    game_ended: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    game_error: (args_0: {
        message: string;
        code?: string | number | undefined;
        details?: Record<string, any> | undefined;
    }, ...args: unknown[]) => void;
    timer_update: (args_0: {
        running: boolean;
        timeLeftMs: number | null;
        durationMs?: number | undefined;
    }, ...args: unknown[]) => void;
    game_already_played: (args_0: {
        accessCode: string;
    }, ...args: unknown[]) => void;
    connect: (...args: unknown[]) => void;
    disconnect: (args_0: string, ...args: unknown[]) => void;
    connection_established: (args_0: {
        user: {
            accessCode?: string | undefined;
            userId?: string | undefined;
            username?: string | undefined;
            role?: "teacher" | "player" | "admin" | "projector" | undefined;
            currentGameRoom?: string | undefined;
        };
        socketId: string;
        timestamp: string;
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
    player_left_game: (args_0: {
        userId: string;
        socketId: string;
    }, ...args: unknown[]) => void;
    game_state_update: (args_0: any, ...args: unknown[]) => void;
    answers_locked: (args_0: {
        locked: boolean;
    }, ...args: unknown[]) => void;
    notification: (args_0: {
        message: string;
        defaultMode: "success" | "error" | "info" | "warning";
    }, ...args: unknown[]) => void;
    game_control_question_set: (args_0: {
        questionIndex: number;
        timer: {
            startedAt: number;
            duration: number;
            isPaused: boolean;
            pausedAt?: number | undefined;
            timeRemaining?: number | undefined;
        };
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
    timer_action: (args_0: {
        accessCode: string;
        action: "pause" | "stop" | "start" | "resume" | "set_duration";
        questionUid?: string | undefined;
        duration?: number | undefined;
    }, ...args: unknown[]) => void;
}>;
export declare const startTimerPayloadSchema: z.ZodEffects<z.ZodObject<{
    gameId: z.ZodOptional<z.ZodString>;
    accessCode: z.ZodOptional<z.ZodString>;
    duration: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    duration: number;
    accessCode?: string | undefined;
    gameId?: string | undefined;
}, {
    duration: number;
    accessCode?: string | undefined;
    gameId?: string | undefined;
}>, {
    duration: number;
    accessCode?: string | undefined;
    gameId?: string | undefined;
}, {
    duration: number;
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
    playMode?: "quiz" | "tournament" | "practice" | undefined;
    avatarEmoji?: string | undefined;
}, {
    accessCode: string;
    userId: string;
    username: string;
    playMode?: "quiz" | "tournament" | "practice" | undefined;
    avatarEmoji?: string | undefined;
}>;
export declare const sharedAnswerPayloadSchema: z.ZodObject<{
    accessCode: z.ZodString;
    userId: z.ZodString;
    questionUid: z.ZodString;
    answer: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodArray<z.ZodString, "many">, z.ZodArray<z.ZodNumber, "many">]>;
    timeSpent: z.ZodNumber;
    playMode: z.ZodOptional<z.ZodEnum<["quiz", "tournament", "practice"]>>;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    userId: string;
    questionUid: string;
    answer: string | number | string[] | number[];
    timeSpent: number;
    playMode?: "quiz" | "tournament" | "practice" | undefined;
}, {
    accessCode: string;
    userId: string;
    questionUid: string;
    answer: string | number | string[] | number[];
    timeSpent: number;
    playMode?: "quiz" | "tournament" | "practice" | undefined;
}>;
