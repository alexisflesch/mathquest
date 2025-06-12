/**
 * Tournament Creation and Game Flow E2E Test
 * 
 * Creates a tournament with specific parameters then tests the complete game flow:
 * - Tournament creation via API
 * - Security validation (no sensitive data exposure)
 * - Timer functionality
 * - Answer submission and resubmission
 * - Correct answer highlighting
 * - Feedback display with explanations
 * - Game end handling and redirection
 */

import { Server } from 'socket.io';
import ClientIO from 'socket.io-client';
import { startTestServer } from '../testSetup';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';

// Global test variables
let io: Server;
let teacherSocket: ReturnType<typeof ClientIO>;
let studentSocket: ReturnType<typeof ClientIO>;
let port: number;
let serverCleanup: () => Promise<void>;

// Variables to store test data
let gameInstanceId: string;
let tournamentAccessCode: string;
let teacherId: string;
let teacherToken: string;

// Helper functions
const waitForEvent = (socket: ReturnType<typeof ClientIO>, event: string): Promise<any> => {
    return new Promise((resolve) => {
        socket.once(event, (data: any) => {
            resolve(data);
        });
    });
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createSocketClient = (auth: any) => {
    return ClientIO(`http://localhost:${port}`, {
        forceNew: true,
        auth,
        timeout: 5000,
        transports: ['websocket']
    });
};

describe('Tournament Creation and Game Flow E2E Test', () => {
    jest.setTimeout(35000); // Test should complete within 15 seconds

    beforeAll(async () => {
        // Start test server
        const setup = await startTestServer();
        io = setup.io;
        port = setup.port;
        serverCleanup = setup.cleanup;

        // Create test teacher
        const testTeacher = await prisma.user.create({
            data: {
                username: 'tournament-teacher',
                email: 'tournament-teacher@test.com',
                passwordHash: 'hashed_password_123',
                role: 'TEACHER',
                teacherProfile: {
                    create: {}
                }
            }
        });
        teacherId = testTeacher.id;
        teacherToken = `teacher-${teacherId}`;

        // Create test questions for addition theme
        const question1 = await prisma.question.create({
            data: {
                title: 'Addition Simple 1',
                text: '5 + 3 = ?',
                questionType: 'multiple_choice_single_answer',
                difficulty: 1,
                timeLimit: 15,
                discipline: 'Mathématiques',
                themes: ['addition'],
                answerOptions: ['6', '8', '9', '10'],
                correctAnswers: [false, true, false, false],
                explanation: 'Cinq plus trois égale huit',
                author: testTeacher.username,
                gradeLevel: 'TEST'
            }
        });

        const question2 = await prisma.question.create({
            data: {
                title: 'Addition Simple 2',
                text: '7 + 2 = ?',
                questionType: 'multiple_choice_single_answer',
                difficulty: 1,
                timeLimit: 15,
                discipline: 'Mathématiques',
                themes: ['addition'],
                answerOptions: ['8', '9', '10', '11'],
                correctAnswers: [false, true, false, false],
                explanation: 'Sept plus deux égale neuf',
                author: testTeacher.username,
                gradeLevel: 'TEST'
            }
        });

        // Create game template
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Test Tournament - Addition',
                gradeLevel: 'TEST',
                themes: ['addition'],
                discipline: 'Mathématiques',
                description: 'E2E Test Tournament for Addition',
                defaultMode: 'tournament',
                creatorId: testTeacher.id
            }
        });

        // Link questions to template
        await prisma.questionsInGameTemplate.createMany({
            data: [
                {
                    gameTemplateId: gameTemplate.id,
                    questionUid: question1.uid,
                    sequence: 0
                },
                {
                    gameTemplateId: gameTemplate.id,
                    questionUid: question2.uid,
                    sequence: 1
                }
            ]
        });

        // Create game instance (tournament) with a specific access code
        tournamentAccessCode = 'TEST123';
        const gameInstance = await prisma.gameInstance.create({
            data: {
                name: 'Test Tournament - Addition',
                accessCode: tournamentAccessCode,
                status: 'waiting',
                playMode: 'tournament',
                gameTemplateId: gameTemplate.id,
                initiatorUserId: testTeacher.id,
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true,
                    maxParticipants: 50,
                    isPublic: false,
                    allowAnonymous: true
                }
            }
        });
        gameInstanceId = gameInstance.id;
    });

    beforeEach(async () => {
        // Create fresh socket connections for each test
        teacherSocket = createSocketClient({
            token: teacherToken,
            role: 'teacher',
            userId: teacherId
        });

        studentSocket = createSocketClient({
            token: 'student-tournament-001',
            role: 'player',
            userId: 'student-tournament-001'
        });
    });

    afterEach(async () => {
        // Cleanup sockets
        if (teacherSocket?.connected) teacherSocket.disconnect();
        if (studentSocket?.connected) studentSocket.disconnect();

        // Clear Redis game state
        if (tournamentAccessCode) {
            const keys = await redisClient.keys(`mathquest:game:*${tournamentAccessCode}*`);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        }
    });

    afterAll(async () => {
        await serverCleanup();

        // Cleanup database in proper order
        await prisma.gameParticipant.deleteMany({
            where: { userId: { in: ['student-tournament-001'] } }
        });

        await prisma.gameInstance.deleteMany({
            where: { accessCode: tournamentAccessCode }
        });

        await prisma.questionsInGameTemplate.deleteMany({
            where: { gameTemplate: { name: 'Test Tournament - Addition' } }
        });

        await prisma.gameTemplate.deleteMany({
            where: { name: 'Test Tournament - Addition' }
        });

        await prisma.question.deleteMany({
            where: {
                OR: [
                    { text: '5 + 3 = ?' },
                    { text: '7 + 2 = ?' }
                ]
            }
        });

        await prisma.teacherProfile.deleteMany({
            where: {
                user: {
                    username: 'tournament-teacher'
                }
            }
        });

        await prisma.user.deleteMany({
            where: { username: 'tournament-teacher' }
        });
    });

    test('Create Tournament and Run Complete Game Flow', async () => {
        console.log('=== Starting Tournament Creation and Game Flow E2E Test ===');
        console.log(`🏆 Tournament created in database with access code: ${tournamentAccessCode}`);
        console.log('  Niveau: TEST');
        console.log('  Discipline: Mathématiques');
        console.log('  Thèmes: addition');
        console.log('  Number of questions: 2');

        // Step 1: Connect sockets and join game
        teacherSocket.connect();
        studentSocket.connect();

        await waitForEvent(teacherSocket, 'connect');
        await waitForEvent(studentSocket, 'connect');

        console.log('✓ Both sockets connected');

        // Step 2: Student joins tournament
        const studentJoinPromise = waitForEvent(studentSocket, 'game_joined');
        studentSocket.emit('join_game', {
            accessCode: tournamentAccessCode,
            userId: 'student-tournament-001',
            username: 'E2E Tournament Student',
            avatarEmoji: '🧮'
        });

        const joinResponse = await studentJoinPromise;
        expect(joinResponse.accessCode).toBe(tournamentAccessCode);
        console.log('✓ Student successfully joined tournament');

        // Step 3: Teacher starts the tournament
        console.log('🚀 Starting tournament...');

        // Monitor for first question
        const firstQuestionPromise = waitForEvent(studentSocket, 'game_question');

        teacherSocket.emit('start_game', {
            accessCode: tournamentAccessCode,
            gameType: 'tournament'
        });

        // Wait for first question to arrive
        const firstQuestionData = await firstQuestionPromise;
        console.log('✓ First question received by student');

        // Step 5: Security validation
        expect(firstQuestionData.question).toBeDefined();
        expect(firstQuestionData.question.correctAnswers).toBeUndefined();
        expect(firstQuestionData.question.explanation).toBeUndefined();
        expect(firstQuestionData.question.text).toContain('addition'); // Should be an addition question
        console.log('✓ Security validation passed - no sensitive data exposed');

        // Step 6: Timer validation
        expect(firstQuestionData.timer).toBeDefined();
        expect(typeof firstQuestionData.timer).toBe('number');
        expect(firstQuestionData.timer).toBeGreaterThan(0);
        console.log(`✓ Timer data present: ${firstQuestionData.timer} seconds`);

        // Step 7: Answer submission test
        const answerPromise = waitForEvent(studentSocket, 'answer_received');
        studentSocket.emit('game_answer', {
            accessCode: tournamentAccessCode,
            userId: 'student-tournament-001',
            questionUid: firstQuestionData.question.uid,
            answer: [0], // First option
            timeTakenMs: 3000
        });

        const answerResponse = await answerPromise;
        expect(answerResponse.success).toBe(true);
        console.log('✓ Answer submitted successfully');

        // Step 8: Test answer resubmission
        const resubmitPromise = waitForEvent(studentSocket, 'answer_received');
        studentSocket.emit('game_answer', {
            accessCode: tournamentAccessCode,
            userId: 'student-tournament-001',
            questionUid: firstQuestionData.question.uid,
            answer: [1], // Change to second option
            timeTakenMs: 5000
        });

        const resubmitResponse = await resubmitPromise;
        expect(resubmitResponse.success).toBe(true);
        console.log('✓ Answer resubmission successful');

        // Step 9: Wait for automatic progression and feedback
        console.log('⏳ Waiting for automatic tournament progression...');

        // In tournament mode, the game should automatically progress
        // Let's wait for the feedback/correct answers event
        const correctAnswersPromise = waitForEvent(studentSocket, 'correct_answers');
        const correctAnswersData = await correctAnswersPromise;

        expect(correctAnswersData).toBeDefined();
        console.log('✓ Correct answers revealed automatically');

        // Step 10: Wait for feedback event
        const feedbackPromise = waitForEvent(studentSocket, 'feedback');
        const feedbackData = await feedbackPromise;

        expect(feedbackData).toBeDefined();
        console.log('✓ Feedback phase completed');

        // Step 11: Wait for next question or game end
        console.log('⏳ Waiting for next question or game end...');

        // Set up listeners for both possibilities
        let nextQuestionReceived = false;
        let gameEndReceived = false;

        const nextQuestionListener = (data: any) => {
            nextQuestionReceived = true;
            console.log(`✓ Question ${data.index + 1} received`);
        };

        const gameEndListener = (data: any) => {
            gameEndReceived = true;
            console.log('✓ Tournament completed');
        };

        studentSocket.on('game_question', nextQuestionListener);
        studentSocket.on('game_end', gameEndListener);

        // Wait for at least one more progression event (either next question or game end)
        await new Promise<void>((resolve) => {
            const checkProgress = () => {
                if (nextQuestionReceived || gameEndReceived) {
                    resolve();
                } else {
                    setTimeout(checkProgress, 1000);
                }
            };
            checkProgress();
        });

        // Clean up listeners
        studentSocket.off('game_question', nextQuestionListener);
        studentSocket.off('game_end', gameEndListener);

        console.log('✓ Tournament progression working correctly');
        console.log('=== Tournament Creation and Game Flow E2E Test Completed Successfully ===');
    });

    test('Tournament Security Validation - No Database Fields Exposed', async () => {
        console.log('=== Starting Tournament Security Validation Test ===');

        // Create another tournament for isolated security testing
        const securityQuestion = await prisma.question.create({
            data: {
                title: 'Security Test Addition',
                text: '2 + 2 = ?',
                questionType: 'multiple_choice_single_answer',
                difficulty: 1,
                timeLimit: 10,
                discipline: 'Mathématiques',
                themes: ['addition'],
                answerOptions: ['3', '4', '5', '6'],
                correctAnswers: [false, true, false, false],
                explanation: 'Deux plus deux égale quatre',
                author: 'tournament-teacher',
                gradeLevel: 'TEST'
            }
        });

        const securityTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'Security Test Tournament',
                gradeLevel: 'TEST',
                themes: ['addition'],
                discipline: 'Mathématiques',
                description: 'Security validation tournament',
                defaultMode: 'tournament',
                creatorId: teacherId
            }
        });

        await prisma.questionsInGameTemplate.create({
            data: {
                gameTemplateId: securityTemplate.id,
                questionUid: securityQuestion.uid,
                sequence: 0
            }
        });

        const securityAccessCode = 'SEC123';
        await prisma.gameInstance.create({
            data: {
                name: 'Security Test Tournament',
                accessCode: securityAccessCode,
                status: 'waiting',
                playMode: 'tournament',
                gameTemplateId: securityTemplate.id,
                initiatorUserId: teacherId,
                settings: {
                    timeMultiplier: 1.0,
                    showLeaderboard: true,
                    maxParticipants: 10,
                    isPublic: false,
                    allowAnonymous: true
                }
            }
        });

        studentSocket.connect();
        teacherSocket.connect();

        await waitForEvent(studentSocket, 'connect');
        await waitForEvent(teacherSocket, 'connect');

        // Monitor all events for security leaks
        const receivedEvents: Array<{ event: string, data: any }> = [];
        studentSocket.onAny((event, data) => {
            receivedEvents.push({ event, data });
        });

        // Join and start tournament
        studentSocket.emit('join_game', {
            accessCode: securityAccessCode,
            userId: 'student-tournament-001',
            username: 'Security Test Student',
            avatarEmoji: '🔒'
        });

        await waitForEvent(studentSocket, 'game_joined');

        const questionPromise = waitForEvent(studentSocket, 'game_question');
        teacherSocket.emit('start_game', {
            accessCode: securityAccessCode,
            gameType: 'tournament'
        });

        await questionPromise;

        // Check all received events for security leaks
        const problematicEvents = receivedEvents.filter(({ event, data }) => {
            if (event === 'game_question' && data.question) {
                return (
                    data.question.correctAnswers !== undefined ||
                    data.question.explanation !== undefined ||
                    data.question.id !== undefined ||
                    data.question.createdAt !== undefined ||
                    data.question.updatedAt !== undefined ||
                    data.question.author !== undefined
                );
            }
            return false;
        });

        expect(problematicEvents).toHaveLength(0);
        console.log('✓ No sensitive data found in tournament events');

        // Cleanup security test tournament
        await prisma.gameInstance.deleteMany({
            where: { accessCode: securityAccessCode }
        });

        await prisma.questionsInGameTemplate.deleteMany({
            where: { gameTemplate: { name: 'Security Test Tournament' } }
        });

        await prisma.gameTemplate.deleteMany({
            where: { name: 'Security Test Tournament' }
        });

        await prisma.question.deleteMany({
            where: { text: '2 + 2 = ?' }
        });

        console.log('=== Tournament Security Validation Passed ===');
    });
});
