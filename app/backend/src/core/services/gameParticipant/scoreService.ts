import { z } from 'zod';
import { PlayMode } from '@shared/types/core/game';
import { ScoringService } from '../scoringService';
import createLogger from '@/utils/logger';
import { prisma } from '@/db/prisma';
import { redisClient } from '@/config/redis';

const logger = createLogger('GameParticipantScoreService');

/**
 * Zod schema for validating participation creation and update payloads.
 */
export const DifferedParticipationSchema = z.object({
    userId: z.string(),
    tournamentId: z.string(),
    mode: z.literal('tournament'),
    attempt: z.number().int().min(1),
    score: z.number().int().min(0),
    bestScore: z.number().int().min(0),
});

export type DifferedParticipation = z.infer<typeof DifferedParticipationSchema>;

/**
 * Service for managing differed tournament participations.
 * Ensures only one live and one differed participation per user/tournament.
 * Tracks best score and attempt count. Resets score for each new attempt.
 */
export class DifferedScoreService {
    /**
     * Get or create a differed participation for a user/tournament.
     * If a new attempt, resets score and increments attempt count.
     */
    static async getOrCreateParticipation({ userId, tournamentId }: { userId: string; tournamentId: string; }): Promise<DifferedParticipation> {
        // Find existing participation for user/tournament/mode='tournament'
        let participation = await prisma.differedParticipation.findUnique({
            where: { userId_tournamentId_mode: { userId, tournamentId, mode: 'tournament' } }
        });
        if (!participation) {
            // Create new participation
            participation = await prisma.differedParticipation.create({
                data: {
                    userId,
                    tournamentId,
                    mode: 'tournament',
                    attempt: 1,
                    score: 0,
                    bestScore: 0
                }
            });
        } else {
            // New attempt: increment attempt, reset score
            participation = await prisma.differedParticipation.update({
                where: { userId_tournamentId_mode: { userId, tournamentId, mode: 'tournament' } },
                data: {
                    attempt: { increment: 1 },
                    score: 0
                }
            });
        }
        return participation;
    }

    /**
     * Update the score for a differed participation. If new score is higher, update bestScore.
     */
    static async updateScore({ userId, tournamentId, score }: { userId: string; tournamentId: string; score: number; }): Promise<DifferedParticipation> {
        let participation = await prisma.differedParticipation.findUnique({
            where: { userId_tournamentId_mode: { userId, tournamentId, mode: 'tournament' } }
        });
        if (!participation) throw new Error('Participation not found');
        let bestScore = Math.max(participation.bestScore, score);
        participation = await prisma.differedParticipation.update({
            where: { userId_tournamentId_mode: { userId, tournamentId, mode: 'tournament' } },
            data: {
                score,
                bestScore
            }
        });
        return participation;
    }

    /**
     * Get the best score and attempt count for leaderboard display.
     */
    static async getLeaderboardEntry({ userId, tournamentId }: { userId: string; tournamentId: string; }): Promise<Pick<DifferedParticipation, 'bestScore' | 'attempt'>> {
        const participation = await prisma.differedParticipation.findUnique({
            where: { userId_tournamentId_mode: { userId, tournamentId, mode: 'tournament' } }
        });
        if (!participation) throw new Error('Participation not found');
        return { bestScore: participation.bestScore, attempt: participation.attempt };
    }

    /**
     * Submit an answer and update score for a participant (delegates to ScoringService)
     * Handles both LIVE and DEFERRED scoring logic.
     */
    static async submitAnswer({ gameInstanceId, userId, answerData }: {
        gameInstanceId: string;
        userId: string;
        answerData: any;
    }) {
        return await ScoringService.submitAnswerWithScoring(gameInstanceId, userId, answerData);
    }

    /**
     * Finalize a deferred tournament attempt by keeping the best score
     * This should be called when a user completes a deferred tournament attempt
     */
    static async finalizeDeferredAttempt({ gameInstanceId, userId, currentAttemptScore }: {
        gameInstanceId: string;
        userId: string;
        currentAttemptScore: number;
    }) {
        try {
            const participant = await prisma.gameParticipant.findFirst({
                where: {
                    gameInstanceId,
                    userId,
                    participationType: 'DEFERRED'
                },
                include: { user: true }
            });
            if (!participant) {
                logger.error({ gameInstanceId, userId }, 'No deferred participant found for finalization');
                return { success: false, error: 'Participant not found' };
            }
            const redisKey = `mathquest:deferred:best_score:${gameInstanceId}:${userId}`;
            const previousBestScore = await redisClient.get(redisKey);
            const bestScore = Math.max(
                currentAttemptScore,
                previousBestScore ? parseInt(previousBestScore) : 0,
                participant.score || 0
            );
            await redisClient.set(redisKey, bestScore.toString());
            const updatedParticipant = await prisma.gameParticipant.update({
                where: { id: participant.id },
                data: { score: bestScore },
                include: { user: true }
            });
            logger.info({
                gameInstanceId,
                userId,
                participantId: participant.id,
                currentAttemptScore,
                previousBestScore: previousBestScore ? parseInt(previousBestScore) : 0,
                finalBestScore: bestScore,
                attemptCount: participant.attemptCount
            }, 'Finalized deferred tournament attempt with best score');
            return {
                success: true,
                participant: updatedParticipant,
                isNewBest: bestScore > (previousBestScore ? parseInt(previousBestScore) : 0),
                previousBest: previousBestScore ? parseInt(previousBestScore) : 0
            };
        } catch (error) {
            logger.error({ error, gameInstanceId, userId, currentAttemptScore }, 'Error finalizing deferred attempt');
            return { success: false, error: 'An error occurred while finalizing attempt' };
        }
    }
}

// All API boundaries must validate with Zod
export const validateDifferedParticipation = (data: unknown): DifferedParticipation => {
    return DifferedParticipationSchema.parse(data);
};
