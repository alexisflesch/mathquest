/**
 * Script to initialize the test database
 * Can be run separately before test execution
 */
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

async function initTestDb(): Promise<void> {
    console.log('Initializing test database...');

    const prisma = new PrismaClient();

    try {
        // Try to clean all tables
        try {
            // Disable foreign key constraints temporarily
            await prisma.$executeRaw`SET session_replication_role = 'replica';`;

            // Get all tables
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tables: any[] = await prisma.$queryRaw`
              SELECT tablename FROM pg_tables WHERE schemaname = 'public'
            `;

            // Truncate each table (except migrations)
            for (const { tablename } of tables) {
                if (tablename !== '_prisma_migrations') {
                    try {
                        console.log(`Truncating table: ${tablename}`);
                        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
                    } catch (err) {
                        console.error(`Error truncating ${tablename}:`, err);
                    }
                }
            }
        } finally {
            // Re-enable foreign key constraints
            await prisma.$executeRaw`SET session_replication_role = 'origin';`;
        }

        console.log('Test database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize test database:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Execute if this script is run directly
// The `require.main === module` check is a CommonJS pattern.
// In ESM or when using ts-node, it might behave differently or not be standard.
// For a simple script execution check in TS/ESM, you might need a different approach
// if this script were part of an ESM module system.
// However, for `ts-node` execution of a .ts file, this check often still works as expected.
if (require.main === module) {
    initTestDb().catch(e => {
        console.error(e);
        process.exit(1);
    });
}

export { initTestDb };
