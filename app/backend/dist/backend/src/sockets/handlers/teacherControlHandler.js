"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherControlHandler = teacherControlHandler;
const teacherControl_1 = require("./teacherControl");
const logger_1 = __importDefault(require("@/utils/logger"));
// Create a handler-specific logger
const logger = (0, logger_1.default)('TeacherControlHandler');
/**
 * Register all teacher dashboard socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
function teacherControlHandler(io, socket) {
    logger.info({ socketId: socket.id }, 'teacherControlHandler called');
    // Register all handlers from the refactored module
    (0, teacherControl_1.registerTeacherControlHandlers)(io, socket);
    logger.info({ socketId: socket.id }, 'teacherControlHandler registration complete');
}
exports.default = teacherControlHandler;
