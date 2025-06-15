"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teardown = exports.setup = void 0;
const client_1 = require("@prisma/client");
const testQuestions_1 = require("./testQuestions");
// Test environment setup functions
const setup = async () => {
    process.env.NODE_ENV = 'test';
    // Assign a random port between 4000-9000 for tests
    process.env.PORT = (Math.floor(Math.random() * 5000) + 4000).toString();
    // Could add other test setup like:
    // - Setting up a test database
    // - Creating test data
    // - Setting up test JWT_SECRET
    process.env.JWT_SECRET = 'test-secret-key-for-tests';
    // Seed the test DB with a teacher, a game template, and two questions
    const prisma = new client_1.PrismaClient();
    const teacher = await prisma.user.upsert({
        where: { email: 'integration-teacher@example.com' },
        update: {},
        create: {
            username: 'integration-teacher',
            email: 'integration-teacher@example.com',
            passwordHash: 'test',
            role: 'TEACHER',
        },
    });
    const template = await prisma.gameTemplate.upsert({
        where: { name: 'Teacher Quiz Integration Test' },
        update: {},
        create: {
            name: 'Teacher Quiz Integration Test',
            creatorId: teacher.id,
            themes: ['math'],
            discipline: 'math',
            defaultMode: 'quiz',
        },
    });
    // Use two questions from testQuestions for existing setup
    const questionUids = [testQuestions_1.testQuestions[2].uid, testQuestions_1.testQuestions[3].uid]; // e.g. 'q-1', 'q-2'
    for (let i = 0; i < questionUids.length; i++) {
        // Ensure question exists
        await prisma.question.upsert({
            where: { uid: questionUids[i] },
            update: {},
            create: { ...testQuestions_1.testQuestions.find(q => q.uid === questionUids[i]) },
        });
        // Link question to template
        await prisma.questionsInGameTemplate.upsert({
            where: { gameTemplateId_questionUid: { gameTemplateId: template.id, questionUid: questionUids[i] } },
            update: { sequence: i },
            create: { gameTemplateId: template.id, questionUid: questionUids[i], sequence: i },
        });
    }
    // Seed practice mode test questions with explanations for testing
    const practiceQuestions = [testQuestions_1.testQuestions[0], testQuestions_1.testQuestions[1], testQuestions_1.testQuestions[2]]; // TEST-add-1, TEST-add-2, TEST-mult-1
    for (const question of practiceQuestions) {
        await prisma.question.upsert({
            where: { uid: question.uid },
            update: {},
            create: { ...question },
        });
    }
    // Optionally, create a game instance for this template
    await prisma.gameInstance.upsert({
        where: { accessCode: 'QUIZCODE1' },
        update: {},
        create: {
            accessCode: 'QUIZCODE1',
            name: 'Teacher Quiz Instance',
            status: 'pending',
            playMode: 'quiz',
            settings: {},
            gameTemplateId: template.id,
            initiatorUserId: teacher.id,
        },
    });
    await prisma.$disconnect();
};
exports.setup = setup;
const teardown = async () => {
    // Clean up any resources created for testing
};
exports.teardown = teardown;
