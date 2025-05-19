"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("@/utils/logger"));
// Make sure Jest recognizes this test
describe('Test Path Aliases', () => {
    jest.setTimeout(3000);
    test('path aliases should work with @ alias', () => {
        // Test if we can import utils with the @ alias
        const logger = (0, logger_1.default)('TestLogger');
        expect(logger).toBeDefined();
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.error).toBe('function');
        expect(typeof logger.warn).toBe('function');
    });
});
