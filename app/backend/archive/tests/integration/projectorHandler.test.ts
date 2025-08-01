import { Server } from 'socket.io';
import { createServer } from 'http';
import Client, { Socket as ClientSocket } from 'socket.io-client';
import { registerHandlers } from '@/sockets/index';
import { prisma } from '@/db/prisma';
import gameStateService from '@/core/services/gameStateService';
import { QUESTION_TYPES } from '@shared/constants/questionTypes';

describe('Projector Mode Socket Handler', () => {
    jest.setTimeout(10000);

    let io: Server;
    let httpServer: any;
    let clientSocket: ClientSocket;
    let gameId: string;
    let gameAccessCode: string;

    beforeAll(async () => {
        // Create a real game instance for testing
        const testTeacher = await prisma.user.upsert({
            where: { email: 'projector-test@example.com' },
            update: {},
            create: {
                username: 'projectortestteacher',
                email: 'projector-test@example.com',
                passwordHash: 'hash-not-important-for-test',
                role: 'TEACHER',
                teacherProfile: { create: {} }
            }
        });

        const testTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Projector Test Quiz Template',
                creatorId: testTeacher.id,
                themes: ['math']
            }
        });

        // Add at least one question to the template
        const testQuestion = await prisma.question.create({
            data: {
                title: 'Addition',
                text: 'What is 2+2?',
                questionType: QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                difficulty: 1,
                timeLimit: 20,
                discipline: 'math',
                themes: ['arithmetic'],
                answerOptions: ['3', '4', '5', '22'],
                correctAnswers: [false, true, false, false],
                author: testTeacher.username
            }
        });
        await prisma.questionsInGameTemplate.create({
            data: {
                gameTemplateId: testTemplate.id,
                questionUid: testQuestion.uid,
                sequence: 0
            }
        });

        const gameInstance = await prisma.gameInstance.create({
            data: {
                accessCode: 'PROJ123',
                name: 'Projector Test Game',
                status: 'active',
                playMode: 'quiz',
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true
                },
                gameTemplateId: testTemplate.id,
                initiatorUserId: testTeacher.id
            }
        });

        gameId = gameInstance.id;
        gameAccessCode = gameInstance.accessCode;

        // Initialize game state for both gameId and accessCode
        await gameStateService.initializeGameState(gameId);
        await gameStateService.initializeGameState(gameAccessCode);

        // Start HTTP server with Socket.IO
        return new Promise<void>((resolve) => {
            httpServer = createServer();
            io = new Server(httpServer);
            registerHandlers(io);
            httpServer.listen(() => {
                const port = httpServer.address().port;
                clientSocket = Client(`http://localhost:${port}`);
                clientSocket.on('connect', resolve);
            });
        });
    });

    afterAll(async () => {
        return new Promise<void>(async (resolve) => {
            io.close();
            clientSocket.close();
            if (httpServer) {
                httpServer.close(async () => {
                    // Clean up test data
                    await prisma.gameInstance.deleteMany({
                        where: { accessCode: 'PROJ123' }
                    });
                    await prisma.gameTemplate.deleteMany({
                        where: { name: 'Projector Test Quiz Template' }
                    });
                    await prisma.teacherProfile.deleteMany({
                        where: { user: { email: 'projector-test@example.com' } }
                    });
                    await prisma.user.deleteMany({
                        where: { email: 'projector-test@example.com' }
                    });
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });

    it('should join projector room and receive initial state', (done) => {
        clientSocket.emit('join_projector', gameId);
        clientSocket.on('projector_state', (state) => {
            expect(state).toBeDefined();
            expect(state.accessCode).toBe(gameAccessCode);
            done();
        });

        // Add timeout fallback
        setTimeout(() => {
            done(new Error('Test timed out waiting for projector_state'));
        }, 5000);
    });

    it('should leave projector room without error', (done) => {
        clientSocket.emit('leave_projector', gameId);
        // No error expected, just call done
        setTimeout(done, 100);
    });

    it('should handle disconnect gracefully', (done) => {
        clientSocket.disconnect();
        setTimeout(done, 100);
    });

    // Add more tests for real-time updates, error cases, etc.
});
