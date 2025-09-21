/**
 * Middleware Authentication and Route Protection Test Suite
 *
 * Tests for Next.js middleware route protection and authentication redirects:
 * - Anonymous users accessing public vs protected routes
 * - Authenticated users (students/teachers) accessing protected routes
 * - Password reset routes accessibility for anonymous users
 * - Email verification routes accessibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../../src/middleware';

// Mock NextResponse.redirect and NextResponse.next
jest.mock('next/server', () => ({
    NextResponse: {
        next: jest.fn(() => ({ type: 'next' })),
        redirect: jest.fn((url) => ({ type: 'redirect', url: url.toString() }))
    },
    NextRequest: jest.fn()
}));

describe('Middleware Route Protection', () => {
    let mockRequest: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Base mock request
        mockRequest = {
            cookies: {
                get: jest.fn(),
                size: 0,
                getAll: jest.fn(() => []),
                has: jest.fn(() => false),
                set: jest.fn(),
                delete: jest.fn(),
                clear: jest.fn()
            },
            nextUrl: {
                pathname: '/',
                origin: 'http://localhost:3000',
                search: ''
            }
        };
    });

    describe('Anonymous User Access', () => {
        beforeEach(() => {
            // Mock no auth tokens (anonymous user)
            mockRequest.cookies.get
                .mockReturnValueOnce(undefined) // authToken
                .mockReturnValueOnce(undefined); // teacherToken
        });

        test('should allow access to home page', () => {
            mockRequest.nextUrl!.pathname = '/';

            middleware(mockRequest as NextRequest);

            expect(NextResponse.next).toHaveBeenCalled();
            expect(NextResponse.redirect).not.toHaveBeenCalled();
        });

        test('should allow access to login page', () => {
            mockRequest.nextUrl!.pathname = '/login';

            middleware(mockRequest as NextRequest);

            expect(NextResponse.next).toHaveBeenCalled();
            expect(NextResponse.redirect).not.toHaveBeenCalled();
        });

        test('should allow access to email verification routes', () => {
            mockRequest.nextUrl!.pathname = '/verify-email/abc123';

            middleware(mockRequest as NextRequest);

            expect(NextResponse.next).toHaveBeenCalled();
            expect(NextResponse.redirect).not.toHaveBeenCalled();
        });

        test('should allow access to password reset page', () => {
            mockRequest.nextUrl!.pathname = '/reset-password';

            middleware(mockRequest as NextRequest);

            expect(NextResponse.next).toHaveBeenCalled();
            expect(NextResponse.redirect).not.toHaveBeenCalled();
        });

        test('should allow access to password reset confirm page', () => {
            mockRequest.nextUrl!.pathname = '/reset-password/confirm/token123';

            middleware(mockRequest as NextRequest);

            expect(NextResponse.next).toHaveBeenCalled();
            expect(NextResponse.redirect).not.toHaveBeenCalled();
        });

        test('should redirect to login for protected student routes', () => {
            mockRequest.nextUrl!.pathname = '/profile';

            middleware(mockRequest as NextRequest);

            expect(NextResponse.redirect).toHaveBeenCalledWith(
                new URL('http://localhost:3000/login?returnTo=%2Fprofile')
            );
        });

        test('should redirect to home for teacher routes', () => {
            mockRequest.nextUrl!.pathname = '/teacher/dashboard/abc123';

            middleware(mockRequest as NextRequest);

            expect(NextResponse.redirect).toHaveBeenCalledWith(
                new URL('http://localhost:3000/')
            );
        });

        test('should redirect to login for game routes', () => {
            mockRequest.nextUrl!.pathname = '/live/abc123';

            middleware(mockRequest as NextRequest);

            expect(NextResponse.redirect).toHaveBeenCalledWith(
                new URL('http://localhost:3000/login?returnTo=%2Flive%2Fabc123')
            );
        });
    });

    describe('Student User Access', () => {
        beforeEach(() => {
            // Mock student token present
            mockRequest.cookies.get
                .mockReturnValueOnce({ value: 'student-token' }) // authToken
                .mockReturnValueOnce(undefined); // teacherToken
        });

        test('should allow access to protected student routes', () => {
            mockRequest.nextUrl!.pathname = '/profile';

            middleware(mockRequest as NextRequest);

            expect(NextResponse.next).toHaveBeenCalled();
            expect(NextResponse.redirect).not.toHaveBeenCalled();
        });

        test('should allow access to game routes', () => {
            mockRequest.nextUrl!.pathname = '/live/abc123';

            middleware(mockRequest as NextRequest);

            expect(NextResponse.next).toHaveBeenCalled();
            expect(NextResponse.redirect).not.toHaveBeenCalled();
        });

        test('should redirect non-teachers away from teacher routes', () => {
            mockRequest.nextUrl!.pathname = '/teacher/dashboard/abc123';

            middleware(mockRequest as NextRequest);

            expect(NextResponse.redirect).toHaveBeenCalledWith(
                new URL('http://localhost:3000/')
            );
        });
    });

    describe('Teacher User Access', () => {
        beforeEach(() => {
            // Mock teacher token present
            mockRequest.cookies.get
                .mockReturnValueOnce(undefined) // authToken
                .mockReturnValueOnce({ value: 'teacher-token' }); // teacherToken
        });

        test('should allow access to teacher routes', () => {
            mockRequest.nextUrl!.pathname = '/teacher/dashboard/abc123';

            middleware(mockRequest as NextRequest);

            expect(NextResponse.next).toHaveBeenCalled();
            expect(NextResponse.redirect).not.toHaveBeenCalled();
        });

        test('should allow access to protected student routes', () => {
            mockRequest.nextUrl!.pathname = '/profile';

            middleware(mockRequest as NextRequest);

            expect(NextResponse.next).toHaveBeenCalled();
            expect(NextResponse.redirect).not.toHaveBeenCalled();
        });

        test('should allow access to game routes', () => {
            mockRequest.nextUrl!.pathname = '/live/abc123';

            middleware(mockRequest as NextRequest);

            expect(NextResponse.next).toHaveBeenCalled();
            expect(NextResponse.redirect).not.toHaveBeenCalled();
        });
    });

    describe('URL Parameter Handling', () => {
        beforeEach(() => {
            // Mock no auth tokens (anonymous user)
            mockRequest.cookies.get
                .mockReturnValueOnce(undefined) // authToken
                .mockReturnValueOnce(undefined); // teacherToken
        });

        test('should preserve query parameters in redirect URL', () => {
            mockRequest.nextUrl!.pathname = '/profile';
            mockRequest.nextUrl!.search = '?tab=settings';

            middleware(mockRequest as NextRequest);

            expect(NextResponse.redirect).toHaveBeenCalledWith(
                new URL('http://localhost:3000/login?returnTo=%2Fprofile%3Ftab%3Dsettings')
            );
        });

        test('should handle complex URLs with multiple parameters', () => {
            mockRequest.nextUrl!.pathname = '/live/game123';
            mockRequest.nextUrl!.search = '?mode=practice&difficulty=hard';

            middleware(mockRequest as NextRequest);

            expect(NextResponse.redirect).toHaveBeenCalledWith(
                new URL('http://localhost:3000/login?returnTo=%2Flive%2Fgame123%3Fmode%3Dpractice%26difficulty%3Dhard')
            );
        });
    });
});