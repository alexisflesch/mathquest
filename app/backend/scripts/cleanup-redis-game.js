#!/usr/bin/env ts-node
/**
 * Manual Redis cleanup script for MathQuest game keys
 * Use this to clean up leftover Redis keys after games end
 * 
 * Usage:
 *   npx ts-node scripts/cleanup-redis-game.ts <accessCode>
 *   npm run cleanup:redis -- <accessCode>
 */

import { redisClient } from '../src/config/redis';
import { cleanupGameRedisKeys } from '../src/utils/redisCleanup';
import createLogger from '../src/utils/logger';

const logger = createLogger('RedisCleanupScript');

async function manualCleanupGameRedisKeys(accessCode: string) {
    if (!accessCode) {
        console.error('Usage: npx ts-node scripts/cleanup-redis-game.ts <accessCode>');
        process.exit(1);
    }

    logger.info({ accessCode }, 'Starting manual Redis cleanup for game');

    try {
        // Use the shared cleanup utility
        await cleanupGameRedisKeys(accessCode, 'manual-script');

        // Final check: search for any remaining keys with the access code
        console.log(`\n🔍 Final check for any remaining keys containing "${accessCode}"...`);
        const remainingKeys = await redisClient.keys(`*${accessCode}*`);

        if (remainingKeys.length > 0) {
            console.log(`⚠️  Found ${remainingKeys.length} remaining keys:`);
            remainingKeys.forEach(key => console.log(`   - ${key}`));

            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise < string > (resolve => {
                readline.question('Do you want to delete these remaining keys? (y/N): ', resolve);
            });
            readline.close();

            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                await redisClient.del(...remainingKeys);
                console.log(`✅ Cleaned ${remainingKeys.length} additional keys`);
            }
        } else {
            console.log('✅ No remaining keys found');
        }

        console.log(`\n🎉 Manual cleanup complete!`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        logger.error({ accessCode, error }, 'Manual cleanup failed');
    } finally {
        await redisClient.quit();
    }
}

// Run the script
const accessCode = process.argv[2];
manualCleanupGameRedisKeys(accessCode).catch(console.error);
