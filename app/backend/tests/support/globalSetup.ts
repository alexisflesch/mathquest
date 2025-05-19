import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { testQuestions } from './testQuestions';
import { mockQuiz, mockTournament } from './mockQuizAndTournament';
import { PrismaClient } from '../../src/db/generated/client';

export default async (): Promise<void> => {
    // Generate the client using the BACKEND schema
    // The schema is located at /home/aflesch/mathquest/app/backend/prisma/schema.prisma
    // process.cwd() is /home/aflesch/mathquest/app/backend/
    execSync('npx prisma generate', { stdio: 'inherit', cwd: process.cwd() });

    // Load test-specific environment variables
    dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

    // Set environment variables needed for tests
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key-for-tests';

    // Assign a random port between 4000-9000 for tests to avoid conflicts
    process.env.PORT = (Math.floor(Math.random() * 5000) + 4000).toString();

    console.log(`Test setup complete, using port ${process.env.PORT}`);
    console.log(`Database URL: ${process.env.DATABASE_URL}`);
    console.log(`Redis URL: ${process.env.REDIS_URL}`);

    const prisma = new PrismaClient(); // Instantiate client

    // Clean the test database before starting tests
    try {
        console.log('Cleaning test database...');

        // Get all tables
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tables: any[] = await prisma.$queryRaw`
            SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        `;

        // Truncate all tables except migrations
        for (const { tablename } of tables) {
            if (tablename !== '_prisma_migrations') {
                try {
                    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
                } catch (err) {
                    console.error(`Error truncating table ${tablename}:`, err);
                    // Propagate the error to fail the setup if cleaning fails for any table
                    throw err;
                }
            }
        }

        console.log('Database cleaned successfully');

        // Ensure the teacher used for seeding quizzes/tournaments exists in globalSetup
        // Ensure teacher-1 exists BEFORE any gameTemplate or question is created
        await prisma.user.upsert({
            where: { id: 'teacher-1' },
            update: {},
            create: {
                id: 'teacher-1',
                username: 'testteacher',
                passwordHash: 'testhash',
                email: 'teacher1@example.com',
                role: 'TEACHER',
                teacherProfile: { create: {} }
            }
        });

        // Insert a dozen test questions for all tests
        await prisma.question.createMany({
            data: testQuestions
        });
        console.log('Inserted default test questions.');

        // Insert a mock quiz
        const gameTemplate = await prisma.gameTemplate.create({
            data: {
                id: mockQuiz.id,
                name: mockQuiz.name,
                creatorId: 'teacher-1', // was creatorTeacherId
                themes: mockQuiz.themes
            }
        });
        await prisma.questionsInGameTemplate.createMany({
            data: mockQuiz.questions.map((q, idx) => ({
                gameTemplateId: gameTemplate.id,
                questionUid: q.uid,
                sequence: idx
            }))
        });
        console.log('Inserted mock quiz and linked questions.');

        // Insert a mock tournament (as a gameTemplate with a different id and theme)
        const tournamentTemplate = await prisma.gameTemplate.create({
            data: {
                id: mockTournament.id,
                name: mockTournament.name,
                creatorId: 'teacher-1', // was creatorTeacherId
                themes: mockTournament.themes
            }
        });
        await prisma.questionsInGameTemplate.createMany({
            data: mockTournament.questions.map((q, idx) => ({
                gameTemplateId: tournamentTemplate.id,
                questionUid: q.uid,
                sequence: idx
            }))
        });
        console.log('Inserted mock tournament and linked questions.');
    } catch (error) {
        console.error('Error cleaning database:', error);
        // Propagate the error to fail the setup if cleaning fails
        throw error;
    } finally {
        await prisma.$disconnect(); // Ensure disconnect happens even if cleaning fails
    }
};
