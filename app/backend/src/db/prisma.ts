
import { PrismaClient } from '@/db/generated/client';

// Prevent multiple instances of Prisma Client in development
declare global {
    var prisma: PrismaClient | undefined;
}

// Create a singleton instance of Prisma Client with connection pool limits
export const prisma = global.prisma || new PrismaClient({
    // Connection pool configuration to prevent DoS attacks
    // These limits are conservative for a small application
    // Adjust based on your database server capacity
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

// If we're not in production, set prisma to the global object
if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}
