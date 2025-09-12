import { beforeAll, afterAll, beforeEach, describe, it, expect } from '@jest/globals';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';
import { joinGame } from '../../src/core/services/gameParticipant/joinService';

describe('Check DB Values After Bug Test', () => {
    let testData: any;

    beforeAll(async () => {
        await redisClient.flushall();
    });

    afterAll(async () => {
        await redisClient.flushall();
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        testData = {
            accessCode: 'ATTEMPT-BUG-TEST',
            gameId: 'attempt-bug-game',
            userId: 'user-attempt-bug-test'
        };

        // Clean up (order matters due to foreign keys)
        await prisma.gameParticipant.deleteMany({
            where: { gameInstanceId: testData.gameId }
        });
        await prisma.gameInstance.deleteMany({
            where: { id: testData.gameId }
        });
        await prisma.gameTemplate.deleteMany({
            where: { creatorId: testData.userId }
        });
        await prisma.user.deleteMany({
            where: { id: testData.userId }
        });

        // Create test user
        await prisma.user.create({
            data: {
                id: testData.userId,
                username: 'AttemptBugUser',
                email: 'attemptbug@test.com',
                role: 'STUDENT'
            }
        });

        // Create game template and instance
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Attempt Bug Test Template',
                description: 'Attempt Bug Test Description',
                creator: { connect: { id: testData.userId } }
            }
        });

        await prisma.gameInstance.create({
            data: {
                id: testData.gameId,
                accessCode: testData.accessCode,
                name: 'Attempt Bug Test Game',
                status: 'completed', // Deferred mode (completed game)
                playMode: 'tournament',
                gameTemplateId: gameTemplate.id
            }
        });

        // Create a participant with some attempts to test
        await joinGame({
            userId: testData.userId,
            accessCode: testData.accessCode,
            username: 'AttemptBugUser'
        });

        // Simulate multiple attempts by updating the participant
        await prisma.gameParticipant.updateMany({
            where: {
                userId: testData.userId,
                gameInstanceId: testData.gameId
            },
            data: {
                nbAttempts: 3,
                liveScore: 150,
                deferredScore: 200
            }
        });
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
