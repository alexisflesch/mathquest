
import { PrismaClient } from '@/db/generated/client';

// Prevent multiple instances of Prisma Client in development
declare global {
    var prisma: PrismaClient | undefined;
}

// Create a singleton instance of Prisma Client
export const prisma = global.prisma || new PrismaClient();

// If we're not in production, set prisma to the global object
if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}
