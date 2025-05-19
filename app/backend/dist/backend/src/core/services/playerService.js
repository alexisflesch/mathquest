"use strict";
// DEPRECATED: This service is obsolete after the user model unification. All logic should use UserService instead.
// All usages of prisma.player must be removed from the codebase.
// import bcrypt from 'bcrypt';
// import crypto from 'crypto';
// import { prisma } from '@/db/prisma';
// import createLogger from '@/utils/logger';
// // Create a service-specific logger
// const logger = createLogger('PlayerService');
// // Number of salt rounds for bcrypt
// const SALT_ROUNDS = 10;
// export interface PlayerRegistrationData {
//     username: string;
//     email?: string;
//     password?: string; // Optional, for registered players
// }
/**
 * Player service class for handling player-related operations
 */
// export class PlayerService {
//     /**
//      * Register a new player (anonymous or with account)
//      */
//     async registerPlayer(data: PlayerRegistrationData) {
//         try {
//             const { username, email, password } = data;
//             // Check if a player with the same email already exists
//             let existingPlayer = null;
//             if (data.email) {
//                 existingPlayer = await prisma.player.findFirst({
//                     where: { email: data.email },
//                 });
//             }
//             if (existingPlayer) {
//                 throw new Error('Player with this email already exists');
//             }
//             // Generate a unique cookieId
//             const cookieId = this.generateCookieId();
//             // Prepare player data
//             const playerData: any = {
//                 username,
//                 cookieId,
//             };
//             // If email is provided, add it
//             if (email) {
//                 playerData.email = email;
//             }
//             // If password is provided, hash it
//             if (password) {
//                 playerData.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
//             }
//             // Create the player in the database
//             const player = await prisma.player.create({
//                 data: playerData,
//                 select: {
//                     id: true,
//                     username: true,
//                     email: true,
//                     cookieId: true,
//                     createdAt: true,
//                     avatarUrl: true,
//                 },
//             });
//             return player;
//         } catch (error) {
//             logger.error({ error }, 'Error registering player');
//             throw error;
//         }
//     }
//     /**
//      * Get a player by cookieId
//      */
//     async getPlayerByCookieId(cookieId: string) {
//         try {
//             const player = await prisma.player.findUnique({
//                 where: { cookieId },
//                 select: {
//                     id: true,
//                     username: true,
//                     email: true,
//                     cookieId: true,
//                     createdAt: true,
//                     avatarUrl: true,
//                 },
//             });
//             return player || null;
//         } catch (error) {
//             logger.error({ error }, `Error fetching player with cookieId ${cookieId}`);
//             throw error;
//         }
//     }
//     /**
//      * Get a player by ID
//      */
//     async getPlayerById(id: string) {
//         try {
//             return await prisma.player.findUnique({
//                 where: { id },
//                 select: {
//                     id: true,
//                     username: true,
//                     email: true,
//                     cookieId: true,
//                     createdAt: true,
//                     avatarUrl: true,
//                 },
//             });
//         } catch (error) {
//             logger.error({ error }, `Error fetching player with ID ${id}`);
//             throw error;
//         }
//     }
//     /**
//      * Generate a unique cookieId for identifying players
//      */
//     private generateCookieId(): string {
//         return crypto.randomBytes(32).toString('hex');
//     }
// }
// (No implementation, file kept for migration reference)
