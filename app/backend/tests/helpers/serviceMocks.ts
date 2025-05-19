import { UserService } from '@/core/services/userService';

/**
 * Creates a mock UserService for testing
 */
export const createMockUserService = (): jest.Mocked<UserService> => {
    const mockService = {
        registerUser: jest.fn(),
        loginUser: jest.fn(),
        getUserById: jest.fn(),
        getUserByCookieId: jest.fn(),
    } as unknown as jest.Mocked<UserService>;
    return mockService;
};

/**
 * Setup mocks for all services used in tests
 */
export const setupServiceMocks = () => {
    // Setup UserService mock
    jest.mock('@/core/services/userService', () => {
        const mockUserService = createMockUserService();
        return {
            UserService: jest.fn(() => mockUserService)
        };
    });
};
