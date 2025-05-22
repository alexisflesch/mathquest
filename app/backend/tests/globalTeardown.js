const { redisClient } = require('../src/config/redis');
const { closeSocketIORedisClients } = require('../src/sockets');
const { stopAllTestServers } = require('./testSetup');

module.exports = async () => {
    // Close all test servers and their Redis clients
    try {
        await stopAllTestServers();
    } catch (e) { }
    // Close Socket.IO Redis adapter subClient
    try {
        await closeSocketIORedisClients();
    } catch (e) { }
    // Close main redisClient
    try {
        if (redisClient && redisClient.status !== 'end' && redisClient.status !== 'close') {
            await redisClient.quit();
        }
    } catch (e) { }
    // Wait a bit to let ioredis flush
    await new Promise(res => setTimeout(res, 200));
};
