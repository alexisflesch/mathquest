"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStudentToken = generateStudentToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function generateStudentToken(studentId, username = 'student') {
    const payload = { studentId, username };
    const secret = process.env.JWT_SECRET || 'mathquest_default_secret';
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '1h' });
}
exports.default = generateStudentToken;
