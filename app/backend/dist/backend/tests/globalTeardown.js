"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalTeardown;
const redis_1 = require("../src/config/redis");
const sockets_1 = require("../src/sockets");
const testSetup_1 = require("./testSetup");
async function globalTeardown() {
    // Suppress unhandled promise rejections during teardown
    process.on('unhandledRejection', () => { });
    try {
        await (0, testSetup_1.stopAllTestServers)();
    }
    catch (e) { }
    try {
        await (0, sockets_1.closeSocketIORedisClients)();
    }
    catch (e) { }
    try {
        if (redis_1.redisClient && redis_1.redisClient.status !== 'end' && redis_1.redisClient.status !== 'close') {
            redis_1.redisClient.disconnect();
        }
    }
    catch (e) { }
    await new Promise(res => setTimeout(res, 200));
}
