import { NextRequest, NextResponse } from 'next/server';
import { makeApiRequest } from '@/config/api';
import { GameCreationResponseSchema, type GameCreationResponse } from '@/types/api';
import { createLogger } from '@/clientLogger';

const logger = createLogger('GamesAPI');

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        logger.debug('Game creation request received', {
            playMode: body.playMode,
            name: body.name,
            hasGameTemplateId: !!body.gameTemplateId,
            hasStudentParams: !!(body.gradeLevel && body.discipline && body.themes)
        });

        // Forward the request to the backend with authentication
        const response = await makeApiRequest<GameCreationResponse>(
            'games',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Forward cookies for authentication
                    'Cookie': request.headers.get('cookie') || ''
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
        logger.error('Game creation failed', { error: error.message });

        // Return the same error structure as the backend
        return NextResponse.json(
            { error: error.message || 'Game creation failed' },
            { status: error.status || 500 }
        );
    }
}
