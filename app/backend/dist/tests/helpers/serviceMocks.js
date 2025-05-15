"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupServiceMocks = exports.createMockTeacherService = exports.createMockPlayerService = void 0;
/**
 * Creates a mock PlayerService for testing
 */
const createMockPlayerService = () => {
    const mockService = {
        registerPlayer: jest.fn(),
        getPlayerByCookieId: jest.fn(),
        getPlayerById: jest.fn()
    };
    return mockService;
};
exports.createMockPlayerService = createMockPlayerService;
/**
 * Creates a mock TeacherService for testing
 */
const createMockTeacherService = () => {
    const mockService = {
        registerTeacher: jest.fn(),
        loginTeacher: jest.fn(),
        getTeacherById: jest.fn(),
        getTeacherByEmail: jest.fn(),
        validateToken: jest.fn()
    };
    return mockService;
};
exports.createMockTeacherService = createMockTeacherService;
/**
 * Setup mocks for all services used in tests
 */
const setupServiceMocks = () => {
    // Setup PlayerService mock
    jest.mock('@/core/services/playerService', () => {
        const mockPlayerService = (0, exports.createMockPlayerService)();
        return {
            PlayerService: jest.fn(() => mockPlayerService)
        };
    });
    // Setup TeacherService mock
    jest.mock('@/core/services/teacherService', () => {
        const mockTeacherService = (0, exports.createMockTeacherService)();
        return {
            TeacherService: jest.fn(() => mockTeacherService)
        };
    });
};
exports.setupServiceMocks = setupServiceMocks;
