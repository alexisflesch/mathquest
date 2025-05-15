import { PlayerService } from '@/core/services/playerService';
import { TeacherService } from '@/core/services/teacherService';

/**
 * Creates a mock PlayerService for testing
 */
export const createMockPlayerService = (): jest.Mocked<PlayerService> => {
    const mockService = {
        registerPlayer: jest.fn(),
        getPlayerByCookieId: jest.fn(),
        getPlayerById: jest.fn()
    } as unknown as jest.Mocked<PlayerService>;

    return mockService;
};

/**
 * Creates a mock TeacherService for testing
 */
export const createMockTeacherService = (): jest.Mocked<TeacherService> => {
    const mockService = {
        registerTeacher: jest.fn(),
        loginTeacher: jest.fn(),
        getTeacherById: jest.fn(),
        getTeacherByEmail: jest.fn(),
        validateToken: jest.fn()
    } as unknown as jest.Mocked<TeacherService>;

    return mockService;
};

/**
 * Setup mocks for all services used in tests
 */
export const setupServiceMocks = () => {
    // Setup PlayerService mock
    jest.mock('@/core/services/playerService', () => {
        const mockPlayerService = createMockPlayerService();
        return {
            PlayerService: jest.fn(() => mockPlayerService)
        };
    });

    // Setup TeacherService mock
    jest.mock('@/core/services/teacherService', () => {
        const mockTeacherService = createMockTeacherService();
        return {
            TeacherService: jest.fn(() => mockTeacherService)
        };
    });
};
