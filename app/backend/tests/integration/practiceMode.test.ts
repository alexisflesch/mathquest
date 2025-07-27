import { Server } from 'socket.io';
import ClientIO from 'socket.io-client';
import { startTestServer } from '../testSetup';
import { prisma } from '../../src/db/prisma';
import gameStateService from '../../src/core/services/gameStateService';
import jwt from 'jsonwebtoken';
import { QUESTION_TYPES } from '@shared/constants/questionTypes';

// Helper to wait for an event with timeout
const waitForEvent = (socket: ReturnType<typeof ClientIO>, event: string, timeoutMs = 10000): Promise<any> => {
    console.log(`Waiting for event: ${event} with timeout ${timeoutMs}ms`);
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            console.error(`🚨 Timeout waiting for event: ${event}`);
            reject(new Error(`Timeout waiting for event: ${event}`));
        }, timeoutMs);
        socket.once(event, (data: any) => {
            console.log(`✅ Event received: ${event}`, data);
            clearTimeout(timer);
            resolve(data);
        });
    });
};

describe('Self-Paced (Practice) Mode', () => {
    jest.setTimeout(30000); // Set Jest timeout to 30 seconds for this describe block

    let io: Server;
    let port: number;
    let serverCleanup: () => Promise<void>;
    let playerId = 'practice-player-1';
    let templateId: string;
    let gameInstanceId: string;
    let accessCode: string;
    let address: string;
    let playerToken: string;

    beforeAll(async () => {
        const setup = await startTestServer();
        io = setup.io;
        port = setup.port;
        serverCleanup = setup.cleanup;
        address = `http://localhost:${port}`;

        // Create player
        await prisma.user.upsert({
            where: { id: playerId },
            update: {},
            create: {
                id: playerId,
                username: 'Practice Player',
                role: 'STUDENT',
                studentProfile: { create: { cookieId: 'cookie-practice-player-1' } }
            }
        });
        // Generate JWT token for the player
        const secret = process.env.JWT_SECRET || 'mathquest_default_secret';
        playerToken = jwt.sign(
            { userId: playerId, username: 'Practice Player', role: 'STUDENT' },
            secret,
            { expiresIn: '1h' }
        );
        // Create a template and two questions
        const template = await prisma.gameTemplate.create({
            data: {
                name: 'Practice Template',
                creatorId: playerId,
                themes: ['math']
            }
        });
        templateId = template.id;
        const q1 = await prisma.question.create({
            data: {
                title: 'Practice Q1',
                text: 'What is 1+1?',
                questionType: QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                difficulty: 1,
                timeLimit: 20,
                discipline: 'math',
                themes: ['arithmetic'],
                answerOptions: ['1', '2', '3'],
                correctAnswers: [false, true, false],
                author: 'Practice Player'
            }
        });
        const q2 = await prisma.question.create({
            data: {
                title: 'Practice Q2',
                text: 'What is 2+2?',
                questionType: QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                difficulty: 1,
                timeLimit: 20,
                discipline: 'math',
                themes: ['arithmetic'],
                answerOptions: ['3', '4', '5'],
                correctAnswers: [false, true, false],
                author: 'Practice Player'
            }
        });
        await prisma.questionsInGameTemplate.create({
            data: { gameTemplateId: template.id, questionUid: q1.uid, sequence: 0 }
        });
        await prisma.questionsInGameTemplate.create({
            data: { gameTemplateId: template.id, questionUid: q2.uid, sequence: 1 }
        });
    });

    afterAll(async () => {
        await serverCleanup();
    }, 60000); // 60 second timeout

    test('Player can play a self-paced game and receive feedback and score', async () => {
        // 1. Player creates a self-paced game
        // (simulate API or DB call)
        const gameInstance = await prisma.gameInstance.create({
            data: {
                accessCode: 'PRACTICE1',
                playMode: 'practice',
                initiatorUserId: playerId,
                gameTemplateId: templateId, // changed from templateId
                name: 'Practice Game', // required field
                status: 'waiting' // required field, adjust if needed
            }
        });
        gameInstanceId = gameInstance.id;
        accessCode = gameInstance.accessCode;
        await prisma.gameParticipant.create({
            data: { gameInstanceId: gameInstanceId, userId: playerId }
        });
        await gameStateService.initializeGameState(gameInstanceId);

        // 2. Player connects and starts the game (no HTTP join for practice mode)
        // Debug: log all events
        console.log('Socket query params:', { token: playerToken, role: 'STUDENT' });
        const socket = ClientIO(address, {
            path: '/api/socket.io',
            transports: ['websocket'],
            forceNew: true,
            query: { // Correct way for testSetup.ts middleware
                token: playerToken,
                role: 'STUDENT'
            }
        });
        socket.onAny((event, ...args) => {
            console.log('[SOCKET EVENT]', event, args);
        });
        socket.on('game_error', (err) => {
            console.error('[SOCKET GAME_ERROR]', err);
        });
        socket.on('connect_error', (err) => {
            console.error('[SOCKET CONNECT_ERROR]', err);
        });

        // Explicitly listen for game_question for debugging
        socket.on('game_question', (data) => {
            console.log('[DIRECT LISTENER] game_question event received:', data);
        });
        // Wait for socket connection
        await new Promise<void>(res => socket.on('connect', () => res()));

        // Add additional debug
        console.log('Socket connected and ready to emit events, ID:', socket.id);

        // Join game (simulate join event if needed)
        // Player joins the game
        // Ensure a username is provided, matching the one in the token for consistency
        socket.emit('join_game', { accessCode, userId: playerId, username: 'Practice Player' });

        // Wait for game_joined event to confirm we're joined before starting
        await waitForEvent(socket, 'game_joined');
        console.log('Successfully received game_joined event, now starting game...');

        // Use socket emit with acknowledgement callback
        socket.emit('start_game', { accessCode, userId: playerId }, (ack: any) => {
            console.log('start_game event acknowledged:', ack);
        });
        // 3. Should receive first question
        const firstQPromise = new Promise<any>((resolve) => {
            socket.once('game_question', (data) => {
                console.log('✅ Direct handler for game_question event received:', data);
                resolve(data);
            });
        });

        // Emit start_game again just to be sure
        socket.emit('start_game', { accessCode, userId: playerId });
        console.log('Emitted start_game again to ensure it gets processed');

        // Wait for the promise to resolve
        const firstQ = await firstQPromise;
        console.log('Promise resolved with game_question data');
        expect(firstQ).toBeDefined();
        expect(firstQ.text).toContain('1+1');
        // 4. Answer first question
        socket.emit('game_answer', { accessCode, userId: playerId, questionUid: firstQ.uid, answer: 1, timeSpent: 1000 });
        const feedback1 = await waitForEvent(socket, 'answer_received');
        expect(feedback1.correct).toBe(true);

        // 5. Request next question
        socket.emit('request_next_question', { accessCode, userId: playerId, currentQuestionUid: firstQ.uid });

        // 6. Should receive second question
        const secondQ = await waitForEvent(socket, 'game_question');
        expect(secondQ.question.text).toContain('2+2');

        // 7. Answer second question
        console.log('Answering second question:', { accessCode, userId: playerId, questionUid: secondQ.question.uid, answer: 1, timeSpent: 1200 });
        socket.emit('game_answer', { accessCode, userId: playerId, questionUid: secondQ.question.uid, answer: 1, timeSpent: 1200 });
        const feedback2 = await waitForEvent(socket, 'answer_received');
        console.log('Received feedback for second question:', feedback2);
        expect(feedback2.correct).toBe(true);

        // Add specific listener for game_ended to debug
        let gameEndedReceived = false;
        socket.on('game_ended', (data) => {
            console.log('👀 DIRECT LISTENER: game_ended event received:', data);
            gameEndedReceived = true;
        });

        // 8. Explicitly request to proceed after the last question (player has reviewed feedback)
        console.log('Requesting to proceed after last question...');
        socket.emit('request_next_question', { accessCode, userId: playerId, currentQuestionUid: secondQ.uid });

        // 9. Should receive final score since there are no more questions
        console.log('Waiting for game_ended event after requesting next question...');
        const finalScore = await waitForEvent(socket, 'game_ended', 15000);  // Increase timeout to 15 seconds
        console.log('✅ Successfully received game_ended event:', finalScore);
        expect(finalScore.score).toBe(2);
        expect(finalScore.totalQuestions).toBe(2);
        expect(finalScore.correct).toBe(2);
        expect(finalScore.total).toBe(2);
        console.log('Test completed successfully, disconnecting socket');
        socket.disconnect();
    });
});
