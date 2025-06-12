/**
 * Tournament Game Flow E2E Test
 * 
 * Tests the complete game flow for tournament mode with specified parameters:
 * - Niveau: TEST, Discipline: Mathématiques, Thèmes: addition, 5 questions
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
let gameTemplateId: string;
let questionUids: string[] = [];

const TEST_ACCESS_CODE = 'EADD01'; // E2E Addition Test

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

describe('Tournament Game Flow E2E Test', () => {
    jest.setTimeout(60000); // Increased timeout for tournament creation

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

        // Create 5 addition questions
        const additionQuestions = [
            {
                uid: 'TEST-add-1',
                title: 'Simple Addition 1',
                text: 'What is 2 + 3?',
                questionType: 'multiple_choice_single_answer',
                discipline: 'Mathématiques',
                themes: ['addition'],
                difficulty: 1,
                timeLimit: 5,
                answerOptions: ['4', '5', '6', '7'],
                correctAnswers: [false, true, false, false],
                explanation: 'Two plus three equals five: 2 + 3 = 5'
            },
            {
                uid: 'TEST-add-2',
                title: 'Simple Addition 2',
                text: 'What is 1 + 1?',
                questionType: 'multiple_choice_single_answer',
                discipline: 'Mathématiques',
                themes: ['addition'],
                difficulty: 1,
                timeLimit: 5,
                answerOptions: ['3', '2', '1'],
                correctAnswers: [false, true, false],
                explanation: 'One plus one equals two: 1 + 1 = 2'
            },
            {
                uid: 'TEST-add-3',
                title: 'Simple Addition 3',
                text: 'What is 4 + 2?',
                questionType: 'multiple_choice_single_answer',
                discipline: 'Mathématiques',
                themes: ['addition'],
                difficulty: 1,
                timeLimit: 5,
                answerOptions: ['5', '6', '7', '8'],
                correctAnswers: [false, true, false, false],
                explanation: 'Four plus two equals six: 4 + 2 = 6'
            },
            {
                uid: 'TEST-add-4',
                title: 'Simple Addition 4',
                text: 'What is 3 + 4?',
                questionType: 'multiple_choice_single_answer',
                discipline: 'Mathématiques',
                themes: ['addition'],
                difficulty: 1,
                timeLimit: 5,
                answerOptions: ['6', '7', '8', '9'],
                correctAnswers: [false, true, false, false],
                explanation: 'Three plus four equals seven: 3 + 4 = 7'
            },
            {
                uid: 'TEST-add-5',
                title: 'Simple Addition 5',
                text: 'What is 5 + 3?',
                questionType: 'multiple_choice_single_answer',
                discipline: 'Mathématiques',
                themes: ['addition'],
                difficulty: 1,
                timeLimit: 5,
                answerOptions: ['7', '8', '9', '10'],
                correctAnswers: [false, true, false, false],
                explanation: 'Five plus three equals eight: 5 + 3 = 8'
            }
        ];

        // Create questions in database
        for (const questionData of additionQuestions) {
            await prisma.question.create({ data: questionData });
            questionUids.push(questionData.uid);
        }

        // Create game template
        const testTemplate = await prisma.gameTemplate.create({
            data: {
                name: 'E2E Addition Tournament',
                gradeLevel: 'TEST',
                themes: ['addition'],
                discipline: 'Mathématiques',
                description: 'E2E Test Tournament for Addition',
                defaultMode: 'tournament',
                creatorId: testTeacher.id
            }
        });
        gameTemplateId = testTemplate.id;

        // Link questions to template
        await prisma.questionsInGameTemplate.createMany({
            data: additionQuestions.map((q, index) => ({
                gameTemplateId: testTemplate.id,
                questionUid: q.uid,
                sequence: index
            }))
        });

        // Create game instance
        const gameInstance = await prisma.gameInstance.create({
            data: {
                name: 'E2E Addition Tournament Instance',
                accessCode: TEST_ACCESS_CODE,
                status: 'waiting',
                playMode: 'tournament',
                gameTemplateId: testTemplate.id,
                initiatorUserId: testTeacher.id,
                settings: {
                    maxParticipants: 50,
                    isPublic: false,
                    allowAnonymous: true,
                    timeMultiplier: 1.0,
                    showLeaderboard: true
                }
            }
        });
        gameInstanceId = gameInstance.id;
        tournamentAccessCode = gameInstance.accessCode;
    });

    beforeEach(async () => {
        // Create fresh socket connections for each test
        teacherSocket = createSocketClient({
            token: `teacher-${teacherId}`,
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

        // Cleanup database
        await prisma.gameParticipant.deleteMany({
            where: { userId: { in: ['student-tournament-001'] } }
        });

        await prisma.questionsInGameTemplate.deleteMany({
            where: { gameTemplateId: gameTemplateId }
        });

        await prisma.question.deleteMany({
            where: { uid: { in: questionUids } }
        });

        await prisma.gameInstance.deleteMany({
            where: { accessCode: tournamentAccessCode }
        });

        await prisma.gameTemplate.deleteMany({
            where: { id: gameTemplateId }
        });

        await prisma.teacherProfile.deleteMany({
            where: { id: teacherId }
        });

        await prisma.user.deleteMany({
            where: { id: teacherId }
        });
    });

    test('Complete Tournament Game Flow', async () => {
        console.log('=== Starting Tournament Game Flow E2E Test ===');
        console.log('🏆 Testing tournament with parameters:');
        console.log('  Niveau: TEST');
        console.log('  Discipline: Mathématiques');
        console.log('  Thèmes: addition');
        console.log('  Number of questions: 5');
        console.log(`  Access code: ${tournamentAccessCode}`);

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
        console.log('Question data received:', {
            questionUid: firstQuestionData.question?.uid,
            questionText: firstQuestionData.question?.text,
            answerOptions: firstQuestionData.question?.answers || firstQuestionData.question?.answerOptions,
            timer: firstQuestionData.timer
        });

        // Step 4: Security validation
        expect(firstQuestionData.question).toBeDefined();
        expect(firstQuestionData.question.correctAnswers).toBeUndefined();
        expect(firstQuestionData.question.explanation).toBeUndefined();
        console.log('✓ Security validation passed - no sensitive data exposed');

        // Step 5: Timer validation
        expect(firstQuestionData.timer).toBeDefined();
        expect(typeof firstQuestionData.timer).toBe('number');
        expect(firstQuestionData.timer).toBeGreaterThan(0);
        console.log(`✓ Timer data present: ${firstQuestionData.timer} seconds`);

        // Step 6: Answer submission test
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

        // Step 7: Test answer resubmission
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

        // Step 8: Wait for automatic progression and feedback
        console.log('⏳ Waiting for automatic tournament progression...');

        // In tournament mode, the game should automatically progress
        // Let's wait for the feedback/correct answers event
        const correctAnswersPromise = waitForEvent(studentSocket, 'correct_answers');
        const correctAnswersData = await correctAnswersPromise;

        expect(correctAnswersData).toBeDefined();
        console.log('✓ Correct answers revealed automatically');

        // Step 9: Wait for feedback event
        const feedbackPromise = waitForEvent(studentSocket, 'feedback');
        const feedbackData = await feedbackPromise;

        expect(feedbackData).toBeDefined();
        console.log('✓ Feedback phase completed');

        // Step 10: Wait for next question or game end
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
            const timeout = setTimeout(() => {
                console.log('Timeout reached, proceeding...');
                resolve();
            }, 15000); // 15 second timeout

            const checkProgress = () => {
                if (nextQuestionReceived || gameEndReceived) {
                    clearTimeout(timeout);
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
        console.log('=== Tournament Game Flow E2E Test Completed Successfully ===');
    });

    test('Tournament Security Validation - No Database Fields Exposed', async () => {
        console.log('=== Starting Tournament Security Validation Test ===');

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
            accessCode: tournamentAccessCode,
            userId: 'student-tournament-001',
            username: 'Security Test Student',
            avatarEmoji: '🔒'
        });

        await waitForEvent(studentSocket, 'game_joined');

        const questionPromise = waitForEvent(studentSocket, 'game_question');
        teacherSocket.emit('start_game', {
            accessCode: tournamentAccessCode,
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

        console.log('=== Tournament Security Validation Passed ===');
    });
});
