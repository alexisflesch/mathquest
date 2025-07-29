#!/usr/bin/env ts-node
/**
 * Test script for deferred session cleanup
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import { cleanupDeferredSessionRedisKeys } from '../src/utils/redisCleanup';
import { redisClient } from '../src/config/redis';
import createLogger from '../src/utils/logger';

const logger = createLogger('TestDeferredCleanup');

async function testDeferredCleanup() {
    const accessCode = process.argv[2];
    const userId = process.argv[3];
    const attemptCount = parseInt(process.argv[4]);

    if (!accessCode || !userId || !attemptCount) {
        console.error('Usage: npx ts-node scripts/test-deferred-cleanup.ts <accessCode> <userId> <attemptCount>');
        process.exit(1);
    }

    try {
        console.log(`\n🔍 Keys before cleanup:`);
        const keysBefore = await redisClient.keys(`*${accessCode}*`);
        keysBefore.forEach(key => console.log(`   - ${key}`));

        await cleanupDeferredSessionRedisKeys(accessCode, userId, attemptCount, 'test');

        console.log(`\n🔍 Keys after cleanup:`);
        const keysAfter = await redisClient.keys(`*${accessCode}*`);
        if (keysAfter.length === 0) {
            console.log('✅ No keys remaining');
        } else {
            keysAfter.forEach(key => console.log(`   - ${key}`));
        }

        console.log(`\n🎉 Test complete!`);

    } catch (error) {
        console.error('❌ Error during test:', error);
    } finally {
        await redisClient.quit();
    }
}

testDeferredCleanup().catch(console.error);
