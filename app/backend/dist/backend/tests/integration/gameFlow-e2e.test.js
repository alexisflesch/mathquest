"use strict";
/**
 * End-to-End Game Flow Test
 *
 * Tests the complete game flow from student perspective including:
 * - Security validation (no sensitive data exposure)
 * - Timer functionality
 * - Answer submission and resubmission
 * - Correct answer highlighting
 * - Feedback display with explanations
 * - Game end handling and redirection
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const testSetup_1 = require("../testSetup");
const prisma_1 = require("../../src/db/prisma");
const redis_1 = require("../../src/config/redis");
const questionTypes_1 = require("@shared/constants/questionTypes");
// Global test variables
let io;
let teacherSocket;
let studentSocket;
let port;
let serverCleanup;
// Variables to store test data
let gameInstanceId;
let question1Uid;
let question2Uid;
let teacherId;
const TEST_ACCESS_CODE = 'E2E001';
// Helper functions
const waitForEvent = (socket, event) => {
    return new Promise((resolve) => {
        socket.once(event, (data) => {
            resolve(data);
        });
    });
};
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const createSocketClient = (auth) => {
    return (0, socket_io_client_1.default)(`http://localhost:${port}`, {
        forceNew: true,
        auth,
        timeout: 5000,
        transports: ['websocket']
    });
};
describe('Game Flow E2E Test', () => {
    jest.setTimeout(30000);
    beforeAll(async () => {
        // Start test server
        const setup = await (0, testSetup_1.startTestServer)();
        io = setup.io;
        port = setup.port;
        serverCleanup = setup.cleanup;
        // Create test teacher
        const testTeacher = await prisma_1.prisma.user.create({
            data: {
                username: 'e2e-teacher',
                email: 'e2e-teacher@test.com',
                role: 'TEACHER',
                teacherProfile: {
                    create: {}
                }
            }
        });
        teacherId = testTeacher.id;
        // Create quiz template
        const testTemplate = await prisma_1.prisma.gameTemplate.create({
            data: {
                name: 'E2E Test Quiz',
                creatorId: testTeacher.id,
                themes: ['math']
            }
        });
        // Create test questions with detailed content
        const question1 = await prisma_1.prisma.question.create({
            data: {
                title: 'Basic Addition',
                text: 'What is 5 + 3?',
                questionType: questionTypes_1.QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                difficulty: 1,
                timeLimit: 15,
                discipline: 'math',
                themes: ['arithmetic'],
                answerOptions: ['6', '8', '9', '10'],
                correctAnswers: [false, true, false, false],
                explanation: 'Five plus three equals eight because 5 + 3 = 8',
                author: testTeacher.username
            }
        });
        question1Uid = question1.uid;
        const question2 = await prisma_1.prisma.question.create({
            data: {
                title: 'Simple Multiplication',
                text: 'What is 4 × 2?',
                questionType: questionTypes_1.QUESTION_TYPES.MULTIPLE_CHOICE_SINGLE_ANSWER,
                difficulty: 1,
                timeLimit: 10,
                discipline: 'math',
                themes: ['arithmetic'],
                answerOptions: ['6', '8', '10', '12'],
                correctAnswers: [false, true, false, false],
                explanation: 'Four times two equals eight: 4 × 2 = 8',
                author: testTeacher.username
            }
        });
        question2Uid = question2.uid;
        // Link questions to template
        await prisma_1.prisma.questionsInGameTemplate.createMany({
            data: [
                {
                    gameTemplateId: testTemplate.id,
                    questionUid: question1.uid,
                    sequence: 0
                },
                {
                    gameTemplateId: testTemplate.id,
                    questionUid: question2.uid,
                    sequence: 1
                }
            ]
        });
        // Create game instance
        const gameInstance = await prisma_1.prisma.gameInstance.create({
            data: {
                name: 'E2E Test Game',
                accessCode: TEST_ACCESS_CODE,
                status: 'waiting',
                playMode: 'quiz',
                gameTemplateId: testTemplate.id,
                initiatorUserId: testTeacher.id,
                settings: {
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
            token: `teacher-${teacherId}`,
            role: 'teacher',
            userId: teacherId
        });
        studentSocket = createSocketClient({
            token: 'student-e2e-001',
            role: 'player',
            userId: 'student-e2e-001'
        });
    });
    afterEach(async () => {
        // Cleanup sockets
        if (teacherSocket?.connected)
            teacherSocket.disconnect();
        if (studentSocket?.connected)
            studentSocket.disconnect();
        // Clear Redis game state
        const keys = await redis_1.redisClient.keys(`mathquest:game:*${TEST_ACCESS_CODE}*`);
        if (keys.length > 0) {
            await redis_1.redisClient.del(keys);
        }
    });
    afterAll(async () => {
        await serverCleanup();
        // Cleanup database in proper order
        await prisma_1.prisma.gameParticipant.deleteMany({
            where: { userId: { in: ['student-e2e-001'] } }
        });
        await prisma_1.prisma.gameInstance.deleteMany({
            where: { accessCode: TEST_ACCESS_CODE }
        });
        await prisma_1.prisma.questionsInGameTemplate.deleteMany({
            where: { gameTemplate: { name: 'E2E Test Quiz' } }
        });
        await prisma_1.prisma.gameTemplate.deleteMany({
            where: { name: 'E2E Test Quiz' }
        });
        await prisma_1.prisma.question.deleteMany({
            where: {
                text: { in: ['What is 5 + 3?', 'What is 4 × 2?'] }
            }
        });
        await prisma_1.prisma.teacherProfile.deleteMany({
            where: { id: teacherId }
        });
        await prisma_1.prisma.user.deleteMany({
            where: { username: 'e2e-teacher' }
        });
    });
    test('Complete Game Flow - Security, Timer, Answers, Feedback', async () => {
        console.log('=== Starting Complete Game Flow E2E Test ===');
        // Connect sockets
        teacherSocket.connect();
        studentSocket.connect();
        await waitForEvent(teacherSocket, 'connect');
        await waitForEvent(studentSocket, 'connect');
        console.log('✓ Both sockets connected');
        // Student joins game
        const studentJoinPromise = waitForEvent(studentSocket, 'game_joined');
        studentSocket.emit('join_game', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'student-e2e-001',
            username: 'E2E Student',
            avatarEmoji: '🧪'
        });
        const joinResponse = await studentJoinPromise;
        expect(joinResponse.accessCode).toBe(TEST_ACCESS_CODE);
        console.log('✓ Student successfully joined game');
        // Teacher starts the game and first question
        teacherSocket.emit('start_game', { accessCode: TEST_ACCESS_CODE });
        // Wait for game_question event on student socket
        const questionPromise = waitForEvent(studentSocket, 'game_question');
        // Teacher sets the first question
        teacherSocket.emit('set_question', {
            accessCode: TEST_ACCESS_CODE,
            questionUid: question1Uid
        });
        const questionData = await questionPromise;
        console.log('✓ Student received game_question event');
        // SECURITY TEST: Verify no sensitive data is exposed
        expect(questionData.question).toBeDefined();
        expect(questionData.question.correctAnswers).toBeUndefined();
        expect(questionData.question.explanation).toBeUndefined();
        expect(questionData.question.uid).toBe(question1Uid);
        expect(questionData.question.text).toBe('What is 5 + 3?');
        expect(questionData.question.answers).toEqual(['6', '8', '9', '10']);
        console.log('✓ Security validation passed - no sensitive data exposed');
        // TIMER TEST: Verify timer data is included
        expect(questionData.timer).toBeDefined();
        expect(typeof questionData.timer).toBe('number');
        expect(questionData.timer).toBeGreaterThan(0);
        console.log(`✓ Timer data present: ${questionData.timer} seconds`);
        // ANSWER SUBMISSION TEST: Submit initial answer
        const answerPromise = waitForEvent(studentSocket, 'answer_received');
        studentSocket.emit('game_answer', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'student-e2e-001',
            questionUid: question1Uid,
            answer: [0], // Wrong answer initially (index 0 = "6")
            timeTakenMs: 3000
        });
        const answerResponse = await answerPromise;
        expect(answerResponse.success).toBe(true);
        console.log('✓ Initial answer submitted successfully');
        // RESUBMISSION TEST: Change answer (should be allowed until timer ends)
        const resubmitPromise = waitForEvent(studentSocket, 'answer_received');
        studentSocket.emit('game_answer', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'student-e2e-001',
            questionUid: question1Uid,
            answer: [1], // Correct answer (index 1 = "8")
            timeTakenMs: 5000
        });
        const resubmitResponse = await resubmitPromise;
        expect(resubmitResponse.success).toBe(true);
        console.log('✓ Answer resubmission successful');
        // FEEDBACK AND CORRECT ANSWER TEST: Teacher shows results
        const feedbackPromise = waitForEvent(studentSocket, 'game_feedback');
        teacherSocket.emit('show_results', {
            accessCode: TEST_ACCESS_CODE,
            questionUid: question1Uid
        });
        const feedbackData = await feedbackPromise;
        expect(feedbackData).toBeDefined();
        expect(feedbackData.correctAnswers).toBeDefined();
        expect(feedbackData.explanation).toBe('Five plus three equals eight because 5 + 3 = 8');
        console.log('✓ Feedback received with correct answers and explanation');
        // NEXT QUESTION TEST: Move to second question
        const nextQuestionPromise = waitForEvent(studentSocket, 'game_question');
        teacherSocket.emit('set_question', {
            accessCode: TEST_ACCESS_CODE,
            questionUid: question2Uid
        });
        const question2Data = await nextQuestionPromise;
        expect(question2Data.question.uid).toBe(question2Uid);
        expect(question2Data.question.text).toBe('What is 4 × 2?');
        expect(question2Data.timer).toBe(10); // Should be 10 seconds for question 2
        console.log('✓ Second question received successfully');
        // Submit answer for second question
        const answer2Promise = waitForEvent(studentSocket, 'answer_received');
        studentSocket.emit('game_answer', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'student-e2e-001',
            questionUid: question2Uid,
            answer: [1], // Correct answer (index 1 = "8")
            timeTakenMs: 2500
        });
        const answer2Response = await answer2Promise;
        expect(answer2Response.success).toBe(true);
        console.log('✓ Second question answered successfully');
        // GAME END TEST: Teacher ends the game
        const gameEndPromise = waitForEvent(studentSocket, 'game_ended');
        teacherSocket.emit('end_game', {
            accessCode: TEST_ACCESS_CODE
        });
        const gameEndData = await gameEndPromise;
        expect(gameEndData).toBeDefined();
        expect(gameEndData.finalResults).toBeDefined();
        console.log('✓ Game end event received with final results');
        console.log('=== E2E Test Completed Successfully ===');
    });
    test('Security Validation - Raw Database Objects Not Exposed', async () => {
        console.log('=== Starting Security Validation Test ===');
        // Connect sockets
        studentSocket.connect();
        teacherSocket.connect();
        await waitForEvent(studentSocket, 'connect');
        await waitForEvent(teacherSocket, 'connect');
        // Student joins and teacher starts question
        studentSocket.emit('join_game', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'student-e2e-001',
            username: 'Security Test Student',
            avatarEmoji: '🔒'
        });
        await waitForEvent(studentSocket, 'game_joined');
        // Monitor all events to check for security leaks
        const receivedEvents = [];
        studentSocket.onAny((event, data) => {
            receivedEvents.push({ event, data });
        });
        // Start question
        const questionPromise = waitForEvent(studentSocket, 'game_question');
        teacherSocket.emit('set_question', {
            accessCode: TEST_ACCESS_CODE,
            questionUid: question1Uid
        });
        await questionPromise;
        // Check all received events for security leaks
        const problematicEvents = receivedEvents.filter(({ event, data }) => {
            if (event === 'game_question' && data.question) {
                // Check if raw database fields are exposed
                return (data.question.correctAnswers !== undefined ||
                    data.question.explanation !== undefined ||
                    data.question.id !== undefined ||
                    data.question.createdAt !== undefined ||
                    data.question.updatedAt !== undefined ||
                    data.question.author !== undefined);
            }
            return false;
        });
        expect(problematicEvents).toHaveLength(0);
        console.log('✓ No sensitive data found in any events');
        // Verify proper filtering applied
        const gameQuestionEvent = receivedEvents.find(e => e.event === 'game_question');
        expect(gameQuestionEvent).toBeDefined();
        expect(gameQuestionEvent.data.question.uid).toBeDefined();
        expect(gameQuestionEvent.data.question.text).toBeDefined();
        expect(gameQuestionEvent.data.question.defaultMode).toBeDefined();
        expect(gameQuestionEvent.data.question.answers).toBeDefined();
        console.log('=== Security Validation Passed ===');
    });
    test('Timer Integration and State Management', async () => {
        console.log('=== Starting Timer Integration Test ===');
        studentSocket.connect();
        teacherSocket.connect();
        await waitForEvent(studentSocket, 'connect');
        await waitForEvent(teacherSocket, 'connect');
        studentSocket.emit('join_game', {
            accessCode: TEST_ACCESS_CODE,
            userId: 'student-e2e-001',
            username: 'Timer Test Student',
            avatarEmoji: '⏱️'
        });
        await waitForEvent(studentSocket, 'game_joined');
        // Test timer with first question (15 seconds)
        const question1Promise = waitForEvent(studentSocket, 'game_question');
        teacherSocket.emit('set_question', {
            accessCode: TEST_ACCESS_CODE,
            questionUid: question1Uid
        });
        const question1Data = await question1Promise;
        expect(question1Data.timer).toBe(15);
        // Test timer with second question (10 seconds)
        const question2Promise = waitForEvent(studentSocket, 'game_question');
        teacherSocket.emit('set_question', {
            accessCode: TEST_ACCESS_CODE,
            questionUid: question2Uid
        });
        const question2Data = await question2Promise;
        expect(question2Data.timer).toBe(10);
        console.log('✓ Timer values correctly transmitted for both questions');
        console.log('=== Timer Integration Test Passed ===');
    });
});
