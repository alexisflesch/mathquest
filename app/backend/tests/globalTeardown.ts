import { redisClient } from '../src/config/redis';
import { closeSocketIORedisClients } from '../src/sockets';
import { stopAllTestServers } from './testSetup';

export default async function globalTeardown() {
    // Suppress unhandled promise rejections during teardown
    process.on('unhandledRejection', () => { });
    try {
        await stopAllTestServers();
    } catch (e) { }
    try {
        await closeSocketIORedisClients();
    } catch (e) { }
    try {
        if (redisClient && redisClient.status !== 'end' && redisClient.status !== 'close') {
            redisClient.disconnect();
        }
    } catch (e) { }
    await new Promise(res => setTimeout(res, 200));
}
