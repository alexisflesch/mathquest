/**
 * Minimal public game instance info for lobby and public API consumers.
 *
 * Only includes non-sensitive fields required by the frontend lobby page.
 *
 * Canonical: Used by /api/v1/games/:code for non-admin consumers.
 */
import { z } from 'zod';
import type { PracticeSettings } from '../practice/session';
export declare const PublicGameInstanceSchema: z.ZodObject<{
    accessCode: z.ZodString;
    playMode: z.ZodString;
    linkedQuizId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    practiceSettings: z.ZodOptional<z.ZodObject<{
        gradeLevel: z.ZodString;
        discipline: z.ZodString;
        themes: z.ZodArray<z.ZodString, "many">;
        questionCount: z.ZodNumber;
        showImmediateFeedback: z.ZodBoolean;
        allowRetry: z.ZodBoolean;
        randomizeQuestions: z.ZodBoolean;
        gameTemplateId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
        gameTemplateId?: string | undefined;
    }, {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
        gameTemplateId?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    accessCode: string;
    playMode: string;
    status: string;
    linkedQuizId?: string | null | undefined;
    name?: string | undefined;
    practiceSettings?: {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
        gameTemplateId?: string | undefined;
    } | undefined;
}, {
    accessCode: string;
    playMode: string;
    status: string;
    linkedQuizId?: string | null | undefined;
    name?: string | undefined;
    practiceSettings?: {
        gradeLevel: string;
        discipline: string;
        themes: string[];
        questionCount: number;
        showImmediateFeedback: boolean;
        allowRetry: boolean;
        randomizeQuestions: boolean;
        gameTemplateId?: string | undefined;
    } | undefined;
}>;
export type PublicGameInstance = z.infer<typeof PublicGameInstanceSchema> & {
    practiceSettings?: PracticeSettings;
};
