"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("@/server"); // Import app instead of server
describe('GET /health', () => {
    jest.setTimeout(3000); // Set a 3-second timeout for all tests in this suite
    it('should return 200 OK', async () => {
        const res = await (0, supertest_1.default)(server_1.app).get('/health');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toBe('OK');
    });
    // Optional: Test for a non-existent route to ensure 404 handling (if you have it)
    // it('should return 404 for a non-existent route', async () => {
    //   const res = await request(app).get('/non-existent-route');
    //   expect(res.statusCode).toEqual(404);
    // });
});
