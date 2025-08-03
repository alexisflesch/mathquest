import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import { prisma } from '../../src/db/prisma';

describe('Database Reality Check', () => {
    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should check the exact participant you found', async () => {
        console.log('\n🔍 CHECKING THE EXACT PARTICIPANT YOU FOUND:');
        console.log('gameInstanceId: game-1754222183250-6qsa9');
        console.log('userId: user-1754222183250-6qsa9-charlie');

        const participant = await prisma.gameParticipant.findFirst({
            where: {
                gameInstanceId: 'game-1754222183250-6qsa9',
                userId: 'user-1754222183250-6qsa9-charlie'
            },
            include: {
                gameInstance: true,
                user: true
            }
        });

        if (participant) {
            console.log('\n📊 FOUND THE PARTICIPANT:');
            console.log('- nbAttempts:', participant.nbAttempts);
            console.log('- liveScore:', participant.liveScore);
            console.log('- deferredScore:', participant.deferredScore);
            console.log('- status:', participant.status);
            console.log('- joinedAt:', participant.joinedAt);
            console.log('- lastActiveAt:', participant.lastActiveAt);
            console.log('- gameInstance status:', participant.gameInstance.status);
            console.log('- gameInstance accessCode:', participant.gameInstance.accessCode);
            console.log('- user username:', participant.user.username);

            console.log('\n🤔 WHY ARE ALL VALUES ZERO?');
            if (participant.nbAttempts === 0) {
                console.log('❌ nbAttempts = 0 means participant was created but NEVER joined properly');
            }
            if (participant.liveScore === 0 && participant.deferredScore === 0) {
                console.log('❌ Both scores = 0 means NO scoring ever happened');
            }

            console.log('\n💡 This suggests:');
            console.log('1. Test created participant but never called joinGame()');
            console.log('2. Or joinGame() failed silently');
            console.log('3. Or test is bypassing the real join logic');

        } else {
            console.log('❌ PARTICIPANT NOT FOUND');

            // Check if the game instance exists
            const gameInstance = await prisma.gameInstance.findUnique({
                where: { id: 'game-1754222183250-6qsa9' }
            });

            if (gameInstance) {
                console.log('✅ Game instance exists:', gameInstance.accessCode);
            } else {
                console.log('❌ Game instance not found');
            }

            // Check if the user exists
            const user = await prisma.user.findUnique({
                where: { id: 'user-1754222183250-6qsa9-charlie' }
            });

            if (user) {
                console.log('✅ User exists:', user.username);
            } else {
                console.log('❌ User not found');
            }
        }

        // Check what tests created this data
        const allParticipants = await prisma.gameParticipant.findMany({
            where: {
                gameInstanceId: 'game-1754222183250-6qsa9'
            },
            include: {
                user: true
            }
        });

        console.log('\n📋 ALL PARTICIPANTS IN THIS GAME:');
        allParticipants.forEach(p => {
            console.log(`- ${p.user.username}: nbAttempts=${p.nbAttempts}, liveScore=${p.liveScore}, deferredScore=${p.deferredScore}`);
        });
    });
});
