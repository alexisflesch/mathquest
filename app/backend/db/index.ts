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

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Verify that DATABASE_URL is available
if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set. Please check your .env file.');
    process.exit(1);
}

const prisma = new PrismaClient();

export default prisma;
