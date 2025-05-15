"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("@/db/prisma");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a service-specific logger
const logger = (0, logger_1.default)('PlayerService');
// Number of salt rounds for bcrypt
const SALT_ROUNDS = 10;
/**
 * Player service class for handling player-related operations
 */
class PlayerService {
    /**
     * Register a new player (anonymous or with account)
     */
    async registerPlayer(data) {
        try {
            const { username, email, password } = data;
            // Check if a player with the same username already exists
            const existingPlayer = await prisma_1.prisma.player.findUnique({
                where: { username },
            });
            if (existingPlayer) {
                throw new Error('Player with this username already exists');
            }
            // Check if email is provided and if it's already in use
            if (email) {
                const playerWithEmail = await prisma_1.prisma.player.findUnique({
                    where: { email },
                });
                if (playerWithEmail) {
                    throw new Error('Player with this email already exists');
                }
            }
            // Generate a unique cookieId
            const cookieId = this.generateCookieId();
            // Prepare player data
            const playerData = {
                username,
                cookieId,
            };
            // If email is provided, add it
            if (email) {
                playerData.email = email;
            }
            // If password is provided, hash it
            if (password) {
                playerData.passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
            }
            // Create the player in the database
            const player = await prisma_1.prisma.player.create({
                data: playerData,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    cookieId: true,
                    createdAt: true,
                    avatarUrl: true,
                },
            });
            return player;
        }
        catch (error) {
            logger.error({ error }, 'Error registering player');
            throw error;
        }
    }
    /**
     * Get a player by cookieId
     */
    async getPlayerByCookieId(cookieId) {
        try {
            return await prisma_1.prisma.player.findUnique({
                where: { cookieId },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    cookieId: true,
                    createdAt: true,
                    avatarUrl: true,
                },
            });
        }
        catch (error) {
            logger.error({ error }, `Error fetching player with cookieId ${cookieId}`);
            throw error;
        }
    }
    /**
     * Get a player by ID
     */
    async getPlayerById(id) {
        try {
            return await prisma_1.prisma.player.findUnique({
                where: { id },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    cookieId: true,
                    createdAt: true,
                    avatarUrl: true,
                },
            });
        }
        catch (error) {
            logger.error({ error }, `Error fetching player with ID ${id}`);
            throw error;
        }
    }
    /**
     * Generate a unique cookieId for identifying players
     */
    generateCookieId() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
}
exports.PlayerService = PlayerService;
