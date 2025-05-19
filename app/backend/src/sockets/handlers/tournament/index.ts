// Tournament index for registering tournament handlers
import { Server as SocketIOServer, Socket } from 'socket.io';
import { tournamentHandler } from '../tournamentHandler';

export function registerTournamentHandlers(io: SocketIOServer, socket: Socket) {
    tournamentHandler(io, socket);
}

// No changes needed; registration is already correct and DRY.

export default registerTournamentHandlers;
