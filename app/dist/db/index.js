"use strict";
/**
 * Database Connection Module
 *
 * This module initializes and exports a single PrismaClient instance for database access.
 * It follows the singleton pattern to prevent multiple connections during development
 * or in a serverless environment.
 *
 * All database access throughout the application should use this exported instance
 * to ensure connection pooling works correctly and to avoid connection limits.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.default = prisma;
