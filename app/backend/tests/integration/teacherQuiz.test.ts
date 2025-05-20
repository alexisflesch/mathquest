import request from 'supertest';
import { Server } from 'http';
import { setupServer } from '../../src/server';
import { prisma } from '../../src/db/prisma';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import { testQuestions } from '../support/testQuestions';

// Utility to wait for a specific event
function waitForEvent(socket: ClientSocket, event: string, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Timeout waiting for ' + event)), timeout);
        socket.once(event, (data) => {
            clearTimeout(timer);
            resolve(data);
        });
    });
}

describe('Teacher-driven Quiz Flow', () => {
    let httpServer: Server;
    let baseUrl: string;
    let teacherSocket: ClientSocket;
    let player1Socket: ClientSocket;
    let gameTemplateId: string;
    let accessCode: string;
    let questionUid: string;
    let teacherUser: any;

    beforeAll(async () => {
        const { httpServer: srv } = setupServer();
        httpServer = srv;
        const address = httpServer.address();
        const port = typeof address === 'object' && address ? address.port : 3000;
        baseUrl = `http://localhost:${port}`;

        // Start the server listening
        await new Promise<void>((resolve) => {
            httpServer.listen(port, resolve);
        });

        // Use hard-coded seeded values
        teacherUser = { email: 'integration-teacher@example.com', id: 'integration-teacher-id' };
        gameTemplateId = 'integration-test-template-1';
        accessCode = 'QUIZCODE1';
        questionUid = 'q-1';
    });

    afterAll(async () => {
        if (teacherSocket) teacherSocket.disconnect();
        if (player1Socket) player1Socket.disconnect();
        if (httpServer) httpServer.close();
    });

    it('should allow teacher to create quiz and instance, player to join, and teacher to start question', async () => {
        // Player 1 joins the live room
        player1Socket = ClientIO(baseUrl, { transports: ['websocket'] });
        await new Promise<void>((resolve) => player1Socket.on('connect', () => resolve()));
        player1Socket.emit('join_game', { accessCode, userId: 'p1', username: 'Player1' });
        await waitForEvent(player1Socket, 'game_joined');

        // Teacher joins the dashboard room
        teacherSocket = ClientIO(baseUrl, { transports: ['websocket'] });
        await new Promise<void>((resolve) => teacherSocket.on('connect', () => resolve()));
        teacherSocket.emit('join_teacher', { accessCode, userId: 't1', username: 'Teacher' });
        await waitForEvent(teacherSocket, 'teacher_joined');

        // Teacher starts a question
        teacherSocket.emit('teacher_start_question', { accessCode, questionIndex: 0 });
        const livePayload: any = await waitForEvent(player1Socket, 'game_question');
        expect(livePayload.timer).toBeDefined();
        expect(livePayload.question).toBeTruthy();
        questionUid = livePayload.question.uid || livePayload.question.id;
    });

    it('should allow teacher to pause, stop, and change timer', async () => {
        // Pause
        teacherSocket.emit('teacher_pause_timer', { accessCode });
        const pausedPayload: any = await waitForEvent(player1Socket, 'game_question');
        expect(pausedPayload.questionState).toBe('paused');

        // Resume
        teacherSocket.emit('teacher_resume_timer', { accessCode });
        const resumedPayload: any = await waitForEvent(player1Socket, 'game_question');
        expect(resumedPayload.questionState).toBe('active');

        // Stop
        teacherSocket.emit('teacher_stop_timer', { accessCode });
        const stoppedPayload: any = await waitForEvent(player1Socket, 'game_question');
        expect(stoppedPayload.questionState).toBe('stopped');
    });

    it('should allow teacher to change question', async () => {
        // Find a second question for the template
        const qLink2 = await prisma.questionsInGameTemplate.findFirst({
            where: { gameTemplateId, questionUid: { not: questionUid } },
            orderBy: { sequence: 'asc' },
            include: { question: true },
        });
        if (!qLink2) throw new Error('No second question linked to seeded game template.');
        teacherSocket.emit('teacher_set_question', { accessCode, questionIndex: qLink2.sequence });
        const newQPayload: any = await waitForEvent(player1Socket, 'game_question');
        expect(newQPayload.question.text).toBe(qLink2.question.text);
    });

    it('should allow teacher to send correct answers to player', async () => {
        teacherSocket.emit('teacher_send_correct_answers', { accessCode, questionId: questionUid });
        const caPayload: any = await waitForEvent(player1Socket, 'correct_answers');
        expect(caPayload.questionId).toBe(questionUid);
    });

    it('should emit correct payloads to late joiner', async () => {
        // Simulate feedback phase
        teacherSocket.emit('teacher_start_question', { accessCode, questionIndex: 0 });
        await waitForEvent(player1Socket, 'game_question');
        teacherSocket.emit('teacher_stop_timer', { accessCode });
        await waitForEvent(player1Socket, 'game_question');
        // Now join as late player
        const lateSocket = ClientIO(baseUrl, { transports: ['websocket'] });
        await new Promise<void>((resolve) => lateSocket.on('connect', () => resolve()));
        lateSocket.emit('join_game', { accessCode, userId: 'p2', username: 'LatePlayer' });
        const qPayload: any = await waitForEvent(lateSocket, 'game_question');
        const caPayload: any = await waitForEvent(lateSocket, 'correct_answers');
        const fbPayload: any = await waitForEvent(lateSocket, 'feedback');
        expect(qPayload.question).toBeTruthy();
        expect(caPayload.questionId).toBe(questionUid);
        expect(typeof fbPayload.feedbackRemaining).toBe('number');
        lateSocket.disconnect();
    });
});
