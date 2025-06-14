import { NextRequest, NextResponse } from 'next/server';
import { makeApiRequest } from '@/config/api';
import {
    CreateGameRequestSchema,
    ErrorResponseSchema,
    type CreateGameRequest,
    type ErrorResponse
} from '@shared/types/api/schemas';
import { type GameCreationResponse } from '@shared/types/api/responses';
import { createLogger } from '@/clientLogger';

const logger = createLogger('GamesAPI');

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate the request body
        const validatedRequest: CreateGameRequest = CreateGameRequestSchema.parse(body);

        console.log('[FRONTEND-API] /api/games received validated request:', {
            body: validatedRequest,
            keys: Object.keys(validatedRequest),
            gameTemplateId: validatedRequest.gameTemplateId
        });

        logger.debug('Game creation request received', {
            playMode: validatedRequest.playMode,
            name: validatedRequest.name,
            hasGameTemplateId: !!validatedRequest.gameTemplateId,
            hasStudentParams: !!(validatedRequest.gradeLevel && validatedRequest.discipline && validatedRequest.themes)
        });

        // Extract JWT token from cookies for backend authentication
        const cookies = request.headers.get('cookie') || '';
        const teacherTokenMatch = cookies.match(/teacherToken=([^;]+)/);
        const authTokenMatch = cookies.match(/authToken=([^;]+)/);
        const jwtToken = teacherTokenMatch?.[1] || authTokenMatch?.[1] || null;

        console.log('[FRONTEND-API] Authentication info:', {
            hasCookies: !!cookies,
            hasTeacherToken: !!teacherTokenMatch,
            hasAuthToken: !!authTokenMatch,
            hasJwtToken: !!jwtToken,
            jwtTokenPrefix: jwtToken?.substring(0, 20) + '...' || 'none'
        });

        if (!jwtToken) {
            logger.error('No JWT token found in cookies for authentication');
            const errorResponse: ErrorResponse = {
                error: 'Authentication required'
            };
            return NextResponse.json(errorResponse, { status: 401 });
        }

        // Forward the request to the backend with authentication
        console.log('[FRONTEND-API] About to forward to backend:', {
            url: 'games',
            body: JSON.stringify(validatedRequest),
            bodyKeys: Object.keys(validatedRequest)
        });

        const response = await makeApiRequest<GameCreationResponse>(
            'games',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify(validatedRequest)
            }
            // Note: Skipping response validation as it would require more complex schema
        );

        logger.info('Game created successfully', {
            gameId: response.gameInstance.id,
            accessCode: response.gameInstance.accessCode,
            playMode: (response.gameInstance as any).playMode // Safe access since backend returns this
        });

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('[FRONTEND-API] /api/games error:', {
            error: error.message,
            stack: error.stack,
            status: error.status
        });

        logger.error('Game creation failed', { error: error.message });

        const errorResponse: ErrorResponse = {
            error: error.message || 'Game creation failed',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };

        return NextResponse.json(errorResponse, { status: error.status || 500 });
    }
}
