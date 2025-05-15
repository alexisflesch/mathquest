"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockImplementation = exports.createMockResponse = exports.createMockRequest = void 0;
/**
 * Creates a mock Express request object
 */
const createMockRequest = (options = {}) => {
    return {
        body: options.body || {},
        params: options.params || {},
        query: options.query || {},
        headers: options.headers || {},
        cookies: options.cookies || {},
        user: options.user,
    };
};
exports.createMockRequest = createMockRequest;
/**
 * Creates a mock Express response object with jest spies
 */
const createMockResponse = () => {
    const res = {};
    // Create spy methods
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    return res;
};
exports.createMockResponse = createMockResponse;
/**
 * Mock implementation that can be used with jest.spyOn to prevent actual
 * operations while capturing call arguments
 */
const mockImplementation = (mockFn, returnValue = undefined) => {
    return jest.fn().mockImplementation((...args) => {
        mockFn(...args);
        return returnValue;
    });
};
exports.mockImplementation = mockImplementation;
