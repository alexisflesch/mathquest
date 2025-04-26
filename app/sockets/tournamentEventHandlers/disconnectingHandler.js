const createLogger = require('../../logger');
const logger = createLogger('DisconnectTournamentHandler');
const { tournamentState } = require('../tournamentUtils/tournamentState');

function handleDisconnecting(io, socket) {
    logger.info(`disconnecting: socket.id=${socket.id}`);
    // Find which tournament states this socket was part of
    for (const stateKey in tournamentState) {
        const state = tournamentState[stateKey];
        if (state.socketToJoueur && state.socketToJoueur[socket.id]) {
            const joueurId = state.socketToJoueur[socket.id];
            logger.info(`Socket ${socket.id} (joueurId: ${joueurId}) disconnecting from tournament state ${stateKey}`);
            // Remove the socket mapping. Participant data remains for scoring (in live) or potential rejoin (in differed).
            delete state.socketToJoueur[socket.id];

            // If it's a differed state with no other sockets mapped to it, clean it up?
            // Let's NOT clean up differed state here, allow rejoin or timeout/end logic to handle it.
            // if (state.isDiffered && Object.keys(state.socketToJoueur).length === 0) {
            //     logger.info(`Cleaning up differed state ${stateKey} as last socket disconnected.`);
            //     if (state.timer) clearTimeout(state.timer);
            //     // Maybe save progress?
            //     // delete tournamentState[stateKey]; // Or keep for potential rejoin?
            // }

            // No need to emit participant_left for the tournament room itself usually.
            // Lobby handler might handle participant list updates.
        }
    }
}

module.exports = handleDisconnecting;
