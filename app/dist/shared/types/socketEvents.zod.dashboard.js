"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showCorrectAnswersPayloadSchema = exports.gameControlStatePayloadSchema = exports.questionForDashboardSchema = void 0;
const zod_1 = require("zod");
const timer_zod_1 = require("./core/timer.zod");
const question_zod_1 = require("./quiz/question.zod");
// QuestionForDashboard = Question (inherits all fields)
exports.questionForDashboardSchema = question_zod_1.questionSchema;
// Schema for answer stats - supports both legacy and new formats
const answerStatsSchema = zod_1.z.union([
    // Legacy format for backward compatibility (multiple choice questions)
    zod_1.z.record(zod_1.z.string(), zod_1.z.number()),
    // New format with type discrimination
    zod_1.z.object({
        type: zod_1.z.literal('multipleChoice'),
        stats: zod_1.z.record(zod_1.z.string(), zod_1.z.number()),
        totalUsers: zod_1.z.number()
    }),
    zod_1.z.object({
        type: zod_1.z.literal('numeric'),
        values: zod_1.z.array(zod_1.z.number()),
        totalAnswers: zod_1.z.number()
    })
]);
exports.gameControlStatePayloadSchema = zod_1.z.object({
    gameId: zod_1.z.string(),
    accessCode: zod_1.z.string(),
    templateName: zod_1.z.string(),
    gameInstanceName: zod_1.z.string(),
    status: zod_1.z.enum(['pending', 'active', 'paused', 'completed']),
    currentQuestionUid: zod_1.z.string().nullable(),
    questions: zod_1.z.array(exports.questionForDashboardSchema),
    timer: timer_zod_1.gameTimerStateSchema,
    answersLocked: zod_1.z.boolean(),
    participantCount: zod_1.z.number().int().nonnegative(),
    answerStats: answerStatsSchema.optional(),
});
exports.showCorrectAnswersPayloadSchema = zod_1.z.object({
    gameId: zod_1.z.string().optional(),
    accessCode: zod_1.z.string().optional(),
    teacherId: zod_1.z.string().optional(),
    show: zod_1.z.boolean(),
    terminatedQuestions: zod_1.z.record(zod_1.z.boolean()),
});
