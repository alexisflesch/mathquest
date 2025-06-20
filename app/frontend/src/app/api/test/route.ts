import { NextResponse } from 'next/server';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

export async function GET() {
    return NextResponse.json({ message: 'API route is working' });
}
