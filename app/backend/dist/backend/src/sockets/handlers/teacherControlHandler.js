"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherControlHandler = teacherControlHandler;
const teacherControl_1 = require("./teacherControl");
/**
 * Register all teacher dashboard socket event handlers
 * @param io The Socket.IO server instance
 * @param socket The connected socket
 */
function teacherControlHandler(io, socket) {
    // Register all handlers from the refactored module
    (0, teacherControl_1.registerTeacherControlHandlers)(io, socket);
}
exports.default = teacherControlHandler;
