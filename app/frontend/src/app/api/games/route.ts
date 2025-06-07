import { NextRequest, NextResponse } from 'next/server';
import { makeApiRequest } from '@/config/api';
import { GameCreationResponseSchema, type GameCreationResponse } from '@/types/api';
import { createLogger } from '@/clientLogger';

const logger = createLogger('GamesAPI');

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log('[FRONTEND-API] /api/games received request:', {
            body,
            keys: Object.keys(body),
            gameTemplateId: body.gameTemplateId
        });

        logger.debug('Game creation request received', {
            playMode: body.playMode,
            name: body.name,
            hasGameTemplateId: !!body.gameTemplateId,
            hasStudentParams: !!(body.gradeLevel && body.discipline && body.themes)
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
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Forward the request to the backend with authentication
        console.log('[FRONTEND-API] About to forward to backend:', {
            url: 'games',
            body: JSON.stringify(body),
            bodyKeys: Object.keys(body)
        });

        const response = await makeApiRequest<GameCreationResponse>(
            'games',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify(body)
            },
            undefined,
            GameCreationResponseSchema
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

        // Return the same error structure as the backend
        return NextResponse.json(
            { error: error.message || 'Game creation failed' },
            { status: error.status || 500 }
        );
    }
}
