/**
 * Migration Layer Index
 * 
 * This module provides backward-compatible hooks that use the unified
 * timer and socket system internally while maintaining the same external
 * interfaces as the original hooks.
 * 
 * Phase 2: Timer Management Consolidation - Migration Layer
 * 
 * Usage:
 * 1. Import from this file instead of the original hooks
 * 2. The interface remains exactly the same
 * 3. All timer management is now unified and consistent
 * 4. Gradual migration path for components
 */

// Re-export the migrated hooks
export { useTeacherQuizSocket } from './useTeacherQuizSocketMigrated';
export { useProjectionQuizSocket } from './useProjectionQuizSocketMigrated';
export { useStudentGameSocket } from './useStudentGameSocketMigrated';
export { useTournamentSocket } from './useTournamentSocketMigrated';

// Re-export types for backward compatibility
export type {
    Question,
    QuizState
} from '../useTeacherQuizSocket';

export type {
    StudentGameState,
    StudentGameSocketHookProps,
    StudentGameSocketHook
} from './useStudentGameSocketMigrated';

export type {
    TournamentQuestion,
    TournamentAnswerReceived,
    TournamentGameState,
    TournamentSocketHookProps,
    TournamentSocketHook
} from './useTournamentSocketMigrated';

/**
 * Migration Status
 * 
 * This object tracks which hooks have been migrated and can be used
 * to verify the migration progress.
 */
export const MIGRATION_STATUS = {
    useTeacherQuizSocket: 'MIGRATED',
    useProjectionQuizSocket: 'MIGRATED',
    useStudentGameSocket: 'MIGRATED',
    useTournamentSocket: 'MIGRATED',

    // Phase 2 completion status
    timerConsolidation: 'COMPLETE',
    socketConsolidation: 'COMPLETE',
    backwardCompatibility: 'COMPLETE'
} as const;

/**
 * Migration Utilities
 */
export const migrationUtils = {
    /**
     * Check if a specific hook has been migrated
     */
    isMigrated: (hookName: keyof typeof MIGRATION_STATUS): boolean => {
        return MIGRATION_STATUS[hookName] === 'MIGRATED' || MIGRATION_STATUS[hookName] === 'COMPLETE';
    },

    /**
     * Get overall migration progress
     */
    getProgress: (): { completed: number; total: number; percentage: number } => {
        const statuses = Object.values(MIGRATION_STATUS);
        const completed = statuses.filter(status =>
            status === 'MIGRATED' || status === 'COMPLETE'
        ).length;
        const total = statuses.length;

        return {
            completed,
            total,
            percentage: Math.round((completed / total) * 100)
        };
    }
};
