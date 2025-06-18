/**
 * API Types - Main export file
 * Re-exports all API-related types and schemas
 */

// Import modules to avoid naming conflicts
import * as ApiSchemas from './api/schemas';
import * as ApiRequests from './api/requests';
import * as ApiResponses from './api/responses';

// Re-export modules as namespaces
export { ApiSchemas, ApiRequests, ApiResponses };

// Re-export specific commonly used schemas directly
export {
    LoginRequestSchema,
    RegisterRequestSchema,
    CreateGameRequestSchema,
    GameJoinRequestSchema,
    GameStatusUpdateRequestSchema,
    CreateGameTemplateRequestSchema,
    UpdateGameTemplateRequestSchema,
    CreateQuestionRequestSchema,
    UpdateQuestionRequestSchema,
    QuestionsResponseSchema,
    GameCreationResponseSchema,
    QuizListResponseSchema,
    QuizCreationResponseSchema,
    QuestionsFiltersResponseSchema,
    GameTemplateCreationResponseSchema,
    TournamentCodeResponseSchema,
    QuestionsCountResponseSchema
} from './api/schemas';

// Re-export specific commonly used types directly
export type {
    LoginRequest,
    RegisterRequest,
    CreateGameRequest,
    GameJoinRequest,
    GameStatusUpdateRequest,
    CreateGameTemplateRequest,
    UpdateGameTemplateRequest,
    CreateQuestionRequest,
    UpdateQuestionRequest
} from './api/requests';

export type {
    LoginResponse,
    RegisterResponse,
    GameStateResponse,
    GameCreationResponse,
    QuizTemplatesResponse as QuizListResponse,
    QuizTemplateCreationResponse as QuizCreationResponse,
    QuestionResponse as QuestionsResponse,
    QuestionFiltersResponse as QuestionsFiltersResponse,
    GameTemplateCreationResponse,
    GameJoinResponse,
} from './api/responses';

// Re-export Question type from the correct location
export type { BaseQuestion as Question } from './question';

// Common API utility types
export type ApiResponse<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
};

export type ApiRequest<T = any> = {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    endpoint: string;
    data?: T;
    headers?: Record<string, string>;
};

export type PaginatedResponse<T> = ApiResponse<{
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
}>;

export type ApiError = {
    code: string;
    message: string;
    details?: any;
    statusCode?: number;
};

export type ValidationError = {
    field: string;
    message: string;
    value?: any;
};
