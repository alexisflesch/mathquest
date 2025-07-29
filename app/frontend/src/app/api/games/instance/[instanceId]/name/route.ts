import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '@/config/api';
import { RenameGameInstanceRequestSchema } from '@shared/types/api/schemas';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ instanceId: string }> }
) {
    try {
        const { instanceId } = await params;
        const body = await request.json();

        // Validate request body
        const validationResult = RenameGameInstanceRequestSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Données de requête invalides', details: validationResult.error.issues },
                { status: 400 }
            );
        }

        // Extract JWT token from cookies (teacherToken or authToken)
        const cookieHeader = request.headers.get('cookie');
        let token = null;

        if (cookieHeader) {
            const cookies = cookieHeader.split(';').map(c => c.trim());
            const teacherTokenCookie = cookies.find(c => c.startsWith('teacherToken='));
            const authTokenCookie = cookies.find(c => c.startsWith('authToken='));

            if (teacherTokenCookie) {
                token = teacherTokenCookie.split('=')[1];
            } else if (authTokenCookie) {
                token = authTokenCookie.split('=')[1];
            }
        }

        if (!token) {
            return NextResponse.json(
                { error: 'Authentification requise' },
                { status: 401 }
            );
        }

        console.log('Renaming game instance:', { instanceId, name: body.name });

        // Forward request to backend API
        const backendResponse = await fetch(
            `${BACKEND_API_BASE_URL}/games/instance/${instanceId}/name`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            }
        );

        // Check if response is JSON
        const contentType = backendResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Backend returned non-JSON response:', {
                status: backendResponse.status,
                statusText: backendResponse.statusText,
                contentType
            });
            return NextResponse.json(
                { error: 'Service backend indisponible' },
                { status: 502 }
            );
        }

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
            return NextResponse.json(data, { status: backendResponse.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Error in game instance rename API route:', error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        );
    }
}
