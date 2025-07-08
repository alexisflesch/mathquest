"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showCorrectAnswersPayloadSchema = exports.gameControlStatePayloadSchema = exports.questionForDashboardSchema = void 0;
const zod_1 = require("zod");
const timer_zod_1 = require("./core/timer.zod");
const question_zod_1 = require("./quiz/question.zod");
// QuestionForDashboard = Question (inherits all fields)
exports.questionForDashboardSchema = question_zod_1.questionSchema;
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
    answerStats: zod_1.z.record(zod_1.z.string(), zod_1.z.number()).optional(),
});
exports.showCorrectAnswersPayloadSchema = zod_1.z.object({
    gameId: zod_1.z.string().optional(),
    accessCode: zod_1.z.string().optional(),
    teacherId: zod_1.z.string().optional(),
    show: zod_1.z.boolean(),
    terminatedQuestions: zod_1.z.record(zod_1.z.boolean()),
});
