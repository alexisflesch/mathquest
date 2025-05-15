// Test helpers for the API tests
import { Request, Response } from 'express';

/**
 * Creates a mock Express request object
 */
export const createMockRequest = (
    options: {
        body?: any;
        params?: any;
        query?: any;
        headers?: Record<string, string>;
        cookies?: Record<string, string>;
        user?: any;
    } = {}
): Partial<Request> => {
    return {
        body: options.body || {},
        params: options.params || {},
        query: options.query || {},
        headers: options.headers || {},
        cookies: options.cookies || {},
        user: options.user,
    };
};

/**
 * Creates a mock Express response object with jest spies
 */
export const createMockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};

    // Create spy methods
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);

    return res;
};

/**
 * Mock implementation that can be used with jest.spyOn to prevent actual
 * operations while capturing call arguments
 */
export const mockImplementation = <T extends (...args: any[]) => any>(
    mockFn: jest.Mock<ReturnType<T>, Parameters<T>>,
    returnValue: ReturnType<T> | any = undefined
) => {
    return jest.fn().mockImplementation((...args: Parameters<T>) => {
        mockFn(...args);
        return returnValue;
    });
};
