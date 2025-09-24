import { z } from 'zod';
import { gameTimerStateSchema as canonicalGameTimerStateSchema } from './core/timer.zod';
import { questionSchema as canonicalQuestionSchema } from './quiz/question.zod';

// QuestionForDashboard = Question (inherits all fields)
export const questionForDashboardSchema = canonicalQuestionSchema;

// Schema for answer stats - supports both legacy and new formats
const answerStatsSchema = z.union([
    // Legacy format for backward compatibility (multiple choice questions)
    z.record(z.string(), z.number()),
    // New format with type discrimination
    z.object({
        type: z.literal('multipleChoice'),
        stats: z.record(z.string(), z.number()),
        totalUsers: z.number()
    }),
    z.object({
        type: z.literal('numeric'),
        values: z.array(z.number()),
        totalAnswers: z.number()
    })
]);

export const gameControlStatePayloadSchema = z.object({
    gameId: z.string(),
    accessCode: z.string(),
    templateName: z.string(),
    gameInstanceName: z.string(),
    status: z.enum(['pending', 'active', 'paused', 'completed']),
    currentQuestionUid: z.string().nullable(),
    questions: z.array(questionForDashboardSchema),
    timer: canonicalGameTimerStateSchema,
    answersLocked: z.boolean(),
    participantCount: z.number().int().nonnegative(),
    answerStats: answerStatsSchema.optional(),
});

export type GameControlStatePayload = z.infer<typeof gameControlStatePayloadSchema>;

export const showCorrectAnswersPayloadSchema = z.object({
    gameId: z.string().optional(),
    accessCode: z.string().optional(),
    teacherId: z.string().optional(),
    show: z.boolean(),
    terminatedQuestions: z.record(z.boolean()),
});

export type ShowCorrectAnswersPayload = z.infer<typeof showCorrectAnswersPayloadSchema>;
