/**
 * Simple test for Practice Session myTournaments Visibility
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';
import request from 'supertest';
import { app } from '../../src/server';

describe('Practice Session myTournaments Visibility', () => {
    let testGuestUserId: string;
    let testCookieId: string;
    let testGameTemplateId: string;

    beforeAll(async () => {
        testGuestUserId = `test-guest-${Date.now()}`;
        testCookieId = `guest_${Date.now()}`;
        testGameTemplateId = `template-${Date.now()}`;

        // Create test guest user
        await prisma.user.create({
            data: {
                id: testGuestUserId,
                username: `guest-${Date.now()}`,
                role: 'GUEST',
                createdAt: new Date(),
                studentProfile: {
                    create: {
                        cookieId: testCookieId
                    }
                }
            }
        });

        // Create test game template
        await prisma.gameTemplate.create({
            data: {
                id: testGameTemplateId,
                name: 'Test Practice Template',
                description: 'Template for practice session tests',
                creatorId: testGuestUserId
            }
        });

        await redisClient.flushall();
    });

    afterAll(async () => {
        await redisClient.flushall();
        await prisma.gameParticipant.deleteMany({
            where: { userId: testGuestUserId }
        });
        await prisma.gameInstance.deleteMany({
            where: { initiatorUserId: testGuestUserId }
        });
        await prisma.gameTemplate.deleteMany({
            where: { id: testGameTemplateId }
        });
        await prisma.studentProfile.deleteMany({
            where: { id: testGuestUserId }
        });
        await prisma.user.deleteMany({
            where: { id: testGuestUserId }
        });
        await prisma.$disconnect();
    });

    it('should show completed practice sessions in myTournaments for guest users via cookieId', async () => {
        // Create a practice game instance manually for guest
        const accessCode = `PRACTICE-GUEST-${Date.now()}`;
        const gameInstance = await prisma.gameInstance.create({
            data: {
                accessCode: accessCode,
                name: 'Test Guest Practice Session',
                playMode: 'practice',
                status: 'completed',
                gameTemplateId: testGameTemplateId,
                initiatorUserId: testGuestUserId,
                createdAt: new Date()
            }
        });

        // Create participant record
        await prisma.gameParticipant.create({
            data: {
                id: `${gameInstance.id}-participant`,
                gameInstanceId: gameInstance.id,
                userId: testGuestUserId,
                status: 'ACTIVE',
                liveScore: 100,
                deferredScore: 100,
                nbAttempts: 1,
                joinedAt: new Date(),
                lastActiveAt: new Date()
            }
        });

        // Query myTournaments API as guest using cookieId
        const response = await request(app)
            .get('/api/v1/my-tournaments')
            .query({ cookie_id: testCookieId, mode: 'practice' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('ended');
        expect(Array.isArray(response.body.ended)).toBe(true);

        // Should find the practice session in ended array
        const practiceSession = response.body.ended.find(
            (session: any) => session.code === accessCode
        );
        expect(practiceSession).toBeTruthy();
        expect(practiceSession.name).toBe('Test Guest Practice Session');
        expect(practiceSession.playMode).toBe('practice');
    });
});
