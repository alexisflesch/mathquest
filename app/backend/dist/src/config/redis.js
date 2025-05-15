"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
    logger_1.logger.error('REDIS_URL is not defined in environment variables.');
    throw new Error('REDIS_URL is not defined.');
}
const redisClient = new ioredis_1.default(redisUrl, {
    maxRetriesPerRequest: null, // Keep trying to reconnect
    enableReadyCheck: false,
    // Add other options here if needed, like password, tls, etc.
    // lazyConnect: true, // Connects only when a command is issued - might be useful
});
exports.redisClient = redisClient;
redisClient.on('connect', () => {
    logger_1.logger.info('Successfully connected to Redis.');
});
redisClient.on('error', (err) => {
    logger_1.logger.error('Redis connection error:', err);
    // Depending on the error, you might want to exit the process
    // or implement a more robust reconnection strategy if ioredis's default isn't enough.
});
