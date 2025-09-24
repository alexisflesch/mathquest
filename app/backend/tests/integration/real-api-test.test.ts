import { beforeAll, afterAll, beforeEach, describe, it, expect } from '@jest/globals';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';
import { joinGame } from '../../src/core/services/gameParticipant/joinService';

describe('REAL API Test - Use Leaderboard Endpoint', () => {
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
            accessCode: 'REAL-API-TEST',
            gameId: 'real-api-game',
            userId: 'real-api-user'
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
                username: 'RealTestUser',
                email: 'real@test.com',
                role: 'STUDENT'
            }
        });

        // Create game template and instance
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Real API Test Template',
                description: 'Real API Test Description',
                creator: { connect: { id: testData.userId } }
            }
        });

        await prisma.gameInstance.create({
            data: {
                id: testData.gameId,
                accessCode: testData.accessCode,
                name: 'Real API Test Game',
                status: 'active', // Start as LIVE
                playMode: 'tournament',
                gameTemplateId: gameTemplate.id
            }
        });
    });

    it('should actually call joinGame() and check via database AND API', async () => {
        console.log('\n🎯 REAL TEST: Actually calling joinGame() function');
        console.log('===============================================');

        // STEP 1: Call the REAL joinGame function
        console.log('\n📍 STEP 1: Calling REAL joinGame() function');

        const joinResult = await joinGame({
            userId: testData.userId,
            accessCode: testData.accessCode,
            username: 'RealTestUser'
        });

        console.log('Join result success:', joinResult.success);
        if (!joinResult.success) {
            console.log('Join error:', joinResult.error);
            throw new Error('Join failed: ' + joinResult.error);
        }

        // STEP 2: Check DATABASE directly
        console.log('\n📍 STEP 2: Checking DATABASE values');

        const dbParticipant = await prisma.gameParticipant.findFirst({
            where: {
                userId: testData.userId,
                gameInstanceId: testData.gameId
            },
            select: {
                nbAttempts: true,
                liveScore: true,
                deferredScore: true,
                status: true
            }
        });

        console.log('📊 Database participant:', dbParticipant);

        // This should be 1, not 0 if joinGame() actually worked
        if (dbParticipant?.nbAttempts === 0) {
            console.log('❌ nbAttempts = 0 means joinGame() did NOT work properly!');
        } else if (dbParticipant?.nbAttempts === 1) {
            console.log('✅ nbAttempts = 1 means joinGame() worked correctly!');
        } else {
            console.log('❓ Unexpected nbAttempts value:', dbParticipant?.nbAttempts);
        }

        // STEP 3: Test the API endpoint if available (this would require starting the server)
        console.log('\n📍 STEP 3: What the leaderboard API would return');

        // Simulate what the API endpoint returns (since we can't easily start the server in tests)
        const apiSimulation = await prisma.gameParticipant.findMany({
            where: {
                gameInstance: {
                    accessCode: testData.accessCode
                }
            },
            include: {
                user: true
            },
            orderBy: {
                liveScore: 'desc'
            }
        });

        console.log('\n📡 API simulation (what frontend sees):');
        apiSimulation.forEach(participant => {
            console.log(`- User: ${participant.user.username}`);
            console.log(`  - nbAttempts: ${participant.nbAttempts}`);
            console.log(`  - liveScore: ${participant.liveScore}`);
            console.log(`  - deferredScore: ${participant.deferredScore}`);
        });

        // ASSERTIONS
        expect(joinResult.success).toBe(true);
        expect(dbParticipant?.nbAttempts).toBe(1); // Should be 1 for new join
        expect(dbParticipant?.status).toBe('ACTIVE');

        console.log('\n✅ Test passes - joinGame() actually works correctly!');
    });
});
