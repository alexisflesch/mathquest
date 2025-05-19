"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectHandler = disconnectHandler;
const redis_1 = require("@/config/redis");
const logger_1 = __importDefault(require("@/utils/logger"));
const helpers_1 = require("./helpers");
// Create a handler-specific logger
const logger = (0, logger_1.default)('DisconnectHandler');
function disconnectHandler(io, socket) {
    return async () => {
        try {
            // Find which dashboards this socket might be part of
            const dashboardKeys = await redis_1.redisClient.keys(`${helpers_1.DASHBOARD_PREFIX}*`);
            for (const key of dashboardKeys) {
                const exists = await redis_1.redisClient.hexists(key, socket.id);
                if (exists) {
                    // Extract game ID from the key
                    const gameId = key.replace(helpers_1.DASHBOARD_PREFIX, '');
                    logger.info({ gameId, socketId: socket.id }, 'Teacher disconnected from dashboard');
                    // Remove from Redis
                    await redis_1.redisClient.hdel(key, socket.id);
                }
            }
        }
        catch (error) {
            logger.error({ error }, 'Error handling teacher dashboard disconnect');
        }
    };
}
