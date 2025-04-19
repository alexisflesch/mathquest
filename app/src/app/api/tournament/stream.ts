import { NextRequest } from 'next/server';

let tournamentState: unknown = {
    status: 'waiting',
    currentQuestion: null,
    scores: [],
    timeLeft: null,
};

export async function GET() {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: unknown) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };
            send({ type: 'update', tournamentState });
            const interval = setInterval(() => {
                send({ type: 'update', tournamentState });
            }, 2000);
            setTimeout(() => {
                clearInterval(interval);
                controller.close();
            }, 5 * 60 * 1000);
        },
    });
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    });
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    if (typeof tournamentState === 'object' && tournamentState !== null && typeof body === 'object' && body !== null) {
        tournamentState = { ...tournamentState, ...body };
    } else if (typeof body === 'object' && body !== null) {
        tournamentState = { ...body };
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
