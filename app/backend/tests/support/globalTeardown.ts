// Global teardown for Jest tests
export default async (): Promise<void> => {
    // Clean up Redis connections
    try {
        const { redisClient } = require('../../src/config/redis');
        if (redisClient && redisClient.disconnect) {
            await redisClient.disconnect();
        }
    } catch (error) {
        // Ignore errors during cleanup
    }

    // Clean up database connections
    try {
        const { prisma } = require('../../src/db/prisma');
        if (prisma && prisma.$disconnect) {
            await prisma.$disconnect();
        }
    } catch (error) {
        // Ignore errors during cleanup
    }

    // Force garbage collection if available
    if (global.gc) {
        global.gc();
    }
};
