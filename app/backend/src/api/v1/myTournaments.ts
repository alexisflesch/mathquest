import express, { Request, Response } from 'express';
import { optionalAuth } from '@/middleware/auth';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';
import { TournamentListItemSchema, MyTournamentsResponseSchema } from '@shared/types/api/schemas';

const logger = createLogger('MyTournamentsAPI');
const router = express.Router();

/**
 * Get games for the current user (tournaments, quizzes, or practice sessions)
 * GET /api/v1/my-tournaments?mode=tournament|quiz|practice
 * Returns games created by and participated in by the user
 */
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        // Handle cookie_id parameter for guest/student users
        const cookieId = req.query.cookie_id as string;

        // Handle mode parameter (default to 'tournament' for backward compatibility)
        const mode = (req.query.mode as string) || 'tournament';
        const validModes = ['tournament', 'quiz', 'practice'];

        if (!validModes.includes(mode)) {
            res.status(400).json({ error: 'Invalid mode. Must be one of: tournament, quiz, practice' });
            return;
        }

        let pending: any[] = [];
        let active: any[] = [];
        let ended: any[] = [];

        if (userRole === 'TEACHER' && userId) {
            // For teachers, get games they created
            try {
                const teacherGames = await prisma.gameInstance.findMany({
                    where: {
                        initiatorUserId: userId,
                        playMode: mode as any
                    },
                    select: {
                        id: true,
                        accessCode: true,
                        name: true,
                        status: true,
                        createdAt: true,
                        startedAt: true,
                        endedAt: true,
                        isDiffered: true,
                        differedAvailableFrom: true,
                        differedAvailableTo: true,
                        initiatorUser: {
                            select: {
                                username: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });

                // Categorize tournaments by status
                teacherGames.forEach(game => {
                    const tournament = {
                        id: game.id,
                        code: game.accessCode,
                        name: game.name || 'Tournoi sans nom',
                        statut: game.status,
                        playMode: mode, // Add playMode to response
                        createdAt: game.createdAt.toISOString(),
                        date_debut: game.startedAt?.toISOString() || null,
                        date_fin: game.endedAt?.toISOString() || null,
                        creatorUsername: game.initiatorUser?.username || 'Inconnu',
                        leaderboard: [] // TODO: Add leaderboard data if needed
                    };

                    if (game.status === 'pending') {
                        pending.push(tournament);
                    } else if (game.status === 'active') {
                        // Check if it's still available in deferred mode
                        const now = new Date();
                        const isStillAvailable = game.isDiffered &&
                            game.differedAvailableTo &&
                            new Date(game.differedAvailableTo) > now;

                        if (isStillAvailable) {
                            active.push(tournament);
                        } else {
                            ended.push(tournament);
                        }
                    } else {
                        // Any other status (like 'completed', 'cancelled', etc.) goes to ended
                        ended.push(tournament);
                    }
                });

                logger.info('Retrieved tournaments for teacher', {
                    teacherId: userId,
                    pending: pending.length,
                    active: active.length,
                    ended: ended.length
                });
            } catch (error) {
                logger.error({ error, userId }, 'Error fetching teacher tournaments');
            }
        } else if ((userRole === 'STUDENT' || !userRole) && (cookieId || userId)) {
            // For students/guests, get tournaments they participated in
            try {
                // Find user by cookieId if provided, otherwise use userId
                let targetUserId = userId;

                if (cookieId && !userId) {
                    const user = await prisma.user.findFirst({
                        where: {
                            studentProfile: {
                                cookieId: cookieId
                            }
                        },
                        select: { id: true }
                    });
                    targetUserId = user?.id;
                }

                if (targetUserId) {
                    // Get games the user participated in
                    const participatedGames = await prisma.gameInstance.findMany({
                        where: {
                            playMode: mode as any,
                            participants: {
                                some: {
                                    userId: targetUserId
                                }
                            }
                        },
                        select: {
                            id: true,
                            accessCode: true,
                            name: true,
                            status: true,
                            createdAt: true,
                            startedAt: true,
                            endedAt: true,
                            isDiffered: true,
                            differedAvailableFrom: true,
                            differedAvailableTo: true,
                            initiatorUser: {
                                select: {
                                    username: true
                                }
                            }
                        },
                        orderBy: {
                            createdAt: 'desc'
                        }
                    });

                    // Get participant data separately for each game
                    const participantData = await Promise.all(
                        participatedGames.map(async (game) => {
                            const participant = await prisma.gameParticipant.findFirst({
                                where: {
                                    gameInstanceId: game.id,
                                    userId: targetUserId
                                },
                                select: {
                                    liveScore: true,
                                    deferredScore: true,
                                    status: true
                                }
                            });
                            return { gameId: game.id, participant };
                        })
                    );

                    // Categorize tournaments by status for students too
                    participatedGames.forEach(game => {
                        const participantInfo = participantData.find(p => p.gameId === game.id);
                        const participation = participantInfo?.participant;
                        const isDeferred = participation?.status === 'ACTIVE' && game.status === 'completed';
                        const tournament = {
                            id: game.id,
                            code: game.accessCode,
                            name: game.name || 'Tournoi sans nom',
                            statut: game.status,
                            playMode: mode, // Add playMode to response
                            createdAt: game.createdAt.toISOString(),
                            date_debut: game.startedAt?.toISOString() || null,
                            date_fin: game.endedAt?.toISOString() || null,
                            creatorUsername: game.initiatorUser?.username || 'Inconnu',
                            position: 0, // Rank removed - would need to calculate from leaderboard if needed
                            score: isDeferred ? (participation?.deferredScore || 0) : (participation?.liveScore || 0)
                        };

                        if (game.status === 'pending') {
                            pending.push(tournament);
                        } else if (game.status === 'active') {
                            // Check if it's still available in deferred mode
                            const now = new Date();
                            const isStillAvailable = game.isDiffered &&
                                game.differedAvailableTo &&
                                new Date(game.differedAvailableTo) > now;

                            if (isStillAvailable) {
                                active.push(tournament);
                            } else {
                                ended.push(tournament);
                            }
                        } else {
                            // Any other status goes to ended
                            ended.push(tournament);
                        }
                    });

                    logger.info('Retrieved tournaments for student/guest', {
                        userId: targetUserId,
                        cookieId: cookieId ? '[HIDDEN]' : undefined,
                        pending: pending.length,
                        active: active.length,
                        ended: ended.length
                    });
                }
            } catch (error) {
                logger.error({ error, userId, cookieId }, 'Error fetching student tournaments');
            }
        }

        // At the end, before sending response:
        // DEBUG: Log first 5 items in pending before filtering
        logger.info({ sample: pending.slice(0, 5) }, 'Sample of pending array before filtering');
        logger.info('Sample of pending array before filtering:', JSON.stringify(pending.slice(0, 5), null, 2));
        // Exclude only quizzes with status 'pending' from the pending array
        pending = pending.filter((item: any) => {
            if (item.playMode === 'quiz' && item.statut === 'pending') {
                logger.info({ id: item.id, code: item.code, name: item.name }, 'Excluding quiz with pending status from pending list');
                return false;
            }
            return true;
        });
        // Log any tournament objects missing playMode for investigation
        const logMissingPlayMode = (arr: any[], label: string) => {
            arr.forEach((item: any, idx: number) => {
                if (!item.playMode) {
                    logger.error({ item, idx, label }, `Missing playMode in ${label}[${idx}]`);
                }
            });
        };
        logMissingPlayMode(pending, 'pending');
        logMissingPlayMode(active, 'active');
        logMissingPlayMode(ended, 'ended');
        const response = { pending, active, ended };
        try {
            MyTournamentsResponseSchema.parse(response);
        } catch (validationError) {
            logger.error({ validationError, response }, 'Invalid my-tournaments API response');
            res.status(500).json({ error: 'Internal server error: invalid response structure' });
            return;
        }
        res.status(200).json(response);
    } catch (error) {
        logger.error({ error }, 'Error in my-tournaments endpoint');
        res.status(500).json({ error: 'An error occurred while fetching tournaments' });
    }
});

export default router;
