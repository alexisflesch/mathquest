import express, { type RequestHandler } from 'express';
import { getIO } from '@/sockets';

const router = express.Router();

// Simple Socket.IO room inspection endpoint for dev/test only
const socketsDebugHandler: RequestHandler = async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        res.status(404).json({ error: 'Not found' });
        return;
    }
    try {
        const { accessCode } = req.params as { accessCode: string };
        const io = getIO();
        if (!io) {
            res.status(503).json({ error: 'Socket.IO not initialized' });
            return;
        }
        const gameRoom = `game_${accessCode}`;
        const lobbyRoom = `lobby_${accessCode}`;
        const dashboardRoom = `dashboard_${accessCode}`;
        const projectionRoom = `projection_${accessCode}`;

        const rooms = io.sockets.adapter.rooms;
        const toArray = (set: Set<string> | undefined) => (set ? Array.from(set) : []);
        const response = {
            accessCode,
            rooms: {
                game: { name: gameRoom, socketIds: toArray(rooms.get(gameRoom)) },
                lobby: { name: lobbyRoom, socketIds: toArray(rooms.get(lobbyRoom)) },
                dashboard: { name: dashboardRoom, socketIds: toArray(rooms.get(dashboardRoom)) },
                projection: { name: projectionRoom, socketIds: toArray(rooms.get(projectionRoom)) },
            },
            allRooms: Array.from(rooms.keys()),
            ts: Date.now()
        };
        res.json(response);
    } catch (err: any) {
        res.status(500).json({ error: err?.message || 'Unknown error' });
    }
};

router.get('/sockets/:accessCode', socketsDebugHandler);

export default router;
