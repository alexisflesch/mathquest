import express, { Request, Response } from 'express';
import { optionalAuth } from '@/middleware/auth';
import { prisma } from '@/db/prisma';
import createLogger from '@/utils/logger';

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
                                    score: true,
                                    rank: true
                                }
                            });
                            return { gameId: game.id, participant };
                        })
                    );

                    // Categorize tournaments by status for students too
                    participatedGames.forEach(game => {
                        const participantInfo = participantData.find(p => p.gameId === game.id);
                        const participation = participantInfo?.participant;
                        const tournament = {
                            id: game.id,
                            code: game.accessCode,
                            name: game.name || 'Tournoi sans nom',
                            statut: game.status,
                            createdAt: game.createdAt.toISOString(),
                            date_debut: game.startedAt?.toISOString() || null,
                            date_fin: game.endedAt?.toISOString() || null,
                            creatorUsername: game.initiatorUser?.username || 'Inconnu',
                            position: participation?.rank || 0,
                            score: participation?.score || 0
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

        res.status(200).json({
            pending,
            active,
            ended
        });
    } catch (error) {
        logger.error({ error }, 'Error in my-tournaments endpoint');
        res.status(500).json({ error: 'An error occurred while fetching tournaments' });
    }
});

export default router;
