import { beforeAll, afterAll, beforeEach, describe, it, expect } from '@jest/globals';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';
import { joinGame } from '../../src/core/services/gameParticipant/joinService';

describe('VERIFY BUG FIX - Deferred Tournament Attempt Count', () => {
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
            accessCode: 'BUG-FIX-TEST',
            gameId: 'bug-fix-game',
            userId: 'bug-fix-user'
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
                username: 'BugFixUser',
                email: 'bugfix@test.com',
                role: 'STUDENT'
            }
        });

        // Create game template and instance
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Bug Fix Test Template',
                description: 'Bug Fix Test Description',
                creator: { connect: { id: testData.userId } }
            }
        });

        await prisma.gameInstance.create({
            data: {
                id: testData.gameId,
                accessCode: testData.accessCode,
                name: 'Bug Fix Test Game',
                status: 'completed', // Deferred mode (completed game)
                playMode: 'tournament',
                gameTemplateId: gameTemplate.id
            }
        });
    });

    it('should show correct nbAttempts progression (1→2→3) for deferred tournaments', async () => {
        console.log('\n🎯 TESTING BUG FIX: Deferred tournament attempt progression');
        console.log('=====================================================');

        // ATTEMPT 1: First deferred join
        console.log('\n📍 ATTEMPT 1: First deferred tournament join');

        const join1 = await joinGame({
            userId: testData.userId,
            accessCode: testData.accessCode,
            username: 'BugFixUser'
        });

        expect(join1.success).toBe(true);

        const participant1 = await prisma.gameParticipant.findFirst({
            where: { userId: testData.userId, gameInstanceId: testData.gameId },
            select: { nbAttempts: true, liveScore: true, deferredScore: true, status: true }
        });

        console.log('📊 After 1st join:', participant1);
        expect(participant1?.nbAttempts).toBe(1); // Should be 1, not 2

        // ATTEMPT 2: Second deferred join (simulate playing again)
        console.log('\n📍 ATTEMPT 2: Second deferred tournament join');

        const join2 = await joinGame({
            userId: testData.userId,
            accessCode: testData.accessCode,
            username: 'BugFixUser'
        });

        expect(join2.success).toBe(true);

        const participant2 = await prisma.gameParticipant.findFirst({
            where: { userId: testData.userId, gameInstanceId: testData.gameId },
            select: { nbAttempts: true, liveScore: true, deferredScore: true, status: true }
        });

        console.log('📊 After 2nd join:', participant2);
        expect(participant2?.nbAttempts).toBe(2); // Should be 2, not 4

        // ATTEMPT 3: Third deferred join
        console.log('\n📍 ATTEMPT 3: Third deferred tournament join');

        const join3 = await joinGame({
            userId: testData.userId,
            accessCode: testData.accessCode,
            username: 'BugFixUser'
        });

        expect(join3.success).toBe(true);

        const participant3 = await prisma.gameParticipant.findFirst({
            where: { userId: testData.userId, gameInstanceId: testData.gameId },
            select: { nbAttempts: true, liveScore: true, deferredScore: true, status: true }
        });

        console.log('📊 After 3rd join:', participant3);
        expect(participant3?.nbAttempts).toBe(3); // Should be 3, not 6

        console.log('\n✅ BUG FIX VERIFIED: nbAttempts progression is now 1→2→3 (correct!)');
        console.log('❌ Before fix: progression was 1→3→5 (wrong due to duplicate joinGame calls)');
    });

    it('should still increment correctly for live tournaments (regression test)', async () => {
        console.log('\n🔍 REGRESSION TEST: Live tournament attempt count');
        console.log('==================================================');

        // Change game to live mode
        await prisma.gameInstance.update({
            where: { id: testData.gameId },
            data: { status: 'active' } // Live mode
        });

        // Join live tournament multiple times (shouldn't increment in live mode)
        const join1 = await joinGame({
            userId: testData.userId,
            accessCode: testData.accessCode,
            username: 'BugFixUser'
        });

        const join2 = await joinGame({
            userId: testData.userId,
            accessCode: testData.accessCode,
            username: 'BugFixUser'
        });

        const participant = await prisma.gameParticipant.findFirst({
            where: { userId: testData.userId, gameInstanceId: testData.gameId },
            select: { nbAttempts: true, status: true }
        });

        console.log('📊 Live tournament participant:', participant);

        // In live mode, nbAttempts should stay at 1 (no increment for reconnections)
        expect(participant?.nbAttempts).toBe(1);

        console.log('✅ Live tournament regression test passed');
    });
});
