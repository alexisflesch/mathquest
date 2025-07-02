import { z } from 'zod';
import { gameTimerStateSchema as canonicalGameTimerStateSchema } from './core/timer.zod';
import { questionSchema as canonicalQuestionSchema } from './quiz/question.zod';

// QuestionForDashboard = Question (inherits all fields)
export const questionForDashboardSchema = canonicalQuestionSchema;

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
    answerStats: z.record(z.string(), z.number()).optional(),
});

export type GameControlStatePayload = z.infer<typeof gameControlStatePayloadSchema>;
