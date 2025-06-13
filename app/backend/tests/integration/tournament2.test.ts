import express from 'express'; // Import express directly
import Redis from 'ioredis';

import request from 'supertest';
import { AddressInfo } from 'net';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client'; // Import ioc for creating client sockets

import { prisma } from '@/db/prisma';
import { setupServer } from '@/server';
import { testQuestions } from '../support/testQuestions';
import { redisClient } from '@/config/redis';
import { closeSocketIORedisClients } from '@/sockets';
import gameStateService from '@/core/gameStateService';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForEvent = (socket: ClientSocket, eventName: string, timeout = 10000): Promise<any> => {
    return new Promise((resolve, reject) => {
        if (!socket) return reject(new Error('Socket undefined'));
        const handler = (data: any) => {
            socket.off(eventName, handler);
            resolve(data);
        };
        socket.on(eventName, handler);
        setTimeout(() => {
            socket.off(eventName, handler);
            reject(new Error(`Timeout waiting for ${eventName}`));
        }, timeout);
    });
};

describe('Tournament Flow - Extended Tests', () => {
    let app: express.Express; // Use express.Express type
    let httpServer: HttpServer;
    let io: SocketIOServer;
    let address: string;
    let socket1: ClientSocket, socket2: ClientSocket;
    let player1: any, player2: any;
    let accessCode: string;

    beforeAll(async () => {
        const serverSetup = setupServer();
        httpServer = serverSetup.httpServer;
        io = serverSetup.io;

        await new Promise<void>((resolve) => httpServer.listen({ port: 0 }, resolve)); // Corrected listen and added void type
        const port = (httpServer.address() as AddressInfo).port;
        address = `http://localhost:${port}`;

        // Create users with unique identifiers to avoid conflicts
        player1 = await prisma.user.create({ data: { username: 'p1-extended', role: 'STUDENT', studentProfile: { create: { cookieId: 'cookie-p1-extended' } } } });
        player2 = await prisma.user.create({ data: { username: 'p2-extended', role: 'STUDENT', studentProfile: { create: { cookieId: 'cookie-p2-extended' } } } });

        // Ensure all test questions exist (use upsert to avoid conflicts with tournament.test.ts)
        for (const tq of testQuestions) {
            await prisma.question.upsert({
                where: { uid: tq.uid },
                update: { ...tq, answerOptions: tq.answerOptions as any, correctAnswers: tq.correctAnswers as any },
                create: { ...tq, answerOptions: tq.answerOptions as any, correctAnswers: tq.correctAnswers as any },
            });
        }

        // Auth tokens
        const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'mathquest_default_secret';
        const signToken = (user: any) => jwt.sign({ userId: user.id, username: user.username, role: user.role }, secret, { expiresIn: '1h' });
        player1.token = signToken(player1);
        player2.token = signToken(player2);
    });

    afterAll(async () => {
        console.log('Starting afterAll cleanup...');

        // Helper function for disconnecting client sockets
        const disconnectSocket = async (socket: ClientSocket | null, name: string, timeoutMs: number) => {
            if (!socket) {
                console.log(`${name} is not defined.`);
                return;
            }
            console.log(`Processing ${name}...`);
            // Remove all listeners attached during tests to prevent memory leaks or interference
            socket.removeAllListeners();

            if (socket.connected) {
                console.log(`${name} is connected. Attempting graceful disconnect...`);
                try {
                    await new Promise<void>((resolve, reject) => {
                        const timeoutId = setTimeout(() => {
                            console.warn(`${name} disconnect event timed out after ${timeoutMs}ms.`);
                            reject(new Error(`${name} disconnect event timeout`));
                        }, timeoutMs);

                        socket.once('disconnect', (reason) => {
                            clearTimeout(timeoutId);
                            console.log(`${name} disconnected. Reason: ${reason || 'N/A'}`);
                            resolve();
                        });

                        socket.disconnect(); // Initiate disconnection
                    });
                } catch (e: any) {
                    console.warn(`Error during ${name} graceful disconnect: ${e.message}. Attempting forceful disconnect.`);
                    // If graceful disconnect fails or times out, ensure disconnect is called
                    socket.disconnect();
                }
            } else {
                console.log(`${name} was not connected. Calling disconnect() as a cleanup step.`);
                // Call disconnect even if not connected, as it might perform some client-side cleanup
                socket.disconnect();
            }
            console.log(`${name} processing complete.`);
        };

        // 1. Clean up client-side sockets
        await disconnectSocket(socket1, 'socket1', 5000); // Increased timeout
        await disconnectSocket(socket2, 'socket2', 5000); // Increased timeout

        await new Promise(resolve => setTimeout(resolve, 500)); // Short pause

        // 2. Close Socket.IO server
        if (io) {
            console.log('Closing Socket.IO server...');
            await new Promise<void>((resolveIO) => { // No rejectIO needed if we always resolve
                const timeoutId = setTimeout(() => {
                    console.warn('Socket.IO server close timed out after 7000ms. Forcing continuation.');
                    resolveIO();
                }, 7000); // Increased timeout

                io.close((err?: Error) => {
                    clearTimeout(timeoutId);
                    if (err) {
                        console.error('Socket.IO server close error:', err);
                    } else {
                        console.log('Socket.IO server closed successfully.');
                    }
                    resolveIO();
                });
            });
        }

        // 3. Close HTTP server
        console.log('Attempting to close HTTP server...');
        if (httpServer && typeof httpServer.close === 'function') {
            if (httpServer.listening) {
                console.log('HTTP server is listening, proceeding to close.');
                await new Promise<void>((resolveHTTP) => {
                    const timeoutId = setTimeout(() => {
                        console.warn('HTTP server close attempt timed out after 5000ms. Forcing continuation.');
                        resolveHTTP();
                    }, 5000); // Keep existing timeout

                    httpServer.close((err?: Error) => {
                        clearTimeout(timeoutId);
                        if (err) {
                            console.error('HTTP server close error:', err);
                        }
                        console.log('HTTP server closed callback executed.');
                        resolveHTTP();
                    });
                });
            } else {
                console.log('HTTP server was not listening. Assuming already closed or handled by Socket.IO close.');
            }
        } else {
            console.log('HTTP server instance not found or .close is not a function.');
        }

        console.log('Waiting longer for server resources to release before closing Redis...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Crucial pause

        // 4. Close Socket.IO-specific Redis clients (subClient)
        console.log('Closing SocketIO Redis clients (subClient)...');
        try {
            await closeSocketIORedisClients();
            console.log('SocketIO Redis clients closed.');
        } catch (e: any) { // Added type for e
            console.warn('Error closing SocketIO Redis clients:', e.message || e);
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        // 5. Close the main Redis client
        console.log('Closing main Redis client...');
        if (redisClient && redisClient.status !== 'end') {
            try {
                await redisClient.quit();
                console.log('Main Redis client quit successfully.');
            } catch (e: any) { // Added type for e
                console.warn('Error quitting main Redis client:', e.message || e);
            }
        } else if (redisClient) {
            console.log('Main Redis client was not in a quittable state or already closed:', redisClient.status);
        } else {
            console.log('Main Redis client was not defined.');
        }

        // 6. Clean up DB
        console.log('Cleaning up database...');
        try {
            await prisma.gameParticipant.deleteMany({
                where: {
                    userId: { in: [player1?.id, player2?.id].filter(Boolean) }
                }
            });
            await prisma.gameInstance.deleteMany();
            await prisma.gameTemplate.deleteMany();
            // Delete StudentProfiles before Users to avoid foreign key constraint errors
            await prisma.studentProfile.deleteMany({ where: { id: { in: [player1?.id, player2?.id].filter(Boolean) } } });
            await prisma.user.deleteMany({ where: { username: { in: ['p1-extended', 'p2-extended'] } } });
            console.log('Database cleanup successful.');
        } catch (e: any) { // Added type for e
            console.error('Error during database cleanup:', e.message || e);
        }
        // Optionally clean up Redis keys for tournament (if a unique prefix is used)
        try {
            const keys = await redisClient.keys('mathquest:game:*');
            if (keys.length > 0) {
                await redisClient.del(keys);
                console.log('Tournament Redis keys cleaned up.');
            }
        } catch (e: any) {
            console.warn('Error cleaning up Redis keys:', e.message || e);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('afterAll cleanup complete.');
    }, 60000); // Keep increased timeout for afterAll hook

    it('P1 creates, P2 joins, both receive Q1', async () => {
        // Create template and game
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Extended Tournament Test 1',
                creatorId: player1.id,
                themes: ['algebra'],
                discipline: 'math',
                gradeLevel: 'middle',
                questions: { create: [{ questionUid: testQuestions[0].uid, sequence: 1 }] }
            }
        });
        const createRes = await request(address)
            .post('/api/v1/games')
            .send({ name: 'Test Tournament', playMode: 'tournament', gameTemplateId: gameTemplate.id, discipline: 'math', nbOfQuestions: 1 })
            .set('Authorization', `Bearer ${player1.token}`);
        expect(createRes.status).toBe(201);
        const accessCode1 = createRes.body.gameInstance.accessCode;
        // No need to manually initialize game state; backend now does this
        await wait(100); // Give backend time to persist state

        // Both join lobby (HTTP)
        await request(address).post(`/api/v1/games/${accessCode1}/join`).send({ userId: player1.id }).set('Authorization', `Bearer ${player1.token}`).expect(200);
        await request(address).post(`/api/v1/games/${accessCode1}/join`).send({ userId: player2.id }).set('Authorization', `Bearer ${player2.token}`).expect(200);

        // Connect sockets
        // Connect player 1
        socket1 = ioc(address, { auth: { token: player1.token }, path: '/api/socket.io', transports: ['websocket'], forceNew: true });
        // Connect player 2
        socket2 = ioc(address, { auth: { token: player2.token }, path: '/api/socket.io', transports: ['websocket'], forceNew: true });
        await Promise.all([
            new Promise<void>((res) => socket1.on('connect', () => res())),
            new Promise<void>((res) => socket2.on('connect', () => res())),
        ]);

        // Join tournament via socket
        socket1.emit('join_tournament', { accessCode: accessCode1, userId: player1.id, username: player1.username });
        socket2.emit('join_tournament', { accessCode: accessCode1, userId: player2.id, username: player2.username });
        await Promise.all([
            waitForEvent(socket1, 'game_joined'),
            waitForEvent(socket2, 'game_joined'),
        ]);

        // Start tournament
        await request(address)
            .put(`/api/v1/games/${createRes.body.gameInstance.id}/status`)
            .send({ status: 'active' })
            .set('Authorization', `Bearer ${player1.token}`)
            .expect(200);
        socket1.emit('start_tournament', { accessCode: accessCode1 });

        // Both should receive Q1
        const [q1p1, q1p2] = await Promise.all([
            waitForEvent(socket1, 'game_question', 10000),
            waitForEvent(socket2, 'game_question', 10000),
        ]);
        expect(q1p1.question.uid).toBe(testQuestions[0].uid);
        expect(q1p2.question.uid).toBe(testQuestions[0].uid);

        // Player 1 answers correctly, Player 2 answers incorrectly
        // correctAnswers is a boolean array, answerOptions is a string array
        const correctIndex = q1p1.question.correctAnswers.findIndex((v: boolean) => v);
        const correctAnswer = q1p1.question.answerOptions[correctIndex];
        // Pick a wrong answer (first option that is not correct)
        const wrongIndex = q1p1.question.correctAnswers.findIndex((v: boolean, idx: number) => !v && idx !== correctIndex);
        const wrongAnswer = q1p2.question.answerOptions[wrongIndex];
        expect(wrongAnswer).toBeDefined();

        socket1.emit('tournament_answer', {
            accessCode: accessCode1,
            userId: player1.id,
            questionUid: q1p1.question.uid,
            answer: correctAnswer,
            timeSpent: 2
        });
        socket2.emit('tournament_answer', {
            accessCode: accessCode1,
            userId: player2.id,
            questionUid: q1p2.question.uid,
            answer: wrongAnswer,
            timeSpent: 2
        });

        // Wait for correct_answers event from backend for both
        const [ca1, ca2] = await Promise.all([
            waitForEvent(socket1, 'correct_answers', 10000),
            waitForEvent(socket2, 'correct_answers', 10000),
        ]);

        // Print the raw leaderboard for debugging
        const leaderboardRes = await request(address)
            .get(`/api/v1/games/${accessCode1}/leaderboard`)
            .set('Authorization', `Bearer ${player1.token}`)
            .expect(200);
        // Print the raw leaderboard for debugging
        // eslint-disable-next-line no-console
        console.log('Leaderboard response:', JSON.stringify(leaderboardRes.body, null, 2));
        const leaderboard = leaderboardRes.body.leaderboard || leaderboardRes.body;
        const p1Entry = leaderboard.find((entry: any) => entry.userId === player1.id);
        const p2Entry = leaderboard.find((entry: any) => entry.userId === player2.id);
        expect(p1Entry).toBeDefined();
        expect(p2Entry).toBeDefined();
        expect(p1Entry.score).toBeGreaterThan(p2Entry.score);
    });

    it('P1 creates, P2 joins, backend sets the rhythm', async () => {
        // Create template and game
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Extended Tournament Test 2',
                creatorId: player1.id,
                themes: ['algebra'],
                discipline: 'math',
                gradeLevel: 'middle',
                questions: { create: [{ questionUid: testQuestions[0].uid, sequence: 1 }] }
            }
        });
        const createRes = await request(address)
            .post('/api/v1/games')
            .send({ name: 'Test Tournament', playMode: 'tournament', gameTemplateId: gameTemplate.id, discipline: 'math', nbOfQuestions: 1 })
            .set('Authorization', `Bearer ${player1.token}`);
        expect(createRes.status).toBe(201);
        const accessCode2 = createRes.body.gameInstance.accessCode;
        // No need to manually initialize game state; backend now does this
        await wait(100); // Give backend time to persist state

        // Both join lobby (HTTP)
        await request(address).post(`/api/v1/games/${accessCode2}/join`).send({ userId: player1.id }).set('Authorization', `Bearer ${player1.token}`).expect(200);
        await request(address).post(`/api/v1/games/${accessCode2}/join`).send({ userId: player2.id }).set('Authorization', `Bearer ${player2.token}`).expect(200);

        // Connect sockets
        // Connect player 1
        socket1 = ioc(address, { auth: { token: player1.token }, path: '/api/socket.io', transports: ['websocket'], forceNew: true });
        // Connect player 2
        socket2 = ioc(address, { auth: { token: player2.token }, path: '/api/socket.io', transports: ['websocket'], forceNew: true });
        await Promise.all([
            new Promise<void>((res) => socket1.on('connect', () => res())),
            new Promise<void>((res) => socket2.on('connect', () => res())),
        ]);

        // Join tournament via socket
        socket1.emit('join_tournament', { accessCode: accessCode2, userId: player1.id, username: player1.username });
        socket2.emit('join_tournament', { accessCode: accessCode2, userId: player2.id, username: player2.username });
        await Promise.all([
            waitForEvent(socket1, 'game_joined'),
            waitForEvent(socket2, 'game_joined'),
        ]);

        // Start tournament
        await request(address)
            .put(`/api/v1/games/${createRes.body.gameInstance.id}/status`)
            .send({ status: 'active' })
            .set('Authorization', `Bearer ${player1.token}`)
            .expect(200);
        socket1.emit('start_tournament', { accessCode: accessCode2 });

        // Wait for tournament_starting and countdown_complete
        await Promise.all([
            waitForEvent(socket1, 'tournament_starting', 5000),
            waitForEvent(socket2, 'tournament_starting', 5000),
        ]);
        await Promise.all([
            waitForEvent(socket1, 'countdown_complete', 7000),
            waitForEvent(socket2, 'countdown_complete', 7000),
        ]);

        // Both should receive Q1 after countdown_complete
        const [q1p1, q1p2] = await Promise.all([
            waitForEvent(socket1, 'game_question', 10000),
            waitForEvent(socket2, 'game_question', 10000),
        ]);
        expect(q1p1.question.uid).toBe(testQuestions[0].uid);
        expect(q1p2.question.uid).toBe(testQuestions[0].uid);

        // Player 1 answers correctly, Player 2 answers incorrectly
        // correctAnswers is a boolean array, answerOptions is a string array
        const correctIndex = q1p1.question.correctAnswers.findIndex((v: boolean) => v);
        const correctAnswer = q1p1.question.answerOptions[correctIndex];
        // Pick a wrong answer (first option that is not correct)
        const wrongIndex = q1p1.question.correctAnswers.findIndex((v: boolean, idx: number) => !v && idx !== correctIndex);
        const wrongAnswer = q1p2.question.answerOptions[wrongIndex];
        expect(wrongAnswer).toBeDefined();

        socket1.emit('tournament_answer', {
            accessCode: accessCode2,
            userId: player1.id,
            questionUid: q1p1.question.uid,
            answer: correctAnswer,
            timeSpent: 2
        });
        socket2.emit('tournament_answer', {
            accessCode: accessCode2,
            userId: player2.id,
            questionUid: q1p2.question.uid,
            answer: wrongAnswer,
            timeSpent: 2
        });

        // Wait for correct_answers event from backend for both
        const [ca1, ca2] = await Promise.all([
            waitForEvent(socket1, 'correct_answers', 10000),
            waitForEvent(socket2, 'correct_answers', 10000),
        ]);

        // Print the raw leaderboard for debugging
        const leaderboardRes = await request(address)
            .get(`/api/v1/games/${accessCode2}/leaderboard`)
            .set('Authorization', `Bearer ${player1.token}`)
            .expect(200);
        // Print the raw leaderboard for debugging
        // eslint-disable-next-line no-console
        console.log('Leaderboard response:', JSON.stringify(leaderboardRes.body, null, 2));
        const leaderboard = leaderboardRes.body.leaderboard || leaderboardRes.body;
        const p1Entry = leaderboard.find((entry: any) => entry.userId === player1.id);
        const p2Entry = leaderboard.find((entry: any) => entry.userId === player2.id);
        expect(p1Entry).toBeDefined();
        expect(p2Entry).toBeDefined();
        expect(p1Entry.score).toBeGreaterThan(p2Entry.score);
    });

    it('P1 creates, P2 joins, both play 2 questions with feedback checks', async () => {
        // Create template and game with two questions
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Extended Tournament Test 3 - Two Questions',
                creatorId: player1.id,
                themes: ['algebra'],
                discipline: 'math',
                gradeLevel: 'middle',
                questions: {
                    create: [
                        { questionUid: testQuestions[0].uid, sequence: 1 },
                        { questionUid: testQuestions[1].uid, sequence: 2 }
                    ]
                }
            }
        });
        const createRes = await request(address)
            .post('/api/v1/games')
            .send({ name: 'Test Tournament', playMode: 'tournament', gameTemplateId: gameTemplate.id, discipline: 'math', nbOfQuestions: 2 })
            .set('Authorization', `Bearer ${player1.token}`);
        expect(createRes.status).toBe(201);
        const accessCode1 = createRes.body.gameInstance.accessCode;
        await wait(100);

        // Both join lobby (HTTP)
        await request(address).post(`/api/v1/games/${accessCode1}/join`).send({ userId: player1.id }).set('Authorization', `Bearer ${player1.token}`).expect(200);
        await request(address).post(`/api/v1/games/${accessCode1}/join`).send({ userId: player2.id }).set('Authorization', `Bearer ${player2.token}`).expect(200);

        // Connect sockets
        socket1 = ioc(address, { auth: { token: player1.token }, path: '/api/socket.io', transports: ['websocket'], forceNew: true });
        socket2 = ioc(address, { auth: { token: player2.token }, path: '/api/socket.io', transports: ['websocket'], forceNew: true });
        await Promise.all([
            new Promise<void>((res) => socket1.on('connect', () => res())),
            new Promise<void>((res) => socket2.on('connect', () => res())),
        ]);

        // Join tournament via socket
        socket1.emit('join_tournament', { accessCode: accessCode1, userId: player1.id, username: player1.username });
        socket2.emit('join_tournament', { accessCode: accessCode1, userId: player2.id, username: player2.username });
        await Promise.all([
            waitForEvent(socket1, 'game_joined'),
            waitForEvent(socket2, 'game_joined'),
        ]);

        // Start tournament
        await request(address)
            .put(`/api/v1/games/${createRes.body.gameInstance.id}/status`)
            .send({ status: 'active' })
            .set('Authorization', `Bearer ${player1.token}`)
            .expect(200);
        socket1.emit('start_tournament', { accessCode: accessCode1 });

        // Both should receive Q1
        const [q1p1, q1p2] = await Promise.all([
            waitForEvent(socket1, 'game_question', 10000),
            waitForEvent(socket2, 'game_question', 10000),
        ]);
        expect(q1p1.question.uid).toBe(testQuestions[0].uid);
        expect(q1p2.question.uid).toBe(testQuestions[0].uid);

        // Player 1 answers correctly, Player 2 answers incorrectly for Q1
        const correctIndex1 = q1p1.question.correctAnswers.findIndex((v: boolean) => v);
        const correctAnswer1 = q1p1.question.answerOptions[correctIndex1];
        const wrongIndex1 = q1p1.question.correctAnswers.findIndex((v: boolean, idx: number) => !v && idx !== correctIndex1);
        const wrongAnswer1 = q1p2.question.answerOptions[wrongIndex1];
        expect(wrongAnswer1).toBeDefined();

        socket1.emit('tournament_answer', {
            accessCode: accessCode1,
            userId: player1.id,
            questionUid: q1p1.question.uid,
            answer: correctAnswer1,
            timeSpent: 2
        });
        socket2.emit('tournament_answer', {
            accessCode: accessCode1,
            userId: player2.id,
            questionUid: q1p2.question.uid,
            answer: wrongAnswer1,
            timeSpent: 2
        });

        // Wait for correct_answers event for Q1
        const [ca1, ca2] = await Promise.all([
            waitForEvent(socket1, 'correct_answers', 10000),
            waitForEvent(socket2, 'correct_answers', 10000),
        ]);
        expect(ca1.questionUid).toBe(testQuestions[0].uid);
        expect(ca2.questionUid).toBe(testQuestions[0].uid);

        // If feedback is expected for Q1, wait for feedback event
        if (q1p1.question.feedbackWaitTime && q1p1.question.feedbackWaitTime > 0) {
            const [fb1, fb2] = await Promise.all([
                waitForEvent(socket1, 'feedback', 10000),
                waitForEvent(socket2, 'feedback', 10000),
            ]);
            expect(fb1.questionUid).toBe(testQuestions[0].uid);
            expect(fb2.questionUid).toBe(testQuestions[0].uid);
        }

        // Wait for Q2 to arrive
        const [q2p1, q2p2] = await Promise.all([
            waitForEvent(socket1, 'game_question', 10000),
            waitForEvent(socket2, 'game_question', 10000),
        ]);
        expect(q2p1.question.uid).toBe(testQuestions[1].uid);
        expect(q2p2.question.uid).toBe(testQuestions[1].uid);

        // Player 1 answers incorrectly, Player 2 answers correctly for Q2
        const correctIndex2 = q2p2.question.correctAnswers.findIndex((v: boolean) => v);
        const correctAnswer2 = q2p2.question.answerOptions[correctIndex2];
        const wrongIndex2 = q2p2.question.correctAnswers.findIndex((v: boolean, idx: number) => !v && idx !== correctIndex2);
        const wrongAnswer2 = q2p1.question.answerOptions[wrongIndex2];
        expect(wrongAnswer2).toBeDefined();

        socket1.emit('tournament_answer', {
            accessCode: accessCode1,
            userId: player1.id,
            questionUid: q2p1.question.uid,
            answer: wrongAnswer2,
            timeSpent: 2
        });
        socket2.emit('tournament_answer', {
            accessCode: accessCode1,
            userId: player2.id,
            questionUid: q2p2.question.uid,
            answer: correctAnswer2,
            timeSpent: 2
        });

        // Wait for correct_answers event for Q2
        const [caQ2_1, caQ2_2] = await Promise.all([
            waitForEvent(socket1, 'correct_answers', 10000),
            waitForEvent(socket2, 'correct_answers', 10000),
        ]);
        expect(caQ2_1.questionUid).toBe(testQuestions[1].uid);
        expect(caQ2_2.questionUid).toBe(testQuestions[1].uid);

        // If feedback is expected for Q2, wait for feedback event
        if (q2p1.question.feedbackWaitTime && q2p1.question.feedbackWaitTime > 0) {
            const [fbQ2_1, fbQ2_2] = await Promise.all([
                waitForEvent(socket1, 'feedback', 10000),
                waitForEvent(socket2, 'feedback', 10000),
            ]);
            expect(fbQ2_1.questionUid).toBe(testQuestions[1].uid);
            expect(fbQ2_2.questionUid).toBe(testQuestions[1].uid);
        }
    });

    it('P3 joins after Q1 answers: receives Q1 with timer and correct_answers payload, cannot answer Q1', async () => {
        // Create template and game with two questions
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Late Join Tournament',
                creatorId: player1.id,
                themes: ['algebra'],
                discipline: 'math',
                gradeLevel: 'middle',
                questions: {
                    create: [
                        { questionUid: testQuestions[0].uid, sequence: 1 },
                        { questionUid: testQuestions[1].uid, sequence: 2 }
                    ]
                }
            }
        });
        const createRes = await request(address)
            .post('/api/v1/games')
            .send({ name: 'Test Tournament', playMode: 'tournament', gameTemplateId: gameTemplate.id, discipline: 'math', nbOfQuestions: 2 })
            .set('Authorization', `Bearer ${player1.token}`);
        expect(createRes.status).toBe(201);
        const accessCode1 = createRes.body.gameInstance.accessCode;
        await wait(100);

        // Both join lobby (HTTP)
        await request(address).post(`/api/v1/games/${accessCode1}/join`).send({ userId: player1.id }).set('Authorization', `Bearer ${player1.token}`).expect(200);
        await request(address).post(`/api/v1/games/${accessCode1}/join`).send({ userId: player2.id }).set('Authorization', `Bearer ${player2.token}`).expect(200);

        // Connect sockets for P1 and P2
        socket1 = ioc(address, { auth: { token: player1.token }, path: '/api/socket.io', transports: ['websocket'], forceNew: true });
        socket2 = ioc(address, { auth: { token: player2.token }, path: '/api/socket.io', transports: ['websocket'], forceNew: true });
        await Promise.all([
            new Promise<void>((res) => socket1.on('connect', () => res())),
            new Promise<void>((res) => socket2.on('connect', () => res())),
        ]);

        // Join tournament via socket
        socket1.emit('join_tournament', { accessCode: accessCode1, userId: player1.id, username: player1.username });
        socket2.emit('join_tournament', { accessCode: accessCode1, userId: player2.id, username: player2.username });
        await Promise.all([
            waitForEvent(socket1, 'game_joined'),
            waitForEvent(socket2, 'game_joined'),
        ]);

        // Start tournament
        await request(address)
            .put(`/api/v1/games/${createRes.body.gameInstance.id}/status`)
            .send({ status: 'active' })
            .set('Authorization', `Bearer ${player1.token}`)
            .expect(200);
        socket1.emit('start_tournament', { accessCode: accessCode1 });

        // Both should receive Q1
        const [q1p1, q1p2] = await Promise.all([
            waitForEvent(socket1, 'game_question', 10000),
            waitForEvent(socket2, 'game_question', 10000),
        ]);
        expect(q1p1.question.uid).toBe(testQuestions[0].uid);
        expect(q1p2.question.uid).toBe(testQuestions[0].uid);

        // Player 1 answers correctly, Player 2 answers incorrectly for Q1
        const correctIndex1 = q1p1.question.correctAnswers.findIndex((v: boolean) => v);
        const correctAnswer1 = q1p1.question.answerOptions[correctIndex1];
        const wrongIndex1 = q1p1.question.correctAnswers.findIndex((v: boolean, idx: number) => !v && idx !== correctIndex1);
        const wrongAnswer1 = q1p2.question.answerOptions[wrongIndex1];
        expect(wrongAnswer1).toBeDefined();

        socket1.emit('tournament_answer', {
            accessCode: accessCode1,
            userId: player1.id,
            questionUid: q1p1.question.uid,
            answer: correctAnswer1,
            timeSpent: 2
        });
        socket2.emit('tournament_answer', {
            accessCode: accessCode1,
            userId: player2.id,
            questionUid: q1p2.question.uid,
            answer: wrongAnswer1,
            timeSpent: 2
        });

        // Wait for correct_answers event for Q1
        const [ca1, ca2] = await Promise.all([
            waitForEvent(socket1, 'correct_answers', 10000),
            waitForEvent(socket2, 'correct_answers', 10000),
        ]);
        expect(ca1.questionUid).toBe(testQuestions[0].uid);
        expect(ca2.questionUid).toBe(testQuestions[0].uid);

        // Wait a short moment to ensure feedback phase is active (feedbackWaitTime is 2s)
        await new Promise(res => setTimeout(res, 250));

        // Now create player 3 and join during feedback phase
        const player3 = await prisma.user.create({ data: { username: 'p3', role: 'STUDENT', studentProfile: { create: { cookieId: 'cookie-p3' } } } });
        const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'mathquest_default_secret';
        const signToken = (user: any) => jwt.sign({ userId: user.id, username: user.username, role: user.role }, secret, { expiresIn: '1h' });
        const player3Token = signToken(player3);

        // Join lobby (HTTP)
        await request(address).post(`/api/v1/games/${accessCode1}/join`).send({ userId: player3.id }).set('Authorization', `Bearer ${player3Token}`).expect(200);

        // Connect socket for P3
        const socket3 = ioc(address, { auth: { token: player3Token }, path: '/api/socket.io', transports: ['websocket'], forceNew: true });
        await new Promise<void>((res) => socket3.on('connect', () => res()));

        // Join tournament via socket
        socket3.emit('join_tournament', { accessCode: accessCode1, userId: player3.id, username: player3.username });
        await waitForEvent(socket3, 'game_joined');

        // P3 should receive Q1 (with timer, etc), correct_answers, and feedback payloads
        const receivedPayloads: any[] = [];
        const collectPayload = (event: string) => (data: any) => receivedPayloads.push({ event, data });
        socket3.on('game_question', collectPayload('game_question'));
        socket3.on('correct_answers', collectPayload('correct_answers'));
        socket3.on('feedback', collectPayload('feedback'));

        // Wait for all 3 payloads (with timeout)
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('P3 did not receive all 3 payloads in time')), 5000);
            const check = () => {
                if (
                    receivedPayloads.find(p => p.event === 'game_question') &&
                    receivedPayloads.find(p => p.event === 'correct_answers') &&
                    receivedPayloads.find(p => p.event === 'feedback')
                ) {
                    clearTimeout(timeout);
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });

        // Validate payloads
        const qPayload = receivedPayloads.find(p => p.event === 'game_question');
        const caPayload = receivedPayloads.find(p => p.event === 'correct_answers');
        const fbPayload = receivedPayloads.find(p => p.event === 'feedback');
        expect(qPayload).toBeDefined();
        expect(caPayload).toBeDefined();
        expect(fbPayload).toBeDefined();
        expect(qPayload.data.question.uid).toBe(testQuestions[0].uid);
        expect(caPayload.data.questionUid).toBe(testQuestions[0].uid);
        expect(fbPayload.data.questionUid).toBe(testQuestions[0].uid);
        expect(typeof fbPayload.data.feedbackRemaining).toBe('number');
        expect(fbPayload.data.feedbackRemaining).toBeGreaterThanOrEqual(0);

        // Wait for feedback phase to finish for P1 (so test doesn't race ahead)
        await new Promise(resolve => setTimeout(resolve, 2500)); // Wait for feedback phase

        // Try to answer Q1 as P3 (should be refused by backend)
        let answerError: any = null;
        await new Promise<void>((resolve) => {
            socket3.once('answer_feedback', (data: any) => {
                answerError = data;
                resolve();
            });
            // Use static answer option from testQuestions[0]
            socket3.emit('tournament_answer', {
                accessCode: accessCode1,
                userId: player3.id,
                questionUid: qPayload.data.question.uid,
                answer: testQuestions[0].answerOptions[0], // use known answer
                timeSpent: 1
            });
            setTimeout(resolve, 1500);
        });
        expect(answerError).toBeTruthy();
        expect(answerError.status).toBe('error');
        expect(answerError.code).toBe('TIME_EXPIRED');
        // Optionally check error message
        // expect(answerError.message).toMatch(/timer|closed|not accepting/i);

        // Cleanup socket3 (inspired by disconnectSocket helper)
        socket3.removeAllListeners();
        if (socket3.connected) {
            try {
                await new Promise<void>((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        // eslint-disable-next-line no-console
                        console.warn('socket3 disconnect event timed out after 5000ms.');
                        reject(new Error('socket3 disconnect event timeout'));
                    }, 5000);
                    socket3.once('disconnect', (reason) => {
                        clearTimeout(timeoutId);
                        // eslint-disable-next-line no-console
                        console.log(`socket3 disconnected. Reason: ${reason || 'N/A'}`);
                        resolve();
                    });
                    socket3.disconnect();
                });
            } catch (e: any) {
                // eslint-disable-next-line no-console
                console.warn(`Error during socket3 graceful disconnect: ${e.message}. Attempting forceful disconnect.`);
                socket3.disconnect();
            }
        } else {
            socket3.disconnect();
        }
    });
});
