import { prisma } from '@/db/prisma';

/**
 * Cleans the database by truncating all tables
 * This should be used before each test suite to ensure a clean database state
 */
export const cleanDatabase = async (): Promise<void> => {
    try {
        // Disable foreign key constraints for the session
        await prisma.$executeRaw`SET session_replication_role = 'replica';`;

        // Get a list of all tables
        const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;

        // Truncate each table (except migrations table)
        for (const { tablename } of tables) {
            if (tablename !== '_prisma_migrations') {
                await prisma.$executeRaw`TRUNCATE TABLE "public"."${tablename}" CASCADE;`;
            }
        }
    } catch (error) {
        console.error('Error cleaning database tables:', error);
    } finally {
        // Re-enable foreign key constraints
        await prisma.$executeRaw`SET session_replication_role = 'origin';`;
    }
};
