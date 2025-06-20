import { NextRequest, NextResponse } from 'next/server';
import { makeApiRequest } from '@/config/api';
import type { GameInstanceResponse, ErrorResponse } from '@shared/types/api/responses';
import { createLogger } from '@/clientLogger';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

const logger = createLogger('GamesByAccessCodeAPI');

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ accessCode: string }> }
) {
    try {
        const { accessCode } = await params;

        if (!accessCode || accessCode.length < 4) {
            const errorResponse: ErrorResponse = {
                error: 'Invalid access code format'
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        logger.debug('Fetching game instance by access code', { accessCode });

        // Forward the request to the backend (no authentication required for this endpoint)
        const response = await makeApiRequest<GameInstanceResponse>(
            `games/${accessCode}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        logger.info('Game instance fetched successfully', {
            gameId: response.gameInstance.id,
            accessCode: response.gameInstance.accessCode,
            status: response.gameInstance.status
        });

        return NextResponse.json(response);
    } catch (error: any) {
        logger.error('Failed to fetch game instance by access code', {
            error: error.message,
            accessCode: (await params).accessCode
        });

        const errorResponse: ErrorResponse = {
            error: error.message || 'Failed to fetch game instance',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };

        return NextResponse.json(errorResponse, { status: error.status || 500 });
    }
}
