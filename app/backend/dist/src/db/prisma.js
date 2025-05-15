"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@/db/generated/client");
// Create a singleton instance of Prisma Client
exports.prisma = global.prisma || new client_1.PrismaClient();
// If we're not in production, set prisma to the global object
if (process.env.NODE_ENV !== 'production') {
    global.prisma = exports.prisma;
}
