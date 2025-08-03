import { beforeAll, afterAll, beforeEach, describe, it, expect } from '@jest/globals';
import { prisma } from '../../src/db/prisma';

describe('Check DB Values After Bug Test', () => {
    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should check what the frontend API would see', async () => {
        // Look for the test participant from our previous test
        const participant = await prisma.gameParticipant.findFirst({
            where: {
                user: {
                    id: 'user-attempt-bug-test'
                },
                gameInstance: {
                    accessCode: 'ATTEMPT-BUG-TEST'
                }
            },
            include: {
                gameInstance: true,
                user: true
            }
        });

        if (participant) {
            console.log('Found test participant with nbAttempts:', participant.nbAttempts);
            console.log('Full participant data:', {
                id: participant.id,
                userId: participant.userId,
                gameInstanceId: participant.gameInstanceId,
                accessCode: participant.gameInstance.accessCode,
                nbAttempts: participant.nbAttempts,
                liveScore: participant.liveScore,
                deferredScore: participant.deferredScore,
                status: participant.status,
                joinedAt: participant.joinedAt,
                username: participant.user.username
            });

            // This is what the frontend leaderboard API would see
            const leaderboardEntry = {
                userId: participant.userId,
                username: participant.user.username,
                nbAttempts: participant.nbAttempts,
                liveScore: participant.liveScore,
                deferredScore: participant.deferredScore,
                status: participant.status
            };

            console.log('Leaderboard entry (what frontend sees):', leaderboardEntry);
        } else {
            console.log('No test participant found - test might not have completed');
        }

        // Let's also check if there are any other participants with high attempt counts
        const highAttemptParticipants = await prisma.gameParticipant.findMany({
            where: {
                nbAttempts: {
                    gte: 3
                }
            },
            include: {
                gameInstance: true,
                user: true
            },
            orderBy: {
                nbAttempts: 'desc'
            },
            take: 10
        });

        if (highAttemptParticipants.length > 0) {
            console.log('\n📊 Other participants with high attempt counts:');
            highAttemptParticipants.forEach((p: any) => {
                console.log(`- ${p.user.username} (${p.gameInstance.accessCode}): ${p.nbAttempts} attempts`);
            });
        }
    });
});
