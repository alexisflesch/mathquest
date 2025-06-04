"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupServiceMocks = exports.createMockUserService = void 0;
/**
 * Creates a mock UserService for testing
 */
const createMockUserService = () => {
    const mockService = {
        registerUser: jest.fn(),
        loginUser: jest.fn(),
        getUserById: jest.fn(),
        getUserByCookieId: jest.fn(),
        getUserByEmail: jest.fn(),
    };
    return mockService;
};
exports.createMockUserService = createMockUserService;
/**
 * Setup mocks for all services used in tests
 */
const setupServiceMocks = () => {
    // Setup UserService mock
    jest.mock('@/core/services/userService', () => {
        const mockUserService = (0, exports.createMockUserService)();
        return {
            UserService: jest.fn(() => mockUserService)
        };
    });
};
exports.setupServiceMocks = setupServiceMocks;
