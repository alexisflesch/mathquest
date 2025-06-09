"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalTeardown;
// Use require to avoid module resolution issues in Jest
const { redisClient } = require('../src/config/redis');
const { closeSocketIORedisClients } = require('../src/sockets');
const { stopAllTestServers } = require('./testSetup');
async function globalTeardown() {
    // Suppress unhandled promise rejections during teardown
    process.on('unhandledRejection', () => { });
    try {
        await stopAllTestServers();
    }
    catch (e) { }
    try {
        await closeSocketIORedisClients();
    }
    catch (e) { }
    try {
        if (redisClient && redisClient.status !== 'end' && redisClient.status !== 'close') {
            await redisClient.quit(); // Use quit() instead of disconnect() for graceful shutdown
        }
    }
    catch (e) { }
    await new Promise(res => setTimeout(res, 200));
}
