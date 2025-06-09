import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { testQuestions } from './testQuestions';
import { PrismaClient } from '../../src/db/generated/client';

export default async (): Promise<void> => {
    // Set NODE_ENV to test FIRST, before any other imports or operations
    process.env.NODE_ENV = 'test';
    
    // Generate the client using the BACKEND schema
    // The schema is located at /home/aflesch/mathquest/app/backend/prisma/schema.prisma
    // process.cwd() is /home/aflesch/mathquest/app/backend/
    execSync('npx prisma generate', { stdio: 'inherit', cwd: process.cwd() });

    // Load test-specific environment variables
    dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

    // Set environment variables needed for tests (override any previous values)
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key-for-tests';
    process.env.DATABASE_URL = 'postgresql://postgre:Phuf0pohooFee8auohFahk7vChae4Iv0wiem5voT@localhost:5432/mathquest_test';

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

        // Seed the teacher and template for integration tests
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

        // Insert all test questions (idempotent)
        await prisma.question.createMany({
            data: testQuestions,
            skipDuplicates: true,
        });
        console.log('Inserted default test questions.');

        // Use a fixed id for the integration test template
        const integrationTemplateId = 'integration-test-template-1';
        const template = await prisma.gameTemplate.upsert({
            where: { id: integrationTemplateId },
            update: {
                name: 'Teacher Quiz Integration Test',
                creatorId: teacher.id,
                themes: ['math'],
                discipline: 'math',
                defaultMode: 'quiz',
            },
            create: {
                id: integrationTemplateId,
                name: 'Teacher Quiz Integration Test',
                creatorId: teacher.id,
                themes: ['math'],
                discipline: 'math',
                defaultMode: 'quiz',
            },
        });
        // Use two questions from testQuestions (q-1, q-2)
        const questionUids = ['q-1', 'q-2'];
        for (let i = 0; i < questionUids.length; i++) {
            await prisma.questionsInGameTemplate.upsert({
                where: { gameTemplateId_questionUid: { gameTemplateId: template.id, questionUid: questionUids[i] } },
                update: { sequence: i },
                create: { gameTemplateId: template.id, questionUid: questionUids[i], sequence: i },
            });
        }
        // Create a game instance for this template
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
        console.log('Seeded integration teacher, template, questions, and game instance.');
    } catch (error) {
        console.error('Error cleaning database:', error);
        // Propagate the error to fail the setup if cleaning fails
        throw error;
    } finally {
        await prisma.$disconnect(); // Ensure disconnect happens even if cleaning fails
    }
};
